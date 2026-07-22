import { useEffect, useMemo, useState } from 'react';
import {
    Tags,
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
    actualizarCategoria,
    crearCategoria,
    eliminarCategoria,
    listarCategorias,
} from '../api/categoriasApi';

import { listarModulos } from '../api/modulosApi';

import {
    closeNotify,
    getApiErrorMessage,
    notifyError,
    notifyLoading,
    notifySuccess,
} from '../utils/notify';

import ConPermiso from '../components/ConPermiso';

import '../styles/modules/categorias.css';

const initialForm = {
    nombre: '',
    descripcion: '',
    orden: 0,
    activo: true,
    idmodulo: '',
};

const MAX_NOMBRE_LENGTH = 100;
const MAX_DESCRIPCION_LENGTH = 255;
const MAX_SEARCH_LENGTH = 120;
const MIN_ORDEN = 0;
const MAX_ORDEN = 255;

const normalizarListado = (response) => {
    if (Array.isArray(response)) return response;
    if (Array.isArray(response?.data?.data)) return response.data.data;
    if (Array.isArray(response?.data)) return response.data;
    return [];
};

const isPositiveOrZeroInteger = (value) => {
    if (value === '' || value === null || value === undefined) return true;
    return /^\d+$/.test(String(value));
};

export default function Categorias() {
    const [categorias, setCategorias] = useState([]);
    const [modulos, setModulos] = useState([]);

    const [form, setForm] = useState(initialForm);
    const [editingId, setEditingId] = useState(null);
    const [showForm, setShowForm] = useState(false);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [search, setSearch] = useState('');
    const [moduloFiltro, setModuloFiltro] = useState('');

    const isEditing = useMemo(() => Boolean(editingId), [editingId]);

    const categoriasFiltradas = useMemo(() => {
        const value = search.trim().toLowerCase();

        return categorias.filter((categoria) => {
            const coincideBusqueda =
                !value ||
                String(categoria.nombre || '').toLowerCase().includes(value) ||
                String(categoria.slug || '').toLowerCase().includes(value) ||
                String(categoria.descripcion || '').toLowerCase().includes(value) ||
                String(categoria.modulo?.nombre || '').toLowerCase().includes(value);

            const coincideModulo =
                !moduloFiltro ||
                Number(categoria.idmodulo) === Number(moduloFiltro);

            return coincideBusqueda && coincideModulo;
        });
    }, [categorias, search, moduloFiltro]);

    const moduloExiste = (idmodulo) => {
        return modulos.some((modulo) => Number(modulo.idmodulo) === Number(idmodulo));
    };

    const validarFormulario = () => {
        const nombre = form.nombre.trim();
        const descripcion = form.descripcion.trim();
        const orden = Number(form.orden);

        if (!form.idmodulo) {
            notifyError('Seleccione un módulo para la categoría.');
            return false;
        }

        if (!moduloExiste(form.idmodulo)) {
            notifyError('El módulo seleccionado no existe o ya no está disponible.');
            return false;
        }

        if (!nombre) {
            notifyError('El nombre de la categoría es obligatorio.');
            return false;
        }

        if (nombre.length < 3) {
            notifyError('El nombre de la categoría debe tener al menos 3 caracteres.');
            return false;
        }

        if (nombre.length > MAX_NOMBRE_LENGTH) {
            notifyError(`El nombre no debe superar los ${MAX_NOMBRE_LENGTH} caracteres.`);
            return false;
        }

        if (descripcion.length > MAX_DESCRIPCION_LENGTH) {
            notifyError(
                `La descripción no debe superar los ${MAX_DESCRIPCION_LENGTH} caracteres.`
            );
            return false;
        }

        if (!isPositiveOrZeroInteger(form.orden)) {
            notifyError('El orden debe ser un número entero entre 0 y 255.');
            return false;
        }

        if (Number.isNaN(orden) || orden < MIN_ORDEN || orden > MAX_ORDEN) {
            notifyError('El orden debe estar entre 0 y 255.');
            return false;
        }

        return true;
    };

    const cargarDatos = async () => {
        setLoading(true);

        try {
            const [categoriasData, modulosData] = await Promise.all([
                listarCategorias(),
                listarModulos(),
            ]);

            setCategorias(normalizarListado(categoriasData));
            setModulos(normalizarListado(modulosData));
        } catch (err) {
            notifyError(
                getApiErrorMessage(
                    err,
                    'No se pudieron cargar las categorías o módulos.'
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

        if (name === 'orden') {
            if (value !== '' && !/^\d+$/.test(value)) return;

            const numberValue = Number(value);

            if (value !== '' && numberValue > MAX_ORDEN) return;

            setForm({
                ...form,
                orden: value,
            });

            return;
        }

        setForm({
            ...form,
            [name]: type === 'checkbox' ? checked : value,
        });
    };

    const handleSearchChange = (e) => {
        const value = e.target.value;

        if (value.length > MAX_SEARCH_LENGTH) return;

        setSearch(value);
    };

    const abrirFormularioCrear = () => {
        resetForm();
        setShowForm(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const cerrarFormulario = () => {
        if (saving) return;

        resetForm();
        setShowForm(false);
    };

    const resetForm = () => {
        setForm(initialForm);
        setEditingId(null);
    };

    const handleEdit = (categoria) => {
        setEditingId(categoria.idcategoria);
        setShowForm(true);

        setForm({
            nombre: categoria.nombre || '',
            descripcion: categoria.descripcion || '',
            orden: categoria.orden ?? 0,
            activo: Boolean(Number(categoria.activo)),
            idmodulo: categoria.idmodulo || '',
        });

        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const buildPayload = () => {
        return {
            nombre: form.nombre.trim(),
            descripcion: form.descripcion.trim() || null,
            orden: Number(form.orden || 0),
            activo: form.activo ? 1 : 0,
            idmodulo: Number(form.idmodulo),
        };
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validarFormulario()) return;

        setSaving(true);

        const toastId = notifyLoading(
            isEditing ? 'Actualizando categoría...' : 'Registrando categoría...'
        );

        try {
            const payload = buildPayload();

            if (isEditing) {
                await actualizarCategoria(editingId, payload);
                notifySuccess('Categoría actualizada correctamente.');
            } else {
                await crearCategoria(payload);
                notifySuccess('Categoría registrada correctamente.');
            }

            cerrarFormulario();
            await cargarDatos();
        } catch (err) {
            notifyError(
                getApiErrorMessage(
                    err,
                    'No se pudo guardar la categoría.'
                )
            );
        } finally {
            closeNotify(toastId);
            setSaving(false);
        }
    };

    const handleDelete = async (categoria) => {
        const totalNoticias =
            categoria.noticias_count ||
            categoria.noticiasCount ||
            categoria.total_noticias ||
            0;

        if (!categoria.idcategoria) {
            notifyError('No se encontró el identificador de la categoría.');
            return;
        }

        if (Number(totalNoticias) > 0) {
            notifyError(
                'No se puede eliminar esta categoría porque tiene noticias asociadas.'
            );
            return;
        }

        const ok = confirm(
            `¿Eliminar la categoría "${categoria.nombre}"?\n\nSolo se eliminará si no tiene noticias asociadas.`
        );

        if (!ok) return;

        const toastId = notifyLoading('Eliminando categoría...');

        try {
            await eliminarCategoria(categoria.idcategoria);

            notifySuccess('Categoría eliminada correctamente.');
            await cargarDatos();
        } catch (err) {
            notifyError(
                getApiErrorMessage(
                    err,
                    'No se pudo eliminar la categoría. Verifica que no tenga noticias asociadas.'
                )
            );
        } finally {
            closeNotify(toastId);
        }
    };

    const handleToggleActivo = async (categoria) => {
        if (!categoria.idcategoria) {
            notifyError('No se encontró el identificador de la categoría.');
            return;
        }

        if (!categoria.nombre || !String(categoria.nombre).trim()) {
            notifyError('La categoría no tiene un nombre válido.');
            return;
        }

        if (!categoria.idmodulo) {
            notifyError('La categoría no tiene un módulo asociado.');
            return;
        }

        if (!moduloExiste(categoria.idmodulo)) {
            notifyError('El módulo asociado a la categoría no existe o no está disponible.');
            return;
        }

        const nuevoEstado = !Boolean(Number(categoria.activo));

        const toastId = notifyLoading(
            nuevoEstado ? 'Activando categoría...' : 'Desactivando categoría...'
        );

        try {
            await actualizarCategoria(categoria.idcategoria, {
                nombre: String(categoria.nombre).trim(),
                descripcion: categoria.descripcion || null,
                orden: Number(categoria.orden || 0),
                activo: nuevoEstado ? 1 : 0,
                idmodulo: Number(categoria.idmodulo),
            });

            notifySuccess(
                nuevoEstado
                    ? 'Categoría activada correctamente.'
                    : 'Categoría desactivada correctamente.'
            );

            await cargarDatos();
        } catch (err) {
            notifyError(
                getApiErrorMessage(
                    err,
                    'No se pudo cambiar el estado de la categoría.'
                )
            );
        } finally {
            closeNotify(toastId);
        }
    };

    return (
        <section className="categorias-page">
            <div className="categorias-header">
                <div>
                    <span className="categorias-eyebrow">
                        Clasificación y configuración
                    </span>
                    <h1>Categorías</h1>
                    <p>
                        Administra las categorías del portal según el módulo al que
                        pertenecen. Estas categorías se reutilizan en noticias,
                        documentos, servicios, eventos, tutoriales y otros apartados.
                    </p>
                </div>

                {!showForm && (
                    <ConPermiso permiso="catalogos.crear">
                        <button
                            type="button"
                            className="categorias-add-button"
                            onClick={abrirFormularioCrear}
                            disabled={loading}
                        >
                            <Plus size={18} />
                            Agregar categoría
                        </button>
                    </ConPermiso>
                )}
            </div>

            {showForm && (
                <div className="categorias-form-card">
                    <div className="categorias-form-header">
                        <div>
                            <h2>
                                {isEditing ? 'Editar categoría' : 'Agregar categoría'}
                            </h2>
                            <p>
                                Completa el módulo, nombre, descripción, orden y estado.
                                El slug será generado por el backend.
                            </p>
                        </div>

                        <button
                            type="button"
                            className="categorias-close-button"
                            onClick={cerrarFormulario}
                            disabled={saving}
                        >
                            <X size={18} />
                        </button>
                    </div>

                    <form className="categorias-form" onSubmit={handleSubmit}>
                        <div className="categorias-form-grid">
                            <div className="categorias-field">
                                <label>Módulo</label>
                                <select
                                    name="idmodulo"
                                    value={form.idmodulo}
                                    onChange={handleChange}
                                    required
                                    disabled={saving}
                                >
                                    <option value="">Seleccione un módulo</option>
                                    {modulos.map((modulo) => (
                                        <option
                                            key={modulo.idmodulo}
                                            value={modulo.idmodulo}
                                        >
                                            {modulo.nombre}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="categorias-field">
                                <label>Nombre</label>
                                <input
                                    name="nombre"
                                    value={form.nombre}
                                    onChange={handleChange}
                                    maxLength={MAX_NOMBRE_LENGTH}
                                    placeholder="Ej. Comunicados"
                                    required
                                    disabled={saving}
                                />
                            </div>

                            <div className="categorias-field">
                                <label>Orden</label>
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    name="orden"
                                    value={form.orden}
                                    onChange={handleChange}
                                    placeholder="0"
                                    disabled={saving}
                                />
                            </div>

                            <div className="categorias-field span-2">
                                <label>Descripción</label>
                                <textarea
                                    name="descripcion"
                                    value={form.descripcion}
                                    onChange={handleChange}
                                    maxLength={MAX_DESCRIPCION_LENGTH}
                                    rows={4}
                                    placeholder="Descripción breve de la categoría."
                                    disabled={saving}
                                />
                                <small>
                                    {form.descripcion.length}/{MAX_DESCRIPCION_LENGTH} caracteres
                                </small>
                            </div>

                            <label className="categorias-checkbox span-2">
                                <input
                                    type="checkbox"
                                    name="activo"
                                    checked={form.activo}
                                    onChange={handleChange}
                                    disabled={saving}
                                />
                                Categoría activa
                            </label>
                        </div>

                        <div className="categorias-form-actions">
                            <button
                                type="submit"
                                className="categorias-save-button"
                                disabled={saving}
                            >
                                <Save size={17} />
                                {saving
                                    ? 'Guardando...'
                                    : isEditing
                                        ? 'Actualizar categoría'
                                        : 'Guardar categoría'}
                            </button>

                            <button
                                type="button"
                                className="categorias-cancel-button"
                                onClick={cerrarFormulario}
                                disabled={saving}
                            >
                                Cancelar
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="categorias-list-card">
                <div className="categorias-list-header">
                    <div>
                        <h2>Categorías registradas</h2>
                        <p>
                            Listado de categorías agrupadas por módulo base.
                        </p>
                    </div>

                    <div className="categorias-filters">
                        <div className="categorias-search">
                            <Search size={17} />
                            <input
                                value={search}
                                onChange={handleSearchChange}
                                placeholder="Buscar categoría..."
                                maxLength={MAX_SEARCH_LENGTH}
                            />
                        </div>

                        <select
                            value={moduloFiltro}
                            onChange={(e) => setModuloFiltro(e.target.value)}
                            className="categorias-filter-select"
                        >
                            <option value="">Todos los módulos</option>
                            {modulos.map((modulo) => (
                                <option
                                    key={modulo.idmodulo}
                                    value={modulo.idmodulo}
                                >
                                    {modulo.nombre}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {loading ? (
                    <p className="categorias-empty">Cargando categorías...</p>
                ) : categoriasFiltradas.length === 0 ? (
                    <div className="categorias-empty-box">
                        <h3>No hay categorías para mostrar</h3>
                        <p>
                            Registra una categoría o cambia el criterio de búsqueda.
                        </p>
                    </div>
                ) : (
                    <div className="categorias-table-wrap">
                        <table className="categorias-table">
                            <thead>
                            <tr>
                                <th>Categoría</th>
                                <th>Módulo</th>
                                <th>Slug</th>
                                <th>Orden</th>
                                <th>Estado</th>
                                <th>Noticias</th>
                                <th>Actualización</th>
                                <th>Acciones</th>
                            </tr>
                            </thead>

                            <tbody>
                            {categoriasFiltradas.map((categoria) => {
                                const activo = Boolean(Number(categoria.activo));

                                const totalNoticias =
                                    categoria.noticias_count ||
                                    categoria.noticiasCount ||
                                    categoria.total_noticias ||
                                    0;

                                return (
                                    <tr key={categoria.idcategoria}>
                                        <td>
                                            <div className="categorias-name">
                                                    <span>
                                                        <Tags size={18} />
                                                    </span>

                                                <div>
                                                    <strong>{categoria.nombre}</strong>
                                                    <small>
                                                        {categoria.descripcion || 'Sin descripción'}
                                                    </small>
                                                </div>
                                            </div>
                                        </td>

                                        <td>
                                            {categoria.modulo?.nombre ||
                                                getModuloNombre(
                                                    modulos,
                                                    categoria.idmodulo
                                                )}
                                        </td>

                                        <td>
                                            <code>{categoria.slug || '-'}</code>
                                        </td>

                                        <td>{categoria.orden ?? 0}</td>

                                        <td>
                                                <span
                                                    className={
                                                        activo
                                                            ? 'categorias-status active'
                                                            : 'categorias-status inactive'
                                                    }
                                                >
                                                    {activo ? 'Activa' : 'Inactiva'}
                                                </span>
                                        </td>

                                        <td>{Number(totalNoticias)}</td>

                                        <td>{formatDate(categoria.updated_at)}</td>

                                        <td>
                                            <div className="categorias-actions">
                                                <ConPermiso permiso="catalogos.editar">
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            handleToggleActivo(categoria)
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
                                                            handleEdit(categoria)
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
                                                            handleDelete(categoria)
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

function getModuloNombre(modulos, idmodulo) {
    const modulo = modulos.find((item) => Number(item.idmodulo) === Number(idmodulo));
    return modulo?.nombre || '-';
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