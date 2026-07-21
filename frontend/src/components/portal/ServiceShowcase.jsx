import { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
    Headset,
    Mail,
    Wifi,
    MonitorCog,
    FileText,
    Server,
    ShieldCheck,
    Code,
    GraduationCap,
    Settings,
    Lock,
    Globe,
    ExternalLink,
    Ticket,
    Send,
    Lightbulb,
    ArrowRight,
    Rocket,
    Database,
    Cloud,
    Phone,
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
} from "lucide-react";

// ---------------------------------------------------------------------------
// Helpers puros
// ---------------------------------------------------------------------------

function getServiceId(item) {
    return item?.idservicio ?? item?.id ?? null;
}

function isActive(item) {
    return (
        item?.activo === undefined ||
        item?.activo === null      ||
        item?.activo === true      ||
        item?.activo === 1         ||
        item?.activo === "1"
    );
}

function getServiceUrl(item) {
    const value = String(item?.url_servicio ?? item?.url ?? item?.enlace ?? item?.url_externa ?? "").trim();
    if (!value || value === "?") return "";
    return value;
}

function requiresAuth(item) {
    return (
        Number(item?.requiere_autenticacion) === 1 ||
        item?.requiere_autenticacion === true      ||
        item?.requiere_autenticacion === "1"
    );
}

function getCategoryLabel(item) {
    return item?.categoria?.nombre ?? item?.categoria_nombre ?? item?.tipo ?? "";
}

function getActionLabel(item) {
    return item?.texto_accion?.trim() || (getServiceUrl(item) ? "Abrir servicio" : "Solicitar ayuda");
}

function getShortDescription(item) {
    return item?.descripcion_corta ?? item?.resumen ?? item?.descripcion ?? "";
}

function getLongDescription(item) {
    return item?.descripcion_larga ?? item?.detalle ?? item?.contenido ?? "";
}

function isOn(value, defaultValue = true) {
    if (value === undefined || value === null || value === "") return defaultValue;
    return value === 1 || value === "1" || value === true;
}

function scrollToSection(hash) {
    const id = String(hash ?? "").replace("#", "");
    const el = document.getElementById(id);
    if (el) { el.scrollIntoView({ behavior: "smooth", block: "start" }); return; }
    if (hash) window.location.hash = hash;
}

function saveServiceInterest(service) {
    try {
        sessionStorage.setItem("portal_servicio_interes", JSON.stringify({
            idservicio: getServiceId(service),
            nombre:     service?.nombre ?? "",
            slug:       service?.slug   ?? null,
        }));
    } catch { /* no bloquea */ }
}

function openServiceUrl(url, service) {
    if (!url) return;
    saveServiceInterest(service);
    if (url.startsWith("#")) { scrollToSection(url); return; }
    window.open(url, "_blank", "noopener,noreferrer");
}

// ---------------------------------------------------------------------------
// Iconos lucide
// Orden de resolucion:
//   1) campo `icono` de la BD (si trae un nombre lucide valido)
//   2) mapeo automatico por categoria/nombre
//   3) fallback: Settings
// ---------------------------------------------------------------------------

// Nombres validos que el admin puede guardar en la columna `icono`.
const ICONOS_BD = {
    "headset":        Headset,
    "mail":           Mail,
    "wifi":           Wifi,
    "monitor":        MonitorCog,
    "monitor-cog":    MonitorCog,
    "file-text":      FileText,
    "server":         Server,
    "shield":         ShieldCheck,
    "shield-check":   ShieldCheck,
    "code":           Code,
    "graduation-cap": GraduationCap,
    "settings":       Settings,
    "globe":          Globe,
    "ticket":         Ticket,
    "rocket":         Rocket,
    "database":       Database,
    "cloud":          Cloud,
    "phone":          Phone,
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
};

// Mapeo automatico por palabras clave del nombre/categoria.
const ICON_MAP = [
    { keys: ["soporte", "ayuda", "helpdesk"],            Icon: Headset },
    { keys: ["correo", "email", "mail"],                 Icon: Mail },
    { keys: ["red", "conectividad", "wifi", "internet"], Icon: Wifi },
    { keys: ["academico", "sistema"],                    Icon: MonitorCog },
    { keys: ["document", "publicacion", "manual"],       Icon: FileText },
    { keys: ["hosting", "infraestructura", "servidor"],  Icon: Server },
    { keys: ["seguridad"],                               Icon: ShieldCheck },
    { keys: ["desarrollo", "software"],                  Icon: Code },
    { keys: ["capacitacion", "formacion"],               Icon: GraduationCap },
];


function iconoBdValido(item) {
    const raw = String(item?.icono ?? "").trim().toLowerCase();
    if (!raw || raw === "?" || raw.includes("?")) return null;
    return ICONOS_BD[raw] || null;
}

function getServiceIcon(item) {
    // 1) lo que venga de la BD manda
    const desdeBd = iconoBdValido(item);
    if (desdeBd) return desdeBd;

    // 2) mapeo automatico por nombre/categoria
    const text = String(`${getCategoryLabel(item)} ${item?.nombre ?? ""}`)
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
    for (const { keys, Icon } of ICON_MAP) {
        if (keys.some((k) => text.includes(k))) return Icon;
    }

    // 3) fallback
    return Settings;
}

const DEFAULTS = {
    emptyText:    "No hay servicios tecnológicos registrados por el momento.",
    relatedLabel: "Ver sección relacionada",
};

// ---------------------------------------------------------------------------
// Componente raíz
// ---------------------------------------------------------------------------
export default function ServiceShowcase({
                                            items       = [],
                                            emptyAction = null,
                                            emptyText   = DEFAULTS.emptyText,
                                            cfg         = {},
                                        }) {
    const [selectedService, setSelectedService] = useState(null);

    const mostrarOrientacion  = isOn(cfg.servicios_campo_orientacion,   true);
    const mostrarCasosUso     = isOn(cfg.servicios_campo_casos_uso,     true);
    const mostrarConsejo      = isOn(cfg.servicios_campo_consejo,       true);
    const mostrarCorreoPropio = isOn(cfg.servicios_campo_correo_propio, true);
    const mostrarSeccionRel   = isOn(cfg.servicios_campo_seccion_rel,   false);

    const activeServices = useMemo(
        () =>
            [...(items ?? [])]
                .filter(isActive)
                .sort((a, b) => {
                    const oa = Number(a?.orden ?? 999);
                    const ob = Number(b?.orden ?? 999);
                    if (oa !== ob) return oa - ob;
                    return Number(getServiceId(a) ?? 0) - Number(getServiceId(b) ?? 0);
                }),
        [items]
    );

    if (!activeServices.length) {
        return (
            <div className="portal-empty-state">
                <p>{emptyText}</p>
                {emptyAction && (
                    <button type="button" onClick={emptyAction}>Ver todos los servicios</button>
                )}
            </div>
        );
    }

    const [principal, ...resto] = activeServices;

    return (
        <div className="psv-showcase">
            {/* Servicio principal */}
            <ServiceCard
                key={getServiceId(principal) ?? "servicio-principal"}
                item={principal}
                featured
                onSelect={() => setSelectedService(principal)}
            />

            {/* Servicios secundarios: 6 visibles y el resto mediante scroll */}
            {resto.length > 0 && (
                <div
                    className={`psv-secondary-scroll ${
                        resto.length > 6 ? "has-scroll" : ""
                    }`}
                >
                    <div className="psv-secondary-grid">
                        {resto.map((item, index) => (
                            <ServiceCard
                                key={
                                    getServiceId(item) ??
                                    `servicio-secundario-${index}`
                                }
                                item={item}
                                featured={false}
                                onSelect={() => setSelectedService(item)}
                            />
                        ))}
                    </div>
                </div>
            )}

            {selectedService && (
                <ServiceModal
                    service={selectedService}
                    mostrarOrientacion={mostrarOrientacion}
                    mostrarCasosUso={mostrarCasosUso}
                    mostrarConsejo={mostrarConsejo}
                    mostrarCorreoPropio={mostrarCorreoPropio}
                    mostrarSeccionRel={mostrarSeccionRel}
                    onClose={() => setSelectedService(null)}
                />
            )}
        </div>
    );
}

// ---------------------------------------------------------------------------
// Tarjeta
// ---------------------------------------------------------------------------
function ServiceCard({ item, onSelect, featured = false }) {
    const name       = item?.nombre || "";
    const desc       = getShortDescription(item);
    const catLabel   = getCategoryLabel(item);
    const auth       = requiresAuth(item);
    const url        = getServiceUrl(item);
    const actionText = getActionLabel(item);
    const Icon       = getServiceIcon(item);

    function handlePrimaryAction(e) {
        e.stopPropagation();
        saveServiceInterest(item);
        if (url) { openServiceUrl(url, item); }
        else      { scrollToSection("#soporte"); }
    }

    return (
        <article className={`psv-card${featured ? " psv-card-featured" : ""}`} onClick={onSelect}>
            <div className={featured ? "psv-card-icon psv-card-icon-featured" : "psv-card-icon"}>
                <Icon size={featured ? 26 : 18} strokeWidth={2.1} aria-hidden="true" />
            </div>
            <div className="psv-card-body">
                {catLabel && <p className="psv-card-cat">{catLabel}</p>}
                <p className="psv-card-name">{name}</p>
                {desc && <p className="psv-card-desc">{desc}</p>}
                <div className="psv-card-footer">

                    <button
                        type="button"
                        className="psv-btn"
                        onClick={(e) => { e.stopPropagation(); onSelect(); }}
                    >
                        Ver detalle
                    </button>
                    <button
                        type="button"
                        className="psv-btn psv-btn-primary"
                        onClick={handlePrimaryAction}
                    >
                        {actionText}
                    </button>
                </div>
            </div>
        </article>
    );
}

// ---------------------------------------------------------------------------
// Modal
// ---------------------------------------------------------------------------
function ServiceModal({
                          service,
                          mostrarOrientacion,
                          mostrarCasosUso,
                          mostrarConsejo,
                          mostrarCorreoPropio,
                          mostrarSeccionRel,
                          onClose,
                      }) {
    const name       = service?.nombre || "";
    const shortDesc  = getShortDescription(service);
    const longDesc   = getLongDescription(service);
    const catLabel   = getCategoryLabel(service);
    const auth       = requiresAuth(service);
    const url        = getServiceUrl(service);
    const actionText = getActionLabel(service);
    const Icon       = getServiceIcon(service);

    const correo       = mostrarCorreoPropio ? service?.correo_contacto || "" : "";
    const orientacion  = service?.orientacion             || "";
    const casosUso     = service?.casos_uso               || "";
    const consejo      = service?.consejo                 || "";
    const seccionRel   = service?.seccion_relacionada     || "";
    const labelSeccion = service?.label_seccion           || DEFAULTS.relatedLabel;

    const casosLista = casosUso
        ? String(casosUso).split(/\n|;/).map(s => s.trim()).filter(Boolean)
        : [];

    const sinBloques = !longDesc && !orientacion && casosLista.length === 0 && !consejo;

    function handleBackdrop(e) {
        if (e.target === e.currentTarget) onClose();
    }

    function handlePrimary() {
        if (url) { openServiceUrl(url, service); }
        else     { saveServiceInterest(service); onClose(); scrollToSection("#soporte"); }
    }

    function handleRelated() {
        saveServiceInterest(service);
        onClose();
        scrollToSection(seccionRel);
    }

    return createPortal(
        <div className="psv-overlay" onClick={handleBackdrop} role="dialog" aria-modal="true" aria-label={name}>
            <div className="psv-dialog">

                {/* ── Panel izquierdo ── */}
                <aside className="psv-aside">
                    <button className="psv-close" type="button" onClick={onClose} aria-label="Cerrar">×</button>

                    <div className="psv-aside-icon">
                        <Icon size={20} strokeWidth={2.1} aria-hidden="true" />
                    </div>

                    {catLabel && <p className="psv-aside-cat">{catLabel}</p>}
                    <p className="psv-aside-title">{name}</p>
                    {shortDesc && <p className="psv-aside-desc">{shortDesc}</p>}

                    <div className="psv-pills">
                        <span className="psv-pill">
                            {auth
                                ? <Lock size={11} aria-hidden="true" />
                                : <Globe size={11} aria-hidden="true" />}
                            {auth ? "Requiere datos institucionales" : "Acceso público"}
                        </span>
                        <span className="psv-pill">
                            {url
                                ? <ExternalLink size={11} aria-hidden="true" />
                                : <Ticket size={11} aria-hidden="true" />}
                            {url ? "Tiene enlace oficial" : "Atención por Mesa de ayuda"}
                        </span>
                    </div>

                    <div className="psv-aside-actions">
                        <button type="button" className="psv-aside-btn-main" onClick={handlePrimary}>
                            {url
                                ? <ExternalLink size={13} aria-hidden="true" />
                                : <Send size={13} aria-hidden="true" />}
                            {url ? actionText : "Solicitar ayuda"}
                        </button>
                        {correo && (
                            <a href={`mailto:${correo}`} className="psv-aside-btn-sec">
                                <Mail size={13} aria-hidden="true" />
                                {correo}
                            </a>
                        )}
                    </div>
                </aside>

                {/* ── Panel derecho ── */}
                <main className="psv-main">

                    {longDesc && (
                        <div className="psv-block">
                            <span className="psv-block-label">Sobre este servicio</span>
                            <p className="psv-block-text">{longDesc}</p>
                        </div>
                    )}

                    {mostrarOrientacion && orientacion && (
                        <div className="psv-block">
                            <span className="psv-block-label">¿Cuándo usarlo?</span>
                            <p className="psv-block-text">{orientacion}</p>
                        </div>
                    )}

                    {mostrarCasosUso && casosLista.length > 0 && (
                        <div className="psv-block">
                            <span className="psv-block-label">Este servicio te ayuda si...</span>
                            <ul className="psv-cases">
                                {casosLista.map((caso, i) => (
                                    <li key={i} className="psv-case-item">
                                        <span className="psv-case-num">{i + 1}</span>
                                        {caso}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {mostrarConsejo && consejo && (
                        <div className="psv-block psv-block-tip">
                            <span className="psv-block-label">
                                <Lightbulb size={12} aria-hidden="true" />
                                Consejo previo
                            </span>
                            <p className="psv-block-text">{consejo}</p>
                        </div>
                    )}

                    {mostrarSeccionRel && seccionRel && (
                        <div className="psv-block">
                            <span className="psv-block-label">Sección relacionada</span>
                            <button type="button" className="psv-block-link" onClick={handleRelated}>
                                <ArrowRight size={13} aria-hidden="true" />
                                {labelSeccion}
                            </button>
                        </div>
                    )}

                    {sinBloques && (
                        <div className="psv-block">
                            <span className="psv-block-label">Descripción</span>
                            <p className="psv-block-text">{shortDesc}</p>
                        </div>
                    )}
                </main>
            </div>
        </div>,
        document.body
    );
}