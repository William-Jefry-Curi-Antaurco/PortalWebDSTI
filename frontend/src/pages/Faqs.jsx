import { useEffect, useMemo, useState } from 'react';
import {
    HelpCircle,
    Plus,
    X,
    Pencil,
    Trash2,
    Save,
    Search,
    Eye,
    Tag,
    ShieldCheck,
    UserRound,
    ThumbsUp,
    ListOrdered,
} from 'lucide-react';

import {
    actualizarFaq,
    crearFaq,
    eliminarFaq,
    listarCategorias,
    listarEstados,
    listarFaqs,
    obtenerFaq,
} from '../api/faqsApi';

import {
    closeNotify,
    getApiErrorMessage,
    notifyError,
    notifyLoading,
    notifySuccess,
} from '../utils/notify';

import ConPermiso from '../components/ConPermiso';

import '../styles/modules/faqs.css';

const initialForm = {
    pregunta: '',
    respuesta: '',
    orden: 0,
    veces_util: 0,
    idcategoria: '',
    idestado: '',
};

const initialPagination = {
    current_page: 1,
    last_page: 1,
    per_page: 10,
    total: 0,
    from: 0,
    to: 0,
};

const MAX_PREGUNTA_LENGTH = 255;
const MAX_SEARCH_LENGTH = 120;
const MAX_ORDEN = 65535;

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


const MODULO_FAQS_SLUG = 'faqs';

const ESTADOS_FAQS_PERMITIDOS = [
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

function filtrarCategoriasFaqs(categorias = []) {
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
                return moduloSlug === MODULO_FAQS_SLUG;
            }

            const moduloNombre = normalize(
                item?.modulo?.nombre ||
                item?.nombre_modulo ||
                ''
            );

            if (moduloNombre) {
                return (
                    moduloNombre.includes('faq') ||
                    moduloNombre.includes('pregunta') ||
                    moduloNombre.includes('frecuente') ||
                    moduloNombre.includes('ayuda')
                );
            }

            const nombre = normalize(item?.nombre);
            const slug = normalize(item?.slug);

            return [
                'faq',
                'faqs',
                'pregunta',
                'preguntas',
                'frecuente',
                'frecuentes',
                'ayuda',
                'soporte',
                'consulta',
                'consultas',
                'acceso',
                'cuenta',
                'correo',
                'sistema',
            ].some((key) => nombre.includes(key) || slug.includes(key));
        })
        .sort((a, b) => Number(a.orden || 0) - Number(b.orden || 0));
}

function filtrarEstadosFaqs(estados = []) {
    const permitidos = ESTADOS_FAQS_PERMITIDOS.map(normalize);

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

export default function Faqs() {
    const [faqs, setFaqs] = useState([]);
    const [categorias, setCategorias] = useState([]);
    const [estados, setEstados] = useState([]);
    const [pagination, setPagination] = useState(initialPagination);

    const [form, setForm] = useState(initialForm);
    const [editingId, setEditingId] = useState(null);
    const [selectedFaq, setSelectedFaq] = useState(null);

    const [showForm, setShowForm] = useState(false);
    const [showDetail, setShowDetail] = useState(false);

    const [loading, setLoading] = useState(true);
    const [loadingCatalogs, setLoadingCatalogs] = useState(false);
    const [saving, setSaving] = useState(false);
    const [loadingDetail, setLoadingDetail] = useState(false);

    const [search, setSearch] = useState('');
    const [categoriaFiltro, setCategoriaFiltro] = useState('');
    const [estadoFiltro, setEstadoFiltro] = useState('');

    const isEditing = useMemo(() => Boolean(editingId), [editingId]);

    const cargarCatalogos = async () => {
        setLoadingCatalogs(true);

        try {
            const [categoriasResponse, estadosResponse] = await Promise.all([
                listarCategorias({ activo: 1 }),
                listarEstados(),
            ]);

            const categoriasNormalizadas = normalizarCatalogo(categoriasResponse);
            const estadosNormalizados = normalizarCatalogo(estadosResponse);

            setCategorias(filtrarCategoriasFaqs(categoriasNormalizadas));
            setEstados(filtrarEstadosFaqs(estadosNormalizados));
        } catch (err) {
            notifyError(
                getApiErrorMessage(err, 'No se pudieron cargar las categorías o estados.')
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
            };

            Object.keys(params).forEach((key) => {
                if (params[key] === undefined || params[key] === '') {
                    delete params[key];
                }
            });

            const response = await listarFaqs(params);
            const { items, pagination: meta } = normalizarRespuestaPaginada(response);

            setFaqs(items);
            setPagination(meta);
        } catch (err) {
            notifyError(
                getApiErrorMessage(err, 'No se pudieron cargar las preguntas frecuentes.')
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
        const { name, value } = e.target;

        if (['orden', 'veces_util'].includes(name)) {
            if (value !== '' && !/^\d+$/.test(value)) return;

            if (name === 'orden' && value !== '' && Number(value) > MAX_ORDEN) return;

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

    const handleSearchChange = (e) => {
        const value = e.target.value;

        if (value.length > MAX_SEARCH_LENGTH) return;

        setSearch(value);
    };

    const validarFormulario = () => {
        const pregunta = form.pregunta.trim();
        const respuesta = form.respuesta.trim();
        const orden = form.orden === '' ? 0 : Number(form.orden);
        const vecesUtil = form.veces_util === '' ? 0 : Number(form.veces_util);

        if (!pregunta) {
            notifyError('La pregunta es obligatoria.');
            return false;
        }

        if (pregunta.length < 5) {
            notifyError('La pregunta debe tener al menos 5 caracteres.');
            return false;
        }

        if (pregunta.length > MAX_PREGUNTA_LENGTH) {
            notifyError(`La pregunta no debe superar los ${MAX_PREGUNTA_LENGTH} caracteres.`);
            return false;
        }

        if (!respuesta) {
            notifyError('La respuesta es obligatoria.');
            return false;
        }

        if (respuesta.length < 5) {
            notifyError('La respuesta debe tener al menos 5 caracteres.');
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
            notifyError('Seleccione una categoría válida para preguntas frecuentes.');
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
            notifyError('Seleccione un estado válido para preguntas frecuentes.');
            return false;
        }

        if (!isPositiveOrZeroInteger(form.orden)) {
            notifyError('El orden debe ser un número entero no negativo.');
            return false;
        }

        if (!isPositiveOrZeroInteger(form.veces_util)) {
            notifyError('Las veces útil deben ser un número entero no negativo.');
            return false;
        }

        if (Number.isNaN(orden) || orden < 0 || orden > MAX_ORDEN) {
            notifyError('El orden debe estar en un rango válido.');
            return false;
        }

        if (Number.isNaN(vecesUtil) || vecesUtil < 0) {
            notifyError('Las veces útil deben ser un número mayor o igual a cero.');
            return false;
        }

        return true;
    };

    const buildPayload = () => {
        const payload = {
            pregunta: form.pregunta.trim(),
            respuesta: form.respuesta.trim(),
            orden: form.orden === '' ? 0 : Number(form.orden),
            idcategoria: Number(form.idcategoria),
            idestado: Number(form.idestado),
        };

        if (isEditing) {
            payload.veces_util = form.veces_util === '' ? 0 : Number(form.veces_util);
        }

        return payload;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validarFormulario()) return;

        setSaving(true);

        const toastId = notifyLoading(
            isEditing ? 'Actualizando pregunta frecuente...' : 'Registrando pregunta frecuente...'
        );

        try {
            const payload = buildPayload();

            if (isEditing) {
                await actualizarFaq(editingId, payload);
                notifySuccess('Pregunta frecuente actualizada correctamente.');
            } else {
                await crearFaq(payload);
                notifySuccess('Pregunta frecuente registrada correctamente.');
            }

            cerrarFormulario();
            await cargarDatos(pagination.current_page);
        } catch (err) {
            notifyError(
                getApiErrorMessage(err, 'No se pudo guardar la pregunta frecuente.')
            );
        } finally {
            closeNotify(toastId);
            setSaving(false);
        }
    };

    const handleEdit = (faq) => {
        setEditingId(faq.idfaq);
        setShowForm(true);

        setForm({
            pregunta: faq.pregunta || '',
            respuesta: faq.respuesta || '',
            orden: faq.orden ?? 0,
            veces_util: faq.veces_util ?? 0,
            idcategoria: faq.idcategoria ? String(faq.idcategoria) : '',
            idestado: faq.idestado ? String(faq.idestado) : '',
        });

        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = async (faq) => {
        if (!faq.idfaq) {
            notifyError('No se encontró el identificador de la pregunta frecuente.');
            return;
        }

        const ok = confirm(
            `¿Eliminar la pregunta frecuente?\n\n"${faq.pregunta}"\n\nEsta acción no se puede deshacer.`
        );

        if (!ok) return;

        const toastId = notifyLoading('Eliminando pregunta frecuente...');

        try {
            await eliminarFaq(faq.idfaq);

            notifySuccess('Pregunta frecuente eliminada correctamente.');

            const nextPage =
                faqs.length === 1 && pagination.current_page > 1
                    ? pagination.current_page - 1
                    : pagination.current_page;

            await cargarDatos(nextPage);
        } catch (err) {
            notifyError(
                getApiErrorMessage(err, 'No se pudo eliminar la pregunta frecuente.')
            );
        } finally {
            closeNotify(toastId);
        }
    };

    const handleViewDetail = async (faq) => {
        setShowDetail(true);
        setLoadingDetail(true);
        setSelectedFaq(null);

        try {
            const response = await obtenerFaq(faq.idfaq);
            setSelectedFaq(response?.data || faq);
        } catch (err) {
            notifyError(
                getApiErrorMessage(err, 'No se pudo obtener el detalle de la pregunta frecuente.')
            );
            setShowDetail(false);
        } finally {
            setLoadingDetail(false);
        }
    };

    const cerrarDetalle = () => {
        setShowDetail(false);
        setSelectedFaq(null);
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
        <section className="faqs-page">
            <div className="faqs-header">
                <div>
                    <span className="faqs-eyebrow">Gestión de ayuda rápida</span>
                    <h1>Preguntas frecuentes</h1>
                    <p>
                        Administra respuestas rápidas para estudiantes, docentes,
                        administrativos y usuarios del portal institucional.
                    </p>
                </div>

                {!showForm && (
                    <ConPermiso permiso="tutoriales.crear">
                        <button
                            type="button"
                            className="faqs-add-button"
                            onClick={abrirFormularioCrear}
                            disabled={loading || loadingCatalogs}
                        >
                            <Plus size={18} />
                            Agregar pregunta
                        </button>
                    </ConPermiso>
                )}
            </div>

            {showForm && (
                <div className="faqs-form-card">
                    <div className="faqs-form-header">
                        <div>
                            <h2>{isEditing ? 'Editar pregunta frecuente' : 'Agregar pregunta frecuente'}</h2>
                            <p>
                                Registra una pregunta clara y una respuesta útil para el usuario final.
                            </p>
                        </div>

                        <button
                            type="button"
                            className="faqs-close-button"
                            onClick={cerrarFormulario}
                            disabled={saving}
                        >
                            <X size={18} />
                        </button>
                    </div>

                    <form className="faqs-form" onSubmit={handleSubmit}>
                        <div className="faqs-form-grid">
                            <div className="faqs-field span-2">
                                <label>Pregunta</label>
                                <input
                                    name="pregunta"
                                    value={form.pregunta}
                                    onChange={handleChange}
                                    maxLength={MAX_PREGUNTA_LENGTH}
                                    placeholder="Ej. ¿Cómo recupero mi contraseña institucional?"
                                    required
                                    disabled={saving}
                                />
                            </div>

                            <div className="faqs-field">
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

                            <div className="faqs-field">
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

                            <div className="faqs-field">
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

                            <div className="faqs-field">
                                <label>Veces útil</label>
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    name="veces_util"
                                    value={form.veces_util}
                                    onChange={handleChange}
                                    placeholder="0"
                                    disabled={saving || !isEditing}
                                />
                                {!isEditing && (
                                    <small>Este contador se administra luego de registrar la pregunta.</small>
                                )}
                            </div>

                            <div className="faqs-field span-2">
                                <label>Respuesta</label>
                                <textarea
                                    name="respuesta"
                                    value={form.respuesta}
                                    onChange={handleChange}
                                    rows={7}
                                    placeholder="Escribe una respuesta clara, directa y útil."
                                    required
                                    disabled={saving}
                                />
                            </div>
                        </div>

                        <div className="faqs-form-actions">
                            <button
                                type="submit"
                                className="faqs-save-button"
                                disabled={saving || loadingCatalogs}
                            >
                                <Save size={17} />
                                {saving
                                    ? 'Guardando...'
                                    : isEditing
                                        ? 'Actualizar pregunta'
                                        : 'Guardar pregunta'}
                            </button>

                            <button
                                type="button"
                                className="faqs-cancel-button"
                                onClick={cerrarFormulario}
                                disabled={saving}
                            >
                                Cancelar
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="faqs-list-card">
                <div className="faqs-list-header">
                    <div>
                        <h2>Preguntas registradas</h2>
                        <p>
                            Mostrando {pagination.from || 0} - {pagination.to || 0} de{' '}
                            {pagination.total} preguntas frecuentes.
                        </p>
                    </div>

                    <form className="faqs-filters" onSubmit={handleBuscar}>
                        <div className="faqs-search">
                            <Search size={17} />
                            <input
                                value={search}
                                onChange={handleSearchChange}
                                placeholder="Buscar pregunta..."
                                maxLength={MAX_SEARCH_LENGTH}
                            />
                        </div>

                        <select
                            value={categoriaFiltro}
                            onChange={(e) => setCategoriaFiltro(e.target.value)}
                            className="faqs-filter-select"
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
                            value={estadoFiltro}
                            onChange={(e) => setEstadoFiltro(e.target.value)}
                            className="faqs-filter-select"
                            disabled={loadingCatalogs}
                        >
                            <option value="">Todos los estados</option>
                            {estados.map((estado) => (
                                <option key={estado.idestado} value={estado.idestado}>
                                    {estado.nombre}
                                </option>
                            ))}
                        </select>

                        <button type="submit" className="faqs-filter-button">
                            Buscar
                        </button>

                        <button
                            type="button"
                            className="faqs-clear-button"
                            onClick={handleLimpiarFiltros}
                        >
                            Limpiar
                        </button>
                    </form>
                </div>

                {loading ? (
                    <p className="faqs-empty">Cargando preguntas frecuentes...</p>
                ) : faqs.length === 0 ? (
                    <div className="faqs-empty-box">
                        <h3>No hay preguntas para mostrar</h3>
                        <p>Registra una pregunta frecuente o cambia los filtros de búsqueda.</p>
                    </div>
                ) : (
                    <div className="faqs-table-wrap">
                        <table className="faqs-table">
                            <thead>
                            <tr>
                                <th>Pregunta</th>
                                <th>Categoría</th>
                                <th>Estado</th>
                                <th>Orden</th>
                                <th>Útil</th>
                                <th>Autor</th>
                                <th>Acciones</th>
                            </tr>
                            </thead>

                            <tbody>
                            {faqs.map((faq) => (
                                <tr key={faq.idfaq}>
                                    <td>
                                        <div className="faqs-name">
                                                <span>
                                                    <HelpCircle size={18} />
                                                </span>

                                            <div>
                                                <strong>{faq.pregunta}</strong>
                                                <small>{recortarTexto(faq.respuesta, 90)}</small>
                                            </div>
                                        </div>
                                    </td>

                                    <td>
                                            <span className="faqs-tag">
                                                <Tag size={14} />
                                                {faq.categoria?.nombre || 'Sin categoría'}
                                            </span>
                                    </td>

                                    <td>
                                            <span className="faqs-tag">
                                                <ShieldCheck size={14} />
                                                {faq.estado?.nombre || 'Sin estado'}
                                            </span>
                                    </td>

                                    <td>
                                            <span className="faqs-metric">
                                                <ListOrdered size={14} />
                                                {faq.orden ?? 0}
                                            </span>
                                    </td>

                                    <td>
                                            <span className="faqs-metric">
                                                <ThumbsUp size={14} />
                                                {faq.veces_util ?? 0}
                                            </span>
                                    </td>

                                    <td>
                                            <span className="faqs-author">
                                                <UserRound size={14} />
                                                {faq.autor?.nombre_completo ||
                                                    faq.usuario_autor?.nombre_completo ||
                                                    faq.autor?.email ||
                                                    '-'}
                                            </span>
                                    </td>

                                    <td>
                                        <div className="faqs-actions">
                                            <button
                                                type="button"
                                                onClick={() => handleViewDetail(faq)}
                                                title="Ver detalle"
                                            >
                                                <Eye size={16} />
                                            </button>

                                            <ConPermiso permiso="tutoriales.editar">
                                                <button
                                                    type="button"
                                                    onClick={() => handleEdit(faq)}
                                                    title="Editar"
                                                >
                                                    <Pencil size={16} />
                                                </button>
                                            </ConPermiso>

                                            <ConPermiso permiso="tutoriales.eliminar">
                                                <button
                                                    type="button"
                                                    className="danger"
                                                    onClick={() => handleDelete(faq)}
                                                    title="Eliminar"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </ConPermiso>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                )}

                <div className="faqs-pagination">
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
                <div className="faqs-modal-overlay" role="dialog" aria-modal="true">
                    <div className="faqs-modal">
                        <div className="faqs-modal-header">
                            <div>
                                <span className="faqs-eyebrow">Detalle de pregunta frecuente</span>
                                <h2>
                                    {loadingDetail
                                        ? 'Cargando detalle...'
                                        : selectedFaq?.pregunta || 'Detalle'}
                                </h2>
                            </div>

                            <button
                                type="button"
                                className="faqs-close-button"
                                onClick={cerrarDetalle}
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {loadingDetail ? (
                            <p className="faqs-empty">Cargando detalle...</p>
                        ) : selectedFaq ? (
                            <div className="faqs-detail">
                                <div className="faqs-detail-grid">
                                    <div>
                                        <span>Categoría</span>
                                        <strong>{selectedFaq.categoria?.nombre || '-'}</strong>
                                    </div>

                                    <div>
                                        <span>Estado</span>
                                        <strong>{selectedFaq.estado?.nombre || '-'}</strong>
                                    </div>

                                    <div>
                                        <span>Orden</span>
                                        <strong>{selectedFaq.orden ?? 0}</strong>
                                    </div>

                                    <div>
                                        <span>Veces útil</span>
                                        <strong>{selectedFaq.veces_util ?? 0}</strong>
                                    </div>

                                    <div>
                                        <span>Autor</span>
                                        <strong>
                                            {selectedFaq.autor?.nombre_completo ||
                                                selectedFaq.usuario_autor?.nombre_completo ||
                                                selectedFaq.autor?.email ||
                                                '-'}
                                        </strong>
                                    </div>

                                    <div>
                                        <span>ID FAQ</span>
                                        <strong>#{selectedFaq.idfaq}</strong>
                                    </div>
                                </div>

                                <div className="faqs-detail-content">
                                    <h3>Pregunta</h3>
                                    <p>{selectedFaq.pregunta}</p>
                                </div>

                                <div className="faqs-detail-content">
                                    <h3>Respuesta</h3>
                                    <p>{selectedFaq.respuesta}</p>
                                </div>
                            </div>
                        ) : (
                            <p className="faqs-empty">No se pudo cargar el detalle.</p>
                        )}
                    </div>
                </div>
            )}
        </section>
    );
}

function recortarTexto(value, max = 90) {
    const text = String(value || '').trim();

    if (!text) return 'Sin respuesta registrada.';

    if (text.length <= max) return text;

    return `${text.slice(0, max)}...`;
}