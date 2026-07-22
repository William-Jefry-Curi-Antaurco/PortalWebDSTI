import { useEffect, useMemo, useState } from 'react';
import {
    listarPermisos,
    crearPermiso,
    actualizarPermiso,
    eliminarPermiso,
} from '../api/permisosApi';
import { listarModulos } from '../api/modulosApi';
import ConPermiso from '../components/ConPermiso';
import '../styles/modules/permisos.css';

const INITIAL_FORM = {
    nombre: '',
    descripcion: '',
    idmodulo: '',
};

const normalizePaginatedList = (response) => {
    if (Array.isArray(response)) return response;
    if (Array.isArray(response?.data?.data)) return response.data.data;
    if (Array.isArray(response?.data)) return response.data;

    return [];
};

const normalizeList = (response) => {
    if (Array.isArray(response)) return response;
    if (Array.isArray(response?.data?.data)) return response.data.data;
    if (Array.isArray(response?.data)) return response.data;

    return [];
};

const getApiErrorMessage = (error) => {
    const data = error?.response?.data;

    if (data?.message && !data?.errors) return data.message;

    if (data?.errors) {
        const firstKey = Object.keys(data.errors)[0];

        if (firstKey && Array.isArray(data.errors[firstKey])) {
            return data.errors[firstKey][0];
        }
    }

    if (data?.message) return data.message;

    return 'Ocurrió un error inesperado.';
};

const getRolesCount = (permiso) => {
    return permiso?.roles_count ?? 0;
};

const getModuloName = (permiso) => {
    return permiso?.modulo?.nombre || 'Sin módulo';
};

const Permisos = () => {
    const [permisos, setPermisos] = useState([]);
    const [modulos, setModulos] = useState([]);

    const [form, setForm] = useState(INITIAL_FORM);
    const [editingPermission, setEditingPermission] = useState(null);

    const [search, setSearch] = useState('');
    const [moduleFilter, setModuleFilter] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);

    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const isEditing = Boolean(editingPermission);

    const clearMessages = () => {
        setError('');
        setSuccessMessage('');
    };

    const resetForm = () => {
        setForm(INITIAL_FORM);
        setEditingPermission(null);
    };

    const loadPermisos = async (filters = {}) => {
        try {
            setIsLoading(true);
            setError('');

            const params = {
                buscar: filters.buscar || undefined,
                idmodulo: filters.idmodulo || undefined,
            };

            const response = await listarPermisos(params);
            const data = normalizePaginatedList(response);

            setPermisos(data);
        } catch (err) {
            setError(getApiErrorMessage(err));
        } finally {
            setIsLoading(false);
        }
    };

    const loadModulos = async () => {
        try {
            const response = await listarModulos();
            const data = normalizeList(response);

            setModulos(data);
        } catch (err) {
            setError(getApiErrorMessage(err));
        }
    };

    useEffect(() => {
        loadPermisos();
        loadModulos();
    }, []);

    const permisosMostrados = useMemo(() => {
        return permisos;
    }, [permisos]);

    const handleBuscar = async (event) => {
        event.preventDefault();
        clearMessages();

        await loadPermisos({
            buscar: search.trim(),
            idmodulo: moduleFilter,
        });
    };

    const handleLimpiarFiltros = async () => {
        setSearch('');
        setModuleFilter('');
        clearMessages();

        await loadPermisos();
    };

    const openCreateModal = () => {
        clearMessages();
        resetForm();
        setIsModalOpen(true);
    };

    const openEditModal = (permiso) => {
        clearMessages();

        setEditingPermission(permiso);

        setForm({
            nombre: permiso.nombre || '',
            descripcion: permiso.descripcion || '',
            idmodulo: permiso.idmodulo ? String(permiso.idmodulo) : '',
        });

        setIsModalOpen(true);
    };

    const closeModal = () => {
        if (isSaving) return;

        setIsModalOpen(false);
        resetForm();
        clearMessages();
    };

    const handleInputChange = (event) => {
        const { name, value } = event.target;

        setForm((currentForm) => ({
            ...currentForm,
            [name]: value,
        }));
    };

    const validateForm = () => {
        const nombre = form.nombre.trim();
        const descripcion = form.descripcion.trim();

        if (!nombre) {
            setError('El nombre del permiso es obligatorio.');
            return false;
        }

        if (nombre.length > 105) {
            setError('El nombre no debe superar los 105 caracteres.');
            return false;
        }

        if (!descripcion) {
            setError('La descripción del permiso es obligatoria.');
            return false;
        }

        if (descripcion.length > 200) {
            setError('La descripción no debe superar los 200 caracteres.');
            return false;
        }

        if (!form.idmodulo) {
            setError('El módulo es obligatorio.');
            return false;
        }

        return true;
    };

    const buildPayload = () => ({
        nombre: form.nombre.trim(),
        descripcion: form.descripcion.trim(),
        idmodulo: Number(form.idmodulo),
    });

    const handleSubmit = async (event) => {
        event.preventDefault();
        clearMessages();

        if (!validateForm()) return;

        try {
            setIsSaving(true);

            const payload = buildPayload();

            if (isEditing) {
                await actualizarPermiso(editingPermission.idpermiso, payload);
                setSuccessMessage('Permiso actualizado correctamente.');
            } else {
                await crearPermiso(payload);
                setSuccessMessage('Permiso registrado correctamente.');
            }

            setIsModalOpen(false);
            resetForm();

            await loadPermisos({
                buscar: search.trim(),
                idmodulo: moduleFilter,
            });
        } catch (err) {
            setError(getApiErrorMessage(err));
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (permiso) => {
        clearMessages();

        const rolesCount = getRolesCount(permiso);

        if (rolesCount > 0) {
            setError(
                `No se puede eliminar el permiso "${permiso.nombre}" porque está asignado a ${rolesCount} rol(es).`
            );
            return;
        }

        const confirmed = window.confirm(
            `¿Estás seguro de eliminar el permiso "${permiso.nombre}"?`
        );

        if (!confirmed) return;

        try {
            setIsLoading(true);

            await eliminarPermiso(permiso.idpermiso);

            setSuccessMessage('Permiso eliminado correctamente.');

            await loadPermisos({
                buscar: search.trim(),
                idmodulo: moduleFilter,
            });
        } catch (err) {
            setError(getApiErrorMessage(err));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <section className="permisos-page">
            <header className="permisos-header">
                <div>
                    <p className="permisos-kicker">Seguridad y autorización</p>
                    <h1>Gestión de permisos</h1>
                    <p>
                        Administra los permisos del sistema y su relación con los módulos del portal.
                    </p>
                </div>

                <div className="permisos-header-actions">
                    <button
                        type="button"
                        className="permisos-btn permisos-btn-secondary"
                        onClick={() =>
                            loadPermisos({
                                buscar: search.trim(),
                                idmodulo: moduleFilter,
                            })
                        }
                        disabled={isLoading}
                    >
                        {isLoading ? 'Actualizando...' : 'Actualizar'}
                    </button>

                    <ConPermiso permiso="seguridad.crear">
                        <button
                            type="button"
                            className="permisos-btn permisos-btn-primary"
                            onClick={openCreateModal}
                        >
                            Agregar permiso
                        </button>
                    </ConPermiso>
                </div>
            </header>

            {error && !isModalOpen && (
                <div className="permisos-alert permisos-alert-error">{error}</div>
            )}

            {successMessage && !isModalOpen && (
                <div className="permisos-alert permisos-alert-success">
                    {successMessage}
                </div>
            )}

            <div className="permisos-card permisos-list-card">
                <form className="permisos-toolbar" onSubmit={handleBuscar}>
                    <div>
                        <h2>Listado de permisos</h2>
                        <p>{permisosMostrados.length} permiso(s) encontrado(s)</p>
                    </div>

                    <div className="permisos-filters">
                        <select
                            value={moduleFilter}
                            onChange={(event) => setModuleFilter(event.target.value)}
                            disabled={isLoading}
                        >
                            <option value="">Todos los módulos</option>
                            {modulos.map((modulo) => (
                                <option key={modulo.idmodulo} value={modulo.idmodulo}>
                                    {modulo.nombre}
                                </option>
                            ))}
                        </select>

                        <input
                            type="search"
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Buscar permiso..."
                            disabled={isLoading}
                        />

                        <button
                            type="submit"
                            className="permisos-btn permisos-btn-primary"
                            disabled={isLoading}
                        >
                            Buscar
                        </button>

                        <button
                            type="button"
                            className="permisos-btn permisos-btn-light"
                            onClick={handleLimpiarFiltros}
                            disabled={isLoading}
                        >
                            Limpiar
                        </button>
                    </div>
                </form>

                <div className="permisos-table-wrapper">
                    <table className="permisos-table">
                        <thead>
                        <tr>
                            <th>ID</th>
                            <th>Permiso</th>
                            <th>Módulo</th>
                            <th>Descripción</th>
                            <th>Roles</th>
                            <th>Acciones</th>
                        </tr>
                        </thead>

                        <tbody>
                        {isLoading ? (
                            <tr>
                                <td colSpan="6" className="permisos-empty">
                                    Cargando permisos...
                                </td>
                            </tr>
                        ) : permisosMostrados.length === 0 ? (
                            <tr>
                                <td colSpan="6" className="permisos-empty">
                                    No se encontraron permisos.
                                </td>
                            </tr>
                        ) : (
                            permisosMostrados.map((permiso) => {
                                const rolesCount = getRolesCount(permiso);

                                return (
                                    <tr key={permiso.idpermiso}>
                                        <td>#{permiso.idpermiso}</td>

                                        <td>
                                            <strong className="permisos-name">
                                                {permiso.nombre}
                                            </strong>
                                        </td>

                                        <td>
                                                <span className="permisos-module-badge">
                                                    {getModuloName(permiso)}
                                                </span>
                                        </td>

                                        <td>
                                            {permiso.descripcion || (
                                                <span className="permisos-muted">
                                                        Sin descripción
                                                    </span>
                                            )}
                                        </td>

                                        <td>
                                                <span
                                                    className={
                                                        rolesCount > 0
                                                            ? 'permisos-count permisos-count-active'
                                                            : 'permisos-count'
                                                    }
                                                >
                                                    {rolesCount}
                                                </span>
                                        </td>

                                        <td>
                                            <div className="permisos-actions">
                                                <ConPermiso permiso="seguridad.editar">
                                                    <button
                                                        type="button"
                                                        className="permisos-action-btn permisos-action-edit"
                                                        onClick={() => openEditModal(permiso)}
                                                    >
                                                        Editar
                                                    </button>
                                                </ConPermiso>

                                                <ConPermiso permiso="seguridad.eliminar">
                                                    <button
                                                        type="button"
                                                        className="permisos-action-btn permisos-action-delete"
                                                        onClick={() => handleDelete(permiso)}
                                                        disabled={rolesCount > 0}
                                                        title={
                                                            rolesCount > 0
                                                                ? 'No se puede eliminar porque está asignado a roles'
                                                                : 'Eliminar permiso'
                                                        }
                                                    >
                                                        Eliminar
                                                    </button>
                                                </ConPermiso>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                        </tbody>
                    </table>
                </div>
            </div>

            {isModalOpen && (
                <div className="permisos-modal-overlay" role="dialog" aria-modal="true">
                    <div className="permisos-modal">
                        <div className="permisos-modal-header">
                            <div>
                                <p className="permisos-kicker">Formulario</p>
                                <h2>{isEditing ? 'Editar permiso' : 'Agregar permiso'}</h2>
                            </div>

                            <button
                                type="button"
                                className="permisos-modal-close"
                                onClick={closeModal}
                                disabled={isSaving}
                                aria-label="Cerrar formulario"
                            >
                                ×
                            </button>
                        </div>

                        {error && (
                            <div className="permisos-alert permisos-alert-error">
                                {error}
                            </div>
                        )}

                        <form className="permisos-form" onSubmit={handleSubmit}>
                            <div className="permisos-field">
                                <label htmlFor="nombre">Nombre del permiso</label>
                                <input
                                    id="nombre"
                                    name="nombre"
                                    type="text"
                                    value={form.nombre}
                                    onChange={handleInputChange}
                                    placeholder="Ejemplo: noticias.crear"
                                    maxLength={105}
                                    disabled={isSaving}
                                    autoComplete="off"
                                />
                            </div>

                            <div className="permisos-field">
                                <label htmlFor="idmodulo">Módulo</label>
                                <select
                                    id="idmodulo"
                                    name="idmodulo"
                                    value={form.idmodulo}
                                    onChange={handleInputChange}
                                    disabled={isSaving}
                                >
                                    <option value="">Seleccione un módulo</option>
                                    {modulos.map((modulo) => (
                                        <option key={modulo.idmodulo} value={modulo.idmodulo}>
                                            {modulo.nombre}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="permisos-field">
                                <label htmlFor="descripcion">Descripción</label>
                                <textarea
                                    id="descripcion"
                                    name="descripcion"
                                    value={form.descripcion}
                                    onChange={handleInputChange}
                                    placeholder="Describe qué acción permite realizar este permiso"
                                    maxLength={200}
                                    rows={4}
                                    disabled={isSaving}
                                />
                                <small>{form.descripcion.length}/200 caracteres</small>
                            </div>

                            <div className="permisos-form-actions">
                                <button
                                    type="submit"
                                    className="permisos-btn permisos-btn-primary"
                                    disabled={isSaving}
                                >
                                    {isSaving
                                        ? 'Guardando...'
                                        : isEditing
                                            ? 'Actualizar permiso'
                                            : 'Registrar permiso'}
                                </button>

                                <button
                                    type="button"
                                    className="permisos-btn permisos-btn-light"
                                    onClick={closeModal}
                                    disabled={isSaving}
                                >
                                    Cancelar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </section>
    );
};

export default Permisos;