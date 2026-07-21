
import {
    useEffect,
    useMemo,
    useState,
    useReducer,
    lazy,
    Suspense,
    useRef,
    useCallback,
    memo,
} from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import "../../styles/public/portal.css";

import {
    getPublicInicio,
    getPublicCatalogos,
    getPublicInstitucional,
    getPublicAutoridades,
    getPublicProyectos,
    getPublicServicios,
    getPublicSistemas,
    getPublicNoticias,
    getPublicDocumentos,
    getPublicEventos,
    getPublicTutoriales,
    getPublicFaqs,
    registrarPublicSoporte,
} from "../../api/publicApi.js";

import { obtenerConfiguracionPublica } from "../../api/configuracionApi";
import PortalErrorBoundary from "../../components/portal/PortalErrorBoundary";
import PortalPlaceholderIcon from "../../components/portal/PortalPlaceholderIcon";
import { Mail, Phone } from "lucide-react";

// ── Lazy components ───────────────────────────────────────────────────────────
const ResourceViewerModal = lazy(() => import("../../components/portal/ResourceViewerModal"));
const NoticiaModal         = lazy(() => import("../../components/portal/NoticiaModal"));
const NewsShowcase         = lazy(() => import("../../components/portal/NewsShowcase"));
const SystemsPanel         = lazy(() => import("../../components/portal/SystemsPanel"));
const ProjectTimeline      = lazy(() => import("../../components/portal/ProjectTimeline"));
const DocumentList         = lazy(() => import("../../components/portal/DocumentList"));
const EventAgenda          = lazy(() => import("../../components/portal/EventAgenda"));
const TutorialRail         = lazy(() => import("../../components/portal/TutorialRail"));
const ServiceShowcase      = lazy(() => import("../../components/portal/ServiceShowcase"));
const FaqList              = lazy(() => import("../../components/portal/FaqList"));

// ── Constantes (fuera del componente = sin recreación en cada render) ─────────
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://127.0.0.1:8000";

const INSTITUCION = {
    nombre_corto:     "Portal DSTI",
    subtitulo_logo:   "Dirección de Sistemas",
    nombre_completo:  "Dirección de Sistemas y Tecnologías de Información",
    hero_titulo:      "Tecnología al servicio",
    hero_titulo_acento: "de la comunidad universitaria",
    hero_descripcion: "Plataforma oficial de servicios digitales, sistemas institucionales, documentos, capacitaciones y soporte técnico para toda nuestra comunidad académica.",
    hero_etiqueta:    "Portal Web Institucional",
    hero_btn_primario:   { texto: "Solicitar soporte", href: "#soporte" },
    hero_btn_secundario: { texto: "Ver servicios",     href: "#servicios" },
    contacto_telefono:   "(043) 640020 — Anexo 3450",
    contacto_email:      "ogtiseunasam@unasam.edu.pe",
    footer_descripcion:  "Comprometidos con la transformación digital y la mejora continua de los servicios tecnológicos de nuestra institución.",
};

const SECTION_MODULE = {
    institucional: "institucional",
    autoridades:   "institucional",
    noticias:      "noticias-comunicados",
    servicios:     "servicios-tecnologicos",
    sistemas:      "sistemas-institucionales",
    documentos:    "documentos-manuales",
    eventos:       "eventos-capacitaciones",
    tutoriales:    "tutoriales-recursos",
    faqs:          "tutoriales-recursos",
    proyectos:     "proyectos-tecnologicos",
    soporte:       "mesa-ayuda",
};

const MODULE_SECTION = {
    "institucional":            "institucional",
    "noticias-comunicados":     "noticias",
    "servicios-tecnologicos":   "servicios",
    "sistemas-institucionales": "sistemas",
    "documentos-manuales":      "documentos",
    "eventos-capacitaciones":   "eventos",
    "tutoriales-recursos":      "tutoriales",
    "proyectos-tecnologicos":   "proyectos",
    "mesa-ayuda":               "soporte",
};


const NAV_GROUPS = [
    {
        label: "Institucional",
        href: "#institucional",
        sections: ["institucional", "autoridades"],
        items: [
            {
                label: "Información institucional",
                href: "#institucional",
                sectionId: "institucional",
                kind: "anchor",
                featured: true,
                always: true,
            },
            {
                label: "Autoridades",
                href: "#autoridades",
                sectionId: "autoridades",
                kind: "anchor",
                featured: true,
                always: true,
            },
        ],
    },
    {
        label: "Servicios",
        href: "#servicios",
        sections: ["servicios", "sistemas"],
        modules: [
            {
                slug: "servicios-tecnologicos",
                label: "Servicios tecnológicos",
                href: "#servicios",
                sectionId: "servicios",
                showCategories: false,
            },
            {
                slug: "sistemas-institucionales",
                label: "Sistemas institucionales",
                href: "#sistemas",
                sectionId: "sistemas",
                showCategories: false,
            },
        ],
    },
    {
        label: "Publicaciones",
        href: "#noticias",
        sections: ["noticias", "documentos", "eventos"],
        modules: [
            {
                slug: "noticias-comunicados",
                label: "Noticias y comunicados",
                href: "#noticias",
                sectionId: "noticias",
                showCategories: false,
            },
            {
                slug: "documentos-manuales",
                label: "Documentos y manuales",
                href: "#documentos",
                sectionId: "documentos",
                showCategories: false,
            },
            {
                slug: "eventos-capacitaciones",
                label: "Eventos y capacitaciones",
                href: "#eventos",
                sectionId: "eventos",
                showCategories: false,
            },
        ],
    },
    {
        label: "Proyectos",
        href: "#proyectos",
        sections: ["proyectos"],
        modules: [
            {
                slug: "proyectos-tecnologicos",
                label: "Proyectos tecnológicos",
                href: "#proyectos",
                sectionId: "proyectos",
                showCategories: true,
            },
        ],
    },
    {
        label: "Recursos",
        href: "#tutoriales",
        sections: ["tutoriales", "faqs"],
        modules: [
            {
                slug: "tutoriales-recursos",
                label: "Tutoriales y recursos",
                href: "#tutoriales",
                sectionId: "tutoriales",
                showCategories: true,
            },
        ],
        items: [
            {
                label: "Preguntas frecuentes",
                href: "#faqs",
                sectionId: "faqs",
                kind: "anchor",
                featured: true,
                always: true,
            },
        ],
    },
    {
        label: "¡Ayuda!",
        href: "#soporte",
        sections: ["soporte"],
        modules: [
            {
                slug: "mesa-ayuda",
                label: "Mesa de ayuda",
                href: "#soporte",
                sectionId: "soporte",
                showCategories: false,
            },
        ],
    },
];

const EXCLUDED_NAV_MODULES = new Set(["catalogos", "seguridad"]);
const EXCLUDED_INSTITUCIONAL_SLUGS = new Set(["informacion-institucional"]);

const SECTION_PER_PAGE_DEFAULT = {
    noticias:   9,
    servicios:  9,
    sistemas:   12,
    proyectos:  9,
    documentos: 10,
    eventos:    9,
    tutoriales: 9,
    faqs:       20,
};

const STALE_LARGO  = 10 * 60 * 1000;
const STALE_MEDIO  =  3 * 60 * 1000;
const STALE_CORTO  =  2 * 60 * 1000;
const GC_LARGO     = 30 * 60 * 1000;
const GC_MEDIO     = 15 * 60 * 1000;

// Claves para parsear la info institucional
const CLAVES_INSTITUCIONALES = [
    { key: "descripcion", label: "Descripción institucional", aliases: ["descripcion institucional", "descripcion", "acerca de", "sobre nosotros", "quienes somos"] },
    { key: "mision",      label: "Misión",   aliases: ["mision"] },
    { key: "vision",      label: "Visión",   aliases: ["vision"] },
    { key: "valores",     label: "Valores",  aliases: ["valores", "nuestros valores", "principios"] },
];
const SLUGS_INSTITUCIONALES = new Set(
    CLAVES_INSTITUCIONALES.flatMap((c) => c.aliases)
);

// ── Caches de items (WeakMap no bloquea GC) ───────────────────────────────────
const imageCache       = new WeakMap();
const fileUrlCache     = new WeakMap();
const titleCache       = new WeakMap();
const descriptionCache = new WeakMap();

// ── Helpers puros (sin dependencias del componente) ───────────────────────────
function normalize(text) {
    return String(text || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/\p{Diacritic}/gu, "")
        .trim();
}

function cfgText(value, fallback = "") {
    return value !== undefined && value !== null && String(value).trim() !== ""
        ? value
        : fallback;
}

function cfgBool(value, fallback = false) {
    if (value === undefined || value === null || value === "") return fallback;
    return ["1", "true", "si", "sí", "on"].includes(String(value).toLowerCase());
}

function cfgNumber(value, fallback = 0) {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
}

// Desempaqueta la respuesta Laravel { success, message, data } o directa
function unwrapData(response, fallback = {}) {
    const payload = response?.data ?? response;
    if (payload === undefined || payload === null) return fallback;
    if (Object.prototype.hasOwnProperty.call(Object(payload), "data")) {
        return payload.data ?? fallback;
    }
    return payload;
}

function getResponseData(response) {
    const data = unwrapData(response, {});
    return data && typeof data === "object" && !Array.isArray(data) ? data : {};
}

function sanitizeList(items) {
    return Array.isArray(items)
        ? items.filter((item) => item && typeof item === "object")
        : [];
}

function getList(response) {
    const payload = unwrapData(response, response);
    if (Array.isArray(payload))             return sanitizeList(payload);
    if (Array.isArray(payload?.data))       return sanitizeList(payload.data);
    if (Array.isArray(payload?.data?.data)) return sanitizeList(payload.data.data);
    if (Array.isArray(payload?.items))      return sanitizeList(payload.items);
    return [];
}

function getStorageUrl(path) {
    if (!path || typeof path !== "string") {
        return null;
    }

    const value = path.trim();

    if (!value) {
        return null;
    }

    const backendBase = BACKEND_URL.replace(/\/+$/, "");

    /*
     * Corrige URLs absolutas generadas con APP_URL incorrecto:
     * http://localhost/storage/archivo.jpg
     * http://localhost:80/storage/archivo.jpg
     */
    if (
        value.startsWith("http://") ||
        value.startsWith("https://")
    ) {
        try {
            const parsedUrl = new URL(value);

            const esLocalhostIncorrecto =
                parsedUrl.hostname === "localhost" ||
                parsedUrl.hostname === "127.0.0.1";

            const esArchivoStorage =
                parsedUrl.pathname.startsWith("/storage/") ||
                parsedUrl.pathname.startsWith("/public/storage/");

            if (esLocalhostIncorrecto && esArchivoStorage) {
                const pathname = parsedUrl.pathname
                    .replace(/^\/public\/storage\//, "/storage/")
                    .replace(/\/+/g, "/");

                return `${backendBase}${pathname}${parsedUrl.search}`;
            }

            return value;
        } catch (error) {
            console.error(
                "URL de archivo inválida:",
                value,
                error
            );

            return null;
        }
    }

    let cleanPath = value.replace(/\\/g, "/");

    cleanPath = cleanPath
        .replace(/^\/?public\/storage\//i, "")
        .replace(/^\/?public\//i, "")
        .replace(/^\/?storage\//i, "")
        .replace(/^\/+/, "");

    return `${backendBase}/storage/${cleanPath}`;
}

function getDocSlugFromHref(href) {
    if (!href || typeof href !== "string") return null;

    const value = href.trim();

    // Formato recomendado: #doc:slug-del-documento
    const docMatch = value.match(/^#doc:(.+)$/i);
    if (docMatch) return docMatch[1].trim();

    // Formato alternativo: #slug-del-documento
    // Evita capturar secciones normales del portal
    const sectionAnchors = new Set([
        "#inicio",
        "#institucional",
        "#autoridades",
        "#servicios",
        "#sistemas",
        "#noticias",
        "#proyectos",
        "#documentos",
        "#eventos",
        "#tutoriales",
        "#faqs",
        "#soporte",
    ]);

    if (value.startsWith("#") && !sectionAnchors.has(value.toLowerCase())) {
        return value.replace(/^#/, "").trim();
    }

    return null;
}

// ── Extractores de datos de items ─────────────────────────────────────────────
function getArchivo(item) {
    return item?.archivo || item?.file || item?.documento || item?.recurso || null;
}

function getArchivoRuta(item) {
    const a = getArchivo(item);
    return a?.ruta || a?.path || a?.url
        || item?.archivo_url || item?.url_archivo
        || item?.documento_url || item?.recurso_url
        || null;
}

function getImageCandidateFromArchivo(archivo) {
    if (!archivo) return null;
    const mime = String(archivo?.mime_type || archivo?.mime || "");
    const ext  = String(archivo?.extension || "").toLowerCase();
    const isImg = mime.startsWith("image/") || ["jpg","jpeg","png","webp","gif","svg"].includes(ext);
    return isImg ? (archivo?.ruta || archivo?.path || archivo?.url || null) : null;
}

function getFirstImageFromArray(item) {
    const imgs = item?.imagenes || item?.images || item?.galeria
        || item?.noticias_imagen || item?.noticia_imagen
        || item?.noticiasImagen || item?.imagenes_noticia
        || item?.imagenesNoticia || [];
    if (!Array.isArray(imgs) || imgs.length === 0) return null;
    const portada = imgs.find((i) => Number(i?.es_portada) === 1) || imgs[0];
    return portada?.archivo?.url || portada?.archivo?.ruta
        || portada?.archivo?.nombre_guardado
        || portada?.url || portada?.ruta || portada?.path
        || portada?.imagen_url || null;
}

function getImagenesNoticia(item) {
    const rel = item?.imagenes || item?.noticias_imagen || item?.noticiasImagen
        || item?.imagenes_noticia || item?.imagenesNoticia || [];
    const desdeRelacion = Array.isArray(rel)
        ? rel.map((img) =>
            img?.url || img?.ruta || img?.imagen_url
            || img?.archivo?.url || img?.archivo?.ruta
            || img?.archivo?.nombre_guardado || null
        ).filter(Boolean).map(getStorageUrl).filter(Boolean)
        : [];
    const directas = [
        item?.imagen_portada_url, item?.portada_url, item?.imagen_url,
        item?.imagen_portada?.url, item?.imagen_portada?.ruta,
        item?.imagen?.url, item?.imagen?.ruta,
        item?.archivo?.url, item?.archivo?.ruta,
    ].filter(Boolean).map(getStorageUrl).filter(Boolean);
    return [...desdeRelacion, ...directas];
}

function getImageUrl(item) {
    if (!item || typeof item !== "object") return null;
    if (imageCache.has(item)) return imageCache.get(item);
    const noticia = getImagenesNoticia(item);
    const archivoImg = getImageCandidateFromArchivo(getArchivo(item));
    const url = noticia[0] || getStorageUrl(
        item?.imagen_url || item?.foto_url || item?.banner_url
        || item?.thumbnail || item?.portada
        || item?.imagen_portada?.url || item?.imagen_portada?.ruta
        || item?.imagen?.url || item?.imagen?.ruta
        || item?.foto?.url || item?.foto?.ruta
        || getFirstImageFromArray(item) || archivoImg
    );
    imageCache.set(item, url);
    return url;
}

function getFileUrl(item) {
    if (!item || typeof item !== "object") return null;
    if (fileUrlCache.has(item)) return fileUrlCache.get(item);
    const url = getStorageUrl(
        getArchivoRuta(item)
        || item?.url_externa || item?.url || item?.enlace
        || item?.enlace_video || item?.video_url
        || item?.html_url || item?.recurso_html
        || null
    );
    fileUrlCache.set(item, url);
    return url;
}

function getFileExtension(item) {
    const a = getArchivo(item);
    const ext = a?.extension || item?.extension
        || String(getFileUrl(item) || "").split("?")[0].split(".").pop();
    if (!ext || String(ext).length > 8) return "";
    return String(ext).toUpperCase();
}

function getFileSize(item) {
    const a = getArchivo(item);
    const bytes = a?.peso_bytes || a?.size || a?.tamano;
    if (!bytes) return "";
    const v = Number(bytes);
    if (Number.isNaN(v)) return "";
    if (v < 1024)        return `${v} B`;
    if (v < 1048576)     return `${(v / 1024).toFixed(1)} KB`;
    return `${(v / 1048576).toFixed(1)} MB`;
}

function getMimeType(item) {
    const a = getArchivo(item);
    return a?.mime_type || a?.mime || item?.mime_type || item?.mime || "";
}

function getResourceKind(item) {
    const url  = getFileUrl(item);
    const mime = String(getMimeType(item)).toLowerCase();
    const ext  = String(getFileExtension(item)).toLowerCase();
    const raw  = String(url || "").toLowerCase();
    if (!url) return "none";
    if (mime.includes("pdf") || ext === "pdf") return "pdf";
    if (mime.startsWith("video/") || ["mp4","webm","ogg","mov","m4v"].includes(ext)) return "video";
    if (mime.startsWith("image/") || ["jpg","jpeg","png","webp","gif","svg"].includes(ext)) return "image";
    if (mime.includes("html") || ["html","htm"].includes(ext)) return "html";
    if (raw.includes("youtube.com") || raw.includes("youtu.be") || raw.includes("vimeo.com")) return "external-video";
    if (raw.startsWith("http://") || raw.startsWith("https://")) return "link";
    return "download";
}

const ACTION_TEXT_MAP = {
    pdf: "Leer PDF", video: "Ver video", "external-video": "Ver video",
    image: "Ver imagen", html: "Ver contenido", link: "Ver enlace",
};
const SECTION_ACTION_MAP = {
    documentos: "Leer documento", eventos: "Ver evento", tutoriales: "Ver tutorial",
    proyectos: "Ver proyecto", servicios: "Ver servicio", sistemas: "Acceder",
    noticias: "Leer comunicado",
};
function getResourceActionText(item, type = "") {
    return ACTION_TEXT_MAP[getResourceKind(item)] || SECTION_ACTION_MAP[type] || "Ver más";
}

function getYoutubeEmbedUrl(url) {
    if (!url) return null;
    try {
        const v = String(url);
        if (v.includes("youtu.be/")) {
            const id = v.split("youtu.be/")[1]?.split(/[?&]/)[0];
            return id ? `https://www.youtube.com/embed/${id}` : url;
        }
        const parsed = new URL(v);
        const id = parsed.searchParams.get("v");
        if (id) return `https://www.youtube.com/embed/${id}`;
        if (v.includes("/embed/")) return v;
        return url;
    } catch { return url; }
}

function getViewerUrl(item) {
    const kind = getResourceKind(item);
    const url  = getFileUrl(item);
    return kind === "external-video" ? getYoutubeEmbedUrl(url) : url;
}

function getTitle(item) {
    if (!item || typeof item !== "object") return "";
    if (titleCache.has(item)) return titleCache.get(item);
    const t = item?.titulo || item?.nombre || item?.nombre_sistema
        || item?.nombre_completo || item?.pregunta || item?.asunto || "";
    titleCache.set(item, t);
    return t;
}

function getDescription(item) {
    if (!item || typeof item !== "object") return "";
    if (descriptionCache.has(item)) return descriptionCache.get(item);
    const d = item?.descripcion || item?.resumen || item?.contenido
        || item?.detalle || item?.respuesta || item?.funciones_principales || "";
    descriptionCache.set(item, d);
    return d;
}

function getCategory(item) {
    return item?.categoria?.nombre || item?.estado?.nombre
        || item?.estadoOperativo?.nombre || item?.estado_operativo?.nombre
        || item?.tipoDocumento?.nombre || item?.tipo_documento?.nombre
        || item?.tipoEvento?.nombre || item?.tipo_evento?.nombre
        || item?.tipoTutorial?.nombre || item?.tipo_tutorial?.nombre
        || item?.tipoPublicacion?.nombre || item?.tipo_publicacion?.nombre
        || item?.modalidad?.nombre || "";
}

function getStatus(item) {
    return item?.estadoOperativo?.nombre || item?.estado_operativo?.nombre
        || item?.estado?.nombre || "";
}

function getDateValue(item) {
    return item?.fecha_publicacion || item?.fecha_inicio || item?.fecha_evento
        || item?.fecha_documento || item?.created_at || "";
}

const dateFormatter = new Intl.DateTimeFormat("es-PE", {
    day: "2-digit", month: "short", year: "numeric",
});
function formatDate(value) {
    if (!value) return "";
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? "" : dateFormatter.format(d);
}

function hasVisibleContent(item, type = "") {
    if (!item || typeof item !== "object") return false;
    if (String(getTitle(item)).trim() || String(getDescription(item)).trim()
        || getImageUrl(item) || getFileUrl(item)) return true;
    if (type === "autoridades" && (item?.cargo || item?.correo_institucional)) return true;
    if (type === "eventos" && (item?.lugar || item?.hora_inicio || item?.fecha_inicio || item?.fecha_evento)) return true;
    return false;
}

function filterVisibleContent(items, type = "") {
    return sanitizeList(items).filter((item) => hasVisibleContent(item, type));
}

function getUsableList(primary, fallback = []) {
    const main = sanitizeList(primary);
    return main.length > 0 ? main : sanitizeList(fallback);
}

// ── Funciones de catálogos ────────────────────────────────────────────────────
function getModule(catalogos, sectionId) {
    const modulos = Array.isArray(catalogos?.modulos) ? catalogos.modulos : [];
    const slug = SECTION_MODULE[sectionId];
    if (!slug) return null;
    return modulos.find((m) => m.slug === slug && Number(m.activo) === 1) || null;
}

function getSectionIdByModuleSlug(slug) {
    return MODULE_SECTION[slug] || slug;
}

function getCategoriesBySection(catalogos, sectionId) {
    const modulo = getModule(catalogos, sectionId);
    if (!modulo) return [];
    return (catalogos?.categorias || [])
        .filter((cat) => {
            if (!cat || Number(cat.activo) !== 1 || Number(cat.idmodulo) !== Number(modulo.idmodulo)) return false;
            if (modulo.slug === "institucional" && EXCLUDED_INSTITUCIONAL_SLUGS.has(cat.slug)) return false;
            return true;
        })
        .sort((a, b) => Number(a.orden || 0) - Number(b.orden || 0));
}

function getNavItemsDesdeBD(catalogos) {
    const modulos    = Array.isArray(catalogos?.modulos)    ? catalogos.modulos    : [];
    const categorias = Array.isArray(catalogos?.categorias) ? catalogos.categorias : [];
    return modulos
        .filter((m) => Number(m.activo) === 1 && !EXCLUDED_NAV_MODULES.has(m.slug) && MODULE_SECTION[m.slug])
        .sort((a, b) => Number(a.orden || a.idmodulo || 0) - Number(b.orden || b.idmodulo || 0))
        .map((modulo) => {
            const sectionId = getSectionIdByModuleSlug(modulo.slug);
            const subItems = categorias
                .filter((cat) => {
                    if (!cat || Number(cat.activo) !== 1 || Number(cat.idmodulo) !== Number(modulo.idmodulo)) return false;
                    if (modulo.slug === "institucional" && EXCLUDED_INSTITUCIONAL_SLUGS.has(cat.slug)) return false;
                    return true;
                })
                .sort((a, b) => Number(a.orden || 0) - Number(b.orden || 0))
                .map((cat) => {
                    if (modulo.slug === "institucional" && cat.slug === "autoridades")
                        return { label: cat.nombre, href: "#autoridades", idcategoria: null, sectionId: "autoridades", kind: "anchor" };
                    if (modulo.slug === "institucional")
                        return { label: cat.nombre, href: `#${sectionId}`, idcategoria: null, sectionId, kind: "anchor" };
                    return { label: cat.nombre, href: `#${sectionId}`, idcategoria: cat.idcategoria, sectionId, kind: "category" };
                });
            return { label: modulo.nombre, slug: modulo.slug, href: `#${sectionId}`, sectionId, descripcion: modulo.descripcion, subItems };
        });
}

function itemBelongsToCategory(item, category) {
    if (!category || !item || typeof item !== "object") return true;
    const catId   = Number(category.idcategoria);
    const catSlug = normalize(category.slug);
    const catName = normalize(category.nombre);
    const ids = [
        item.idcategoria, item.categoria_id, item.id_categoria,
        item?.categoria?.idcategoria, item?.categoria?.id,
        item?.tipoPublicacion?.idcategoria, item?.tipo_publicacion?.idcategoria,
    ];
    if (Number.isFinite(catId) && ids.some((id) => Number(id) === catId)) return true;
    const text = normalize([
        item?.categoria?.slug, item?.categoria?.nombre,
        item?.tipoPublicacion?.slug, item?.tipoPublicacion?.nombre,
        item?.tipo_publicacion?.slug, item?.tipo_publicacion?.nombre,
    ].filter(Boolean).join(" "));
    return Boolean(
        (catSlug && text.includes(catSlug)) ||
        (catName && text.includes(catName))
    );
}

function buildParams({ categoria = null, perPage = 9, search = null } = {}) {
    const p = { per_page: perPage };
    if (categoria) p.categoria = categoria;
    if (search)    p.search    = search;
    return p;
}

// ── Reducer para el form de soporte ──────────────────────────────────────────
const SOPORTE_INITIAL = {
    nombres: "", email: "", telefono: "", dependencia: "",
    asunto: "", descripcion: "", idtiposoporte: "", idprioridad: "",
    consentimiento_privacidad: false, archivo: null,
};

function soporteReducer(state, action) {
    switch (action.type) {
        case "CHANGE": return { ...state, [action.name]: action.value };
        case "RESET":  return SOPORTE_INITIAL;
        default:       return state;
    }
}

// ── Sub-componentes memoizados ────────────────────────────────────────────────
function ModuleSection({ id, catalogos, title, subtitle = null, children, className = "", lazyLoad = true, forceRender = true }) {
    const modulo = getModule(catalogos, id);
    if (!forceRender && !modulo) return null;
    return (
        <section id={id} className={`portal-section ${className}`}>
            <div className="portal-container">
                <div className="portal-section-header">
                    <span className="portal-section-module">{modulo?.nombre || title}</span>
                    <h2>{title}</h2>
                    {subtitle && <p className="portal-section-subtitle">{subtitle}</p>}
                </div>
                {children}
            </div>
        </section>
    );
}

const SectionTools = memo(function SectionTools({
                                                    sectionId, catalogos, selectedCategory, onSelect, onClear,
                                                    searchValue = "", onSearch = null, searchPlaceholder = "Buscar...", disabled = false,
                                                }) {
    const categorias = getCategoriesBySection(catalogos, sectionId);
    if (disabled || (!onSearch && categorias.length === 0 && !selectedCategory)) return null;
    return (
        <div className="portal-section-tools">
            {onSearch && (
                <div className="portal-search portal-search-inline">
                    <input type="text" value={searchValue} onChange={(e) => onSearch(e.target.value)} placeholder={searchPlaceholder} />
                </div>
            )}
            {categorias.length > 0 && (
                <div className="portal-filter-chips" aria-label="Filtros por categoría">
                    <button type="button" className={`portal-filter-chip ${!selectedCategory ? "is-active" : ""}`} onClick={onClear}>Todos</button>
                    {categorias.map((cat) => (
                        <button key={cat.idcategoria} type="button"
                                className={`portal-filter-chip ${Number(selectedCategory?.idcategoria) === Number(cat.idcategoria) ? "is-active" : ""}`}
                                onClick={() => onSelect(sectionId, cat.idcategoria)}>
                            {cat.nombre}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
});

const ActiveFilter = memo(function ActiveFilter({ label, onClear }) {
    if (!label) return null;
    return (
        <div className="portal-filter-active">
            <span>Filtro activo: {label}</span>
            <button type="button" onClick={onClear}>Quitar filtro</button>
        </div>
    );
});

function EmptyState({ text = "No hay contenidos disponibles por el momento.", actionText = null, onAction = null }) {
    return (
        <div className="portal-empty-state">
            <p>{text}</p>
            {actionText && onAction && <button type="button" onClick={onAction}>{actionText}</button>}
        </div>
    );
}

function LoadingSection({ text = "Cargando contenidos..." }) {
    return <div className="portal-empty-state portal-empty-loading">{text}</div>;
}

function ErrorSection({ text, onRetry }) {
    return (
        <div className="portal-empty-state portal-empty-error">
            <p>{text || "No se pudo cargar esta sección."}</p>
            {onRetry && <button type="button" onClick={onRetry}>Reintentar</button>}
        </div>
    );
}

function InstitucionalContenido({ contenido }) {
    if (!contenido) return null;
    const partes = String(contenido).split(/\n|;/).map((s) => s.trim()).filter(Boolean);
    return partes.length > 1
        ? <ul>{partes.map((p, i) => <li key={i}>{p}</li>)}</ul>
        : <p>{contenido}</p>;
}

const ResourceButton = memo(function ResourceButton({ item, type, className = "portal-card-button", onOpenResource }) {
    const fileUrl = getFileUrl(item);
    if (!fileUrl) return null;
    function handleClick(e) {
        e.preventDefault();
        e.stopPropagation();
        if (onOpenResource) { onOpenResource(item, type); return; }
        window.open(fileUrl, "_blank", "noopener,noreferrer");
    }
    return (
        <button type="button" className={className} onClick={handleClick}>
            {getResourceActionText(item, type)}
        </button>
    );
});

const Card = memo(function Card({ item, type, variant = "default", compact = false, onOpenResource = null, imgDefaultAvatar = null }) {
    const title       = getTitle(item);
    const description = getDescription(item);
    const category    = getCategory(item);
    const status      = getStatus(item);
    const date        = formatDate(getDateValue(item));
    const image       = getImageUrl(item);
    const fileUrl     = getFileUrl(item);
    const extension   = getFileExtension(item);
    const size        = getFileSize(item);
    const isAutoridad = variant === "autoridad";
    const cardType    = isAutoridad ? "autoridad" : type || "generico";
    const [imageFailed, setImageFailed] = useState(false);

    return (
        <article className={`portal-card ${isAutoridad ? "portal-card-autoridad" : ""} ${compact ? "portal-card-compact" : ""}`} data-type={cardType}>
            <div className={`portal-card-image-wrap ${!image || imageFailed ? "has-default-image" : ""}`} data-type={cardType}>
                {image && !imageFailed ? (
                    <img src={image} alt={title || "Imagen"} className="portal-card-image" loading="lazy" decoding="async" onError={() => setImageFailed(true)} />
                ) : (
                    <PortalPlaceholderIcon
                        type={isAutoridad ? "autoridades" : "institucional"}
                        size={isAutoridad ? 34 : 26}
                        imagenUrl={isAutoridad ? imgDefaultAvatar : null}
                        alt={title}
                    />
                )}
            </div>
            <div className="portal-card-body">
                <div className="portal-card-meta">
                    {category  && <span className="portal-card-badge">{category}</span>}
                    {date      && <span className="portal-card-date">{date}</span>}
                    {!date && status && <span className="portal-card-date">{status}</span>}
                    {extension && <span className="portal-card-date">{extension}</span>}
                </div>
                {title         && <h3>{title}</h3>}
                {item?.cargo   && <p className="portal-card-cargo">{item.cargo}</p>}
                {description   && <p>{description}</p>}
                {size          && <small className="portal-file-size">{size}</small>}
                {item?.correo_institucional && (
                    <a href={`mailto:${item.correo_institucional}`} className="portal-card-link">{item.correo_institucional}</a>
                )}
                {fileUrl  && <ResourceButton item={item} type={type} onOpenResource={onOpenResource} />}
                {!fileUrl && item?.slug && type && <a href={`/${type}/${item.slug}`} className="portal-card-button">Ver más</a>}
            </div>
        </article>
    );
});

function GridList({ items, type, variant = "default", compact = false, onOpenResource = null, imgDefaultAvatar = null }) {
    if (!items || items.length === 0) return <EmptyState />;
    return (
        <div className="portal-grid">
            {items.map((item, index) => (
                <Card
                    key={
                        item.id || item.idnoticia || item.idservicio || item.idenlace
                        || item.iddocumento || item.idevento || item.idtutorial
                        || item.idfaq || item.idautoridad || item.idproyecto || index
                    }
                    item={item} type={type} variant={variant} compact={compact} onOpenResource={onOpenResource} imgDefaultAvatar={imgDefaultAvatar}
                />
            ))}
        </div>
    );
}

// ── Skeleton de carga inicial ─────────────────────────────────────────────────
function PortalSkeleton() {
    return (
        <div className="portal-publico">
            <div className="portal-container">
                <div className="portal-skeleton-loader">
                    <div className="portal-skeleton-hero" />
                    {Array.from({ length: 8 }, (_, i) => <div key={i} className="portal-skeleton-section" />)}
                </div>
            </div>
        </div>
    );
}

// ── Sección de soporte (separada para evitar re-renders del portal entero) ────
const SoporteForm = memo(function SoporteForm({ catalogos, cfg, textos }) {
    const [form, dispatch] = useReducer(soporteReducer, SOPORTE_INITIAL);
    const [estado, setEstado] = useState({ loading: false, message: "", error: false });
    const queryClient = useQueryClient();

    function handleChange(e) {
        const { name, value, checked, type, files } = e.target;
        dispatch({
            type: "CHANGE",
            name,
            value: type === "checkbox" ? checked : type === "file" ? (files?.[0] || null) : value,
        });
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setEstado({ loading: true, message: "", error: false });
        try {
            const response = await registrarPublicSoporte({
                ...form,
                consentimiento_privacidad: form.consentimiento_privacidad ? 1 : 0,
            });
            setEstado({ loading: false, message: response?.data?.message || response?.message || textos.soporteExito, error: false });
            dispatch({ type: "RESET" });
            queryClient.invalidateQueries({ queryKey: ["soporte"] });
        } catch (err) {
            setEstado({ loading: false, message: err?.response?.data?.message || err.message || "No se pudo registrar la solicitud.", error: true });
        }
    }

    return (
        <form className="portal-form" onSubmit={handleSubmit}>
            <div className="portal-form-grid">
                <input name="nombres" value={form.nombres} onChange={handleChange} placeholder="Nombres completos" required />
                <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="Correo electrónico" required />
            </div>
            <div className="portal-form-grid">
                <input name="telefono" value={form.telefono} onChange={handleChange} placeholder="Teléfono de contacto" required={textos.telefonoObligatorio} />
                <input name="dependencia" value={form.dependencia} onChange={handleChange} placeholder="Dependencia / Facultad" required={textos.dependenciaObligatoria} />
            </div>
            <input name="asunto" value={form.asunto} onChange={handleChange} placeholder="Asunto de la consulta" required />
            <div className="portal-form-grid">
                <select name="idtiposoporte" value={form.idtiposoporte} onChange={handleChange} required>
                    <option value="">Seleccione tipo de soporte</option>
                    {(catalogos.tipos_soporte || []).map((t) => (
                        <option key={t.idtiposoporte} value={t.idtiposoporte}>{t.nombre}</option>
                    ))}
                </select>
                <select name="idprioridad" value={form.idprioridad} onChange={handleChange} required>
                    <option value="">Seleccione prioridad</option>
                    {(catalogos.prioridades || []).map((p) => (
                        <option key={p.idprioridad} value={p.idprioridad}>{p.nombre}</option>
                    ))}
                </select>
            </div>
            <textarea name="descripcion" value={form.descripcion} onChange={handleChange} placeholder="Describa detalladamente su consulta o requerimiento" rows="5" required />
            {textos.permiteAdjunto && (
                <input name="archivo" type="file" onChange={handleChange} accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" />
            )}
            <label className="portal-check">
                <input type="checkbox" name="consentimiento_privacidad" checked={form.consentimiento_privacidad} onChange={handleChange} required />
                <span>Acepto el tratamiento de mis datos personales.</span>
            </label>
            {estado.message && (
                <div className={estado.error ? "portal-message portal-message-error" : "portal-message portal-message-success"}>
                    {estado.message}
                </div>
            )}
            <button type="submit" disabled={estado.loading}>
                {estado.loading ? "Enviando solicitud..." : "Enviar solicitud"}
            </button>
        </form>
    );
});


function findNavModule(navItems, slug) {
    return navItems.find((item) => item.slug === slug) || null;
}

function buildModuleNavItem(moduleConfig, moduleFromBD) {
    if (!moduleFromBD) return null;

    const baseItem = {
        label: moduleConfig.label || moduleFromBD.label,
        href: moduleConfig.href || moduleFromBD.href,
        sectionId: moduleConfig.sectionId || moduleFromBD.sectionId,
        idcategoria: null,
        featured: true,
        kind: "anchor",
    };

    const categoryItems = moduleConfig.showCategories
        ? (moduleFromBD.subItems || []).map((sub) => ({
            ...sub,
            featured: false,
        }))
        : [];

    return [baseItem, ...categoryItems];
}

function buildFlexibleNav(catalogos) {
    const navDesdeBD = getNavItemsDesdeBD(catalogos);

    const groups = NAV_GROUPS.map((group) => {
        const staticItems = (group.items || [])
            .filter((item) => item.always)
            .map((item) => ({
                ...item,
                idcategoria: item.idcategoria || null,
            }));

        const moduleItems = (group.modules || [])
            .flatMap((moduleConfig) => {
                const moduleFromBD = findNavModule(navDesdeBD, moduleConfig.slug);
                return buildModuleNavItem(moduleConfig, moduleFromBD) || [];
            });

        const subItems = [...staticItems, ...moduleItems];

        return {
            label: group.label,
            href: group.href,
            visible: subItems.length > 0,
            sections: group.sections || [],
            subItems,
        };
    });

    return [
        {
            label: "Inicio",
            href: "#inicio",
            simple: true,
            visible: true,
        },
        ...groups,
    ].filter((item) => item.visible);
}


// ── Componente principal ──────────────────────────────────────────────────────
export default function InicioPublico() {
    const queryClient = useQueryClient();
    const [navOpen, setNavOpen] = useState(false);
    const [resourceViewer, setResourceViewer] = useState(null);
    const [noticiaModalSlug, setNoticiaModalSlug] = useState(null);
    const [filtrosCategorias, setFiltrosCategorias] = useState({});
    const [busquedaNoticias, setBusquedaNoticias] = useState("");

    // ── Queries ───────────────────────────────────────────────────────────────
    const configuracionQuery = useQuery({
        queryKey: ["configuracion-publica"],
        queryFn: () => obtenerConfiguracionPublica().then((r) => r?.data || {}),
        staleTime: 0,
        gcTime:    GC_LARGO,
    });

    const catalogosQuery = useQuery({
        queryKey: ["catalogos"],
        queryFn: () => getPublicCatalogos().then(getResponseData),
        staleTime: 0,
        gcTime:    GC_LARGO,
    });

    const institucionalQuery = useQuery({
        queryKey: ["institucional"],
        queryFn: () => getPublicInstitucional().then(getList),
        staleTime: STALE_LARGO,
        gcTime:    GC_LARGO,
    });

    const autoridadesQuery = useQuery({
        queryKey: ["autoridades"],
        queryFn: () => getPublicAutoridades().then(getList),
        staleTime: 5 * 60 * 1000,
        gcTime:    GC_MEDIO,
    });

    const inicioQuery = useQuery({
        queryKey: ["inicio"],
        queryFn: () => getPublicInicio().then(getResponseData),
        staleTime: 5 * 60 * 1000,
        gcTime:    GC_MEDIO,
    });

    // Queries de secciones — habilitadas solo cuando los catálogos cargaron
    const catalogosLoaded = Boolean(catalogosQuery.data);

    const cfgModulos = configuracionQuery.data?.modulos || {};
    const perPage = useMemo(() => ({
        noticias:   cfgNumber(cfgModulos.paginacion_noticias,   SECTION_PER_PAGE_DEFAULT.noticias),
        servicios:  cfgNumber(cfgModulos.paginacion_servicios,  SECTION_PER_PAGE_DEFAULT.servicios),
        sistemas:   cfgNumber(cfgModulos.paginacion_sistemas,   SECTION_PER_PAGE_DEFAULT.sistemas),
        proyectos:  cfgNumber(cfgModulos.paginacion_proyectos,  SECTION_PER_PAGE_DEFAULT.proyectos),
        documentos: cfgNumber(cfgModulos.paginacion_documentos, SECTION_PER_PAGE_DEFAULT.documentos),
        eventos:    cfgNumber(cfgModulos.paginacion_eventos,    SECTION_PER_PAGE_DEFAULT.eventos),
        tutoriales: cfgNumber(cfgModulos.paginacion_tutoriales, SECTION_PER_PAGE_DEFAULT.tutoriales),
        faqs:       cfgNumber(cfgModulos.paginacion_faqs,       SECTION_PER_PAGE_DEFAULT.faqs),
    }), [cfgModulos]);

    const serviciosQuery  = useQuery({ queryKey: ["servicios",  perPage.servicios],  queryFn: () => getPublicServicios(buildParams({ perPage: perPage.servicios })).then(getList),    staleTime: 0, gcTime: GC_MEDIO, enabled: catalogosLoaded });
    const sistemasQuery = useQuery({
        queryKey: ["sistemas"],
        queryFn: () => getPublicSistemas().then(getList),
        staleTime: 0,
        gcTime: 0,
        refetchOnMount: "always",
        refetchOnWindowFocus: true,
        enabled: catalogosLoaded,
    });
    const noticiasQuery   = useQuery({ queryKey: ["noticias",   busquedaNoticias, perPage.noticias], queryFn: () => getPublicNoticias(buildParams({ search: busquedaNoticias, perPage: perPage.noticias })).then(getList), staleTime: 0, gcTime: GC_MEDIO, enabled: catalogosLoaded });
    const proyectosQuery  = useQuery({ queryKey: ["proyectos",  perPage.proyectos],  queryFn: () => getPublicProyectos(buildParams({ perPage: perPage.proyectos })).then(getList),   staleTime: 0, gcTime: GC_MEDIO, enabled: catalogosLoaded });
    const documentosQuery = useQuery({ queryKey: ["documentos", perPage.documentos], queryFn: () => getPublicDocumentos(buildParams({ perPage: perPage.documentos })).then(getList), staleTime: 0, gcTime: GC_MEDIO });
    const eventosQuery    = useQuery({ queryKey: ["eventos",    perPage.eventos],    queryFn: () => getPublicEventos(buildParams({ perPage: perPage.eventos })).then(getList),       staleTime: 0, gcTime: GC_MEDIO, enabled: catalogosLoaded });
    const tutorialesQuery = useQuery({ queryKey: ["tutoriales", perPage.tutoriales], queryFn: () => getPublicTutoriales(buildParams({ perPage: perPage.tutoriales })).then(getList), staleTime: 0, gcTime: GC_MEDIO, enabled: catalogosLoaded });
    const faqsQuery       = useQuery({ queryKey: ["faqs",       perPage.faqs],       queryFn: () => getPublicFaqs(buildParams({ perPage: perPage.faqs })).then(getList),             staleTime: 0, gcTime: GC_MEDIO, enabled: catalogosLoaded });

    // ── Configuración dinámica ────────────────────────────────────────────────
    const cfg = configuracionQuery.data || {};
    const cfgApariencia = cfg.apariencia  || {};
    const cfgTextos     = cfg.textos      || {};
    const cfgServicios  = cfg.servicios   || {};
    const cfgNoticias   = cfg.noticias    || {};
    const cfgSoporte    = cfg.soporte     || {};
    const cfgSecciones  = cfg.secciones   || {};
    const cfgTextosUI   = cfg.textos_ui   || {};
    const cfgAvanzado   = cfg.avanzado    || {};

    // Imágenes de respaldo configurables: si el admin las sube, reemplazan
    // el ícono lucide predeterminado en tarjetas/avatares sin imagen propia.
    const imgDefaultCard   = useMemo(() => getStorageUrl(cfgApariencia.img_default_card),   [cfgApariencia.img_default_card]);
    const imgDefaultAvatar = useMemo(() => getStorageUrl(cfgApariencia.img_default_avatar), [cfgApariencia.img_default_avatar]);

    // Aplicar colores CSS cuando llegan de BD
    // Aplicar apariencia dinámica desde portal_configuracion
    useEffect(() => {
        const root = document.documentElement;

        const variablesNormales = {
            "--institutional-primary":
            cfgApariencia.color_primario,

            "--institutional-primary-dark":
            cfgApariencia.color_secundario,

            "--institutional-primary-light":
            cfgApariencia.color_acento,

            "--bg":
            cfgApariencia.color_fondo,

            "--text":
            cfgApariencia.color_texto,

            "--font-body":
            cfgApariencia.fuente_cuerpo,

            "--font-heading":
            cfgApariencia.fuente_titulos,

            "--font-size-base":
                cfgApariencia.tamano_base
                    ? `${cfgApariencia.tamano_base}px`
                    : null,

            "--radius":
                cfgApariencia.radio_bordes
                    ? `${cfgApariencia.radio_bordes}px`
                    : null,
        };

        const variablesImagen = {
            "--img-logo":
            cfgApariencia.img_logo,

            "--img-hero-bg":
            cfgApariencia.img_hero_bg,

            "--img-default-card":
            cfgApariencia.img_default_card,

            "--img-hero-pattern":
            cfgApariencia.img_hero_pattern,

            "--img-default-avatar":
            cfgApariencia.img_default_avatar,

            "--img-textura-fondo":
            cfgApariencia.img_textura_fondo,
        };

        Object.entries(variablesNormales).forEach(
            ([propiedad, valor]) => {
                if (
                    valor !== null &&
                    valor !== undefined &&
                    String(valor).trim() !== ""
                ) {
                    root.style.setProperty(
                        propiedad,
                        String(valor)
                    );
                } else {
                    root.style.removeProperty(propiedad);
                }
            }
        );

        Object.entries(variablesImagen).forEach(
            ([propiedad, valor]) => {
                /*
                 * ConfiguracionController::publico() debería devolver
                 * una URL completa para los campos tipo archivo.
                 */
                const url = getStorageUrl(valor);

                if (url) {
                    const urlSegura = String(url)
                        .replace(/\\/g, "\\\\")
                        .replace(/"/g, '\\"');

                    root.style.setProperty(
                        propiedad,
                        `url("${urlSegura}")`
                    );
                } else {
                    /*
                     * Se elimina solamente el estilo inline.
                     * Entonces vuelve a usarse el valor predeterminado
                     * declarado en :root dentro de portal.css.
                     */
                    root.style.removeProperty(propiedad);
                }
            }
        );

        return () => {
            Object.keys(variablesNormales).forEach(
                (propiedad) => {
                    root.style.removeProperty(propiedad);
                }
            );

            Object.keys(variablesImagen).forEach(
                (propiedad) => {
                    root.style.removeProperty(propiedad);
                }
            );
        };
    }, [cfgApariencia]);




    const catalogos = catalogosQuery.data || {};
    const inicio    = inicioQuery.data    || {};

    // ── Textos dinámicos con fallback ─────────────────────────────────────────
    const heroTitulo      = cfgText(cfgTextos.hero_titulo,        INSTITUCION.hero_titulo);
    const heroAcento      = cfgText(cfgTextos.hero_titulo_acento, INSTITUCION.hero_titulo_acento);
    const heroDescripcion = cfgText(cfgTextos.hero_descripcion,   INSTITUCION.hero_descripcion);
    const heroEtiqueta    = cfgText(cfgTextos.hero_etiqueta,      INSTITUCION.hero_etiqueta);
    const heroBtn1Texto   = cfgText(cfgTextos.hero_btn1_texto,    INSTITUCION.hero_btn_primario.texto);
    const heroBtn1Href    = cfgText(cfgTextos.hero_btn1_href,     INSTITUCION.hero_btn_primario.href);
    const heroBtn2Texto   = cfgText(cfgTextos.hero_btn2_texto,    INSTITUCION.hero_btn_secundario.texto);
    const heroBtn2Href    = cfgText(cfgTextos.hero_btn2_href,     INSTITUCION.hero_btn_secundario.href);
    const footerNombre    = cfgText(cfgTextos.footer_nombre,      INSTITUCION.nombre_completo);
    const footerDesc      = cfgText(cfgTextos.footer_descripcion, INSTITUCION.footer_descripcion);
    const topbarTelefono  = cfgText(cfgTextos.topbar_telefono,    INSTITUCION.contacto_telefono);
    const topbarCorreo    = cfgText(cfgTextos.topbar_correo,      INSTITUCION.contacto_email);
    const logoNombre      = cfgText(cfgApariencia.logo_nombre_corto, INSTITUCION.nombre_corto);
    const logoSubtitulo   = cfgText(cfgApariencia.logo_subtitulo,    INSTITUCION.subtitulo_logo);

    const noticiasTitulo         = cfgText(cfgNoticias.noticias_titulo,      "Noticias y comunicados");
    const noticiasSubtitulo      = cfgText(cfgNoticias.noticias_subtitulo,   "Mantente al día con las últimas novedades y anuncios oficiales.");
    const noticiasPlaceholder    = cfgText(cfgNoticias.noticias_placeholder, "Buscar noticias, comunicados o avisos...");
    const noticiasBusquedaActiva = cfgBool(cfgNoticias.noticias_busqueda, true);

    const soporteTitulo    = cfgText(cfgSoporte.soporte_titulo,    "Mesa de ayuda");
    const soporteSubtitulo = cfgText(cfgSoporte.soporte_subtitulo, "¿Tienes una consulta o necesitas asistencia? Completa el formulario y nuestro equipo se pondrá en contacto contigo.");
    const soporteTextos = {
        soporteExito:           cfgText(cfgSoporte.soporte_mensaje_exito, "Solicitud registrada correctamente."),
        telefonoObligatorio:    cfgBool(cfgSoporte.soporte_telefono_obligatorio,    false),
        dependenciaObligatoria: cfgBool(cfgSoporte.soporte_dependencia_obligatoria, false),
        permiteAdjunto:         cfgBool(cfgSoporte.soporte_permite_adjunto,         false),
    };

    const modoMantenimiento   = cfgBool(cfgAvanzado.modo_mantenimiento, false);
    const mantenimientoTitulo = cfgText(cfgAvanzado.mantenimiento_titulo, "Portal en mantenimiento");
    const mantenimientoDesc   = cfgText(cfgAvanzado.mantenimiento_descripcion, "Estamos realizando mejoras para brindarte una mejor experiencia. Por favor vuelve en unos momentos.");
    const mantenimientoSub    = cfgText(cfgAvanzado.mantenimiento_subtexto, "DSTI — UNASAM");

    const loginTexto   = cfgText(cfgTextos.topbar_login_texto,   "Iniciar sesión");
    const loginHref    = cfgText(cfgTextos.topbar_login_href,    "/login");
    const loginVisible = cfgBool(cfgTextos.topbar_login_visible, true);

    const serviciosMostrarFiltros = cfgBool(cfgServicios.servicios_mostrar_filtros, true);

    const emptyTextos = {
        servicios:    cfgTextosUI.empty_servicios   || "No hay servicios tecnológicos disponibles por el momento.",
        sistemas:     cfgTextosUI.empty_sistemas    || "No hay sistemas institucionales disponibles por el momento.",
        noticias:     cfgTextosUI.empty_noticias    || "No hay noticias publicadas por el momento.",
        documentos:   cfgTextosUI.empty_documentos  || "No hay documentos disponibles por el momento.",
        eventos:      cfgTextosUI.empty_eventos     || "No hay eventos programados por el momento.",
        tutoriales:   cfgTextosUI.empty_tutoriales  || "No hay tutoriales disponibles por el momento.",
        faqs:         cfgTextosUI.empty_faqs        || "No hay preguntas frecuentes registradas por el momento.",
        proyectos:    cfgTextosUI.empty_proyectos   || "No hay proyectos tecnológicos publicados por el momento.",
        error:        cfgTextosUI.error_seccion     || "No se pudo cargar esta sección.",
        loading:      cfgTextosUI.loading_texto     || "Cargando contenidos...",
        reintentar:   cfgTextosUI.btn_reintentar    || "Reintentar",
        quitarFiltro: cfgTextosUI.btn_quitar_filtro || "Quitar filtro",
    };

    // Títulos de secciones
    const sec = cfgSecciones;
    const secTitulos = {
        institucional:    sec.seccion_institucional_titulo    || "Institucional",
        institucionalSub: sec.seccion_institucional_subtitulo || null,
        autoridades:      sec.seccion_autoridades_titulo      || "Autoridades",
        autoridadesSub:   sec.seccion_autoridades_subtitulo   || "Equipo directivo a cargo de la gestión institucional.",
        servicios:        cfgText(cfgServicios.servicios_titulo, sec.seccion_servicios_titulo || "Servicios tecnológicos"),
        serviciosSub:     cfgText(cfgServicios.servicios_descripcion, sec.seccion_servicios_subtitulo || "Servicios digitales disponibles para toda la comunidad universitaria."),
        sistemas:         sec.seccion_sistemas_titulo    || "Sistemas institucionales",
        sistemasSub:      sec.seccion_sistemas_subtitulo || "Plataformas y sistemas oficiales para la gestión académica y administrativa.",
        proyectos:        sec.seccion_proyectos_titulo    || "Proyectos tecnológicos",
        proyectosSub:     sec.seccion_proyectos_subtitulo || "Iniciativas y proyectos en desarrollo para mejorar nuestros servicios.",
        documentos:       sec.seccion_documentos_titulo    || "Documentos y manuales",
        documentosSub:    sec.seccion_documentos_subtitulo || "Reglamentos, directivas, manuales técnicos y documentos oficiales.",
        eventos:          sec.seccion_eventos_titulo    || "Eventos y capacitaciones",
        eventosSub:       sec.seccion_eventos_subtitulo || "Programa de capacitaciones, talleres y eventos institucionales.",
        tutoriales:       sec.seccion_tutoriales_titulo    || "Tutoriales y recursos",
        tutorialesSub:    sec.seccion_tutoriales_subtitulo || "Guías paso a paso, videos y recursos didácticos.",
        faqs:             sec.seccion_faqs_titulo    || "Preguntas frecuentes",
        faqsSub:          sec.seccion_faqs_subtitulo || "Resuelve las dudas más comunes sobre nuestros servicios.",
    };

    // ── Datos filtrados (memoizados) ──────────────────────────────────────────
    const getCategoriaSeleccionada = useCallback((sectionId) => {
        const id = filtrosCategorias[sectionId];
        if (!id) return null;
        return getCategoriesBySection(catalogos, sectionId).find((c) => Number(c.idcategoria) === Number(id)) || null;
    }, [catalogos, filtrosCategorias]);

    const filtrarPorCategoria = useCallback((items, sectionId) => {
        const cat = getCategoriaSeleccionada(sectionId);
        return sanitizeList(items).filter((item) => itemBelongsToCategory(item, cat));
    }, [getCategoriaSeleccionada]);

    const seccionData = useMemo(() => {
        const make = (query, fallback, type, sectionId) =>
            filtrarPorCategoria(filterVisibleContent(getUsableList(query, fallback), type), sectionId);
        return {
            servicios:  make(serviciosQuery.data,  inicio.servicios,  "servicios",  "servicios"),
            sistemas:   make(sistemasQuery.data,   [],                "sistemas",   "sistemas"),
            noticias:   make(noticiasQuery.data,   inicio.noticias,   "noticias",   "noticias"),
            eventos:    make(eventosQuery.data,    inicio.eventos,    "eventos",    "eventos"),
            faqs:       make(faqsQuery.data,       inicio.faqs,       "faqs",       "faqs"),
            proyectos:  make(proyectosQuery.data,  inicio.proyectos,  "proyectos",  "proyectos"),
            documentos: make(documentosQuery.data, inicio.documentos, "documentos", "documentos"),
            tutoriales: make(tutorialesQuery.data, inicio.tutoriales, "tutoriales", "tutoriales"),
        };
    }, [
        filtrarPorCategoria,
        serviciosQuery.data,  sistemasQuery.data,  noticiasQuery.data,
        eventosQuery.data,    faqsQuery.data,       proyectosQuery.data,
        documentosQuery.data, tutorialesQuery.data,
        inicio,
    ]);

    const noticiasFiltradasPorBusqueda = useMemo(() => {
        const q = normalize(busquedaNoticias);
        if (!q) return seccionData.noticias;
        return seccionData.noticias.filter((item) =>
            normalize(`${getTitle(item)} ${getDescription(item)} ${getCategory(item)}`).includes(q)
        );
    }, [seccionData.noticias, busquedaNoticias]);

    // Topbar links
    const topbarLinks = useMemo(() => [
        { texto: cfgText(cfgTextos.topbar_link1_texto, ""), href: cfgText(cfgTextos.topbar_link1_href, "#") },
        { texto: cfgText(cfgTextos.topbar_link2_texto, ""), href: cfgText(cfgTextos.topbar_link2_href, "#") },
        { texto: cfgText(cfgTextos.topbar_link3_texto, ""), href: cfgText(cfgTextos.topbar_link3_href, "#") },
    ].filter((l) => l.texto), [cfgTextos]);

    // Footer links
    const footerLinksRapidos = useMemo(() => [
        { texto: cfgText(cfgTextos.footer_link1_texto, "Servicios"),  href: cfgText(cfgTextos.footer_link1_href, "#servicios") },
        { texto: cfgText(cfgTextos.footer_link2_texto, "Sistemas"),   href: cfgText(cfgTextos.footer_link2_href, "#sistemas") },
        { texto: cfgText(cfgTextos.footer_link3_texto, "Noticias"),   href: cfgText(cfgTextos.footer_link3_href, "#noticias") },
        { texto: cfgText(cfgTextos.footer_link4_texto, "Documentos"), href: cfgText(cfgTextos.footer_link4_href, "#documentos") },
    ], [cfgTextos]);

    const footerLinksApoyo = useMemo(() => [
        { texto: cfgText(cfgTextos.footer_apoyo1_texto, "Soporte técnico"),      href: cfgText(cfgTextos.footer_apoyo1_href, "#soporte") },
        { texto: cfgText(cfgTextos.footer_apoyo2_texto, "Tutoriales"),           href: cfgText(cfgTextos.footer_apoyo2_href, "#tutoriales") },
        { texto: cfgText(cfgTextos.footer_apoyo3_texto, "Preguntas frecuentes"), href: cfgText(cfgTextos.footer_apoyo3_href, "#faqs") },
        { texto: cfgText(cfgTextos.footer_apoyo4_texto, "Eventos"),              href: cfgText(cfgTextos.footer_apoyo4_href, "#eventos") },
    ], [cfgTextos]);

    // Nav items
    const navItems = useMemo(() => {
        return buildFlexibleNav(catalogos);
    }, [catalogos]);




    // Info institucional
    const institucional       = institucionalQuery.data || [];
    const autoridades         = autoridadesQuery.data  || [];
    const moduloInstitucional = getModule(catalogos, "institucional");

    const { institucionalVisible, contactoInstitucional } = useMemo(() => {
        const ordenado = [...institucional].sort((a, b) => Number(a.orden || 0) - Number(b.orden || 0));
        const visible = CLAVES_INSTITUCIONALES.map(({ key, label, aliases }) => {
            const found = ordenado.find((it) => {
                const t = normalize(it.titulo);
                return aliases.some((a) => t === normalize(a) || t.includes(normalize(a)));
            });
            return found ? { ...found, __key: key, __label: label } : null;
        }).filter(Boolean);
        const contacto = ordenado.filter((it) => {
            const t = normalize(it.titulo);
            return ![...SLUGS_INSTITUCIONALES].some((a) => t === normalize(a) || t.includes(normalize(a)));
        });
        return { institucionalVisible: visible, contactoInstitucional: contacto };
    }, [institucional]);

    // ── Callbacks ─────────────────────────────────────────────────────────────
    const prefetchSeccion = useCallback((sectionId) => {
        const fnMap = {
            servicios: () => getPublicServicios({}).then(getList),
            sistemas:  () => getPublicSistemas().then(getList),
            noticias:  () => getPublicNoticias({}).then(getList),
        };
        if (!fnMap[sectionId]) return;
        queryClient.prefetchQuery({
            queryKey: sectionId === "sistemas"
                ? ["sistemas"]
                : [sectionId],
            queryFn: fnMap[sectionId],
            staleTime: sectionId === "sistemas" ? 0 : 5 * 60 * 1000,
        });
    }, [queryClient]);

    const seleccionarCategoriaNav = useCallback((sectionId, idcategoria) => {
        if (sectionId === "institucional" || sectionId === "autoridades") { setNavOpen(false); return; }
        setFiltrosCategorias((prev) => ({ ...prev, [sectionId]: idcategoria }));
        setNavOpen(false);
    }, []);

    const limpiarCategoriaNav = useCallback((sectionId) => {
        setFiltrosCategorias((prev) => { const c = { ...prev }; delete c[sectionId]; return c; });
        setNavOpen(false);
    }, []);

    const limpiarVariasSecciones = useCallback((ids = []) => {
        const validas = ids.filter((id) => id !== "institucional" && id !== "autoridades" && id !== "soporte");
        setFiltrosCategorias((prev) => { const c = { ...prev }; validas.forEach((id) => delete c[id]); return c; });
        setNavOpen(false);
    }, []);

    const openResourceViewer  = useCallback((item, type) => setResourceViewer({ item, type }), []);
    const closeResourceViewer = useCallback(() => setResourceViewer(null), []);

    const openNoticiaModal  = useCallback((slug) => setNoticiaModalSlug(slug), []);
    const closeNoticiaModal = useCallback(() => setNoticiaModalSlug(null), []);

    function getContactoHref(item) {
        const c = String(item?.contenido || "").trim();
        if (!c) return null;
        if (c.startsWith("http")) return c;
        if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c)) return `mailto:${c}`;
        const nums = c.replace(/\D/g, "");
        if (nums.length >= 6 && nums.length <= 15) return `tel:${nums}`;
        return null;
    }

    // Categorías seleccionadas
    const categoriaServicios        = getCategoriaSeleccionada("servicios");
    const categoriaSistemas         = getCategoriaSeleccionada("sistemas");
    const categoriaNoticias         = getCategoriaSeleccionada("noticias");
    const categoriaProyectos        = getCategoriaSeleccionada("proyectos");
    const categoriaDocumentos       = getCategoriaSeleccionada("documentos");
    const categoriaEventos          = getCategoriaSeleccionada("eventos");
    const categoriaTutoriales       = getCategoriaSeleccionada("tutoriales");
    const categoriaFaqsSeleccionada = getCategoriaSeleccionada("faqs");

    // ── Estados de carga / error ──────────────────────────────────────────────
    const isLoading = catalogosQuery.isLoading || institucionalQuery.isLoading || autoridadesQuery.isLoading;
    const error     = catalogosQuery.error     || institucionalQuery.error     || autoridadesQuery.error;

    if (isLoading) return <PortalSkeleton />;

    if (error) {
        return (
            <div className="portal-publico">
                <div className="portal-container">
                    <div className="portal-status portal-status-error">
                        Error al cargar el portal: {error.message}
                        <button onClick={() => window.location.reload()}>{emptyTextos.reintentar}</button>
                    </div>
                </div>
            </div>
        );
    }

    if (modoMantenimiento) {
        return (
            <div className="portal-publico portal-maintenance">
                <div className="portal-maintenance-card">
                    <span className="portal-maintenance-chip">Mantenimiento</span>
                    <h1>{mantenimientoTitulo}</h1>
                    <p>{mantenimientoDesc}</p>
                    <small>{mantenimientoSub}</small>
                </div>
            </div>
        );
    }

    // ── Helper para renderizar secciones ─────────────────────────────────────
    function renderSection(sectionId, query, Component, data, categoria, title, subtitle, className = "", extraProps = {}) {
        return (
            <ModuleSection id={sectionId} catalogos={catalogos} title={title} subtitle={subtitle} className={className}>
                <SectionTools
                    sectionId={sectionId} catalogos={catalogos}
                    selectedCategory={categoria}
                    onSelect={seleccionarCategoriaNav}
                    onClear={() => limpiarCategoriaNav(sectionId)}
                    {...(sectionId === "servicios" ? { disabled: !serviciosMostrarFiltros } : {})}
                />
                <ActiveFilter label={categoria?.nombre} onClear={() => limpiarCategoriaNav(sectionId)} />
                {query.isLoading ? (
                    <LoadingSection text={emptyTextos.loading} />
                ) : query.isError ? (
                    <ErrorSection text={emptyTextos.error} onRetry={() => query.refetch()} />
                ) : (
                    <PortalErrorBoundary>
                        <Suspense fallback={<LoadingSection text={emptyTextos.loading} />}>
                            <Component
                                items={data}
                                emptyAction={categoria ? () => limpiarCategoriaNav(sectionId) : null}
                                onOpenResource={openResourceViewer}
                                {...extraProps}
                            />
                        </Suspense>
                    </PortalErrorBoundary>
                )}
            </ModuleSection>
        );
    }

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <div className="portal-publico">

            {/* ── Topbar + Header ── */}
            <div className="portal-sticky-header">
                <div className="portal-topbar">
                    <div className="portal-container portal-topbar-content">
                        <div className="portal-topbar-info">
                            {topbarTelefono && (
                                <span className="portal-topbar-phone">
                                    <Phone size={14} aria-hidden="true" />
                                    {topbarTelefono}
                                </span>
                            )}
                            {topbarCorreo && (
                                <span className="portal-topbar-email">
                                    <Mail size={14} aria-hidden="true" />
                                    {topbarCorreo}
                                </span>
                            )}
                        </div>
                        <div className="portal-topbar-actions">
                            {topbarLinks.map((enlace, index) => {
                                const docSlug = getDocSlugFromHref(enlace.href);

                                if (docSlug) {
                                    // Buscar en la lista completa sin filtro de categoría activa
                                    // Misma lógica que seccionData.documentos pero sin filtrarPorCategoria
                                    const todosDocumentos = filterVisibleContent(
                                        getUsableList(getList(documentosQuery.data), inicio.documentos),
                                        "documentos"
                                    );
                                    const doc = todosDocumentos.find((d) => d.slug === docSlug);
                                    if (!doc) {
                                        console.warn("Documento no encontrado para topbar:", docSlug, {
                                            href: enlace.href,
                                            documentos: todosDocumentos.map((d) => d.slug),
                                        });

                                        return (
                                            <a
                                                key={index}
                                                href="#documentos"
                                                className="portal-topbar-link"
                                                title={`Documento no encontrado: ${docSlug}`}
                                            >
                                                {enlace.texto}
                                            </a>
                                        );
                                    }
                                    return (
                                        <button
                                            key={index}
                                            type="button"
                                            className="portal-topbar-link"
                                            onClick={() => openResourceViewer(doc, "documentos")}
                                        >
                                            {enlace.texto}
                                        </button>
                                    );
                                }

                                return <a key={index} href={enlace.href} className="portal-topbar-link">{enlace.texto}</a>;
                            })}
                            {loginVisible && <a href={loginHref} className="portal-login-btn">{loginTexto}</a>}
                        </div>
                    </div>
                </div>

                <header className="portal-header">
                    <div className="portal-container portal-header-content">
                        <a href="/" className="portal-logo">
                            <span className="portal-logo-text">
                                {logoNombre}
                                {logoSubtitulo && <small>{logoSubtitulo}</small>}
                            </span>
                        </a>
                        <button type="button"
                                className={`portal-nav-toggle ${navOpen ? "is-open" : ""}`}
                                onClick={() => setNavOpen((p) => !p)}
                                aria-label="Abrir navegación" aria-expanded={navOpen}>
                            <span /><span /><span />
                        </button>
                        <nav className={`portal-nav ${navOpen ? "is-open" : ""}`}>
                            {navItems.map((item) => (
                                <div key={item.label} className="portal-nav-item">
                                    <a href={item.href} className="portal-nav-link"
                                       onMouseEnter={() => item.sections?.[0] && prefetchSeccion(item.sections[0])}
                                       onClick={() => item.simple && setNavOpen(false)}>
                                        <span>{item.label}</span>
                                        {!item.simple && item.subItems?.length > 0 && (
                                            <span className="portal-nav-arrow" aria-hidden="true" />
                                        )}
                                    </a>
                                    {!item.simple && item.subItems?.length > 0 && (
                                        <div className="portal-dropdown">
                                            <div className="portal-dropdown-head">
                                                <strong>{item.label}</strong>
                                                <small>Explora contenidos y categorías</small>
                                            </div>
                                            <a href={item.href} className="portal-dropdown-item portal-dropdown-all"
                                               onClick={() => limpiarVariasSecciones(item.sections || [])}>
                                                Ver todo
                                            </a>
                                            <div className="portal-dropdown-grid">
                                                {item.subItems.map((sub, idx) => (
                                                    <a key={`${sub.label}-${idx}`} href={sub.href}
                                                       className={`portal-dropdown-item ${sub.featured ? "portal-dropdown-featured" : ""}`}
                                                       onMouseEnter={() => sub.sectionId && sub.sectionId !== "institucional" && prefetchSeccion(sub.sectionId)}
                                                       onClick={() => sub.kind === "category"
                                                           ? seleccionarCategoriaNav(sub.sectionId, sub.idcategoria)
                                                           : limpiarCategoriaNav(sub.sectionId)
                                                       }>
                                                        {sub.label}
                                                    </a>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </nav>
                    </div>
                </header>
            </div>

            <main>
                {/* ── Hero ── */}
                <section id="inicio" className="portal-hero">
                    <div className="portal-container">
                        <div className="portal-hero-content">
                            <div className="portal-hero-main">
                                <span className="portal-hero-tag">{heroEtiqueta}</span>
                                <h1>{heroTitulo} <span className="accent">{heroAcento}</span></h1>
                                <p>{heroDescripcion}</p>
                                <div className="portal-hero-actions">
                                    <a href={heroBtn1Href} className="portal-hero-btn portal-hero-btn-primary">{heroBtn1Texto}</a>
                                    <a href={heroBtn2Href} className="portal-hero-btn portal-hero-btn-ghost">{heroBtn2Texto}</a>
                                </div>
                            </div>
                            {contactoInstitucional.length > 0 && (
                                <div className="portal-hero-contactos-cvr">
                                    {contactoInstitucional.map((item, index) => {
                                        const href = getContactoHref(item);
                                        const clave = String(item.clave || "").toLowerCase();
                                        const tipoIcono = clave.includes("correo")
                                            ? "correo"
                                            : clave.includes("telefono")
                                                ? "telefono"
                                                : clave.includes("direccion")
                                                    ? "direccion"
                                                    : "institucional";
                                        return (
                                            <article key={item.idinfo || item.id || index} className="portal-hero-card-cvr" data-clave={item.clave || ""}>
                                                <span className="portal-hero-card-icon">
                                                    <PortalPlaceholderIcon type={tipoIcono} size={18} />
                                                </span>
                                                <div className="portal-hero-card-content">
                                                    <strong>{item.titulo}</strong>
                                                    {href ? (
                                                        <a href={href} target={href.startsWith("http") ? "_blank" : undefined} rel={href.startsWith("http") ? "noreferrer" : undefined}>{item.contenido}</a>
                                                    ) : (
                                                        <p>{item.contenido}</p>
                                                    )}
                                                </div>
                                            </article>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </section>

                {/* ── Institucional ── */}
                <ModuleSection id="institucional" catalogos={catalogos} title={secTitulos.institucional} subtitle={secTitulos.institucionalSub || moduloInstitucional?.descripcion}>
                    <div className="portal-institucional-dinamico">
                        <div className="portal-institucional-lista">
                            {institucionalVisible.length === 0
                                ? <EmptyState text="No hay información institucional publicada por el momento." />
                                : institucionalVisible.map((item, index) => (
                                    <article key={item.idinfo || item.id || index}
                                             className={`portal-institucional-item ${index === 0 && item.__key === "descripcion" ? "portal-institucional-destacado" : ""}`}
                                             data-tipo={item.__key}>
                                        <div className="portal-institucional-item-contenido">
                                            <span className="portal-institucional-item-etiqueta">{item.__label}</span>
                                            <h3>{item.titulo}</h3>
                                            <InstitucionalContenido contenido={item.contenido} />
                                        </div>
                                    </article>
                                ))}
                        </div>
                    </div>
                </ModuleSection>

                {/* ── Autoridades ── */}
                <ModuleSection id="autoridades" catalogos={catalogos} title={secTitulos.autoridades} subtitle={secTitulos.autoridadesSub} className="portal-section-alt">
                    <GridList items={autoridades} type="autoridades" variant="autoridad" onOpenResource={openResourceViewer} imgDefaultAvatar={imgDefaultAvatar} />
                </ModuleSection>

                {/* ── Servicios ── */}
                {renderSection("servicios", serviciosQuery, ServiceShowcase, seccionData.servicios, categoriaServicios, secTitulos.servicios, secTitulos.serviciosSub, "", { cfg: cfgServicios, contactos: contactoInstitucional, emptyText: emptyTextos.servicios })}

                {/* ── Sistemas ── */}
                {renderSection("sistemas", sistemasQuery, SystemsPanel, seccionData.sistemas, categoriaSistemas, secTitulos.sistemas, secTitulos.sistemasSub, "portal-section-alt")}

                {/* ── Noticias ── */}
                <ModuleSection id="noticias" catalogos={catalogos} title={noticiasTitulo} subtitle={noticiasSubtitulo} className="portal-section-news-wide">
                    <SectionTools
                        sectionId="noticias" catalogos={catalogos}
                        selectedCategory={categoriaNoticias}
                        onSelect={seleccionarCategoriaNav}
                        onClear={() => limpiarCategoriaNav("noticias")}
                        searchValue={busquedaNoticias}
                        onSearch={noticiasBusquedaActiva ? setBusquedaNoticias : null}
                        searchPlaceholder={noticiasPlaceholder}
                    />
                    <ActiveFilter label={categoriaNoticias?.nombre} onClear={() => limpiarCategoriaNav("noticias")} />
                    {noticiasQuery.isLoading ? (
                        <LoadingSection text={emptyTextos.loading} />
                    ) : noticiasQuery.isError ? (
                        <ErrorSection text={emptyTextos.error} onRetry={() => noticiasQuery.refetch()} />
                    ) : (
                        <PortalErrorBoundary>
                            <Suspense fallback={<LoadingSection text={emptyTextos.loading} />}>
                                <NewsShowcase
                                    items={noticiasFiltradasPorBusqueda}
                                    emptyAction={categoriaNoticias || busquedaNoticias ? () => { setBusquedaNoticias(""); limpiarCategoriaNav("noticias"); } : null}
                                    onOpenResource={openResourceViewer}
                                    onOpenNoticia={openNoticiaModal}
                                    imgDefaultCard={imgDefaultCard}
                                />
                            </Suspense>
                        </PortalErrorBoundary>
                    )}
                </ModuleSection>

                {/* ── Proyectos ── */}
                {renderSection("proyectos", proyectosQuery, ProjectTimeline, seccionData.proyectos, categoriaProyectos, secTitulos.proyectos, secTitulos.proyectosSub, "portal-section-alt", { imgDefaultCard })}

                {/* ── Documentos ── */}
                {renderSection("documentos", documentosQuery, DocumentList, seccionData.documentos, categoriaDocumentos, secTitulos.documentos, secTitulos.documentosSub, "", { imgDefaultCard })}

                {/* ── Eventos ── */}
                {renderSection("eventos", eventosQuery, EventAgenda, seccionData.eventos, categoriaEventos, secTitulos.eventos, secTitulos.eventosSub, "portal-section-alt", { imgDefaultCard })}

                {/* ── Tutoriales ── */}
                {renderSection("tutoriales", tutorialesQuery, TutorialRail, seccionData.tutoriales, categoriaTutoriales, secTitulos.tutoriales, secTitulos.tutorialesSub, "", { imgDefaultCard })}

                {/* ── FAQs ── */}
                <ModuleSection id="faqs" catalogos={catalogos} title={secTitulos.faqs} subtitle={secTitulos.faqsSub} className="portal-section-alt">
                    <SectionTools sectionId="faqs" catalogos={catalogos} selectedCategory={categoriaFaqsSeleccionada} onSelect={seleccionarCategoriaNav} onClear={() => limpiarCategoriaNav("faqs")} />
                    <ActiveFilter label={categoriaFaqsSeleccionada?.nombre} onClear={() => limpiarCategoriaNav("faqs")} />
                    {faqsQuery.isLoading ? (
                        <LoadingSection text={emptyTextos.loading} />
                    ) : faqsQuery.isError ? (
                        <ErrorSection text={emptyTextos.error} onRetry={() => faqsQuery.refetch()} />
                    ) : seccionData.faqs.length === 0 ? (
                        <EmptyState text={emptyTextos.faqs} actionText={categoriaFaqsSeleccionada ? emptyTextos.quitarFiltro : null} onAction={categoriaFaqsSeleccionada ? () => limpiarCategoriaNav("faqs") : null} />
                    ) : (
                        <PortalErrorBoundary>
                            <Suspense fallback={<LoadingSection text={emptyTextos.loading} />}>
                                <FaqList
                                    items={seccionData.faqs}
                                    selectedCategory={categoriaFaqsSeleccionada}
                                    onClearCategory={() => limpiarCategoriaNav("faqs")}
                                    onGoToSupport={() => document.getElementById("soporte")?.scrollIntoView({ behavior: "smooth", block: "start" })}
                                />
                            </Suspense>
                        </PortalErrorBoundary>
                    )}
                </ModuleSection>

                {/* ── Soporte ── */}
                <ModuleSection id="soporte" catalogos={catalogos} title={soporteTitulo} subtitle={soporteSubtitulo}>
                    <SoporteForm catalogos={catalogos} cfg={cfgSoporte} textos={soporteTextos} />
                </ModuleSection>
            </main>

            {/* ── Footer ── */}
            <footer className="portal-footer">
                <div className="portal-container portal-footer-grid">
                    <div className="portal-footer-brand">
                        <h3>{footerNombre}</h3>
                        <p>{footerDesc}</p>
                        {contactoInstitucional.length > 0 && (
                            <div className="portal-footer-contacto">
                                {contactoInstitucional.map((item, index) => {
                                    const href = getContactoHref(item);
                                    return (
                                        <div key={item.idinfo || item.id || index} className="portal-footer-contacto-item">
                                            <div>
                                                <strong>{item.titulo}</strong>
                                                {href
                                                    ? <a href={href} target={href.startsWith("http") ? "_blank" : undefined} rel={href.startsWith("http") ? "noreferrer" : undefined}>{item.contenido}</a>
                                                    : <p>{item.contenido}</p>}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                    <div className="portal-footer-links">
                        <h4>Enlaces rápidos</h4>
                        {footerLinksRapidos.map((item, idx) => <a key={idx} href={item.href}>{item.texto}</a>)}
                    </div>
                    <div className="portal-footer-links">
                        <h4>Apoyo</h4>
                        {footerLinksApoyo.map((item, idx) => <a key={idx} href={item.href}>{item.texto}</a>)}
                    </div>
                </div>
                <div className="portal-container portal-footer-bottom">
                    <p>&copy; {new Date().getFullYear()} {logoNombre}. Todos los derechos reservados.</p>
                </div>
            </footer>

            {/* ── Resource Viewer Modal ── */}
            <Suspense fallback={null}>
                <ResourceViewerModal
                    key={resourceViewer
                        ? `${resourceViewer.type}-${resourceViewer.item?.slug || resourceViewer.item?.iddocumento || resourceViewer.item?.idnoticia || resourceViewer.item?.idevento || resourceViewer.item?.idtutorial || resourceViewer.item?.idproyecto || resourceViewer.item?.idservicio || resourceViewer.item?.idenlace || resourceViewer.item?.id || resourceViewer.item?.url || "resource"}`
                        : "empty-resource"
                    }
                    resource={resourceViewer}
                    onClose={closeResourceViewer}
                />
            </Suspense>

            {/* ── Noticia Modal ── */}
            {noticiaModalSlug && (
                <Suspense fallback={null}>
                    <NoticiaModal
                        key={noticiaModalSlug}
                        slug={noticiaModalSlug}
                        onClose={closeNoticiaModal}
                        onOpenNoticia={openNoticiaModal}
                    />
                </Suspense>
            )}
        </div>
    );
}
