import { useEffect, useMemo, useState } from 'react';
import {
    CalendarDays,
    Plus,
    X,
    Pencil,
    Trash2,
    Save,
    Search,
    Eye,
    MapPin,
    Link as LinkIcon,
    Users,
    Tag,
    Tags,
    ShieldCheck,
    Layers,
    MonitorPlay,
    Download,
    Image as ImageIcon,
} from 'lucide-react';

import {
    actualizarEvento,
    crearEvento,
    eliminarEvento,
    listarCategorias,
    listarEstados,
    listarEventos,
    listarModalidadesEvento,
    listarTiposEvento,
    obtenerEvento,
} from '../api/eventosApi';

import { listarEtiquetas } from '../api/etiquetasApi';

import {
    closeNotify,
    getApiErrorMessage,
    notifyError,
    notifyLoading,
    notifySuccess,
} from '../utils/notify';

import '../styles/modules/eventosCapacitaciones.css';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || '';

const initialForm = {
    titulo: '',
    descripcion: '',
    fecha_inicio: '',
    fecha_fin: '',
    ubicacion: '',
    enlace_virtual: '',
    cupo_maximo: '',
    cupos_ocupados: 0,
    idcategoria: '',
    idestado: '',
    idtipoevento: '',
    idmodalidad: '',
    archivo: null,
    imagenes: [],
    etiquetas: [],
};

const initialPagination = {
    current_page: 1,
    last_page: 1,
    per_page: 10,
    total: 0,
    from: 0,
    to: 0,
};

const MAX_TITULO_LENGTH = 200;
const MAX_UBICACION_LENGTH = 200;
const MAX_URL_LENGTH = 255;
const MAX_SEARCH_LENGTH = 120;
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_IMAGES = 10;

const FILE_MIMES = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
];

const IMAGE_MIMES = ['image/jpeg', 'image/png', 'image/webp'];

const normalizarRespuestaPaginada = (response) => {
    const body = response?.data ?? response;
    const data = body?.data ?? body;

    if (Array.isArray(data)) {
        return {
            items: data,
            pagination: {
                ...initialPagination,
                total: data.length,
                from: data.length > 0 ? 1 : 0,
                to: data.length,
            },
        };
    }

    return {
        items: Array.isArray(data?.data) ? data.data : [],
        pagination: {
            current_page: Number(data?.current_page) || 1,
            last_page: Number(data?.last_page) || 1,
            per_page: Number(data?.per_page) || 10,
            total: Number(data?.total) || 0,
            from: Number(data?.from) || 0,
            to: Number(data?.to) || 0,
        },
    };
};

const normalizarCatalogo = (response) => {
    const body = response?.data ?? response;
    const data = body?.data ?? body;

    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.data)) return data.data;

    return [];
};

const normalizeDateTimeInput = (value) => {
    if (!value) return '';

    const text = String(value);

    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(text)) return text;
    if (text.includes('T')) return text.slice(0, 16);
    if (text.includes(' ')) return text.replace(' ', 'T').slice(0, 16);

    return '';
};

const formatDateTimeForApi = (value) => {
    const normalized = normalizeDateTimeInput(value);
    return normalized ? `${normalized.replace('T', ' ')}:00` : '';
};

const isValidDateTime = (value) => {
    return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(String(value || ''));
};

const isValidUrl = (value) => {
    if (!value) return true;

    try {
        const url = new URL(value);
        return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
        return false;
    }
};

const isImagePath = (path) => {
    return /\.(jpg|jpeg|png|webp)$/i.test(String(path || '').split('?')[0]);
};

const getStorageUrl = (path) => {
    if (!path) return '';

    const value = String(path);

    if (value.startsWith('http://') || value.startsWith('https://')) {
        return value;
    }

    const cleanPath = value
        .replace(/^public\//, '')
        .replace(/^storage\//, '')
        .replace(/^\/storage\//, '')
        .replace(/^\//, '');

    return `${BACKEND_URL}/storage/${cleanPath}`;
};

const getArchivoFromPivot = (pivot) => {
    return pivot?.archivo || pivot?.archivo_evento || pivot;
};

const getGaleriaImagenes = (evento) => {
    const archivos = Array.isArray(evento?.archivos) ? evento.archivos : [];

    return archivos
        .filter((pivot) => {
            const archivo = getArchivoFromPivot(pivot);
            const ruta = archivo?.ruta || pivot?.ruta || '';
            const tipo = String(pivot?.tipo || archivo?.tipo || '').toLowerCase();
            const mime = String(
                archivo?.mime_type || pivot?.mime_type || ''
            ).toLowerCase();

            return tipo === 'imagen' || mime.startsWith('image/') || isImagePath(ruta);
        })
        .sort((a, b) => {
            return (
                Number(b?.es_portada || 0) - Number(a?.es_portada || 0) ||
                Number(a?.orden || 0) - Number(b?.orden || 0)
            );
        });
};

const getEventoImage = (evento) => {
    const galeria = getGaleriaImagenes(evento);
    const portada =
        galeria.find((pivot) => Number(pivot?.es_portada) === 1) || galeria[0];

    const archivoPortada = getArchivoFromPivot(portada);
    const portadaRuta = archivoPortada?.ruta || portada?.ruta || '';

    if (isImagePath(portadaRuta)) return getStorageUrl(portadaRuta);

    const archivoPrincipalRuta =
        evento?.archivo?.ruta ||
        evento?.archivo_principal?.ruta ||
        evento?.archivo_url ||
        '';

    if (isImagePath(archivoPrincipalRuta)) {
        return getStorageUrl(archivoPrincipalRuta);
    }

    return '';
};

const getArchivoUrl = (evento) => {
    const path =
        evento?.archivo?.ruta ||
        evento?.archivo_principal?.ruta ||
        evento?.archivo_url ||
        '';

    return path ? getStorageUrl(path) : '';
};

const getCatalogName = (item) => {
    return item?.nombre || item?.descripcion || item?.titulo || '-';
};

const getTipoEventoNombre = (evento) => {
    return (
        evento?.tipoEvento?.nombre ||
        evento?.tipo_evento?.nombre ||
        evento?.tipo?.nombre ||
        '-'
    );
};

const getOrganizadorNombre = (evento) => {
    return (
        evento?.organizador?.nombre_completo ||
        evento?.usuario_organizador?.nombre_completo ||
        evento?.organizador?.email ||
        evento?.usuario_organizador?.email ||
        '-'
    );
};


const MODULO_EVENTOS_SLUG = 'eventos-capacitaciones';

const ESTADOS_EVENTOS_PERMITIDOS = [
    'programado',
    'realizado',
    'cancelado',
    'publicado',
    'borrador',
];

function normalize(text) {
    return String(text || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '')
        .trim();
}

function filtrarCategoriasEventos(categorias = []) {
    return categorias
        .filter((item) => Number(item?.activo ?? 1) === 1)
        .filter((item) => {
            const moduloSlug = normalize(
                item?.modulo?.slug ||
                item?.modulo_slug ||
                item?.slug_modulo ||
                ''
            );

            if (moduloSlug) {
                return moduloSlug === MODULO_EVENTOS_SLUG;
            }

            const moduloNombre = normalize(
                item?.modulo?.nombre ||
                item?.nombre_modulo ||
                ''
            );

            if (moduloNombre) {
                return (
                    moduloNombre.includes('evento') ||
                    moduloNombre.includes('capacitacion')
                );
            }

            const nombre = normalize(item?.nombre);
            const slug = normalize(item?.slug);

            return [
                'evento',
                'eventos',
                'capacitacion',
                'capacitaciones',
                'taller',
                'talleres',
                'charla',
                'charlas',
                'curso',
                'cursos',
                'seminario',
                'seminarios',
            ].some((key) => nombre.includes(key) || slug.includes(key));
        })
        .sort((a, b) => Number(a.orden || 0) - Number(b.orden || 0));
}

function filtrarEstadosEventos(estados = []) {
    const permitidos = ESTADOS_EVENTOS_PERMITIDOS.map(normalize);

    return estados
        .filter((item) => Number(item?.activo ?? 1) === 1)
        .filter((item) => {
            const slug = normalize(item?.slug);
            const nombre = normalize(item?.nombre);

            return permitidos.some(
                (key) => slug === key || nombre === key
            );
        });
}

export default function EventosCapacitaciones() {
    const [eventos, setEventos] = useState([]);
    const [categorias, setCategorias] = useState([]);
    const [estados, setEstados] = useState([]);
    const [tiposEvento, setTiposEvento] = useState([]);
    const [modalidades, setModalidades] = useState([]);
    const [etiquetas, setEtiquetas] = useState([]);
    const [pagination, setPagination] = useState(initialPagination);

    const [form, setForm] = useState(initialForm);
    const [editingId, setEditingId] = useState(null);
    const [selectedEvento, setSelectedEvento] = useState(null);

    const [showForm, setShowForm] = useState(false);
    const [showDetail, setShowDetail] = useState(false);

    const [loading, setLoading] = useState(true);
    const [loadingCatalogs, setLoadingCatalogs] = useState(false);
    const [saving, setSaving] = useState(false);
    const [loadingDetail, setLoadingDetail] = useState(false);

    const [search, setSearch] = useState('');
    const [categoriaFiltro, setCategoriaFiltro] = useState('');
    const [estadoFiltro, setEstadoFiltro] = useState('');
    const [tipoEventoFiltro, setTipoEventoFiltro] = useState('');
    const [modalidadFiltro, setModalidadFiltro] = useState('');

    const isEditing = useMemo(() => Boolean(editingId), [editingId]);

    const etiquetasSeleccionadas = useMemo(() => {
        return Array.isArray(form.etiquetas)
            ? form.etiquetas.map(Number)
            : [];
    }, [form.etiquetas]);

    const etiquetasActivasSeleccionadas = useMemo(() => {
        return etiquetas.filter((etiqueta) =>
            etiquetasSeleccionadas.includes(Number(etiqueta.idetiqueta))
        );
    }, [etiquetas, etiquetasSeleccionadas]);

    const cargarCatalogos = async () => {
        setLoadingCatalogs(true);

        try {
            const [
                categoriasResponse,
                estadosResponse,
                tiposResponse,
                modalidadesResponse,
                etiquetasResponse,
            ] = await Promise.all([
                listarCategorias({ activo: 1 }),
                listarEstados(),
                listarTiposEvento({ activo: 1 }),
                listarModalidadesEvento({ activo: 1 }),
                listarEtiquetas(),
            ]);

            const categoriasNormalizadas = normalizarCatalogo(categoriasResponse);
            const estadosNormalizados = normalizarCatalogo(estadosResponse);

            setCategorias(filtrarCategoriasEventos(categoriasNormalizadas));
            setEstados(filtrarEstadosEventos(estadosNormalizados));
            setTiposEvento(normalizarCatalogo(tiposResponse));
            setModalidades(normalizarCatalogo(modalidadesResponse));

            const etiquetasNormalizadas = normalizarCatalogo(etiquetasResponse);

            setEtiquetas(
                etiquetasNormalizadas.filter(
                    (item) => Number(item?.activo ?? 1) === 1
                )
            );
        } catch (err) {
            notifyError(
                getApiErrorMessage(
                    err,
                    'No se pudieron cargar los catálogos de eventos.'
                )
            );
        } finally {
            setLoadingCatalogs(false);
        }
    };

    const cargarDatos = async (page = 1) => {
        setLoading(true);

        try {
            const params = {
                page,
                buscar: search.trim() || undefined,
                idcategoria: categoriaFiltro || undefined,
                idestado: estadoFiltro || undefined,
                idtipoevento: tipoEventoFiltro || undefined,
                idmodalidad: modalidadFiltro || undefined,
            };

            Object.keys(params).forEach((key) => {
                if (params[key] === undefined || params[key] === '') {
                    delete params[key];
                }
            });

            const response = await listarEventos(params);
            const { items, pagination: meta } =
                normalizarRespuestaPaginada(response);

            setEventos(items);
            setPagination(meta);
        } catch (err) {
            notifyError(
                getApiErrorMessage(err, 'No se pudieron cargar los eventos.')
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        cargarCatalogos();
        cargarDatos(1);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const resetForm = () => {
        setForm({
            ...initialForm,
            imagenes: [],
            etiquetas: [],
        });

        setEditingId(null);
    };

    const abrirFormularioCrear = () => {
        resetForm();
        setShowForm(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const cerrarFormulario = () => {
        if (saving) return;

        resetForm();
        setShowForm(false);
    };

    const handleChange = (e) => {
        const { name, value, type, files } = e.target;

        if (type === 'file') {
            setForm((current) => ({
                ...current,
                [name]:
                    name === 'imagenes'
                        ? Array.from(files || [])
                        : files?.[0] || null,
            }));

            return;
        }

        if (['cupo_maximo', 'cupos_ocupados'].includes(name)) {
            if (value !== '' && !/^\d+$/.test(value)) return;
        }

        setForm((current) => ({
            ...current,
            [name]: value,
        }));
    };

    const handleToggleEtiqueta = (idetiqueta) => {
        const id = Number(idetiqueta);

        setForm((prev) => {
            const actuales = Array.isArray(prev.etiquetas)
                ? prev.etiquetas.map(Number)
                : [];

            const existe = actuales.includes(id);

            return {
                ...prev,
                etiquetas: existe
                    ? actuales.filter((item) => item !== id)
                    : [...actuales, id],
            };
        });
    };

    const limpiarEtiquetasSeleccionadas = () => {
        setForm((prev) => ({
            ...prev,
            etiquetas: [],
        }));
    };

    const validarFormulario = () => {
        const titulo = form.titulo.trim();
        const ubicacion = form.ubicacion.trim();
        const enlaceVirtual = form.enlace_virtual.trim();
        const cupoMaximo =
            form.cupo_maximo === '' ? null : Number(form.cupo_maximo);
        const cuposOcupados =
            form.cupos_ocupados === '' ? 0 : Number(form.cupos_ocupados);

        if (!titulo) {
            notifyError('El título del evento es obligatorio.');
            return false;
        }

        if (titulo.length > MAX_TITULO_LENGTH) {
            notifyError(
                `El título no debe superar los ${MAX_TITULO_LENGTH} caracteres.`
            );
            return false;
        }

        if (!isValidDateTime(form.fecha_inicio)) {
            notifyError('La fecha de inicio no tiene un formato válido.');
            return false;
        }

        if (!isValidDateTime(form.fecha_fin)) {
            notifyError('La fecha de fin no tiene un formato válido.');
            return false;
        }

        if (new Date(form.fecha_fin) < new Date(form.fecha_inicio)) {
            notifyError(
                'La fecha de fin debe ser igual o posterior a la fecha de inicio.'
            );
            return false;
        }

        if (ubicacion.length > MAX_UBICACION_LENGTH) {
            notifyError(
                `La ubicación no debe superar los ${MAX_UBICACION_LENGTH} caracteres.`
            );
            return false;
        }

        if (enlaceVirtual.length > MAX_URL_LENGTH) {
            notifyError(
                `El enlace virtual no debe superar los ${MAX_URL_LENGTH} caracteres.`
            );
            return false;
        }

        if (!isValidUrl(enlaceVirtual)) {
            notifyError('El enlace virtual debe iniciar con http:// o https://.');
            return false;
        }

        if (!form.idcategoria) {
            notifyError('Debe seleccionar una categoría.');
            return false;
        }

        const categoriaValida = categorias.some(
            (categoria) => Number(categoria.idcategoria) === Number(form.idcategoria)
        );

        if (!categoriaValida) {
            notifyError('Seleccione una categoría válida para eventos y capacitaciones.');
            return false;
        }


        if (!form.idestado) {
            notifyError('Debe seleccionar un estado.');
            return false;
        }

        const estadoValido = estados.some(
            (estado) => Number(estado.idestado) === Number(form.idestado)
        );

        if (!estadoValido) {
            notifyError('Seleccione un estado válido para eventos y capacitaciones.');
            return false;
        }


        if (!form.idtipoevento) {
            notifyError('Debe seleccionar un tipo de evento.');
            return false;
        }

        if (!form.idmodalidad) {
            notifyError('Debe seleccionar una modalidad.');
            return false;
        }

        if (
            cupoMaximo !== null &&
            (Number.isNaN(cupoMaximo) || cupoMaximo < 0 || cupoMaximo > 32767)
        ) {
            notifyError('El cupo máximo debe estar entre 0 y 32767.');
            return false;
        }

        if (Number.isNaN(cuposOcupados) || cuposOcupados < 0) {
            notifyError('Los cupos ocupados deben ser un número mayor o igual a cero.');
            return false;
        }

        if (cupoMaximo !== null && cuposOcupados > cupoMaximo) {
            notifyError('Los cupos ocupados no pueden superar el cupo máximo.');
            return false;
        }

        if (form.archivo) {
            if (!FILE_MIMES.includes(form.archivo.type)) {
                notifyError(
                    'El archivo debe ser imagen, PDF, Word, Excel o PowerPoint.'
                );
                return false;
            }

            if (form.archivo.size > MAX_FILE_SIZE) {
                notifyError('El archivo no debe superar los 10 MB.');
                return false;
            }
        }

        if (form.imagenes.length > MAX_IMAGES) {
            notifyError(`No puedes subir más de ${MAX_IMAGES} imágenes.`);
            return false;
        }

        for (const imagen of form.imagenes) {
            if (!IMAGE_MIMES.includes(imagen.type)) {
                notifyError('Cada imagen de galería debe ser JPG, PNG o WEBP.');
                return false;
            }

            if (imagen.size > MAX_FILE_SIZE) {
                notifyError('Cada imagen de galería no debe superar los 10 MB.');
                return false;
            }
        }

        return true;
    };

    const buildFormData = () => {
        const data = new FormData();

        data.append('titulo', form.titulo.trim());
        data.append('descripcion', form.descripcion.trim());
        data.append('fecha_inicio', formatDateTimeForApi(form.fecha_inicio));
        data.append('fecha_fin', formatDateTimeForApi(form.fecha_fin));
        data.append('ubicacion', form.ubicacion.trim());
        data.append('enlace_virtual', form.enlace_virtual.trim());
        data.append(
            'cupo_maximo',
            form.cupo_maximo === '' ? '' : String(Number(form.cupo_maximo))
        );
        data.append(
            'cupos_ocupados',
            form.cupos_ocupados === ''
                ? '0'
                : String(Number(form.cupos_ocupados))
        );
        data.append('idcategoria', form.idcategoria);
        data.append('idestado', form.idestado);
        data.append('idtipoevento', form.idtipoevento);
        data.append('idmodalidad', form.idmodalidad);

        if (Array.isArray(form.etiquetas)) {
            form.etiquetas
                .map(Number)
                .filter((id) => Number.isFinite(id))
                .forEach((idetiqueta) => {
                    data.append('etiquetas[]', String(idetiqueta));
                });
        }

        if (form.archivo) {
            data.append('archivo', form.archivo);
        }

        form.imagenes.forEach((imagen) => {
            data.append('imagenes[]', imagen);
        });

        return data;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validarFormulario()) return;

        setSaving(true);

        const toastId = notifyLoading(
            isEditing ? 'Actualizando evento...' : 'Registrando evento...'
        );

        try {
            const payload = buildFormData();

            if (isEditing) {
                await actualizarEvento(editingId, payload);
                notifySuccess('Evento actualizado correctamente.');
            } else {
                await crearEvento(payload);
                notifySuccess('Evento registrado correctamente.');
            }

            cerrarFormulario();
            await cargarDatos(pagination.current_page);
        } catch (err) {
            notifyError(
                getApiErrorMessage(err, 'No se pudo guardar el evento.')
            );
        } finally {
            closeNotify(toastId);
            setSaving(false);
        }
    };

    const handleEdit = (evento) => {
        setEditingId(evento.idevento);
        setShowForm(true);

        setForm({
            titulo: evento.titulo || '',
            descripcion: evento.descripcion || '',
            fecha_inicio: normalizeDateTimeInput(evento.fecha_inicio),
            fecha_fin: normalizeDateTimeInput(evento.fecha_fin),
            ubicacion: evento.ubicacion || '',
            enlace_virtual: evento.enlace_virtual || '',
            cupo_maximo: evento.cupo_maximo ?? '',
            cupos_ocupados: evento.cupos_ocupados ?? 0,
            idcategoria: evento.idcategoria ? String(evento.idcategoria) : '',
            idestado: evento.idestado ? String(evento.idestado) : '',
            idtipoevento: evento.idtipoevento
                ? String(evento.idtipoevento)
                : '',
            idmodalidad: evento.idmodalidad ? String(evento.idmodalidad) : '',
            archivo: null,
            imagenes: [],
            etiquetas: Array.isArray(evento.etiquetas)
                ? evento.etiquetas.map((item) => Number(item.idetiqueta))
                : [],
        });

        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = async (evento) => {
        if (!evento.idevento) {
            notifyError('No se encontró el identificador del evento.');
            return;
        }

        const ok = confirm(
            `¿Eliminar el evento "${evento.titulo}"?\n\nEsta acción no se puede deshacer.`
        );

        if (!ok) return;

        const toastId = notifyLoading('Eliminando evento...');

        try {
            await eliminarEvento(evento.idevento);

            notifySuccess('Evento eliminado correctamente.');

            const nextPage =
                eventos.length === 1 && pagination.current_page > 1
                    ? pagination.current_page - 1
                    : pagination.current_page;

            await cargarDatos(nextPage);
        } catch (err) {
            notifyError(
                getApiErrorMessage(err, 'No se pudo eliminar el evento.')
            );
        } finally {
            closeNotify(toastId);
        }
    };

    const handleViewDetail = async (evento) => {
        setShowDetail(true);
        setLoadingDetail(true);
        setSelectedEvento(null);

        try {
            const response = await obtenerEvento(evento.idevento);
            setSelectedEvento(response?.data || evento);
        } catch (err) {
            notifyError(
                getApiErrorMessage(
                    err,
                    'No se pudo obtener el detalle del evento.'
                )
            );
            setShowDetail(false);
        } finally {
            setLoadingDetail(false);
        }
    };

    const cerrarDetalle = () => {
        setShowDetail(false);
        setSelectedEvento(null);
    };

    const handleBuscar = async (e) => {
        e.preventDefault();

        if (search.trim().length > MAX_SEARCH_LENGTH) {
            notifyError(
                `La búsqueda no debe superar los ${MAX_SEARCH_LENGTH} caracteres.`
            );
            return;
        }

        await cargarDatos(1);
    };

    const handleLimpiarFiltros = async () => {
        setSearch('');
        setCategoriaFiltro('');
        setEstadoFiltro('');
        setTipoEventoFiltro('');
        setModalidadFiltro('');

        setTimeout(() => {
            cargarDatos(1);
        }, 0);
    };

    const handlePageChange = async (page) => {
        if (
            page < 1 ||
            page > pagination.last_page ||
            page === pagination.current_page ||
            loading
        ) {
            return;
        }

        await cargarDatos(page);
    };

    const visiblePages = useMemo(() => {
        const pages = [];
        const start = Math.max(1, pagination.current_page - 2);
        const end = Math.min(
            pagination.last_page,
            pagination.current_page + 2
        );

        for (let page = start; page <= end; page += 1) {
            pages.push(page);
        }

        return pages;
    }, [pagination]);

    return (
        <section className="eventos-page">
            <div className="eventos-header">
                <div>
                    <span className="eventos-eyebrow">
                        Gestión académica y tecnológica
                    </span>
                    <h1>Eventos y capacitaciones</h1>
                    <p>
                        Administra talleres, capacitaciones, charlas y eventos tecnológicos
                        con fechas, modalidad, cupos, estado, categoría, etiquetas, archivo
                        principal y galería de imágenes.
                    </p>
                </div>

                {!showForm && (
                    <button
                        type="button"
                        className="eventos-add-button"
                        onClick={abrirFormularioCrear}
                        disabled={loading || loadingCatalogs}
                    >
                        <Plus size={18} />
                        Agregar evento
                    </button>
                )}
            </div>

            {showForm && (
                <div className="eventos-form-card">
                    <div className="eventos-form-header">
                        <div>
                            <h2>{isEditing ? 'Editar evento' : 'Agregar evento'}</h2>
                            <p>
                                El archivo principal puede ser material descargable. La galería
                                usa el campo imagenes[] y la primera imagen será portada.
                            </p>
                        </div>

                        <button
                            type="button"
                            className="eventos-close-button"
                            onClick={cerrarFormulario}
                            disabled={saving}
                        >
                            <X size={18} />
                        </button>
                    </div>

                    <form className="eventos-form" onSubmit={handleSubmit}>
                        <div className="eventos-form-grid">
                            <div className="eventos-field span-2">
                                <label>Título</label>
                                <input
                                    name="titulo"
                                    value={form.titulo}
                                    onChange={handleChange}
                                    maxLength={MAX_TITULO_LENGTH}
                                    placeholder="Ej. Capacitación en uso de plataformas institucionales"
                                    required
                                    disabled={saving}
                                />
                            </div>

                            <div className="eventos-field">
                                <label>Fecha inicio</label>
                                <input
                                    type="datetime-local"
                                    name="fecha_inicio"
                                    value={form.fecha_inicio}
                                    onChange={handleChange}
                                    required
                                    disabled={saving}
                                />
                            </div>

                            <div className="eventos-field">
                                <label>Fecha fin</label>
                                <input
                                    type="datetime-local"
                                    name="fecha_fin"
                                    value={form.fecha_fin}
                                    onChange={handleChange}
                                    min={form.fecha_inicio || undefined}
                                    required
                                    disabled={saving}
                                />
                            </div>

                            <SelectField
                                label="Categoría"
                                name="idcategoria"
                                value={form.idcategoria}
                                onChange={handleChange}
                                disabled={saving || loadingCatalogs}
                                items={categorias}
                                idKey="idcategoria"
                            />

                            <SelectField
                                label="Estado"
                                name="idestado"
                                value={form.idestado}
                                onChange={handleChange}
                                disabled={saving || loadingCatalogs}
                                items={estados}
                                idKey="idestado"
                            />

                            <SelectField
                                label="Tipo de evento"
                                name="idtipoevento"
                                value={form.idtipoevento}
                                onChange={handleChange}
                                disabled={saving || loadingCatalogs}
                                items={tiposEvento}
                                idKey="idtipoevento"
                            />

                            <SelectField
                                label="Modalidad"
                                name="idmodalidad"
                                value={form.idmodalidad}
                                onChange={handleChange}
                                disabled={saving || loadingCatalogs}
                                items={modalidades}
                                idKey="idmodalidad"
                            />

                            <div className="eventos-field span-2">
                                <div className="eventos-etiquetas-header">
                                    <label>Etiquetas</label>

                                    <div className="eventos-etiquetas-actions">
                                        <span>
                                            {etiquetasSeleccionadas.length} seleccionada
                                            {etiquetasSeleccionadas.length === 1 ? '' : 's'}
                                        </span>

                                        {etiquetasSeleccionadas.length > 0 && (
                                            <button
                                                type="button"
                                                onClick={limpiarEtiquetasSeleccionadas}
                                                disabled={saving}
                                            >
                                                Limpiar
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {etiquetasActivasSeleccionadas.length > 0 && (
                                    <div className="eventos-etiquetas-selected">
                                        <strong>Seleccionadas:</strong>

                                        <div className="eventos-etiquetas-selected-list">
                                            {etiquetasActivasSeleccionadas.map((etiqueta) => (
                                                <button
                                                    type="button"
                                                    key={etiqueta.idetiqueta}
                                                    className="eventos-etiqueta-selected"
                                                    onClick={() =>
                                                        handleToggleEtiqueta(etiqueta.idetiqueta)
                                                    }
                                                    style={{
                                                        '--etiqueta-color':
                                                            etiqueta.color || '#2563eb',
                                                    }}
                                                    disabled={saving}
                                                >
                                                    <span>{etiqueta.nombre}</span>
                                                    <X size={13} />
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {etiquetas.length === 0 ? (
                                    <small className="eventos-help-text">
                                        No hay etiquetas activas registradas.
                                    </small>
                                ) : (
                                    <div className="eventos-etiquetas-selector">
                                        {etiquetas.map((etiqueta) => {
                                            const activa = etiquetasSeleccionadas.includes(
                                                Number(etiqueta.idetiqueta)
                                            );

                                            return (
                                                <button
                                                    type="button"
                                                    key={etiqueta.idetiqueta}
                                                    className={`eventos-etiqueta-chip ${
                                                        activa ? 'is-active' : ''
                                                    }`}
                                                    onClick={() =>
                                                        handleToggleEtiqueta(etiqueta.idetiqueta)
                                                    }
                                                    style={{
                                                        '--etiqueta-color':
                                                            etiqueta.color || '#2563eb',
                                                    }}
                                                    disabled={saving}
                                                >
                                                    <Tags size={13} />
                                                    <span>{etiqueta.nombre}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}

                                <small className="eventos-help-text">
                                    Usa etiquetas para relacionar este evento con capacitación,
                                    seguridad informática, soporte, sistema académico,
                                    transformación digital u otros temas del portal.
                                </small>
                            </div>

                            <div className="eventos-field">
                                <label>Ubicación</label>
                                <input
                                    name="ubicacion"
                                    value={form.ubicacion}
                                    onChange={handleChange}
                                    maxLength={MAX_UBICACION_LENGTH}
                                    placeholder="Auditorio, laboratorio, campus..."
                                    disabled={saving}
                                />
                            </div>

                            <div className="eventos-field">
                                <label>Enlace virtual</label>
                                <input
                                    name="enlace_virtual"
                                    value={form.enlace_virtual}
                                    onChange={handleChange}
                                    maxLength={MAX_URL_LENGTH}
                                    placeholder="https://..."
                                    disabled={saving}
                                />
                            </div>

                            <div className="eventos-field">
                                <label>Cupo máximo</label>
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    name="cupo_maximo"
                                    value={form.cupo_maximo}
                                    onChange={handleChange}
                                    placeholder="Ej. 100"
                                    disabled={saving}
                                />
                            </div>

                            <div className="eventos-field">
                                <label>Cupos ocupados</label>
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    name="cupos_ocupados"
                                    value={form.cupos_ocupados}
                                    onChange={handleChange}
                                    placeholder="0"
                                    disabled={saving}
                                />
                            </div>

                            <div className="eventos-field">
                                <label>Archivo principal</label>
                                <input
                                    type="file"
                                    name="archivo"
                                    accept=".jpg,.jpeg,.png,.webp,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
                                    onChange={handleChange}
                                    disabled={saving}
                                />
                                <small>
                                    Imagen, PDF, Word, Excel o PowerPoint. Máximo 10 MB.
                                </small>
                            </div>

                            <div className="eventos-field">
                                <label>Galería / carrusel de imágenes</label>
                                <input
                                    type="file"
                                    name="imagenes"
                                    accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                                    multiple
                                    onChange={handleChange}
                                    disabled={saving}
                                />
                                <small>
                                    JPG, PNG o WEBP. Máximo 10 imágenes. Si editas y seleccionas
                                    nuevas imágenes, se reemplaza la galería anterior.
                                </small>

                                {form.imagenes.length > 0 && (
                                    <small>
                                        {form.imagenes.length} imagen(es) seleccionada(s).
                                    </small>
                                )}
                            </div>

                            <div className="eventos-field span-2">
                                <label>Descripción</label>
                                <textarea
                                    name="descripcion"
                                    value={form.descripcion}
                                    onChange={handleChange}
                                    rows={6}
                                    placeholder="Describe el evento, objetivos, público objetivo y detalles importantes."
                                    disabled={saving}
                                />
                            </div>
                        </div>

                        <div className="eventos-form-actions">
                            <button
                                type="submit"
                                className="eventos-save-button"
                                disabled={saving || loadingCatalogs}
                            >
                                <Save size={18} />
                                {saving
                                    ? 'Guardando...'
                                    : isEditing
                                        ? 'Actualizar evento'
                                        : 'Guardar evento'}
                            </button>

                            <button
                                type="button"
                                className="eventos-cancel-button"
                                onClick={cerrarFormulario}
                                disabled={saving}
                            >
                                Cancelar
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <form className="eventos-filters" onSubmit={handleBuscar}>
                <div className="eventos-search-box">
                    <Search size={18} />
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        maxLength={MAX_SEARCH_LENGTH}
                        placeholder="Buscar por título, descripción o ubicación..."
                    />
                </div>

                <select
                    value={categoriaFiltro}
                    onChange={(e) => setCategoriaFiltro(e.target.value)}
                >
                    <option value="">Todas las categorías</option>
                    {categorias.map((categoria) => (
                        <option
                            key={categoria.idcategoria}
                            value={categoria.idcategoria}
                        >
                            {getCatalogName(categoria)}
                        </option>
                    ))}
                </select>

                <select
                    value={estadoFiltro}
                    onChange={(e) => setEstadoFiltro(e.target.value)}
                >
                    <option value="">Todos los estados</option>
                    {estados.map((estado) => (
                        <option key={estado.idestado} value={estado.idestado}>
                            {getCatalogName(estado)}
                        </option>
                    ))}
                </select>

                <select
                    value={tipoEventoFiltro}
                    onChange={(e) => setTipoEventoFiltro(e.target.value)}
                >
                    <option value="">Todos los tipos</option>
                    {tiposEvento.map((tipo) => (
                        <option key={tipo.idtipoevento} value={tipo.idtipoevento}>
                            {getCatalogName(tipo)}
                        </option>
                    ))}
                </select>

                <select
                    value={modalidadFiltro}
                    onChange={(e) => setModalidadFiltro(e.target.value)}
                >
                    <option value="">Todas las modalidades</option>
                    {modalidades.map((modalidad) => (
                        <option
                            key={modalidad.idmodalidad}
                            value={modalidad.idmodalidad}
                        >
                            {getCatalogName(modalidad)}
                        </option>
                    ))}
                </select>

                <button type="submit" disabled={loading}>
                    Filtrar
                </button>

                <button
                    type="button"
                    onClick={handleLimpiarFiltros}
                    disabled={loading}
                >
                    Limpiar
                </button>
            </form>

            <div className="eventos-summary">
                <SummaryItem
                    icon={<CalendarDays size={18} />}
                    label="Eventos"
                    value={pagination.total}
                />

                <SummaryItem
                    icon={<Layers size={18} />}
                    label="Página"
                    value={`${pagination.current_page}/${pagination.last_page}`}
                />

                <SummaryItem
                    icon={<ImageIcon size={18} />}
                    label="Galería"
                    value="imagenes[]"
                />

                <SummaryItem
                    icon={<ShieldCheck size={18} />}
                    label="Catálogos"
                    value={loadingCatalogs ? 'Cargando' : 'Listos'}
                />
            </div>

            <div className="eventos-table-card">
                <div className="eventos-table-header">
                    <div>
                        <h2>Listado de eventos</h2>
                        <p>
                            {pagination.from || 0} - {pagination.to || 0} de{' '}
                            {pagination.total || 0} registros
                        </p>
                    </div>
                </div>

                {loading ? (
                    <p className="eventos-empty">Cargando eventos...</p>
                ) : eventos.length === 0 ? (
                    <p className="eventos-empty">
                        No se encontraron eventos con los filtros aplicados.
                    </p>
                ) : (
                    <div className="eventos-grid-list">
                        {eventos.map((evento) => (
                            <article className="eventos-card" key={evento.idevento}>
                                <div className="eventos-card-image">
                                    {getEventoImage(evento) ? (
                                        <img
                                            src={getEventoImage(evento)}
                                            alt={evento.titulo || 'Evento'}
                                            loading="lazy"
                                        />
                                    ) : (
                                        <span>
                                            <CalendarDays size={28} />
                                        </span>
                                    )}
                                </div>

                                <div className="eventos-card-body">
                                    <div className="eventos-card-meta">
                                        <span>
                                            <Tag size={14} />{' '}
                                            {evento.categoria?.nombre || 'Sin categoría'}
                                        </span>

                                        <span>
                                            <ShieldCheck size={14} />{' '}
                                            {evento.estado?.nombre || 'Sin estado'}
                                        </span>
                                    </div>

                                    <h3>{evento.titulo}</h3>

                                    <EtiquetasEvento etiquetas={evento.etiquetas} />

                                    <p>{recortarTexto(evento.descripcion)}</p>

                                    <div className="eventos-card-info">
                                        <span>
                                            <CalendarDays size={14} />{' '}
                                            {formatDateTimeSimple(evento.fecha_inicio)}
                                        </span>

                                        <span>
                                            <MonitorPlay size={14} />{' '}
                                            {getTipoEventoNombre(evento)}
                                        </span>

                                        <span>
                                            <Layers size={14} />{' '}
                                            {evento.modalidad?.nombre || '-'}
                                        </span>

                                        <span>
                                            <Users size={14} />{' '}
                                            {evento.cupo_maximo
                                                ? `${evento.cupos_ocupados ?? 0}/${evento.cupo_maximo}`
                                                : `${evento.cupos_ocupados ?? 0}`}
                                        </span>

                                        {evento.ubicacion && (
                                            <span>
                                                <MapPin size={14} /> {evento.ubicacion}
                                            </span>
                                        )}

                                        {Number(evento.archivos_count || 0) > 0 && (
                                            <span>
                                                <ImageIcon size={14} />{' '}
                                                {evento.archivos_count} recurso(s)
                                            </span>
                                        )}
                                    </div>

                                    <div className="eventos-card-actions">
                                        <button
                                            type="button"
                                            onClick={() => handleViewDetail(evento)}
                                            title="Ver detalle"
                                        >
                                            <Eye size={16} />
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => handleEdit(evento)}
                                            title="Editar"
                                        >
                                            <Pencil size={16} />
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => handleDelete(evento)}
                                            title="Eliminar"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            </article>
                        ))}
                    </div>
                )}

                <div className="eventos-pagination">
                    <button
                        type="button"
                        onClick={() =>
                            handlePageChange(pagination.current_page - 1)
                        }
                        disabled={loading || pagination.current_page <= 1}
                    >
                        Anterior
                    </button>

                    {visiblePages.map((page) => (
                        <button
                            key={page}
                            type="button"
                            onClick={() => handlePageChange(page)}
                            className={
                                page === pagination.current_page ? 'active' : ''
                            }
                            disabled={loading}
                        >
                            {page}
                        </button>
                    ))}

                    <button
                        type="button"
                        onClick={() =>
                            handlePageChange(pagination.current_page + 1)
                        }
                        disabled={
                            loading ||
                            pagination.current_page >= pagination.last_page
                        }
                    >
                        Siguiente
                    </button>
                </div>
            </div>

            {showDetail && (
                <EventoDetailModal
                    evento={selectedEvento}
                    loading={loadingDetail}
                    onClose={cerrarDetalle}
                />
            )}
        </section>
    );
}

function EtiquetasEvento({ etiquetas = [] }) {
    if (!Array.isArray(etiquetas) || etiquetas.length === 0) {
        return null;
    }

    return (
        <div className="eventos-etiquetas-list">
            {etiquetas.map((etiqueta) => (
                <span
                    key={etiqueta.idetiqueta}
                    className="eventos-etiqueta-badge"
                    style={{
                        '--etiqueta-color': etiqueta.color || '#2563eb',
                    }}
                >
                    {etiqueta.nombre}
                </span>
            ))}
        </div>
    );
}

function SelectField({ label, name, value, onChange, disabled, items, idKey }) {
    return (
        <div className="eventos-field">
            <label>{label}</label>

            <select
                name={name}
                value={value}
                onChange={onChange}
                required
                disabled={disabled}
            >
                <option value="">Seleccione una opción</option>

                {items.map((item) => (
                    <option key={item[idKey]} value={item[idKey]}>
                        {getCatalogName(item)}
                    </option>
                ))}
            </select>
        </div>
    );
}

function SummaryItem({ icon, label, value }) {
    return (
        <div className="eventos-summary-item">
            {icon}
            <span>{label}</span>
            <strong>{value}</strong>
        </div>
    );
}

function EventoDetailModal({ evento, loading, onClose }) {
    const galeria = getGaleriaImagenes(evento);

    return (
        <div className="eventos-modal-overlay" role="dialog" aria-modal="true">
            <div className="eventos-modal">
                <div className="eventos-modal-header">
                    <div>
                        <span className="eventos-eyebrow">
                            Detalle del evento
                        </span>
                        <h2>
                            {loading
                                ? 'Cargando detalle...'
                                : evento?.titulo || 'Detalle'}
                        </h2>
                    </div>

                    <button
                        type="button"
                        className="eventos-close-button"
                        onClick={onClose}
                    >
                        <X size={18} />
                    </button>
                </div>

                {loading ? (
                    <p className="eventos-empty">Cargando detalle...</p>
                ) : evento ? (
                    <div className="eventos-detail">
                        {getEventoImage(evento) && (
                            <img
                                src={getEventoImage(evento)}
                                alt={evento.titulo}
                                className="eventos-detail-image"
                            />
                        )}

                        <div className="eventos-detail-grid">
                            <DetailItem
                                label="Categoría"
                                value={evento.categoria?.nombre || '-'}
                            />

                            <DetailItem
                                label="Tipo"
                                value={getTipoEventoNombre(evento)}
                            />

                            <DetailItem
                                label="Modalidad"
                                value={evento.modalidad?.nombre || '-'}
                            />

                            <DetailItem
                                label="Estado"
                                value={evento.estado?.nombre || '-'}
                            />

                            <DetailItem
                                label="Inicio"
                                value={formatDateTimeSimple(evento.fecha_inicio)}
                            />

                            <DetailItem
                                label="Fin"
                                value={formatDateTimeSimple(evento.fecha_fin)}
                            />

                            <DetailItem
                                label="Ubicación"
                                value={evento.ubicacion || '-'}
                            />

                            <DetailItem
                                label="Cupos"
                                value={
                                    evento.cupo_maximo
                                        ? `${evento.cupos_ocupados ?? 0}/${evento.cupo_maximo}`
                                        : `${evento.cupos_ocupados ?? 0}`
                                }
                            />

                            <DetailItem
                                label="Organizador"
                                value={getOrganizadorNombre(evento)}
                            />

                            <div>
                                <span>Enlace virtual</span>
                                {evento.enlace_virtual ? (
                                    <a
                                        href={evento.enlace_virtual}
                                        target="_blank"
                                        rel="noreferrer"
                                    >
                                        Abrir enlace
                                    </a>
                                ) : (
                                    <strong>-</strong>
                                )}
                            </div>
                        </div>

                        <div className="eventos-detail-content">
                            <h3>Etiquetas</h3>

                            <EtiquetasEvento etiquetas={evento.etiquetas} />

                            {(!Array.isArray(evento.etiquetas) ||
                                evento.etiquetas.length === 0) && (
                                <p>Sin etiquetas registradas.</p>
                            )}
                        </div>

                        <div className="eventos-detail-content">
                            <h3>Descripción</h3>
                            <p>{evento.descripcion || 'Sin descripción.'}</p>
                        </div>

                        {galeria.length > 0 && (
                            <EventoGalleryCarousel
                                galeria={galeria}
                                titulo={evento.titulo}
                            />
                        )}

                        <div className="eventos-detail-links">
                            {evento.enlace_virtual && (
                                <a
                                    href={evento.enlace_virtual}
                                    target="_blank"
                                    rel="noreferrer"
                                >
                                    <LinkIcon size={16} />
                                    Enlace virtual
                                </a>
                            )}

                            {getArchivoUrl(evento) && (
                                <a
                                    href={getArchivoUrl(evento)}
                                    target="_blank"
                                    rel="noreferrer"
                                >
                                    <Download size={16} />
                                    Ver archivo principal
                                </a>
                            )}

                            {galeria.length > 0 && (
                                <a
                                    href={getStorageUrl(
                                        getArchivoFromPivot(galeria[0])?.ruta ||
                                        galeria[0]?.ruta
                                    )}
                                    target="_blank"
                                    rel="noreferrer"
                                >
                                    <ImageIcon size={16} />
                                    Ver portada
                                </a>
                            )}
                        </div>
                    </div>
                ) : (
                    <p className="eventos-empty">No se pudo cargar el detalle.</p>
                )}
            </div>
        </div>
    );
}

function EventoGalleryCarousel({ galeria, titulo }) {
    const [activeIndex, setActiveIndex] = useState(0);

    if (!galeria || galeria.length === 0) return null;

    const images = galeria
        .map((pivot, index) => {
            const archivo = getArchivoFromPivot(pivot);
            const ruta = archivo?.ruta || pivot?.ruta || '';
            const url = getStorageUrl(ruta);

            return {
                key:
                    pivot?.ideventoarchivo ||
                    archivo?.idarchivo ||
                    `${ruta}-${index}`,
                url,
                alt: pivot?.titulo || titulo || `Imagen ${index + 1}`,
            };
        })
        .filter((image) => image.url);

    if (images.length === 0) return null;

    const activeImage = images[activeIndex] || images[0];
    const hasMultiple = images.length > 1;

    const goToPrevious = () => {
        setActiveIndex((current) =>
            current === 0 ? images.length - 1 : current - 1
        );
    };

    const goToNext = () => {
        setActiveIndex((current) =>
            current === images.length - 1 ? 0 : current + 1
        );
    };

    return (
        <div className="eventos-detail-content eventos-carousel-section">
            <div className="eventos-carousel-title-row">
                <div>
                    <h3>Galería de imágenes</h3>
                    <p>{images.length} imagen(es) registradas para este evento.</p>
                </div>

                {hasMultiple && (
                    <div className="eventos-carousel-counter">
                        {activeIndex + 1} / {images.length}
                    </div>
                )}
            </div>

            <div className="eventos-carousel">
                {hasMultiple && (
                    <button
                        type="button"
                        className="eventos-carousel-control prev"
                        onClick={goToPrevious}
                        aria-label="Imagen anterior"
                    >
                        ‹
                    </button>
                )}

                <a
                    href={activeImage.url}
                    target="_blank"
                    rel="noreferrer"
                    className="eventos-carousel-main"
                >
                    <img
                        src={activeImage.url}
                        alt={activeImage.alt}
                        loading="lazy"
                    />
                </a>

                {hasMultiple && (
                    <button
                        type="button"
                        className="eventos-carousel-control next"
                        onClick={goToNext}
                        aria-label="Imagen siguiente"
                    >
                        ›
                    </button>
                )}
            </div>

            {hasMultiple && (
                <div className="eventos-carousel-thumbs">
                    {images.map((image, index) => (
                        <button
                            type="button"
                            key={image.key}
                            className={index === activeIndex ? 'active' : ''}
                            onClick={() => setActiveIndex(index)}
                            aria-label={`Ver imagen ${index + 1}`}
                        >
                            <img
                                src={image.url}
                                alt={image.alt}
                                loading="lazy"
                            />
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

function DetailItem({ label, value }) {
    return (
        <div>
            <span>{label}</span>
            <strong>{value}</strong>
        </div>
    );
}

function recortarTexto(value, max = 90) {
    const text = String(value || '').trim();

    if (!text) return 'Sin descripción registrada.';

    return text.length <= max ? text : `${text.slice(0, max)}...`;
}

function formatDateTimeSimple(value) {
    if (!value) return '-';

    const date = new Date(String(value).replace(' ', 'T'));

    if (Number.isNaN(date.getTime())) {
        return '-';
    }

    return date.toLocaleString('es-PE', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
    });
}