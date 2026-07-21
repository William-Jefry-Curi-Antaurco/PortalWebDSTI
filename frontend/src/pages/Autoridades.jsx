import { useEffect, useMemo, useState } from 'react';
import {
    Users,
    Plus,
    X,
    Pencil,
    Trash2,
    Save,
    Search,
    Power,
    PowerOff,
    Eye,
    FileText,
    Image,
    Calendar,
    Mail,
    Briefcase,
    Hash,
} from 'lucide-react';

import {
    actualizarAutoridad,
    crearAutoridad,
    eliminarAutoridad,
    listarAutoridades,
    obtenerAutoridad,
} from '../api/autoridadesApi';

import {
    closeNotify,
    getApiErrorMessage,
    notifyError,
    notifyLoading,
    notifySuccess,
} from '../utils/notify';

import '../styles/modules/autoridades.css';

const initialForm = {
    nombre_completo: '',
    cargo: '',
    funciones_principales: '',
    correo_institucional: '',
    foto_url: '',
    cv_url: '',
    foto: null,
    cv: null,
    orden: 0,
    fecha_inicio_gestion: '',
    fecha_fin_gestion: '',
    activo: true,
};

const initialPagination = {
    current_page: 1,
    last_page: 1,
    per_page: 12,
    total: 0,
    from: 0,
    to: 0,
};

const MAX_NOMBRE_LENGTH = 150;
const MAX_CARGO_LENGTH = 100;
const MAX_CORREO_LENGTH = 100;
const MAX_URL_LENGTH = 255;
const MAX_SEARCH_LENGTH = 120;
const MIN_ORDEN = 0;
const MAX_ORDEN = 255;

const MAX_FOTO_SIZE = 5 * 1024 * 1024;
const MAX_CV_SIZE = 10 * 1024 * 1024;

const FOTO_MIMES = ['image/jpeg', 'image/png', 'image/webp'];
const CV_MIMES = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || '';

const normalizarRespuestaPaginada = (response) => {
    const data = response?.data;

    if (Array.isArray(data)) {
        return {
            items: data,
            pagination: {
                ...initialPagination,
                total: data.length,
                from: data.length > 0 ? 1 : 0,
                to: data.length,
            },
        };
    }

    return {
        items: Array.isArray(data?.data) ? data.data : [],
        pagination: {
            current_page: Number(data?.current_page) || 1,
            last_page: Number(data?.last_page) || 1,
            per_page: Number(data?.per_page) || 12,
            total: Number(data?.total) || 0,
            from: Number(data?.from) || 0,
            to: Number(data?.to) || 0,
        },
    };
};

const isPositiveOrZeroInteger = (value) => {
    if (value === '' || value === null || value === undefined) return true;
    return /^\d+$/.test(String(value));
};

const isValidEmail = (value) => {
    if (!value) return true;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
};

const isValidUrl = (value) => {
    if (!value) return true;

    try {
        const url = new URL(value);
        return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
        return false;
    }
};

const isValidDate = (value) => {
    if (!value) return true;

    const date = new Date(`${value}T00:00:00`);
    return !Number.isNaN(date.getTime());
};

export default function Autoridades() {
    const [autoridades, setAutoridades] = useState([]);
    const [pagination, setPagination] = useState(initialPagination);

    const [form, setForm] = useState(initialForm);
    const [editingId, setEditingId] = useState(null);
    const [selectedAutoridad, setSelectedAutoridad] = useState(null);

    const [showForm, setShowForm] = useState(false);
    const [showDetail, setShowDetail] = useState(false);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [loadingDetail, setLoadingDetail] = useState(false);

    const [search, setSearch] = useState('');
    const [estadoFiltro, setEstadoFiltro] = useState('');

    const isEditing = useMemo(() => Boolean(editingId), [editingId]);

    const cargarDatos = async (page = 1) => {
        setLoading(true);

        try {
            const params = {
                page,
                buscar: search.trim() || undefined,
                activo: estadoFiltro === '' ? undefined : estadoFiltro,
            };

            Object.keys(params).forEach((key) => {
                if (params[key] === undefined || params[key] === '') {
                    delete params[key];
                }
            });

            const response = await listarAutoridades(params);
            const { items, pagination: meta } = normalizarRespuestaPaginada(response);

            setAutoridades(items);
            setPagination(meta);
        } catch (err) {
            notifyError(
                getApiErrorMessage(err, 'No se pudieron cargar las autoridades.')
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        cargarDatos(1);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const resetForm = () => {
        setForm(initialForm);
        setEditingId(null);
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

    const handleChange = (e) => {
        const { name, value, type, checked, files } = e.target;

        if (type === 'file') {
            setForm({
                ...form,
                [name]: files?.[0] || null,
            });

            return;
        }

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

    const validarFormulario = () => {
        const nombre = form.nombre_completo.trim();
        const cargo = form.cargo.trim();
        const funciones = form.funciones_principales.trim();
        const correo = form.correo_institucional.trim();
        const fotoUrl = form.foto_url.trim();
        const cvUrl = form.cv_url.trim();
        const orden = Number(form.orden);

        if (!nombre) {
            notifyError('El nombre completo de la autoridad es obligatorio.');
            return false;
        }

        if (nombre.length < 5) {
            notifyError('El nombre completo debe tener al menos 5 caracteres.');
            return false;
        }

        if (nombre.length > MAX_NOMBRE_LENGTH) {
            notifyError(`El nombre completo no debe superar los ${MAX_NOMBRE_LENGTH} caracteres.`);
            return false;
        }

        if (!cargo) {
            notifyError('El cargo es obligatorio.');
            return false;
        }

        if (cargo.length < 3) {
            notifyError('El cargo debe tener al menos 3 caracteres.');
            return false;
        }

        if (cargo.length > MAX_CARGO_LENGTH) {
            notifyError(`El cargo no debe superar los ${MAX_CARGO_LENGTH} caracteres.`);
            return false;
        }

        if (correo && correo.length > MAX_CORREO_LENGTH) {
            notifyError(`El correo institucional no debe superar los ${MAX_CORREO_LENGTH} caracteres.`);
            return false;
        }

        if (!isValidEmail(correo)) {
            notifyError('El correo institucional no tiene un formato válido.');
            return false;
        }

        if (fotoUrl && fotoUrl.length > MAX_URL_LENGTH) {
            notifyError(`La URL de la foto no debe superar los ${MAX_URL_LENGTH} caracteres.`);
            return false;
        }

        if (!isValidUrl(fotoUrl)) {
            notifyError('La URL de la foto debe iniciar con http:// o https://.');
            return false;
        }

        if (cvUrl && cvUrl.length > MAX_URL_LENGTH) {
            notifyError(`La URL del CV no debe superar los ${MAX_URL_LENGTH} caracteres.`);
            return false;
        }

        if (!isValidUrl(cvUrl)) {
            notifyError('La URL del CV debe iniciar con http:// o https://.');
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

        if (!isValidDate(form.fecha_inicio_gestion)) {
            notifyError('La fecha de inicio de gestión no tiene un formato válido.');
            return false;
        }

        if (!isValidDate(form.fecha_fin_gestion)) {
            notifyError('La fecha de fin de gestión no tiene un formato válido.');
            return false;
        }

        if (form.fecha_inicio_gestion && form.fecha_fin_gestion) {
            const inicio = new Date(`${form.fecha_inicio_gestion}T00:00:00`);
            const fin = new Date(`${form.fecha_fin_gestion}T00:00:00`);

            if (fin < inicio) {
                notifyError('La fecha de fin de gestión debe ser igual o posterior a la fecha de inicio.');
                return false;
            }
        }

        if (form.foto) {
            if (!FOTO_MIMES.includes(form.foto.type)) {
                notifyError('La foto debe ser JPG, JPEG, PNG o WEBP.');
                return false;
            }

            if (form.foto.size > MAX_FOTO_SIZE) {
                notifyError('La foto no debe superar los 5 MB.');
                return false;
            }
        }

        if (form.cv) {
            if (!CV_MIMES.includes(form.cv.type)) {
                notifyError('El CV debe ser PDF, Word o DOCX.');
                return false;
            }

            if (form.cv.size > MAX_CV_SIZE) {
                notifyError('El CV no debe superar los 10 MB.');
                return false;
            }
        }

        if (!funciones && !correo && !fotoUrl && !form.foto && !cvUrl && !form.cv) {
            return true;
        }

        return true;
    };

    const buildFormData = () => {
        const data = new FormData();

        data.append('nombre_completo', form.nombre_completo.trim());
        data.append('cargo', form.cargo.trim());
        data.append('funciones_principales', form.funciones_principales.trim());
        data.append('correo_institucional', form.correo_institucional.trim());
        data.append('foto_url', form.foto_url.trim());
        data.append('cv_url', form.cv_url.trim());
        data.append('orden', String(Number(form.orden || 0)));
        data.append('fecha_inicio_gestion', form.fecha_inicio_gestion || '');
        data.append('fecha_fin_gestion', form.fecha_fin_gestion || '');
        data.append('activo', form.activo ? '1' : '0');

        if (form.foto) {
            data.append('foto', form.foto);
        }

        if (form.cv) {
            data.append('cv', form.cv);
        }

        return data;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validarFormulario()) return;

        setSaving(true);

        const toastId = notifyLoading(
            isEditing ? 'Actualizando autoridad...' : 'Registrando autoridad...'
        );

        try {
            const payload = buildFormData();

            if (isEditing) {
                await actualizarAutoridad(editingId, payload);
                notifySuccess('Autoridad actualizada correctamente.');
            } else {
                await crearAutoridad(payload);
                notifySuccess('Autoridad registrada correctamente.');
            }

            cerrarFormulario();
            await cargarDatos(pagination.current_page);
        } catch (err) {
            notifyError(
                getApiErrorMessage(err, 'No se pudo guardar la autoridad.')
            );
        } finally {
            closeNotify(toastId);
            setSaving(false);
        }
    };

    const handleEdit = (autoridad) => {
        setEditingId(autoridad.idautoridad);
        setShowForm(true);

        // Solo cargar los datos necesarios, sin URLs
        setForm({
            nombre_completo: autoridad.nombre_completo || '',
            cargo: autoridad.cargo || '',
            funciones_principales: autoridad.funciones_principales || '',
            correo_institucional: autoridad.correo_institucional || '',
            foto_url: '', // Limpiar URLs al editar
            cv_url: '',   // Limpiar URLs al editar
            foto: null,
            cv: null,
            orden: autoridad.orden ?? 0,
            fecha_inicio_gestion: autoridad.fecha_inicio_gestion || '',
            fecha_fin_gestion: autoridad.fecha_fin_gestion || '',
            activo: Boolean(Number(autoridad.activo)),
        });

        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = async (autoridad) => {
        if (!autoridad.idautoridad) {
            notifyError('No se encontró el identificador de la autoridad.');
            return;
        }

        const ok = confirm(
            `¿Eliminar la autoridad "${autoridad.nombre_completo}"?\n\nTambién se eliminarán sus archivos locales asociados, si existen.`
        );

        if (!ok) return;

        const toastId = notifyLoading('Eliminando autoridad...');

        try {
            await eliminarAutoridad(autoridad.idautoridad);

            notifySuccess('Autoridad eliminada correctamente.');

            const nextPage =
                autoridades.length === 1 && pagination.current_page > 1
                    ? pagination.current_page - 1
                    : pagination.current_page;

            await cargarDatos(nextPage);
        } catch (err) {
            notifyError(
                getApiErrorMessage(err, 'No se pudo eliminar la autoridad.')
            );
        } finally {
            closeNotify(toastId);
        }
    };

    const handleToggleActivo = async (autoridad) => {
        if (!autoridad.idautoridad) {
            notifyError('No se encontró el identificador de la autoridad.');
            return;
        }

        if (!autoridad.nombre_completo || !autoridad.cargo) {
            notifyError('La autoridad no tiene datos completos para cambiar su estado.');
            return;
        }

        const nuevoEstado = !Boolean(Number(autoridad.activo));

        const data = new FormData();
        data.append('nombre_completo', autoridad.nombre_completo);
        data.append('cargo', autoridad.cargo);
        data.append('funciones_principales', autoridad.funciones_principales || '');
        data.append('correo_institucional', autoridad.correo_institucional || '');
        data.append('foto_url', autoridad.foto_url || '');
        data.append('cv_url', autoridad.cv_url || '');
        data.append('orden', String(Number(autoridad.orden || 0)));
        data.append('fecha_inicio_gestion', autoridad.fecha_inicio_gestion || '');
        data.append('fecha_fin_gestion', autoridad.fecha_fin_gestion || '');
        data.append('activo', nuevoEstado ? '1' : '0');

        const toastId = notifyLoading(
            nuevoEstado ? 'Activando autoridad...' : 'Desactivando autoridad...'
        );

        try {
            await actualizarAutoridad(autoridad.idautoridad, data);

            notifySuccess(
                nuevoEstado
                    ? 'Autoridad activada correctamente.'
                    : 'Autoridad desactivada correctamente.'
            );

            await cargarDatos(pagination.current_page);
        } catch (err) {
            notifyError(
                getApiErrorMessage(err, 'No se pudo cambiar el estado de la autoridad.')
            );
        } finally {
            closeNotify(toastId);
        }
    };

    const handleViewDetail = async (autoridad) => {
        setShowDetail(true);
        setLoadingDetail(true);
        setSelectedAutoridad(null);

        try {
            const response = await obtenerAutoridad(autoridad.idautoridad);
            setSelectedAutoridad(response?.data || autoridad);
        } catch (err) {
            notifyError(
                getApiErrorMessage(err, 'No se pudo obtener el detalle de la autoridad.')
            );
            setShowDetail(false);
        } finally {
            setLoadingDetail(false);
        }
    };

    const cerrarDetalle = () => {
        setShowDetail(false);
        setSelectedAutoridad(null);
    };

    const handleBuscar = async (e) => {
        e.preventDefault();

        if (search.trim().length > MAX_SEARCH_LENGTH) {
            notifyError(`La búsqueda no debe superar los ${MAX_SEARCH_LENGTH} caracteres.`);
            return;
        }

        await cargarDatos(1);
    };

    const handleLimpiarFiltros = async () => {
        setSearch('');
        setEstadoFiltro('');

        setTimeout(() => {
            cargarDatos(1);
        }, 0);
    };

    const handlePageChange = async (page) => {
        if (
            page < 1 ||
            page > pagination.last_page ||
            page === pagination.current_page ||
            loading
        ) {
            return;
        }

        await cargarDatos(page);
    };

    const visiblePages = useMemo(() => {
        const current = pagination.current_page;
        const last = pagination.last_page;
        const pages = [];

        const start = Math.max(1, current - 2);
        const end = Math.min(last, current + 2);

        for (let page = start; page <= end; page += 1) {
            pages.push(page);
        }

        return pages;
    }, [pagination]);

    return (
        <section className="autoridades-page">
            <div className="autoridades-header">
                <div>
                    <span className="autoridades-eyebrow">Gestión institucional</span>
                    <h1>Autoridades</h1>
                    <p>
                        Administra las autoridades de la DSTI, sus cargos, funciones,
                        periodo de gestión, foto institucional y CV.
                    </p>
                </div>

                {!showForm && (
                    <button
                        type="button"
                        className="autoridades-add-button"
                        onClick={abrirFormularioCrear}
                        disabled={loading}
                    >
                        <Plus size={18} />
                        Agregar autoridad
                    </button>
                )}
            </div>

            {showForm && (
                <div className="autoridades-form-card">
                    <div className="autoridades-form-header">
                        <div>
                            <h2>{isEditing ? 'Editar autoridad' : 'Agregar autoridad'}</h2>
                            <p>
                                Completa los datos institucionales. Puedes subir archivos o
                                registrar URLs externas.
                            </p>
                        </div>

                        <button
                            type="button"
                            className="autoridades-close-button"
                            onClick={cerrarFormulario}
                            disabled={saving}
                        >
                            <X size={18} />
                        </button>
                    </div>

                    <form className="autoridades-form" onSubmit={handleSubmit}>
                        <div className="autoridades-form-grid">
                            <div className="autoridades-field">
                                <label>Nombre completo *</label>
                                <input
                                    name="nombre_completo"
                                    value={form.nombre_completo}
                                    onChange={handleChange}
                                    maxLength={MAX_NOMBRE_LENGTH}
                                    placeholder="Ej. Dr. Juan Pérez"
                                    required
                                    disabled={saving}
                                />
                            </div>

                            <div className="autoridades-field">
                                <label>Cargo *</label>
                                <input
                                    name="cargo"
                                    value={form.cargo}
                                    onChange={handleChange}
                                    maxLength={MAX_CARGO_LENGTH}
                                    placeholder="Ej. Director de DSTI"
                                    required
                                    disabled={saving}
                                />
                            </div>

                            <div className="autoridades-field">
                                <label>Correo institucional</label>
                                <input
                                    name="correo_institucional"
                                    type="email"
                                    value={form.correo_institucional}
                                    onChange={handleChange}
                                    maxLength={MAX_CORREO_LENGTH}
                                    placeholder="correo@unasam.edu.pe"
                                    disabled={saving}
                                />
                            </div>

                            <div className="autoridades-field">
                                <label>Orden de visualización</label>
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

                            <div className="autoridades-field">
                                <label>Inicio de gestión</label>
                                <input
                                    type="date"
                                    name="fecha_inicio_gestion"
                                    value={form.fecha_inicio_gestion}
                                    onChange={handleChange}
                                    max={form.fecha_fin_gestion || undefined}
                                    disabled={saving}
                                />
                            </div>

                            <div className="autoridades-field">
                                <label>Fin de gestión</label>
                                <input
                                    type="date"
                                    name="fecha_fin_gestion"
                                    value={form.fecha_fin_gestion}
                                    onChange={handleChange}
                                    min={form.fecha_inicio_gestion || undefined}
                                    disabled={saving}
                                />
                            </div>

                            <div className="autoridades-field span-2">
                                <label>Funciones principales</label>
                                <textarea
                                    name="funciones_principales"
                                    value={form.funciones_principales}
                                    onChange={handleChange}
                                    rows={4}
                                    placeholder="Describe las funciones principales de la autoridad."
                                    disabled={saving}
                                />
                            </div>

                            <div className="autoridades-field">
                                <label>URL de foto (opcional)</label>
                                <input
                                    name="foto_url"
                                    value={form.foto_url}
                                    onChange={handleChange}
                                    maxLength={MAX_URL_LENGTH}
                                    placeholder="https://..."
                                    disabled={saving || Boolean(form.foto)}
                                />
                            </div>

                            <div className="autoridades-field">
                                <label>Subir foto (opcional)</label>
                                <input
                                    type="file"
                                    name="foto"
                                    accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                                    onChange={handleChange}
                                    disabled={saving || Boolean(form.foto_url)}
                                />
                                <small>JPG, JPEG, PNG o WEBP. Máximo 5 MB.</small>
                            </div>

                            <div className="autoridades-field">
                                <label>URL de CV (opcional)</label>
                                <input
                                    name="cv_url"
                                    value={form.cv_url}
                                    onChange={handleChange}
                                    maxLength={MAX_URL_LENGTH}
                                    placeholder="https://..."
                                    disabled={saving || Boolean(form.cv)}
                                />
                            </div>

                            <div className="autoridades-field">
                                <label>Subir CV (opcional)</label>
                                <input
                                    type="file"
                                    name="cv"
                                    accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                                    onChange={handleChange}
                                    disabled={saving || Boolean(form.cv_url)}
                                />
                                <small>PDF, DOC o DOCX. Máximo 10 MB.</small>
                            </div>

                            <label className="autoridades-checkbox span-2">
                                <input
                                    type="checkbox"
                                    name="activo"
                                    checked={form.activo}
                                    onChange={handleChange}
                                    disabled={saving}
                                />
                                Autoridad activa
                            </label>
                        </div>

                        <div className="autoridades-form-actions">
                            <button
                                type="submit"
                                className="autoridades-save-button"
                                disabled={saving}
                            >
                                <Save size={17} />
                                {saving
                                    ? 'Guardando...'
                                    : isEditing
                                        ? 'Actualizar autoridad'
                                        : 'Guardar autoridad'}
                            </button>

                            <button
                                type="button"
                                className="autoridades-cancel-button"
                                onClick={cerrarFormulario}
                                disabled={saving}
                            >
                                Cancelar
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="autoridades-list-card">
                <div className="autoridades-list-header">
                    <div>
                        <h2>Autoridades registradas</h2>
                        <p>
                            Mostrando {pagination.from || 0} - {pagination.to || 0} de{' '}
                            {pagination.total} autoridades.
                        </p>
                    </div>

                    <form className="autoridades-filters" onSubmit={handleBuscar}>
                        <div className="autoridades-search">
                            <Search size={17} />
                            <input
                                value={search}
                                onChange={handleSearchChange}
                                placeholder="Buscar autoridad..."
                                maxLength={MAX_SEARCH_LENGTH}
                            />
                        </div>

                        <select
                            value={estadoFiltro}
                            onChange={(e) => setEstadoFiltro(e.target.value)}
                            className="autoridades-filter-select"
                        >
                            <option value="">Todos los estados</option>
                            <option value="1">Activas</option>
                            <option value="0">Inactivas</option>
                        </select>

                        <button type="submit" className="autoridades-filter-button">
                            Buscar
                        </button>

                        <button
                            type="button"
                            className="autoridades-clear-button"
                            onClick={handleLimpiarFiltros}
                        >
                            Limpiar
                        </button>
                    </form>
                </div>

                {loading ? (
                    <div className="autoridades-loading">
                        <p>Cargando autoridades...</p>
                    </div>
                ) : autoridades.length === 0 ? (
                    <div className="autoridades-empty-box">
                        <h3>No hay autoridades para mostrar</h3>
                        <p>Registra una autoridad o cambia los filtros de búsqueda.</p>
                    </div>
                ) : (
                    <>
                        <div className="autoridades-cards-grid">
                            {autoridades.map((autoridad) => {
                                const activo = Boolean(Number(autoridad.activo));

                                return (
                                    <div key={autoridad.idautoridad} className={`autoridad-card ${!activo ? 'inactive' : ''}`}>
                                        <div className="card-header">
                                            <div className="card-avatar">
                                                {autoridad.foto_url ? (
                                                    <img
                                                        src={getFileUrl(autoridad.foto_url)}
                                                        alt={`Foto de ${autoridad.nombre_completo}`}
                                                        onError={(e) => {
                                                            e.currentTarget.style.display = 'none';
                                                            const fallback = e.currentTarget.nextElementSibling;
                                                            if (fallback) {
                                                                fallback.style.display = 'flex';
                                                            }
                                                        }}
                                                    />
                                                ) : null}
                                                <div
                                                    className="avatar-fallback"
                                                    style={{ display: autoridad.foto_url ? 'none' : 'flex' }}
                                                >
                                                    <Users size={32} />
                                                </div>
                                            </div>

                                            <div className="card-status">
                                                <span className={`status-badge ${activo ? 'active' : 'inactive'}`}>
                                                    {activo ? 'Activa' : 'Inactiva'}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="card-body">
                                            <h3 className="card-name">{autoridad.nombre_completo}</h3>
                                            <p className="card-cargo">
                                                <Briefcase size={14} />
                                                {autoridad.cargo}
                                            </p>

                                            {autoridad.correo_institucional && (
                                                <p className="card-correo">
                                                    <Mail size={14} />
                                                    <a href={`mailto:${autoridad.correo_institucional}`}>
                                                        {autoridad.correo_institucional}
                                                    </a>
                                                </p>
                                            )}

                                            {(autoridad.fecha_inicio_gestion || autoridad.fecha_fin_gestion) && (
                                                <p className="card-fechas">
                                                    <Calendar size={14} />
                                                    <span>
                                                        {formatDateSimple(autoridad.fecha_inicio_gestion)}
                                                        {autoridad.fecha_inicio_gestion && autoridad.fecha_fin_gestion && ' - '}
                                                        {formatDateSimple(autoridad.fecha_fin_gestion)}
                                                    </span>
                                                </p>
                                            )}

                                            {autoridad.orden !== null && autoridad.orden !== undefined && (
                                                <p className="card-orden">
                                                    <Hash size={14} />
                                                    Orden: {autoridad.orden}
                                                </p>
                                            )}

                                            {autoridad.funciones_principales && (
                                                <p className="card-funciones">
                                                    {recortarTexto(autoridad.funciones_principales, 120)}
                                                </p>
                                            )}

                                            <div className="card-archivos">
                                                {autoridad.foto_url && (
                                                    <a
                                                        href={getFileUrl(autoridad.foto_url)}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="archivo-link"
                                                        title="Ver foto"
                                                    >
                                                        <Image size={16} />
                                                        <span>Foto</span>
                                                    </a>
                                                )}
                                                {autoridad.cv_url && (
                                                    <a
                                                        href={getFileUrl(autoridad.cv_url)}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="archivo-link"
                                                        title="Ver CV"
                                                    >
                                                        <FileText size={16} />
                                                        <span>CV</span>
                                                    </a>
                                                )}
                                            </div>
                                        </div>

                                        <div className="card-footer">
                                            <button
                                                type="button"
                                                onClick={() => handleViewDetail(autoridad)}
                                                className="card-btn detail"
                                                title="Ver detalle"
                                            >
                                                <Eye size={16} />
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => handleToggleActivo(autoridad)}
                                                className={`card-btn ${activo ? 'toggle-off' : 'toggle-on'}`}
                                                title={activo ? 'Desactivar' : 'Activar'}
                                            >
                                                {activo ? <PowerOff size={16} /> : <Power size={16} />}
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => handleEdit(autoridad)}
                                                className="card-btn edit"
                                                title="Editar"
                                            >
                                                <Pencil size={16} />
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => handleDelete(autoridad)}
                                                className="card-btn delete"
                                                title="Eliminar"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {pagination.last_page > 1 && (
                            <div className="autoridades-pagination">
                                <button
                                    type="button"
                                    onClick={() => handlePageChange(pagination.current_page - 1)}
                                    disabled={loading || pagination.current_page <= 1}
                                >
                                    Anterior
                                </button>

                                {visiblePages.map((page) => (
                                    <button
                                        key={page}
                                        type="button"
                                        onClick={() => handlePageChange(page)}
                                        className={page === pagination.current_page ? 'active' : ''}
                                        disabled={loading}
                                    >
                                        {page}
                                    </button>
                                ))}

                                <button
                                    type="button"
                                    onClick={() => handlePageChange(pagination.current_page + 1)}
                                    disabled={loading || pagination.current_page >= pagination.last_page}
                                >
                                    Siguiente
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>

            {showDetail && (
                <div className="autoridades-modal-overlay" role="dialog" aria-modal="true">
                    <div className="autoridades-modal">
                        <div className="autoridades-modal-header">
                            <div>
                                <span className="autoridades-eyebrow">Detalle de autoridad</span>
                                <h2>
                                    {loadingDetail
                                        ? 'Cargando detalle...'
                                        : selectedAutoridad?.nombre_completo || 'Detalle'}
                                </h2>
                            </div>

                            <button
                                type="button"
                                className="autoridades-close-button"
                                onClick={cerrarDetalle}
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {loadingDetail ? (
                            <p className="autoridades-empty">Cargando detalle...</p>
                        ) : selectedAutoridad ? (
                            <div className="autoridades-detail">
                                {selectedAutoridad.foto_url && (
                                    <div className="autoridades-detail-photo">
                                        <img
                                            src={getFileUrl(selectedAutoridad.foto_url)}
                                            alt={`Foto de ${selectedAutoridad.nombre_completo}`}
                                            onError={(e) => {
                                                e.currentTarget.style.display = 'none';
                                            }}
                                        />
                                    </div>
                                )}

                                <div className="autoridades-detail-grid">
                                    <div>
                                        <span>Cargo</span>
                                        <strong>{selectedAutoridad.cargo}</strong>
                                    </div>

                                    <div>
                                        <span>Correo</span>
                                        <strong>{selectedAutoridad.correo_institucional || '-'}</strong>
                                    </div>

                                    <div>
                                        <span>Orden</span>
                                        <strong>{selectedAutoridad.orden ?? 0}</strong>
                                    </div>

                                    <div>
                                        <span>Estado</span>
                                        <strong>
                                            {Boolean(Number(selectedAutoridad.activo))
                                                ? 'Activa'
                                                : 'Inactiva'}
                                        </strong>
                                    </div>

                                    <div>
                                        <span>Inicio de gestión</span>
                                        <strong>
                                            {formatDateSimple(selectedAutoridad.fecha_inicio_gestion)}
                                        </strong>
                                    </div>

                                    <div>
                                        <span>Fin de gestión</span>
                                        <strong>
                                            {formatDateSimple(selectedAutoridad.fecha_fin_gestion)}
                                        </strong>
                                    </div>
                                </div>

                                <div className="autoridades-detail-content">
                                    <h3>Funciones principales</h3>
                                    <p>
                                        {selectedAutoridad.funciones_principales ||
                                            'Sin funciones registradas.'}
                                    </p>
                                </div>

                                <div className="autoridades-detail-links">
                                    {selectedAutoridad.foto_url && (
                                        <a
                                            href={getFileUrl(selectedAutoridad.foto_url)}
                                            target="_blank"
                                            rel="noreferrer"
                                        >
                                            Ver foto
                                        </a>
                                    )}

                                    {selectedAutoridad.cv_url && (
                                        <a
                                            href={getFileUrl(selectedAutoridad.cv_url)}
                                            target="_blank"
                                            rel="noreferrer"
                                        >
                                            Ver CV
                                        </a>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <p className="autoridades-empty">No se pudo cargar el detalle.</p>
                        )}
                    </div>
                </div>
            )}
        </section>
    );
}

function recortarTexto(value, max = 90) {
    const text = String(value || '').trim();

    if (!text) return 'Sin funciones registradas.';

    if (text.length <= max) return text;

    return `${text.slice(0, max)}...`;
}

function formatDateSimple(value) {
    if (!value) return '-';

    const date = new Date(`${value}T00:00:00`);

    if (Number.isNaN(date.getTime())) {
        return '-';
    }

    return date.toLocaleDateString('es-PE', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    });
}

function getFileUrl(path) {
    if (!path) return '#';

    const value = String(path).trim();

    if (value.startsWith('http://') || value.startsWith('https://')) {
        return value;
    }

    const cleanBackendUrl = String(BACKEND_URL).replace(/\/$/, '');
    const cleanPath = value.replace(/^\/+/, '');

    if (cleanPath.startsWith('storage/')) {
        return `${cleanBackendUrl}/${cleanPath}`;
    }

    return `${cleanBackendUrl}/storage/${cleanPath}`;
}