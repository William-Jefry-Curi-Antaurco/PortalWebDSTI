import { useEffect, useMemo, useState } from 'react';
import {
    MonitorCog,
    Plus,
    X,
    Pencil,
    Trash2,
    Save,
    Search,
    Power,
    PowerOff,
    Eye,
    ExternalLink,
    Link as LinkIcon,
    Tag,
    Tags,
    Activity,
} from 'lucide-react';

import {
    actualizarSistemaInstitucional,
    crearSistemaInstitucional,
    eliminarSistemaInstitucional,
    listarCategorias,
    listarEstadosOperativos,
    listarSistemasInstitucionales,
    obtenerSistemaInstitucional,
} from '../api/sistemasInstitucionalesApi';

import { listarEtiquetas } from '../api/etiquetasApi';

import {
    closeNotify,
    getApiErrorMessage,
    notifyError,
    notifyLoading,
    notifySuccess,
} from '../utils/notify';

import '../styles/modules/sistemasInstitucionales.css';

const initialForm = {
    nombre_sistema: '',
    descripcion: '',
    url: '',
    icono: '',
    idcategoria: '',
    idestadooperativo: '',
    orden: 0,
    activo: true,
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

const MAX_NOMBRE_LENGTH = 100;
const MAX_URL_LENGTH = 255;
const MAX_ICONO_LENGTH = 100;
const MAX_SEARCH_LENGTH = 120;
const MAX_ORDEN = 255;

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
    if (!value) return false;

    try {
        const url = new URL(value);
        return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
        return false;
    }
};

const getEtiquetasIds = (items = []) => {
    if (!Array.isArray(items)) return [];

    return items
        .map((item) =>
            typeof item === 'object'
                ? Number(item.idetiqueta)
                : Number(item)
        )
        .filter((id) => Number.isFinite(id));
};

const MODULO_SISTEMAS_SLUG = 'sistemas-institucionales';

function normalize(text) {
    return String(text || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '')
        .trim();
}

function filtrarCategoriasSistemas(categorias = []) {
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
                return moduloSlug === MODULO_SISTEMAS_SLUG;
            }

            const moduloNombre = normalize(
                item?.modulo?.nombre ||
                item?.nombre_modulo ||
                ''
            );

            if (moduloNombre) {
                return (
                    moduloNombre.includes('sistema') ||
                    moduloNombre.includes('institucional')
                );
            }

            const nombre = normalize(item?.nombre);
            const slug = normalize(item?.slug);

            return [
                'academico',
                'académico',
                'administrativo',
                'biblioteca',
                'mesa',
                'partes',
                'intranet',
                'estadistico',
                'estadístico',
                'sistema',
                'institucional',
            ].some((key) => nombre.includes(normalize(key)) || slug.includes(normalize(key)));
        })
        .sort((a, b) => Number(a.orden || 0) - Number(b.orden || 0));
}


export default function SistemasInstitucionales() {
    const [sistemas, setSistemas] = useState([]);
    const [categorias, setCategorias] = useState([]);
    const [estadosOperativos, setEstadosOperativos] = useState([]);
    const [etiquetas, setEtiquetas] = useState([]);
    const [pagination, setPagination] = useState(initialPagination);

    const [form, setForm] = useState(initialForm);
    const [editingId, setEditingId] = useState(null);
    const [selectedSistema, setSelectedSistema] = useState(null);

    const [showForm, setShowForm] = useState(false);
    const [showDetail, setShowDetail] = useState(false);

    const [loading, setLoading] = useState(true);
    const [loadingCatalogs, setLoadingCatalogs] = useState(false);
    const [saving, setSaving] = useState(false);
    const [loadingDetail, setLoadingDetail] = useState(false);

    const [search, setSearch] = useState('');
    const [estadoFiltro, setEstadoFiltro] = useState('');
    const [categoriaFiltro, setCategoriaFiltro] = useState('');
    const [estadoOperativoFiltro, setEstadoOperativoFiltro] = useState('');

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
            const [categoriasResponse, estadosResponse, etiquetasResponse] =
                await Promise.all([
                    listarCategorias({ activo: 1 }),
                    listarEstadosOperativos({ activo: 1 }),
                    listarEtiquetas(),
                ]);

            const categoriasNormalizadas = normalizarCatalogo(categoriasResponse);

            setCategorias(filtrarCategoriasSistemas(categoriasNormalizadas));


            setEstadosOperativos(normalizarCatalogo(estadosResponse));

            setEtiquetas(
                normalizarCatalogo(etiquetasResponse).filter(
                    (item) => Number(item?.activo ?? 1) === 1
                )
            );
        } catch (err) {
            notifyError(
                getApiErrorMessage(
                    err,
                    'No se pudieron cargar las categorías, estados operativos o etiquetas.'
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
                activo: estadoFiltro === '' ? undefined : estadoFiltro,
                idcategoria: categoriaFiltro || undefined,
                idestadooperativo: estadoOperativoFiltro || undefined,
            };

            Object.keys(params).forEach((key) => {
                if (params[key] === undefined || params[key] === '') {
                    delete params[key];
                }
            });

            const response = await listarSistemasInstitucionales(params);
            const { items, pagination: meta } =
                normalizarRespuestaPaginada(response);

            setSistemas(items);
            setPagination(meta);
        } catch (err) {
            notifyError(
                getApiErrorMessage(
                    err,
                    'No se pudieron cargar los sistemas institucionales.'
                )
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
        const { name, value, type, checked } = e.target;

        if (name === 'orden') {
            if (value !== '' && !/^\d+$/.test(value)) return;

            const numberValue = Number(value);

            if (value !== '' && numberValue > MAX_ORDEN) return;

            setForm({
                ...form,
                orden: value,
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
        const nombre = form.nombre_sistema.trim();
        const descripcion = form.descripcion.trim();
        const url = form.url.trim();
        const icono = form.icono.trim();
        const orden = Number(form.orden);

        if (!nombre) {
            notifyError('El nombre del sistema es obligatorio.');
            return false;
        }

        if (nombre.length < 3) {
            notifyError('El nombre del sistema debe tener al menos 3 caracteres.');
            return false;
        }

        if (nombre.length > MAX_NOMBRE_LENGTH) {
            notifyError(`El nombre del sistema no debe superar los ${MAX_NOMBRE_LENGTH} caracteres.`);
            return false;
        }

        if (!url) {
            notifyError('La URL del sistema es obligatoria.');
            return false;
        }

        if (url.length > MAX_URL_LENGTH) {
            notifyError(`La URL del sistema no debe superar los ${MAX_URL_LENGTH} caracteres.`);
            return false;
        }

        if (!isValidUrl(url)) {
            notifyError('La URL del sistema debe iniciar con http:// o https://.');
            return false;
        }

        if (icono && icono.length > MAX_ICONO_LENGTH) {
            notifyError(`El ícono no debe superar los ${MAX_ICONO_LENGTH} caracteres.`);
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
            notifyError('Seleccione una categoría válida para sistemas institucionales.');
            return false;
        }

        if (!form.idestadooperativo) {
            notifyError('Debe seleccionar un estado operativo.');
            return false;
        }

        if (!isPositiveOrZeroInteger(form.orden)) {
            notifyError('El orden debe ser un número entero entre 0 y 255.');
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

        return true;
    };

    const buildPayload = () => ({
        nombre_sistema: form.nombre_sistema.trim(),
        descripcion: form.descripcion.trim(),
        url: form.url.trim(),
        icono: form.icono.trim(),
        idcategoria: Number(form.idcategoria),
        idestadooperativo: Number(form.idestadooperativo),
        orden: Number(form.orden || 0),
        activo: form.activo ? 1 : 0,
        etiquetas: getEtiquetasIds(form.etiquetas),
    });

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validarFormulario()) return;

        setSaving(true);

        const toastId = notifyLoading(
            isEditing
                ? 'Actualizando sistema institucional...'
                : 'Registrando sistema institucional...'
        );

        try {
            const payload = buildPayload();

            if (isEditing) {
                await actualizarSistemaInstitucional(editingId, payload);
                notifySuccess('Sistema institucional actualizado correctamente.');
            } else {
                await crearSistemaInstitucional(payload);
                notifySuccess('Sistema institucional registrado correctamente.');
            }

            cerrarFormulario();
            await cargarDatos(pagination.current_page);
        } catch (err) {
            notifyError(
                getApiErrorMessage(
                    err,
                    'No se pudo guardar el sistema institucional.'
                )
            );
        } finally {
            closeNotify(toastId);
            setSaving(false);
        }
    };

    const handleEdit = (sistema) => {
        setEditingId(sistema.idenlace);
        setShowForm(true);

        setForm({
            nombre_sistema: sistema.nombre_sistema || '',
            descripcion: sistema.descripcion || '',
            url: sistema.url || '',
            icono: sistema.icono || '',
            idcategoria: sistema.idcategoria ? String(sistema.idcategoria) : '',
            idestadooperativo: sistema.idestadooperativo
                ? String(sistema.idestadooperativo)
                : '',
            orden: sistema.orden ?? 0,
            activo: Boolean(Number(sistema.activo)),
            etiquetas: Array.isArray(sistema.etiquetas)
                ? sistema.etiquetas.map((item) => Number(item.idetiqueta))
                : [],
        });

        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = async (sistema) => {
        if (!sistema.idenlace) {
            notifyError('No se encontró el identificador del sistema.');
            return;
        }

        const ok = confirm(
            `¿Eliminar el sistema institucional "${sistema.nombre_sistema}"?\n\nEsta acción no se puede deshacer.`
        );

        if (!ok) return;

        const toastId = notifyLoading('Eliminando sistema institucional...');

        try {
            await eliminarSistemaInstitucional(sistema.idenlace);

            notifySuccess('Sistema institucional eliminado correctamente.');

            const nextPage =
                sistemas.length === 1 && pagination.current_page > 1
                    ? pagination.current_page - 1
                    : pagination.current_page;

            await cargarDatos(nextPage);
        } catch (err) {
            notifyError(
                getApiErrorMessage(
                    err,
                    'No se pudo eliminar el sistema institucional.'
                )
            );
        } finally {
            closeNotify(toastId);
        }
    };

    const handleToggleActivo = async (sistema) => {
        if (!sistema.idenlace) {
            notifyError('No se encontró el identificador del sistema.');
            return;
        }

        if (
            !sistema.nombre_sistema ||
            !sistema.url ||
            !sistema.idcategoria ||
            !sistema.idestadooperativo
        ) {
            notifyError('El sistema no tiene datos completos para cambiar su estado.');
            return;
        }

        const nuevoEstado = !Boolean(Number(sistema.activo));

        const payload = {
            nombre_sistema: sistema.nombre_sistema,
            descripcion: sistema.descripcion || '',
            url: sistema.url,
            icono: sistema.icono || '',
            idcategoria: Number(sistema.idcategoria),
            idestadooperativo: Number(sistema.idestadooperativo),
            orden: Number(sistema.orden || 0),
            activo: nuevoEstado ? 1 : 0,
            etiquetas: getEtiquetasIds(sistema.etiquetas),
        };

        const toastId = notifyLoading(
            nuevoEstado
                ? 'Activando sistema institucional...'
                : 'Desactivando sistema institucional...'
        );

        try {
            await actualizarSistemaInstitucional(sistema.idenlace, payload);

            notifySuccess(
                nuevoEstado
                    ? 'Sistema institucional activado correctamente.'
                    : 'Sistema institucional desactivado correctamente.'
            );

            await cargarDatos(pagination.current_page);
        } catch (err) {
            notifyError(
                getApiErrorMessage(
                    err,
                    'No se pudo cambiar el estado del sistema institucional.'
                )
            );
        } finally {
            closeNotify(toastId);
        }
    };

    const handleViewDetail = async (sistema) => {
        setShowDetail(true);
        setLoadingDetail(true);
        setSelectedSistema(null);

        try {
            const response = await obtenerSistemaInstitucional(sistema.idenlace);
            setSelectedSistema(response?.data || sistema);
        } catch (err) {
            notifyError(
                getApiErrorMessage(
                    err,
                    'No se pudo obtener el detalle del sistema institucional.'
                )
            );
            setShowDetail(false);
        } finally {
            setLoadingDetail(false);
        }
    };

    const cerrarDetalle = () => {
        setShowDetail(false);
        setSelectedSistema(null);
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
        setEstadoFiltro('');
        setCategoriaFiltro('');
        setEstadoOperativoFiltro('');

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
        <section className="sistemas-page">
            <div className="sistemas-header">
                <div>
                    <span className="sistemas-eyebrow">
                        Gestión de accesos institucionales
                    </span>
                    <h1>Sistemas institucionales</h1>
                    <p>
                        Administra los enlaces a sistemas académicos, administrativos y
                        tecnológicos, junto con su categoría, estado operativo, etiquetas y
                        disponibilidad.
                    </p>
                </div>

                {!showForm && (
                    <button
                        type="button"
                        className="sistemas-add-button"
                        onClick={abrirFormularioCrear}
                        disabled={loading || loadingCatalogs}
                    >
                        <Plus size={18} />
                        Agregar sistema
                    </button>
                )}
            </div>

            {showForm && (
                <div className="sistemas-form-card">
                    <div className="sistemas-form-header">
                        <div>
                            <h2>
                                {isEditing
                                    ? 'Editar sistema institucional'
                                    : 'Agregar sistema institucional'}
                            </h2>
                            <p>
                                Completa los datos del sistema. El slug se genera
                                automáticamente desde el backend.
                            </p>
                        </div>

                        <button
                            type="button"
                            className="sistemas-close-button"
                            onClick={cerrarFormulario}
                            disabled={saving}
                        >
                            <X size={18} />
                        </button>
                    </div>

                    <form className="sistemas-form" onSubmit={handleSubmit}>
                        <div className="sistemas-form-grid">
                            <div className="sistemas-field">
                                <label>Nombre del sistema</label>
                                <input
                                    name="nombre_sistema"
                                    value={form.nombre_sistema}
                                    onChange={handleChange}
                                    maxLength={MAX_NOMBRE_LENGTH}
                                    placeholder="Ej. Sistema Académico"
                                    required
                                    disabled={saving}
                                />
                            </div>

                            <div className="sistemas-field">
                                <label>URL del sistema</label>
                                <input
                                    name="url"
                                    value={form.url}
                                    onChange={handleChange}
                                    maxLength={MAX_URL_LENGTH}
                                    placeholder="https://..."
                                    required
                                    disabled={saving}
                                />
                            </div>

                            <div className="sistemas-field">
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

                            <div className="sistemas-field">
                                <label>Estado operativo</label>
                                <select
                                    name="idestadooperativo"
                                    value={form.idestadooperativo}
                                    onChange={handleChange}
                                    required
                                    disabled={saving || loadingCatalogs}
                                >
                                    <option value="">Seleccione un estado operativo</option>
                                    {estadosOperativos.map((estado) => (
                                        <option
                                            key={estado.idestadooperativo}
                                            value={estado.idestadooperativo}
                                        >
                                            {estado.nombre}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="sistemas-field">
                                <label>Ícono</label>
                                <input
                                    name="icono"
                                    value={form.icono}
                                    onChange={handleChange}
                                    maxLength={MAX_ICONO_LENGTH}
                                    placeholder="Ej. monitor, server, link"
                                    disabled={saving}
                                />
                            </div>

                            <div className="sistemas-field">
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

                            <div className="sistemas-field span-2">
                                <div className="sistemas-etiquetas-header">
                                    <label>Etiquetas</label>

                                    <div className="sistemas-etiquetas-actions">
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
                                    <div className="sistemas-etiquetas-selected">
                                        <strong>Seleccionadas:</strong>

                                        <div className="sistemas-etiquetas-selected-list">
                                            {etiquetasActivasSeleccionadas.map((etiqueta) => (
                                                <button
                                                    type="button"
                                                    key={etiqueta.idetiqueta}
                                                    className="sistemas-etiqueta-selected"
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
                                    <small className="sistemas-help-text">
                                        No hay etiquetas activas registradas.
                                    </small>
                                ) : (
                                    <div className="sistemas-etiquetas-selector">
                                        {etiquetas.map((etiqueta) => {
                                            const activa = etiquetasSeleccionadas.includes(
                                                Number(etiqueta.idetiqueta)
                                            );

                                            return (
                                                <button
                                                    type="button"
                                                    key={etiqueta.idetiqueta}
                                                    className={`sistemas-etiqueta-chip ${
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

                                <small className="sistemas-help-text">
                                    Usa etiquetas para relacionar este sistema con sistema
                                    académico, biblioteca virtual, mesa de partes, soporte,
                                    correo institucional, seguridad informática, DSTI o UNASAM.
                                </small>
                            </div>

                            <div className="sistemas-field span-2">
                                <label>Descripción</label>
                                <textarea
                                    name="descripcion"
                                    value={form.descripcion}
                                    onChange={handleChange}
                                    rows={5}
                                    placeholder="Describe brevemente el sistema institucional."
                                    disabled={saving}
                                />
                            </div>

                            <label className="sistemas-checkbox span-2">
                                <input
                                    type="checkbox"
                                    name="activo"
                                    checked={form.activo}
                                    onChange={handleChange}
                                    disabled={saving}
                                />
                                Sistema activo
                            </label>
                        </div>

                        <div className="sistemas-form-actions">
                            <button
                                type="submit"
                                className="sistemas-save-button"
                                disabled={saving || loadingCatalogs}
                            >
                                <Save size={17} />
                                {saving
                                    ? 'Guardando...'
                                    : isEditing
                                        ? 'Actualizar sistema'
                                        : 'Guardar sistema'}
                            </button>

                            <button
                                type="button"
                                className="sistemas-cancel-button"
                                onClick={cerrarFormulario}
                                disabled={saving}
                            >
                                Cancelar
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="sistemas-list-card">
                <div className="sistemas-list-header">
                    <div>
                        <h2>Sistemas registrados</h2>
                        <p>
                            Mostrando {pagination.from || 0} - {pagination.to || 0} de{' '}
                            {pagination.total} sistemas.
                        </p>
                    </div>

                    <form className="sistemas-filters" onSubmit={handleBuscar}>
                        <div className="sistemas-search">
                            <Search size={17} />
                            <input
                                value={search}
                                onChange={handleSearchChange}
                                placeholder="Buscar sistema..."
                                maxLength={MAX_SEARCH_LENGTH}
                            />
                        </div>

                        <select
                            value={categoriaFiltro}
                            onChange={(e) => setCategoriaFiltro(e.target.value)}
                            className="sistemas-filter-select"
                            disabled={loadingCatalogs}
                        >
                            <option value="">Todas las categorías</option>
                            {categorias.map((categoria) => (
                                <option
                                    key={categoria.idcategoria}
                                    value={categoria.idcategoria}
                                >
                                    {categoria.nombre}
                                </option>
                            ))}
                        </select>

                        <select
                            value={estadoOperativoFiltro}
                            onChange={(e) =>
                                setEstadoOperativoFiltro(e.target.value)
                            }
                            className="sistemas-filter-select"
                            disabled={loadingCatalogs}
                        >
                            <option value="">Todos los estados operativos</option>
                            {estadosOperativos.map((estado) => (
                                <option
                                    key={estado.idestadooperativo}
                                    value={estado.idestadooperativo}
                                >
                                    {estado.nombre}
                                </option>
                            ))}
                        </select>

                        <select
                            value={estadoFiltro}
                            onChange={(e) => setEstadoFiltro(e.target.value)}
                            className="sistemas-filter-select"
                        >
                            <option value="">Todos</option>
                            <option value="1">Activos</option>
                            <option value="0">Inactivos</option>
                        </select>

                        <button type="submit" className="sistemas-filter-button">
                            Buscar
                        </button>

                        <button
                            type="button"
                            className="sistemas-clear-button"
                            onClick={handleLimpiarFiltros}
                        >
                            Limpiar
                        </button>
                    </form>
                </div>

                {loading ? (
                    <p className="sistemas-empty">
                        Cargando sistemas institucionales...
                    </p>
                ) : sistemas.length === 0 ? (
                    <div className="sistemas-empty-box">
                        <h3>No hay sistemas para mostrar</h3>
                        <p>Registra un sistema o cambia los filtros de búsqueda.</p>
                    </div>
                ) : (
                    <div className="sistemas-table-wrap">
                        <table className="sistemas-table">
                            <thead>
                            <tr>
                                <th>Sistema</th>
                                <th>Categoría</th>
                                <th>Estado operativo</th>
                                <th>URL</th>
                                <th>Orden</th>
                                <th>Estado</th>
                                <th>Acciones</th>
                            </tr>
                            </thead>

                            <tbody>
                            {sistemas.map((sistema) => {
                                const activo = Boolean(Number(sistema.activo));

                                return (
                                    <tr key={sistema.idenlace}>
                                        <td>
                                            <div className="sistemas-name">
                                                    <span>
                                                        <MonitorCog size={18} />
                                                    </span>

                                                <div>
                                                    <strong>
                                                        {sistema.nombre_sistema}
                                                    </strong>
                                                    <small>
                                                        {recortarTexto(
                                                            sistema.descripcion,
                                                            90
                                                        )}
                                                    </small>

                                                    <EtiquetasSistema
                                                        etiquetas={sistema.etiquetas}
                                                    />
                                                </div>
                                            </div>
                                        </td>

                                        <td>
                                                <span className="sistemas-category">
                                                    <Tag size={14} />
                                                    {sistema.categoria?.nombre ||
                                                        'Sin categoría'}
                                                </span>
                                        </td>

                                        <td>
                                                <span className="sistemas-operational">
                                                    <Activity size={14} />
                                                    {sistema.estado_operativo?.nombre ||
                                                        sistema.estadoOperativo?.nombre ||
                                                        'Sin estado'}
                                                </span>
                                        </td>

                                        <td>
                                            <a
                                                className="sistemas-link"
                                                href={sistema.url}
                                                target="_blank"
                                                rel="noreferrer"
                                                title={sistema.url}
                                            >
                                                <ExternalLink size={15} />
                                                Abrir
                                            </a>
                                        </td>

                                        <td>{sistema.orden ?? 0}</td>

                                        <td>
                                                <span
                                                    className={
                                                        activo
                                                            ? 'sistemas-status active'
                                                            : 'sistemas-status inactive'
                                                    }
                                                >
                                                    {activo ? 'Activo' : 'Inactivo'}
                                                </span>
                                        </td>

                                        <td>
                                            <div className="sistemas-actions">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        handleViewDetail(sistema)
                                                    }
                                                    title="Ver detalle"
                                                >
                                                    <Eye size={16} />
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        handleToggleActivo(sistema)
                                                    }
                                                    title={
                                                        activo
                                                            ? 'Desactivar'
                                                            : 'Activar'
                                                    }
                                                >
                                                    {activo ? (
                                                        <PowerOff size={16} />
                                                    ) : (
                                                        <Power size={16} />
                                                    )}
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        handleEdit(sistema)
                                                    }
                                                    title="Editar"
                                                >
                                                    <Pencil size={16} />
                                                </button>

                                                <button
                                                    type="button"
                                                    className="danger"
                                                    onClick={() =>
                                                        handleDelete(sistema)
                                                    }
                                                    title="Eliminar"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                            </tbody>
                        </table>
                    </div>
                )}

                <div className="sistemas-pagination">
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
                <div
                    className="sistemas-modal-overlay"
                    role="dialog"
                    aria-modal="true"
                >
                    <div className="sistemas-modal">
                        <div className="sistemas-modal-header">
                            <div>
                                <span className="sistemas-eyebrow">
                                    Detalle del sistema
                                </span>
                                <h2>
                                    {loadingDetail
                                        ? 'Cargando detalle...'
                                        : selectedSistema?.nombre_sistema ||
                                        'Detalle'}
                                </h2>
                            </div>

                            <button
                                type="button"
                                className="sistemas-close-button"
                                onClick={cerrarDetalle}
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {loadingDetail ? (
                            <p className="sistemas-empty">Cargando detalle...</p>
                        ) : selectedSistema ? (
                            <div className="sistemas-detail">
                                <div className="sistemas-detail-grid">
                                    <div>
                                        <span>Nombre</span>
                                        <strong>
                                            {selectedSistema.nombre_sistema}
                                        </strong>
                                    </div>

                                    <div>
                                        <span>Slug</span>
                                        <strong>{selectedSistema.slug || '-'}</strong>
                                    </div>

                                    <div>
                                        <span>Categoría</span>
                                        <strong>
                                            {selectedSistema.categoria?.nombre ||
                                                'Sin categoría'}
                                        </strong>
                                    </div>

                                    <div>
                                        <span>Estado operativo</span>
                                        <strong>
                                            {selectedSistema.estado_operativo
                                                    ?.nombre ||
                                                selectedSistema.estadoOperativo
                                                    ?.nombre ||
                                                'Sin estado'}
                                        </strong>
                                    </div>

                                    <div>
                                        <span>Ícono</span>
                                        <strong>{selectedSistema.icono || '-'}</strong>
                                    </div>

                                    <div>
                                        <span>Orden</span>
                                        <strong>{selectedSistema.orden ?? 0}</strong>
                                    </div>

                                    <div>
                                        <span>Estado</span>
                                        <strong>
                                            {Boolean(Number(selectedSistema.activo))
                                                ? 'Activo'
                                                : 'Inactivo'}
                                        </strong>
                                    </div>

                                    <div>
                                        <span>URL</span>
                                        <a
                                            href={selectedSistema.url}
                                            target="_blank"
                                            rel="noreferrer"
                                        >
                                            Abrir sistema
                                        </a>
                                    </div>
                                </div>

                                <div className="sistemas-detail-content">
                                    <h3>Etiquetas</h3>

                                    <EtiquetasSistema
                                        etiquetas={selectedSistema.etiquetas}
                                    />

                                    {(!Array.isArray(selectedSistema.etiquetas) ||
                                        selectedSistema.etiquetas.length === 0) && (
                                        <p>Sin etiquetas registradas.</p>
                                    )}
                                </div>

                                <div className="sistemas-detail-content">
                                    <h3>Descripción</h3>
                                    <p>
                                        {selectedSistema.descripcion ||
                                            'Sin descripción registrada.'}
                                    </p>
                                </div>

                                <div className="sistemas-detail-links">
                                    <a
                                        href={selectedSistema.url}
                                        target="_blank"
                                        rel="noreferrer"
                                    >
                                        <LinkIcon size={16} />
                                        Abrir enlace institucional
                                    </a>
                                </div>
                            </div>
                        ) : (
                            <p className="sistemas-empty">
                                No se pudo cargar el detalle.
                            </p>
                        )}
                    </div>
                </div>
            )}
        </section>
    );
}

function EtiquetasSistema({ etiquetas = [] }) {
    if (!Array.isArray(etiquetas) || etiquetas.length === 0) {
        return null;
    }

    return (
        <div className="sistemas-etiquetas-list">
            {etiquetas.map((etiqueta) => (
                <span
                    key={etiqueta.idetiqueta}
                    className="sistemas-etiqueta-badge"
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