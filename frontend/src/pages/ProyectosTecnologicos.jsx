import { useEffect, useMemo, useState } from 'react';
import {
    FolderKanban,
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
    ExternalLink,
    Tags,
} from 'lucide-react';

import {
    actualizarProyecto,
    crearProyecto,
    eliminarProyecto,
    listarProyectos,
    obtenerProyecto,
} from '../api/proyectosApi';

import { listarCategorias } from '../api/categoriasApi';
import { listarEstados } from '../api/estadosApi';
import { listarEtiquetas } from '../api/etiquetasApi';
import { getFileUrl } from '../api/files';

import {
    closeNotify,
    getApiErrorMessage,
    notifyError,
    notifyLoading,
    notifySuccess,
} from '../utils/notify';

import '../styles/modules/proyectosTecnologicos.css';

const initialForm = {
    titulo: '',
    descripcion: '',
    porcentaje_avance: 0,
    fecha_inicio: '',
    fecha_fin: '',
    responsable: '',
    url_resultado: '',
    idcategoria: '',
    idestado: '',
    orden: 0,
    activo: true,
    archivo: null,
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

const MAX_TITULO_LENGTH = 200;
const MAX_RESPONSABLE_LENGTH = 150;
const MAX_URL_LENGTH = 255;
const MAX_SEARCH_LENGTH = 120;
const MAX_ORDEN = 255;
const MAX_AVANCE = 100;
const MAX_ARCHIVO_SIZE = 10 * 1024 * 1024;

const ARCHIVO_MIMES = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
];

const ARCHIVO_EXTENSIONS = [
    'jpg',
    'jpeg',
    'png',
    'webp',
    'pdf',
    'doc',
    'docx',
    'xls',
    'xlsx',
    'ppt',
    'pptx',
];

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

const isPositiveOrZeroInteger = (value) => {
    if (value === '' || value === null || value === undefined) return true;
    return /^\d+$/.test(String(value));
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

const getExtension = (fileName = '') => {
    return String(fileName).split('.').pop()?.toLowerCase() || '';
};

export default function ProyectosTecnologicos() {
    const [proyectos, setProyectos] = useState([]);
    const [categorias, setCategorias] = useState([]);
    const [estados, setEstados] = useState([]);
    const [etiquetas, setEtiquetas] = useState([]);
    const [pagination, setPagination] = useState(initialPagination);

    const [form, setForm] = useState(initialForm);
    const [editingId, setEditingId] = useState(null);
    const [selectedProyecto, setSelectedProyecto] = useState(null);

    const [showForm, setShowForm] = useState(false);
    const [showDetail, setShowDetail] = useState(false);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [loadingDetail, setLoadingDetail] = useState(false);

    const [search, setSearch] = useState('');
    const [estadoFiltro, setEstadoFiltro] = useState('');
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

    const categoriaExiste = (idcategoria) => {
        return categorias.some(
            (categoria) => Number(categoria.idcategoria) === Number(idcategoria)
        );
    };

    const estadoExiste = (idestado) => {
        return estados.some(
            (estado) => Number(estado.idestado) === Number(idestado)
        );
    };

    const cargarDatos = async (page = 1) => {
        setLoading(true);

        try {
            const params = {
                page,
                buscar: search.trim() || undefined,
                activo: activoFiltro === '' ? undefined : activoFiltro,
                idcategoria: categoriaFiltro || undefined,
                idestado: estadoFiltro || undefined,
            };

            Object.keys(params).forEach((key) => {
                if (params[key] === undefined || params[key] === '') {
                    delete params[key];
                }
            });

            const [
                proyectosData,
                categoriasData,
                estadosData,
                etiquetasData,
            ] = await Promise.all([
                listarProyectos(params),
                listarCategorias(),
                listarEstados(),
                listarEtiquetas(),
            ]);

            const { items, pagination: meta } =
                normalizarRespuestaPaginada(proyectosData);

            setProyectos(items);
            setPagination(meta);
            setCategorias(normalizarLista(categoriasData));
            setEstados(normalizarLista(estadosData));

            setEtiquetas(
                normalizarLista(etiquetasData).filter(
                    (item) => Number(item?.activo ?? 1) === 1
                )
            );
        } catch (err) {
            notifyError(
                getApiErrorMessage(
                    err,
                    'No se pudieron cargar los proyectos tecnológicos.'
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
            if (value !== '' && Number(value) > MAX_ORDEN) return;

            setForm({
                ...form,
                orden: value,
            });

            return;
        }

        if (name === 'porcentaje_avance') {
            if (value !== '' && !/^\d+$/.test(value)) return;
            if (value !== '' && Number(value) > MAX_AVANCE) return;

            setForm({
                ...form,
                porcentaje_avance: value,
            });

            return;
        }

        setForm({
            ...form,
            [name]: type === 'checkbox' ? checked : value,
        });
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

    const handleSearchChange = (e) => {
        const value = e.target.value;

        if (value.length > MAX_SEARCH_LENGTH) return;

        setSearch(value);
    };

    const validarArchivo = (archivo) => {
        if (!archivo) return true;

        const extension = getExtension(archivo.name);

        if (!ARCHIVO_EXTENSIONS.includes(extension)) {
            notifyError('El archivo debe ser imagen, PDF, Word, Excel o PowerPoint.');
            return false;
        }

        if (archivo.type && !ARCHIVO_MIMES.includes(archivo.type)) {
            notifyError('El archivo debe ser imagen, PDF, Word, Excel o PowerPoint.');
            return false;
        }

        if (archivo.size > MAX_ARCHIVO_SIZE) {
            notifyError('El archivo no debe superar los 10 MB.');
            return false;
        }

        return true;
    };

    const validarFormulario = () => {
        const titulo = form.titulo.trim();
        const responsable = form.responsable.trim();
        const urlResultado = form.url_resultado.trim();
        const avance = Number(form.porcentaje_avance);
        const orden = Number(form.orden);

        if (!titulo) {
            notifyError('El título del proyecto es obligatorio.');
            return false;
        }

        if (titulo.length < 5) {
            notifyError('El título debe tener al menos 5 caracteres.');
            return false;
        }

        if (titulo.length > MAX_TITULO_LENGTH) {
            notifyError(`El título no debe superar los ${MAX_TITULO_LENGTH} caracteres.`);
            return false;
        }

        if (!form.idcategoria) {
            notifyError('Seleccione una categoría para el proyecto.');
            return false;
        }

        if (!categoriaExiste(form.idcategoria)) {
            notifyError('La categoría seleccionada no existe o no está disponible.');
            return false;
        }

        if (!form.idestado) {
            notifyError('Seleccione un estado para el proyecto.');
            return false;
        }

        if (!estadoExiste(form.idestado)) {
            notifyError('El estado seleccionado no existe o no está disponible.');
            return false;
        }

        if (!isPositiveOrZeroInteger(form.porcentaje_avance)) {
            notifyError('El porcentaje de avance debe ser un número entero entre 0 y 100.');
            return false;
        }

        if (Number.isNaN(avance) || avance < 0 || avance > MAX_AVANCE) {
            notifyError('El porcentaje de avance debe estar entre 0 y 100.');
            return false;
        }

        if (responsable.length > MAX_RESPONSABLE_LENGTH) {
            notifyError(`El responsable no debe superar los ${MAX_RESPONSABLE_LENGTH} caracteres.`);
            return false;
        }

        if (urlResultado.length > MAX_URL_LENGTH) {
            notifyError(`La URL del resultado no debe superar los ${MAX_URL_LENGTH} caracteres.`);
            return false;
        }

        if (!isValidUrl(urlResultado)) {
            notifyError('La URL del resultado no tiene un formato válido.');
            return false;
        }

        if (!isPositiveOrZeroInteger(form.orden)) {
            notifyError('El orden debe ser un número entero entre 0 y 255.');
            return false;
        }

        if (Number.isNaN(orden) || orden < 0 || orden > MAX_ORDEN) {
            notifyError('El orden debe estar entre 0 y 255.');
            return false;
        }

        if (!isValidDate(form.fecha_inicio)) {
            notifyError('La fecha de inicio no tiene un formato válido.');
            return false;
        }

        if (!isValidDate(form.fecha_fin)) {
            notifyError('La fecha de fin no tiene un formato válido.');
            return false;
        }

        if (form.fecha_inicio && form.fecha_fin) {
            const inicio = new Date(`${form.fecha_inicio}T00:00:00`);
            const fin = new Date(`${form.fecha_fin}T00:00:00`);

            if (fin < inicio) {
                notifyError('La fecha de fin debe ser igual o posterior a la fecha de inicio.');
                return false;
            }
        }

        if (!validarArchivo(form.archivo)) {
            return false;
        }

        return true;
    };

    const appendEtiquetasToFormData = (data, etiquetasValue = []) => {
        if (!Array.isArray(etiquetasValue)) return;

        etiquetasValue
            .map(Number)
            .filter((id) => Number.isFinite(id))
            .forEach((idetiqueta) => {
                data.append('etiquetas[]', String(idetiqueta));
            });
    };

    const buildFormData = (isUpdate = false) => {
        const data = new FormData();

        if (isUpdate) {
            data.append('_method', 'POST');
        }

        data.append('titulo', form.titulo.trim());
        data.append('descripcion', form.descripcion.trim());
        data.append('porcentaje_avance', String(Number(form.porcentaje_avance || 0)));
        data.append('fecha_inicio', form.fecha_inicio || '');
        data.append('fecha_fin', form.fecha_fin || '');
        data.append('responsable', form.responsable.trim());
        data.append('url_resultado', form.url_resultado.trim());
        data.append('idcategoria', String(Number(form.idcategoria)));
        data.append('idestado', String(Number(form.idestado)));
        data.append('orden', String(Number(form.orden || 0)));
        data.append('activo', form.activo ? '1' : '0');

        appendEtiquetasToFormData(data, form.etiquetas);

        if (form.archivo) {
            data.append('archivo', form.archivo);
        }

        return data;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validarFormulario()) return;

        setSaving(true);

        const toastId = notifyLoading(
            isEditing ? 'Actualizando proyecto...' : 'Registrando proyecto...'
        );

        try {
            const payload = buildFormData(isEditing);

            if (isEditing) {
                await actualizarProyecto(editingId, payload);
                notifySuccess('Proyecto actualizado correctamente.');
            } else {
                await crearProyecto(payload);
                notifySuccess('Proyecto registrado correctamente.');
            }

            cerrarFormulario();
            await cargarDatos(pagination.current_page);
        } catch (err) {
            notifyError(
                getApiErrorMessage(err, 'No se pudo guardar el proyecto.')
            );
        } finally {
            closeNotify(toastId);
            setSaving(false);
        }
    };

    const handleEdit = (proyecto) => {
        setEditingId(proyecto.idproyecto);
        setShowForm(true);

        setForm({
            titulo: proyecto.titulo || '',
            descripcion: proyecto.descripcion || '',
            porcentaje_avance: proyecto.porcentaje_avance ?? 0,
            fecha_inicio: normalizeDateInput(proyecto.fecha_inicio) || '',
            fecha_fin: normalizeDateInput(proyecto.fecha_fin) || '',
            responsable: proyecto.responsable || '',
            url_resultado: proyecto.url_resultado || '',
            idcategoria: proyecto.idcategoria || '',
            idestado: proyecto.idestado || '',
            orden: proyecto.orden ?? 0,
            activo: Boolean(Number(proyecto.activo)),
            archivo: null,
            etiquetas: Array.isArray(proyecto.etiquetas)
                ? proyecto.etiquetas.map((item) => Number(item.idetiqueta))
                : [],
        });

        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = async (proyecto) => {
        if (!proyecto.idproyecto) {
            notifyError('No se encontró el identificador del proyecto.');
            return;
        }

        const ok = confirm(
            `¿Eliminar el proyecto "${proyecto.titulo}"?\n\nTambién se eliminará su archivo local si no está usado por otros módulos.`
        );

        if (!ok) return;

        const toastId = notifyLoading('Eliminando proyecto...');

        try {
            await eliminarProyecto(proyecto.idproyecto);

            notifySuccess('Proyecto eliminado correctamente.');

            const nextPage =
                proyectos.length === 1 && pagination.current_page > 1
                    ? pagination.current_page - 1
                    : pagination.current_page;

            await cargarDatos(nextPage);
        } catch (err) {
            notifyError(
                getApiErrorMessage(err, 'No se pudo eliminar el proyecto.')
            );
        } finally {
            closeNotify(toastId);
        }
    };

    const handleToggleActivo = async (proyecto) => {
        if (!proyecto.idproyecto) {
            notifyError('No se encontró el identificador del proyecto.');
            return;
        }

        if (!proyecto.titulo || !proyecto.idcategoria || !proyecto.idestado) {
            notifyError('El proyecto no tiene datos completos para cambiar su estado.');
            return;
        }

        const nuevoEstado = !Boolean(Number(proyecto.activo));

        const data = new FormData();
        data.append('_method', 'POST');
        data.append('titulo', proyecto.titulo);
        data.append('descripcion', proyecto.descripcion || '');
        data.append('porcentaje_avance', String(Number(proyecto.porcentaje_avance || 0)));
        data.append('fecha_inicio', proyecto.fecha_inicio || '');
        data.append('fecha_fin', proyecto.fecha_fin || '');
        data.append('responsable', proyecto.responsable || '');
        data.append('url_resultado', proyecto.url_resultado || '');
        data.append('idcategoria', String(Number(proyecto.idcategoria)));
        data.append('idestado', String(Number(proyecto.idestado)));
        data.append('orden', String(Number(proyecto.orden || 0)));
        data.append('activo', nuevoEstado ? '1' : '0');

        appendEtiquetasToFormData(
            data,
            Array.isArray(proyecto.etiquetas)
                ? proyecto.etiquetas.map((item) => Number(item.idetiqueta))
                : []
        );

        const toastId = notifyLoading(
            nuevoEstado ? 'Activando proyecto...' : 'Desactivando proyecto...'
        );

        try {
            await actualizarProyecto(proyecto.idproyecto, data);

            notifySuccess(
                nuevoEstado
                    ? 'Proyecto activado correctamente.'
                    : 'Proyecto desactivado correctamente.'
            );

            await cargarDatos(pagination.current_page);
        } catch (err) {
            notifyError(
                getApiErrorMessage(err, 'No se pudo cambiar el estado del proyecto.')
            );
        } finally {
            closeNotify(toastId);
        }
    };

    const handleViewDetail = async (proyecto) => {
        setShowDetail(true);
        setLoadingDetail(true);
        setSelectedProyecto(null);

        try {
            const response = await obtenerProyecto(proyecto.idproyecto);
            setSelectedProyecto(response?.data || proyecto);
        } catch (err) {
            notifyError(
                getApiErrorMessage(err, 'No se pudo obtener el detalle del proyecto.')
            );
            setShowDetail(false);
        } finally {
            setLoadingDetail(false);
        }
    };

    const cerrarDetalle = () => {
        setShowDetail(false);
        setSelectedProyecto(null);
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
        setCategoriaFiltro('');
        setActivoFiltro('');

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
        <section className="proyectos-page">
            <div className="proyectos-header">
                <div>
                    <span className="proyectos-eyebrow">Innovación y desarrollo</span>
                    <h1>Proyectos tecnológicos</h1>
                    <p>
                        Administra proyectos de la DSTI, su avance, responsable, estado,
                        categoría, etiquetas, fechas y archivos asociados.
                    </p>
                </div>

                {!showForm && (
                    <button
                        type="button"
                        className="proyectos-add-button"
                        onClick={abrirFormularioCrear}
                        disabled={loading}
                    >
                        <Plus size={18} />
                        Agregar proyecto
                    </button>
                )}
            </div>

            {showForm && (
                <div className="proyectos-form-card">
                    <div className="proyectos-form-header">
                        <div>
                            <h2>{isEditing ? 'Editar proyecto' : 'Agregar proyecto'}</h2>
                            <p>
                                El slug se genera automáticamente desde el título.
                                Puedes adjuntar un archivo relacionado al proyecto.
                            </p>
                        </div>

                        <button
                            type="button"
                            className="proyectos-close-button"
                            onClick={cerrarFormulario}
                            disabled={saving}
                        >
                            <X size={18} />
                        </button>
                    </div>

                    <form className="proyectos-form" onSubmit={handleSubmit}>
                        <div className="proyectos-form-grid">
                            <div className="proyectos-field span-2">
                                <label>Título</label>
                                <input
                                    name="titulo"
                                    value={form.titulo}
                                    onChange={handleChange}
                                    maxLength={MAX_TITULO_LENGTH}
                                    placeholder="Ej. Sistema de Gestión Documental"
                                    required
                                    disabled={saving}
                                />
                            </div>

                            <div className="proyectos-field">
                                <label>Categoría</label>
                                <select
                                    name="idcategoria"
                                    value={form.idcategoria}
                                    onChange={handleChange}
                                    required
                                    disabled={saving}
                                >
                                    <option value="">Seleccione una categoría</option>
                                    {categorias.map((categoria) => (
                                        <option
                                            key={categoria.idcategoria}
                                            value={categoria.idcategoria}
                                        >
                                            {categoria.nombre}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="proyectos-field">
                                <label>Estado</label>
                                <select
                                    name="idestado"
                                    value={form.idestado}
                                    onChange={handleChange}
                                    required
                                    disabled={saving}
                                >
                                    <option value="">Seleccione un estado</option>
                                    {estados.map((estado) => (
                                        <option
                                            key={estado.idestado}
                                            value={estado.idestado}
                                        >
                                            {estado.nombre}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="proyectos-field">
                                <label>Avance (%)</label>
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    name="porcentaje_avance"
                                    value={form.porcentaje_avance}
                                    onChange={handleChange}
                                    placeholder="0"
                                    disabled={saving}
                                />
                            </div>

                            <div className="proyectos-field">
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

                            <div className="proyectos-field">
                                <label>Fecha inicio</label>
                                <input
                                    type="date"
                                    name="fecha_inicio"
                                    value={form.fecha_inicio}
                                    onChange={handleChange}
                                    max={form.fecha_fin || undefined}
                                    disabled={saving}
                                />
                            </div>

                            <div className="proyectos-field">
                                <label>Fecha fin</label>
                                <input
                                    type="date"
                                    name="fecha_fin"
                                    value={form.fecha_fin}
                                    onChange={handleChange}
                                    min={form.fecha_inicio || undefined}
                                    disabled={saving}
                                />
                            </div>

                            <div className="proyectos-field">
                                <label>Responsable</label>
                                <input
                                    name="responsable"
                                    value={form.responsable}
                                    onChange={handleChange}
                                    maxLength={MAX_RESPONSABLE_LENGTH}
                                    placeholder="Ej. Oficina de Desarrollo"
                                    disabled={saving}
                                />
                            </div>

                            <div className="proyectos-field">
                                <label>URL del resultado</label>
                                <input
                                    name="url_resultado"
                                    value={form.url_resultado}
                                    onChange={handleChange}
                                    maxLength={MAX_URL_LENGTH}
                                    placeholder="https://..."
                                    disabled={saving}
                                />
                            </div>

                            <div className="proyectos-field span-2">
                                <div className="proyectos-etiquetas-header">
                                    <label>Etiquetas</label>

                                    <div className="proyectos-etiquetas-actions">
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
                                    <div className="proyectos-etiquetas-selected">
                                        <strong>Seleccionadas:</strong>

                                        <div className="proyectos-etiquetas-selected-list">
                                            {etiquetasActivasSeleccionadas.map((etiqueta) => (
                                                <button
                                                    type="button"
                                                    key={etiqueta.idetiqueta}
                                                    className="proyectos-etiqueta-selected"
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
                                    <small className="proyectos-help-text">
                                        No hay etiquetas activas registradas.
                                    </small>
                                ) : (
                                    <div className="proyectos-etiquetas-selector">
                                        {etiquetas.map((etiqueta) => {
                                            const activa = etiquetasSeleccionadas.includes(
                                                Number(etiqueta.idetiqueta)
                                            );

                                            return (
                                                <button
                                                    type="button"
                                                    key={etiqueta.idetiqueta}
                                                    className={`proyectos-etiqueta-chip ${
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

                                <small className="proyectos-help-text">
                                    Usa etiquetas para relacionar este proyecto con transformación digital,
                                    DSTI, UNASAM, seguridad informática, soporte o sistemas institucionales.
                                </small>
                            </div>

                            <div className="proyectos-field span-2">
                                <label>Archivo</label>
                                <input
                                    type="file"
                                    name="archivo"
                                    accept=".jpg,.jpeg,.png,.webp,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
                                    onChange={handleChange}
                                    disabled={saving}
                                />
                                <small>
                                    Imagen, PDF, Word, Excel o PowerPoint. Máximo 10 MB.
                                </small>
                            </div>

                            <div className="proyectos-field span-2">
                                <label>Descripción</label>
                                <textarea
                                    name="descripcion"
                                    value={form.descripcion}
                                    onChange={handleChange}
                                    rows={5}
                                    placeholder="Describe el proyecto tecnológico."
                                    disabled={saving}
                                />
                            </div>

                            <label className="proyectos-checkbox span-2">
                                <input
                                    type="checkbox"
                                    name="activo"
                                    checked={form.activo}
                                    onChange={handleChange}
                                    disabled={saving}
                                />
                                Proyecto activo
                            </label>
                        </div>

                        <div className="proyectos-form-actions">
                            <button
                                type="submit"
                                className="proyectos-save-button"
                                disabled={saving}
                            >
                                <Save size={17} />
                                {saving
                                    ? 'Guardando...'
                                    : isEditing
                                        ? 'Actualizar proyecto'
                                        : 'Guardar proyecto'}
                            </button>

                            <button
                                type="button"
                                className="proyectos-cancel-button"
                                onClick={cerrarFormulario}
                                disabled={saving}
                            >
                                Cancelar
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="proyectos-list-card">
                <div className="proyectos-list-header">
                    <div>
                        <h2>Proyectos registrados</h2>
                        <p>
                            Mostrando {pagination.from || 0} - {pagination.to || 0} de{' '}
                            {pagination.total} proyectos.
                        </p>
                    </div>

                    <form className="proyectos-filters" onSubmit={handleBuscar}>
                        <div className="proyectos-search">
                            <Search size={17} />
                            <input
                                value={search}
                                onChange={handleSearchChange}
                                placeholder="Buscar proyecto..."
                                maxLength={MAX_SEARCH_LENGTH}
                            />
                        </div>

                        <select
                            value={categoriaFiltro}
                            onChange={(e) => setCategoriaFiltro(e.target.value)}
                            className="proyectos-filter-select"
                        >
                            <option value="">Todas las categorías</option>
                            {categorias.map((categoria) => (
                                <option
                                    key={categoria.idcategoria}
                                    value={categoria.idcategoria}
                                >
                                    {categoria.nombre}
                                </option>
                            ))}
                        </select>

                        <select
                            value={estadoFiltro}
                            onChange={(e) => setEstadoFiltro(e.target.value)}
                            className="proyectos-filter-select"
                        >
                            <option value="">Todos los estados</option>
                            {estados.map((estado) => (
                                <option key={estado.idestado} value={estado.idestado}>
                                    {estado.nombre}
                                </option>
                            ))}
                        </select>

                        <select
                            value={activoFiltro}
                            onChange={(e) => setActivoFiltro(e.target.value)}
                            className="proyectos-filter-select"
                        >
                            <option value="">Todos</option>
                            <option value="1">Activos</option>
                            <option value="0">Inactivos</option>
                        </select>

                        <button type="submit" className="proyectos-filter-button">
                            Buscar
                        </button>

                        <button
                            type="button"
                            className="proyectos-clear-button"
                            onClick={handleLimpiarFiltros}
                        >
                            Limpiar
                        </button>
                    </form>
                </div>

                {loading ? (
                    <p className="proyectos-empty">Cargando proyectos...</p>
                ) : proyectos.length === 0 ? (
                    <div className="proyectos-empty-box">
                        <h3>No hay proyectos para mostrar</h3>
                        <p>Registra un proyecto o cambia los filtros de búsqueda.</p>
                    </div>
                ) : (
                    <div className="proyectos-table-wrap">
                        <table className="proyectos-table">
                            <thead>
                            <tr>
                                <th>Proyecto</th>
                                <th>Categoría</th>
                                <th>Estado</th>
                                <th>Avance</th>
                                <th>Responsable</th>
                                <th>Periodo</th>
                                <th>Publicación</th>
                                <th>Archivo</th>
                                <th>Acciones</th>
                            </tr>
                            </thead>

                            <tbody>
                            {proyectos.map((proyecto) => {
                                const activo = Boolean(Number(proyecto.activo));
                                const avance = Number(proyecto.porcentaje_avance || 0);

                                return (
                                    <tr key={proyecto.idproyecto}>
                                        <td>
                                            <div className="proyectos-name">
                                                    <span>
                                                        <FolderKanban size={18} />
                                                    </span>

                                                <div>
                                                    <strong>{proyecto.titulo}</strong>
                                                    <small>
                                                        {recortarTexto(proyecto.descripcion, 90)}
                                                    </small>
                                                    <EtiquetasProyecto etiquetas={proyecto.etiquetas} />
                                                </div>
                                            </div>
                                        </td>

                                        <td>{proyecto.categoria?.nombre || '-'}</td>

                                        <td>{proyecto.estado?.nombre || '-'}</td>

                                        <td>
                                            <div className="proyectos-progress">
                                                <span>{avance}%</span>
                                                <div>
                                                    <i style={{ width: `${avance}%` }} />
                                                </div>
                                            </div>
                                        </td>

                                        <td>{proyecto.responsable || '-'}</td>

                                        <td>
                                            {formatDateSimple(proyecto.fecha_inicio)}
                                            {' - '}
                                            {formatDateSimple(proyecto.fecha_fin)}
                                        </td>

                                        <td>
                                                <span
                                                    className={
                                                        activo
                                                            ? 'proyectos-status active'
                                                            : 'proyectos-status inactive'
                                                    }
                                                >
                                                    {activo ? 'Activo' : 'Inactivo'}
                                                </span>
                                        </td>

                                        <td>
                                            {proyecto.archivo?.ruta ? (
                                                <a
                                                    href={getFileUrl(proyecto.archivo.ruta)}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="proyectos-file-link"
                                                >
                                                    <FileText size={15} />
                                                    Ver
                                                </a>
                                            ) : (
                                                '-'
                                            )}
                                        </td>

                                        <td>
                                            <div className="proyectos-actions">
                                                <button
                                                    type="button"
                                                    onClick={() => handleViewDetail(proyecto)}
                                                    title="Ver detalle"
                                                >
                                                    <Eye size={16} />
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() => handleToggleActivo(proyecto)}
                                                    title={activo ? 'Desactivar' : 'Activar'}
                                                >
                                                    {activo ? (
                                                        <PowerOff size={16} />
                                                    ) : (
                                                        <Power size={16} />
                                                    )}
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() => handleEdit(proyecto)}
                                                    title="Editar"
                                                >
                                                    <Pencil size={16} />
                                                </button>

                                                <button
                                                    type="button"
                                                    className="danger"
                                                    onClick={() => handleDelete(proyecto)}
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

                <div className="proyectos-pagination">
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
                <div className="proyectos-modal-overlay" role="dialog" aria-modal="true">
                    <div className="proyectos-modal">
                        <div className="proyectos-modal-header">
                            <div>
                                <span className="proyectos-eyebrow">Detalle del proyecto</span>
                                <h2>
                                    {loadingDetail
                                        ? 'Cargando detalle...'
                                        : selectedProyecto?.titulo || 'Detalle'}
                                </h2>
                            </div>

                            <button
                                type="button"
                                className="proyectos-close-button"
                                onClick={cerrarDetalle}
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {loadingDetail ? (
                            <p className="proyectos-empty">Cargando detalle...</p>
                        ) : selectedProyecto ? (
                            <div className="proyectos-detail">
                                <div className="proyectos-detail-grid">
                                    <div>
                                        <span>Categoría</span>
                                        <strong>{selectedProyecto.categoria?.nombre || '-'}</strong>
                                    </div>

                                    <div>
                                        <span>Estado</span>
                                        <strong>{selectedProyecto.estado?.nombre || '-'}</strong>
                                    </div>

                                    <div>
                                        <span>Avance</span>
                                        <strong>
                                            {Number(selectedProyecto.porcentaje_avance || 0)}%
                                        </strong>
                                    </div>

                                    <div>
                                        <span>Responsable</span>
                                        <strong>{selectedProyecto.responsable || '-'}</strong>
                                    </div>

                                    <div>
                                        <span>Fecha inicio</span>
                                        <strong>
                                            {formatDateSimple(selectedProyecto.fecha_inicio)}
                                        </strong>
                                    </div>

                                    <div>
                                        <span>Fecha fin</span>
                                        <strong>
                                            {formatDateSimple(selectedProyecto.fecha_fin)}
                                        </strong>
                                    </div>

                                    <div>
                                        <span>Orden</span>
                                        <strong>{selectedProyecto.orden ?? 0}</strong>
                                    </div>

                                    <div>
                                        <span>Publicación</span>
                                        <strong>
                                            {Boolean(Number(selectedProyecto.activo))
                                                ? 'Activo'
                                                : 'Inactivo'}
                                        </strong>
                                    </div>
                                </div>

                                <div className="proyectos-detail-content">
                                    <h3>Etiquetas</h3>

                                    <EtiquetasProyecto etiquetas={selectedProyecto.etiquetas} />

                                    {(!Array.isArray(selectedProyecto.etiquetas) ||
                                        selectedProyecto.etiquetas.length === 0) && (
                                        <p>Sin etiquetas registradas.</p>
                                    )}
                                </div>

                                <div className="proyectos-detail-content">
                                    <h3>Descripción</h3>
                                    <p>{selectedProyecto.descripcion || 'Sin descripción.'}</p>
                                </div>

                                <div className="proyectos-detail-links">
                                    {selectedProyecto.url_resultado && (
                                        <a
                                            href={selectedProyecto.url_resultado}
                                            target="_blank"
                                            rel="noreferrer"
                                        >
                                            <ExternalLink size={16} />
                                            Ver resultado
                                        </a>
                                    )}

                                    {selectedProyecto.archivo?.ruta && (
                                        <a
                                            href={getFileUrl(selectedProyecto.archivo.ruta)}
                                            target="_blank"
                                            rel="noreferrer"
                                        >
                                            <FileText size={16} />
                                            Ver archivo
                                        </a>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <p className="proyectos-empty">No se pudo cargar el detalle.</p>
                        )}
                    </div>
                </div>
            )}
        </section>
    );
}

function EtiquetasProyecto({ etiquetas = [] }) {
    if (!Array.isArray(etiquetas) || etiquetas.length === 0) {
        return null;
    }

    return (
        <div className="proyectos-etiquetas-list">
            {etiquetas.map((etiqueta) => (
                <span
                    key={etiqueta.idetiqueta}
                    className="proyectos-etiqueta-badge"
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

function recortarTexto(value, max = 90) {
    const text = String(value || '').trim();

    if (!text) return 'Sin descripción.';

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

function normalizeDateInput(value) {
    if (!value) return '';

    const text = String(value);

    if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
        return text;
    }

    if (text.includes('T')) {
        return text.split('T')[0];
    }

    return '';
}