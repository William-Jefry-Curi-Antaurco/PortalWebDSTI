import { useEffect, useMemo, useState } from 'react';
import { rolesApi } from '../api/rolesApi';
import '../styles/modules/roles.css';

const initialForm = {
    nombre: '',
    descripcion: '',
};

const normalizarListadoRoles = (response) => {
    if (Array.isArray(response)) return response;
    if (Array.isArray(response?.data)) return response.data;
    if (Array.isArray(response?.data?.data)) return response.data.data;
    if (Array.isArray(response?.roles)) return response.roles;
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

const Roles = () => {
    const [roles, setRoles] = useState([]);
    const [form, setForm] = useState(initialForm);
    const [rolEditando, setRolEditando] = useState(null);

    const [busqueda, setBusqueda] = useState('');
    const [loading, setLoading] = useState(false);
    const [guardando, setGuardando] = useState(false);
    const [error, setError] = useState('');
    const [mensaje, setMensaje] = useState('');

    const cargarRoles = async () => {
        try {
            setLoading(true);
            setError('');

            const response = await rolesApi.listar();
            const listado = normalizarListadoRoles(response);

            setRoles(listado);
        } catch (err) {
            setError(getApiErrorMessage(err));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        cargarRoles();
    }, []);

    const rolesFiltrados = useMemo(() => {
        const texto = busqueda.trim().toLowerCase();

        if (!texto) return roles;

        return roles.filter((rol) => {
            const nombre = rol.nombre?.toLowerCase() || '';
            const descripcion = rol.descripcion?.toLowerCase() || '';

            return nombre.includes(texto) || descripcion.includes(texto);
        });
    }, [roles, busqueda]);

    const limpiarMensajes = () => {
        setError('');
        setMensaje('');
    };

    const limpiarFormulario = () => {
        setForm(initialForm);
        setRolEditando(null);
        limpiarMensajes();
    };

    const handleChange = (e) => {
        const { name, value } = e.target;

        setForm((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const validarFormulario = () => {
        if (!form.nombre.trim()) {
            setError('El nombre del rol es obligatorio.');
            return false;
        }

        if (form.nombre.trim().length < 3) {
            setError('El nombre del rol debe tener al menos 3 caracteres.');
            return false;
        }

        if (form.nombre.trim().length > 50) {
            setError('El nombre del rol no debe superar los 50 caracteres.');
            return false;
        }

        if (form.descripcion && form.descripcion.length > 255) {
            setError('La descripción no debe superar los 255 caracteres.');
            return false;
        }

        return true;
    };

    const construirPayload = () => ({
        nombre: form.nombre.trim(),
        descripcion: form.descripcion.trim() || null,
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        limpiarMensajes();

        if (!validarFormulario()) return;

        try {
            setGuardando(true);

            const payload = construirPayload();

            if (rolEditando) {
                await rolesApi.actualizar(rolEditando.idrol, payload);
                setMensaje('Rol actualizado correctamente.');
            } else {
                await rolesApi.crear(payload);
                setMensaje('Rol registrado correctamente.');
            }

            limpiarFormulario();
            await cargarRoles();
        } catch (err) {
            setError(getApiErrorMessage(err));
        } finally {
            setGuardando(false);
        }
    };

    const handleEditar = (rol) => {
        limpiarMensajes();

        setRolEditando(rol);
        setForm({
            nombre: rol.nombre || '',
            descripcion: rol.descripcion || '',
        });

        window.scrollTo({
            top: 0,
            behavior: 'smooth',
        });
    };

    const esRolCritico = (rol) => {
        const nombre = rol.nombre?.toLowerCase();
        return ['admin', 'editor', 'lector'].includes(nombre);
    };

    const obtenerTotalUsuarios = (rol) => {
        return (
            rol.usuarios_count ??
            rol.total_usuarios ??
            rol.usuarios?.length ??
            0
        );
    };

    const handleEliminar = async (rol) => {
        limpiarMensajes();

        const totalUsuarios = obtenerTotalUsuarios(rol);

        if (totalUsuarios > 0) {
            setError(
                `No se puede eliminar el rol "${rol.nombre}" porque tiene ${totalUsuarios} usuario(s) asociado(s).`
            );
            return;
        }

        if (esRolCritico(rol)) {
            const confirmarCritico = window.confirm(
                `El rol "${rol.nombre}" es un rol base del sistema. ¿Seguro que deseas eliminarlo?`
            );

            if (!confirmarCritico) return;
        }

        const confirmar = window.confirm(
            `¿Estás seguro de eliminar el rol "${rol.nombre}"?`
        );

        if (!confirmar) return;

        try {
            setLoading(true);
            await rolesApi.eliminar(rol.idrol);

            setMensaje('Rol eliminado correctamente.');
            await cargarRoles();

            if (rolEditando?.idrol === rol.idrol) {
                limpiarFormulario();
            }
        } catch (err) {
            setError(getApiErrorMessage(err));
        } finally {
            setLoading(false);
        }
    };

    return (
        <section className="roles-page">
            <div className="roles-header">
                <div>
                    <p className="roles-kicker">Seguridad y acceso</p>
                    <h1>Gestión de roles</h1>
                    <p>
                        Administra los roles utilizados por los usuarios del panel
                        administrativo.
                    </p>
                </div>

                <button
                    type="button"
                    className="roles-btn roles-btn-secondary"
                    onClick={cargarRoles}
                    disabled={loading}
                >
                    {loading ? 'Actualizando...' : 'Actualizar'}
                </button>
            </div>

            <div className="roles-grid">
                <form className="roles-card roles-form" onSubmit={handleSubmit}>
                    <div className="roles-card-header">
                        <h2>{rolEditando ? 'Editar rol' : 'Nuevo rol'}</h2>
                        {rolEditando && (
                            <span className="roles-edit-badge">
                ID #{rolEditando.idrol}
              </span>
                        )}
                    </div>

                    {error && <div className="roles-alert roles-alert-error">{error}</div>}
                    {mensaje && (
                        <div className="roles-alert roles-alert-success">{mensaje}</div>
                    )}

                    <div className="roles-field">
                        <label htmlFor="nombre">Nombre del rol</label>
                        <input
                            id="nombre"
                            name="nombre"
                            type="text"
                            value={form.nombre}
                            onChange={handleChange}
                            placeholder="Ejemplo: admin, editor, lector"
                            maxLength={50}
                            disabled={guardando}
                        />
                    </div>

                    <div className="roles-field">
                        <label htmlFor="descripcion">Descripción</label>
                        <textarea
                            id="descripcion"
                            name="descripcion"
                            value={form.descripcion}
                            onChange={handleChange}
                            placeholder="Describe brevemente el propósito del rol"
                            maxLength={255}
                            disabled={guardando}
                            rows={4}
                        />
                        <small>{form.descripcion.length}/255 caracteres</small>
                    </div>

                    <div className="roles-form-actions">
                        <button
                            type="submit"
                            className="roles-btn roles-btn-primary"
                            disabled={guardando}
                        >
                            {guardando
                                ? 'Guardando...'
                                : rolEditando
                                    ? 'Actualizar rol'
                                    : 'Registrar rol'}
                        </button>

                        {rolEditando && (
                            <button
                                type="button"
                                className="roles-btn roles-btn-light"
                                onClick={limpiarFormulario}
                                disabled={guardando}
                            >
                                Cancelar
                            </button>
                        )}
                    </div>
                </form>

                <div className="roles-card roles-list-card">
                    <div className="roles-toolbar">
                        <div>
                            <h2>Listado de roles</h2>
                            <p>{rolesFiltrados.length} rol(es) encontrado(s)</p>
                        </div>

                        <div className="roles-search">
                            <input
                                type="search"
                                value={busqueda}
                                onChange={(e) => setBusqueda(e.target.value)}
                                placeholder="Buscar rol..."
                            />
                        </div>
                    </div>

                    <div className="roles-table-wrapper">
                        <table className="roles-table">
                            <thead>
                            <tr>
                                <th>ID</th>
                                <th>Rol</th>
                                <th>Descripción</th>
                                <th>Usuarios</th>
                                <th>Acciones</th>
                            </tr>
                            </thead>

                            <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="5" className="roles-empty">
                                        Cargando roles...
                                    </td>
                                </tr>
                            ) : rolesFiltrados.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="roles-empty">
                                        No se encontraron roles.
                                    </td>
                                </tr>
                            ) : (
                                rolesFiltrados.map((rol) => {
                                    const totalUsuarios = obtenerTotalUsuarios(rol);

                                    return (
                                        <tr key={rol.idrol}>
                                            <td>#{rol.idrol}</td>
                                            <td>
                                                <div className="roles-name-cell">
                                                    <strong>{rol.nombre}</strong>
                                                    {esRolCritico(rol) && (
                                                        <span className="roles-system-badge">
                                Base
                              </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td>
                                                {rol.descripcion || (
                                                    <span className="roles-muted">Sin descripción</span>
                                                )}
                                            </td>
                                            <td>
                          <span
                              className={
                                  totalUsuarios > 0
                                      ? 'roles-count roles-count-active'
                                      : 'roles-count'
                              }
                          >
                            {totalUsuarios}
                          </span>
                                            </td>
                                            <td>
                                                <div className="roles-actions">
                                                    <button
                                                        type="button"
                                                        className="roles-action-btn roles-action-edit"
                                                        onClick={() => handleEditar(rol)}
                                                    >
                                                        Editar
                                                    </button>

                                                    <button
                                                        type="button"
                                                        className="roles-action-btn roles-action-delete"
                                                        onClick={() => handleEliminar(rol)}
                                                        disabled={totalUsuarios > 0}
                                                        title={
                                                            totalUsuarios > 0
                                                                ? 'No se puede eliminar porque tiene usuarios asociados'
                                                                : 'Eliminar rol'
                                                        }
                                                    >
                                                        Eliminar
                                                    </button>
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
            </div>
        </section>
    );
};

export default Roles;