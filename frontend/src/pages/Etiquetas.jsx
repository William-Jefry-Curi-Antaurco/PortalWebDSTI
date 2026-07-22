import { useEffect, useMemo, useState } from 'react';
import {
    Tag,
    Plus,
    X,
    Pencil,
    Trash2,
    Save,
    Search,
    Power,
    PowerOff,
} from 'lucide-react';

import {
    actualizarEtiqueta,
    crearEtiqueta,
    eliminarEtiqueta,
    listarEtiquetas,
} from '../api/etiquetasApi';

import {
    closeNotify,
    getApiErrorMessage,
    notifyError,
    notifyLoading,
    notifySuccess,
} from '../utils/notify';

import ConPermiso from '../components/ConPermiso';

import '../styles/modules/etiquetas.css';

const initialForm = {
    nombre: '',
    color: '#2563eb',
    activo: true,
};

const coloresSugeridos = [
    '#2563eb',
    '#16a34a',
    '#dc2626',
    '#f97316',
    '#7c3aed',
    '#0891b2',
    '#be123c',
    '#475569',
];

export default function Etiquetas() {
    const [etiquetas, setEtiquetas] = useState([]);
    const [form, setForm] = useState(initialForm);

    const [editingId, setEditingId] = useState(null);
    const [showForm, setShowForm] = useState(false);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [search, setSearch] = useState('');

    const isEditing = useMemo(() => Boolean(editingId), [editingId]);

    const etiquetasFiltradas = useMemo(() => {
        const value = search.trim().toLowerCase();

        if (!value) return etiquetas;

        return etiquetas.filter((etiqueta) => {
            return (
                String(etiqueta.nombre || '').toLowerCase().includes(value) ||
                String(etiqueta.slug || '').toLowerCase().includes(value) ||
                String(etiqueta.color || '').toLowerCase().includes(value)
            );
        });
    }, [etiquetas, search]);

    const normalizarListadoEtiquetas = (response) => {
        if (Array.isArray(response)) return response;

        if (Array.isArray(response?.data)) {
            return response.data;
        }

        if (Array.isArray(response?.data?.data)) {
            return response.data.data;
        }

        return [];
    };

    const cargarDatos = async () => {
        setLoading(true);

        try {
            const response = await listarEtiquetas();

            const lista = normalizarListadoEtiquetas(response);

            setEtiquetas(lista);
        } catch (err) {
            notifyError(
                getApiErrorMessage(
                    err,
                    'No se pudieron cargar las etiquetas.'
                )
            );

            setEtiquetas([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        cargarDatos();
    }, []);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;

        setForm({
            ...form,
            [name]: type === 'checkbox' ? checked : value,
        });
    };

    const abrirFormularioCrear = () => {
        resetForm();
        setShowForm(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const cerrarFormulario = () => {
        resetForm();
        setShowForm(false);
    };

    const resetForm = () => {
        setForm(initialForm);
        setEditingId(null);
    };

    const handleEdit = (etiqueta) => {
        setEditingId(etiqueta.idetiqueta);
        setShowForm(true);

        setForm({
            nombre: etiqueta.nombre || '',
            color: normalizarColor(etiqueta.color),
            activo: Boolean(Number(etiqueta.activo)),
        });

        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const buildPayload = () => {
        return {
            nombre: form.nombre.trim(),
            color: normalizarColor(form.color),
            activo: form.activo ? 1 : 0,
        };
    };

    const validarFormulario = () => {
        if (!form.nombre.trim()) {
            notifyError('Ingrese el nombre de la etiqueta.');
            return false;
        }

        if (form.nombre.trim().length > 100) {
            notifyError('El nombre no debe superar los 100 caracteres.');
            return false;
        }

        if (!/^#[0-9A-Fa-f]{6}$/.test(normalizarColor(form.color))) {
            notifyError('Seleccione un color válido en formato hexadecimal.');
            return false;
        }

        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validarFormulario()) return;

        setSaving(true);

        const toastId = notifyLoading(
            isEditing ? 'Actualizando etiqueta...' : 'Registrando etiqueta...'
        );

        try {
            const payload = buildPayload();

            if (isEditing) {
                await actualizarEtiqueta(editingId, payload);
                notifySuccess('Etiqueta actualizada correctamente.');
            } else {
                await crearEtiqueta(payload);
                notifySuccess('Etiqueta registrada correctamente.');
            }

            cerrarFormulario();
            await cargarDatos();
        } catch (err) {
            notifyError(
                getApiErrorMessage(
                    err,
                    'No se pudo guardar la etiqueta.'
                )
            );
        } finally {
            closeNotify(toastId);
            setSaving(false);
        }
    };

    const handleDelete = async (etiqueta) => {
        const totalContenidos = Number(etiqueta.contenidos_count || 0);

        if (totalContenidos > 0) {
            notifyError(
                `No se puede eliminar esta etiqueta porque tiene ${totalContenidos} contenido(s) asociado(s).`
            );
            return;
        }

        const ok = confirm(
            `¿Eliminar la etiqueta "${etiqueta.nombre}"?\n\nSolo se eliminará si no tiene contenidos asociados.`
        );

        if (!ok) return;

        const toastId = notifyLoading('Eliminando etiqueta...');

        try {
            await eliminarEtiqueta(etiqueta.idetiqueta);

            notifySuccess('Etiqueta eliminada correctamente.');
            await cargarDatos();
        } catch (err) {
            notifyError(
                getApiErrorMessage(
                    err,
                    'No se pudo eliminar la etiqueta. Verifica que no tenga contenidos asociados.'
                )
            );
        } finally {
            closeNotify(toastId);
        }
    };

    const handleToggleActivo = async (etiqueta) => {
        const nuevoEstado = !Boolean(Number(etiqueta.activo));

        const toastId = notifyLoading(
            nuevoEstado ? 'Activando etiqueta...' : 'Desactivando etiqueta...'
        );

        try {
            await actualizarEtiqueta(etiqueta.idetiqueta, {
                nombre: etiqueta.nombre,
                color: normalizarColor(etiqueta.color),
                activo: nuevoEstado ? 1 : 0,
            });

            notifySuccess(
                nuevoEstado
                    ? 'Etiqueta activada correctamente.'
                    : 'Etiqueta desactivada correctamente.'
            );

            await cargarDatos();
        } catch (err) {
            notifyError(
                getApiErrorMessage(
                    err,
                    'No se pudo cambiar el estado de la etiqueta.'
                )
            );
        } finally {
            closeNotify(toastId);
        }
    };

    return (
        <section className="etiquetas-page">
            <div className="etiquetas-header">
                <div>
                    <span className="etiquetas-eyebrow">
                        Clasificación y configuración
                    </span>

                    <h1>Etiquetas</h1>

                    <p>
                        Administra etiquetas reutilizables para clasificar contenidos
                        del portal, como noticias, documentos, eventos, tutoriales
                        o proyectos.
                    </p>
                </div>

                {!showForm && (
                    <ConPermiso permiso="catalogos.crear">
                        <button
                            type="button"
                            className="etiquetas-add-button"
                            onClick={abrirFormularioCrear}
                        >
                            <Plus size={18} />
                            Agregar etiqueta
                        </button>
                    </ConPermiso>
                )}
            </div>

            {showForm && (
                <div className="etiquetas-form-card">
                    <div className="etiquetas-form-header">
                        <div>
                            <h2>
                                {isEditing ? 'Editar etiqueta' : 'Agregar etiqueta'}
                            </h2>

                            <p>
                                Completa el nombre, color y estado. El slug lo genera
                                automáticamente Laravel.
                            </p>
                        </div>

                        <button
                            type="button"
                            className="etiquetas-close-button"
                            onClick={cerrarFormulario}
                        >
                            <X size={18} />
                        </button>
                    </div>

                    <form className="etiquetas-form" onSubmit={handleSubmit}>
                        <div className="etiquetas-form-grid">
                            <div className="etiquetas-field">
                                <label>Nombre</label>

                                <input
                                    name="nombre"
                                    value={form.nombre}
                                    onChange={handleChange}
                                    maxLength={100}
                                    placeholder="Ej. Seguridad"
                                    required
                                />
                            </div>

                            <div className="etiquetas-field">
                                <label>Color</label>

                                <div className="etiquetas-color-row">
                                    <input
                                        type="color"
                                        name="color"
                                        value={normalizarColor(form.color)}
                                        onChange={handleChange}
                                    />

                                    <input
                                        name="color"
                                        value={form.color}
                                        onChange={handleChange}
                                        maxLength={20}
                                        placeholder="#2563eb"
                                    />
                                </div>

                                <div className="etiquetas-color-options">
                                    {coloresSugeridos.map((color) => (
                                        <button
                                            key={color}
                                            type="button"
                                            style={{ backgroundColor: color }}
                                            className={
                                                normalizarColor(form.color) === color
                                                    ? 'selected'
                                                    : ''
                                            }
                                            onClick={() =>
                                                setForm({
                                                    ...form,
                                                    color,
                                                })
                                            }
                                            title={color}
                                        />
                                    ))}
                                </div>
                            </div>

                            <label className="etiquetas-checkbox">
                                <input
                                    type="checkbox"
                                    name="activo"
                                    checked={form.activo}
                                    onChange={handleChange}
                                />
                                Etiqueta activa
                            </label>
                        </div>

                        <div className="etiquetas-preview-box">
                            <span
                                className="etiquetas-preview-pill"
                                style={{
                                    backgroundColor: withAlpha(form.color, '18'),
                                    color: normalizarColor(form.color),
                                    borderColor: withAlpha(form.color, '55'),
                                }}
                            >
                                <Tag size={14} />
                                {form.nombre || 'Vista previa'}
                            </span>
                        </div>

                        <div className="etiquetas-form-actions">
                            <button
                                type="submit"
                                className="etiquetas-save-button"
                                disabled={saving}
                            >
                                <Save size={17} />

                                {saving
                                    ? 'Guardando...'
                                    : isEditing
                                        ? 'Actualizar etiqueta'
                                        : 'Guardar etiqueta'}
                            </button>

                            <button
                                type="button"
                                className="etiquetas-cancel-button"
                                onClick={cerrarFormulario}
                            >
                                Cancelar
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="etiquetas-list-card">
                <div className="etiquetas-list-header">
                    <div>
                        <h2>Etiquetas registradas</h2>

                        <p>
                            Listado de etiquetas disponibles para asignar a contenidos
                            del portal.
                        </p>
                    </div>

                    <div className="etiquetas-search">
                        <Search size={17} />

                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Buscar etiqueta..."
                        />
                    </div>
                </div>

                {loading ? (
                    <p className="etiquetas-empty">
                        Cargando etiquetas...
                    </p>
                ) : etiquetasFiltradas.length === 0 ? (
                    <div className="etiquetas-empty-box">
                        <h3>No hay etiquetas para mostrar</h3>

                        <p>
                            Registra una etiqueta o cambia el criterio de búsqueda.
                        </p>
                    </div>
                ) : (
                    <div className="etiquetas-table-wrap">
                        <table className="etiquetas-table">
                            <thead>
                            <tr>
                                <th>Etiqueta</th>
                                <th>Slug</th>
                                <th>Color</th>
                                <th>Estado</th>
                                <th>Contenidos</th>
                                <th>Actualización</th>
                                <th>Acciones</th>
                            </tr>
                            </thead>

                            <tbody>
                            {etiquetasFiltradas.map((etiqueta) => {
                                const activo = Boolean(Number(etiqueta.activo));
                                const color = normalizarColor(etiqueta.color);
                                const totalContenidos = Number(etiqueta.contenidos_count || 0);

                                return (
                                    <tr key={etiqueta.idetiqueta}>
                                        <td>
                                            <div className="etiquetas-name">
                                                    <span
                                                        style={{
                                                            backgroundColor: withAlpha(color, '18'),
                                                            color,
                                                        }}
                                                    >
                                                        <Tag size={18} />
                                                    </span>

                                                <strong>{etiqueta.nombre}</strong>
                                            </div>
                                        </td>

                                        <td>
                                            <code>{etiqueta.slug || '-'}</code>
                                        </td>

                                        <td>
                                            <div className="etiquetas-color-cell">
                                                    <span
                                                        style={{
                                                            backgroundColor: color,
                                                        }}
                                                    />

                                                <code>{color}</code>
                                            </div>
                                        </td>

                                        <td>
                                                <span
                                                    className={
                                                        activo
                                                            ? 'etiquetas-status active'
                                                            : 'etiquetas-status inactive'
                                                    }
                                                >
                                                    {activo ? 'Activa' : 'Inactiva'}
                                                </span>
                                        </td>

                                        <td>{totalContenidos}</td>

                                        <td>{formatDate(etiqueta.updated_at)}</td>

                                        <td>
                                            <div className="etiquetas-actions">
                                                <ConPermiso permiso="catalogos.editar">
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            handleToggleActivo(etiqueta)
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
                                                </ConPermiso>

                                                <ConPermiso permiso="catalogos.editar">
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            handleEdit(etiqueta)
                                                        }
                                                        title="Editar"
                                                    >
                                                        <Pencil size={16} />
                                                    </button>
                                                </ConPermiso>

                                                <ConPermiso permiso="catalogos.eliminar">
                                                    <button
                                                        type="button"
                                                        className="danger"
                                                        onClick={() =>
                                                            handleDelete(etiqueta)
                                                        }
                                                        title="Eliminar"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </ConPermiso>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </section>
    );
}

function normalizarColor(color) {
    if (!color) return '#2563eb';

    const value = String(color).trim();

    if (/^#[0-9A-Fa-f]{6}$/.test(value)) {
        return value;
    }

    if (/^[0-9A-Fa-f]{6}$/.test(value)) {
        return `#${value}`;
    }

    return '#2563eb';
}

function withAlpha(color, alpha) {
    return `${normalizarColor(color)}${alpha}`;
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