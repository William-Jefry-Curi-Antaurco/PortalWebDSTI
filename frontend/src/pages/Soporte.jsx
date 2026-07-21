import { useEffect, useMemo, useState } from 'react';
import {
    LifeBuoy,
    Plus,
    X,
    Pencil,
    Trash2,
    Save,
    Search,
    Eye,
    Mail,
    Phone,
    Building2,
    ShieldCheck,
    AlertTriangle,
    Wrench,
    MessageSquare,
    Send,
    Paperclip,
    Download,
    UserRound,
    CalendarDays,
} from 'lucide-react';

import {
    actualizarSolicitudSoporte,
    crearSolicitudSoporte,
    eliminarRespuestaSoporte,
    eliminarSolicitudSoporte,
    listarEstados,
    listarPrioridades,
    listarSolicitudesSoporte,
    listarTiposSoporte,
    obtenerSolicitudSoporte,
    responderSolicitudSoporte,
} from '../api/soporteApi';

import {
    closeNotify,
    getApiErrorMessage,
    notifyError,
    notifyLoading,
    notifySuccess,
} from '../utils/notify';

import '../styles/modules/solicitudsoporte.css';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const initialForm = {
    nombres: '',
    email: '',
    telefono: '',
    dependencia: '',
    asunto: '',
    descripcion: '',
    consentimiento_privacidad: true,
    idtiposoporte: '',
    idprioridad: '',
    idestado: '',
    adjunto: null,
};

const initialReplyForm = {
    mensaje: '',
    es_interno: false,
};

const initialPagination = {
    current_page: 1,
    last_page: 1,
    per_page: 10,
    total: 0,
    from: 0,
    to: 0,
};

const MAX_NOMBRES_LENGTH = 150;
const MAX_EMAIL_LENGTH = 150;
const MAX_TELEFONO_LENGTH = 20;
const MAX_DEPENDENCIA_LENGTH = 150;
const MAX_ASUNTO_LENGTH = 200;
const MAX_SEARCH_LENGTH = 120;
const MAX_FILE_SIZE = 10 * 1024 * 1024;

const FILE_MIMES = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

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
            per_page: Number(data?.per_page) || 10,
            total: Number(data?.total) || 0,
            from: Number(data?.from) || 0,
            to: Number(data?.to) || 0,
        },
    };
};

const normalizarCatalogo = (response) => {
    const data = response?.data;

    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.data)) return data.data;

    return [];
};

const isValidEmail = (value) => {
    if (!value) return false;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
};

const normalizeDateInput = (value) => {
    if (!value) return '';

    const text = String(value);

    if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;
    if (text.includes('T')) return text.split('T')[0];

    return '';
};

const getStorageUrl = (path) => {
    if (!path) return '#';

    const value = String(path);

    if (value.startsWith('http://') || value.startsWith('https://')) {
        return value;
    }

    return `${BACKEND_URL}/storage/${value}`;
};

const getArchivo = (solicitud) => {
    return solicitud?.archivo || solicitud?.adjunto || null;
};

const getAdjuntoUrl = (solicitud) => {
    const archivo = getArchivo(solicitud);

    if (archivo?.ruta) return getStorageUrl(archivo.ruta);
    if (solicitud?.adjunto_url) return getStorageUrl(solicitud.adjunto_url);
    if (solicitud?.ruta) return getStorageUrl(solicitud.ruta);

    return '#';
};

const getAdjuntoNombre = (solicitud) => {
    const archivo = getArchivo(solicitud);

    return archivo?.nombre_original || archivo?.nombre_guardado || 'Adjunto';
};

const getTipoSoporteNombre = (solicitud) => {
    return (
        solicitud?.tipo_soporte?.nombre ||
        solicitud?.tipoSoporte?.nombre ||
        solicitud?.tipo?.nombre ||
        'Sin tipo'
    );
};

const getPrioridadNombre = (solicitud) => {
    return solicitud?.prioridad?.nombre || 'Sin prioridad';
};

const getEstadoNombre = (solicitud) => {
    return solicitud?.estado?.nombre || 'Sin estado';
};

const getUsuarioAtendio = (solicitud) => {
    return (
        solicitud?.usuario_atendio?.nombre_completo ||
        solicitud?.usuarioAtendio?.nombre_completo ||
        solicitud?.atendido_por?.nombre_completo ||
        solicitud?.usuario_atendio?.email ||
        solicitud?.usuarioAtendio?.email ||
        '-'
    );
};

const getRespuestas = (solicitud) => {
    if (Array.isArray(solicitud?.respuestas)) return solicitud.respuestas;
    if (Array.isArray(solicitud?.solicitudes_respuestas)) return solicitud.solicitudes_respuestas;
    if (Array.isArray(solicitud?.respuestas_soporte)) return solicitud.respuestas_soporte;

    return [];
};

export default function Soporte() {
    const [solicitudes, setSolicitudes] = useState([]);
    const [tiposSoporte, setTiposSoporte] = useState([]);
    const [prioridades, setPrioridades] = useState([]);
    const [estados, setEstados] = useState([]);
    const [pagination, setPagination] = useState(initialPagination);

    const [form, setForm] = useState(initialForm);
    const [replyForm, setReplyForm] = useState(initialReplyForm);
    const [editingId, setEditingId] = useState(null);
    const [selectedSolicitud, setSelectedSolicitud] = useState(null);

    const [showForm, setShowForm] = useState(false);
    const [showDetail, setShowDetail] = useState(false);

    const [loading, setLoading] = useState(true);
    const [loadingCatalogs, setLoadingCatalogs] = useState(false);
    const [saving, setSaving] = useState(false);
    const [replying, setReplying] = useState(false);
    const [loadingDetail, setLoadingDetail] = useState(false);

    const [search, setSearch] = useState('');
    const [tipoFiltro, setTipoFiltro] = useState('');
    const [prioridadFiltro, setPrioridadFiltro] = useState('');
    const [estadoFiltro, setEstadoFiltro] = useState('');
    const [fechaInicioFiltro, setFechaInicioFiltro] = useState('');
    const [fechaFinFiltro, setFechaFinFiltro] = useState('');

    const isEditing = useMemo(() => Boolean(editingId), [editingId]);

    const cargarCatalogos = async () => {
        setLoadingCatalogs(true);

        try {
            const [tiposResponse, prioridadesResponse, estadosResponse] = await Promise.all([
                listarTiposSoporte({ activo: 1 }),
                listarPrioridades(),
                listarEstados(),
            ]);

            setTiposSoporte(normalizarCatalogo(tiposResponse));
            setPrioridades(normalizarCatalogo(prioridadesResponse));
            setEstados(normalizarCatalogo(estadosResponse));
        } catch (err) {
            notifyError(
                getApiErrorMessage(err, 'No se pudieron cargar los catálogos de soporte.')
            );
        } finally {
            setLoadingCatalogs(false);
        }
    };

    const cargarDatos = async (page = 1) => {
        setLoading(true);

        try {
            const params = {
                page,
                buscar: search.trim() || undefined,
                idtiposoporte: tipoFiltro || undefined,
                idprioridad: prioridadFiltro || undefined,
                idestado: estadoFiltro || undefined,
                fecha_inicio: fechaInicioFiltro || undefined,
                fecha_fin: fechaFinFiltro || undefined,
            };

            Object.keys(params).forEach((key) => {
                if (params[key] === undefined || params[key] === '') {
                    delete params[key];
                }
            });

            const response = await listarSolicitudesSoporte(params);
            const { items, pagination: meta } = normalizarRespuestaPaginada(response);

            setSolicitudes(items);
            setPagination(meta);
        } catch (err) {
            notifyError(
                getApiErrorMessage(err, 'No se pudieron cargar las solicitudes de soporte.')
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        cargarCatalogos();
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

        setForm({
            ...form,
            [name]: type === 'checkbox' ? checked : value,
        });
    };

    const handleReplyChange = (e) => {
        const { name, value, type, checked } = e.target;

        setReplyForm({
            ...replyForm,
            [name]: type === 'checkbox' ? checked : value,
        });
    };

    const handleSearchChange = (e) => {
        const value = e.target.value;

        if (value.length > MAX_SEARCH_LENGTH) return;

        setSearch(value);
    };

    const validarFormulario = () => {
        const nombres = form.nombres.trim();
        const email = form.email.trim();
        const telefono = form.telefono.trim();
        const dependencia = form.dependencia.trim();
        const asunto = form.asunto.trim();
        const descripcion = form.descripcion.trim();

        if (!nombres) {
            notifyError('El nombre del solicitante es obligatorio.');
            return false;
        }

        if (nombres.length > MAX_NOMBRES_LENGTH) {
            notifyError(`El nombre no debe superar los ${MAX_NOMBRES_LENGTH} caracteres.`);
            return false;
        }

        if (!email) {
            notifyError('El correo del solicitante es obligatorio.');
            return false;
        }

        if (email.length > MAX_EMAIL_LENGTH || !isValidEmail(email)) {
            notifyError('El correo no tiene un formato válido.');
            return false;
        }

        if (telefono.length > MAX_TELEFONO_LENGTH) {
            notifyError(`El teléfono no debe superar los ${MAX_TELEFONO_LENGTH} caracteres.`);
            return false;
        }

        if (dependencia.length > MAX_DEPENDENCIA_LENGTH) {
            notifyError(`La dependencia no debe superar los ${MAX_DEPENDENCIA_LENGTH} caracteres.`);
            return false;
        }

        if (!asunto) {
            notifyError('El asunto es obligatorio.');
            return false;
        }

        if (asunto.length > MAX_ASUNTO_LENGTH) {
            notifyError(`El asunto no debe superar los ${MAX_ASUNTO_LENGTH} caracteres.`);
            return false;
        }

        if (!descripcion) {
            notifyError('La descripción de la solicitud es obligatoria.');
            return false;
        }

        if (!form.idtiposoporte) {
            notifyError('Debe seleccionar un tipo de soporte.');
            return false;
        }

        if (!form.idprioridad) {
            notifyError('Debe seleccionar una prioridad.');
            return false;
        }

        if (!form.idestado) {
            notifyError('Debe seleccionar un estado.');
            return false;
        }

        if (!form.consentimiento_privacidad) {
            notifyError('Debe aceptar el consentimiento de privacidad.');
            return false;
        }

        if (form.adjunto) {
            if (!FILE_MIMES.includes(form.adjunto.type)) {
                notifyError('El adjunto debe ser imagen, PDF o Word.');
                return false;
            }

            if (form.adjunto.size > MAX_FILE_SIZE) {
                notifyError('El adjunto no debe superar los 10 MB.');
                return false;
            }
        }

        return true;
    };

    const buildFormData = () => {
        const data = new FormData();

        data.append('nombres', form.nombres.trim());
        data.append('email', form.email.trim());
        data.append('telefono', form.telefono.trim());
        data.append('dependencia', form.dependencia.trim());
        data.append('asunto', form.asunto.trim());
        data.append('descripcion', form.descripcion.trim());
        data.append('consentimiento_privacidad', form.consentimiento_privacidad ? '1' : '0');
        data.append('idtiposoporte', form.idtiposoporte);
        data.append('idprioridad', form.idprioridad);
        data.append('idestado', form.idestado);

        if (form.adjunto) {
            data.append('adjunto', form.adjunto);
        }

        return data;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validarFormulario()) return;

        setSaving(true);

        const toastId = notifyLoading(
            isEditing ? 'Actualizando solicitud...' : 'Registrando solicitud...'
        );

        try {
            const payload = buildFormData();

            if (isEditing) {
                await actualizarSolicitudSoporte(editingId, payload);
                notifySuccess('Solicitud de soporte actualizada correctamente.');
            } else {
                await crearSolicitudSoporte(payload);
                notifySuccess('Solicitud de soporte registrada correctamente.');
            }

            cerrarFormulario();
            await cargarDatos(pagination.current_page);

            if (selectedSolicitud?.idsolicitud === editingId) {
                await recargarDetalle(editingId);
            }
        } catch (err) {
            notifyError(
                getApiErrorMessage(err, 'No se pudo guardar la solicitud de soporte.')
            );
        } finally {
            closeNotify(toastId);
            setSaving(false);
        }
    };

    const handleEdit = (solicitud) => {
        setEditingId(solicitud.idsolicitud);
        setShowForm(true);

        setForm({
            nombres: solicitud.nombres || '',
            email: solicitud.email || '',
            telefono: solicitud.telefono || '',
            dependencia: solicitud.dependencia || '',
            asunto: solicitud.asunto || '',
            descripcion: solicitud.descripcion || '',
            consentimiento_privacidad: Boolean(Number(solicitud.consentimiento_privacidad)),
            idtiposoporte: solicitud.idtiposoporte ? String(solicitud.idtiposoporte) : '',
            idprioridad: solicitud.idprioridad ? String(solicitud.idprioridad) : '',
            idestado: solicitud.idestado ? String(solicitud.idestado) : '',
            adjunto: null,
        });

        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = async (solicitud) => {
        if (!solicitud.idsolicitud) {
            notifyError('No se encontró el identificador de la solicitud.');
            return;
        }

        const ok = confirm(
            `¿Eliminar la solicitud "${solicitud.asunto}"?\n\nSi tiene respuestas asociadas, el backend puede bloquear la eliminación.`
        );

        if (!ok) return;

        const toastId = notifyLoading('Eliminando solicitud...');

        try {
            await eliminarSolicitudSoporte(solicitud.idsolicitud);

            notifySuccess('Solicitud eliminada correctamente.');

            const nextPage =
                solicitudes.length === 1 && pagination.current_page > 1
                    ? pagination.current_page - 1
                    : pagination.current_page;

            await cargarDatos(nextPage);
        } catch (err) {
            notifyError(
                getApiErrorMessage(err, 'No se pudo eliminar la solicitud.')
            );
        } finally {
            closeNotify(toastId);
        }
    };

    const recargarDetalle = async (id) => {
        const response = await obtenerSolicitudSoporte(id);
        setSelectedSolicitud(response?.data || null);
    };

    const handleViewDetail = async (solicitud) => {
        setShowDetail(true);
        setLoadingDetail(true);
        setSelectedSolicitud(null);
        setReplyForm(initialReplyForm);

        try {
            const response = await obtenerSolicitudSoporte(solicitud.idsolicitud);
            setSelectedSolicitud(response?.data || solicitud);
        } catch (err) {
            notifyError(
                getApiErrorMessage(err, 'No se pudo obtener el detalle de la solicitud.')
            );
            setShowDetail(false);
        } finally {
            setLoadingDetail(false);
        }
    };

    const cerrarDetalle = () => {
        setShowDetail(false);
        setSelectedSolicitud(null);
        setReplyForm(initialReplyForm);
    };

    const handleResponder = async (e) => {
        e.preventDefault();

        if (!selectedSolicitud?.idsolicitud) {
            notifyError('No se encontró la solicitud seleccionada.');
            return;
        }

        const mensaje = replyForm.mensaje.trim();

        if (!mensaje) {
            notifyError('Debe escribir una respuesta.');
            return;
        }

        setReplying(true);

        const toastId = notifyLoading('Registrando respuesta...');

        try {
            await responderSolicitudSoporte(selectedSolicitud.idsolicitud, {
                mensaje,
                es_interno: replyForm.es_interno ? 1 : 0,
            });

            notifySuccess('Respuesta registrada correctamente.');
            setReplyForm(initialReplyForm);

            await recargarDetalle(selectedSolicitud.idsolicitud);
            await cargarDatos(pagination.current_page);
        } catch (err) {
            notifyError(
                getApiErrorMessage(err, 'No se pudo registrar la respuesta.')
            );
        } finally {
            closeNotify(toastId);
            setReplying(false);
        }
    };

    const handleDeleteRespuesta = async (respuesta) => {
        const idRespuesta =
            respuesta.idsolicitud_respuesta ||
            respuesta.idrespuesta ||
            respuesta.id;

        if (!idRespuesta) {
            notifyError('No se encontró el identificador de la respuesta.');
            return;
        }

        const ok = confirm('¿Eliminar esta respuesta?');

        if (!ok) return;

        const toastId = notifyLoading('Eliminando respuesta...');

        try {
            await eliminarRespuestaSoporte(idRespuesta);

            notifySuccess('Respuesta eliminada correctamente.');

            if (selectedSolicitud?.idsolicitud) {
                await recargarDetalle(selectedSolicitud.idsolicitud);
            }
        } catch (err) {
            notifyError(
                getApiErrorMessage(err, 'No se pudo eliminar la respuesta.')
            );
        } finally {
            closeNotify(toastId);
        }
    };

    const handleBuscar = async (e) => {
        e.preventDefault();

        if (search.trim().length > MAX_SEARCH_LENGTH) {
            notifyError(`La búsqueda no debe superar los ${MAX_SEARCH_LENGTH} caracteres.`);
            return;
        }

        if (
            fechaInicioFiltro &&
            fechaFinFiltro &&
            new Date(`${fechaInicioFiltro}T00:00:00`) > new Date(`${fechaFinFiltro}T00:00:00`)
        ) {
            notifyError('La fecha de inicio no puede ser mayor que la fecha fin.');
            return;
        }

        await cargarDatos(1);
    };

    const handleLimpiarFiltros = async () => {
        setSearch('');
        setTipoFiltro('');
        setPrioridadFiltro('');
        setEstadoFiltro('');
        setFechaInicioFiltro('');
        setFechaFinFiltro('');

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
        <section className="soporte-page">
            <div className="soporte-header">
                <div>
                    <span className="soporte-eyebrow">Mesa de ayuda</span>
                    <h1>Solicitudes de soporte</h1>
                    <p>
                        Administra tickets, incidencias y consultas técnicas recibidas por la DSTI.
                    </p>
                </div>

                {!showForm && (
                    <button
                        type="button"
                        className="soporte-add-button"
                        onClick={abrirFormularioCrear}
                        disabled={loading || loadingCatalogs}
                    >
                        <Plus size={18} />
                        Agregar solicitud
                    </button>
                )}
            </div>

            {showForm && (
                <div className="soporte-form-card">
                    <div className="soporte-form-header">
                        <div>
                            <h2>{isEditing ? 'Editar solicitud' : 'Agregar solicitud'}</h2>
                            <p>
                                Registra los datos del solicitante, clasifica el ticket y adjunta evidencia si corresponde.
                            </p>
                        </div>

                        <button
                            type="button"
                            className="soporte-close-button"
                            onClick={cerrarFormulario}
                            disabled={saving}
                        >
                            <X size={18} />
                        </button>
                    </div>

                    <form className="soporte-form" onSubmit={handleSubmit}>
                        <div className="soporte-form-grid">
                            <div className="soporte-field">
                                <label>Nombres</label>
                                <input
                                    name="nombres"
                                    value={form.nombres}
                                    onChange={handleChange}
                                    maxLength={MAX_NOMBRES_LENGTH}
                                    placeholder="Nombre completo del solicitante"
                                    required
                                    disabled={saving}
                                />
                            </div>

                            <div className="soporte-field">
                                <label>Correo</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={form.email}
                                    onChange={handleChange}
                                    maxLength={MAX_EMAIL_LENGTH}
                                    placeholder="correo@unasam.edu.pe"
                                    required
                                    disabled={saving}
                                />
                            </div>

                            <div className="soporte-field">
                                <label>Teléfono</label>
                                <input
                                    name="telefono"
                                    value={form.telefono}
                                    onChange={handleChange}
                                    maxLength={MAX_TELEFONO_LENGTH}
                                    placeholder="Opcional"
                                    disabled={saving}
                                />
                            </div>

                            <div className="soporte-field">
                                <label>Dependencia</label>
                                <input
                                    name="dependencia"
                                    value={form.dependencia}
                                    onChange={handleChange}
                                    maxLength={MAX_DEPENDENCIA_LENGTH}
                                    placeholder="Facultad, oficina, área..."
                                    disabled={saving}
                                />
                            </div>

                            <div className="soporte-field span-2">
                                <label>Asunto</label>
                                <input
                                    name="asunto"
                                    value={form.asunto}
                                    onChange={handleChange}
                                    maxLength={MAX_ASUNTO_LENGTH}
                                    placeholder="Ej. Problema de acceso al sistema académico"
                                    required
                                    disabled={saving}
                                />
                            </div>

                            <div className="soporte-field">
                                <label>Tipo de soporte</label>
                                <select
                                    name="idtiposoporte"
                                    value={form.idtiposoporte}
                                    onChange={handleChange}
                                    required
                                    disabled={saving || loadingCatalogs}
                                >
                                    <option value="">Seleccione un tipo</option>
                                    {tiposSoporte.map((tipo) => (
                                        <option key={tipo.idtiposoporte} value={tipo.idtiposoporte}>
                                            {tipo.nombre}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="soporte-field">
                                <label>Prioridad</label>
                                <select
                                    name="idprioridad"
                                    value={form.idprioridad}
                                    onChange={handleChange}
                                    required
                                    disabled={saving || loadingCatalogs}
                                >
                                    <option value="">Seleccione una prioridad</option>
                                    {prioridades.map((prioridad) => (
                                        <option key={prioridad.idprioridad} value={prioridad.idprioridad}>
                                            {prioridad.nombre}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="soporte-field">
                                <label>Estado</label>
                                <select
                                    name="idestado"
                                    value={form.idestado}
                                    onChange={handleChange}
                                    required
                                    disabled={saving || loadingCatalogs}
                                >
                                    <option value="">Seleccione un estado</option>
                                    {estados.map((estado) => (
                                        <option key={estado.idestado} value={estado.idestado}>
                                            {estado.nombre}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="soporte-field">
                                <label>Adjunto</label>
                                <input
                                    type="file"
                                    name="adjunto"
                                    accept=".jpg,.jpeg,.png,.webp,.pdf,.doc,.docx,image/jpeg,image/png,image/webp,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                                    onChange={handleChange}
                                    disabled={saving}
                                />
                                <small>Imagen, PDF o Word. Máximo 10 MB.</small>
                            </div>

                            <div className="soporte-field span-2">
                                <label>Descripción</label>
                                <textarea
                                    name="descripcion"
                                    value={form.descripcion}
                                    onChange={handleChange}
                                    rows={6}
                                    placeholder="Describe el problema, consulta o requerimiento."
                                    required
                                    disabled={saving}
                                />
                            </div>

                            <label className="soporte-checkbox span-2">
                                <input
                                    type="checkbox"
                                    name="consentimiento_privacidad"
                                    checked={form.consentimiento_privacidad}
                                    onChange={handleChange}
                                    disabled={saving}
                                />
                                El solicitante acepta el tratamiento de sus datos para la atención del soporte.
                            </label>
                        </div>

                        <div className="soporte-form-actions">
                            <button
                                type="submit"
                                className="soporte-save-button"
                                disabled={saving || loadingCatalogs}
                            >
                                <Save size={17} />
                                {saving
                                    ? 'Guardando...'
                                    : isEditing
                                        ? 'Actualizar solicitud'
                                        : 'Guardar solicitud'}
                            </button>

                            <button
                                type="button"
                                className="soporte-cancel-button"
                                onClick={cerrarFormulario}
                                disabled={saving}
                            >
                                Cancelar
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="soporte-list-card">
                <div className="soporte-list-header">
                    <div>
                        <h2>Tickets registrados</h2>
                        <p>
                            Mostrando {pagination.from || 0} - {pagination.to || 0} de{' '}
                            {pagination.total} solicitudes.
                        </p>
                    </div>

                    <form className="soporte-filters" onSubmit={handleBuscar}>
                        <div className="soporte-search">
                            <Search size={17} />
                            <input
                                value={search}
                                onChange={handleSearchChange}
                                placeholder="Buscar ticket..."
                                maxLength={MAX_SEARCH_LENGTH}
                            />
                        </div>

                        <select
                            value={tipoFiltro}
                            onChange={(e) => setTipoFiltro(e.target.value)}
                            className="soporte-filter-select"
                            disabled={loadingCatalogs}
                        >
                            <option value="">Todos los tipos</option>
                            {tiposSoporte.map((tipo) => (
                                <option key={tipo.idtiposoporte} value={tipo.idtiposoporte}>
                                    {tipo.nombre}
                                </option>
                            ))}
                        </select>

                        <select
                            value={prioridadFiltro}
                            onChange={(e) => setPrioridadFiltro(e.target.value)}
                            className="soporte-filter-select"
                            disabled={loadingCatalogs}
                        >
                            <option value="">Todas las prioridades</option>
                            {prioridades.map((prioridad) => (
                                <option key={prioridad.idprioridad} value={prioridad.idprioridad}>
                                    {prioridad.nombre}
                                </option>
                            ))}
                        </select>

                        <select
                            value={estadoFiltro}
                            onChange={(e) => setEstadoFiltro(e.target.value)}
                            className="soporte-filter-select"
                            disabled={loadingCatalogs}
                        >
                            <option value="">Todos los estados</option>
                            {estados.map((estado) => (
                                <option key={estado.idestado} value={estado.idestado}>
                                    {estado.nombre}
                                </option>
                            ))}
                        </select>

                        <input
                            type="date"
                            value={fechaInicioFiltro}
                            onChange={(e) => setFechaInicioFiltro(normalizeDateInput(e.target.value))}
                            className="soporte-date-filter"
                            max={fechaFinFiltro || undefined}
                        />

                        <input
                            type="date"
                            value={fechaFinFiltro}
                            onChange={(e) => setFechaFinFiltro(normalizeDateInput(e.target.value))}
                            className="soporte-date-filter"
                            min={fechaInicioFiltro || undefined}
                        />

                        <button type="submit" className="soporte-filter-button">
                            Buscar
                        </button>

                        <button
                            type="button"
                            className="soporte-clear-button"
                            onClick={handleLimpiarFiltros}
                        >
                            Limpiar
                        </button>
                    </form>
                </div>

                {loading ? (
                    <p className="soporte-empty">Cargando solicitudes...</p>
                ) : solicitudes.length === 0 ? (
                    <div className="soporte-empty-box">
                        <h3>No hay solicitudes para mostrar</h3>
                        <p>Registra una solicitud o cambia los filtros de búsqueda.</p>
                    </div>
                ) : (
                    <div className="soporte-table-wrap">
                        <table className="soporte-table">
                            <thead>
                            <tr>
                                <th>Ticket</th>
                                <th>Solicitante</th>
                                <th>Tipo</th>
                                <th>Prioridad</th>
                                <th>Estado</th>
                                <th>Fecha</th>
                                <th>Adjunto</th>
                                <th>Acciones</th>
                            </tr>
                            </thead>

                            <tbody>
                            {solicitudes.map((solicitud) => (
                                <tr key={solicitud.idsolicitud}>
                                    <td>
                                        <div className="soporte-ticket">
                                                <span>
                                                    <LifeBuoy size={18} />
                                                </span>

                                            <div>
                                                <strong>{solicitud.asunto}</strong>
                                                <small>
                                                    {solicitud.codigo_ticket
                                                        ? `Ticket: ${solicitud.codigo_ticket}`
                                                        : `ID: #${solicitud.idsolicitud}`}
                                                </small>
                                            </div>
                                        </div>
                                    </td>

                                    <td>
                                        <div className="soporte-person">
                                            <strong>{solicitud.nombres}</strong>
                                            <span>{solicitud.email}</span>
                                        </div>
                                    </td>

                                    <td>
                                            <span className="soporte-tag">
                                                <Wrench size={14} />
                                                {getTipoSoporteNombre(solicitud)}
                                            </span>
                                    </td>

                                    <td>
                                            <span className="soporte-tag soporte-priority">
                                                <AlertTriangle size={14} />
                                                {getPrioridadNombre(solicitud)}
                                            </span>
                                    </td>

                                    <td>
                                            <span className="soporte-tag">
                                                <ShieldCheck size={14} />
                                                {getEstadoNombre(solicitud)}
                                            </span>
                                    </td>

                                    <td>{formatDateTimeSimple(solicitud.created_at)}</td>

                                    <td>
                                        {getAdjuntoUrl(solicitud) !== '#' ? (
                                            <a
                                                href={getAdjuntoUrl(solicitud)}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="soporte-file-link"
                                                title={getAdjuntoNombre(solicitud)}
                                            >
                                                <Paperclip size={15} />
                                                Ver
                                            </a>
                                        ) : (
                                            '-'
                                        )}
                                    </td>

                                    <td>
                                        <div className="soporte-actions">
                                            <button
                                                type="button"
                                                onClick={() => handleViewDetail(solicitud)}
                                                title="Ver detalle"
                                            >
                                                <Eye size={16} />
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => handleEdit(solicitud)}
                                                title="Editar"
                                            >
                                                <Pencil size={16} />
                                            </button>

                                            <button
                                                type="button"
                                                className="danger"
                                                onClick={() => handleDelete(solicitud)}
                                                title="Eliminar"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                )}

                <div className="soporte-pagination">
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
            </div>

            {showDetail && (
                <div className="soporte-modal-overlay" role="dialog" aria-modal="true">
                    <div className="soporte-modal">
                        <div className="soporte-modal-header">
                            <div>
                                <span className="soporte-eyebrow">Detalle del ticket</span>
                                <h2>
                                    {loadingDetail
                                        ? 'Cargando detalle...'
                                        : selectedSolicitud?.asunto || 'Detalle'}
                                </h2>
                            </div>

                            <button
                                type="button"
                                className="soporte-close-button"
                                onClick={cerrarDetalle}
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {loadingDetail ? (
                            <p className="soporte-empty">Cargando detalle...</p>
                        ) : selectedSolicitud ? (
                            <div className="soporte-detail">
                                <div className="soporte-detail-grid">
                                    <div>
                                        <span>Código</span>
                                        <strong>
                                            {selectedSolicitud.codigo_ticket ||
                                                `#${selectedSolicitud.idsolicitud}`}
                                        </strong>
                                    </div>

                                    <div>
                                        <span>Estado</span>
                                        <strong>{getEstadoNombre(selectedSolicitud)}</strong>
                                    </div>

                                    <div>
                                        <span>Tipo</span>
                                        <strong>{getTipoSoporteNombre(selectedSolicitud)}</strong>
                                    </div>

                                    <div>
                                        <span>Prioridad</span>
                                        <strong>{getPrioridadNombre(selectedSolicitud)}</strong>
                                    </div>

                                    <div>
                                        <span>Solicitante</span>
                                        <strong>{selectedSolicitud.nombres}</strong>
                                    </div>

                                    <div>
                                        <span>Correo</span>
                                        <strong>{selectedSolicitud.email}</strong>
                                    </div>

                                    <div>
                                        <span>Teléfono</span>
                                        <strong>{selectedSolicitud.telefono || '-'}</strong>
                                    </div>

                                    <div>
                                        <span>Dependencia</span>
                                        <strong>{selectedSolicitud.dependencia || '-'}</strong>
                                    </div>

                                    <div>
                                        <span>Atendido por</span>
                                        <strong>{getUsuarioAtendio(selectedSolicitud)}</strong>
                                    </div>

                                    <div>
                                        <span>Fecha</span>
                                        <strong>{formatDateTimeSimple(selectedSolicitud.created_at)}</strong>
                                    </div>

                                    <div>
                                        <span>IP origen</span>
                                        <strong>{selectedSolicitud.ip_origen || '-'}</strong>
                                    </div>

                                    <div>
                                        <span>Adjunto</span>
                                        {getAdjuntoUrl(selectedSolicitud) !== '#' ? (
                                            <a
                                                href={getAdjuntoUrl(selectedSolicitud)}
                                                target="_blank"
                                                rel="noreferrer"
                                            >
                                                Descargar adjunto
                                            </a>
                                        ) : (
                                            <strong>-</strong>
                                        )}
                                    </div>
                                </div>

                                <div className="soporte-detail-content">
                                    <h3>Descripción</h3>
                                    <p>{selectedSolicitud.descripcion}</p>
                                </div>

                                <div className="soporte-detail-actions">
                                    <button
                                        type="button"
                                        onClick={() => handleEdit(selectedSolicitud)}
                                    >
                                        <Pencil size={16} />
                                        Editar solicitud
                                    </button>

                                    {getAdjuntoUrl(selectedSolicitud) !== '#' && (
                                        <a
                                            href={getAdjuntoUrl(selectedSolicitud)}
                                            target="_blank"
                                            rel="noreferrer"
                                        >
                                            <Download size={16} />
                                            Ver adjunto
                                        </a>
                                    )}
                                </div>

                                <div className="soporte-replies">
                                    <div className="soporte-replies-header">
                                        <h3>Respuestas</h3>
                                        <span>{getRespuestas(selectedSolicitud).length}</span>
                                    </div>

                                    {getRespuestas(selectedSolicitud).length === 0 ? (
                                        <p className="soporte-empty">
                                            Aún no hay respuestas registradas.
                                        </p>
                                    ) : (
                                        getRespuestas(selectedSolicitud).map((respuesta) => {
                                            const idRespuesta =
                                                respuesta.idsolicitud_respuesta ||
                                                respuesta.idrespuesta ||
                                                respuesta.id;

                                            return (
                                                <div
                                                    key={idRespuesta}
                                                    className={
                                                        Boolean(Number(respuesta.es_interno))
                                                            ? 'soporte-reply interno'
                                                            : 'soporte-reply'
                                                    }
                                                >
                                                    <div className="soporte-reply-header">
                                                        <div>
                                                            <strong>
                                                                {respuesta.usuario?.nombre_completo ||
                                                                    respuesta.autor?.nombre_completo ||
                                                                    respuesta.usuario?.email ||
                                                                    'Usuario DSTI'}
                                                            </strong>
                                                            <small>
                                                                {Boolean(Number(respuesta.es_interno))
                                                                    ? 'Respuesta interna'
                                                                    : 'Respuesta visible'}
                                                                {' · '}
                                                                {formatDateTimeSimple(respuesta.created_at)}
                                                            </small>
                                                        </div>

                                                        <button
                                                            type="button"
                                                            className="danger"
                                                            onClick={() => handleDeleteRespuesta(respuesta)}
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>

                                                    <p>{respuesta.mensaje}</p>
                                                </div>
                                            );
                                        })
                                    )}

                                    <form className="soporte-reply-form" onSubmit={handleResponder}>
                                        <label>Registrar respuesta</label>
                                        <textarea
                                            name="mensaje"
                                            value={replyForm.mensaje}
                                            onChange={handleReplyChange}
                                            rows={5}
                                            placeholder="Escribe la respuesta o seguimiento del caso."
                                            disabled={replying}
                                        />

                                        <label className="soporte-checkbox">
                                            <input
                                                type="checkbox"
                                                name="es_interno"
                                                checked={replyForm.es_interno}
                                                onChange={handleReplyChange}
                                                disabled={replying}
                                            />
                                            Marcar como respuesta interna
                                        </label>

                                        <button
                                            type="submit"
                                            className="soporte-send-button"
                                            disabled={replying}
                                        >
                                            <Send size={16} />
                                            {replying ? 'Enviando...' : 'Registrar respuesta'}
                                        </button>
                                    </form>
                                </div>
                            </div>
                        ) : (
                            <p className="soporte-empty">No se pudo cargar el detalle.</p>
                        )}
                    </div>
                </div>
            )}
        </section>
    );
}

function formatDateTimeSimple(value) {
    if (!value) return '-';

    const date = new Date(String(value).replace(' ', 'T'));

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