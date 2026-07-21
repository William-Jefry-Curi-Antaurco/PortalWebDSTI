import { useEffect, useMemo, useState } from 'react';
import {
    MapPin,
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
    actualizarModalidadEvento,
    crearModalidadEvento,
    eliminarModalidadEvento,
    listarModalidadesEvento,
} from '../api/modalidadesEventoApi';

import {
    closeNotify,
    getApiErrorMessage,
    notifyError,
    notifyLoading,
    notifySuccess,
} from '../utils/notify';

import '../styles/modules/modalidadesEvento.css';

const initialForm = {
    nombre: '',
    descripcion: '',
    activo: true,
};

export default function ModalidadesEvento() {
    const [modalidadesEvento, setModalidadesEvento] = useState([]);
    const [form, setForm] = useState(initialForm);

    const [editingId, setEditingId] = useState(null);
    const [showForm, setShowForm] = useState(false);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [search, setSearch] = useState('');

    const isEditing = useMemo(() => Boolean(editingId), [editingId]);

    const modalidadesEventoFiltradas = useMemo(() => {
        const value = search.trim().toLowerCase();

        if (!value) return modalidadesEvento;

        return modalidadesEvento.filter((modalidad) => {
            return (
                String(modalidad.nombre || '').toLowerCase().includes(value) ||
                String(modalidad.slug || '').toLowerCase().includes(value) ||
                String(modalidad.descripcion || '').toLowerCase().includes(value)
            );
        });
    }, [modalidadesEvento, search]);

    const cargarDatos = async () => {
        setLoading(true);

        try {
            const data = await listarModalidadesEvento();

            setModalidadesEvento(
                Array.isArray(data)
                    ? data
                    : data?.data || []
            );
        } catch (err) {
            notifyError(
                getApiErrorMessage(
                    err,
                    'No se pudieron cargar las modalidades de evento.'
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

    const handleEdit = (modalidad) => {
        setEditingId(modalidad.idmodalidad);
        setShowForm(true);

        setForm({
            nombre: modalidad.nombre || '',
            descripcion: modalidad.descripcion || '',
            activo: Boolean(Number(modalidad.activo)),
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
            notifyError('Ingrese el nombre de la modalidad de evento.');
            return;
        }

        setSaving(true);

        const toastId = notifyLoading(
            isEditing
                ? 'Actualizando modalidad de evento...'
                : 'Registrando modalidad de evento...'
        );

        try {
            const payload = buildPayload();

            if (isEditing) {
                await actualizarModalidadEvento(editingId, payload);
                notifySuccess('Modalidad de evento actualizada correctamente.');
            } else {
                await crearModalidadEvento(payload);
                notifySuccess('Modalidad de evento registrada correctamente.');
            }

            cerrarFormulario();
            await cargarDatos();
        } catch (err) {
            notifyError(
                getApiErrorMessage(
                    err,
                    'No se pudo guardar la modalidad de evento.'
                )
            );
        } finally {
            closeNotify(toastId);
            setSaving(false);
        }
    };

    const handleDelete = async (modalidad) => {
        const totalEventos =
            modalidad.eventos_count ||
            modalidad.eventosCount ||
            modalidad.total_eventos ||
            0;

        if (Number(totalEventos) > 0) {
            notifyError(
                'No se puede eliminar esta modalidad porque tiene eventos asociados.'
            );
            return;
        }

        const ok = confirm(
            `¿Eliminar la modalidad "${modalidad.nombre}"?\n\nSolo se eliminará si no tiene eventos asociados.`
        );

        if (!ok) return;

        const toastId = notifyLoading('Eliminando modalidad de evento...');

        try {
            await eliminarModalidadEvento(modalidad.idmodalidad);

            notifySuccess('Modalidad de evento eliminada correctamente.');
            await cargarDatos();
        } catch (err) {
            notifyError(
                getApiErrorMessage(
                    err,
                    'No se pudo eliminar la modalidad. Verifica que no tenga eventos asociados.'
                )
            );
        } finally {
            closeNotify(toastId);
        }
    };

    const handleToggleActivo = async (modalidad) => {
        const nuevoEstado = !Boolean(Number(modalidad.activo));

        const toastId = notifyLoading(
            nuevoEstado
                ? 'Activando modalidad de evento...'
                : 'Desactivando modalidad de evento...'
        );

        try {
            await actualizarModalidadEvento(modalidad.idmodalidad, {
                nombre: modalidad.nombre,
                descripcion: modalidad.descripcion || null,
                activo: nuevoEstado ? 1 : 0,
            });

            notifySuccess(
                nuevoEstado
                    ? 'Modalidad de evento activada correctamente.'
                    : 'Modalidad de evento desactivada correctamente.'
            );

            await cargarDatos();
        } catch (err) {
            notifyError(
                getApiErrorMessage(
                    err,
                    'No se pudo cambiar el estado de la modalidad.'
                )
            );
        } finally {
            closeNotify(toastId);
        }
    };

    return (
        <section className="modalidades-evento-page">
            <div className="modalidades-evento-header">
                <div>
                    <span className="modalidades-evento-eyebrow">
                        Clasificación y configuración
                    </span>
                    <h1>Modalidades de evento</h1>
                    <p>
                        Administra las modalidades usadas para clasificar eventos
                        tecnológicos, como presencial, virtual o semipresencial.
                    </p>
                </div>

                {!showForm && (
                    <button
                        type="button"
                        className="modalidades-evento-add-button"
                        onClick={abrirFormularioCrear}
                    >
                        <Plus size={18} />
                        Agregar modalidad
                    </button>
                )}
            </div>

            {showForm && (
                <div className="modalidades-evento-form-card">
                    <div className="modalidades-evento-form-header">
                        <div>
                            <h2>
                                {isEditing
                                    ? 'Editar modalidad de evento'
                                    : 'Agregar modalidad de evento'}
                            </h2>
                            <p>
                                Completa el nombre, descripción y estado. El slug
                                será generado automáticamente por el backend.
                            </p>
                        </div>

                        <button
                            type="button"
                            className="modalidades-evento-close-button"
                            onClick={cerrarFormulario}
                        >
                            <X size={18} />
                        </button>
                    </div>

                    <form
                        className="modalidades-evento-form"
                        onSubmit={handleSubmit}
                    >
                        <div className="modalidades-evento-form-grid">
                            <div className="modalidades-evento-field">
                                <label>Nombre</label>
                                <input
                                    name="nombre"
                                    value={form.nombre}
                                    onChange={handleChange}
                                    maxLength={100}
                                    placeholder="Ej. Virtual"
                                    required
                                />
                            </div>

                            <div className="modalidades-evento-field">
                                <label>Descripción</label>
                                <textarea
                                    name="descripcion"
                                    value={form.descripcion}
                                    onChange={handleChange}
                                    maxLength={255}
                                    rows={4}
                                    placeholder="Descripción breve de la modalidad."
                                />
                            </div>

                            <label className="modalidades-evento-checkbox">
                                <input
                                    type="checkbox"
                                    name="activo"
                                    checked={form.activo}
                                    onChange={handleChange}
                                />
                                Modalidad activa
                            </label>
                        </div>

                        <div className="modalidades-evento-form-actions">
                            <button
                                type="submit"
                                className="modalidades-evento-save-button"
                                disabled={saving}
                            >
                                <Save size={17} />
                                {saving
                                    ? 'Guardando...'
                                    : isEditing
                                        ? 'Actualizar modalidad'
                                        : 'Guardar modalidad'}
                            </button>

                            <button
                                type="button"
                                className="modalidades-evento-cancel-button"
                                onClick={cerrarFormulario}
                            >
                                Cancelar
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="modalidades-evento-list-card">
                <div className="modalidades-evento-list-header">
                    <div>
                        <h2>Modalidades registradas</h2>
                        <p>
                            Listado de modalidades disponibles para clasificar eventos.
                        </p>
                    </div>

                    <div className="modalidades-evento-search">
                        <Search size={17} />
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Buscar modalidad..."
                        />
                    </div>
                </div>

                {loading ? (
                    <p className="modalidades-evento-empty">
                        Cargando modalidades de evento...
                    </p>
                ) : modalidadesEventoFiltradas.length === 0 ? (
                    <div className="modalidades-evento-empty-box">
                        <h3>No hay modalidades para mostrar</h3>
                        <p>
                            Registra una modalidad o cambia el criterio de búsqueda.
                        </p>
                    </div>
                ) : (
                    <div className="modalidades-evento-table-wrap">
                        <table className="modalidades-evento-table">
                            <thead>
                            <tr>
                                <th>Modalidad</th>
                                <th>Slug</th>
                                <th>Descripción</th>
                                <th>Estado</th>
                                <th>Eventos</th>
                                <th>Actualización</th>
                                <th>Acciones</th>
                            </tr>
                            </thead>

                            <tbody>
                            {modalidadesEventoFiltradas.map((modalidad) => {
                                const activo = Boolean(Number(modalidad.activo));

                                const totalEventos =
                                    modalidad.eventos_count ||
                                    modalidad.eventosCount ||
                                    modalidad.total_eventos ||
                                    0;

                                return (
                                    <tr key={modalidad.idmodalidad}>
                                        <td>
                                            <div className="modalidades-evento-name">
                                                    <span>
                                                        <MapPin size={18} />
                                                    </span>

                                                <strong>{modalidad.nombre}</strong>
                                            </div>
                                        </td>

                                        <td>
                                            <code>{modalidad.slug || '-'}</code>
                                        </td>

                                        <td>{modalidad.descripcion || '-'}</td>

                                        <td>
                                                <span
                                                    className={
                                                        activo
                                                            ? 'modalidades-evento-status active'
                                                            : 'modalidades-evento-status inactive'
                                                    }
                                                >
                                                    {activo ? 'Activo' : 'Inactivo'}
                                                </span>
                                        </td>

                                        <td>{Number(totalEventos)}</td>

                                        <td>{formatDate(modalidad.updated_at)}</td>

                                        <td>
                                            <div className="modalidades-evento-actions">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        handleToggleActivo(modalidad)
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
                                                        handleEdit(modalidad)
                                                    }
                                                    title="Editar"
                                                >
                                                    <Pencil size={16} />
                                                </button>

                                                <button
                                                    type="button"
                                                    className="danger"
                                                    onClick={() =>
                                                        handleDelete(modalidad)
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