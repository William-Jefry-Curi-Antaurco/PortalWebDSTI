import { useEffect, useMemo, useState } from 'react';
import {
    ServerCog, Plus, X, Pencil, Trash2, Save,
    Search, Power, PowerOff, Eye, ExternalLink,
    Lock, Unlock, ShieldCheck, Mail, Link2, Tags,
} from 'lucide-react';

import {
    actualizarServicio, crearServicio, eliminarServicio,
    listarServicios, obtenerServicio,
} from '../api/serviciosApi';

import { listarCategorias } from '../api/categoriasApi';
import { listarModulos } from '../api/modulosApi';
import { listarEtiquetas } from '../api/etiquetasApi';

import {
    closeNotify, getApiErrorMessage,
    notifyError, notifyLoading, notifySuccess,
} from '../utils/notify';

import ConPermiso from '../components/ConPermiso';

import '../styles/modules/servicios.css';

// ── Constantes ────────────────────────────────────────────────────────────────
const MAX_NOMBRE_LENGTH = 150;
const MAX_DESCRIPCION_CORTA_LENGTH = 200;
const MAX_ICONO_LENGTH = 100;
const MAX_URL_LENGTH = 255;
const MAX_SEARCH_LENGTH = 120;
const MAX_ORDEN = 255;
const MAX_CORREO_LENGTH = 150;
const MAX_TEXTO_ACCION_LENGTH = 100;
const MAX_SECCION_REL_LENGTH = 80;
const MAX_LABEL_SECCION_LENGTH = 100;

const initialForm = {
    nombre: '',
    descripcion_corta: '',
    descripcion_larga: '',
    icono: '',
    url_servicio: '',
    requiere_autenticacion: false,
    idcategoria: '',
    orden: 0,
    activo: true,

    // Campos extendidos
    correo_contacto: '',
    texto_accion: '',
    orientacion: '',
    casos_uso: '',
    consejo: '',
    seccion_relacionada: '',
    label_seccion: '',

    // Etiquetas
    etiquetas: [],
};

const initialPagination = {
    current_page: 1,
    last_page: 1,
    per_page: 10,
    total: 0,
    from: 0,
    to: 0,
};






// ── Helpers ───────────────────────────────────────────────────────────────────


const MODULO_SERVICIOS_SLUG = 'servicios-tecnologicos';

function normalize(text) {
    return String(text || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '')
        .trim();
}

function filtrarCategoriasServicios(categorias = []) {
    return categorias
        .filter((item) => Number(item?.activo ?? 1) === 1)
        .filter((item) => {
            const moduloSlug = normalize(
                item?.modulo?.slug ||
                item?.modulo_slug ||
                item?.slug_modulo ||
                ''
            );

            if (moduloSlug) {
                return moduloSlug === MODULO_SERVICIOS_SLUG;
            }

            const moduloNombre = normalize(
                item?.modulo?.nombre ||
                item?.nombre_modulo ||
                ''
            );

            if (moduloNombre) {
                return (
                    moduloNombre.includes('servicio') ||
                    moduloNombre.includes('tecnologico')
                );
            }

            const nombre = normalize(item?.nombre);
            const slug = normalize(item?.slug);

            return [
                'soporte',
                'correo',
                'redes',
                'conectividad',
                'seguridad',
                'infraestructura',
                'equipos',
                'tecnico',
                'tecnologico',
            ].some((key) => nombre.includes(key) || slug.includes(key));
        })
        .sort((a, b) => Number(a.orden || 0) - Number(b.orden || 0));
}


const normalizarLista = (response) => {
    if (Array.isArray(response)) return response;
    if (Array.isArray(response?.data?.data)) return response.data.data;
    if (Array.isArray(response?.data)) return response.data;
    return [];
};

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

const isValidUrl = (value) => {
    if (!value) return true;

    try {
        const url = new URL(value);
        return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
        return false;
    }
};

const isValidEmail = (value) => {
    if (!value) return true;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
};

// ── Componente principal ──────────────────────────────────────────────────────
export default function ServiciosTecnologicos() {
    const [servicios, setServicios] = useState([]);
    const [categorias, setCategorias] = useState([]);
    const [modulos, setModulos] = useState([]);
    const [etiquetas, setEtiquetas] = useState([]);
    const [pagination, setPagination] = useState(initialPagination);

    const [form, setForm] = useState(initialForm);
    const [editingId, setEditingId] = useState(null);
    const [selectedServicio, setSelectedServicio] = useState(null);

    const [showForm, setShowForm] = useState(false);
    const [showDetail, setShowDetail] = useState(false);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [loadingDetail, setLoadingDetail] = useState(false);

    const [search, setSearch] = useState('');
    const [categoriaFiltro, setCategoriaFiltro] = useState('');
    const [activoFiltro, setActivoFiltro] = useState('');

    const isEditing = useMemo(() => Boolean(editingId), [editingId]);

    const etiquetasSeleccionadas = useMemo(() => {
        return Array.isArray(form.etiquetas)
            ? form.etiquetas.map(Number)
            : [];
    }, [form.etiquetas]);

    const etiquetasActivasSeleccionadas = useMemo(() => {
        return etiquetas.filter((etiqueta) =>
            etiquetasSeleccionadas.includes(Number(etiqueta.idetiqueta))
        );
    }, [etiquetas, etiquetasSeleccionadas]);

    const resumen = useMemo(() => {
        const activos = servicios.filter((s) => Boolean(Number(s.activo))).length;
        const autenticados = servicios.filter((s) =>
            Boolean(Number(s.requiere_autenticacion))
        ).length;

        return {
            totalPagina: servicios.length,
            activos,
            inactivos: servicios.length - activos,
            autenticados,
        };
    }, [servicios]);

    const categoriaExiste = (id) => {
        return categorias.some(
            (categoria) => Number(categoria.idcategoria) === Number(id)
        );
    };

    // ── Carga de datos ────────────────────────────────────────────────────────
    const cargarDatos = async (page = 1) => {
        setLoading(true);

        try {
            const params = { page };

            if (search.trim()) params.buscar = search.trim();
            if (activoFiltro) params.activo = activoFiltro;
            if (categoriaFiltro) params.idcategoria = categoriaFiltro;

            const [
                serviciosData,
                categoriasData,
                modulosData,
                etiquetasData,
            ] = await Promise.all([
                listarServicios(params),
                listarCategorias(),
                listarModulos(),
                listarEtiquetas(),
            ]);

            const { items, pagination: meta } =
                normalizarRespuestaPaginada(serviciosData);



            const categoriasNormalizadas = normalizarLista(categoriasData);
            setServicios(items);
            setPagination(meta);


            setCategorias(filtrarCategoriasServicios(categoriasNormalizadas));

            setModulos(normalizarLista(modulosData).filter((m) => m.activo));

            setEtiquetas(
                normalizarLista(etiquetasData).filter(
                    (item) => Number(item?.activo ?? 1) === 1
                )
            );
        } catch (err) {
            notifyError(
                getApiErrorMessage(
                    err,
                    'No se pudieron cargar los servicios tecnológicos.'
                )
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        cargarDatos(1);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ── Formulario ────────────────────────────────────────────────────────────
    const resetForm = () => {
        setForm({
            ...initialForm,
            etiquetas: [],
        });
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
        const { name, value, type, checked } = e.target;

        if (name === 'orden') {
            if (value !== '' && !/^\d+$/.test(value)) return;
            if (value !== '' && Number(value) > MAX_ORDEN) return;
        }

        setForm((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
    };

    const handleToggleEtiqueta = (idetiqueta) => {
        const id = Number(idetiqueta);

        setForm((prev) => {
            const actuales = Array.isArray(prev.etiquetas)
                ? prev.etiquetas.map(Number)
                : [];

            const existe = actuales.includes(id);

            return {
                ...prev,
                etiquetas: existe
                    ? actuales.filter((item) => item !== id)
                    : [...actuales, id],
            };
        });
    };

    const limpiarEtiquetasSeleccionadas = () => {
        setForm((prev) => ({
            ...prev,
            etiquetas: [],
        }));
    };

    const validarFormulario = () => {
        const nombre = form.nombre.trim();
        const descripcionCorta = form.descripcion_corta.trim();
        const urlServicio = form.url_servicio.trim();
        const correo = form.correo_contacto.trim();
        const orden = Number(form.orden);

        if (!nombre) {
            notifyError('El nombre del servicio es obligatorio.');
            return false;
        }

        if (nombre.length < 3) {
            notifyError('El nombre debe tener al menos 3 caracteres.');
            return false;
        }

        if (nombre.length > MAX_NOMBRE_LENGTH) {
            notifyError(`El nombre no debe superar ${MAX_NOMBRE_LENGTH} caracteres.`);
            return false;
        }

        if (!descripcionCorta) {
            notifyError('La descripción corta es obligatoria.');
            return false;
        }

        if (descripcionCorta.length < 10) {
            notifyError('La descripción corta debe tener al menos 10 caracteres.');
            return false;
        }

        if (descripcionCorta.length > MAX_DESCRIPCION_CORTA_LENGTH) {
            notifyError(
                `La descripción corta no debe superar ${MAX_DESCRIPCION_CORTA_LENGTH} caracteres.`
            );
            return false;
        }

        if (!isValidUrl(urlServicio)) {
            notifyError('La URL del servicio no tiene un formato válido.');
            return false;
        }

        if (!form.idcategoria) {
            notifyError('Seleccione una categoría para el servicio.');
            return false;
        }

        if (!categoriaExiste(form.idcategoria)) {
            notifyError('Seleccione una categoría válida para servicios tecnológicos.');
            return false;
        }

        if (Number.isNaN(orden) || orden < 0 || orden > MAX_ORDEN) {
            notifyError('El orden debe estar entre 0 y 255.');
            return false;
        }

        if (!isValidEmail(correo)) {
            notifyError('El correo de contacto no tiene un formato válido.');
            return false;
        }

        if (form.icono.length > MAX_ICONO_LENGTH) {
            notifyError(`El icono no debe superar ${MAX_ICONO_LENGTH} caracteres.`);
            return false;
        }

        if (form.url_servicio.length > MAX_URL_LENGTH) {
            notifyError(`La URL no debe superar ${MAX_URL_LENGTH} caracteres.`);
            return false;
        }

        if (form.correo_contacto.length > MAX_CORREO_LENGTH) {
            notifyError(`El correo no debe superar ${MAX_CORREO_LENGTH} caracteres.`);
            return false;
        }

        if (form.texto_accion.length > MAX_TEXTO_ACCION_LENGTH) {
            notifyError(`El texto de acción no debe superar ${MAX_TEXTO_ACCION_LENGTH} caracteres.`);
            return false;
        }

        if (form.seccion_relacionada.length > MAX_SECCION_REL_LENGTH) {
            notifyError(`La sección relacionada no debe superar ${MAX_SECCION_REL_LENGTH} caracteres.`);
            return false;
        }

        if (form.label_seccion.length > MAX_LABEL_SECCION_LENGTH) {
            notifyError(`La etiqueta de sección no debe superar ${MAX_LABEL_SECCION_LENGTH} caracteres.`);
            return false;
        }

        return true;
    };

    const getEtiquetasIds = (items = []) => {
        if (!Array.isArray(items)) return [];

        return items
            .map((item) =>
                typeof item === 'object'
                    ? Number(item.idetiqueta)
                    : Number(item)
            )
            .filter((id) => Number.isFinite(id));
    };

    const buildPayload = () => ({
        nombre: form.nombre.trim(),
        descripcion_corta: form.descripcion_corta.trim(),
        descripcion_larga: form.descripcion_larga.trim() || null,
        icono: form.icono.trim() || null,
        url_servicio: form.url_servicio.trim() || null,
        requiere_autenticacion: form.requiere_autenticacion ? 1 : 0,
        idcategoria: Number(form.idcategoria),
        orden: Number(form.orden || 0),
        activo: form.activo ? 1 : 0,

        // Extendidos
        correo_contacto: form.correo_contacto.trim() || null,
        texto_accion: form.texto_accion.trim() || null,
        orientacion: form.orientacion.trim() || null,
        casos_uso: form.casos_uso.trim() || null,
        consejo: form.consejo.trim() || null,
        seccion_relacionada: form.seccion_relacionada.trim() || null,
        label_seccion: form.label_seccion.trim() || null,

        // Etiquetas
        etiquetas: getEtiquetasIds(form.etiquetas),
    });

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validarFormulario()) return;

        setSaving(true);

        const toastId = notifyLoading(
            isEditing ? 'Actualizando servicio...' : 'Registrando servicio...'
        );

        try {
            if (isEditing) {
                await actualizarServicio(editingId, buildPayload());
                notifySuccess('Servicio actualizado correctamente.');
            } else {
                await crearServicio(buildPayload());
                notifySuccess('Servicio registrado correctamente.');
            }

            cerrarFormulario();
            await cargarDatos(pagination.current_page);
        } catch (err) {
            notifyError(
                getApiErrorMessage(err, 'No se pudo guardar el servicio.')
            );
        } finally {
            closeNotify(toastId);
            setSaving(false);
        }
    };

    const handleEdit = (servicio) => {
        setEditingId(servicio.idservicio);
        setShowForm(true);

        setForm({
            nombre: servicio.nombre || '',
            descripcion_corta: servicio.descripcion_corta || '',
            descripcion_larga: servicio.descripcion_larga || '',
            icono: servicio.icono || '',
            url_servicio: servicio.url_servicio || '',
            requiere_autenticacion: Boolean(Number(servicio.requiere_autenticacion)),
            idcategoria: servicio.idcategoria || '',
            orden: servicio.orden ?? 0,
            activo: Boolean(Number(servicio.activo)),

            // Extendidos
            correo_contacto: servicio.correo_contacto || '',
            texto_accion: servicio.texto_accion || '',
            orientacion: servicio.orientacion || '',
            casos_uso: servicio.casos_uso || '',
            consejo: servicio.consejo || '',
            seccion_relacionada: servicio.seccion_relacionada || '',
            label_seccion: servicio.label_seccion || '',

            // Etiquetas
            etiquetas: Array.isArray(servicio.etiquetas)
                ? servicio.etiquetas.map((item) => Number(item.idetiqueta))
                : [],
        });

        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = async (servicio) => {
        if (!confirm(`¿Eliminar "${servicio.nombre}"?\n\nEsta acción no se puede deshacer.`)) return;

        const toastId = notifyLoading('Eliminando servicio...');

        try {
            await eliminarServicio(servicio.idservicio);
            notifySuccess('Servicio eliminado correctamente.');

            const nextPage =
                servicios.length === 1 && pagination.current_page > 1
                    ? pagination.current_page - 1
                    : pagination.current_page;

            await cargarDatos(nextPage);
        } catch (err) {
            notifyError(getApiErrorMessage(err, 'No se pudo eliminar el servicio.'));
        } finally {
            closeNotify(toastId);
        }
    };

    const handleToggleActivo = async (servicio) => {
        const nuevoEstado = !Boolean(Number(servicio.activo));

        const toastId = notifyLoading(
            nuevoEstado ? 'Activando...' : 'Desactivando...'
        );

        try {
            await actualizarServicio(servicio.idservicio, {
                nombre: servicio.nombre,
                descripcion_corta: servicio.descripcion_corta,
                descripcion_larga: servicio.descripcion_larga || null,
                icono: servicio.icono || null,
                url_servicio: servicio.url_servicio || null,
                requiere_autenticacion: Boolean(Number(servicio.requiere_autenticacion)) ? 1 : 0,
                idcategoria: Number(servicio.idcategoria),
                orden: Number(servicio.orden || 0),
                activo: nuevoEstado ? 1 : 0,

                correo_contacto: servicio.correo_contacto || null,
                texto_accion: servicio.texto_accion || null,
                orientacion: servicio.orientacion || null,
                casos_uso: servicio.casos_uso || null,
                consejo: servicio.consejo || null,
                seccion_relacionada: servicio.seccion_relacionada || null,
                label_seccion: servicio.label_seccion || null,

                etiquetas: getEtiquetasIds(servicio.etiquetas),
            });

            notifySuccess(
                nuevoEstado ? 'Servicio activado.' : 'Servicio desactivado.'
            );

            await cargarDatos(pagination.current_page);
        } catch (err) {
            notifyError(getApiErrorMessage(err, 'No se pudo cambiar el estado.'));
        } finally {
            closeNotify(toastId);
        }
    };

    const handleViewDetail = async (servicio) => {
        setShowDetail(true);
        setLoadingDetail(true);
        setSelectedServicio(null);

        try {
            const response = await obtenerServicio(servicio.idservicio);
            setSelectedServicio(response?.data || servicio);
        } catch (err) {
            notifyError(getApiErrorMessage(err, 'No se pudo obtener el detalle.'));
            setShowDetail(false);
        } finally {
            setLoadingDetail(false);
        }
    };

    const cerrarDetalle = () => {
        setShowDetail(false);
        setSelectedServicio(null);
    };

    const handleBuscar = async (e) => {
        e.preventDefault();

        if (search.trim().length > MAX_SEARCH_LENGTH) {
            notifyError(`La búsqueda no debe superar los ${MAX_SEARCH_LENGTH} caracteres.`);
            return;
        }

        await cargarDatos(1);
    };

    const handleLimpiarFiltros = () => {
        setSearch('');
        setCategoriaFiltro('');
        setActivoFiltro('');

        setTimeout(() => cargarDatos(1), 0);
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
        const pages = [];
        const start = Math.max(1, pagination.current_page - 2);
        const end = Math.min(pagination.last_page, pagination.current_page + 2);

        for (let p = start; p <= end; p += 1) {
            pages.push(p);
        }

        return pages;
    }, [pagination]);

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <section className="servicios-page">
            {/* Header */}
            <div className="servicios-header">
                <div>
                    <span className="servicios-eyebrow">Catálogo institucional</span>
                    <h1>Servicios tecnológicos</h1>
                    <p>
                        Administra el catálogo de servicios de la DSTI — categoría, acceso,
                        URL, correo de contacto, etiquetas y estado.
                    </p>
                </div>

                {!showForm && (
                    <ConPermiso permiso="servicios.crear">
                        <button
                            type="button"
                            className="servicios-add-button"
                            onClick={abrirFormularioCrear}
                            disabled={loading}
                        >
                            <Plus size={18} />
                            Agregar servicio
                        </button>
                    </ConPermiso>
                )}
            </div>

            {/* Resumen */}
            <div className="servicios-summary-grid">
                <div className="servicios-summary-card">
                    <span>Total en página</span>
                    <strong>{resumen.totalPagina}</strong>
                    <small>Mostrando {pagination.from || 0} – {pagination.to || 0}</small>
                </div>

                <div className="servicios-summary-card">
                    <span>Activos</span>
                    <strong>{resumen.activos}</strong>
                    <small>Publicados en esta página</small>
                </div>

                <div className="servicios-summary-card">
                    <span>Inactivos</span>
                    <strong>{resumen.inactivos}</strong>
                    <small>No visibles públicamente</small>
                </div>

                <div className="servicios-summary-card servicios-summary-secure">
                    <span>Con autenticación</span>
                    <strong>{resumen.autenticados}</strong>
                    <small>Requieren iniciar sesión</small>
                </div>
            </div>

            {/* Formulario */}
            {showForm && (
                <div className="servicios-form-card">
                    <div className="servicios-form-header">
                        <div>
                            <h2>
                                {isEditing
                                    ? 'Editar servicio tecnológico'
                                    : 'Agregar servicio tecnológico'}
                            </h2>
                            <p>
                                El slug se genera automáticamente desde el nombre. Los campos
                                de la sección <strong>Portal público</strong> son opcionales
                                y aparecen en el modal de detalle del portal.
                            </p>
                        </div>

                        <button
                            type="button"
                            className="servicios-close-button"
                            onClick={cerrarFormulario}
                            disabled={saving}
                        >
                            <X size={18} />
                        </button>
                    </div>

                    <form className="servicios-form" onSubmit={handleSubmit}>
                        {/* ── Datos principales ── */}
                        <h3 className="servicios-form-section-title">Datos principales</h3>

                        <div className="servicios-form-grid">
                            <div className="servicios-field">
                                <label>Nombre *</label>
                                <input
                                    name="nombre"
                                    value={form.nombre}
                                    onChange={handleChange}
                                    maxLength={MAX_NOMBRE_LENGTH}
                                    placeholder="Ej. Mesa de ayuda"
                                    required
                                    disabled={saving}
                                />
                            </div>

                            <div className="servicios-field">
                                <label>Categoría *</label>
                                <select
                                    name="idcategoria"
                                    value={form.idcategoria}
                                    onChange={handleChange}
                                    required
                                    disabled={saving}
                                >
                                    <option value="">Seleccione una categoría</option>
                                    {categorias.map((c) => (
                                        <option key={c.idcategoria} value={c.idcategoria}>
                                            {c.nombre}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="servicios-field span-2">
                                <label>Descripción corta *</label>
                                <textarea
                                    name="descripcion_corta"
                                    value={form.descripcion_corta}
                                    onChange={handleChange}
                                    maxLength={MAX_DESCRIPCION_CORTA_LENGTH}
                                    rows={3}
                                    placeholder="Resumen breve visible en la tarjeta del portal."
                                    required
                                    disabled={saving}
                                />
                                <small>
                                    {form.descripcion_corta.length}/{MAX_DESCRIPCION_CORTA_LENGTH} caracteres
                                </small>
                            </div>

                            <div className="servicios-field span-2">
                                <label>Descripción larga</label>
                                <textarea
                                    name="descripcion_larga"
                                    value={form.descripcion_larga}
                                    onChange={handleChange}
                                    rows={5}
                                    placeholder="Describe requisitos, alcance o pasos de acceso. Visible en el modal de detalle."
                                    disabled={saving}
                                />
                            </div>

                            <div className="servicios-field">
                                <label>URL del servicio</label>
                                <input
                                    name="url_servicio"
                                    value={form.url_servicio}
                                    onChange={handleChange}
                                    maxLength={MAX_URL_LENGTH}
                                    placeholder="https://..."
                                    disabled={saving}
                                />
                            </div>

                            <div className="servicios-field">
                                <label>Icono</label>
                                <input
                                    name="icono"
                                    value={form.icono}
                                    onChange={handleChange}
                                    maxLength={MAX_ICONO_LENGTH}
                                    placeholder="Ej. server, helpdesk, network"
                                    disabled={saving}
                                />
                            </div>

                            <div className="servicios-field">
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

                            <div
                                className="servicios-field"
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'flex-end',
                                    gap: '10px',
                                }}
                            >
                                <label className="servicios-checkbox">
                                    <input
                                        type="checkbox"
                                        name="requiere_autenticacion"
                                        checked={form.requiere_autenticacion}
                                        onChange={handleChange}
                                        disabled={saving}
                                    />
                                    Requiere autenticación
                                </label>

                                <label className="servicios-checkbox">
                                    <input
                                        type="checkbox"
                                        name="activo"
                                        checked={form.activo}
                                        onChange={handleChange}
                                        disabled={saving}
                                    />
                                    Servicio activo
                                </label>
                            </div>

                            <div className="servicios-field span-2">
                                <div className="servicios-etiquetas-header">
                                    <label>Etiquetas</label>

                                    <div className="servicios-etiquetas-actions">
                                        <span>
                                            {etiquetasSeleccionadas.length} seleccionada
                                            {etiquetasSeleccionadas.length === 1 ? '' : 's'}
                                        </span>

                                        {etiquetasSeleccionadas.length > 0 && (
                                            <button
                                                type="button"
                                                onClick={limpiarEtiquetasSeleccionadas}
                                                disabled={saving}
                                            >
                                                Limpiar
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {etiquetasActivasSeleccionadas.length > 0 && (
                                    <div className="servicios-etiquetas-selected">
                                        <strong>Seleccionadas:</strong>

                                        <div className="servicios-etiquetas-selected-list">
                                            {etiquetasActivasSeleccionadas.map((etiqueta) => (
                                                <button
                                                    type="button"
                                                    key={etiqueta.idetiqueta}
                                                    className="servicios-etiqueta-selected"
                                                    onClick={() => handleToggleEtiqueta(etiqueta.idetiqueta)}
                                                    style={{
                                                        '--etiqueta-color': etiqueta.color || '#2563eb',
                                                    }}
                                                    disabled={saving}
                                                >
                                                    <span>{etiqueta.nombre}</span>
                                                    <X size={13} />
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {etiquetas.length === 0 ? (
                                    <small className="servicios-help-text">
                                        No hay etiquetas activas registradas.
                                    </small>
                                ) : (
                                    <div className="servicios-etiquetas-selector">
                                        {etiquetas.map((etiqueta) => {
                                            const activa = etiquetasSeleccionadas.includes(
                                                Number(etiqueta.idetiqueta)
                                            );

                                            return (
                                                <button
                                                    type="button"
                                                    key={etiqueta.idetiqueta}
                                                    className={`servicios-etiqueta-chip ${
                                                        activa ? 'is-active' : ''
                                                    }`}
                                                    onClick={() => handleToggleEtiqueta(etiqueta.idetiqueta)}
                                                    style={{
                                                        '--etiqueta-color': etiqueta.color || '#2563eb',
                                                    }}
                                                    disabled={saving}
                                                >
                                                    <Tags size={13} />
                                                    <span>{etiqueta.nombre}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}

                                <small className="servicios-help-text">
                                    Usa etiquetas para relacionar este servicio con soporte,
                                    correo institucional, seguridad informática, capacitación,
                                    sistemas institucionales, DSTI o UNASAM.
                                </small>
                            </div>
                        </div>

                        {/* ── Portal público — campos opcionales del modal ── */}
                        <h3
                            className="servicios-form-section-title"
                            style={{ marginTop: '28px' }}
                        >
                            Portal público
                            <small
                                style={{
                                    fontWeight: 400,
                                    fontSize: '0.78rem',
                                    marginLeft: '8px',
                                    color: 'var(--muted, #6c757d)',
                                }}
                            >
                                Opcional — aparece en el modal de detalle del portal
                            </small>
                        </h3>

                        <div className="servicios-form-grid">
                            <div className="servicios-field">
                                <label>Correo de contacto</label>
                                <input
                                    name="correo_contacto"
                                    type="email"
                                    value={form.correo_contacto}
                                    onChange={handleChange}
                                    maxLength={MAX_CORREO_LENGTH}
                                    placeholder="soporte@unasam.edu.pe"
                                    disabled={saving}
                                />
                                <small>
                                    Correo específico de este servicio. Si está vacío, se usa el
                                    correo general de la institución.
                                </small>
                            </div>

                            <div className="servicios-field">
                                <label>Texto del botón de acción</label>
                                <input
                                    name="texto_accion"
                                    value={form.texto_accion}
                                    onChange={handleChange}
                                    maxLength={MAX_TEXTO_ACCION_LENGTH}
                                    placeholder="Ej. Solicitar acceso, Abrir sistema..."
                                    disabled={saving}
                                />
                                <small>
                                    Texto del botón principal en la tarjeta. Por defecto:
                                    "Abrir servicio" o "Solicitar ayuda".
                                </small>
                            </div>

                            <div className="servicios-field span-2">
                                <label>Orientación — ¿Cuándo usar este servicio?</label>
                                <textarea
                                    name="orientacion"
                                    value={form.orientacion}
                                    onChange={handleChange}
                                    rows={3}
                                    placeholder="Ej. Úsalo cuando necesites recuperar acceso a tu cuenta institucional o reportar una incidencia técnica."
                                    disabled={saving}
                                />
                            </div>

                            <div className="servicios-field span-2">
                                <label>Casos de uso</label>
                                <textarea
                                    name="casos_uso"
                                    value={form.casos_uso}
                                    onChange={handleChange}
                                    rows={4}
                                    placeholder={
                                        'Escribe cada caso en una línea separada o separados por ;\nEj:\nNo puedo iniciar sesión en el sistema\nMi correo institucional no funciona\nNecesito instalar software'
                                    }
                                    disabled={saving}
                                />
                                <small>
                                    Cada línea o punto y coma (;) se muestra como un caso
                                    numerado en el modal.
                                </small>
                            </div>

                            <div className="servicios-field span-2">
                                <label>Consejo previo</label>
                                <textarea
                                    name="consejo"
                                    value={form.consejo}
                                    onChange={handleChange}
                                    rows={3}
                                    placeholder="Ej. Ten a la mano tu código de estudiante o DNI antes de enviar tu solicitud."
                                    disabled={saving}
                                />
                            </div>

                            <div className="servicios-field">
                                <label>Sección relacionada</label>
                                <select
                                    name="seccion_relacionada"
                                    value={form.seccion_relacionada}
                                    onChange={handleChange}
                                    disabled={saving}
                                >
                                    <option value="">Sin sección relacionada</option>
                                    {modulos.map((m) => (
                                        <option key={m.idmodulo} value={`#${m.slug}`}>
                                            {m.nombre} (#{m.slug})
                                        </option>
                                    ))}
                                </select>
                                <small>
                                    Selecciona el módulo del portal al que quieres dirigir al
                                    usuario.
                                </small>
                            </div>

                            <div className="servicios-field">
                                <label>Etiqueta del botón de sección</label>
                                <input
                                    name="label_seccion"
                                    value={form.label_seccion}
                                    onChange={handleChange}
                                    maxLength={MAX_LABEL_SECCION_LENGTH}
                                    placeholder="Ej. Ver sistemas disponibles"
                                    disabled={saving}
                                />
                            </div>
                        </div>

                        <div className="servicios-form-actions">
                            <button
                                type="submit"
                                className="servicios-save-button"
                                disabled={saving}
                            >
                                <Save size={17} />
                                {saving
                                    ? 'Guardando...'
                                    : isEditing
                                        ? 'Actualizar servicio'
                                        : 'Guardar servicio'}
                            </button>

                            <button
                                type="button"
                                className="servicios-cancel-button"
                                onClick={cerrarFormulario}
                                disabled={saving}
                            >
                                Cancelar
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Lista */}
            <div className="servicios-list-card">
                <div className="servicios-list-header">
                    <div>
                        <h2>Servicios registrados</h2>
                        <p>
                            Mostrando {pagination.from || 0} – {pagination.to || 0} de{' '}
                            {pagination.total} servicios.
                        </p>
                    </div>

                    <form className="servicios-filters" onSubmit={handleBuscar}>
                        <div className="servicios-search">
                            <Search size={17} />
                            <input
                                value={search}
                                onChange={(e) => {
                                    if (e.target.value.length <= MAX_SEARCH_LENGTH) {
                                        setSearch(e.target.value);
                                    }
                                }}
                                placeholder="Buscar servicio..."
                                maxLength={MAX_SEARCH_LENGTH}
                            />
                        </div>

                        <select
                            value={categoriaFiltro}
                            onChange={(e) => setCategoriaFiltro(e.target.value)}
                            className="servicios-filter-select"
                        >
                            <option value="">Todas las categorías</option>
                            {categorias.map((c) => (
                                <option key={c.idcategoria} value={c.idcategoria}>
                                    {c.nombre}
                                </option>
                            ))}
                        </select>

                        <select
                            value={activoFiltro}
                            onChange={(e) => setActivoFiltro(e.target.value)}
                            className="servicios-filter-select"
                        >
                            <option value="">Todos</option>
                            <option value="1">Activos</option>
                            <option value="0">Inactivos</option>
                        </select>

                        <button type="submit" className="servicios-filter-button">
                            Buscar
                        </button>

                        <button
                            type="button"
                            className="servicios-clear-button"
                            onClick={handleLimpiarFiltros}
                        >
                            Limpiar
                        </button>
                    </form>
                </div>

                {loading ? (
                    <p className="servicios-empty">Cargando servicios tecnológicos...</p>
                ) : servicios.length === 0 ? (
                    <div className="servicios-empty-box">
                        <h3>No hay servicios para mostrar</h3>
                        <p>Registra un servicio o cambia los filtros de búsqueda.</p>
                    </div>
                ) : (
                    <div className="servicios-grid">
                        {servicios.map((servicio) => {
                            const activo = Boolean(Number(servicio.activo));
                            const requiereAuth = Boolean(Number(servicio.requiere_autenticacion));

                            return (
                                <article
                                    key={servicio.idservicio}
                                    className={
                                        activo
                                            ? 'servicios-card-item'
                                            : 'servicios-card-item inactive'
                                    }
                                >
                                    <div className="servicios-card-top">
                                        <div className="servicios-card-icon">
                                            <ServerCog size={22} />
                                        </div>

                                        <div className="servicios-card-badges">
                                            <span
                                                className={
                                                    activo
                                                        ? 'servicios-status active'
                                                        : 'servicios-status inactive'
                                                }
                                            >
                                                {activo ? 'Activo' : 'Inactivo'}
                                            </span>

                                            <span
                                                className={
                                                    requiereAuth
                                                        ? 'servicios-auth required'
                                                        : 'servicios-auth public'
                                                }
                                            >
                                                {requiereAuth ? (
                                                    <>
                                                        <Lock size={13} /> Privado
                                                    </>
                                                ) : (
                                                    <>
                                                        <Unlock size={13} /> Público
                                                    </>
                                                )}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="servicios-card-body">
                                        <h3>{servicio.nombre}</h3>
                                        <p>{servicio.descripcion_corta}</p>

                                        <EtiquetasServicio etiquetas={servicio.etiquetas} />

                                        <div className="servicios-card-meta">
                                            <span>
                                                Categoría:{' '}
                                                <strong>{servicio.categoria?.nombre || '—'}</strong>
                                            </span>

                                            <span>
                                                Orden: <strong>{servicio.orden ?? 0}</strong>
                                            </span>

                                            {servicio.correo_contacto && (
                                                <span>
                                                    <Mail size={12} /> {servicio.correo_contacto}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="servicios-card-actions">
                                        {servicio.url_servicio && (
                                            <a
                                                href={servicio.url_servicio}
                                                target="_blank"
                                                rel="noreferrer"
                                                title="Abrir servicio"
                                            >
                                                <ExternalLink size={16} />
                                            </a>
                                        )}

                                        <button
                                            type="button"
                                            onClick={() => handleViewDetail(servicio)}
                                            title="Ver detalle"
                                        >
                                            <Eye size={16} />
                                        </button>

                                        <ConPermiso permiso="servicios.editar">
                                            <button
                                                type="button"
                                                onClick={() => handleToggleActivo(servicio)}
                                                title={activo ? 'Desactivar' : 'Activar'}
                                            >
                                                {activo ? <PowerOff size={16} /> : <Power size={16} />}
                                            </button>
                                        </ConPermiso>

                                        <ConPermiso permiso="servicios.editar">
                                            <button
                                                type="button"
                                                onClick={() => handleEdit(servicio)}
                                                title="Editar"
                                            >
                                                <Pencil size={16} />
                                            </button>
                                        </ConPermiso>

                                        <ConPermiso permiso="servicios.eliminar">
                                            <button
                                                type="button"
                                                className="danger"
                                                onClick={() => handleDelete(servicio)}
                                                title="Eliminar"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </ConPermiso>
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                )}

                <div className="servicios-pagination">
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

            {/* Modal de detalle */}
            {showDetail && (
                <div className="servicios-modal-overlay" role="dialog" aria-modal="true">
                    <div className="servicios-modal">
                        <div className="servicios-modal-header">
                            <div>
                                <span className="servicios-eyebrow">Detalle del servicio</span>
                                <h2>
                                    {loadingDetail
                                        ? 'Cargando...'
                                        : selectedServicio?.nombre || 'Detalle'}
                                </h2>
                            </div>

                            <button
                                type="button"
                                className="servicios-close-button"
                                onClick={cerrarDetalle}
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {loadingDetail ? (
                            <p className="servicios-empty">Cargando detalle...</p>
                        ) : selectedServicio ? (
                            <div className="servicios-detail">
                                <div className="servicios-detail-grid">
                                    <div>
                                        <span>Categoría</span>
                                        <strong>{selectedServicio.categoria?.nombre || '—'}</strong>
                                    </div>

                                    <div>
                                        <span>Orden</span>
                                        <strong>{selectedServicio.orden ?? 0}</strong>
                                    </div>

                                    <div>
                                        <span>Estado</span>
                                        <strong>
                                            {Boolean(Number(selectedServicio.activo))
                                                ? 'Activo'
                                                : 'Inactivo'}
                                        </strong>
                                    </div>

                                    <div>
                                        <span>Acceso</span>
                                        <strong>
                                            {Boolean(Number(selectedServicio.requiere_autenticacion))
                                                ? 'Requiere autenticación'
                                                : 'Público'}
                                        </strong>
                                    </div>

                                    <div>
                                        <span>Icono</span>
                                        <strong>{selectedServicio.icono || '—'}</strong>
                                    </div>

                                    <div>
                                        <span>Slug</span>
                                        <strong>{selectedServicio.slug || '—'}</strong>
                                    </div>

                                    {selectedServicio.correo_contacto && (
                                        <div>
                                            <span>Correo de contacto</span>
                                            <strong>
                                                <a href={`mailto:${selectedServicio.correo_contacto}`}>
                                                    {selectedServicio.correo_contacto}
                                                </a>
                                            </strong>
                                        </div>
                                    )}

                                    {selectedServicio.texto_accion && (
                                        <div>
                                            <span>Texto del botón</span>
                                            <strong>{selectedServicio.texto_accion}</strong>
                                        </div>
                                    )}
                                </div>

                                <div className="servicios-detail-content">
                                    <h3>Etiquetas</h3>

                                    <EtiquetasServicio etiquetas={selectedServicio.etiquetas} />

                                    {(!Array.isArray(selectedServicio.etiquetas) ||
                                        selectedServicio.etiquetas.length === 0) && (
                                        <p>Sin etiquetas registradas.</p>
                                    )}
                                </div>

                                <div className="servicios-detail-content">
                                    <h3>Descripción corta</h3>
                                    <p>{selectedServicio.descripcion_corta}</p>
                                </div>

                                {selectedServicio.descripcion_larga && (
                                    <div className="servicios-detail-content">
                                        <h3>Descripción larga</h3>
                                        <p>{selectedServicio.descripcion_larga}</p>
                                    </div>
                                )}

                                {selectedServicio.orientacion && (
                                    <div className="servicios-detail-content">
                                        <h3>¿Cuándo usar este servicio?</h3>
                                        <p>{selectedServicio.orientacion}</p>
                                    </div>
                                )}

                                {selectedServicio.casos_uso && (
                                    <div className="servicios-detail-content">
                                        <h3>Casos de uso</h3>
                                        <ol style={{ paddingLeft: '1.2rem', lineHeight: 1.7 }}>
                                            {String(selectedServicio.casos_uso)
                                                .split(/\n|;/)
                                                .map((s) => s.trim())
                                                .filter(Boolean)
                                                .map((caso, i) => (
                                                    <li key={i}>{caso}</li>
                                                ))}
                                        </ol>
                                    </div>
                                )}

                                {selectedServicio.consejo && (
                                    <div className="servicios-detail-content">
                                        <h3>Consejo previo</h3>
                                        <p>{selectedServicio.consejo}</p>
                                    </div>
                                )}

                                {selectedServicio.seccion_relacionada && (
                                    <div className="servicios-detail-content">
                                        <h3>Sección relacionada</h3>
                                        <p>
                                            <Link2
                                                size={14}
                                                style={{
                                                    marginRight: '6px',
                                                    verticalAlign: 'middle',
                                                }}
                                            />
                                            {selectedServicio.seccion_relacionada}
                                            {selectedServicio.label_seccion &&
                                                ` — "${selectedServicio.label_seccion}"`}
                                        </p>
                                    </div>
                                )}

                                <div className="servicios-detail-links">
                                    {selectedServicio.url_servicio ? (
                                        <a
                                            href={selectedServicio.url_servicio}
                                            target="_blank"
                                            rel="noreferrer"
                                        >
                                            <ExternalLink size={16} /> Abrir servicio
                                        </a>
                                    ) : (
                                        <span>
                                            <ShieldCheck size={16} /> Sin URL externa registrada
                                        </span>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <p className="servicios-empty">No se pudo cargar el detalle.</p>
                        )}
                    </div>
                </div>
            )}
        </section>
    );
}

function EtiquetasServicio({ etiquetas = [] }) {
    if (!Array.isArray(etiquetas) || etiquetas.length === 0) {
        return null;
    }

    return (
        <div className="servicios-etiquetas-list">
            {etiquetas.map((etiqueta) => (
                <span
                    key={etiqueta.idetiqueta}
                    className="servicios-etiqueta-badge"
                    style={{
                        '--etiqueta-color': etiqueta.color || '#2563eb',
                    }}
                >
                    {etiqueta.nombre}
                </span>
            ))}
        </div>
    );
}