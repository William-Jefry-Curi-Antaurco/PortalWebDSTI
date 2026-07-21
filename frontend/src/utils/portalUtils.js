const BACKEND_URL =
    import.meta.env.VITE_BACKEND_URL || "http://127.0.0.1:8000";

const imageCache = new WeakMap();
const fileUrlCache = new WeakMap();
const titleCache = new WeakMap();
const descriptionCache = new WeakMap();

export function getStorageUrl(path) {
    if (!path) return null;

    if (typeof path !== "string") return null;

    let cleanPath = path.trim();

    if (!cleanPath) return null;

    if (
        cleanPath.startsWith("http://") ||
        cleanPath.startsWith("https://")
    ) {
        return cleanPath;
    }

    cleanPath = cleanPath.replace(/^public\//, "");
    cleanPath = cleanPath.replace(/^storage\//, "");
    cleanPath = cleanPath.replace(/^\/storage\//, "");
    cleanPath = cleanPath.replace(/^\//, "");

    return `${BACKEND_URL}/storage/${cleanPath}`;
}

export function getArchivo(item) {
    return (
        item?.archivo ||
        item?.file ||
        item?.documento ||
        item?.recurso ||
        null
    );
}

export function getArchivoRuta(item) {
    const archivo = getArchivo(item);

    return (
        archivo?.ruta ||
        archivo?.path ||
        archivo?.url ||
        item?.archivo_url ||
        item?.url_archivo ||
        item?.documento_url ||
        item?.recurso_url ||
        null
    );
}

export function getUrlFromFields(item) {
    return (
        item?.url_externa ||
        item?.url ||
        item?.enlace ||
        item?.enlace_video ||
        item?.video_url ||
        item?.html_url ||
        item?.recurso_html ||
        null
    );
}

export function getFileUrl(item) {
    if (!item || typeof item !== "object") return null;

    if (fileUrlCache.has(item)) return fileUrlCache.get(item);

    const url = getStorageUrl(
        getArchivoRuta(item) ||
        getUrlFromFields(item) ||
        null
    );

    fileUrlCache.set(item, url);
    return url;
}

export function getImageCandidateFromArchivo(archivo) {
    if (!archivo) return null;

    const mime = archivo?.mime_type || archivo?.mime || "";
    const extension = archivo?.extension || "";

    const isImage =
        String(mime).startsWith("image/") ||
        ["jpg", "jpeg", "png", "webp", "gif", "svg"].includes(
            String(extension).toLowerCase()
        );

    if (!isImage) return null;

    return archivo?.url || archivo?.ruta || archivo?.path || null;
}

export function getImagenesNoticia(item) {
    const posiblesImagenes =
        item?.imagenes ||
        item?.noticias_imagen ||
        item?.noticiasImagen ||
        item?.imagenes_noticia ||
        item?.imagenesNoticia ||
        [];

    const imagenesDesdeRelacion = Array.isArray(posiblesImagenes)
        ? posiblesImagenes
            .map((imagen) => {
                return (
                    imagen?.url ||
                    imagen?.ruta ||
                    imagen?.imagen_url ||
                    imagen?.archivo?.url ||
                    imagen?.archivo?.ruta ||
                    imagen?.archivo?.nombre_guardado ||
                    null
                );
            })
            .filter(Boolean)
            .map(getStorageUrl)
            .filter(Boolean)
        : [];

    const imagenesDirectas = [
        item?.imagen_portada_url,
        item?.portada_url,
        item?.imagen_url,
        item?.imagen_portada?.url,
        item?.imagen_portada?.ruta,
        item?.imagen?.url,
        item?.imagen?.ruta,
        item?.archivo_imagen?.url,
        item?.archivo_imagen?.ruta,
        item?.archivo?.url,
        item?.archivo?.ruta,
    ]
        .filter(Boolean)
        .map(getStorageUrl)
        .filter(Boolean);

    return [...imagenesDesdeRelacion, ...imagenesDirectas];
}

export function getFirstImageFromArray(item) {
    const imagenes =
        item?.imagenes ||
        item?.noticias_imagen ||
        item?.noticiasImagen ||
        item?.imagenes_noticia ||
        item?.imagenesNoticia ||
        item?.images ||
        item?.galeria ||
        [];

    if (!Array.isArray(imagenes) || imagenes.length === 0) return null;

    const portada =
        imagenes.find((img) => Number(img?.es_portada) === 1) ||
        imagenes[0];

    return (
        portada?.archivo?.url ||
        portada?.archivo?.ruta ||
        portada?.archivo?.nombre_guardado ||
        portada?.url ||
        portada?.ruta ||
        portada?.path ||
        portada?.imagen_url ||
        null
    );
}

export function getImageUrl(item) {
    if (!item || typeof item !== "object") return null;

    if (imageCache.has(item)) return imageCache.get(item);

    const imagenesNoticia = getImagenesNoticia(item);
    const archivoImage = getImageCandidateFromArchivo(getArchivo(item));

    const url =
        imagenesNoticia[0] ||
        getStorageUrl(
            item?.imagen_url ||
            item?.foto_url ||
            item?.banner_url ||
            item?.thumbnail ||
            item?.portada ||
            item?.imagen_portada?.url ||
            item?.imagen_portada?.ruta ||
            item?.imagen?.url ||
            item?.imagen?.ruta ||
            item?.archivo_imagen?.url ||
            item?.archivo_imagen?.ruta ||
            item?.foto?.url ||
            item?.foto?.ruta ||
            getFirstImageFromArray(item) ||
            archivoImage
        );

    imageCache.set(item, url);
    return url;
}

export function getTitle(item) {
    if (!item || typeof item !== "object") return "";

    if (titleCache.has(item)) return titleCache.get(item);

    const title =
        item?.titulo ||
        item?.nombre ||
        item?.nombre_sistema ||
        item?.nombre_completo ||
        item?.pregunta ||
        item?.asunto ||
        "";

    titleCache.set(item, title);
    return title;
}

export function getDescription(item) {
    if (!item || typeof item !== "object") return "";

    if (descriptionCache.has(item)) return descriptionCache.get(item);

    const description =
        item?.descripcion ||
        item?.resumen ||
        item?.contenido ||
        item?.detalle ||
        item?.respuesta ||
        item?.funciones_principales ||
        "";

    descriptionCache.set(item, description);
    return description;
}

export function getCategory(item) {
    return (
        item?.categoria?.nombre ||
        item?.estado?.nombre ||
        item?.estadoOperativo?.nombre ||
        item?.estado_operativo?.nombre ||
        item?.tipoDocumento?.nombre ||
        item?.tipo_documento?.nombre ||
        item?.tipoEvento?.nombre ||
        item?.tipo_evento?.nombre ||
        item?.tipoTutorial?.nombre ||
        item?.tipo_tutorial?.nombre ||
        item?.tipoPublicacion?.nombre ||
        item?.tipo_publicacion?.nombre ||
        item?.modalidad?.nombre ||
        ""
    );
}

export function getEtiquetas(item) {
    return Array.isArray(item?.etiquetas) ? item.etiquetas : [];
}

export function getEtiquetasTexto(item) {
    return getEtiquetas(item)
        .map((etiqueta) => etiqueta?.nombre || "")
        .join(" ");
}

export function getStatus(item) {
    return (
        item?.estadoOperativo?.nombre ||
        item?.estado_operativo?.nombre ||
        item?.estado?.nombre ||
        ""
    );
}

export function getFileExtension(item) {
    const archivo = getArchivo(item);

    const ext =
        archivo?.extension ||
        item?.extension ||
        String(getFileUrl(item) || "")
            .split("?")[0]
            .split(".")
            .pop();

    if (!ext || String(ext).length > 8) return "";

    return String(ext).toUpperCase();
}

export function getFileSize(item) {
    const archivo = getArchivo(item);
    const bytes = archivo?.peso_bytes || archivo?.size || archivo?.tamano;

    if (!bytes) return "";

    const value = Number(bytes);

    if (Number.isNaN(value)) return "";

    if (value < 1024) return `${value} B`;
    if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;

    return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

export function getMimeType(item) {
    const archivo = getArchivo(item);

    return (
        archivo?.mime_type ||
        archivo?.mime ||
        item?.mime_type ||
        item?.mime ||
        ""
    );
}

export function getResourceKind(item) {
    const url = getFileUrl(item);
    const mime = String(getMimeType(item)).toLowerCase();
    const ext = String(getFileExtension(item)).toLowerCase();
    const rawUrl = String(url || "").toLowerCase();

    if (!url) return "none";

    if (mime.includes("pdf") || ext === "pdf") return "pdf";

    if (
        mime.startsWith("video/") ||
        ["mp4", "webm", "ogg", "mov", "m4v"].includes(ext)
    ) {
        return "video";
    }

    if (
        mime.startsWith("image/") ||
        ["jpg", "jpeg", "png", "webp", "gif", "svg"].includes(ext)
    ) {
        return "image";
    }

    if (mime.includes("html") || ["html", "htm"].includes(ext)) return "html";

    if (
        rawUrl.includes("youtube.com") ||
        rawUrl.includes("youtu.be") ||
        rawUrl.includes("vimeo.com")
    ) {
        return "external-video";
    }

    if (rawUrl.startsWith("http://") || rawUrl.startsWith("https://")) {
        return "link";
    }

    return "download";
}

export function getResourceActionText(item, type = "") {
    const kind = getResourceKind(item);

    if (kind === "pdf") return "Leer PDF";
    if (kind === "video" || kind === "external-video") return "Ver video";
    if (kind === "image") return "Ver imagen";
    if (kind === "html") return "Ver contenido";
    if (kind === "link") return "Ver enlace";

    if (type === "documentos") return "Leer documento";
    if (type === "eventos") return "Ver evento";
    if (type === "tutoriales") return "Ver tutorial";
    if (type === "proyectos") return "Ver proyecto";
    if (type === "servicios") return "Ver servicio";
    if (type === "sistemas") return "Acceder";
    if (type === "noticias") return "Leer comunicado";

    return "Ver más";
}

export function getYoutubeEmbedUrl(url) {
    if (!url) return null;

    try {
        const value = String(url);

        if (value.includes("youtu.be/")) {
            const id = value.split("youtu.be/")[1]?.split(/[?&]/)[0];
            return id ? `https://www.youtube.com/embed/${id}` : url;
        }

        const parsed = new URL(value);
        const id = parsed.searchParams.get("v");

        if (id) return `https://www.youtube.com/embed/${id}`;
        if (value.includes("/embed/")) return value;

        return url;
    } catch {
        return url;
    }
}

export function getViewerUrl(item) {
    const url = getFileUrl(item);
    const kind = getResourceKind(item);

    if (kind === "external-video") return getYoutubeEmbedUrl(url);

    return url;
}

export function formatDate(value, options = {}) {
    if (!value) return "";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "";

    return new Intl.DateTimeFormat("es-PE", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        ...options,
    }).format(date);
}