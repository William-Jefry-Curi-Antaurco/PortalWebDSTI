import { useEffect, useMemo, useState } from 'react';
import {
    LifeBuoy,
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
    actualizarTipoSoporte,
    crearTipoSoporte,
    eliminarTipoSoporte,
    listarTiposSoporte,
} from '../api/tiposSoporteApi';

import {
    closeNotify,
    getApiErrorMessage,
    notifyError,
    notifyLoading,
    notifySuccess,
} from '../utils/notify';

import '../styles/modules/tiposSoporte.css';

const initialForm = {
    nombre: '',
    descripcion: '',
    activo: true,
};

export default function TiposSoporte() {
    const [tiposSoporte, setTiposSoporte] = useState([]);
    const [form, setForm] = useState(initialForm);

    const [editingId, setEditingId] = useState(null);
    const [showForm, setShowForm] = useState(false);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [search, setSearch] = useState('');

    const isEditing = useMemo(() => Boolean(editingId), [editingId]);

    const tiposSoporteFiltrados = useMemo(() => {
        const value = search.trim().toLowerCase();

        if (!value) return tiposSoporte;

        return tiposSoporte.filter((tipo) => {
            return (
                String(tipo.nombre || '').toLowerCase().includes(value) ||
                String(tipo.descripcion || '').toLowerCase().includes(value)
            );
        });
    }, [tiposSoporte, search]);

    const cargarDatos = async () => {
        setLoading(true);

        try {
            const data = await listarTiposSoporte();

            setTiposSoporte(
                Array.isArray(data)
                    ? data
                    : data?.data || []
            );
        } catch (err) {
            notifyError(
                getApiErrorMessage(
                    err,
                    'No se pudieron cargar los tipos de soporte.'
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
        setEditingId(tipo.idtiposoporte);
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
            notifyError('Ingrese el nombre del tipo de soporte.');
            return;
        }

        setSaving(true);

        const toastId = notifyLoading(
            isEditing
                ? 'Actualizando tipo de soporte...'
                : 'Registrando tipo de soporte...'
        );

        try {
            const payload = buildPayload();

            if (isEditing) {
                await actualizarTipoSoporte(editingId, payload);
                notifySuccess('Tipo de soporte actualizado correctamente.');
            } else {
                await crearTipoSoporte(payload);
                notifySuccess('Tipo de soporte registrado correctamente.');
            }

            cerrarFormulario();
            await cargarDatos();
        } catch (err) {
            notifyError(
                getApiErrorMessage(
                    err,
                    'No se pudo guardar el tipo de soporte.'
                )
            );
        } finally {
            closeNotify(toastId);
            setSaving(false);
        }
    };

    const handleDelete = async (tipo) => {
        const totalSolicitudes =
            tipo.solicitudes_soporte_count ||
            tipo.solicitudesSoporteCount ||
            tipo.solicitudes_count ||
            tipo.solicitudesCount ||
            tipo.total_solicitudes ||
            tipo.total_solicitudes_soporte ||
            0;

        if (Number(totalSolicitudes) > 0) {
            notifyError(
                'No se puede eliminar este tipo de soporte porque tiene solicitudes asociadas.'
            );
            return;
        }

        const ok = confirm(
            `¿Eliminar el tipo de soporte "${tipo.nombre}"?\n\nSolo se eliminará si no tiene solicitudes asociadas.`
        );

        if (!ok) return;

        const toastId = notifyLoading('Eliminando tipo de soporte...');

        try {
            await eliminarTipoSoporte(tipo.idtiposoporte);

            notifySuccess('Tipo de soporte eliminado correctamente.');
            await cargarDatos();
        } catch (err) {
            notifyError(
                getApiErrorMessage(
                    err,
                    'No se pudo eliminar el tipo de soporte. Verifica que no tenga solicitudes asociadas.'
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
                ? 'Activando tipo de soporte...'
                : 'Desactivando tipo de soporte...'
        );

        try {
            await actualizarTipoSoporte(tipo.idtiposoporte, {
                nombre: tipo.nombre,
                descripcion: tipo.descripcion || null,
                activo: nuevoEstado ? 1 : 0,
            });

            notifySuccess(
                nuevoEstado
                    ? 'Tipo de soporte activado correctamente.'
                    : 'Tipo de soporte desactivado correctamente.'
            );

            await cargarDatos();
        } catch (err) {
            notifyError(
                getApiErrorMessage(
                    err,
                    'No se pudo cambiar el estado del tipo de soporte.'
                )
            );
        } finally {
            closeNotify(toastId);
        }
    };

    return (
        <section className="tipos-soporte-page">
            <div className="tipos-soporte-header">
                <div>
                    <span className="tipos-soporte-eyebrow">
                        Clasificación y configuración
                    </span>
                    <h1>Tipos de soporte</h1>
                    <p>
                        Administra los tipos usados para clasificar solicitudes
                        de soporte técnico, incidencias, consultas, accesos,
                        mantenimiento y atención tecnológica del portal DSTI.
                    </p>
                </div>

                {!showForm && (
                    <button
                        type="button"
                        className="tipos-soporte-add-button"
                        onClick={abrirFormularioCrear}
                    >
                        <Plus size={18} />
                        Agregar tipo
                    </button>
                )}
            </div>

            {showForm && (
                <div className="tipos-soporte-form-card">
                    <div className="tipos-soporte-form-header">
                        <div>
                            <h2>
                                {isEditing
                                    ? 'Editar tipo de soporte'
                                    : 'Agregar tipo de soporte'}
                            </h2>
                            <p>
                                Completa el nombre, descripción y estado del tipo
                                de soporte. Este catálogo será usado por las
                                solicitudes de soporte.
                            </p>
                        </div>

                        <button
                            type="button"
                            className="tipos-soporte-close-button"
                            onClick={cerrarFormulario}
                        >
                            <X size={18} />
                        </button>
                    </div>

                    <form
                        className="tipos-soporte-form"
                        onSubmit={handleSubmit}
                    >
                        <div className="tipos-soporte-form-grid">
                            <div className="tipos-soporte-field">
                                <label>Nombre</label>
                                <input
                                    name="nombre"
                                    value={form.nombre}
                                    onChange={handleChange}
                                    maxLength={100}
                                    placeholder="Ej. Incidencia técnica"
                                    required
                                />
                            </div>

                            <div className="tipos-soporte-field">
                                <label>Descripción</label>
                                <textarea
                                    name="descripcion"
                                    value={form.descripcion}
                                    onChange={handleChange}
                                    maxLength={255}
                                    rows={4}
                                    placeholder="Descripción breve del tipo de soporte."
                                />
                            </div>

                            <label className="tipos-soporte-checkbox">
                                <input
                                    type="checkbox"
                                    name="activo"
                                    checked={form.activo}
                                    onChange={handleChange}
                                />
                                Tipo de soporte activo
                            </label>
                        </div>

                        <div className="tipos-soporte-form-actions">
                            <button
                                type="submit"
                                className="tipos-soporte-save-button"
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
                                className="tipos-soporte-cancel-button"
                                onClick={cerrarFormulario}
                            >
                                Cancelar
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="tipos-soporte-list-card">
                <div className="tipos-soporte-list-header">
                    <div>
                        <h2>Tipos de soporte registrados</h2>
                        <p>
                            Listado de tipos disponibles para clasificar solicitudes
                            de soporte técnico.
                        </p>
                    </div>

                    <div className="tipos-soporte-search">
                        <Search size={17} />
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Buscar tipo..."
                        />
                    </div>
                </div>

                {loading ? (
                    <p className="tipos-soporte-empty">
                        Cargando tipos de soporte...
                    </p>
                ) : tiposSoporteFiltrados.length === 0 ? (
                    <div className="tipos-soporte-empty-box">
                        <h3>No hay tipos de soporte para mostrar</h3>
                        <p>
                            Registra un tipo de soporte o cambia el criterio
                            de búsqueda.
                        </p>
                    </div>
                ) : (
                    <div className="tipos-soporte-table-wrap">
                        <table className="tipos-soporte-table">
                            <thead>
                            <tr>
                                <th>Tipo de soporte</th>
                                <th>Descripción</th>
                                <th>Estado</th>
                                <th>Solicitudes</th>
                                <th>Actualización</th>
                                <th>Acciones</th>
                            </tr>
                            </thead>

                            <tbody>
                            {tiposSoporteFiltrados.map((tipo) => {
                                const activo = Boolean(Number(tipo.activo));

                                const totalSolicitudes =
                                    tipo.solicitudes_soporte_count ||
                                    tipo.solicitudesSoporteCount ||
                                    tipo.solicitudes_count ||
                                    tipo.solicitudesCount ||
                                    tipo.total_solicitudes ||
                                    tipo.total_solicitudes_soporte ||
                                    0;

                                return (
                                    <tr key={tipo.idtiposoporte}>
                                        <td>
                                            <div className="tipos-soporte-name">
                                                    <span>
                                                        <LifeBuoy size={18} />
                                                    </span>

                                                <strong>{tipo.nombre}</strong>
                                            </div>
                                        </td>

                                        <td>{tipo.descripcion || '-'}</td>

                                        <td>
                                                <span
                                                    className={
                                                        activo
                                                            ? 'tipos-soporte-status active'
                                                            : 'tipos-soporte-status inactive'
                                                    }
                                                >
                                                    {activo ? 'Activo' : 'Inactivo'}
                                                </span>
                                        </td>

                                        <td>{Number(totalSolicitudes)}</td>

                                        <td>{formatDate(tipo.updated_at)}</td>

                                        <td>
                                            <div className="tipos-soporte-actions">
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

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        handleEdit(tipo)
                                                    }
                                                    title="Editar"
                                                >
                                                    <Pencil size={16} />
                                                </button>

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