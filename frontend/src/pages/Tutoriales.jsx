import { useEffect, useMemo, useState } from 'react';
import DOMPurify from 'dompurify';
import {
    BookOpen,
    Plus,
    X,
    Pencil,
    Trash2,
    Save,
    Search,
    Eye,
    Download,
    Tag,
    Tags,
    ShieldCheck,
    Layers,
    PlayCircle,
    FileText,
    Clock,
    BarChart3,
} from 'lucide-react';

import {
    actualizarTutorial,
    crearTutorial,
    eliminarTutorial,
    listarCategorias,
    listarEstados,
    listarTiposTutorial,
    listarTutoriales,
    obtenerTutorial,
} from '../api/tutorialesApi';

import {
    listarEtiquetas,
} from '../api/etiquetasApi';

import {
    closeNotify,
    getApiErrorMessage,
    notifyError,
    notifyLoading,
    notifySuccess,
} from '../utils/notify';

import '../styles/modules/tutoriales.css';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://127.0.0.1:8000';

const initialForm = {
    titulo: '',
    descripcion: '',
    contenido_html: '',
    enlace_video: '',
    duracion_minutos: '',
    visitas: 0,
    orden: 0,
    idcategoria: '',
    idestado: '',
    idtipotutorial: '',
    archivo: null,
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
const MAX_URL_LENGTH = 255;
const MAX_SEARCH_LENGTH = 120;
const MAX_ORDEN = 255;
const MAX_DURACION = 10000;
const MAX_FILE_SIZE = 100 * 1024 * 1024;

const FILE_MIMES = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'video/mp4',
    'video/webm',
    'video/quicktime',
];

const normalizarRespuestaPaginada = (response) => {
    const data = response?.data;

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
    const data = response?.data;

    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.data)) return data.data;

    return [];
};

const isPositiveOrZeroInteger = (value) => {
    if (value === '' || value === null || value === undefined) return true;
    return /^\d+$/.test(String(value));
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

const getArchivo = (tutorial) => {
    return tutorial?.archivo || tutorial?.archivo_tutorial || null;
};

const getStorageUrl = (path) => {
    if (!path) return '#';

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

const getArchivoUrl = (tutorial) => {
    const archivo = getArchivo(tutorial);

    if (archivo?.ruta) return getStorageUrl(archivo.ruta);
    if (tutorial?.archivo_url) return getStorageUrl(tutorial.archivo_url);
    if (tutorial?.ruta) return getStorageUrl(tutorial.ruta);

    return '#';
};

const getArchivoNombre = (tutorial) => {
    const archivo = getArchivo(tutorial);

    return archivo?.nombre_original || archivo?.nombre_guardado || 'Archivo';
};

const getArchivoExtension = (tutorial) => {
    const archivo = getArchivo(tutorial);

    if (archivo?.extension) return archivo.extension.toUpperCase();

    const nombre = getArchivoNombre(tutorial);
    const partes = nombre.split('.');

    return partes.length > 1 ? partes.pop().toUpperCase() : '-';
};


const MODULO_TUTORIALES_SLUG = 'tutoriales-recursos';

const ESTADOS_TUTORIALES_PERMITIDOS = [
    'borrador',
    'publicado',
    'archivado',
];

function normalize(text) {
    return String(text || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '')
        .trim();
}

function filtrarCategoriasTutoriales(categorias = []) {
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
                return moduloSlug === MODULO_TUTORIALES_SLUG;
            }

            const moduloNombre = normalize(
                item?.modulo?.nombre ||
                item?.nombre_modulo ||
                ''
            );

            if (moduloNombre) {
                return (
                    moduloNombre.includes('tutorial') ||
                    moduloNombre.includes('recurso')
                );
            }

            const nombre = normalize(item?.nombre);
            const slug = normalize(item?.slug);

            return [
                'tutorial',
                'tutoriales',
                'recurso',
                'recursos',
                'guia',
                'guía',
                'guias',
                'guías',
                'video',
                'videos',
                'manual',
                'manuales',
                'paso',
                'ayuda',
                'capacitacion',
                'capacitaciones',
            ].some((key) => nombre.includes(normalize(key)) || slug.includes(normalize(key)));
        })
        .sort((a, b) => Number(a.orden || 0) - Number(b.orden || 0));
}

function filtrarEstadosTutoriales(estados = []) {
    const permitidos = ESTADOS_TUTORIALES_PERMITIDOS.map(normalize);

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


export default function Tutoriales() {
    const [tutoriales, setTutoriales] = useState([]);
    const [categorias, setCategorias] = useState([]);
    const [estados, setEstados] = useState([]);
    const [tiposTutorial, setTiposTutorial] = useState([]);
    const [etiquetas, setEtiquetas] = useState([]);
    const [pagination, setPagination] = useState(initialPagination);

    const [form, setForm] = useState(initialForm);
    const [editingId, setEditingId] = useState(null);
    const [editingHasArchivo, setEditingHasArchivo] = useState(false);
    const [selectedTutorial, setSelectedTutorial] = useState(null);

    const [showForm, setShowForm] = useState(false);
    const [showDetail, setShowDetail] = useState(false);

    const [loading, setLoading] = useState(true);
    const [loadingCatalogs, setLoadingCatalogs] = useState(false);
    const [saving, setSaving] = useState(false);
    const [loadingDetail, setLoadingDetail] = useState(false);

    const [search, setSearch] = useState('');
    const [categoriaFiltro, setCategoriaFiltro] = useState('');
    const [estadoFiltro, setEstadoFiltro] = useState('');
    const [tipoTutorialFiltro, setTipoTutorialFiltro] = useState('');

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
                categoriasResult,
                estadosResult,
                tiposResult,
                etiquetasResult,
            ] = await Promise.allSettled([
                listarCategorias({ activo: 1 }),
                listarEstados(),
                listarTiposTutorial({ activo: 1 }),
                listarEtiquetas(),
            ]);

            if (categoriasResult.status === 'fulfilled') {
                const categoriasNormalizadas = normalizarCatalogo(categoriasResult.value);

                setCategorias(filtrarCategoriasTutoriales(categoriasNormalizadas));
            } else {
                console.error('Error al cargar categorías:', categoriasResult.reason);
                notifyError('No se pudieron cargar las categorías.');
            }

            if (estadosResult.status === 'fulfilled') {
                const estadosNormalizados = normalizarCatalogo(estadosResult.value);

                setEstados(filtrarEstadosTutoriales(estadosNormalizados));
            } else {
                console.error('Error al cargar estados:', estadosResult.reason);
                notifyError('No se pudieron cargar los estados.');
            }

            if (tiposResult.status === 'fulfilled') {
                setTiposTutorial(normalizarCatalogo(tiposResult.value));
            } else {
                console.error('Error al cargar tipos de tutorial:', tiposResult.reason);
                notifyError('No se pudieron cargar los tipos de tutorial.');
            }

            if (etiquetasResult.status === 'fulfilled') {
                const etiquetasNormalizadas = normalizarCatalogo(etiquetasResult.value);

                setEtiquetas(
                    etiquetasNormalizadas.filter(
                        (item) => Number(item?.activo ?? 1) === 1
                    )
                );
            } else {
                console.error('Error al cargar etiquetas:', etiquetasResult.reason);
                notifyError('No se pudieron cargar las etiquetas.');
            }
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
                idtipotutorial: tipoTutorialFiltro || undefined,
            };

            Object.keys(params).forEach((key) => {
                if (params[key] === undefined || params[key] === '') {
                    delete params[key];
                }
            });

            const response = await listarTutoriales(params);
            const { items, pagination: meta } = normalizarRespuestaPaginada(response);

            setTutoriales(items);
            setPagination(meta);
        } catch (err) {
            notifyError(
                getApiErrorMessage(err, 'No se pudieron cargar los tutoriales.')
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
        setForm(initialForm);
        setEditingId(null);
        setEditingHasArchivo(false);
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
            setForm({
                ...form,
                [name]: files?.[0] || null,
            });

            return;
        }

        if (['duracion_minutos', 'visitas', 'orden'].includes(name)) {
            if (value !== '' && !/^\d+$/.test(value)) return;

            if (name === 'orden' && Number(value) > MAX_ORDEN) return;
            if (name === 'duracion_minutos' && Number(value) > MAX_DURACION) return;

            setForm({
                ...form,
                [name]: value,
            });

            return;
        }

        setForm({
            ...form,
            [name]: value,
        });
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

    const handleSearchChange = (e) => {
        const value = e.target.value;

        if (value.length > MAX_SEARCH_LENGTH) return;

        setSearch(value);
    };

    const validarFormulario = () => {
        const titulo = form.titulo.trim();
        const descripcion = form.descripcion.trim();
        const contenidoHtml = form.contenido_html.trim();
        const enlaceVideo = form.enlace_video.trim();

        const duracion = form.duracion_minutos === '' ? 0 : Number(form.duracion_minutos);
        const visitas = form.visitas === '' ? 0 : Number(form.visitas);
        const orden = form.orden === '' ? 0 : Number(form.orden);

        if (!titulo) {
            notifyError('El título del tutorial es obligatorio.');
            return false;
        }

        if (titulo.length > MAX_TITULO_LENGTH) {
            notifyError(`El título no debe superar los ${MAX_TITULO_LENGTH} caracteres.`);
            return false;
        }

        if (!contenidoHtml && !enlaceVideo && !form.archivo && !editingHasArchivo) {
            notifyError('Debe registrar contenido HTML, enlace de video o subir un archivo.');
            return false;
        }

        if (enlaceVideo.length > MAX_URL_LENGTH) {
            notifyError(`El enlace de video no debe superar los ${MAX_URL_LENGTH} caracteres.`);
            return false;
        }

        if (!isValidUrl(enlaceVideo)) {
            notifyError('El enlace de video debe iniciar con http:// o https://.');
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
            notifyError('Seleccione una categoría válida para tutoriales y recursos.');
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
            notifyError('Seleccione un estado válido para tutoriales y recursos.');
            return false;
        }

        if (!form.idtipotutorial) {
            notifyError('Debe seleccionar un tipo de tutorial.');
            return false;
        }

        if (!isPositiveOrZeroInteger(form.duracion_minutos)) {
            notifyError('La duración debe ser un número entero no negativo.');
            return false;
        }

        if (!isPositiveOrZeroInteger(form.visitas)) {
            notifyError('Las visitas deben ser un número entero no negativo.');
            return false;
        }

        if (!isPositiveOrZeroInteger(form.orden)) {
            notifyError('El orden debe ser un número entero entre 0 y 255.');
            return false;
        }

        if (
            Number.isNaN(duracion) ||
            duracion < 0 ||
            duracion > MAX_DURACION
        ) {
            notifyError('La duración debe estar en un rango válido.');
            return false;
        }

        if (Number.isNaN(visitas) || visitas < 0) {
            notifyError('Las visitas deben ser un número mayor o igual a cero.');
            return false;
        }

        if (Number.isNaN(orden) || orden < 0 || orden > MAX_ORDEN) {
            notifyError('El orden debe estar entre 0 y 255.');
            return false;
        }

        if (descripcion.length > 5000) {
            notifyError('La descripción es demasiado extensa.');
            return false;
        }

        if (form.archivo) {
            if (form.archivo.type && !FILE_MIMES.includes(form.archivo.type)) {
                notifyError('El archivo debe ser imagen, PDF, Word, PowerPoint o video MP4/WEBM/MOV.');
                return false;
            }

            if (form.archivo.size > MAX_FILE_SIZE) {
                notifyError('El archivo no debe superar los 100 MB.');
                return false;
            }
        }

        return true;
    };

    const buildFormData = () => {
        const data = new FormData();

        data.append('titulo', form.titulo.trim());
        data.append('descripcion', form.descripcion.trim());
        data.append('contenido_html', form.contenido_html.trim());
        data.append('enlace_video', form.enlace_video.trim());
        data.append('duracion_minutos', form.duracion_minutos === '' ? '0' : String(Number(form.duracion_minutos)));
        data.append('visitas', form.visitas === '' ? '0' : String(Number(form.visitas)));
        data.append('orden', form.orden === '' ? '0' : String(Number(form.orden)));
        data.append('idcategoria', form.idcategoria);
        data.append('idestado', form.idestado);
        data.append('idtipotutorial', form.idtipotutorial);

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

        return data;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validarFormulario()) return;

        setSaving(true);

        const toastId = notifyLoading(
            isEditing ? 'Actualizando tutorial...' : 'Registrando tutorial...'
        );

        try {
            const payload = buildFormData();

            if (isEditing) {
                await actualizarTutorial(editingId, payload);
                notifySuccess('Tutorial actualizado correctamente.');
            } else {
                await crearTutorial(payload);
                notifySuccess('Tutorial registrado correctamente.');
            }

            cerrarFormulario();
            await cargarDatos(pagination.current_page);
        } catch (err) {
            notifyError(
                getApiErrorMessage(err, 'No se pudo guardar el tutorial.')
            );
        } finally {
            closeNotify(toastId);
            setSaving(false);
        }
    };

    const handleEdit = (tutorial) => {
        setEditingId(tutorial.idtutorial);
        setEditingHasArchivo(getArchivoUrl(tutorial) !== '#');
        setShowForm(true);

        setForm({
            titulo: tutorial.titulo || '',
            descripcion: tutorial.descripcion || '',
            contenido_html: tutorial.contenido_html || '',
            enlace_video: tutorial.enlace_video || '',
            duracion_minutos: tutorial.duracion_minutos ?? '',
            visitas: tutorial.visitas ?? 0,
            orden: tutorial.orden ?? 0,
            idcategoria: tutorial.idcategoria ? String(tutorial.idcategoria) : '',
            idestado: tutorial.idestado ? String(tutorial.idestado) : '',
            idtipotutorial: tutorial.idtipotutorial ? String(tutorial.idtipotutorial) : '',
            archivo: null,
            etiquetas: Array.isArray(tutorial.etiquetas)
                ? tutorial.etiquetas.map((item) => Number(item.idetiqueta))
                : [],
        });

        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = async (tutorial) => {
        if (!tutorial.idtutorial) {
            notifyError('No se encontró el identificador del tutorial.');
            return;
        }

        const ok = confirm(
            `¿Eliminar el tutorial "${tutorial.titulo}"?\n\nEsta acción no se puede deshacer.`
        );

        if (!ok) return;

        const toastId = notifyLoading('Eliminando tutorial...');

        try {
            await eliminarTutorial(tutorial.idtutorial);

            notifySuccess('Tutorial eliminado correctamente.');

            const nextPage =
                tutoriales.length === 1 && pagination.current_page > 1
                    ? pagination.current_page - 1
                    : pagination.current_page;

            await cargarDatos(nextPage);
        } catch (err) {
            notifyError(
                getApiErrorMessage(err, 'No se pudo eliminar el tutorial.')
            );
        } finally {
            closeNotify(toastId);
        }
    };

    const handleViewDetail = async (tutorial) => {
        setShowDetail(true);
        setLoadingDetail(true);
        setSelectedTutorial(null);

        try {
            const response = await obtenerTutorial(tutorial.idtutorial);
            setSelectedTutorial(response?.data || tutorial);
        } catch (err) {
            notifyError(
                getApiErrorMessage(err, 'No se pudo obtener el detalle del tutorial.')
            );
            setShowDetail(false);
        } finally {
            setLoadingDetail(false);
        }
    };

    const cerrarDetalle = () => {
        setShowDetail(false);
        setSelectedTutorial(null);
    };

    const handleBuscar = async (e) => {
        e.preventDefault();

        if (search.trim().length > MAX_SEARCH_LENGTH) {
            notifyError(`La búsqueda no debe superar los ${MAX_SEARCH_LENGTH} caracteres.`);
            return;
        }

        await cargarDatos(1);
    };

    const handleLimpiarFiltros = async () => {
        setSearch('');
        setCategoriaFiltro('');
        setEstadoFiltro('');
        setTipoTutorialFiltro('');

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
        const current = pagination.current_page;
        const last = pagination.last_page;
        const pages = [];

        const start = Math.max(1, current - 2);
        const end = Math.min(last, current + 2);

        for (let page = start; page <= end; page += 1) {
            pages.push(page);
        }

        return pages;
    }, [pagination]);

    return (
        <section className="tutoriales-page">
            <div className="tutoriales-header">
                <div>
                    <span className="tutoriales-eyebrow">Gestión de aprendizaje</span>
                    <h1>Tutoriales</h1>
                    <p>
                        Administra guías, videos, manuales y recursos de apoyo para el uso
                        de plataformas y servicios tecnológicos institucionales.
                    </p>
                </div>

                {!showForm && (
                    <button
                        type="button"
                        className="tutoriales-add-button"
                        onClick={abrirFormularioCrear}
                        disabled={loading || loadingCatalogs}
                    >
                        <Plus size={18} />
                        Agregar tutorial
                    </button>
                )}
            </div>

            {showForm && (
                <div className="tutoriales-form-card">
                    <div className="tutoriales-form-header">
                        <div>
                            <h2>{isEditing ? 'Editar tutorial' : 'Agregar tutorial'}</h2>
                            <p>
                                Puedes registrar contenido HTML, un enlace de video o subir un
                                archivo propio como manual, imagen o video.
                            </p>
                        </div>

                        <button
                            type="button"
                            className="tutoriales-close-button"
                            onClick={cerrarFormulario}
                            disabled={saving}
                        >
                            <X size={18} />
                        </button>
                    </div>

                    <form className="tutoriales-form" onSubmit={handleSubmit}>
                        <div className="tutoriales-form-grid">
                            <div className="tutoriales-field span-2">
                                <label>Título</label>
                                <input
                                    name="titulo"
                                    value={form.titulo}
                                    onChange={handleChange}
                                    maxLength={MAX_TITULO_LENGTH}
                                    placeholder="Ej. Tutorial para recuperar contraseña institucional"
                                    required
                                    disabled={saving}
                                />
                            </div>

                            <div className="tutoriales-field">
                                <label>Categoría</label>
                                <select
                                    name="idcategoria"
                                    value={form.idcategoria}
                                    onChange={handleChange}
                                    required
                                    disabled={saving || loadingCatalogs}
                                >
                                    <option value="">Seleccione una categoría</option>
                                    {categorias.map((categoria) => (
                                        <option
                                            key={categoria.idcategoria}
                                            value={categoria.idcategoria}
                                        >
                                            {categoria.nombre}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="tutoriales-field">
                                <label>Tipo de tutorial</label>
                                <select
                                    name="idtipotutorial"
                                    value={form.idtipotutorial}
                                    onChange={handleChange}
                                    required
                                    disabled={saving || loadingCatalogs}
                                >
                                    <option value="">Seleccione un tipo</option>
                                    {tiposTutorial.map((tipo) => (
                                        <option
                                            key={tipo.idtipotutorial}
                                            value={tipo.idtipotutorial}
                                        >
                                            {tipo.nombre}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="tutoriales-field">
                                <label>Estado</label>
                                <select
                                    name="idestado"
                                    value={form.idestado}
                                    onChange={handleChange}
                                    required
                                    disabled={saving || loadingCatalogs}
                                >
                                    <option value="">Seleccione un estado</option>
                                    {estados.map((estado) => (
                                        <option key={estado.idestado} value={estado.idestado}>
                                            {estado.nombre}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="tutoriales-field">
                                <label>Enlace de video</label>
                                <input
                                    name="enlace_video"
                                    value={form.enlace_video}
                                    onChange={handleChange}
                                    maxLength={MAX_URL_LENGTH}
                                    placeholder="https://..."
                                    disabled={saving}
                                />
                            </div>

                            <div className="tutoriales-field">
                                <label>Duración en minutos</label>
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    name="duracion_minutos"
                                    value={form.duracion_minutos}
                                    onChange={handleChange}
                                    placeholder="Ej. 15"
                                    disabled={saving}
                                />
                            </div>

                            <div className="tutoriales-field">
                                <label>Visitas</label>
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    name="visitas"
                                    value={form.visitas}
                                    onChange={handleChange}
                                    placeholder="0"
                                    disabled={saving}
                                />
                            </div>

                            <div className="tutoriales-field">
                                <label>Orden</label>
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    name="orden"
                                    value={form.orden}
                                    onChange={handleChange}
                                    placeholder="0"
                                    disabled={saving}
                                />
                            </div>

                            <div className="tutoriales-field">
                                <label>Archivo</label>
                                <input
                                    type="file"
                                    name="archivo"
                                    accept=".jpg,.jpeg,.png,.webp,.pdf,.doc,.docx,.ppt,.pptx,.mp4,.webm,.mov,image/jpeg,image/png,image/webp,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,video/mp4,video/webm,video/quicktime"
                                    onChange={handleChange}
                                    disabled={saving}
                                />
                                <small>Imagen, PDF, Word, PowerPoint o video. Máximo 100 MB.</small>
                                {isEditing && editingHasArchivo && !form.archivo && (
                                    <small>El tutorial ya tiene un archivo asociado.</small>
                                )}
                            </div>

                            <div className="tutoriales-field span-2">
                                <div className="tutoriales-etiquetas-header">
                                    <label>Etiquetas</label>

                                    <div className="tutoriales-etiquetas-actions">
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
                                    <div className="tutoriales-etiquetas-selected">
                                        <strong>Seleccionadas:</strong>

                                        <div className="tutoriales-etiquetas-selected-list">
                                            {etiquetasActivasSeleccionadas.map((etiqueta) => (
                                                <button
                                                    type="button"
                                                    key={etiqueta.idetiqueta}
                                                    className="tutoriales-etiqueta-selected"
                                                    onClick={() => handleToggleEtiqueta(etiqueta.idetiqueta)}
                                                    style={{
                                                        '--etiqueta-color': etiqueta.color || '#2563eb',
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
                                    <small className="tutoriales-help-text">
                                        No hay etiquetas activas registradas.
                                    </small>
                                ) : (
                                    <div className="tutoriales-etiquetas-selector">
                                        {etiquetas.map((etiqueta) => {
                                            const activa = etiquetasSeleccionadas.includes(
                                                Number(etiqueta.idetiqueta)
                                            );

                                            return (
                                                <button
                                                    type="button"
                                                    key={etiqueta.idetiqueta}
                                                    className={`tutoriales-etiqueta-chip ${
                                                        activa ? 'is-active' : ''
                                                    }`}
                                                    onClick={() => handleToggleEtiqueta(etiqueta.idetiqueta)}
                                                    style={{
                                                        '--etiqueta-color': etiqueta.color || '#2563eb',
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

                                <small className="tutoriales-help-text">
                                    Usa etiquetas para relacionar este tutorial con temas como
                                    soporte, sistema académico, seguridad informática o capacitación.
                                </small>
                            </div>

                            <div className="tutoriales-field span-2">
                                <label>Descripción</label>
                                <textarea
                                    name="descripcion"
                                    value={form.descripcion}
                                    onChange={handleChange}
                                    rows={4}
                                    placeholder="Describe brevemente el objetivo del tutorial."
                                    disabled={saving}
                                />
                            </div>

                            <div className="tutoriales-field span-2">
                                <label>Contenido HTML</label>
                                <textarea
                                    name="contenido_html"
                                    value={form.contenido_html}
                                    onChange={handleChange}
                                    rows={8}
                                    placeholder="<p>Escribe aquí el contenido del tutorial...</p>"
                                    disabled={saving}
                                />
                                <small>
                                    Puedes registrar pasos, instrucciones o contenido enriquecido en HTML.
                                </small>
                            </div>
                        </div>

                        <div className="tutoriales-form-actions">
                            <button
                                type="submit"
                                className="tutoriales-save-button"
                                disabled={saving || loadingCatalogs}
                            >
                                <Save size={17} />
                                {saving
                                    ? 'Guardando...'
                                    : isEditing
                                        ? 'Actualizar tutorial'
                                        : 'Guardar tutorial'}
                            </button>

                            <button
                                type="button"
                                className="tutoriales-cancel-button"
                                onClick={cerrarFormulario}
                                disabled={saving}
                            >
                                Cancelar
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="tutoriales-list-card">
                <div className="tutoriales-list-header">
                    <div>
                        <h2>Tutoriales registrados</h2>
                        <p>
                            Mostrando {pagination.from || 0} - {pagination.to || 0} de{' '}
                            {pagination.total} tutoriales.
                        </p>
                    </div>

                    <form className="tutoriales-filters" onSubmit={handleBuscar}>
                        <div className="tutoriales-search">
                            <Search size={17} />
                            <input
                                value={search}
                                onChange={handleSearchChange}
                                placeholder="Buscar tutorial..."
                                maxLength={MAX_SEARCH_LENGTH}
                            />
                        </div>

                        <select
                            value={categoriaFiltro}
                            onChange={(e) => setCategoriaFiltro(e.target.value)}
                            className="tutoriales-filter-select"
                            disabled={loadingCatalogs}
                        >
                            <option value="">Todas las categorías</option>
                            {categorias.map((categoria) => (
                                <option key={categoria.idcategoria} value={categoria.idcategoria}>
                                    {categoria.nombre}
                                </option>
                            ))}
                        </select>

                        <select
                            value={tipoTutorialFiltro}
                            onChange={(e) => setTipoTutorialFiltro(e.target.value)}
                            className="tutoriales-filter-select"
                            disabled={loadingCatalogs}
                        >
                            <option value="">Todos los tipos</option>
                            {tiposTutorial.map((tipo) => (
                                <option key={tipo.idtipotutorial} value={tipo.idtipotutorial}>
                                    {tipo.nombre}
                                </option>
                            ))}
                        </select>

                        <select
                            value={estadoFiltro}
                            onChange={(e) => setEstadoFiltro(e.target.value)}
                            className="tutoriales-filter-select"
                            disabled={loadingCatalogs}
                        >
                            <option value="">Todos los estados</option>
                            {estados.map((estado) => (
                                <option key={estado.idestado} value={estado.idestado}>
                                    {estado.nombre}
                                </option>
                            ))}
                        </select>

                        <button type="submit" className="tutoriales-filter-button">
                            Buscar
                        </button>

                        <button
                            type="button"
                            className="tutoriales-clear-button"
                            onClick={handleLimpiarFiltros}
                        >
                            Limpiar
                        </button>
                    </form>
                </div>

                {loading ? (
                    <p className="tutoriales-empty">Cargando tutoriales...</p>
                ) : tutoriales.length === 0 ? (
                    <div className="tutoriales-empty-box">
                        <h3>No hay tutoriales para mostrar</h3>
                        <p>Registra un tutorial o cambia los filtros de búsqueda.</p>
                    </div>
                ) : (
                    <div className="tutoriales-table-wrap">
                        <table className="tutoriales-table">
                            <thead>
                            <tr>
                                <th>Tutorial</th>
                                <th>Categoría</th>
                                <th>Tipo</th>
                                <th>Estado</th>
                                <th>Duración</th>
                                <th>Visitas</th>
                                <th>Recurso</th>
                                <th>Acciones</th>
                            </tr>
                            </thead>

                            <tbody>
                            {tutoriales.map((tutorial) => (
                                <tr key={tutorial.idtutorial}>
                                    <td>
                                        <div className="tutoriales-name">
                                                <span>
                                                    <BookOpen size={18} />
                                                </span>

                                            <div>
                                                <strong>{tutorial.titulo}</strong>
                                                <small>{recortarTexto(tutorial.descripcion, 90)}</small>
                                                <EtiquetasTutorial etiquetas={tutorial.etiquetas} />
                                            </div>
                                        </div>
                                    </td>

                                    <td>
                                            <span className="tutoriales-tag">
                                                <Tag size={14} />
                                                {tutorial.categoria?.nombre || 'Sin categoría'}
                                            </span>
                                    </td>

                                    <td>
                                            <span className="tutoriales-tag">
                                                <Layers size={14} />
                                                {tutorial.tipo_tutorial?.nombre ||
                                                    tutorial.tipoTutorial?.nombre ||
                                                    'Sin tipo'}
                                            </span>
                                    </td>

                                    <td>
                                            <span className="tutoriales-tag">
                                                <ShieldCheck size={14} />
                                                {tutorial.estado?.nombre || 'Sin estado'}
                                            </span>
                                    </td>

                                    <td>
                                            <span className="tutoriales-metric">
                                                <Clock size={14} />
                                                {tutorial.duracion_minutos ?? 0} min
                                            </span>
                                    </td>

                                    <td>
                                            <span className="tutoriales-metric">
                                                <BarChart3 size={14} />
                                                {tutorial.visitas ?? 0}
                                            </span>
                                    </td>

                                    <td>
                                        <div className="tutoriales-resource">
                                            {tutorial.enlace_video && (
                                                <a
                                                    href={tutorial.enlace_video}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    title="Ver video"
                                                >
                                                    <PlayCircle size={15} />
                                                    Video
                                                </a>
                                            )}

                                            {getArchivoUrl(tutorial) !== '#' && (
                                                <a
                                                    href={getArchivoUrl(tutorial)}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    title={getArchivoNombre(tutorial)}
                                                >
                                                    <Download size={15} />
                                                    {getArchivoExtension(tutorial)}
                                                </a>
                                            )}

                                            {!tutorial.enlace_video && getArchivoUrl(tutorial) === '#' && (
                                                <span>
                                                        <FileText size={15} />
                                                        HTML
                                                    </span>
                                            )}
                                        </div>
                                    </td>

                                    <td>
                                        <div className="tutoriales-actions">
                                            <button
                                                type="button"
                                                onClick={() => handleViewDetail(tutorial)}
                                                title="Ver detalle"
                                            >
                                                <Eye size={16} />
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => handleEdit(tutorial)}
                                                title="Editar"
                                            >
                                                <Pencil size={16} />
                                            </button>

                                            <button
                                                type="button"
                                                className="danger"
                                                onClick={() => handleDelete(tutorial)}
                                                title="Eliminar"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                )}

                <div className="tutoriales-pagination">
                    <button
                        type="button"
                        onClick={() => handlePageChange(pagination.current_page - 1)}
                        disabled={loading || pagination.current_page <= 1}
                    >
                        Anterior
                    </button>

                    {visiblePages.map((page) => (
                        <button
                            key={page}
                            type="button"
                            onClick={() => handlePageChange(page)}
                            className={page === pagination.current_page ? 'active' : ''}
                            disabled={loading}
                        >
                            {page}
                        </button>
                    ))}

                    <button
                        type="button"
                        onClick={() => handlePageChange(pagination.current_page + 1)}
                        disabled={loading || pagination.current_page >= pagination.last_page}
                    >
                        Siguiente
                    </button>
                </div>
            </div>

            {showDetail && (
                <div className="tutoriales-modal-overlay" role="dialog" aria-modal="true">
                    <div className="tutoriales-modal">
                        <div className="tutoriales-modal-header">
                            <div>
                                <span className="tutoriales-eyebrow">Detalle del tutorial</span>
                                <h2>
                                    {loadingDetail
                                        ? 'Cargando detalle...'
                                        : selectedTutorial?.titulo || 'Detalle'}
                                </h2>
                            </div>

                            <button
                                type="button"
                                className="tutoriales-close-button"
                                onClick={cerrarDetalle}
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {loadingDetail ? (
                            <p className="tutoriales-empty">Cargando detalle...</p>
                        ) : selectedTutorial ? (
                            <div className="tutoriales-detail">
                                <div className="tutoriales-detail-grid">
                                    <div>
                                        <span>Categoría</span>
                                        <strong>{selectedTutorial.categoria?.nombre || '-'}</strong>
                                    </div>

                                    <div>
                                        <span>Tipo</span>
                                        <strong>
                                            {selectedTutorial.tipo_tutorial?.nombre ||
                                                selectedTutorial.tipoTutorial?.nombre ||
                                                '-'}
                                        </strong>
                                    </div>

                                    <div>
                                        <span>Estado</span>
                                        <strong>{selectedTutorial.estado?.nombre || '-'}</strong>
                                    </div>

                                    <div>
                                        <span>Duración</span>
                                        <strong>{selectedTutorial.duracion_minutos ?? 0} min</strong>
                                    </div>

                                    <div>
                                        <span>Visitas</span>
                                        <strong>{selectedTutorial.visitas ?? 0}</strong>
                                    </div>

                                    <div>
                                        <span>Orden</span>
                                        <strong>{selectedTutorial.orden ?? 0}</strong>
                                    </div>

                                    <div>
                                        <span>Autor</span>
                                        <strong>
                                            {selectedTutorial.autor?.nombre_completo ||
                                                selectedTutorial.usuario_autor?.nombre_completo ||
                                                selectedTutorial.autor?.email ||
                                                '-'}
                                        </strong>
                                    </div>

                                    <div>
                                        <span>Slug</span>
                                        <strong>{selectedTutorial.slug || '-'}</strong>
                                    </div>
                                </div>

                                <div className="tutoriales-detail-content">
                                    <h3>Etiquetas</h3>
                                    <EtiquetasTutorial etiquetas={selectedTutorial.etiquetas} />
                                    {(!Array.isArray(selectedTutorial.etiquetas) ||
                                        selectedTutorial.etiquetas.length === 0) && (
                                        <p>Sin etiquetas registradas.</p>
                                    )}
                                </div>

                                <div className="tutoriales-detail-content">
                                    <h3>Descripción</h3>
                                    <p>
                                        {selectedTutorial.descripcion ||
                                            'Sin descripción registrada.'}
                                    </p>
                                </div>

                                {selectedTutorial.contenido_html && (
                                    <div className="tutoriales-detail-content">
                                        <h3>Contenido HTML</h3>
                                        <div
                                            className="tutoriales-html-preview"
                                            dangerouslySetInnerHTML={{
                                                __html: DOMPurify.sanitize(selectedTutorial.contenido_html),
                                            }}
                                        />
                                    </div>
                                )}

                                <div className="tutoriales-detail-links">
                                    {selectedTutorial.enlace_video && (
                                        <a
                                            href={selectedTutorial.enlace_video}
                                            target="_blank"
                                            rel="noreferrer"
                                        >
                                            <PlayCircle size={16} />
                                            Ver video externo
                                        </a>
                                    )}

                                    {getArchivoUrl(selectedTutorial) !== '#' && (
                                        <a
                                            href={getArchivoUrl(selectedTutorial)}
                                            target="_blank"
                                            rel="noreferrer"
                                        >
                                            <Download size={16} />
                                            Ver archivo asociado
                                        </a>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <p className="tutoriales-empty">No se pudo cargar el detalle.</p>
                        )}
                    </div>
                </div>
            )}
        </section>
    );
}

function EtiquetasTutorial({ etiquetas = [] }) {
    if (!Array.isArray(etiquetas) || etiquetas.length === 0) {
        return null;
    }

    return (
        <div className="tutoriales-etiquetas-list">
            {etiquetas.map((etiqueta) => (
                <span
                    key={etiqueta.idetiqueta}
                    className="tutoriales-etiqueta-badge"
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

function recortarTexto(value, max = 90) {
    const text = String(value || '').trim();

    if (!text) return 'Sin descripción registrada.';

    if (text.length <= max) return text;

    return `${text.slice(0, max)}...`;
}