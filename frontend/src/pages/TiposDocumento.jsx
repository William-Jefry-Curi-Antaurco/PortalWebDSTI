import { useEffect, useMemo, useState } from 'react';
import {
    BookOpen,
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
    actualizarTipoDocumento,
    crearTipoDocumento,
    eliminarTipoDocumento,
    listarTiposDocumento,
} from '../api/tiposDocumentoApi';

import {
    closeNotify,
    getApiErrorMessage,
    notifyError,
    notifyLoading,
    notifySuccess,
} from '../utils/notify';

import '../styles/modules/tiposDocumento.css';

const initialForm = {
    nombre: '',
    descripcion: '',
    activo: true,
};

export default function TiposDocumento() {
    const [tiposDocumento, setTiposDocumento] = useState([]);
    const [form, setForm] = useState(initialForm);

    const [editingId, setEditingId] = useState(null);
    const [showForm, setShowForm] = useState(false);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [search, setSearch] = useState('');

    const isEditing = useMemo(() => Boolean(editingId), [editingId]);

    const tiposDocumentoFiltrados = useMemo(() => {
        const value = search.trim().toLowerCase();

        if (!value) return tiposDocumento;

        return tiposDocumento.filter((tipo) => {
            return (
                String(tipo.nombre || '').toLowerCase().includes(value) ||
                String(tipo.slug || '').toLowerCase().includes(value) ||
                String(tipo.descripcion || '').toLowerCase().includes(value)
            );
        });
    }, [tiposDocumento, search]);

    const cargarDatos = async () => {
        setLoading(true);

        try {
            const data = await listarTiposDocumento();

            setTiposDocumento(
                Array.isArray(data)
                    ? data
                    : data?.data || []
            );
        } catch (err) {
            notifyError(
                getApiErrorMessage(
                    err,
                    'No se pudieron cargar los tipos de documento.'
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
        setEditingId(tipo.idtipodocumento);
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
            notifyError('Ingrese el nombre del tipo de documento.');
            return;
        }

        setSaving(true);

        const toastId = notifyLoading(
            isEditing
                ? 'Actualizando tipo de documento...'
                : 'Registrando tipo de documento...'
        );

        try {
            const payload = buildPayload();

            if (isEditing) {
                await actualizarTipoDocumento(editingId, payload);
                notifySuccess('Tipo de documento actualizado correctamente.');
            } else {
                await crearTipoDocumento(payload);
                notifySuccess('Tipo de documento registrado correctamente.');
            }

            cerrarFormulario();
            await cargarDatos();
        } catch (err) {
            notifyError(
                getApiErrorMessage(
                    err,
                    'No se pudo guardar el tipo de documento.'
                )
            );
        } finally {
            closeNotify(toastId);
            setSaving(false);
        }
    };

    const handleDelete = async (tipo) => {
        const totalDocumentos =
            tipo.documentos_count ||
            tipo.documentosCount ||
            tipo.total_documentos ||
            0;

        if (Number(totalDocumentos) > 0) {
            notifyError(
                'No se puede eliminar este tipo de documento porque tiene documentos asociados.'
            );
            return;
        }

        const ok = confirm(
            `¿Eliminar el tipo de documento "${tipo.nombre}"?\n\nSolo se eliminará si no tiene documentos asociados.`
        );

        if (!ok) return;

        const toastId = notifyLoading('Eliminando tipo de documento...');

        try {
            await eliminarTipoDocumento(tipo.idtipodocumento);

            notifySuccess('Tipo de documento eliminado correctamente.');
            await cargarDatos();
        } catch (err) {
            notifyError(
                getApiErrorMessage(
                    err,
                    'No se pudo eliminar el tipo de documento. Verifica que no tenga documentos asociados.'
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
                ? 'Activando tipo de documento...'
                : 'Desactivando tipo de documento...'
        );

        try {
            await actualizarTipoDocumento(tipo.idtipodocumento, {
                nombre: tipo.nombre,
                descripcion: tipo.descripcion || null,
                activo: nuevoEstado ? 1 : 0,
            });

            notifySuccess(
                nuevoEstado
                    ? 'Tipo de documento activado correctamente.'
                    : 'Tipo de documento desactivado correctamente.'
            );

            await cargarDatos();
        } catch (err) {
            notifyError(
                getApiErrorMessage(
                    err,
                    'No se pudo cambiar el estado del tipo de documento.'
                )
            );
        } finally {
            closeNotify(toastId);
        }
    };

    return (
        <section className="tipos-documento-page">
            <div className="tipos-documento-header">
                <div>
                    <span className="tipos-documento-eyebrow">
                        Clasificación y configuración
                    </span>
                    <h1>Tipos de documento</h1>
                    <p>
                        Administra los tipos usados para clasificar manuales,
                        directivas, normas, reglamentos, guías y demás documentos
                        institucionales del portal DSTI.
                    </p>
                </div>

                {!showForm && (
                    <button
                        type="button"
                        className="tipos-documento-add-button"
                        onClick={abrirFormularioCrear}
                    >
                        <Plus size={18} />
                        Agregar tipo
                    </button>
                )}
            </div>

            {showForm && (
                <div className="tipos-documento-form-card">
                    <div className="tipos-documento-form-header">
                        <div>
                            <h2>
                                {isEditing
                                    ? 'Editar tipo de documento'
                                    : 'Agregar tipo de documento'}
                            </h2>
                            <p>
                                Completa el nombre, descripción y estado. El slug
                                será generado automáticamente por el backend.
                            </p>
                        </div>

                        <button
                            type="button"
                            className="tipos-documento-close-button"
                            onClick={cerrarFormulario}
                        >
                            <X size={18} />
                        </button>
                    </div>

                    <form
                        className="tipos-documento-form"
                        onSubmit={handleSubmit}
                    >
                        <div className="tipos-documento-form-grid">
                            <div className="tipos-documento-field">
                                <label>Nombre</label>
                                <input
                                    name="nombre"
                                    value={form.nombre}
                                    onChange={handleChange}
                                    maxLength={150}
                                    placeholder="Ej. Manual"
                                    required
                                />
                            </div>

                            <div className="tipos-documento-field">
                                <label>Descripción</label>
                                <textarea
                                    name="descripcion"
                                    value={form.descripcion}
                                    onChange={handleChange}
                                    maxLength={255}
                                    rows={4}
                                    placeholder="Descripción breve del tipo de documento."
                                />
                            </div>

                            <label className="tipos-documento-checkbox">
                                <input
                                    type="checkbox"
                                    name="activo"
                                    checked={form.activo}
                                    onChange={handleChange}
                                />
                                Tipo de documento activo
                            </label>
                        </div>

                        <div className="tipos-documento-form-actions">
                            <button
                                type="submit"
                                className="tipos-documento-save-button"
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
                                className="tipos-documento-cancel-button"
                                onClick={cerrarFormulario}
                            >
                                Cancelar
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="tipos-documento-list-card">
                <div className="tipos-documento-list-header">
                    <div>
                        <h2>Tipos de documento registrados</h2>
                        <p>
                            Listado de tipos disponibles para clasificar documentos.
                        </p>
                    </div>

                    <div className="tipos-documento-search">
                        <Search size={17} />
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Buscar tipo..."
                        />
                    </div>
                </div>

                {loading ? (
                    <p className="tipos-documento-empty">
                        Cargando tipos de documento...
                    </p>
                ) : tiposDocumentoFiltrados.length === 0 ? (
                    <div className="tipos-documento-empty-box">
                        <h3>No hay tipos de documento para mostrar</h3>
                        <p>
                            Registra un tipo de documento o cambia el criterio
                            de búsqueda.
                        </p>
                    </div>
                ) : (
                    <div className="tipos-documento-table-wrap">
                        <table className="tipos-documento-table">
                            <thead>
                            <tr>
                                <th>Tipo de documento</th>
                                <th>Slug</th>
                                <th>Descripción</th>
                                <th>Estado</th>
                                <th>Documentos</th>
                                <th>Actualización</th>
                                <th>Acciones</th>
                            </tr>
                            </thead>

                            <tbody>
                            {tiposDocumentoFiltrados.map((tipo) => {
                                const activo = Boolean(Number(tipo.activo));

                                const totalDocumentos =
                                    tipo.documentos_count ||
                                    tipo.documentosCount ||
                                    tipo.total_documentos ||
                                    0;

                                return (
                                    <tr key={tipo.idtipodocumento}>
                                        <td>
                                            <div className="tipos-documento-name">
                                                    <span>
                                                        <BookOpen size={18} />
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
                                                            ? 'tipos-documento-status active'
                                                            : 'tipos-documento-status inactive'
                                                    }
                                                >
                                                    {activo ? 'Activo' : 'Inactivo'}
                                                </span>
                                        </td>

                                        <td>{Number(totalDocumentos)}</td>

                                        <td>{formatDate(tipo.updated_at)}</td>

                                        <td>
                                            <div className="tipos-documento-actions">
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