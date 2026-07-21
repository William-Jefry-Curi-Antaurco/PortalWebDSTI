import { useEffect, useMemo, useState } from 'react';
import {
    Building2,
    Plus,
    X,
    Pencil,
    Trash2,
    Save,
    Search,
    Eye,
    Power,
    PowerOff,
} from 'lucide-react';

import {
    actualizarInfoInstitucional,
    crearInfoInstitucional,
    eliminarInfoInstitucional,
    listarInfoInstitucional,
    obtenerInfoInstitucional,
} from '../api/infoInstitucionalApi';

import {
    closeNotify,
    getApiErrorMessage,
    notifyError,
    notifyLoading,
    notifySuccess,
} from '../utils/notify';

import '../styles/modules/infoInstitucional.css';

const initialForm = {
    clave: '',
    titulo: '',
    contenido: '',
    orden: 0,
    activo: true,
};

const initialPagination = {
    current_page: 1,
    last_page: 1,
    per_page: 10,
    total: 0,
    from: 0,
    to: 0,
};

const MAX_CLAVE_LENGTH = 50;
const MAX_TITULO_LENGTH = 200;
const MAX_SEARCH_LENGTH = 120;
const MIN_ORDEN = 0;
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

const isPositiveOrZeroInteger = (value) => {
    if (value === '' || value === null || value === undefined) return true;
    return /^\d+$/.test(String(value));
};

const generarClavePreview = (value) => {
    return String(value || '')
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '');
};

export default function InfoInstitucional() {
    const [items, setItems] = useState([]);
    const [pagination, setPagination] = useState(initialPagination);

    const [form, setForm] = useState(initialForm);
    const [editingId, setEditingId] = useState(null);
    const [selectedItem, setSelectedItem] = useState(null);

    const [showForm, setShowForm] = useState(false);
    const [showDetail, setShowDetail] = useState(false);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [loadingDetail, setLoadingDetail] = useState(false);

    const [search, setSearch] = useState('');
    const [estadoFiltro, setEstadoFiltro] = useState('');

    const isEditing = useMemo(() => Boolean(editingId), [editingId]);

    const clavePreview = useMemo(() => {
        return generarClavePreview(form.clave);
    }, [form.clave]);

    const cargarDatos = async (page = 1) => {
        setLoading(true);

        try {
            const params = {
                page,
                buscar: search.trim() || undefined,
                activo: estadoFiltro === '' ? undefined : estadoFiltro,
            };

            Object.keys(params).forEach((key) => {
                if (params[key] === undefined || params[key] === '') {
                    delete params[key];
                }
            });

            const response = await listarInfoInstitucional(params);
            const { items: data, pagination: meta } = normalizarRespuestaPaginada(response);

            setItems(data);
            setPagination(meta);
        } catch (err) {
            notifyError(
                getApiErrorMessage(
                    err,
                    'No se pudo cargar la información institucional.'
                )
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
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

    const handleSearchChange = (e) => {
        const value = e.target.value;

        if (value.length > MAX_SEARCH_LENGTH) return;

        setSearch(value);
    };

    const validarFormulario = () => {
        const clave = form.clave.trim();
        const titulo = form.titulo.trim();
        const contenido = form.contenido.trim();
        const orden = Number(form.orden);

        if (!clave) {
            notifyError('La clave es obligatoria.');
            return false;
        }

        if (clave.length > MAX_CLAVE_LENGTH) {
            notifyError(`La clave no debe superar los ${MAX_CLAVE_LENGTH} caracteres.`);
            return false;
        }

        if (!clavePreview) {
            notifyError('La clave debe contener letras o números válidos.');
            return false;
        }

        if (!titulo) {
            notifyError('El título es obligatorio.');
            return false;
        }

        if (titulo.length > MAX_TITULO_LENGTH) {
            notifyError(`El título no debe superar los ${MAX_TITULO_LENGTH} caracteres.`);
            return false;
        }

        if (!contenido) {
            notifyError('El contenido es obligatorio.');
            return false;
        }

        if (!isPositiveOrZeroInteger(form.orden)) {
            notifyError('El orden debe ser un número entero entre 0 y 255.');
            return false;
        }

        if (Number.isNaN(orden) || orden < MIN_ORDEN || orden > MAX_ORDEN) {
            notifyError('El orden debe estar entre 0 y 255.');
            return false;
        }

        return true;
    };

    const buildPayload = () => {
        return {
            clave: form.clave.trim(),
            titulo: form.titulo.trim(),
            contenido: form.contenido.trim(),
            orden: Number(form.orden || 0),
            activo: form.activo ? 1 : 0,
        };
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validarFormulario()) return;

        setSaving(true);

        const toastId = notifyLoading(
            isEditing
                ? 'Actualizando información institucional...'
                : 'Registrando información institucional...'
        );

        try {
            const payload = buildPayload();

            if (isEditing) {
                await actualizarInfoInstitucional(editingId, payload);
                notifySuccess('Información institucional actualizada correctamente.');
            } else {
                await crearInfoInstitucional(payload);
                notifySuccess('Información institucional registrada correctamente.');
            }

            cerrarFormulario();
            await cargarDatos(pagination.current_page);
        } catch (err) {
            notifyError(
                getApiErrorMessage(
                    err,
                    'No se pudo guardar la información institucional.'
                )
            );
        } finally {
            closeNotify(toastId);
            setSaving(false);
        }
    };

    const handleEdit = (item) => {
        setEditingId(item.idinfo);
        setShowForm(true);

        setForm({
            clave: item.clave || '',
            titulo: item.titulo || '',
            contenido: item.contenido || '',
            orden: item.orden ?? 0,
            activo: Boolean(Number(item.activo)),
        });

        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = async (item) => {
        if (!item.idinfo) {
            notifyError('No se encontró el identificador del registro.');
            return;
        }

        const ok = confirm(
            `¿Eliminar "${item.titulo}"?\n\nEsta acción no se puede deshacer.`
        );

        if (!ok) return;

        const toastId = notifyLoading('Eliminando información institucional...');

        try {
            await eliminarInfoInstitucional(item.idinfo);

            notifySuccess('Información institucional eliminada correctamente.');

            const nextPage =
                items.length === 1 && pagination.current_page > 1
                    ? pagination.current_page - 1
                    : pagination.current_page;

            await cargarDatos(nextPage);
        } catch (err) {
            notifyError(
                getApiErrorMessage(
                    err,
                    'No se pudo eliminar la información institucional.'
                )
            );
        } finally {
            closeNotify(toastId);
        }
    };

    const handleToggleActivo = async (item) => {
        if (!item.idinfo) {
            notifyError('No se encontró el identificador del registro.');
            return;
        }

        if (!item.clave || !item.titulo || !item.contenido) {
            notifyError('El registro no tiene datos completos para cambiar su estado.');
            return;
        }

        const nuevoEstado = !Boolean(Number(item.activo));

        const toastId = notifyLoading(
            nuevoEstado
                ? 'Activando información institucional...'
                : 'Desactivando información institucional...'
        );

        try {
            await actualizarInfoInstitucional(item.idinfo, {
                clave: item.clave,
                titulo: item.titulo,
                contenido: item.contenido,
                orden: Number(item.orden || 0),
                activo: nuevoEstado ? 1 : 0,
            });

            notifySuccess(
                nuevoEstado
                    ? 'Información institucional activada correctamente.'
                    : 'Información institucional desactivada correctamente.'
            );

            await cargarDatos(pagination.current_page);
        } catch (err) {
            notifyError(
                getApiErrorMessage(
                    err,
                    'No se pudo cambiar el estado de la información institucional.'
                )
            );
        } finally {
            closeNotify(toastId);
        }
    };

    const handleViewDetail = async (item) => {
        setShowDetail(true);
        setLoadingDetail(true);
        setSelectedItem(null);

        try {
            const response = await obtenerInfoInstitucional(item.idinfo);
            setSelectedItem(response?.data || item);
        } catch (err) {
            notifyError(
                getApiErrorMessage(
                    err,
                    'No se pudo obtener el detalle de la información institucional.'
                )
            );
            setShowDetail(false);
        } finally {
            setLoadingDetail(false);
        }
    };

    const cerrarDetalle = () => {
        setShowDetail(false);
        setSelectedItem(null);
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
        <section className="info-page">
            <div className="info-header">
                <div>
                    <span className="info-eyebrow">Contenido institucional</span>
                    <h1>Información institucional</h1>
                    <p>
                        Administra secciones como misión, visión, valores,
                        descripción institucional, funciones u objetivos de la DSTI.
                    </p>
                </div>

                {!showForm && (
                    <button
                        type="button"
                        className="info-add-button"
                        onClick={abrirFormularioCrear}
                        disabled={loading}
                    >
                        <Plus size={18} />
                        Agregar información
                    </button>
                )}
            </div>

            {showForm && (
                <div className="info-form-card">
                    <div className="info-form-header">
                        <div>
                            <h2>
                                {isEditing
                                    ? 'Editar información institucional'
                                    : 'Agregar información institucional'}
                            </h2>
                            <p>
                                La clave será normalizada por el backend usando guiones bajos.
                                Ejemplo: "Misión institucional" se guardará como
                                "mision_institucional".
                            </p>
                        </div>

                        <button
                            type="button"
                            className="info-close-button"
                            onClick={cerrarFormulario}
                            disabled={saving}
                        >
                            <X size={18} />
                        </button>
                    </div>

                    <form className="info-form" onSubmit={handleSubmit}>
                        <div className="info-form-grid">
                            <div className="info-field">
                                <label>Clave</label>
                                <input
                                    name="clave"
                                    value={form.clave}
                                    onChange={handleChange}
                                    maxLength={MAX_CLAVE_LENGTH}
                                    placeholder="Ej. mision"
                                    required
                                    disabled={saving}
                                />
                                <small>Vista previa: {clavePreview || '-'}</small>
                            </div>

                            <div className="info-field">
                                <label>Título</label>
                                <input
                                    name="titulo"
                                    value={form.titulo}
                                    onChange={handleChange}
                                    maxLength={MAX_TITULO_LENGTH}
                                    placeholder="Ej. Misión"
                                    required
                                    disabled={saving}
                                />
                                <small>
                                    {form.titulo.length}/{MAX_TITULO_LENGTH} caracteres
                                </small>
                            </div>

                            <div className="info-field">
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

                            <div className="info-field span-2">
                                <label>Contenido</label>
                                <textarea
                                    name="contenido"
                                    value={form.contenido}
                                    onChange={handleChange}
                                    rows={8}
                                    placeholder="Escribe el contenido institucional..."
                                    required
                                    disabled={saving}
                                />
                            </div>

                            <label className="info-checkbox span-2">
                                <input
                                    type="checkbox"
                                    name="activo"
                                    checked={form.activo}
                                    onChange={handleChange}
                                    disabled={saving}
                                />
                                Información activa
                            </label>
                        </div>

                        <div className="info-form-actions">
                            <button
                                type="submit"
                                className="info-save-button"
                                disabled={saving}
                            >
                                <Save size={17} />
                                {saving
                                    ? 'Guardando...'
                                    : isEditing
                                        ? 'Actualizar información'
                                        : 'Guardar información'}
                            </button>

                            <button
                                type="button"
                                className="info-cancel-button"
                                onClick={cerrarFormulario}
                                disabled={saving}
                            >
                                Cancelar
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="info-list-card">
                <div className="info-list-header">
                    <div>
                        <h2>Registros institucionales</h2>
                        <p>
                            Mostrando {pagination.from || 0} - {pagination.to || 0} de{' '}
                            {pagination.total} registros.
                        </p>
                    </div>

                    <form className="info-filters" onSubmit={handleBuscar}>
                        <div className="info-search">
                            <Search size={17} />
                            <input
                                value={search}
                                onChange={handleSearchChange}
                                placeholder="Buscar por clave, título o contenido..."
                                maxLength={MAX_SEARCH_LENGTH}
                            />
                        </div>

                        <select
                            value={estadoFiltro}
                            onChange={(e) => setEstadoFiltro(e.target.value)}
                            className="info-filter-select"
                        >
                            <option value="">Todos los estados</option>
                            <option value="1">Activos</option>
                            <option value="0">Inactivos</option>
                        </select>

                        <button type="submit" className="info-filter-button">
                            Buscar
                        </button>

                        <button
                            type="button"
                            className="info-clear-button"
                            onClick={handleLimpiarFiltros}
                        >
                            Limpiar
                        </button>
                    </form>
                </div>

                {loading ? (
                    <p className="info-empty">Cargando información institucional...</p>
                ) : items.length === 0 ? (
                    <div className="info-empty-box">
                        <h3>No hay información para mostrar</h3>
                        <p>
                            Registra una sección institucional o cambia los filtros de búsqueda.
                        </p>
                    </div>
                ) : (
                    <div className="info-table-wrap">
                        <table className="info-table">
                            <thead>
                            <tr>
                                <th>Información</th>
                                <th>Clave</th>
                                <th>Orden</th>
                                <th>Estado</th>
                                <th>Editor</th>
                                <th>Actualización</th>
                                <th>Acciones</th>
                            </tr>
                            </thead>

                            <tbody>
                            {items.map((item) => {
                                const activo = Boolean(Number(item.activo));

                                return (
                                    <tr key={item.idinfo}>
                                        <td>
                                            <div className="info-name">
                                                    <span>
                                                        <Building2 size={18} />
                                                    </span>

                                                <div>
                                                    <strong>{item.titulo}</strong>
                                                    <small>
                                                        {recortarTexto(item.contenido, 120)}
                                                    </small>
                                                </div>
                                            </div>
                                        </td>

                                        <td>
                                            <code>{item.clave}</code>
                                        </td>

                                        <td>{item.orden ?? 0}</td>

                                        <td>
                                                <span
                                                    className={
                                                        activo
                                                            ? 'info-status active'
                                                            : 'info-status inactive'
                                                    }
                                                >
                                                    {activo ? 'Activa' : 'Inactiva'}
                                                </span>
                                        </td>

                                        <td>
                                            {item.editor?.nombre_completo ||
                                                item.editor?.email ||
                                                '-'}
                                        </td>

                                        <td>{formatDate(item.updated_at)}</td>

                                        <td>
                                            <div className="info-actions">
                                                <button
                                                    type="button"
                                                    onClick={() => handleViewDetail(item)}
                                                    title="Ver detalle"
                                                >
                                                    <Eye size={16} />
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() => handleToggleActivo(item)}
                                                    title={activo ? 'Desactivar' : 'Activar'}
                                                >
                                                    {activo ? (
                                                        <PowerOff size={16} />
                                                    ) : (
                                                        <Power size={16} />
                                                    )}
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() => handleEdit(item)}
                                                    title="Editar"
                                                >
                                                    <Pencil size={16} />
                                                </button>

                                                <button
                                                    type="button"
                                                    className="danger"
                                                    onClick={() => handleDelete(item)}
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

                <div className="info-pagination">
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
                        onClick={() => handlePageChange(pagination.current_page + 1)}
                        disabled={loading || pagination.current_page >= pagination.last_page}
                    >
                        Siguiente
                    </button>
                </div>
            </div>

            {showDetail && (
                <div className="info-modal-overlay" role="dialog" aria-modal="true">
                    <div className="info-modal">
                        <div className="info-modal-header">
                            <div>
                                <span className="info-eyebrow">Detalle institucional</span>
                                <h2>
                                    {loadingDetail
                                        ? 'Cargando detalle...'
                                        : selectedItem?.titulo || 'Detalle'}
                                </h2>
                            </div>

                            <button
                                type="button"
                                className="info-close-button"
                                onClick={cerrarDetalle}
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {loadingDetail ? (
                            <p className="info-empty">Cargando detalle...</p>
                        ) : selectedItem ? (
                            <div className="info-detail">
                                <div className="info-detail-grid">
                                    <div>
                                        <span>Clave</span>
                                        <strong>{selectedItem.clave}</strong>
                                    </div>

                                    <div>
                                        <span>Orden</span>
                                        <strong>{selectedItem.orden ?? 0}</strong>
                                    </div>

                                    <div>
                                        <span>Estado</span>
                                        <strong>
                                            {Boolean(Number(selectedItem.activo))
                                                ? 'Activa'
                                                : 'Inactiva'}
                                        </strong>
                                    </div>

                                    <div>
                                        <span>Editor</span>
                                        <strong>
                                            {selectedItem.editor?.nombre_completo ||
                                                selectedItem.editor?.email ||
                                                '-'}
                                        </strong>
                                    </div>
                                </div>

                                <div className="info-detail-content">
                                    <h3>Contenido</h3>
                                    <p>{selectedItem.contenido}</p>
                                </div>
                            </div>
                        ) : (
                            <p className="info-empty">No se pudo cargar el detalle.</p>
                        )}
                    </div>
                </div>
            )}
        </section>
    );
}

function recortarTexto(value, max = 120) {
    const text = String(value || '').trim();

    if (!text) return 'Sin contenido';

    if (text.length <= max) return text;

    return `${text.slice(0, max)}...`;
}

function formatDate(value) {
    if (!value) return '-';

    const date = new Date(value);

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