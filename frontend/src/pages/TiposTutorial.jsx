import { useEffect, useMemo, useState } from 'react';
import {
    GraduationCap,
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
    actualizarTipoTutorial,
    crearTipoTutorial,
    eliminarTipoTutorial,
    listarTiposTutorial,
} from '../api/tiposTutorialApi';

import {
    closeNotify,
    getApiErrorMessage,
    notifyError,
    notifyLoading,
    notifySuccess,
} from '../utils/notify';

import '../styles/modules/tiposTutorial.css';

const initialForm = {
    nombre: '',
    descripcion: '',
    activo: true,
};

export default function TiposTutorial() {
    const [tiposTutorial, setTiposTutorial] = useState([]);
    const [form, setForm] = useState(initialForm);

    const [editingId, setEditingId] = useState(null);
    const [showForm, setShowForm] = useState(false);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [search, setSearch] = useState('');

    const isEditing = useMemo(() => Boolean(editingId), [editingId]);

    const tiposTutorialFiltrados = useMemo(() => {
        const value = search.trim().toLowerCase();

        if (!value) return tiposTutorial;

        return tiposTutorial.filter((tipo) => {
            return (
                String(tipo.nombre || '').toLowerCase().includes(value) ||
                String(tipo.slug || '').toLowerCase().includes(value) ||
                String(tipo.descripcion || '').toLowerCase().includes(value)
            );
        });
    }, [tiposTutorial, search]);

    const cargarDatos = async () => {
        setLoading(true);

        try {
            const data = await listarTiposTutorial();

            setTiposTutorial(
                Array.isArray(data)
                    ? data
                    : data?.data || []
            );
        } catch (err) {
            notifyError(
                getApiErrorMessage(
                    err,
                    'No se pudieron cargar los tipos de tutorial.'
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
        setEditingId(tipo.idtipotutorial);
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
            notifyError('Ingrese el nombre del tipo de tutorial.');
            return;
        }

        setSaving(true);

        const toastId = notifyLoading(
            isEditing
                ? 'Actualizando tipo de tutorial...'
                : 'Registrando tipo de tutorial...'
        );

        try {
            const payload = buildPayload();

            if (isEditing) {
                await actualizarTipoTutorial(editingId, payload);
                notifySuccess('Tipo de tutorial actualizado correctamente.');
            } else {
                await crearTipoTutorial(payload);
                notifySuccess('Tipo de tutorial registrado correctamente.');
            }

            cerrarFormulario();
            await cargarDatos();
        } catch (err) {
            notifyError(
                getApiErrorMessage(
                    err,
                    'No se pudo guardar el tipo de tutorial.'
                )
            );
        } finally {
            closeNotify(toastId);
            setSaving(false);
        }
    };

    const handleDelete = async (tipo) => {
        const totalTutoriales =
            tipo.tutoriales_count ||
            tipo.tutorialesCount ||
            tipo.total_tutoriales ||
            0;

        if (Number(totalTutoriales) > 0) {
            notifyError(
                'No se puede eliminar este tipo de tutorial porque tiene tutoriales asociados.'
            );
            return;
        }

        const ok = confirm(
            `¿Eliminar el tipo de tutorial "${tipo.nombre}"?\n\nSolo se eliminará si no tiene tutoriales asociados.`
        );

        if (!ok) return;

        const toastId = notifyLoading('Eliminando tipo de tutorial...');

        try {
            await eliminarTipoTutorial(tipo.idtipotutorial);

            notifySuccess('Tipo de tutorial eliminado correctamente.');
            await cargarDatos();
        } catch (err) {
            notifyError(
                getApiErrorMessage(
                    err,
                    'No se pudo eliminar el tipo de tutorial. Verifica que no tenga tutoriales asociados.'
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
                ? 'Activando tipo de tutorial...'
                : 'Desactivando tipo de tutorial...'
        );

        try {
            await actualizarTipoTutorial(tipo.idtipotutorial, {
                nombre: tipo.nombre,
                descripcion: tipo.descripcion || null,
                activo: nuevoEstado ? 1 : 0,
            });

            notifySuccess(
                nuevoEstado
                    ? 'Tipo de tutorial activado correctamente.'
                    : 'Tipo de tutorial desactivado correctamente.'
            );

            await cargarDatos();
        } catch (err) {
            notifyError(
                getApiErrorMessage(
                    err,
                    'No se pudo cambiar el estado del tipo de tutorial.'
                )
            );
        } finally {
            closeNotify(toastId);
        }
    };

    return (
        <section className="tipos-tutorial-page">
            <div className="tipos-tutorial-header">
                <div>
                    <span className="tipos-tutorial-eyebrow">
                        Clasificación y configuración
                    </span>
                    <h1>Tipos de tutorial</h1>
                    <p>
                        Administra los tipos usados para clasificar guías, videos,
                        manuales de apoyo, recursos HTML y tutoriales del portal DSTI.
                    </p>
                </div>

                {!showForm && (
                    <button
                        type="button"
                        className="tipos-tutorial-add-button"
                        onClick={abrirFormularioCrear}
                    >
                        <Plus size={18} />
                        Agregar tipo
                    </button>
                )}
            </div>

            {showForm && (
                <div className="tipos-tutorial-form-card">
                    <div className="tipos-tutorial-form-header">
                        <div>
                            <h2>
                                {isEditing
                                    ? 'Editar tipo de tutorial'
                                    : 'Agregar tipo de tutorial'}
                            </h2>
                            <p>
                                Completa el nombre, descripción y estado. El slug
                                será generado automáticamente por el backend.
                            </p>
                        </div>

                        <button
                            type="button"
                            className="tipos-tutorial-close-button"
                            onClick={cerrarFormulario}
                        >
                            <X size={18} />
                        </button>
                    </div>

                    <form
                        className="tipos-tutorial-form"
                        onSubmit={handleSubmit}
                    >
                        <div className="tipos-tutorial-form-grid">
                            <div className="tipos-tutorial-field">
                                <label>Nombre</label>
                                <input
                                    name="nombre"
                                    value={form.nombre}
                                    onChange={handleChange}
                                    maxLength={100}
                                    placeholder="Ej. Video tutorial"
                                    required
                                />
                            </div>

                            <div className="tipos-tutorial-field">
                                <label>Descripción</label>
                                <textarea
                                    name="descripcion"
                                    value={form.descripcion}
                                    onChange={handleChange}
                                    maxLength={255}
                                    rows={4}
                                    placeholder="Descripción breve del tipo de tutorial."
                                />
                            </div>

                            <label className="tipos-tutorial-checkbox">
                                <input
                                    type="checkbox"
                                    name="activo"
                                    checked={form.activo}
                                    onChange={handleChange}
                                />
                                Tipo de tutorial activo
                            </label>
                        </div>

                        <div className="tipos-tutorial-form-actions">
                            <button
                                type="submit"
                                className="tipos-tutorial-save-button"
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
                                className="tipos-tutorial-cancel-button"
                                onClick={cerrarFormulario}
                            >
                                Cancelar
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="tipos-tutorial-list-card">
                <div className="tipos-tutorial-list-header">
                    <div>
                        <h2>Tipos de tutorial registrados</h2>
                        <p>
                            Listado de tipos disponibles para clasificar tutoriales.
                        </p>
                    </div>

                    <div className="tipos-tutorial-search">
                        <Search size={17} />
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Buscar tipo..."
                        />
                    </div>
                </div>

                {loading ? (
                    <p className="tipos-tutorial-empty">
                        Cargando tipos de tutorial...
                    </p>
                ) : tiposTutorialFiltrados.length === 0 ? (
                    <div className="tipos-tutorial-empty-box">
                        <h3>No hay tipos de tutorial para mostrar</h3>
                        <p>
                            Registra un tipo de tutorial o cambia el criterio
                            de búsqueda.
                        </p>
                    </div>
                ) : (
                    <div className="tipos-tutorial-table-wrap">
                        <table className="tipos-tutorial-table">
                            <thead>
                            <tr>
                                <th>Tipo de tutorial</th>
                                <th>Slug</th>
                                <th>Descripción</th>
                                <th>Estado</th>
                                <th>Tutoriales</th>
                                <th>Actualización</th>
                                <th>Acciones</th>
                            </tr>
                            </thead>

                            <tbody>
                            {tiposTutorialFiltrados.map((tipo) => {
                                const activo = Boolean(Number(tipo.activo));

                                const totalTutoriales =
                                    tipo.tutoriales_count ||
                                    tipo.tutorialesCount ||
                                    tipo.total_tutoriales ||
                                    0;

                                return (
                                    <tr key={tipo.idtipotutorial}>
                                        <td>
                                            <div className="tipos-tutorial-name">
                                                    <span>
                                                        <GraduationCap size={18} />
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
                                                            ? 'tipos-tutorial-status active'
                                                            : 'tipos-tutorial-status inactive'
                                                    }
                                                >
                                                    {activo ? 'Activo' : 'Inactivo'}
                                                </span>
                                        </td>

                                        <td>{Number(totalTutoriales)}</td>

                                        <td>{formatDate(tipo.updated_at)}</td>

                                        <td>
                                            <div className="tipos-tutorial-actions">
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