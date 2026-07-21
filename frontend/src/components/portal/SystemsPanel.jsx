import {
    getCategory,
    getTitle,
    getDescription,
    getStatus,
    getFileUrl,
    formatDate,
} from "../../utils/portalUtils";
import {
    GraduationCap,
    BookOpen,
    Globe,
    FileText,
    ShieldCheck,
    Building2,
    Layers,
    MonitorCog,
    ExternalLink,
    ArrowUpRight,
    Rocket,
    Database,
    Cloud,
    Phone,
    Mail,
    Wifi,
    Calendar,
    Users,
    Bell,
    Folder,
    Search,
    Wrench,
    Laptop,
    Printer,
    Key,
    LifeBuoy,
    Server,
    Code,
    Settings,
    Ticket,
    Headset,
} from "lucide-react";

/* =============================================================================
   SystemsPanel — Sistemas institucionales
   - Iconos lucide-react segun categoria (o campo icono si es valido) + inicial.
   - Clic SIEMPRE coherente: archivo/PDF -> modal; enlace externo -> redirige.
   ============================================================================= */

// -- Estado operativo -> tono semantico (4 estados reales de tu BD) --
function getEstadoTono(item) {
    const slug = String(getStatus(item) || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim();

    if (slug.includes("disponible") && !slug.includes("no")) return "ok";
    if (slug.includes("mantenimiento") || slug.includes("intermitente")) return "warn";
    if (slug.includes("no disponible") || slug.includes("fuera")) return "down";
    return "neutral";
}

// -- Iconos lucide validos que aceptamos desde el campo `icono` de la BD --
const ICONOS_LUCIDE = {
    "graduation-cap": GraduationCap,
    "book":           BookOpen,
    "book-open":      BookOpen,
    "globe":          Globe,
    "file-text":      FileText,
    "shield":         ShieldCheck,
    "shield-check":   ShieldCheck,
    "building":       Building2,
    "layers":         Layers,
    "monitor":        MonitorCog,
    "monitor-cog":    MonitorCog,
    "rocket":         Rocket,
    "database":       Database,
    "cloud":          Cloud,
    "phone":          Phone,
    "mail":           Mail,
    "wifi":           Wifi,
    "calendar":       Calendar,
    "users":          Users,
    "bell":           Bell,
    "folder":         Folder,
    "search":         Search,
    "wrench":         Wrench,
    "laptop":         Laptop,
    "printer":        Printer,
    "key":            Key,
    "life-buoy":      LifeBuoy,
    "server":         Server,
    "code":           Code,
    "settings":       Settings,
    "ticket":         Ticket,
    "headset":        Headset,
};

// Normaliza el valor del campo icono y descarta basura como "?" / "?️"
function iconoBdValido(item) {
    const raw = String(item?.icono ?? "").trim().toLowerCase();
    if (!raw || raw === "?" || raw.includes("?")) return null;
    return ICONOS_LUCIDE[raw] || null;
}

// -- Mapeo por categoria (cuando el campo icono no sirve) --
function iconoPorCategoria(item) {
    const cat = String(getCategory(item) || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");

    if (cat.includes("academic")) return GraduationCap;
    if (cat.includes("biblioteca")) return BookOpen;
    if (cat.includes("administrat")) return Building2;
    if (cat.includes("tramite") || cat.includes("servicio")) return FileText;
    if (cat.includes("transparencia")) return ShieldCheck;
    return null;
}

// Devuelve el componente de icono a usar, o null si toca usar la inicial
// Orden: 1) campo icono de la BD  2) categoria  3) (null -> inicial)
function resolverIcono(item) {
    return iconoBdValido(item) || iconoPorCategoria(item);
}

function inicial(item) {
    return String(getTitle(item) || "S").trim().charAt(0).toUpperCase();
}

// Pinta el icono lucide o, si no hay, la inicial
function SystemIcon({ item, size = 22, className = "" }) {
    const Icono = resolverIcono(item);
    if (Icono) return <Icono size={size} strokeWidth={2.2} aria-hidden="true" />;
    return <span className={`portal-system-inicial ${className}`}>{inicial(item)}</span>;
}

// -- Clic coherente: archivo visualizable -> modal; enlace externo -> redirige --
function esArchivoVisualizable(item) {
    const url = String(getFileUrl(item) || "").toLowerCase().split("?")[0];
    if (!url) return false;
    if (url.includes("/storage/")) return true;
    const ext = url.split(".").pop();
    if (["pdf", "jpg", "jpeg", "png", "webp", "gif", "svg", "mp4", "webm", "ogg", "mov"].includes(ext)) return true;
    if (url.includes("youtube.com") || url.includes("youtu.be") || url.includes("vimeo.com")) return true;
    return false; // dominio externo normal -> redireccion
}

function abrirSistema(item, onOpenResource) {
    const url = getFileUrl(item);
    if (!url) return;
    if (esArchivoVisualizable(item) && onOpenResource) {
        onOpenResource(item, "sistemas");
    } else {
        window.open(url, "_blank", "noopener,noreferrer");
    }
}

export default function SystemsPanel({ items, emptyAction, onOpenResource = null }) {
    if (!items || items.length === 0) {
        return (
            <div className="portal-empty-state">
                <p>No hay sistemas institucionales registrados para este filtro.</p>
                {emptyAction && (
                    <button type="button" onClick={emptyAction}>
                        Ver todos los sistemas
                    </button>
                )}
            </div>
        );
    }

    const [principal, ...resto] = items;
    const principalEsArchivo = esArchivoVisualizable(principal);

    return (
        <div className="portal-systems-panel">
            {/* -- Sistema destacado -- */}
            <article
                className="portal-system-feature"
                data-type="sistemas"
                data-estado={getEstadoTono(principal)}
            >
                <div className="portal-system-feature-head">
                    <span className="portal-system-icon" aria-hidden="true">
                        <SystemIcon item={principal} size={26} />
                    </span>

                    <div className="portal-system-feature-tags">
                        {getCategory(principal) && (
                            <span className="portal-card-badge">{getCategory(principal)}</span>
                        )}
                        <EstadoBadge item={principal} />
                    </div>
                </div>

                <h3>{getTitle(principal)}</h3>

                {getDescription(principal) && <p>{getDescription(principal)}</p>}

                {formatDate(getDateValue(principal)) && (
                    <div className="portal-system-meta">
                        <span>{formatDate(getDateValue(principal))}</span>
                    </div>
                )}

                {getFileUrl(principal) && (
                    <button
                        type="button"
                        className="portal-card-button"
                        onClick={() => abrirSistema(principal, onOpenResource)}
                    >
                        {principalEsArchivo ? "Ver detalle" : "Ir al sistema"}
                        {principalEsArchivo
                            ? <ArrowUpRight size={16} aria-hidden="true" />
                            : <ExternalLink size={16} aria-hidden="true" />}
                    </button>
                )}
            </article>

            {/* -- Lista de sistemas -- */}
            <div
                className={`portal-systems-list ${
                    resto.length > 6 ? "has-scroll" : ""
                }`}
            >
                {resto.map((item, index) => {
                    const tono = getEstadoTono(item);
                    const tieneUrl = Boolean(getFileUrl(item));
                    const esArchivo = esArchivoVisualizable(item);

                    return (
                        <button
                            type="button"
                            className="portal-system-row"
                            data-estado={tono}
                            disabled={!tieneUrl}
                            onClick={() => abrirSistema(item, onOpenResource)}
                            title={tieneUrl ? (esArchivo ? "Ver detalle" : getFileUrl(item)) : getTitle(item)}
                            key={
                                item.idenlace ||
                                item.id_enlace_sistema ||
                                item.id_sistema ||
                                item.id ||
                                `sistema-${index}`
                            }
                        >
                            <span className="portal-system-row-icon" aria-hidden="true">
                                <SystemIcon item={item} size={20} />
                            </span>

                            <span className="portal-system-row-body">
                                <strong>{getTitle(item)}</strong>
                                <small className="portal-system-row-meta">
                                    {getCategory(item) && (
                                        <span className="portal-system-row-cat">{getCategory(item)}</span>
                                    )}
                                    <EstadoBadge item={item} compact />
                                </small>
                            </span>

                            {tieneUrl && (
                                <span className="portal-system-row-go" aria-hidden="true">
                                    {esArchivo ? "Ver" : "Abrir"}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

function EstadoBadge({ item, compact = false }) {
    const texto = getStatus(item);
    if (!texto) return null;
    const tono = getEstadoTono(item);

    return (
        <span
            className={`portal-system-estado ${compact ? "is-compact" : ""}`}
            data-tono={tono}
        >
            <span className="portal-system-estado-dot" aria-hidden="true" />
            {texto}
        </span>
    );
}

function getDateValue(item) {
    return (
        item?.fecha_publicacion ||
        item?.fecha_inicio ||
        item?.fecha_evento ||
        item?.fecha_documento ||
        item?.created_at ||
        ""
    );
}