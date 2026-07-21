import { useEffect, useMemo, useState } from 'react';
import {
    Plus,
    X,
    ImagePlus,
    Pencil,
    Trash2,
    Save,
    ChevronLeft,
    ChevronRight,
    Tags,
} from 'lucide-react';

import {
    actualizarNoticia,
    crearNoticia,
    eliminarImagenNoticia,
    eliminarNoticia,
    listarNoticias,
    subirImagenNoticia,
} from '../api/noticiasApi';

import {
    listarCategorias,
    listarEstados,
    listarTiposPublicacion,
} from '../api/catalogosApi';

import {
    listarEtiquetas,
} from '../api/etiquetasApi';

import {
    closeNotify,
    getApiErrorMessage,
    notifyError,
    notifyLoading,
    notifySuccess,
} from '../utils/notify';

import '../styles/modules/noticias.css';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://127.0.0.1:8000';

const initialForm = {
    titulo: '',
    resumen: '',
    contenido: '',
    es_destacada: false,
    idcategoria: '',
    idestado: '',
    idtipopublicacion: '',
    fecha_publicacion: '',
    fecha_expiracion: '',
    etiquetas: [],
};



const MODULO_NOTICIAS_SLUG = 'noticias-comunicados';

const ESTADOS_NOTICIAS_PERMITIDOS = [
    'borrador',
    'publicado',
    'archivado',
];

const TIPOS_PUBLICACION_NOTICIAS_PERMITIDOS = [
    'noticia',
    'comunicado',
    'aviso',
    'alerta',
];

function normalize(text) {
    return String(text || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '')
        .trim();
}

function filtrarCategoriasNoticias(categorias = []) {
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
                return moduloSlug === MODULO_NOTICIAS_SLUG;
            }

            const moduloNombre = normalize(
                item?.modulo?.nombre ||
                item?.nombre_modulo ||
                ''
            );

            if (moduloNombre) {
                return (
                    moduloNombre.includes('noticia') ||
                    moduloNombre.includes('comunicado')
                );
            }

            const nombre = normalize(item?.nombre);
            const slug = normalize(item?.slug);

            return [
                'noticias',
                'noticia',
                'comunicados',
                'comunicado',
                'avisos',
                'aviso',
                'alertas',
                'alerta',
                'mantenimiento',
                'seguridad',
            ].some((key) => nombre.includes(key) || slug.includes(key));
        })
        .sort((a, b) => Number(a.orden || 0) - Number(b.orden || 0));
}

function filtrarEstadosNoticias(estados = []) {
    const permitidos = ESTADOS_NOTICIAS_PERMITIDOS.map(normalize);

    return estados
        .filter((item) => Number(item?.activo ?? 1) === 1)
        .filter((item) => {
            const slug = normalize(item?.slug);
            const nombre = normalize(item?.nombre);

            return permitidos.some(
                (key) => slug === key || nombre === key
            );
        });
}

function filtrarTiposPublicacionNoticias(tipos = []) {
    const permitidos = TIPOS_PUBLICACION_NOTICIAS_PERMITIDOS.map(normalize);

    return tipos
        .filter((item) => Number(item?.activo ?? 1) === 1)
        .filter((item) => {
            const slug = normalize(item?.slug);
            const nombre = normalize(item?.nombre);

            return permitidos.some(
                (key) => slug.includes(key) || nombre.includes(key)
            );
        });
}


export default function Noticias() {
    const [noticias, setNoticias] = useState([]);
    const [categorias, setCategorias] = useState([]);
    const [estados, setEstados] = useState([]);
    const [tiposPublicacion, setTiposPublicacion] = useState([]);
    const [etiquetas, setEtiquetas] = useState([]);

    const [form, setForm] = useState(initialForm);

    const [imagenes, setImagenes] = useState([]);
    const [previewImagenes, setPreviewImagenes] = useState([]);
    const [imagenesActuales, setImagenesActuales] = useState([]);

    const [editingId, setEditingId] = useState(null);
    const [showForm, setShowForm] = useState(false);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const isEditing = useMemo(() => Boolean(editingId), [editingId]);

    const normalizarRespuestaLista = (response) => {
        if (Array.isArray(response)) return response;

        if (Array.isArray(response?.data)) {
            return response.data;
        }

        if (Array.isArray(response?.data?.data)) {
            return response.data.data;
        }

        return [];
    };

    const cargarDatos = async () => {
        setLoading(true);

        try {
            const [
                noticiasResult,
                categoriasResult,
                estadosResult,
                tiposResult,
                etiquetasResult,
            ] = await Promise.allSettled([
                listarNoticias(),
                listarCategorias(),
                listarEstados(),
                listarTiposPublicacion(),
                listarEtiquetas(),
            ]);

            if (noticiasResult.status === 'fulfilled') {
                setNoticias(
                    normalizarRespuestaLista(noticiasResult.value)
                );
            } else {
                console.error(
                    'Error al cargar noticias:',
                    noticiasResult.reason
                );

                notifyError('No se pudieron cargar las noticias.');
            }

            if (categoriasResult.status === 'fulfilled') {
                const categoriasNormalizadas = normalizarRespuestaLista(
                    categoriasResult.value
                );

                setCategorias(filtrarCategoriasNoticias(categoriasNormalizadas));
            }else {
                console.error(
                    'Error al cargar categorías:',
                    categoriasResult.reason
                );

                notifyError('No se pudieron cargar las categorías.');
            }

            if (estadosResult.status === 'fulfilled') {
                const estadosNormalizados = normalizarRespuestaLista(
                    estadosResult.value
                );

                setEstados(filtrarEstadosNoticias(estadosNormalizados));
            }else {
                console.error(
                    'Error al cargar estados:',
                    estadosResult.reason
                );

                notifyError('No se pudieron cargar los estados.');
            }

            if (tiposResult.status === 'fulfilled') {
                const tiposNormalizados = normalizarRespuestaLista(
                    tiposResult.value
                );

                setTiposPublicacion(
                    filtrarTiposPublicacionNoticias(tiposNormalizados)
                );
            }else {
                console.error(
                    'Error al cargar tipos de publicación:',
                    tiposResult.reason
                );

                notifyError('No se pudieron cargar los tipos de publicación.');
            }

            if (etiquetasResult.status === 'fulfilled') {
                const etiquetasNormalizadas = normalizarRespuestaLista(
                    etiquetasResult.value
                );

                setEtiquetas(
                    etiquetasNormalizadas.filter(
                        (item) => Number(item?.activo ?? 1) === 1
                    )
                );
            } else {
                console.error(
                    'Error al cargar etiquetas:',
                    etiquetasResult.reason
                );

                notifyError('No se pudieron cargar las etiquetas.');
            }
        } catch (err) {
            console.error('Error inesperado al cargar datos:', err);

            notifyError(
                getApiErrorMessage(
                    err,
                    'No se pudieron cargar las noticias o los catálogos.'
                )
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        cargarDatos();
    }, []);

    useEffect(() => {
        return () => {
            previewImagenes.forEach((item) => {
                if (item?.url) {
                    URL.revokeObjectURL(item.url);
                }
            });
        };
    }, []);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;

        setForm({
            ...form,
            [name]: type === 'checkbox' ? checked : value,
        });
    };

    const getEtiquetasSeleccionadas = () => {
        return Array.isArray(form.etiquetas)
            ? form.etiquetas.map(Number)
            : [];
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

    const handleImagenesChange = (e) => {
        const files = Array.from(e.target.files || []);

        if (files.length === 0) return;

        const nuevasPreviews = files.map((file) => ({
            file,
            url: URL.createObjectURL(file),
        }));

        setImagenes((prev) => [...prev, ...files]);
        setPreviewImagenes((prev) => [...prev, ...nuevasPreviews]);

        e.target.value = '';
    };

    const handleQuitarImagenNueva = (index) => {
        setPreviewImagenes((prev) => {
            const imagen = prev[index];

            if (imagen?.url) {
                URL.revokeObjectURL(imagen.url);
            }

            return prev.filter((_, i) => i !== index);
        });

        setImagenes((prev) => prev.filter((_, i) => i !== index));
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
        previewImagenes.forEach((item) => {
            if (item?.url) {
                URL.revokeObjectURL(item.url);
            }
        });

        setForm(initialForm);
        setImagenes([]);
        setPreviewImagenes([]);
        setImagenesActuales([]);
        setEditingId(null);
    };

    const handleEdit = (noticia) => {
        setEditingId(noticia.idnoticia);
        setShowForm(true);

        setForm({
            titulo: noticia.titulo || '',
            resumen: noticia.resumen || '',
            contenido: noticia.contenido || '',
            es_destacada: Boolean(noticia.es_destacada),
            idcategoria: noticia.idcategoria || '',
            idestado: noticia.idestado || '',
            idtipopublicacion: noticia.idtipopublicacion || '',
            fecha_publicacion: formatDateTimeLocal(noticia.fecha_publicacion),
            fecha_expiracion: formatDateTimeLocal(noticia.fecha_expiracion),
            etiquetas: Array.isArray(noticia.etiquetas)
                ? noticia.etiquetas.map((item) => Number(item.idetiqueta))
                : [],
        });

        previewImagenes.forEach((item) => {
            if (item?.url) {
                URL.revokeObjectURL(item.url);
            }
        });

        setImagenes([]);
        setPreviewImagenes([]);
        setImagenesActuales(normalizarImagenesActuales(noticia));

        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const buildNoticiaPayload = () => {
        return {
            titulo: form.titulo,
            resumen: form.resumen,
            contenido: form.contenido,
            es_destacada: form.es_destacada ? 1 : 0,
            idcategoria: Number(form.idcategoria),
            idestado: Number(form.idestado),
            idtipopublicacion: Number(form.idtipopublicacion),
            fecha_publicacion: form.fecha_publicacion,
            fecha_expiracion: form.fecha_expiracion || null,
            etiquetas: Array.isArray(form.etiquetas)
                ? form.etiquetas.map(Number)
                : [],
        };
    };

    const getIdNoticiaFromResponse = (response) => {
        return (
            response?.data?.idnoticia ||
            response?.data?.noticia?.idnoticia ||
            response?.data?.data?.idnoticia ||
            response?.noticia?.idnoticia ||
            response?.idnoticia ||
            null
        );
    };

    const getImagenesRawNoticia = (noticia) => {
        const posiblesImagenes =
            noticia.imagenes ||
            noticia.noticias_imagen ||
            noticia.noticiasImagen ||
            noticia.imagenes_noticia ||
            noticia.imagenesNoticia ||
            [];

        return Array.isArray(posiblesImagenes) ? posiblesImagenes : [];
    };

    const getIdImagen = (imagen) => {
        return (
            imagen?.idnoticiaimagen ||
            imagen?.idnoticia_imagen ||
            imagen?.idimagen ||
            imagen?.id ||
            null
        );
    };

    const normalizarImagenesActuales = (noticia) => {
        return getImagenesRawNoticia(noticia)
            .map((imagen) => {
                const idimagen = getIdImagen(imagen);

                const ruta =
                    imagen?.url ||
                    imagen?.ruta ||
                    imagen?.imagen_url ||
                    imagen?.archivo?.url ||
                    imagen?.archivo?.ruta ||
                    imagen?.archivo?.nombre_guardado ||
                    null;

                return {
                    idimagen,
                    url: buildImageUrl(ruta),
                    texto_alternativo:
                        imagen?.texto_alternativo ||
                        imagen?.descripcion ||
                        noticia.titulo,
                };
            })
            .filter((imagen) => imagen.idimagen && imagen.url);
    };

    const subirImagenesDeNoticia = async (idnoticia) => {
        if (!idnoticia || imagenes.length === 0) return;

        for (let index = 0; index < imagenes.length; index += 1) {
            const payloadImagen = new FormData();

            payloadImagen.append('imagen', imagenes[index]);
            payloadImagen.append('texto_alternativo', form.titulo);
            payloadImagen.append('descripcion', form.resumen || '');

            const debeSerPortada = !isEditing && index === 0;

            payloadImagen.append('es_portada', debeSerPortada ? '1' : '0');

            const ordenBase = isEditing ? imagenesActuales.length : 0;

            payloadImagen.append('orden', String(ordenBase + index + 1));

            await subirImagenNoticia(idnoticia, payloadImagen);
        }
    };

    const eliminarImagenesDeNoticia = async (noticia) => {
        const imagenesNoticia = getImagenesRawNoticia(noticia);

        if (imagenesNoticia.length === 0) return;

        for (const imagen of imagenesNoticia) {
            const idimagen = getIdImagen(imagen);

            if (idimagen) {
                await eliminarImagenNoticia(idimagen);
            }
        }
    };

    const handleEliminarImagenActual = async (idimagen) => {
        const ok = confirm('¿Eliminar esta imagen de la noticia?');

        if (!ok) return;

        const toastId = notifyLoading('Eliminando imagen...');

        try {
            await eliminarImagenNoticia(idimagen);

            setImagenesActuales((prev) =>
                prev.filter((imagen) => imagen.idimagen !== idimagen)
            );

            notifySuccess('Imagen eliminada correctamente.');
        } catch (err) {
            notifyError(
                getApiErrorMessage(
                    err,
                    'No se pudo eliminar la imagen.'
                )
            );
        } finally {
            closeNotify(toastId);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        setSaving(true);

        const toastId = notifyLoading(
            isEditing ? 'Actualizando noticia...' : 'Registrando noticia...'
        );

        try {

            const categoriaValida = categorias.some(
                (item) => Number(item.idcategoria) === Number(form.idcategoria)
            );

            const estadoValido = estados.some(
                (item) => Number(item.idestado) === Number(form.idestado)
            );

            const tipoValido = tiposPublicacion.some(
                (item) =>
                    Number(item.idtipopublicacion) ===
                    Number(form.idtipopublicacion)
            );

            if (!categoriaValida) {
                throw new Error('Selecciona una categoría válida para noticias.');
            }

            if (!estadoValido) {
                throw new Error('Selecciona un estado válido para noticias.');
            }

            if (!tipoValido) {
                throw new Error('Selecciona un tipo de publicación válido para noticias.');
            }

            const payloadNoticia = buildNoticiaPayload();

            if (isEditing) {
                await actualizarNoticia(editingId, payloadNoticia);

                if (imagenes.length > 0) {
                    await subirImagenesDeNoticia(editingId);
                }

                notifySuccess('Noticia actualizada correctamente.');
            } else {
                const response = await crearNoticia(payloadNoticia);
                const idnoticia = getIdNoticiaFromResponse(response);

                if (!idnoticia) {
                    console.log('Respuesta de crear noticia:', response);

                    throw new Error(
                        'La noticia se registró, pero el backend no devolvió el idnoticia.'
                    );
                }

                if (imagenes.length > 0) {
                    await subirImagenesDeNoticia(idnoticia);
                }

                notifySuccess('Noticia registrada correctamente.');
            }

            cerrarFormulario();
            await cargarDatos();
        } catch (err) {
            notifyError(
                getApiErrorMessage(
                    err,
                    'No se pudo guardar la noticia o sus imágenes.'
                )
            );
        } finally {
            closeNotify(toastId);
            setSaving(false);
        }
    };

    const handleDelete = async (noticia) => {
        const ok = confirm(
            `¿Eliminar la noticia "${noticia.titulo}"?\n\nPrimero se eliminarán sus imágenes asociadas.`
        );

        if (!ok) return;

        const toastId = notifyLoading('Eliminando imágenes y noticia...');

        try {
            await eliminarImagenesDeNoticia(noticia);
            await eliminarNoticia(noticia.idnoticia);

            notifySuccess('Noticia e imágenes eliminadas correctamente.');
            await cargarDatos();
        } catch (err) {
            notifyError(
                getApiErrorMessage(
                    err,
                    'No se pudo eliminar la noticia o sus imágenes.'
                )
            );
        } finally {
            closeNotify(toastId);
        }
    };

    return (
        <section className="noticias-page">
            <div className="noticias-header">
                <div>
                    <span className="noticias-eyebrow">Contenido del portal</span>
                    <h1>Noticias y comunicados</h1>
                    <p>
                        Administra las noticias, comunicados, alertas institucionales
                        e imágenes del portal DSTI.
                    </p>
                </div>

                {!showForm && (
                    <button
                        type="button"
                        className="noticias-add-button"
                        onClick={abrirFormularioCrear}
                    >
                        <Plus size={18} />
                        Agregar noticia
                    </button>
                )}
            </div>

            {showForm && (
                <div className="noticias-form-card">
                    <div className="noticias-form-header">
                        <div>
                            <h2>{isEditing ? 'Editar noticia' : 'Agregar noticia'}</h2>
                            <p>
                                Completa la información principal, clasificación,
                                etiquetas, fechas e imágenes relacionadas.
                            </p>
                        </div>

                        <button
                            type="button"
                            className="noticias-close-button"
                            onClick={cerrarFormulario}
                        >
                            <X size={18} />
                        </button>
                    </div>

                    <form className="noticias-form" onSubmit={handleSubmit}>
                        <div className="noticias-form-grid">
                            <div className="noticias-field span-2">
                                <label>Título</label>
                                <input
                                    name="titulo"
                                    value={form.titulo}
                                    onChange={handleChange}
                                    maxLength={200}
                                    placeholder="Ej. Mantenimiento programado del Sistema Académico"
                                    required
                                />
                            </div>

                            <div className="noticias-field span-2">
                                <label>Resumen</label>
                                <textarea
                                    name="resumen"
                                    value={form.resumen}
                                    onChange={handleChange}
                                    maxLength={300}
                                    placeholder="Resumen breve que se mostrará en el listado público."
                                    required
                                />
                            </div>

                            <div className="noticias-field span-2">
                                <label>Contenido</label>
                                <textarea
                                    name="contenido"
                                    value={form.contenido}
                                    onChange={handleChange}
                                    rows={7}
                                    placeholder="Contenido completo de la noticia o comunicado."
                                    required
                                />
                            </div>

                            <div className="noticias-field">
                                <label>Categoría</label>
                                <select
                                    name="idcategoria"
                                    value={form.idcategoria}
                                    onChange={handleChange}
                                    required
                                >
                                    <option value="">Seleccione</option>
                                    {categorias.map((item) => (
                                        <option
                                            key={item.idcategoria}
                                            value={item.idcategoria}
                                        >
                                            {item.nombre}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="noticias-field">
                                <label>Estado</label>
                                <select
                                    name="idestado"
                                    value={form.idestado}
                                    onChange={handleChange}
                                    required
                                >
                                    <option value="">Seleccione</option>
                                    {estados.map((item) => (
                                        <option
                                            key={item.idestado}
                                            value={item.idestado}
                                        >
                                            {item.nombre}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="noticias-field">
                                <label>Tipo de publicación</label>
                                <select
                                    name="idtipopublicacion"
                                    value={form.idtipopublicacion}
                                    onChange={handleChange}
                                    required
                                >
                                    <option value="">Seleccione</option>
                                    {tiposPublicacion.map((item) => (
                                        <option
                                            key={item.idtipopublicacion}
                                            value={item.idtipopublicacion}
                                        >
                                            {item.nombre}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="noticias-field span-2">
                                <label>Etiquetas</label>

                                {etiquetas.length === 0 ? (
                                    <small className="noticias-help-text">
                                        No hay etiquetas activas registradas.
                                    </small>
                                ) : (
                                    <div className="noticias-etiquetas-selector">
                                        {etiquetas.map((etiqueta) => {
                                            const seleccionadas =
                                                getEtiquetasSeleccionadas();

                                            const activa = seleccionadas.includes(
                                                Number(etiqueta.idetiqueta)
                                            );

                                            return (
                                                <button
                                                    type="button"
                                                    key={etiqueta.idetiqueta}
                                                    className={`noticias-etiqueta-chip ${
                                                        activa ? 'is-active' : ''
                                                    }`}
                                                    onClick={() =>
                                                        handleToggleEtiqueta(
                                                            etiqueta.idetiqueta
                                                        )
                                                    }
                                                    style={{
                                                        '--etiqueta-color':
                                                            etiqueta.color || '#2563eb',
                                                    }}
                                                >
                                                    <Tags size={13} />
                                                    <span>{etiqueta.nombre}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}

                                <small className="noticias-help-text">
                                    Selecciona una o más etiquetas para relacionar esta noticia
                                    con temas transversales del portal.
                                </small>
                            </div>

                            <div className="noticias-field">
                                <label>Fecha de publicación</label>
                                <input
                                    type="datetime-local"
                                    name="fecha_publicacion"
                                    value={form.fecha_publicacion}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className="noticias-field">
                                <label>Fecha de expiración</label>
                                <input
                                    type="datetime-local"
                                    name="fecha_expiracion"
                                    value={form.fecha_expiracion}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="noticias-field span-2">
                                <label>Imágenes de la noticia</label>

                                <label className="noticias-upload-box">
                                    <ImagePlus size={28} />
                                    <span>Seleccionar imágenes</span>
                                    <small>
                                        Puedes seleccionar varias imágenes PNG, JPG, JPEG o WEBP
                                    </small>

                                    <input
                                        type="file"
                                        accept="image/png,image/jpeg,image/jpg,image/webp"
                                        multiple
                                        onChange={handleImagenesChange}
                                    />
                                </label>

                                {isEditing && imagenesActuales.length > 0 && (
                                    <>
                                        <small className="noticias-current-title">
                                            Imágenes actuales registradas
                                        </small>

                                        <div className="noticias-preview-grid">
                                            {imagenesActuales.map((imagen) => (
                                                <div
                                                    className="noticias-preview-item"
                                                    key={imagen.idimagen}
                                                >
                                                    <img
                                                        src={imagen.url}
                                                        alt={imagen.texto_alternativo}
                                                    />

                                                    <button
                                                        type="button"
                                                        className="noticias-preview-delete"
                                                        onClick={() =>
                                                            handleEliminarImagenActual(
                                                                imagen.idimagen
                                                            )
                                                        }
                                                    >
                                                        <Trash2 size={15} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                )}

                                {previewImagenes.length > 0 && (
                                    <>
                                        <small className="noticias-current-title">
                                            Nuevas imágenes seleccionadas
                                        </small>

                                        <div className="noticias-preview-grid">
                                            {previewImagenes.map((item, index) => (
                                                <div
                                                    className="noticias-preview-item"
                                                    key={`${item.file.name}-${item.file.lastModified}-${index}`}
                                                >
                                                    <img
                                                        src={item.url}
                                                        alt={item.file.name}
                                                    />

                                                    <button
                                                        type="button"
                                                        className="noticias-preview-delete"
                                                        onClick={() =>
                                                            handleQuitarImagenNueva(index)
                                                        }
                                                    >
                                                        <Trash2 size={15} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>

                            <label className="noticias-checkbox span-2">
                                <input
                                    type="checkbox"
                                    name="es_destacada"
                                    checked={form.es_destacada}
                                    onChange={handleChange}
                                />
                                Marcar como noticia destacada
                            </label>
                        </div>

                        <div className="noticias-form-actions">
                            <button
                                type="submit"
                                className="noticias-save-button"
                                disabled={saving}
                            >
                                <Save size={17} />
                                {saving
                                    ? 'Guardando...'
                                    : isEditing
                                        ? 'Actualizar noticia'
                                        : 'Guardar noticia'}
                            </button>

                            <button
                                type="button"
                                className="noticias-cancel-button"
                                onClick={cerrarFormulario}
                            >
                                Cancelar
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="noticias-list-card">
                <div className="noticias-list-header">
                    <div>
                        <h2>Noticias registradas</h2>
                        <p>Listado de noticias publicadas o preparadas para el portal.</p>
                    </div>
                </div>

                {loading ? (
                    <p className="noticias-empty">Cargando noticias...</p>
                ) : noticias.length === 0 ? (
                    <div className="noticias-empty-box">
                        <h3>No hay noticias registradas</h3>
                        <p>
                            Usa el botón “Agregar noticia” para crear la primera publicación.
                        </p>
                    </div>
                ) : (
                    <div className="noticias-grid">
                        {noticias.map((noticia) => (
                            <article
                                className="noticia-card"
                                key={noticia.idnoticia}
                            >
                                <NoticiaCarousel noticia={noticia} />

                                <div className="noticia-body">
                                    <div className="noticia-tags">
                                        <span>
                                            {noticia.tipo_publicacion?.nombre ||
                                                noticia.tipoPublicacion?.nombre ||
                                                'Publicación'}
                                        </span>

                                        {noticia.es_destacada ? (
                                            <strong>Destacada</strong>
                                        ) : null}
                                    </div>

                                    <h3>{noticia.titulo}</h3>

                                    <EtiquetasNoticia etiquetas={noticia.etiquetas} />

                                    <p>{noticia.resumen}</p>

                                    <div className="noticia-meta">
                                        <span>
                                            Categoría: {noticia.categoria?.nombre || '-'}
                                        </span>
                                        <span>
                                            Estado: {noticia.estado?.nombre || '-'}
                                        </span>
                                        <span>
                                            Publicación: {formatDate(noticia.fecha_publicacion)}
                                        </span>
                                    </div>

                                    <div className="noticia-actions">
                                        <button
                                            type="button"
                                            onClick={() => handleEdit(noticia)}
                                        >
                                            <Pencil size={16} />
                                            Editar
                                        </button>

                                        <button
                                            type="button"
                                            className="danger"
                                            onClick={() => handleDelete(noticia)}
                                        >
                                            <Trash2 size={16} />
                                            Eliminar
                                        </button>
                                    </div>
                                </div>
                            </article>
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
}

function EtiquetasNoticia({ etiquetas = [] }) {
    if (!Array.isArray(etiquetas) || etiquetas.length === 0) {
        return null;
    }

    return (
        <div className="noticia-etiquetas-list">
            {etiquetas.map((etiqueta) => (
                <span
                    key={etiqueta.idetiqueta}
                    className="noticia-etiqueta-badge"
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

function NoticiaCarousel({ noticia }) {
    const imagenes = getImagenesNoticia(noticia);
    const [current, setCurrent] = useState(0);

    useEffect(() => {
        setCurrent(0);
    }, [noticia.idnoticia, imagenes.length]);

    useEffect(() => {
        if (imagenes.length <= 1) return undefined;

        const interval = setInterval(() => {
            setCurrent((prev) => (prev + 1) % imagenes.length);
        }, 3500);

        return () => clearInterval(interval);
    }, [imagenes.length]);

    if (imagenes.length === 0) {
        return (
            <div className="noticia-carousel noticia-carousel-empty">
                <span>Sin imagen</span>
            </div>
        );
    }

    const goPrev = () => {
        setCurrent((prev) => (prev === 0 ? imagenes.length - 1 : prev - 1));
    };

    const goNext = () => {
        setCurrent((prev) => (prev + 1) % imagenes.length);
    };

    return (
        <div className="noticia-carousel">
            <img
                src={imagenes[current]}
                alt={noticia.titulo}
                onError={(e) => {
                    e.currentTarget.style.display = 'none';
                }}
            />

            {imagenes.length > 1 && (
                <>
                    <button
                        type="button"
                        className="carousel-btn carousel-prev"
                        onClick={goPrev}
                    >
                        <ChevronLeft size={20} />
                    </button>

                    <button
                        type="button"
                        className="carousel-btn carousel-next"
                        onClick={goNext}
                    >
                        <ChevronRight size={20} />
                    </button>

                    <div className="carousel-dots">
                        {imagenes.map((_, index) => (
                            <button
                                type="button"
                                key={index}
                                className={index === current ? 'active' : ''}
                                onClick={() => setCurrent(index)}
                            />
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}

function buildImageUrl(path) {
    if (!path) return null;

    if (path.startsWith('http://') || path.startsWith('https://')) {
        return path;
    }

    let cleanPath = path;

    cleanPath = cleanPath.replace(/^public\//, '');
    cleanPath = cleanPath.replace(/^storage\//, '');
    cleanPath = cleanPath.replace(/^\/storage\//, '');
    cleanPath = cleanPath.replace(/^\//, '');

    return `${BACKEND_URL}/storage/${cleanPath}`;
}

function getImagenesNoticia(noticia) {
    const posiblesImagenes =
        noticia.imagenes ||
        noticia.noticias_imagen ||
        noticia.noticiasImagen ||
        noticia.imagenes_noticia ||
        noticia.imagenesNoticia ||
        [];

    const imagenesDesdeRelacion = Array.isArray(posiblesImagenes)
        ? posiblesImagenes
            .map((item) => {
                return (
                    item.url ||
                    item.ruta ||
                    item.imagen_url ||
                    item.archivo?.url ||
                    item.archivo?.ruta ||
                    item.archivo?.nombre_guardado ||
                    null
                );
            })
            .filter(Boolean)
            .map(buildImageUrl)
        : [];

    const imagenDirecta = [
        noticia.imagen_portada_url,
        noticia.portada_url,
        noticia.imagen_url,
        noticia.archivo?.url,
        noticia.archivo?.ruta,
    ]
        .filter(Boolean)
        .map(buildImageUrl);

    return [...imagenesDesdeRelacion, ...imagenDirecta].filter(Boolean);
}

function formatDate(value) {
    if (!value) return '-';

    return new Date(value).toLocaleString('es-PE', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
    });
}

function formatDateTimeLocal(value) {
    if (!value) return '';

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return '';
    }

    const offset = date.getTimezoneOffset();
    const localDate = new Date(date.getTime() - offset * 60 * 1000);

    return localDate.toISOString().slice(0, 16);
}