import { useEffect, useMemo, useState } from 'react';
import {
    CheckCircle,
    Plus,
    X,
    Pencil,
    Trash2,
    Save,
    Search,
} from 'lucide-react';

import {
    actualizarEstado,
    crearEstado,
    eliminarEstado,
    listarEstados,
} from '../api/estadosApi';

import { listarTiposEntidad } from '../api/tiposEntidadApi';

import {
    closeNotify,
    getApiErrorMessage,
    notifyError,
    notifyLoading,
    notifySuccess,
} from '../utils/notify';

import '../styles/modules/estados.css';

const initialForm = {
    nombre: '',
    descripcion: '',
    idtipoentidad: '',
};

export default function Estados() {
    const [estados, setEstados] = useState([]);
    const [tiposEntidad, setTiposEntidad] = useState([]);

    const [form, setForm] = useState(initialForm);
    const [editingId, setEditingId] = useState(null);
    const [showForm, setShowForm] = useState(false);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [search, setSearch] = useState('');
    const [tipoEntidadFiltro, setTipoEntidadFiltro] = useState('');

    const isEditing = useMemo(() => Boolean(editingId), [editingId]);

    const estadosFiltrados = useMemo(() => {
        const value = search.trim().toLowerCase();

        return estados.filter((estado) => {
            const tipoEntidadNombre =
                estado.tipo_entidad?.nombre ||
                estado.tipoEntidad?.nombre ||
                getTipoEntidadNombre(tiposEntidad, estado.idtipoentidad);

            const coincideBusqueda =
                !value ||
                String(estado.nombre || '').toLowerCase().includes(value) ||
                String(estado.slug || '').toLowerCase().includes(value) ||
                String(estado.descripcion || '').toLowerCase().includes(value) ||
                String(tipoEntidadNombre || '').toLowerCase().includes(value);

            const coincideTipoEntidad =
                !tipoEntidadFiltro ||
                Number(estado.idtipoentidad) === Number(tipoEntidadFiltro);

            return coincideBusqueda && coincideTipoEntidad;
        });
    }, [estados, tiposEntidad, search, tipoEntidadFiltro]);

    const cargarDatos = async () => {
        setLoading(true);

        try {
            const [estadosData, tiposEntidadData] = await Promise.all([
                listarEstados(),
                listarTiposEntidad(),
            ]);

            setEstados(
                Array.isArray(estadosData)
                    ? estadosData
                    : estadosData?.data || []
            );

            setTiposEntidad(
                Array.isArray(tiposEntidadData)
                    ? tiposEntidadData
                    : tiposEntidadData?.data || []
            );
        } catch (err) {
            notifyError(
                getApiErrorMessage(
                    err,
                    'No se pudieron cargar los estados o tipos de entidad.'
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

    const handleEdit = (estado) => {
        setEditingId(estado.idestado);
        setShowForm(true);

        setForm({
            nombre: estado.nombre || '',
            descripcion: estado.descripcion || '',
            idtipoentidad: estado.idtipoentidad || '',
        });

        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const buildPayload = () => {
        return {
            nombre: form.nombre.trim(),
            descripcion: form.descripcion.trim() || null,
            idtipoentidad: Number(form.idtipoentidad),
        };
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!form.idtipoentidad) {
            notifyError('Seleccione un tipo de entidad para el estado.');
            return;
        }

        setSaving(true);

        const toastId = notifyLoading(
            isEditing ? 'Actualizando estado...' : 'Registrando estado...'
        );

        try {
            const payload = buildPayload();

            if (isEditing) {
                await actualizarEstado(editingId, payload);
                notifySuccess('Estado actualizado correctamente.');
            } else {
                await crearEstado(payload);
                notifySuccess('Estado registrado correctamente.');
            }

            cerrarFormulario();
            await cargarDatos();
        } catch (err) {
            notifyError(
                getApiErrorMessage(
                    err,
                    'No se pudo guardar el estado.'
                )
            );
        } finally {
            closeNotify(toastId);
            setSaving(false);
        }
    };

    const handleDelete = async (estado) => {
        const totalNoticias =
            estado.noticias_count ||
            estado.noticiasCount ||
            estado.total_noticias ||
            0;

        if (Number(totalNoticias) > 0) {
            notifyError(
                'No se puede eliminar este estado porque tiene noticias asociadas.'
            );
            return;
        }

        const ok = confirm(
            `¿Eliminar el estado "${estado.nombre}"?\n\nSolo se eliminará si no tiene noticias asociadas.`
        );

        if (!ok) return;

        const toastId = notifyLoading('Eliminando estado...');

        try {
            await eliminarEstado(estado.idestado);

            notifySuccess('Estado eliminado correctamente.');
            await cargarDatos();
        } catch (err) {
            notifyError(
                getApiErrorMessage(
                    err,
                    'No se pudo eliminar el estado. Verifica que no tenga noticias asociadas.'
                )
            );
        } finally {
            closeNotify(toastId);
        }
    };

    return (
        <section className="estados-page">
            <div className="estados-header">
                <div>
                    <span className="estados-eyebrow">
                        Clasificación y configuración
                    </span>
                    <h1>Estados</h1>
                    <p>
                        Administra los estados usados por las entidades del portal.
                        Cada estado pertenece a un tipo de entidad, por ejemplo:
                        noticias, documentos, solicitudes o eventos.
                    </p>
                </div>

                {!showForm && (
                    <button
                        type="button"
                        className="estados-add-button"
                        onClick={abrirFormularioCrear}
                    >
                        <Plus size={18} />
                        Agregar estado
                    </button>
                )}
            </div>

            {showForm && (
                <div className="estados-form-card">
                    <div className="estados-form-header">
                        <div>
                            <h2>
                                {isEditing ? 'Editar estado' : 'Agregar estado'}
                            </h2>
                            <p>
                                Completa el tipo de entidad, nombre y descripción.
                                El slug será generado por el backend según el tipo
                                de entidad.
                            </p>
                        </div>

                        <button
                            type="button"
                            className="estados-close-button"
                            onClick={cerrarFormulario}
                        >
                            <X size={18} />
                        </button>
                    </div>

                    <form className="estados-form" onSubmit={handleSubmit}>
                        <div className="estados-form-grid">
                            <div className="estados-field">
                                <label>Tipo de entidad</label>
                                <select
                                    name="idtipoentidad"
                                    value={form.idtipoentidad}
                                    onChange={handleChange}
                                    required
                                >
                                    <option value="">Seleccione un tipo</option>
                                    {tiposEntidad.map((tipo) => (
                                        <option
                                            key={tipo.idtipoentidad}
                                            value={tipo.idtipoentidad}
                                        >
                                            {tipo.nombre}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="estados-field">
                                <label>Nombre</label>
                                <input
                                    name="nombre"
                                    value={form.nombre}
                                    onChange={handleChange}
                                    maxLength={50}
                                    placeholder="Ej. Publicado"
                                    required
                                />
                            </div>

                            <div className="estados-field span-2">
                                <label>Descripción</label>
                                <textarea
                                    name="descripcion"
                                    value={form.descripcion}
                                    onChange={handleChange}
                                    maxLength={255}
                                    rows={4}
                                    placeholder="Descripción breve del estado."
                                />
                            </div>
                        </div>

                        <div className="estados-form-actions">
                            <button
                                type="submit"
                                className="estados-save-button"
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
                                className="estados-cancel-button"
                                onClick={cerrarFormulario}
                            >
                                Cancelar
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="estados-list-card">
                <div className="estados-list-header">
                    <div>
                        <h2>Estados registrados</h2>
                        <p>
                            Listado de estados agrupados por tipo de entidad.
                        </p>
                    </div>

                    <div className="estados-filters">
                        <div className="estados-search">
                            <Search size={17} />
                            <input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Buscar estado..."
                            />
                        </div>

                        <select
                            value={tipoEntidadFiltro}
                            onChange={(e) =>
                                setTipoEntidadFiltro(e.target.value)
                            }
                            className="estados-filter-select"
                        >
                            <option value="">Todos los tipos</option>
                            {tiposEntidad.map((tipo) => (
                                <option
                                    key={tipo.idtipoentidad}
                                    value={tipo.idtipoentidad}
                                >
                                    {tipo.nombre}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {loading ? (
                    <p className="estados-empty">Cargando estados...</p>
                ) : estadosFiltrados.length === 0 ? (
                    <div className="estados-empty-box">
                        <h3>No hay estados para mostrar</h3>
                        <p>
                            Registra un estado o cambia el criterio de búsqueda.
                        </p>
                    </div>
                ) : (
                    <div className="estados-table-wrap">
                        <table className="estados-table">
                            <thead>
                            <tr>
                                <th>Estado</th>
                                <th>Tipo de entidad</th>
                                <th>Slug</th>
                                <th>Noticias</th>
                                <th>Actualización</th>
                                <th>Acciones</th>
                            </tr>
                            </thead>

                            <tbody>
                            {estadosFiltrados.map((estado) => {
                                const totalNoticias =
                                    estado.noticias_count ||
                                    estado.noticiasCount ||
                                    estado.total_noticias ||
                                    0;

                                const tipoEntidadNombre =
                                    estado.tipo_entidad?.nombre ||
                                    estado.tipoEntidad?.nombre ||
                                    getTipoEntidadNombre(
                                        tiposEntidad,
                                        estado.idtipoentidad
                                    );

                                return (
                                    <tr key={estado.idestado}>
                                        <td>
                                            <div className="estados-name">
                                                    <span>
                                                        <CheckCircle size={18} />
                                                    </span>

                                                <div>
                                                    <strong>{estado.nombre}</strong>
                                                    <small>
                                                        {estado.descripcion ||
                                                            'Sin descripción'}
                                                    </small>
                                                </div>
                                            </div>
                                        </td>

                                        <td>{tipoEntidadNombre}</td>

                                        <td>
                                            <code>{estado.slug || '-'}</code>
                                        </td>

                                        <td>{Number(totalNoticias)}</td>

                                        <td>{formatDate(estado.updated_at)}</td>

                                        <td>
                                            <div className="estados-actions">
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

function getTipoEntidadNombre(tiposEntidad, idtipoentidad) {
    const tipo = tiposEntidad.find(
        (item) => Number(item.idtipoentidad) === Number(idtipoentidad)
    );

    return tipo?.nombre || '-';
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