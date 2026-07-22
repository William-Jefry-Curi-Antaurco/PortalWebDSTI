import { useEffect, useMemo, useState } from 'react';
import {
    AlertTriangle,
    Plus,
    X,
    Pencil,
    Trash2,
    Save,
    Search,
} from 'lucide-react';

import {
    actualizarPrioridad,
    crearPrioridad,
    eliminarPrioridad,
    listarPrioridades,
} from '../api/prioridadesApi';

import {
    closeNotify,
    getApiErrorMessage,
    notifyError,
    notifyLoading,
    notifySuccess,
} from '../utils/notify';

import ConPermiso from '../components/ConPermiso';

import '../styles/modules/prioridades.css';

const initialForm = {
    nombre: '',
    nivel: 1,
    dias_respuesta_max: 0,
    descripcion: '',
};

export default function Prioridades() {
    const [prioridades, setPrioridades] = useState([]);
    const [form, setForm] = useState(initialForm);

    const [editingId, setEditingId] = useState(null);
    const [showForm, setShowForm] = useState(false);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [search, setSearch] = useState('');

    const isEditing = useMemo(() => Boolean(editingId), [editingId]);

    const prioridadesFiltradas = useMemo(() => {
        const value = search.trim().toLowerCase();

        if (!value) return prioridades;

        return prioridades.filter((prioridad) => {
            return (
                String(prioridad.nombre || '').toLowerCase().includes(value) ||
                String(prioridad.nivel || '').toLowerCase().includes(value) ||
                String(prioridad.dias_respuesta_max || '').toLowerCase().includes(value) ||
                String(prioridad.descripcion || '').toLowerCase().includes(value)
            );
        });
    }, [prioridades, search]);

    const cargarDatos = async () => {
        setLoading(true);

        try {
            const data = await listarPrioridades();

            setPrioridades(
                Array.isArray(data)
                    ? data
                    : data?.data || []
            );
        } catch (err) {
            notifyError(
                getApiErrorMessage(
                    err,
                    'No se pudieron cargar las prioridades.'
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

    const handleEdit = (prioridad) => {
        setEditingId(prioridad.idprioridad);
        setShowForm(true);

        setForm({
            nombre: prioridad.nombre || '',
            nivel: prioridad.nivel ?? 1,
            dias_respuesta_max: prioridad.dias_respuesta_max ?? 0,
            descripcion: prioridad.descripcion || '',
        });

        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const buildPayload = () => {
        return {
            nombre: form.nombre.trim(),
            nivel: Number(form.nivel),
            dias_respuesta_max: Number(form.dias_respuesta_max),
            descripcion: form.descripcion.trim() || null,
        };
    };

    const validarFormulario = () => {
        if (!form.nombre.trim()) {
            notifyError('Ingrese el nombre de la prioridad.');
            return false;
        }

        const nivel = Number(form.nivel);

        if (!Number.isInteger(nivel) || nivel < 1 || nivel > 5) {
            notifyError('El nivel debe ser un número entero entre 1 y 5.');
            return false;
        }

        const dias = Number(form.dias_respuesta_max);

        if (!Number.isInteger(dias) || dias < 0 || dias > 255) {
            notifyError('Los días máximos de respuesta deben estar entre 0 y 255.');
            return false;
        }

        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validarFormulario()) return;

        setSaving(true);

        const toastId = notifyLoading(
            isEditing
                ? 'Actualizando prioridad...'
                : 'Registrando prioridad...'
        );

        try {
            const payload = buildPayload();

            if (isEditing) {
                await actualizarPrioridad(editingId, payload);
                notifySuccess('Prioridad actualizada correctamente.');
            } else {
                await crearPrioridad(payload);
                notifySuccess('Prioridad registrada correctamente.');
            }

            cerrarFormulario();
            await cargarDatos();
        } catch (err) {
            notifyError(
                getApiErrorMessage(
                    err,
                    'No se pudo guardar la prioridad.'
                )
            );
        } finally {
            closeNotify(toastId);
            setSaving(false);
        }
    };

    const handleDelete = async (prioridad) => {
        const totalSolicitudes =
            prioridad.solicitudes_soporte_count ||
            prioridad.solicitudesSoporteCount ||
            prioridad.solicitudes_count ||
            prioridad.solicitudesCount ||
            prioridad.total_solicitudes ||
            prioridad.total_solicitudes_soporte ||
            0;

        if (Number(totalSolicitudes) > 0) {
            notifyError(
                'No se puede eliminar esta prioridad porque tiene solicitudes de soporte asociadas.'
            );
            return;
        }

        const ok = confirm(
            `¿Eliminar la prioridad "${prioridad.nombre}"?\n\nSolo se eliminará si no tiene solicitudes de soporte asociadas.`
        );

        if (!ok) return;

        const toastId = notifyLoading('Eliminando prioridad...');

        try {
            await eliminarPrioridad(prioridad.idprioridad);

            notifySuccess('Prioridad eliminada correctamente.');
            await cargarDatos();
        } catch (err) {
            notifyError(
                getApiErrorMessage(
                    err,
                    'No se pudo eliminar la prioridad. Verifica que no tenga solicitudes asociadas.'
                )
            );
        } finally {
            closeNotify(toastId);
        }
    };

    return (
        <section className="prioridades-page">
            <div className="prioridades-header">
                <div>
                    <span className="prioridades-eyebrow">
                        Clasificación y configuración
                    </span>
                    <h1>Prioridades</h1>
                    <p>
                        Administra los niveles de prioridad usados en las solicitudes
                        de soporte técnico. Cada prioridad define un nivel y un tiempo
                        máximo de respuesta.
                    </p>
                </div>

                {!showForm && (
                    <ConPermiso permiso="catalogos.crear">
                        <button
                            type="button"
                            className="prioridades-add-button"
                            onClick={abrirFormularioCrear}
                        >
                            <Plus size={18} />
                            Agregar prioridad
                        </button>
                    </ConPermiso>
                )}
            </div>

            {showForm && (
                <div className="prioridades-form-card">
                    <div className="prioridades-form-header">
                        <div>
                            <h2>
                                {isEditing
                                    ? 'Editar prioridad'
                                    : 'Agregar prioridad'}
                            </h2>
                            <p>
                                Completa el nombre, nivel, días máximos de respuesta
                                y descripción.
                            </p>
                        </div>

                        <button
                            type="button"
                            className="prioridades-close-button"
                            onClick={cerrarFormulario}
                        >
                            <X size={18} />
                        </button>
                    </div>

                    <form
                        className="prioridades-form"
                        onSubmit={handleSubmit}
                    >
                        <div className="prioridades-form-grid">
                            <div className="prioridades-field">
                                <label>Nombre</label>
                                <input
                                    name="nombre"
                                    value={form.nombre}
                                    onChange={handleChange}
                                    maxLength={50}
                                    placeholder="Ej. Alta"
                                    required
                                />
                            </div>

                            <div className="prioridades-field">
                                <label>Nivel</label>
                                <input
                                    type="number"
                                    name="nivel"
                                    value={form.nivel}
                                    onChange={handleChange}
                                    min="1"
                                    max="5"
                                    required
                                />
                                <small>
                                    Usa valores del 1 al 5. Ejemplo: 1 bajo, 5 crítico.
                                </small>
                            </div>

                            <div className="prioridades-field">
                                <label>Días máximos de respuesta</label>
                                <input
                                    type="number"
                                    name="dias_respuesta_max"
                                    value={form.dias_respuesta_max}
                                    onChange={handleChange}
                                    min="0"
                                    max="255"
                                    required
                                />
                            </div>

                            <div className="prioridades-field span-2">
                                <label>Descripción</label>
                                <textarea
                                    name="descripcion"
                                    value={form.descripcion}
                                    onChange={handleChange}
                                    maxLength={255}
                                    rows={4}
                                    placeholder="Descripción breve de la prioridad."
                                />
                            </div>
                        </div>

                        <div className="prioridades-form-actions">
                            <button
                                type="submit"
                                className="prioridades-save-button"
                                disabled={saving}
                            >
                                <Save size={17} />
                                {saving
                                    ? 'Guardando...'
                                    : isEditing
                                        ? 'Actualizar prioridad'
                                        : 'Guardar prioridad'}
                            </button>

                            <button
                                type="button"
                                className="prioridades-cancel-button"
                                onClick={cerrarFormulario}
                            >
                                Cancelar
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="prioridades-list-card">
                <div className="prioridades-list-header">
                    <div>
                        <h2>Prioridades registradas</h2>
                        <p>
                            Listado de prioridades disponibles para solicitudes de soporte.
                        </p>
                    </div>

                    <div className="prioridades-search">
                        <Search size={17} />
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Buscar prioridad..."
                        />
                    </div>
                </div>

                {loading ? (
                    <p className="prioridades-empty">
                        Cargando prioridades...
                    </p>
                ) : prioridadesFiltradas.length === 0 ? (
                    <div className="prioridades-empty-box">
                        <h3>No hay prioridades para mostrar</h3>
                        <p>
                            Registra una prioridad o cambia el criterio de búsqueda.
                        </p>
                    </div>
                ) : (
                    <div className="prioridades-table-wrap">
                        <table className="prioridades-table">
                            <thead>
                            <tr>
                                <th>Prioridad</th>
                                <th>Nivel</th>
                                <th>Días respuesta</th>
                                <th>Descripción</th>
                                <th>Solicitudes</th>
                                <th>Actualización</th>
                                <th>Acciones</th>
                            </tr>
                            </thead>

                            <tbody>
                            {prioridadesFiltradas.map((prioridad) => {
                                const totalSolicitudes =
                                    prioridad.solicitudes_soporte_count ||
                                    prioridad.solicitudesSoporteCount ||
                                    prioridad.solicitudes_count ||
                                    prioridad.solicitudesCount ||
                                    prioridad.total_solicitudes ||
                                    prioridad.total_solicitudes_soporte ||
                                    0;

                                return (
                                    <tr key={prioridad.idprioridad}>
                                        <td>
                                            <div className="prioridades-name">
                                                    <span className={getNivelClass(prioridad.nivel)}>
                                                        <AlertTriangle size={18} />
                                                    </span>

                                                <strong>{prioridad.nombre}</strong>
                                            </div>
                                        </td>

                                        <td>
                                                <span className={getNivelBadgeClass(prioridad.nivel)}>
                                                    Nivel {prioridad.nivel}
                                                </span>
                                        </td>

                                        <td>
                                            {Number(prioridad.dias_respuesta_max)} días
                                        </td>

                                        <td>{prioridad.descripcion || '-'}</td>

                                        <td>{Number(totalSolicitudes)}</td>

                                        <td>{formatDate(prioridad.updated_at)}</td>

                                        <td>
                                            <div className="prioridades-actions">
                                                <ConPermiso permiso="catalogos.editar">
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            handleEdit(prioridad)
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
                                                            handleDelete(prioridad)
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

function getNivelClass(nivel) {
    const value = Number(nivel);

    if (value >= 5) return 'critical';
    if (value >= 4) return 'high';
    if (value >= 3) return 'medium';
    return 'low';
}

function getNivelBadgeClass(nivel) {
    return `prioridades-level ${getNivelClass(nivel)}`;
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