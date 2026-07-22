import { useEffect, useMemo, useState } from 'react';
import {
    Network,
    Plus,
    X,
    Pencil,
    Trash2,
    Save,
    Search,
} from 'lucide-react';

import {
    actualizarTipoEntidad,
    crearTipoEntidad,
    eliminarTipoEntidad,
    listarTiposEntidad,
} from '../api/tiposEntidadApi';

import {
    closeNotify,
    getApiErrorMessage,
    notifyError,
    notifyLoading,
    notifySuccess,
} from '../utils/notify';

import ConPermiso from '../components/ConPermiso';

import '../styles/modules/tiposEntidad.css';

const initialForm = {
    nombre: '',
};

export default function TiposEntidad() {
    const [tiposEntidad, setTiposEntidad] = useState([]);
    const [form, setForm] = useState(initialForm);

    const [editingId, setEditingId] = useState(null);
    const [showForm, setShowForm] = useState(false);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [search, setSearch] = useState('');

    const isEditing = useMemo(() => Boolean(editingId), [editingId]);

    const tiposEntidadFiltrados = useMemo(() => {
        const value = search.trim().toLowerCase();

        if (!value) return tiposEntidad;

        return tiposEntidad.filter((tipo) => {
            return (
                String(tipo.nombre || '').toLowerCase().includes(value) ||
                String(tipo.slug || '').toLowerCase().includes(value)
            );
        });
    }, [tiposEntidad, search]);

    const cargarDatos = async () => {
        setLoading(true);

        try {
            const data = await listarTiposEntidad();

            setTiposEntidad(
                Array.isArray(data)
                    ? data
                    : data?.data || []
            );
        } catch (err) {
            notifyError(
                getApiErrorMessage(
                    err,
                    'No se pudieron cargar los tipos de entidad.'
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
        const { name, value } = e.target;

        setForm({
            ...form,
            [name]: value,
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
        setEditingId(tipo.idtipoentidad);
        setShowForm(true);

        setForm({
            nombre: tipo.nombre || '',
        });

        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const buildPayload = () => {
        return {
            nombre: form.nombre.trim(),
        };
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!form.nombre.trim()) {
            notifyError('Ingrese el nombre del tipo de entidad.');
            return;
        }

        setSaving(true);

        const toastId = notifyLoading(
            isEditing
                ? 'Actualizando tipo de entidad...'
                : 'Registrando tipo de entidad...'
        );

        try {
            const payload = buildPayload();

            if (isEditing) {
                await actualizarTipoEntidad(editingId, payload);
                notifySuccess('Tipo de entidad actualizado correctamente.');
            } else {
                await crearTipoEntidad(payload);
                notifySuccess('Tipo de entidad registrado correctamente.');
            }

            cerrarFormulario();
            await cargarDatos();
        } catch (err) {
            notifyError(
                getApiErrorMessage(
                    err,
                    'No se pudo guardar el tipo de entidad.'
                )
            );
        } finally {
            closeNotify(toastId);
            setSaving(false);
        }
    };

    const handleDelete = async (tipo) => {
        const totalEstados =
            tipo.estados_count ||
            tipo.estadosCount ||
            tipo.total_estados ||
            0;

        if (Number(totalEstados) > 0) {
            notifyError(
                'No se puede eliminar este tipo de entidad porque tiene estados asociados.'
            );
            return;
        }

        const ok = confirm(
            `¿Eliminar el tipo de entidad "${tipo.nombre}"?\n\nSolo se eliminará si no tiene estados asociados.`
        );

        if (!ok) return;

        const toastId = notifyLoading('Eliminando tipo de entidad...');

        try {
            await eliminarTipoEntidad(tipo.idtipoentidad);

            notifySuccess('Tipo de entidad eliminado correctamente.');
            await cargarDatos();
        } catch (err) {
            notifyError(
                getApiErrorMessage(
                    err,
                    'No se pudo eliminar el tipo de entidad. Verifica que no tenga estados asociados.'
                )
            );
        } finally {
            closeNotify(toastId);
        }
    };

    return (
        <section className="tipos-entidad-page">
            <div className="tipos-entidad-header">
                <div>
                    <span className="tipos-entidad-eyebrow">
                        Clasificación y configuración
                    </span>
                    <h1>Tipos de entidad</h1>
                    <p>
                        Administra los tipos de entidad usados para agrupar estados
                        del portal. Por ejemplo: noticias, documentos, eventos,
                        solicitudes o usuarios.
                    </p>
                </div>

                {!showForm && (
                    <ConPermiso permiso="catalogos.crear">
                        <button
                            type="button"
                            className="tipos-entidad-add-button"
                            onClick={abrirFormularioCrear}
                        >
                            <Plus size={18} />
                            Agregar tipo
                        </button>
                    </ConPermiso>
                )}
            </div>

            {showForm && (
                <div className="tipos-entidad-form-card">
                    <div className="tipos-entidad-form-header">
                        <div>
                            <h2>
                                {isEditing
                                    ? 'Editar tipo de entidad'
                                    : 'Agregar tipo de entidad'}
                            </h2>
                            <p>
                                Completa el nombre del tipo de entidad. El slug será
                                generado automáticamente por el backend.
                            </p>
                        </div>

                        <button
                            type="button"
                            className="tipos-entidad-close-button"
                            onClick={cerrarFormulario}
                        >
                            <X size={18} />
                        </button>
                    </div>

                    <form
                        className="tipos-entidad-form"
                        onSubmit={handleSubmit}
                    >
                        <div className="tipos-entidad-form-grid">
                            <div className="tipos-entidad-field">
                                <label>Nombre</label>
                                <input
                                    name="nombre"
                                    value={form.nombre}
                                    onChange={handleChange}
                                    maxLength={100}
                                    placeholder="Ej. Noticias"
                                    required
                                />
                            </div>
                        </div>

                        <div className="tipos-entidad-form-actions">
                            <button
                                type="submit"
                                className="tipos-entidad-save-button"
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
                                className="tipos-entidad-cancel-button"
                                onClick={cerrarFormulario}
                            >
                                Cancelar
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="tipos-entidad-list-card">
                <div className="tipos-entidad-list-header">
                    <div>
                        <h2>Tipos de entidad registrados</h2>
                        <p>
                            Listado de tipos usados para clasificar los estados del sistema.
                        </p>
                    </div>

                    <div className="tipos-entidad-search">
                        <Search size={17} />
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Buscar tipo..."
                        />
                    </div>
                </div>

                {loading ? (
                    <p className="tipos-entidad-empty">
                        Cargando tipos de entidad...
                    </p>
                ) : tiposEntidadFiltrados.length === 0 ? (
                    <div className="tipos-entidad-empty-box">
                        <h3>No hay tipos de entidad para mostrar</h3>
                        <p>
                            Registra un tipo de entidad o cambia el criterio de búsqueda.
                        </p>
                    </div>
                ) : (
                    <div className="tipos-entidad-table-wrap">
                        <table className="tipos-entidad-table">
                            <thead>
                            <tr>
                                <th>Tipo de entidad</th>
                                <th>Slug</th>
                                <th>Estados</th>
                                <th>Creación</th>
                                <th>Actualización</th>
                                <th>Acciones</th>
                            </tr>
                            </thead>

                            <tbody>
                            {tiposEntidadFiltrados.map((tipo) => {
                                const totalEstados =
                                    tipo.estados_count ||
                                    tipo.estadosCount ||
                                    tipo.total_estados ||
                                    0;

                                return (
                                    <tr key={tipo.idtipoentidad}>
                                        <td>
                                            <div className="tipos-entidad-name">
                                                    <span>
                                                        <Network size={18} />
                                                    </span>

                                                <strong>{tipo.nombre}</strong>
                                            </div>
                                        </td>

                                        <td>
                                            <code>{tipo.slug || '-'}</code>
                                        </td>

                                        <td>
                                            {Number(totalEstados)}
                                        </td>

                                        <td>
                                            {formatDate(tipo.created_at)}
                                        </td>

                                        <td>
                                            {formatDate(tipo.updated_at)}
                                        </td>

                                        <td>
                                            <div className="tipos-entidad-actions">
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