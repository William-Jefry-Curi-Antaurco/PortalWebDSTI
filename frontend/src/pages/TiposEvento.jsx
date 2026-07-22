import { useEffect, useMemo, useState } from 'react';
import {
    CalendarDays,
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
    actualizarTipoEvento,
    crearTipoEvento,
    eliminarTipoEvento,
    listarTiposEvento,
} from '../api/tiposEventoApi';

import {
    closeNotify,
    getApiErrorMessage,
    notifyError,
    notifyLoading,
    notifySuccess,
} from '../utils/notify';

import ConPermiso from '../components/ConPermiso';

import '../styles/modules/tiposEvento.css';

const initialForm = {
    nombre: '',
    descripcion: '',
    activo: true,
};

export default function TiposEvento() {
    const [tiposEvento, setTiposEvento] = useState([]);
    const [form, setForm] = useState(initialForm);

    const [editingId, setEditingId] = useState(null);
    const [showForm, setShowForm] = useState(false);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [search, setSearch] = useState('');

    const isEditing = useMemo(() => Boolean(editingId), [editingId]);

    const tiposEventoFiltrados = useMemo(() => {
        const value = search.trim().toLowerCase();

        if (!value) return tiposEvento;

        return tiposEvento.filter((tipo) => {
            return (
                String(tipo.nombre || '').toLowerCase().includes(value) ||
                String(tipo.slug || '').toLowerCase().includes(value) ||
                String(tipo.descripcion || '').toLowerCase().includes(value)
            );
        });
    }, [tiposEvento, search]);

    const cargarDatos = async () => {
        setLoading(true);

        try {
            const data = await listarTiposEvento();

            setTiposEvento(
                Array.isArray(data)
                    ? data
                    : data?.data || []
            );
        } catch (err) {
            notifyError(
                getApiErrorMessage(
                    err,
                    'No se pudieron cargar los tipos de evento.'
                )
            );
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

    const handleEdit = (tipo) => {
        setEditingId(tipo.idtipoevento);
        setShowForm(true);

        setForm({
            nombre: tipo.nombre || '',
            descripcion: tipo.descripcion || '',
            activo: Boolean(Number(tipo.activo)),
        });

        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const buildPayload = () => {
        return {
            nombre: form.nombre.trim(),
            descripcion: form.descripcion.trim() || null,
            activo: form.activo ? 1 : 0,
        };
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!form.nombre.trim()) {
            notifyError('Ingrese el nombre del tipo de evento.');
            return;
        }

        setSaving(true);

        const toastId = notifyLoading(
            isEditing
                ? 'Actualizando tipo de evento...'
                : 'Registrando tipo de evento...'
        );

        try {
            const payload = buildPayload();

            if (isEditing) {
                await actualizarTipoEvento(editingId, payload);
                notifySuccess('Tipo de evento actualizado correctamente.');
            } else {
                await crearTipoEvento(payload);
                notifySuccess('Tipo de evento registrado correctamente.');
            }

            cerrarFormulario();
            await cargarDatos();
        } catch (err) {
            notifyError(
                getApiErrorMessage(
                    err,
                    'No se pudo guardar el tipo de evento.'
                )
            );
        } finally {
            closeNotify(toastId);
            setSaving(false);
        }
    };

    const handleDelete = async (tipo) => {
        const totalEventos =
            tipo.eventos_count ||
            tipo.eventosCount ||
            tipo.total_eventos ||
            0;

        if (Number(totalEventos) > 0) {
            notifyError(
                'No se puede eliminar este tipo de evento porque tiene eventos asociados.'
            );
            return;
        }

        const ok = confirm(
            `¿Eliminar el tipo de evento "${tipo.nombre}"?\n\nSolo se eliminará si no tiene eventos asociados.`
        );

        if (!ok) return;

        const toastId = notifyLoading('Eliminando tipo de evento...');

        try {
            await eliminarTipoEvento(tipo.idtipoevento);

            notifySuccess('Tipo de evento eliminado correctamente.');
            await cargarDatos();
        } catch (err) {
            notifyError(
                getApiErrorMessage(
                    err,
                    'No se pudo eliminar el tipo de evento. Verifica que no tenga eventos asociados.'
                )
            );
        } finally {
            closeNotify(toastId);
        }
    };

    const handleToggleActivo = async (tipo) => {
        const nuevoEstado = !Boolean(Number(tipo.activo));

        const toastId = notifyLoading(
            nuevoEstado
                ? 'Activando tipo de evento...'
                : 'Desactivando tipo de evento...'
        );

        try {
            await actualizarTipoEvento(tipo.idtipoevento, {
                nombre: tipo.nombre,
                descripcion: tipo.descripcion || null,
                activo: nuevoEstado ? 1 : 0,
            });

            notifySuccess(
                nuevoEstado
                    ? 'Tipo de evento activado correctamente.'
                    : 'Tipo de evento desactivado correctamente.'
            );

            await cargarDatos();
        } catch (err) {
            notifyError(
                getApiErrorMessage(
                    err,
                    'No se pudo cambiar el estado del tipo de evento.'
                )
            );
        } finally {
            closeNotify(toastId);
        }
    };

    return (
        <section className="tipos-evento-page">
            <div className="tipos-evento-header">
                <div>
                    <span className="tipos-evento-eyebrow">
                        Clasificación y configuración
                    </span>
                    <h1>Tipos de evento</h1>
                    <p>
                        Administra los tipos usados para clasificar talleres,
                        capacitaciones, charlas, conferencias y demás eventos
                        tecnológicos del portal DSTI.
                    </p>
                </div>

                {!showForm && (
                    <ConPermiso permiso="catalogos.crear">
                        <button
                            type="button"
                            className="tipos-evento-add-button"
                            onClick={abrirFormularioCrear}
                        >
                            <Plus size={18} />
                            Agregar tipo
                        </button>
                    </ConPermiso>
                )}
            </div>

            {showForm && (
                <div className="tipos-evento-form-card">
                    <div className="tipos-evento-form-header">
                        <div>
                            <h2>
                                {isEditing
                                    ? 'Editar tipo de evento'
                                    : 'Agregar tipo de evento'}
                            </h2>
                            <p>
                                Completa el nombre, descripción y estado. El slug
                                será generado automáticamente por el backend.
                            </p>
                        </div>

                        <button
                            type="button"
                            className="tipos-evento-close-button"
                            onClick={cerrarFormulario}
                        >
                            <X size={18} />
                        </button>
                    </div>

                    <form
                        className="tipos-evento-form"
                        onSubmit={handleSubmit}
                    >
                        <div className="tipos-evento-form-grid">
                            <div className="tipos-evento-field">
                                <label>Nombre</label>
                                <input
                                    name="nombre"
                                    value={form.nombre}
                                    onChange={handleChange}
                                    maxLength={100}
                                    placeholder="Ej. Capacitación"
                                    required
                                />
                            </div>

                            <div className="tipos-evento-field">
                                <label>Descripción</label>
                                <textarea
                                    name="descripcion"
                                    value={form.descripcion}
                                    onChange={handleChange}
                                    maxLength={255}
                                    rows={4}
                                    placeholder="Descripción breve del tipo de evento."
                                />
                            </div>

                            <label className="tipos-evento-checkbox">
                                <input
                                    type="checkbox"
                                    name="activo"
                                    checked={form.activo}
                                    onChange={handleChange}
                                />
                                Tipo de evento activo
                            </label>
                        </div>

                        <div className="tipos-evento-form-actions">
                            <button
                                type="submit"
                                className="tipos-evento-save-button"
                                disabled={saving}
                            >
                                <Save size={17} />
                                {saving
                                    ? 'Guardando...'
                                    : isEditing
                                        ? 'Actualizar tipo'
                                        : 'Guardar tipo'}
                            </button>

                            <button
                                type="button"
                                className="tipos-evento-cancel-button"
                                onClick={cerrarFormulario}
                            >
                                Cancelar
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="tipos-evento-list-card">
                <div className="tipos-evento-list-header">
                    <div>
                        <h2>Tipos de evento registrados</h2>
                        <p>
                            Listado de tipos disponibles para clasificar eventos.
                        </p>
                    </div>

                    <div className="tipos-evento-search">
                        <Search size={17} />
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Buscar tipo..."
                        />
                    </div>
                </div>

                {loading ? (
                    <p className="tipos-evento-empty">
                        Cargando tipos de evento...
                    </p>
                ) : tiposEventoFiltrados.length === 0 ? (
                    <div className="tipos-evento-empty-box">
                        <h3>No hay tipos de evento para mostrar</h3>
                        <p>
                            Registra un tipo de evento o cambia el criterio
                            de búsqueda.
                        </p>
                    </div>
                ) : (
                    <div className="tipos-evento-table-wrap">
                        <table className="tipos-evento-table">
                            <thead>
                            <tr>
                                <th>Tipo de evento</th>
                                <th>Slug</th>
                                <th>Descripción</th>
                                <th>Estado</th>
                                <th>Eventos</th>
                                <th>Actualización</th>
                                <th>Acciones</th>
                            </tr>
                            </thead>

                            <tbody>
                            {tiposEventoFiltrados.map((tipo) => {
                                const activo = Boolean(Number(tipo.activo));

                                const totalEventos =
                                    tipo.eventos_count ||
                                    tipo.eventosCount ||
                                    tipo.total_eventos ||
                                    0;

                                return (
                                    <tr key={tipo.idtipoevento}>
                                        <td>
                                            <div className="tipos-evento-name">
                                                    <span>
                                                        <CalendarDays size={18} />
                                                    </span>

                                                <strong>{tipo.nombre}</strong>
                                            </div>
                                        </td>

                                        <td>
                                            <code>{tipo.slug || '-'}</code>
                                        </td>

                                        <td>{tipo.descripcion || '-'}</td>

                                        <td>
                                                <span
                                                    className={
                                                        activo
                                                            ? 'tipos-evento-status active'
                                                            : 'tipos-evento-status inactive'
                                                    }
                                                >
                                                    {activo ? 'Activo' : 'Inactivo'}
                                                </span>
                                        </td>

                                        <td>{Number(totalEventos)}</td>

                                        <td>{formatDate(tipo.updated_at)}</td>

                                        <td>
                                            <div className="tipos-evento-actions">
                                                <ConPermiso permiso="catalogos.editar">
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            handleToggleActivo(tipo)
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
                                                            handleEdit(tipo)
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
                                                            handleDelete(tipo)
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