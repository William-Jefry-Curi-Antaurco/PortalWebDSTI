import { useEffect, useMemo, useState } from 'react';
import {
    Activity,
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
    actualizarEstadoOperativo,
    crearEstadoOperativo,
    eliminarEstadoOperativo,
    listarEstadosOperativos,
} from '../api/estadosOperativosApi';

import {
    closeNotify,
    getApiErrorMessage,
    notifyError,
    notifyLoading,
    notifySuccess,
} from '../utils/notify';

import '../styles/modules/estadosOperativos.css';

const initialForm = {
    nombre: '',
    descripcion: '',
    activo: true,
};

export default function EstadosOperativos() {
    const [estadosOperativos, setEstadosOperativos] = useState([]);
    const [form, setForm] = useState(initialForm);

    const [editingId, setEditingId] = useState(null);
    const [showForm, setShowForm] = useState(false);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [search, setSearch] = useState('');

    const isEditing = useMemo(() => Boolean(editingId), [editingId]);

    const estadosOperativosFiltrados = useMemo(() => {
        const value = search.trim().toLowerCase();

        if (!value) return estadosOperativos;

        return estadosOperativos.filter((estado) => {
            return (
                String(estado.nombre || '').toLowerCase().includes(value) ||
                String(estado.slug || '').toLowerCase().includes(value) ||
                String(estado.descripcion || '').toLowerCase().includes(value)
            );
        });
    }, [estadosOperativos, search]);

    const cargarDatos = async () => {
        setLoading(true);

        try {
            const data = await listarEstadosOperativos();

            setEstadosOperativos(
                Array.isArray(data)
                    ? data
                    : data?.data || []
            );
        } catch (err) {
            notifyError(
                getApiErrorMessage(
                    err,
                    'No se pudieron cargar los estados operativos.'
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

    const handleEdit = (estado) => {
        setEditingId(estado.idestadooperativo);
        setShowForm(true);

        setForm({
            nombre: estado.nombre || '',
            descripcion: estado.descripcion || '',
            activo: Boolean(Number(estado.activo)),
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
            notifyError('Ingrese el nombre del estado operativo.');
            return;
        }

        setSaving(true);

        const toastId = notifyLoading(
            isEditing
                ? 'Actualizando estado operativo...'
                : 'Registrando estado operativo...'
        );

        try {
            const payload = buildPayload();

            if (isEditing) {
                await actualizarEstadoOperativo(editingId, payload);
                notifySuccess('Estado operativo actualizado correctamente.');
            } else {
                await crearEstadoOperativo(payload);
                notifySuccess('Estado operativo registrado correctamente.');
            }

            cerrarFormulario();
            await cargarDatos();
        } catch (err) {
            notifyError(
                getApiErrorMessage(
                    err,
                    'No se pudo guardar el estado operativo.'
                )
            );
        } finally {
            closeNotify(toastId);
            setSaving(false);
        }
    };

    const handleDelete = async (estado) => {
        const totalSistemas =
            estado.enlaces_sistemas_count ||
            estado.enlacesSistemasCount ||
            estado.sistemas_count ||
            estado.sistemasCount ||
            estado.total_sistemas ||
            estado.total_enlaces_sistemas ||
            0;

        if (Number(totalSistemas) > 0) {
            notifyError(
                'No se puede eliminar este estado operativo porque tiene sistemas asociados.'
            );
            return;
        }

        const ok = confirm(
            `¿Eliminar el estado operativo "${estado.nombre}"?\n\nSolo se eliminará si no tiene sistemas asociados.`
        );

        if (!ok) return;

        const toastId = notifyLoading('Eliminando estado operativo...');

        try {
            await eliminarEstadoOperativo(estado.idestadooperativo);

            notifySuccess('Estado operativo eliminado correctamente.');
            await cargarDatos();
        } catch (err) {
            notifyError(
                getApiErrorMessage(
                    err,
                    'No se pudo eliminar el estado operativo. Verifica que no tenga sistemas asociados.'
                )
            );
        } finally {
            closeNotify(toastId);
        }
    };

    const handleToggleActivo = async (estado) => {
        const nuevoEstado = !Boolean(Number(estado.activo));

        const toastId = notifyLoading(
            nuevoEstado
                ? 'Activando estado operativo...'
                : 'Desactivando estado operativo...'
        );

        try {
            await actualizarEstadoOperativo(estado.idestadooperativo, {
                nombre: estado.nombre,
                descripcion: estado.descripcion || null,
                activo: nuevoEstado ? 1 : 0,
            });

            notifySuccess(
                nuevoEstado
                    ? 'Estado operativo activado correctamente.'
                    : 'Estado operativo desactivado correctamente.'
            );

            await cargarDatos();
        } catch (err) {
            notifyError(
                getApiErrorMessage(
                    err,
                    'No se pudo cambiar el estado operativo.'
                )
            );
        } finally {
            closeNotify(toastId);
        }
    };

    return (
        <section className="estados-operativos-page">
            <div className="estados-operativos-header">
                <div>
                    <span className="estados-operativos-eyebrow">
                        Clasificación y configuración
                    </span>
                    <h1>Estados operativos</h1>
                    <p>
                        Administra los estados operativos usados para los sistemas
                        institucionales, por ejemplo: activo, mantenimiento,
                        intermitente o fuera de servicio.
                    </p>
                </div>

                {!showForm && (
                    <button
                        type="button"
                        className="estados-operativos-add-button"
                        onClick={abrirFormularioCrear}
                    >
                        <Plus size={18} />
                        Agregar estado
                    </button>
                )}
            </div>

            {showForm && (
                <div className="estados-operativos-form-card">
                    <div className="estados-operativos-form-header">
                        <div>
                            <h2>
                                {isEditing
                                    ? 'Editar estado operativo'
                                    : 'Agregar estado operativo'}
                            </h2>
                            <p>
                                Completa el nombre, descripción y estado. El slug
                                será generado automáticamente por el backend.
                            </p>
                        </div>

                        <button
                            type="button"
                            className="estados-operativos-close-button"
                            onClick={cerrarFormulario}
                        >
                            <X size={18} />
                        </button>
                    </div>

                    <form
                        className="estados-operativos-form"
                        onSubmit={handleSubmit}
                    >
                        <div className="estados-operativos-form-grid">
                            <div className="estados-operativos-field">
                                <label>Nombre</label>
                                <input
                                    name="nombre"
                                    value={form.nombre}
                                    onChange={handleChange}
                                    maxLength={60}
                                    placeholder="Ej. Operativo"
                                    required
                                />
                            </div>

                            <div className="estados-operativos-field">
                                <label>Descripción</label>
                                <textarea
                                    name="descripcion"
                                    value={form.descripcion}
                                    onChange={handleChange}
                                    maxLength={255}
                                    rows={4}
                                    placeholder="Descripción breve del estado operativo."
                                />
                            </div>

                            <label className="estados-operativos-checkbox">
                                <input
                                    type="checkbox"
                                    name="activo"
                                    checked={form.activo}
                                    onChange={handleChange}
                                />
                                Estado operativo activo
                            </label>
                        </div>

                        <div className="estados-operativos-form-actions">
                            <button
                                type="submit"
                                className="estados-operativos-save-button"
                                disabled={saving}
                            >
                                <Save size={17} />
                                {saving
                                    ? 'Guardando...'
                                    : isEditing
                                        ? 'Actualizar estado'
                                        : 'Guardar estado'}
                            </button>

                            <button
                                type="button"
                                className="estados-operativos-cancel-button"
                                onClick={cerrarFormulario}
                            >
                                Cancelar
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="estados-operativos-list-card">
                <div className="estados-operativos-list-header">
                    <div>
                        <h2>Estados operativos registrados</h2>
                        <p>
                            Listado de estados usados por los sistemas institucionales.
                        </p>
                    </div>

                    <div className="estados-operativos-search">
                        <Search size={17} />
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Buscar estado..."
                        />
                    </div>
                </div>

                {loading ? (
                    <p className="estados-operativos-empty">
                        Cargando estados operativos...
                    </p>
                ) : estadosOperativosFiltrados.length === 0 ? (
                    <div className="estados-operativos-empty-box">
                        <h3>No hay estados operativos para mostrar</h3>
                        <p>
                            Registra un estado operativo o cambia el criterio de búsqueda.
                        </p>
                    </div>
                ) : (
                    <div className="estados-operativos-table-wrap">
                        <table className="estados-operativos-table">
                            <thead>
                            <tr>
                                <th>Estado operativo</th>
                                <th>Slug</th>
                                <th>Descripción</th>
                                <th>Estado</th>
                                <th>Sistemas</th>
                                <th>Actualización</th>
                                <th>Acciones</th>
                            </tr>
                            </thead>

                            <tbody>
                            {estadosOperativosFiltrados.map((estado) => {
                                const activo = Boolean(Number(estado.activo));

                                const totalSistemas =
                                    estado.enlaces_sistemas_count ||
                                    estado.enlacesSistemasCount ||
                                    estado.sistemas_count ||
                                    estado.sistemasCount ||
                                    estado.total_sistemas ||
                                    estado.total_enlaces_sistemas ||
                                    0;

                                return (
                                    <tr key={estado.idestadooperativo}>
                                        <td>
                                            <div className="estados-operativos-name">
                                                    <span>
                                                        <Activity size={18} />
                                                    </span>

                                                <strong>{estado.nombre}</strong>
                                            </div>
                                        </td>

                                        <td>
                                            <code>{estado.slug || '-'}</code>
                                        </td>

                                        <td>{estado.descripcion || '-'}</td>

                                        <td>
                                                <span
                                                    className={
                                                        activo
                                                            ? 'estados-operativos-status active'
                                                            : 'estados-operativos-status inactive'
                                                    }
                                                >
                                                    {activo ? 'Activo' : 'Inactivo'}
                                                </span>
                                        </td>

                                        <td>{Number(totalSistemas)}</td>

                                        <td>{formatDate(estado.updated_at)}</td>

                                        <td>
                                            <div className="estados-operativos-actions">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        handleToggleActivo(estado)
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
                                                        handleEdit(estado)
                                                    }
                                                    title="Editar"
                                                >
                                                    <Pencil size={16} />
                                                </button>

                                                <button
                                                    type="button"
                                                    className="danger"
                                                    onClick={() =>
                                                        handleDelete(estado)
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