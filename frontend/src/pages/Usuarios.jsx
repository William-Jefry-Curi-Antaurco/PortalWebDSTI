import { useEffect, useMemo, useState } from 'react';
import { usuariosApi } from '../api/usuariosApi';
import { rolesApi } from '../api/rolesApi';
import '../styles/modules/usuarios.css';

const INITIAL_FORM = {
    nombre_completo: '',
    email: '',
    password: '',
    password_confirmation: '',
    idrol: '',
    activo: true,
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const normalizeList = (response, fallbackKey = '') => {
    if (Array.isArray(response)) return response;
    if (Array.isArray(response?.data)) return response.data;
    if (Array.isArray(response?.data?.data)) return response.data.data;
    if (fallbackKey && Array.isArray(response?.[fallbackKey])) return response[fallbackKey];

    return [];
};

const getApiErrorMessage = (error) => {
    const data = error?.response?.data;

    if (data?.message) return data.message;

    if (data?.errors) {
        const firstKey = Object.keys(data.errors)[0];

        if (firstKey && Array.isArray(data.errors[firstKey])) {
            return data.errors[firstKey][0];
        }
    }

    return 'Ocurrió un error inesperado.';
};

const formatDate = (value) => {
    if (!value) return 'Sin acceso';

    try {
        return new Date(value).toLocaleString('es-PE', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
        });
    } catch {
        return value;
    }
};

const Usuarios = () => {
    const [usuarios, setUsuarios] = useState([]);
    const [roles, setRoles] = useState([]);

    const [form, setForm] = useState(INITIAL_FORM);
    const [editingUser, setEditingUser] = useState(null);

    const [search, setSearch] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);

    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const isEditing = Boolean(editingUser);

    const clearMessages = () => {
        setError('');
        setSuccessMessage('');
    };

    const resetForm = () => {
        setForm(INITIAL_FORM);
        setEditingUser(null);
    };

    const loadUsuarios = async () => {
        try {
            setIsLoading(true);
            setError('');

            const response = await usuariosApi.listar();
            const data = normalizeList(response, 'usuarios');

            setUsuarios(data);
        } catch (err) {
            setError(getApiErrorMessage(err));
        } finally {
            setIsLoading(false);
        }
    };

    const loadRoles = async () => {
        try {
            const response = await rolesApi.listar();
            const data = normalizeList(response, 'roles');

            setRoles(data);
        } catch (err) {
            setError(getApiErrorMessage(err));
        }
    };

    useEffect(() => {
        loadUsuarios();
        loadRoles();
    }, []);

    const filteredUsuarios = useMemo(() => {
        const term = search.trim().toLowerCase();

        if (!term) return usuarios;

        return usuarios.filter((usuario) => {
            const nombre = usuario.nombre_completo?.toLowerCase() || '';
            const email = usuario.email?.toLowerCase() || '';
            const rol = usuario.rol?.nombre?.toLowerCase() || '';

            return nombre.includes(term) || email.includes(term) || rol.includes(term);
        });
    }, [usuarios, search]);

    const openCreateModal = () => {
        clearMessages();
        resetForm();
        setIsModalOpen(true);
    };

    const openEditModal = (usuario) => {
        clearMessages();

        setEditingUser(usuario);

        setForm({
            nombre_completo: usuario.nombre_completo || '',
            email: usuario.email || '',
            password: '',
            password_confirmation: '',
            idrol: usuario.idrol ? String(usuario.idrol) : '',
            activo: Boolean(usuario.activo),
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
        const { name, value, type, checked } = event.target;

        setForm((currentForm) => ({
            ...currentForm,
            [name]: type === 'checkbox' ? checked : value,
        }));
    };

    const validateForm = () => {
        const nombre = form.nombre_completo.trim();
        const email = form.email.trim();

        if (!nombre) {
            setError('El nombre completo es obligatorio.');
            return false;
        }

        if (nombre.length < 5) {
            setError('El nombre completo debe tener al menos 5 caracteres.');
            return false;
        }

        if (nombre.length > 150) {
            setError('El nombre completo no debe superar los 150 caracteres.');
            return false;
        }

        if (!email) {
            setError('El correo electrónico es obligatorio.');
            return false;
        }

        if (!EMAIL_REGEX.test(email)) {
            setError('Ingrese un correo electrónico válido.');
            return false;
        }

        if (email.length > 150) {
            setError('El correo electrónico no debe superar los 150 caracteres.');
            return false;
        }

        if (!form.idrol) {
            setError('Seleccione un rol para el usuario.');
            return false;
        }

        if (!isEditing && !form.password) {
            setError('La contraseña es obligatoria.');
            return false;
        }

        if (form.password && form.password.length < 8) {
            setError('La contraseña debe tener al menos 8 caracteres.');
            return false;
        }

        if (form.password && form.password !== form.password_confirmation) {
            setError('La confirmación de contraseña no coincide.');
            return false;
        }

        return true;
    };

    const buildPayload = () => {
        const payload = {
            nombre_completo: form.nombre_completo.trim(),
            email: form.email.trim(),
            idrol: Number(form.idrol),
            activo: form.activo ? 1 : 0,
        };

        if (form.password) {
            payload.password = form.password;
            payload.password_confirmation = form.password_confirmation;
        }

        return payload;
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        clearMessages();

        if (!validateForm()) return;

        try {
            setIsSaving(true);

            const payload = buildPayload();

            if (isEditing) {
                await usuariosApi.actualizar(editingUser.idusuario, payload);
                setSuccessMessage('Usuario actualizado correctamente.');
            } else {
                await usuariosApi.crear(payload);
                setSuccessMessage('Usuario registrado correctamente.');
            }

            setIsModalOpen(false);
            resetForm();
            await loadUsuarios();
        } catch (err) {
            setError(getApiErrorMessage(err));
        } finally {
            setIsSaving(false);
        }
    };

    const handleToggleStatus = async (usuario) => {
        clearMessages();

        const nextStatus = usuario.activo ? 0 : 1;
        const actionText = nextStatus ? 'activar' : 'desactivar';

        const confirmed = window.confirm(
            `¿Deseas ${actionText} al usuario "${usuario.nombre_completo}"?`
        );

        if (!confirmed) return;

        try {
            setIsLoading(true);

            await usuariosApi.actualizar(usuario.idusuario, {
                nombre_completo: usuario.nombre_completo,
                email: usuario.email,
                idrol: usuario.idrol,
                activo: nextStatus,
            });

            setSuccessMessage(
                nextStatus
                    ? 'Usuario activado correctamente.'
                    : 'Usuario desactivado correctamente.'
            );

            await loadUsuarios();
        } catch (err) {
            setError(getApiErrorMessage(err));
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (usuario) => {
        clearMessages();

        const confirmed = window.confirm(
            `¿Estás seguro de eliminar al usuario "${usuario.nombre_completo}"?`
        );

        if (!confirmed) return;

        try {
            setIsLoading(true);

            await usuariosApi.eliminar(usuario.idusuario);

            setSuccessMessage('Usuario eliminado correctamente.');
            await loadUsuarios();
        } catch (err) {
            setError(getApiErrorMessage(err));
        } finally {
            setIsLoading(false);
        }
    };

    const getRoleName = (usuario) => {
        if (usuario.rol?.nombre) return usuario.rol.nombre;

        const role = roles.find((item) => Number(item.idrol) === Number(usuario.idrol));

        return role?.nombre || 'Sin rol';
    };

    return (
        <section className="usuarios-page">
            <header className="usuarios-header">
                <div>
                    <p className="usuarios-kicker">Administración de acceso</p>
                    <h1>Gestión de usuarios</h1>
                    <p>Registra, edita, activa o desactiva usuarios del panel administrativo.</p>
                </div>

                <div className="usuarios-header-actions">
                    <button
                        type="button"
                        className="usuarios-btn usuarios-btn-secondary"
                        onClick={loadUsuarios}
                        disabled={isLoading}
                    >
                        {isLoading ? 'Actualizando...' : 'Actualizar'}
                    </button>

                    <button
                        type="button"
                        className="usuarios-btn usuarios-btn-primary"
                        onClick={openCreateModal}
                    >
                        Agregar usuario
                    </button>
                </div>
            </header>

            {error && !isModalOpen && (
                <div className="usuarios-alert usuarios-alert-error">{error}</div>
            )}

            {successMessage && !isModalOpen && (
                <div className="usuarios-alert usuarios-alert-success">{successMessage}</div>
            )}

            <div className="usuarios-card usuarios-list-card">
                <div className="usuarios-toolbar">
                    <div>
                        <h2>Listado de usuarios</h2>
                        <p>{filteredUsuarios.length} usuario(s) encontrado(s)</p>
                    </div>

                    <div className="usuarios-search">
                        <input
                            type="search"
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Buscar por nombre, correo o rol..."
                        />
                    </div>
                </div>

                <div className="usuarios-table-wrapper">
                    <table className="usuarios-table">
                        <thead>
                        <tr>
                            <th>ID</th>
                            <th>Usuario</th>
                            <th>Rol</th>
                            <th>Estado</th>
                            <th>Último acceso</th>
                            <th>Acciones</th>
                        </tr>
                        </thead>

                        <tbody>
                        {isLoading ? (
                            <tr>
                                <td colSpan="6" className="usuarios-empty">
                                    Cargando usuarios...
                                </td>
                            </tr>
                        ) : filteredUsuarios.length === 0 ? (
                            <tr>
                                <td colSpan="6" className="usuarios-empty">
                                    No se encontraron usuarios.
                                </td>
                            </tr>
                        ) : (
                            filteredUsuarios.map((usuario) => (
                                <tr key={usuario.idusuario}>
                                    <td>#{usuario.idusuario}</td>

                                    <td>
                                        <div className="usuarios-user-cell">
                                            <div className="usuarios-avatar">
                                                {usuario.nombre_completo?.charAt(0)?.toUpperCase() || 'U'}
                                            </div>

                                            <div>
                                                <strong>{usuario.nombre_completo}</strong>
                                                <span>{usuario.email}</span>
                                            </div>
                                        </div>
                                    </td>

                                    <td>
                      <span className="usuarios-role-badge">
                        {getRoleName(usuario)}
                      </span>
                                    </td>

                                    <td>
                      <span
                          className={
                              usuario.activo
                                  ? 'usuarios-status usuarios-status-active'
                                  : 'usuarios-status usuarios-status-inactive'
                          }
                      >
                        {usuario.activo ? 'Activo' : 'Inactivo'}
                      </span>
                                    </td>

                                    <td>{formatDate(usuario.ultimo_acceso)}</td>

                                    <td>
                                        <div className="usuarios-actions">
                                            <button
                                                type="button"
                                                className="usuarios-action-btn usuarios-action-edit"
                                                onClick={() => openEditModal(usuario)}
                                            >
                                                Editar
                                            </button>

                                            <button
                                                type="button"
                                                className={
                                                    usuario.activo
                                                        ? 'usuarios-action-btn usuarios-action-warning'
                                                        : 'usuarios-action-btn usuarios-action-success'
                                                }
                                                onClick={() => handleToggleStatus(usuario)}
                                            >
                                                {usuario.activo ? 'Desactivar' : 'Activar'}
                                            </button>

                                            <button
                                                type="button"
                                                className="usuarios-action-btn usuarios-action-delete"
                                                onClick={() => handleDelete(usuario)}
                                            >
                                                Eliminar
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                        </tbody>
                    </table>
                </div>
            </div>

            {isModalOpen && (
                <div className="usuarios-modal-overlay" role="dialog" aria-modal="true">
                    <div className="usuarios-modal">
                        <div className="usuarios-modal-header">
                            <div>
                                <p className="usuarios-kicker">Formulario</p>
                                <h2>{isEditing ? 'Editar usuario' : 'Agregar usuario'}</h2>
                            </div>

                            <button
                                type="button"
                                className="usuarios-modal-close"
                                onClick={closeModal}
                                disabled={isSaving}
                                aria-label="Cerrar formulario"
                            >
                                ×
                            </button>
                        </div>

                        {error && (
                            <div className="usuarios-alert usuarios-alert-error">{error}</div>
                        )}

                        <form className="usuarios-form" onSubmit={handleSubmit}>
                            <div className="usuarios-field">
                                <label htmlFor="nombre_completo">Nombre completo</label>
                                <input
                                    id="nombre_completo"
                                    name="nombre_completo"
                                    type="text"
                                    value={form.nombre_completo}
                                    onChange={handleInputChange}
                                    placeholder="Ejemplo: Administrador DSTI"
                                    maxLength={150}
                                    disabled={isSaving}
                                    autoComplete="name"
                                />
                            </div>

                            <div className="usuarios-field">
                                <label htmlFor="email">Correo electrónico</label>
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    value={form.email}
                                    onChange={handleInputChange}
                                    placeholder="usuario@unasam.edu.pe"
                                    maxLength={150}
                                    disabled={isSaving}
                                    autoComplete="email"
                                />
                            </div>

                            <div className="usuarios-field">
                                <label htmlFor="idrol">Rol</label>
                                <select
                                    id="idrol"
                                    name="idrol"
                                    value={form.idrol}
                                    onChange={handleInputChange}
                                    disabled={isSaving}
                                >
                                    <option value="">Seleccione un rol</option>
                                    {roles.map((rol) => (
                                        <option key={rol.idrol} value={rol.idrol}>
                                            {rol.nombre}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="usuarios-form-grid">
                                <div className="usuarios-field">
                                    <label htmlFor="password">
                                        {isEditing ? 'Nueva contraseña' : 'Contraseña'}
                                    </label>
                                    <input
                                        id="password"
                                        name="password"
                                        type="password"
                                        value={form.password}
                                        onChange={handleInputChange}
                                        placeholder={isEditing ? 'Dejar vacío para mantener' : 'Mínimo 8 caracteres'}
                                        disabled={isSaving}
                                        autoComplete={isEditing ? 'new-password' : 'new-password'}
                                    />
                                </div>

                                <div className="usuarios-field">
                                    <label htmlFor="password_confirmation">Confirmar contraseña</label>
                                    <input
                                        id="password_confirmation"
                                        name="password_confirmation"
                                        type="password"
                                        value={form.password_confirmation}
                                        onChange={handleInputChange}
                                        placeholder="Repita la contraseña"
                                        disabled={isSaving}
                                        autoComplete="new-password"
                                    />
                                </div>
                            </div>

                            <label className="usuarios-check">
                                <input
                                    type="checkbox"
                                    name="activo"
                                    checked={form.activo}
                                    onChange={handleInputChange}
                                    disabled={isSaving}
                                />
                                <span>Usuario activo</span>
                            </label>

                            <div className="usuarios-form-actions">
                                <button
                                    type="submit"
                                    className="usuarios-btn usuarios-btn-primary"
                                    disabled={isSaving}
                                >
                                    {isSaving
                                        ? 'Guardando...'
                                        : isEditing
                                            ? 'Actualizar usuario'
                                            : 'Registrar usuario'}
                                </button>

                                <button
                                    type="button"
                                    className="usuarios-btn usuarios-btn-light"
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

export default Usuarios;