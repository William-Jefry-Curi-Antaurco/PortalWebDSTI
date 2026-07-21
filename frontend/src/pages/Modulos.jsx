import { useEffect, useMemo, useState } from 'react';
import {
    Boxes,
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
    actualizarModulo,
    crearModulo,
    eliminarModulo,
    listarModulos,
} from '../api/modulosApi';

import {
    closeNotify,
    getApiErrorMessage,
    notifyError,
    notifyLoading,
    notifySuccess,
} from '../utils/notify';

import '../styles/modules/modulos.css';

const initialForm = {
    nombre: '',
    descripcion: '',
    activo: true,
};

export default function Modulos() {
    const [modulos, setModulos] = useState([]);
    const [form, setForm] = useState(initialForm);

    const [editingId, setEditingId] = useState(null);
    const [showForm, setShowForm] = useState(false);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [search, setSearch] = useState('');

    const isEditing = useMemo(() => Boolean(editingId), [editingId]);

    const modulosFiltrados = useMemo(() => {
        const value = search.trim().toLowerCase();

        if (!value) return modulos;

        return modulos.filter((modulo) => {
            return (
                String(modulo.nombre || '').toLowerCase().includes(value) ||
                String(modulo.slug || '').toLowerCase().includes(value) ||
                String(modulo.descripcion || '').toLowerCase().includes(value)
            );
        });
    }, [modulos, search]);

    const cargarDatos = async () => {
        setLoading(true);

        try {
            const data = await listarModulos();

            setModulos(
                Array.isArray(data)
                    ? data
                    : data?.data || []
            );
        } catch (err) {
            notifyError(
                getApiErrorMessage(
                    err,
                    'No se pudieron cargar los módulos.'
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

    const handleEdit = (modulo) => {
        setEditingId(modulo.idmodulo);
        setShowForm(true);

        setForm({
            nombre: modulo.nombre || '',
            descripcion: modulo.descripcion || '',
            activo: Boolean(Number(modulo.activo)),
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

        setSaving(true);

        const toastId = notifyLoading(
            isEditing ? 'Actualizando módulo...' : 'Registrando módulo...'
        );

        try {
            const payload = buildPayload();

            if (isEditing) {
                await actualizarModulo(editingId, payload);
                notifySuccess('Módulo actualizado correctamente.');
            } else {
                await crearModulo(payload);
                notifySuccess('Módulo registrado correctamente.');
            }

            cerrarFormulario();
            await cargarDatos();
        } catch (err) {
            notifyError(
                getApiErrorMessage(
                    err,
                    'No se pudo guardar el módulo.'
                )
            );
        } finally {
            closeNotify(toastId);
            setSaving(false);
        }
    };

    const handleDelete = async (modulo) => {
        const totalCategorias =
            modulo.categorias_count ||
            modulo.categoriasCount ||
            modulo.total_categorias ||
            0;

        if (Number(totalCategorias) > 0) {
            notifyError(
                'No se puede eliminar este módulo porque tiene categorías asociadas.'
            );
            return;
        }

        const ok = confirm(
            `¿Eliminar el módulo "${modulo.nombre}"?\n\nSolo se eliminará si no tiene registros relacionados.`
        );

        if (!ok) return;

        const toastId = notifyLoading('Eliminando módulo...');

        try {
            await eliminarModulo(modulo.idmodulo);

            notifySuccess('Módulo eliminado correctamente.');
            await cargarDatos();
        } catch (err) {
            notifyError(
                getApiErrorMessage(
                    err,
                    'No se pudo eliminar el módulo. Verifica que no tenga categorías asociadas.'
                )
            );
        } finally {
            closeNotify(toastId);
        }
    };

    const handleToggleActivo = async (modulo) => {
        const nuevoEstado = !Boolean(Number(modulo.activo));

        const toastId = notifyLoading(
            nuevoEstado ? 'Activando módulo...' : 'Desactivando módulo...'
        );

        try {
            await actualizarModulo(modulo.idmodulo, {
                nombre: modulo.nombre,
                descripcion: modulo.descripcion || null,
                activo: nuevoEstado ? 1 : 0,
            });

            notifySuccess(
                nuevoEstado
                    ? 'Módulo activado correctamente.'
                    : 'Módulo desactivado correctamente.'
            );

            await cargarDatos();
        } catch (err) {
            notifyError(
                getApiErrorMessage(
                    err,
                    'No se pudo cambiar el estado del módulo.'
                )
            );
        } finally {
            closeNotify(toastId);
        }
    };

    return (
        <section className="modulos-page">
            <div className="modulos-header">
                <div>
                    <span className="modulos-eyebrow">Clasificación y configuración</span>
                    <h1>Módulos</h1>
                    <p>
                        Administra los módulos base del portal. Estos módulos organizan
                        categorías y permiten estructurar noticias, documentos, servicios,
                        eventos, tutoriales y demás secciones.
                    </p>
                </div>

                {!showForm && (
                    <button
                        type="button"
                        className="modulos-add-button"
                        onClick={abrirFormularioCrear}
                    >
                        <Plus size={18} />
                        Agregar módulo
                    </button>
                )}
            </div>

            {showForm && (
                <div className="modulos-form-card">
                    <div className="modulos-form-header">
                        <div>
                            <h2>{isEditing ? 'Editar módulo' : 'Agregar módulo'}</h2>
                            <p>
                                Completa el nombre, descripción y estado del módulo.
                                El slug será generado por el backend.
                            </p>
                        </div>

                        <button
                            type="button"
                            className="modulos-close-button"
                            onClick={cerrarFormulario}
                        >
                            <X size={18} />
                        </button>
                    </div>

                    <form className="modulos-form" onSubmit={handleSubmit}>
                        <div className="modulos-form-grid">
                            <div className="modulos-field">
                                <label>Nombre</label>
                                <input
                                    name="nombre"
                                    value={form.nombre}
                                    onChange={handleChange}
                                    maxLength={50}
                                    placeholder="Ej. Noticias"
                                    required
                                />
                            </div>

                            <div className="modulos-field">
                                <label>Descripción</label>
                                <textarea
                                    name="descripcion"
                                    value={form.descripcion}
                                    onChange={handleChange}
                                    maxLength={255}
                                    rows={4}
                                    placeholder="Descripción breve del módulo."
                                />
                            </div>

                            <label className="modulos-checkbox">
                                <input
                                    type="checkbox"
                                    name="activo"
                                    checked={form.activo}
                                    onChange={handleChange}
                                />
                                Módulo activo
                            </label>
                        </div>

                        <div className="modulos-form-actions">
                            <button
                                type="submit"
                                className="modulos-save-button"
                                disabled={saving}
                            >
                                <Save size={17} />
                                {saving
                                    ? 'Guardando...'
                                    : isEditing
                                        ? 'Actualizar módulo'
                                        : 'Guardar módulo'}
                            </button>

                            <button
                                type="button"
                                className="modulos-cancel-button"
                                onClick={cerrarFormulario}
                            >
                                Cancelar
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="modulos-list-card">
                <div className="modulos-list-header">
                    <div>
                        <h2>Módulos registrados</h2>
                        <p>
                            Listado de módulos de configuración disponibles en el portal.
                        </p>
                    </div>

                    <div className="modulos-search">
                        <Search size={17} />
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Buscar módulo..."
                        />
                    </div>
                </div>

                {loading ? (
                    <p className="modulos-empty">Cargando módulos...</p>
                ) : modulosFiltrados.length === 0 ? (
                    <div className="modulos-empty-box">
                        <h3>No hay módulos para mostrar</h3>
                        <p>
                            Registra un módulo o cambia el criterio de búsqueda.
                        </p>
                    </div>
                ) : (
                    <div className="modulos-table-wrap">
                        <table className="modulos-table">
                            <thead>
                            <tr>
                                <th>Módulo</th>
                                <th>Slug</th>
                                <th>Descripción</th>
                                <th>Estado</th>
                                <th>Categorías</th>
                                <th>Actualización</th>
                                <th>Acciones</th>
                            </tr>
                            </thead>

                            <tbody>
                            {modulosFiltrados.map((modulo) => {
                                const activo = Boolean(Number(modulo.activo));

                                const totalCategorias =
                                    modulo.categorias_count ||
                                    modulo.categoriasCount ||
                                    modulo.total_categorias ||
                                    0;

                                return (
                                    <tr key={modulo.idmodulo}>
                                        <td>
                                            <div className="modulos-name">
                                                    <span>
                                                        <Boxes size={18} />
                                                    </span>
                                                <strong>{modulo.nombre}</strong>
                                            </div>
                                        </td>

                                        <td>
                                            <code>{modulo.slug || '-'}</code>
                                        </td>

                                        <td>
                                            {modulo.descripcion || '-'}
                                        </td>

                                        <td>
                                                <span
                                                    className={
                                                        activo
                                                            ? 'modulos-status active'
                                                            : 'modulos-status inactive'
                                                    }
                                                >
                                                    {activo ? 'Activo' : 'Inactivo'}
                                                </span>
                                        </td>

                                        <td>
                                            {Number(totalCategorias)}
                                        </td>

                                        <td>
                                            {formatDate(modulo.updated_at)}
                                        </td>

                                        <td>
                                            <div className="modulos-actions">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        handleToggleActivo(modulo)
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
                                                        handleEdit(modulo)
                                                    }
                                                    title="Editar"
                                                >
                                                    <Pencil size={16} />
                                                </button>

                                                <button
                                                    type="button"
                                                    className="danger"
                                                    onClick={() =>
                                                        handleDelete(modulo)
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