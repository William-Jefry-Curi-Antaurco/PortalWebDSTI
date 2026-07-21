import { useEffect, useMemo, useState } from 'react';
import {
    FileText,
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
} from 'lucide-react';

import {
    actualizarDocumento,
    crearDocumento,
    eliminarDocumento,
    listarCategorias,
    listarDocumentos,
    listarEstados,
    listarTiposDocumento,
    obtenerDocumento,
} from '../api/documentosApi';

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

import '../styles/modules/documentosManuales.css';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://127.0.0.1:8000';

const initialForm = {
    titulo: '',
    descripcion: '',
    version: '1.0',
    es_version_actual: true,
    fecha_documento: '',
    iddocumento_padre: '',
    idcategoria: '',
    idestado: '',
    idtipodocumento: '',
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
const MAX_VERSION_LENGTH = 20;
const MAX_SEARCH_LENGTH = 120;
const MAX_FILE_SIZE = 10 * 1024 * 1024;

const DOCUMENT_MIMES = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
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

const normalizeDateInput = (value) => {
    if (!value) return '';

    const text = String(value);

    if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
        return text;
    }

    if (text.includes('T')) {
        return text.split('T')[0];
    }

    return '';
};

const isValidDate = (value) => {
    if (!value) return true;
    return /^\d{4}-\d{2}-\d{2}$/.test(value);
};

const getArchivo = (documento) => {
    return documento?.archivo || documento?.archivo_documento || null;
};

const getFileUrl = (path) => {
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

const getDocumentoUrl = (documento) => {
    const archivo = getArchivo(documento);

    if (archivo?.ruta) return getFileUrl(archivo.ruta);
    if (documento?.archivo_url) return getFileUrl(documento.archivo_url);
    if (documento?.ruta) return getFileUrl(documento.ruta);

    return '#';
};

const getArchivoNombre = (documento) => {
    const archivo = getArchivo(documento);

    return archivo?.nombre_original || archivo?.nombre_guardado || 'Archivo';
};

const getArchivoExtension = (documento) => {
    const archivo = getArchivo(documento);

    if (archivo?.extension) return archivo.extension.toUpperCase();

    const nombre = getArchivoNombre(documento);
    const partes = nombre.split('.');

    return partes.length > 1 ? partes.pop().toUpperCase() : '-';
};

const MODULO_DOCUMENTOS_SLUG = 'documentos-manuales';

const ESTADOS_DOCUMENTOS_PERMITIDOS = [
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

function filtrarCategoriasDocumentos(categorias = []) {
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
                return moduloSlug === MODULO_DOCUMENTOS_SLUG;
            }

            const moduloNombre = normalize(
                item?.modulo?.nombre ||
                item?.nombre_modulo ||
                ''
            );

            if (moduloNombre) {
                return (
                    moduloNombre.includes('documento') ||
                    moduloNombre.includes('manual')
                );
            }

            const nombre = normalize(item?.nombre);
            const slug = normalize(item?.slug);

            return [
                'manual',
                'manuales',
                'documento',
                'documentos',
                'guia',
                'guía',
                'guias',
                'guías',
                'directiva',
                'directivas',
                'norma',
                'normas',
                'reglamento',
                'reglamentos',
                'instructivo',
                'instructivos',
            ].some((key) => nombre.includes(normalize(key)) || slug.includes(normalize(key)));
        })
        .sort((a, b) => Number(a.orden || 0) - Number(b.orden || 0));
}

function filtrarEstadosDocumentos(estados = []) {
    const permitidos = ESTADOS_DOCUMENTOS_PERMITIDOS.map(normalize);

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

export default function DocumentosManuales() {
    const [documentos, setDocumentos] = useState([]);
    const [categorias, setCategorias] = useState([]);
    const [estados, setEstados] = useState([]);
    const [tiposDocumento, setTiposDocumento] = useState([]);
    const [etiquetas, setEtiquetas] = useState([]);
    const [pagination, setPagination] = useState(initialPagination);

    const [form, setForm] = useState(initialForm);
    const [editingId, setEditingId] = useState(null);
    const [selectedDocumento, setSelectedDocumento] = useState(null);

    const [showForm, setShowForm] = useState(false);
    const [showDetail, setShowDetail] = useState(false);

    const [loading, setLoading] = useState(true);
    const [loadingCatalogs, setLoadingCatalogs] = useState(false);
    const [saving, setSaving] = useState(false);
    const [loadingDetail, setLoadingDetail] = useState(false);

    const [search, setSearch] = useState('');
    const [categoriaFiltro, setCategoriaFiltro] = useState('');
    const [estadoFiltro, setEstadoFiltro] = useState('');
    const [tipoDocumentoFiltro, setTipoDocumentoFiltro] = useState('');

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
                listarTiposDocumento({ activo: 1 }),
                listarEtiquetas(),
            ]);

            if (categoriasResult.status === 'fulfilled') {
                const categoriasNormalizadas = normalizarCatalogo(categoriasResult.value);

                setCategorias(filtrarCategoriasDocumentos(categoriasNormalizadas));
            } else {
                console.error('Error al cargar categorías:', categoriasResult.reason);
                notifyError('No se pudieron cargar las categorías.');
            }

            if (estadosResult.status === 'fulfilled') {
                const estadosNormalizados = normalizarCatalogo(estadosResult.value);

                setEstados(filtrarEstadosDocumentos(estadosNormalizados));
            } else {
                console.error('Error al cargar estados:', estadosResult.reason);
                notifyError('No se pudieron cargar los estados.');
            }

            if (tiposResult.status === 'fulfilled') {
                setTiposDocumento(normalizarCatalogo(tiposResult.value));
            } else {
                console.error('Error al cargar tipos de documento:', tiposResult.reason);
                notifyError('No se pudieron cargar los tipos de documento.');
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
                idtipodocumento: tipoDocumentoFiltro || undefined,
            };

            Object.keys(params).forEach((key) => {
                if (params[key] === undefined || params[key] === '') {
                    delete params[key];
                }
            });

            const response = await listarDocumentos(params);
            const { items, pagination: meta } = normalizarRespuestaPaginada(response);

            setDocumentos(items);
            setPagination(meta);
        } catch (err) {
            notifyError(
                getApiErrorMessage(err, 'No se pudieron cargar los documentos.')
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
        const { name, value, type, checked, files } = e.target;

        if (type === 'file') {
            setForm({
                ...form,
                [name]: files?.[0] || null,
            });

            return;
        }

        setForm({
            ...form,
            [name]: type === 'checkbox' ? checked : value,
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
        const version = form.version.trim();

        if (!titulo) {
            notifyError('El título del documento es obligatorio.');
            return false;
        }

        if (titulo.length > MAX_TITULO_LENGTH) {
            notifyError(`El título no debe superar los ${MAX_TITULO_LENGTH} caracteres.`);
            return false;
        }

        if (version && version.length > MAX_VERSION_LENGTH) {
            notifyError(`La versión no debe superar los ${MAX_VERSION_LENGTH} caracteres.`);
            return false;
        }

        if (!isValidDate(form.fecha_documento)) {
            notifyError('La fecha del documento no tiene un formato válido.');
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
            notifyError('Seleccione una categoría válida para documentos y manuales.');
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
            notifyError('Seleccione un estado válido para documentos y manuales.');
            return false;
        }

        if (!form.idtipodocumento) {
            notifyError('Debe seleccionar un tipo de documento.');
            return false;
        }

        if (!isEditing && !form.archivo) {
            notifyError('Debe subir el archivo del documento.');
            return false;
        }

        if (form.archivo) {
            if (
                form.archivo.type &&
                !DOCUMENT_MIMES.includes(form.archivo.type)
            ) {
                notifyError('El archivo debe ser PDF, Word, Excel o PowerPoint.');
                return false;
            }

            if (form.archivo.size > MAX_FILE_SIZE) {
                notifyError('El archivo no debe superar los 10 MB.');
                return false;
            }
        }

        if (
            isEditing &&
            form.iddocumento_padre &&
            Number(form.iddocumento_padre) === Number(editingId)
        ) {
            notifyError('El documento padre no puede ser el mismo documento.');
            return false;
        }

        return true;
    };

    const buildFormData = () => {
        const data = new FormData();

        data.append('titulo', form.titulo.trim());
        data.append('descripcion', form.descripcion.trim());
        data.append('version', form.version.trim() || '1.0');
        data.append('es_version_actual', form.es_version_actual ? '1' : '0');
        data.append('fecha_documento', normalizeDateInput(form.fecha_documento));
        data.append('iddocumento_padre', form.iddocumento_padre || '');
        data.append('idcategoria', form.idcategoria);
        data.append('idestado', form.idestado);
        data.append('idtipodocumento', form.idtipodocumento);

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
            isEditing ? 'Actualizando documento...' : 'Registrando documento...'
        );

        try {
            const payload = buildFormData();

            if (isEditing) {
                await actualizarDocumento(editingId, payload);
                notifySuccess('Documento actualizado correctamente.');
            } else {
                await crearDocumento(payload);
                notifySuccess('Documento registrado correctamente.');
            }

            cerrarFormulario();
            await cargarDatos(pagination.current_page);
        } catch (err) {
            notifyError(
                getApiErrorMessage(err, 'No se pudo guardar el documento.')
            );
        } finally {
            closeNotify(toastId);
            setSaving(false);
        }
    };

    const handleEdit = (documento) => {
        setEditingId(documento.iddocumento);
        setShowForm(true);

        setForm({
            titulo: documento.titulo || '',
            descripcion: documento.descripcion || '',
            version: documento.version || '1.0',
            es_version_actual: Boolean(Number(documento.es_version_actual)),
            fecha_documento: normalizeDateInput(documento.fecha_documento),
            iddocumento_padre: documento.iddocumento_padre
                ? String(documento.iddocumento_padre)
                : '',
            idcategoria: documento.idcategoria ? String(documento.idcategoria) : '',
            idestado: documento.idestado ? String(documento.idestado) : '',
            idtipodocumento: documento.idtipodocumento
                ? String(documento.idtipodocumento)
                : '',
            archivo: null,
            etiquetas: Array.isArray(documento.etiquetas)
                ? documento.etiquetas.map((item) => Number(item.idetiqueta))
                : [],
        });

        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = async (documento) => {
        if (!documento.iddocumento) {
            notifyError('No se encontró el identificador del documento.');
            return;
        }

        const ok = confirm(
            `¿Eliminar el documento "${documento.titulo}"?\n\nEsta acción no se puede deshacer.`
        );

        if (!ok) return;

        const toastId = notifyLoading('Eliminando documento...');

        try {
            await eliminarDocumento(documento.iddocumento);

            notifySuccess('Documento eliminado correctamente.');

            const nextPage =
                documentos.length === 1 && pagination.current_page > 1
                    ? pagination.current_page - 1
                    : pagination.current_page;

            await cargarDatos(nextPage);
        } catch (err) {
            notifyError(
                getApiErrorMessage(err, 'No se pudo eliminar el documento.')
            );
        } finally {
            closeNotify(toastId);
        }
    };

    const handleViewDetail = async (documento) => {
        setShowDetail(true);
        setLoadingDetail(true);
        setSelectedDocumento(null);

        try {
            const response = await obtenerDocumento(documento.iddocumento);
            setSelectedDocumento(response?.data || documento);
        } catch (err) {
            notifyError(
                getApiErrorMessage(err, 'No se pudo obtener el detalle del documento.')
            );
            setShowDetail(false);
        } finally {
            setLoadingDetail(false);
        }
    };

    const cerrarDetalle = () => {
        setShowDetail(false);
        setSelectedDocumento(null);
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
        setTipoDocumentoFiltro('');

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
        <section className="documentos-page">
            <div className="documentos-header">
                <div>
                    <span className="documentos-eyebrow">Gestión documental</span>
                    <h1>Documentos y manuales</h1>
                    <p>
                        Administra manuales, directivas, normas y documentos institucionales
                        con archivo físico, categoría, tipo, estado, etiquetas y control de versión.
                    </p>
                </div>

                {!showForm && (
                    <button
                        type="button"
                        className="documentos-add-button"
                        onClick={abrirFormularioCrear}
                        disabled={loading || loadingCatalogs}
                    >
                        <Plus size={18} />
                        Agregar documento
                    </button>
                )}
            </div>

            {showForm && (
                <div className="documentos-form-card">
                    <div className="documentos-form-header">
                        <div>
                            <h2>{isEditing ? 'Editar documento' : 'Agregar documento'}</h2>
                            <p>
                                El archivo es obligatorio al crear y opcional al actualizar.
                                El slug se genera automáticamente en el backend.
                            </p>
                        </div>

                        <button
                            type="button"
                            className="documentos-close-button"
                            onClick={cerrarFormulario}
                            disabled={saving}
                        >
                            <X size={18} />
                        </button>
                    </div>

                    <form className="documentos-form" onSubmit={handleSubmit}>
                        <div className="documentos-form-grid">
                            <div className="documentos-field">
                                <label>Título</label>
                                <input
                                    name="titulo"
                                    value={form.titulo}
                                    onChange={handleChange}
                                    maxLength={MAX_TITULO_LENGTH}
                                    placeholder="Ej. Manual de uso del Sistema Académico"
                                    required
                                    disabled={saving}
                                />
                            </div>

                            <div className="documentos-field">
                                <label>Versión</label>
                                <input
                                    name="version"
                                    value={form.version}
                                    onChange={handleChange}
                                    maxLength={MAX_VERSION_LENGTH}
                                    placeholder="Ej. 1.0"
                                    disabled={saving}
                                />
                            </div>

                            <div className="documentos-field">
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
                                        <option key={categoria.idcategoria} value={categoria.idcategoria}>
                                            {categoria.nombre}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="documentos-field">
                                <label>Tipo de documento</label>
                                <select
                                    name="idtipodocumento"
                                    value={form.idtipodocumento}
                                    onChange={handleChange}
                                    required
                                    disabled={saving || loadingCatalogs}
                                >
                                    <option value="">Seleccione un tipo</option>
                                    {tiposDocumento.map((tipo) => (
                                        <option key={tipo.idtipodocumento} value={tipo.idtipodocumento}>
                                            {tipo.nombre}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="documentos-field">
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

                            <div className="documentos-field">
                                <label>Fecha del documento</label>
                                <input
                                    type="date"
                                    name="fecha_documento"
                                    value={form.fecha_documento}
                                    onChange={handleChange}
                                    disabled={saving}
                                />
                            </div>

                            <div className="documentos-field">
                                <label>Documento padre</label>
                                <select
                                    name="iddocumento_padre"
                                    value={form.iddocumento_padre}
                                    onChange={handleChange}
                                    disabled={saving}
                                >
                                    <option value="">Sin documento padre</option>
                                    {documentos
                                        .filter((item) => Number(item.iddocumento) !== Number(editingId))
                                        .map((item) => (
                                            <option key={item.iddocumento} value={item.iddocumento}>
                                                {item.titulo}
                                            </option>
                                        ))}
                                </select>
                            </div>

                            <div className="documentos-field">
                                <label>Archivo</label>
                                <input
                                    type="file"
                                    name="archivo"
                                    accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation"
                                    onChange={handleChange}
                                    required={!isEditing}
                                    disabled={saving}
                                />
                                <small>PDF, Word, Excel o PowerPoint. Máximo 10 MB.</small>
                            </div>

                            <div className="documentos-field span-2">
                                <div className="documentos-etiquetas-header">
                                    <label>Etiquetas</label>

                                    <div className="documentos-etiquetas-actions">
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
                                    <div className="documentos-etiquetas-selected">
                                        <strong>Seleccionadas:</strong>

                                        <div className="documentos-etiquetas-selected-list">
                                            {etiquetasActivasSeleccionadas.map((etiqueta) => (
                                                <button
                                                    type="button"
                                                    key={etiqueta.idetiqueta}
                                                    className="documentos-etiqueta-selected"
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
                                    <small className="documentos-help-text">
                                        No hay etiquetas activas registradas.
                                    </small>
                                ) : (
                                    <div className="documentos-etiquetas-selector">
                                        {etiquetas.map((etiqueta) => {
                                            const activa = etiquetasSeleccionadas.includes(
                                                Number(etiqueta.idetiqueta)
                                            );

                                            return (
                                                <button
                                                    type="button"
                                                    key={etiqueta.idetiqueta}
                                                    className={`documentos-etiqueta-chip ${
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

                                <small className="documentos-help-text">
                                    Usa etiquetas para relacionar este documento con temas como
                                    soporte, sistema académico, seguridad informática o capacitación.
                                </small>
                            </div>

                            <div className="documentos-field span-2">
                                <label>Descripción</label>
                                <textarea
                                    name="descripcion"
                                    value={form.descripcion}
                                    onChange={handleChange}
                                    rows={5}
                                    placeholder="Describe brevemente el documento o manual."
                                    disabled={saving}
                                />
                            </div>

                            <label className="documentos-checkbox span-2">
                                <input
                                    type="checkbox"
                                    name="es_version_actual"
                                    checked={form.es_version_actual}
                                    onChange={handleChange}
                                    disabled={saving}
                                />
                                Es versión actual
                            </label>
                        </div>

                        <div className="documentos-form-actions">
                            <button
                                type="submit"
                                className="documentos-save-button"
                                disabled={saving || loadingCatalogs}
                            >
                                <Save size={17} />
                                {saving
                                    ? 'Guardando...'
                                    : isEditing
                                        ? 'Actualizar documento'
                                        : 'Guardar documento'}
                            </button>

                            <button
                                type="button"
                                className="documentos-cancel-button"
                                onClick={cerrarFormulario}
                                disabled={saving}
                            >
                                Cancelar
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="documentos-list-card">
                <div className="documentos-list-header">
                    <div>
                        <h2>Documentos registrados</h2>
                        <p>
                            Mostrando {pagination.from || 0} - {pagination.to || 0} de{' '}
                            {pagination.total} documentos.
                        </p>
                    </div>

                    <form className="documentos-filters" onSubmit={handleBuscar}>
                        <div className="documentos-search">
                            <Search size={17} />
                            <input
                                value={search}
                                onChange={handleSearchChange}
                                placeholder="Buscar documento..."
                                maxLength={MAX_SEARCH_LENGTH}
                            />
                        </div>

                        <select
                            value={categoriaFiltro}
                            onChange={(e) => setCategoriaFiltro(e.target.value)}
                            className="documentos-filter-select"
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
                            value={tipoDocumentoFiltro}
                            onChange={(e) => setTipoDocumentoFiltro(e.target.value)}
                            className="documentos-filter-select"
                            disabled={loadingCatalogs}
                        >
                            <option value="">Todos los tipos</option>
                            {tiposDocumento.map((tipo) => (
                                <option key={tipo.idtipodocumento} value={tipo.idtipodocumento}>
                                    {tipo.nombre}
                                </option>
                            ))}
                        </select>

                        <select
                            value={estadoFiltro}
                            onChange={(e) => setEstadoFiltro(e.target.value)}
                            className="documentos-filter-select"
                            disabled={loadingCatalogs}
                        >
                            <option value="">Todos los estados</option>
                            {estados.map((estado) => (
                                <option key={estado.idestado} value={estado.idestado}>
                                    {estado.nombre}
                                </option>
                            ))}
                        </select>

                        <button type="submit" className="documentos-filter-button">
                            Buscar
                        </button>

                        <button
                            type="button"
                            className="documentos-clear-button"
                            onClick={handleLimpiarFiltros}
                        >
                            Limpiar
                        </button>
                    </form>
                </div>

                {loading ? (
                    <p className="documentos-empty">Cargando documentos...</p>
                ) : documentos.length === 0 ? (
                    <div className="documentos-empty-box">
                        <h3>No hay documentos para mostrar</h3>
                        <p>Registra un documento o cambia los filtros de búsqueda.</p>
                    </div>
                ) : (
                    <div className="documentos-table-wrap">
                        <table className="documentos-table">
                            <thead>
                            <tr>
                                <th>Documento</th>
                                <th>Categoría</th>
                                <th>Tipo</th>
                                <th>Estado</th>
                                <th>Versión</th>
                                <th>Fecha</th>
                                <th>Archivo</th>
                                <th>Acciones</th>
                            </tr>
                            </thead>

                            <tbody>
                            {documentos.map((documento) => (
                                <tr key={documento.iddocumento}>
                                    <td>
                                        <div className="documentos-name">
                                                <span>
                                                    <FileText size={18} />
                                                </span>

                                            <div>
                                                <strong>{documento.titulo}</strong>
                                                <small>{recortarTexto(documento.descripcion, 90)}</small>
                                                <EtiquetasDocumento etiquetas={documento.etiquetas} />
                                            </div>
                                        </div>
                                    </td>

                                    <td>
                                            <span className="documentos-category">
                                                <Tag size={14} />
                                                {documento.categoria?.nombre || 'Sin categoría'}
                                            </span>
                                    </td>

                                    <td>
                                            <span className="documentos-type">
                                                <Layers size={14} />
                                                {documento.tipo_documento?.nombre ||
                                                    documento.tipoDocumento?.nombre ||
                                                    'Sin tipo'}
                                            </span>
                                    </td>

                                    <td>
                                            <span className="documentos-state">
                                                <ShieldCheck size={14} />
                                                {documento.estado?.nombre || 'Sin estado'}
                                            </span>
                                    </td>

                                    <td>
                                            <span className="documentos-version">
                                                v{documento.version || '1.0'}
                                            </span>

                                        {Boolean(Number(documento.es_version_actual)) && (
                                            <small className="documentos-current-version">
                                                Actual
                                            </small>
                                        )}
                                    </td>

                                    <td>{formatDateSimple(documento.fecha_documento)}</td>

                                    <td>
                                        {getDocumentoUrl(documento) !== '#' ? (
                                            <a
                                                className="documentos-file-link"
                                                href={getDocumentoUrl(documento)}
                                                target="_blank"
                                                rel="noreferrer"
                                                title={getArchivoNombre(documento)}
                                            >
                                                <Download size={15} />
                                                {getArchivoExtension(documento)}
                                            </a>
                                        ) : (
                                            '-'
                                        )}
                                    </td>

                                    <td>
                                        <div className="documentos-actions">
                                            <button
                                                type="button"
                                                onClick={() => handleViewDetail(documento)}
                                                title="Ver detalle"
                                            >
                                                <Eye size={16} />
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => handleEdit(documento)}
                                                title="Editar"
                                            >
                                                <Pencil size={16} />
                                            </button>

                                            <button
                                                type="button"
                                                className="danger"
                                                onClick={() => handleDelete(documento)}
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

                <div className="documentos-pagination">
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
                <div className="documentos-modal-overlay" role="dialog" aria-modal="true">
                    <div className="documentos-modal">
                        <div className="documentos-modal-header">
                            <div>
                                <span className="documentos-eyebrow">Detalle del documento</span>
                                <h2>
                                    {loadingDetail
                                        ? 'Cargando detalle...'
                                        : selectedDocumento?.titulo || 'Detalle'}
                                </h2>
                            </div>

                            <button
                                type="button"
                                className="documentos-close-button"
                                onClick={cerrarDetalle}
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {loadingDetail ? (
                            <p className="documentos-empty">Cargando detalle...</p>
                        ) : selectedDocumento ? (
                            <div className="documentos-detail">
                                <div className="documentos-detail-grid">
                                    <div>
                                        <span>Título</span>
                                        <strong>{selectedDocumento.titulo}</strong>
                                    </div>

                                    <div>
                                        <span>Slug</span>
                                        <strong>{selectedDocumento.slug || '-'}</strong>
                                    </div>

                                    <div>
                                        <span>Categoría</span>
                                        <strong>{selectedDocumento.categoria?.nombre || '-'}</strong>
                                    </div>

                                    <div>
                                        <span>Tipo</span>
                                        <strong>
                                            {selectedDocumento.tipo_documento?.nombre ||
                                                selectedDocumento.tipoDocumento?.nombre ||
                                                '-'}
                                        </strong>
                                    </div>

                                    <div>
                                        <span>Estado</span>
                                        <strong>{selectedDocumento.estado?.nombre || '-'}</strong>
                                    </div>

                                    <div>
                                        <span>Versión</span>
                                        <strong>{selectedDocumento.version || '1.0'}</strong>
                                    </div>

                                    <div>
                                        <span>Versión actual</span>
                                        <strong>
                                            {Boolean(Number(selectedDocumento.es_version_actual))
                                                ? 'Sí'
                                                : 'No'}
                                        </strong>
                                    </div>

                                    <div>
                                        <span>Fecha documento</span>
                                        <strong>
                                            {formatDateSimple(selectedDocumento.fecha_documento)}
                                        </strong>
                                    </div>

                                    <div>
                                        <span>Usuario subidor</span>
                                        <strong>
                                            {selectedDocumento.usuario_subidor?.nombre_completo ||
                                                selectedDocumento.usuarioSubidor?.nombre_completo ||
                                                selectedDocumento.usuario_subidor?.email ||
                                                selectedDocumento.usuarioSubidor?.email ||
                                                '-'}
                                        </strong>
                                    </div>

                                    <div>
                                        <span>Archivo</span>
                                        {getDocumentoUrl(selectedDocumento) !== '#' ? (
                                            <a
                                                href={getDocumentoUrl(selectedDocumento)}
                                                target="_blank"
                                                rel="noreferrer"
                                            >
                                                Descargar / ver archivo
                                            </a>
                                        ) : (
                                            <strong>-</strong>
                                        )}
                                    </div>
                                </div>

                                <div className="documentos-detail-content">
                                    <h3>Etiquetas</h3>
                                    <EtiquetasDocumento etiquetas={selectedDocumento.etiquetas} />
                                    {(!Array.isArray(selectedDocumento.etiquetas) ||
                                        selectedDocumento.etiquetas.length === 0) && (
                                        <p>Sin etiquetas registradas.</p>
                                    )}
                                </div>

                                <div className="documentos-detail-content">
                                    <h3>Descripción</h3>
                                    <p>
                                        {selectedDocumento.descripcion ||
                                            'Sin descripción registrada.'}
                                    </p>
                                </div>

                                {getArchivo(selectedDocumento) && (
                                    <div className="documentos-detail-content">
                                        <h3>Metadatos del archivo</h3>
                                        <p>
                                            <strong>Nombre:</strong>{' '}
                                            {getArchivoNombre(selectedDocumento)}
                                        </p>
                                        <p>
                                            <strong>Extensión:</strong>{' '}
                                            {getArchivoExtension(selectedDocumento)}
                                        </p>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <p className="documentos-empty">No se pudo cargar el detalle.</p>
                        )}
                    </div>
                </div>
            )}
        </section>
    );
}

function EtiquetasDocumento({ etiquetas = [] }) {
    if (!Array.isArray(etiquetas) || etiquetas.length === 0) {
        return null;
    }

    return (
        <div className="documentos-etiquetas-list">
            {etiquetas.map((etiqueta) => (
                <span
                    key={etiqueta.idetiqueta}
                    className="documentos-etiqueta-badge"
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

function formatDateSimple(value) {
    if (!value) return '-';

    const text = normalizeDateInput(value);

    if (!text) return '-';

    const date = new Date(`${text}T00:00:00`);

    if (Number.isNaN(date.getTime())) {
        return '-';
    }

    return date.toLocaleDateString('es-PE', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    });
}