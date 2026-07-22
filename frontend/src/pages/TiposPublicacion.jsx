import { useEffect, useMemo, useState } from 'react';
import {
    FileText,
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
    actualizarTipoPublicacion,
    crearTipoPublicacion,
    eliminarTipoPublicacion,
    listarTiposPublicacion,
} from '../api/tiposPublicacionApi';

import {
    closeNotify,
    getApiErrorMessage,
    notifyError,
    notifyLoading,
    notifySuccess,
} from '../utils/notify';

import ConPermiso from '../components/ConPermiso';

import '../styles/modules/tiposPublicacion.css';

const initialForm = {
    nombre: '',
    descripcion: '',
    activo: true,
};

export default function TiposPublicacion() {
    const [tiposPublicacion, setTiposPublicacion] = useState([]);
    const [form, setForm] = useState(initialForm);

    const [editingId, setEditingId] = useState(null);
    const [showForm, setShowForm] = useState(false);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [search, setSearch] = useState('');

    const isEditing = useMemo(() => Boolean(editingId), [editingId]);

    const tiposPublicacionFiltrados = useMemo(() => {
        const value = search.trim().toLowerCase();

        if (!value) return tiposPublicacion;

        return tiposPublicacion.filter((tipo) => {
            return (
                String(tipo.nombre || '').toLowerCase().includes(value) ||
                String(tipo.slug || '').toLowerCase().includes(value) ||
                String(tipo.descripcion || '').toLowerCase().includes(value)
            );
        });
    }, [tiposPublicacion, search]);

    const cargarDatos = async () => {
        setLoading(true);

        try {
            const data = await listarTiposPublicacion();

            setTiposPublicacion(
                Array.isArray(data)
                    ? data
                    : data?.data || []
            );
        } catch (err) {
            notifyError(
                getApiErrorMessage(
                    err,
                    'No se pudieron cargar los tipos de publicación.'
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
        setEditingId(tipo.idtipopublicacion);
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
            notifyError('Ingrese el nombre del tipo de publicación.');
            return;
        }

        setSaving(true);

        const toastId = notifyLoading(
            isEditing
                ? 'Actualizando tipo de publicación...'
                : 'Registrando tipo de publicación...'
        );

        try {
            const payload = buildPayload();

            if (isEditing) {
                await actualizarTipoPublicacion(editingId, payload);
                notifySuccess('Tipo de publicación actualizado correctamente.');
            } else {
                await crearTipoPublicacion(payload);
                notifySuccess('Tipo de publicación registrado correctamente.');
            }

            cerrarFormulario();
            await cargarDatos();
        } catch (err) {
            notifyError(
                getApiErrorMessage(
                    err,
                    'No se pudo guardar el tipo de publicación.'
                )
            );
        } finally {
            closeNotify(toastId);
            setSaving(false);
        }
    };

    const handleDelete = async (tipo) => {
        const totalNoticias =
            tipo.noticias_count ||
            tipo.noticiasCount ||
            tipo.total_noticias ||
            0;

        if (Number(totalNoticias) > 0) {
            notifyError(
                'No se puede eliminar este tipo de publicación porque tiene noticias asociadas.'
            );
            return;
        }

        const ok = confirm(
            `¿Eliminar el tipo de publicación "${tipo.nombre}"?\n\nSolo se eliminará si no tiene noticias asociadas.`
        );

        if (!ok) return;

        const toastId = notifyLoading('Eliminando tipo de publicación...');

        try {
            await eliminarTipoPublicacion(tipo.idtipopublicacion);

            notifySuccess('Tipo de publicación eliminado correctamente.');
            await cargarDatos();
        } catch (err) {
            notifyError(
                getApiErrorMessage(
                    err,
                    'No se pudo eliminar el tipo de publicación. Verifica que no tenga noticias asociadas.'
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
                ? 'Activando tipo de publicación...'
                : 'Desactivando tipo de publicación...'
        );

        try {
            await actualizarTipoPublicacion(tipo.idtipopublicacion, {
                nombre: tipo.nombre,
                descripcion: tipo.descripcion || null,
                activo: nuevoEstado ? 1 : 0,
            });

            notifySuccess(
                nuevoEstado
                    ? 'Tipo de publicación activado correctamente.'
                    : 'Tipo de publicación desactivado correctamente.'
            );

            await cargarDatos();
        } catch (err) {
            notifyError(
                getApiErrorMessage(
                    err,
                    'No se pudo cambiar el estado del tipo de publicación.'
                )
            );
        } finally {
            closeNotify(toastId);
        }
    };

    return (
        <section className="tipos-publicacion-page">
            <div className="tipos-publicacion-header">
                <div>
                    <span className="tipos-publicacion-eyebrow">
                        Clasificación y configuración
                    </span>
                    <h1>Tipos de publicación</h1>
                    <p>
                        Administra los tipos usados para clasificar noticias,
                        comunicados, alertas institucionales y demás publicaciones
                        del portal DSTI.
                    </p>
                </div>

                {!showForm && (
                    <ConPermiso permiso="catalogos.crear">
                        <button
                            type="button"
                            className="tipos-publicacion-add-button"
                            onClick={abrirFormularioCrear}
                        >
                            <Plus size={18} />
                            Agregar tipo
                        </button>
                    </ConPermiso>
                )}
            </div>

            {showForm && (
                <div className="tipos-publicacion-form-card">
                    <div className="tipos-publicacion-form-header">
                        <div>
                            <h2>
                                {isEditing
                                    ? 'Editar tipo de publicación'
                                    : 'Agregar tipo de publicación'}
                            </h2>
                            <p>
                                Completa el nombre, descripción y estado. El slug
                                será generado automáticamente por el backend.
                            </p>
                        </div>

                        <button
                            type="button"
                            className="tipos-publicacion-close-button"
                            onClick={cerrarFormulario}
                        >
                            <X size={18} />
                        </button>
                    </div>

                    <form
                        className="tipos-publicacion-form"
                        onSubmit={handleSubmit}
                    >
                        <div className="tipos-publicacion-form-grid">
                            <div className="tipos-publicacion-field">
                                <label>Nombre</label>
                                <input
                                    name="nombre"
                                    value={form.nombre}
                                    onChange={handleChange}
                                    maxLength={100}
                                    placeholder="Ej. Comunicado"
                                    required
                                />
                            </div>

                            <div className="tipos-publicacion-field">
                                <label>Descripción</label>
                                <textarea
                                    name="descripcion"
                                    value={form.descripcion}
                                    onChange={handleChange}
                                    maxLength={255}
                                    rows={4}
                                    placeholder="Descripción breve del tipo de publicación."
                                />
                            </div>

                            <label className="tipos-publicacion-checkbox">
                                <input
                                    type="checkbox"
                                    name="activo"
                                    checked={form.activo}
                                    onChange={handleChange}
                                />
                                Tipo de publicación activo
                            </label>
                        </div>

                        <div className="tipos-publicacion-form-actions">
                            <button
                                type="submit"
                                className="tipos-publicacion-save-button"
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
                                className="tipos-publicacion-cancel-button"
                                onClick={cerrarFormulario}
                            >
                                Cancelar
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="tipos-publicacion-list-card">
                <div className="tipos-publicacion-list-header">
                    <div>
                        <h2>Tipos de publicación registrados</h2>
                        <p>
                            Listado de tipos disponibles para clasificar publicaciones.
                        </p>
                    </div>

                    <div className="tipos-publicacion-search">
                        <Search size={17} />
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Buscar tipo..."
                        />
                    </div>
                </div>

                {loading ? (
                    <p className="tipos-publicacion-empty">
                        Cargando tipos de publicación...
                    </p>
                ) : tiposPublicacionFiltrados.length === 0 ? (
                    <div className="tipos-publicacion-empty-box">
                        <h3>No hay tipos de publicación para mostrar</h3>
                        <p>
                            Registra un tipo de publicación o cambia el criterio
                            de búsqueda.
                        </p>
                    </div>
                ) : (
                    <div className="tipos-publicacion-table-wrap">
                        <table className="tipos-publicacion-table">
                            <thead>
                            <tr>
                                <th>Tipo de publicación</th>
                                <th>Slug</th>
                                <th>Descripción</th>
                                <th>Estado</th>
                                <th>Noticias</th>
                                <th>Actualización</th>
                                <th>Acciones</th>
                            </tr>
                            </thead>

                            <tbody>
                            {tiposPublicacionFiltrados.map((tipo) => {
                                const activo = Boolean(Number(tipo.activo));

                                const totalNoticias =
                                    tipo.noticias_count ||
                                    tipo.noticiasCount ||
                                    tipo.total_noticias ||
                                    0;

                                return (
                                    <tr key={tipo.idtipopublicacion}>
                                        <td>
                                            <div className="tipos-publicacion-name">
                                                    <span>
                                                        <FileText size={18} />
                                                    </span>

                                                <strong>{tipo.nombre}</strong>
                                            </div>
                                        </td>

                                        <td>
                                            <code>{tipo.slug || '-'}</code>
                                        </td>

                                        <td>
                                            {tipo.descripcion || '-'}
                                        </td>

                                        <td>
                                                <span
                                                    className={
                                                        activo
                                                            ? 'tipos-publicacion-status active'
                                                            : 'tipos-publicacion-status inactive'
                                                    }
                                                >
                                                    {activo ? 'Activo' : 'Inactivo'}
                                                </span>
                                        </td>

                                        <td>{Number(totalNoticias)}</td>

                                        <td>{formatDate(tipo.updated_at)}</td>

                                        <td>
                                            <div className="tipos-publicacion-actions">
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