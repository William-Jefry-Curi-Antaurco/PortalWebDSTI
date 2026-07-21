// src/components/portal/EventAgenda.jsx
import { useMemo, useState } from "react";
import {
    getCategory,
    getTitle,
    getDescription,
    getStatus,
    getFileExtension,
    getFileUrl,
    getStorageUrl,
} from "../../utils/portalUtils";
import { ResourceButton } from "./ResourceButton";
import PortalPlaceholderIcon from "./PortalPlaceholderIcon";

function esImagen(meta) {
    const ext = String(meta?.extension || "").toLowerCase();
    const mime = String(meta?.mime_type || meta?.mime || "").toLowerCase();
    return mime.startsWith("image/") || ["jpg", "jpeg", "png", "webp", "gif", "svg"].includes(ext);
}

function getArchivoUrl(archivo) {
    const ruta = archivo?.ruta || archivo?.url || archivo?.path || archivo?.nombre_guardado || "";
    return ruta ? getStorageUrl(ruta) : null;
}

function getGaleriaEvento(item) {
    const relaciones = [
        ...(Array.isArray(item?.archivos) ? item.archivos : []),
        ...(Array.isArray(item?.eventos_archivos) ? item.eventos_archivos : []),
        ...(Array.isArray(item?.eventosArchivos) ? item.eventosArchivos : []),
        ...(Array.isArray(item?.imagenes) ? item.imagenes : []),
        ...(Array.isArray(item?.galeria) ? item.galeria : []),
    ];

    const desdeRelaciones = relaciones
        .map((relacion, index) => {
            const archivo = relacion?.archivo || relacion;
            if (!esImagen(archivo) && String(relacion?.tipo || "").toLowerCase() !== "imagen") return null;

            const url = getArchivoUrl(archivo) || getStorageUrl(relacion?.ruta || relacion?.url || relacion?.imagen_url || "");
            if (!url) return null;

            return {
                url,
                portada: Number(relacion?.es_portada) === 1 || Number(relacion?.portada) === 1,
                orden: Number(relacion?.orden ?? index),
                titulo: archivo?.nombre_original || getTitle(item) || "Imagen del evento",
            };
        })
        .filter(Boolean);

    const directas = [
        item?.imagen_url,
        item?.banner_url,
        item?.portada,
        item?.imagen_portada?.ruta,
        item?.imagen_portada?.url,
    ]
        .map(getStorageUrl)
        .filter(Boolean)
        .map((url, index) => ({ url, portada: index === 0, orden: -10 + index, titulo: getTitle(item) || "Imagen del evento" }));

    const principal = item?.archivo && esImagen(item.archivo)
        ? [{ url: getArchivoUrl(item.archivo), portada: false, orden: 999, titulo: item.archivo?.nombre_original || getTitle(item) }].filter((img) => img.url)
        : [];

    const unicas = [...desdeRelaciones, ...directas, ...principal].filter(
        (img, index, lista) => img?.url && lista.findIndex((x) => x.url === img.url) === index
    );

    return unicas.sort((a, b) => Number(b.portada) - Number(a.portada) || Number(a.orden) - Number(b.orden));
}

function getFechaInicio(item) {
    return item?.fecha_inicio || item?.fecha_evento || item?.fecha_publicacion || item?.created_at || "";
}

function getFechaFin(item) {
    return item?.fecha_fin || "";
}

function getFechaPartes(value) {
    if (!value) return null;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;

    return {
        dia: new Intl.DateTimeFormat("es-PE", { day: "2-digit" }).format(date),
        mes: new Intl.DateTimeFormat("es-PE", { month: "short" }).format(date).replace(".", ""),
        anio: new Intl.DateTimeFormat("es-PE", { year: "numeric" }).format(date),
        hora: new Intl.DateTimeFormat("es-PE", { hour: "2-digit", minute: "2-digit", hour12: true }).format(date),
        completa: new Intl.DateTimeFormat("es-PE", { day: "2-digit", month: "long", year: "numeric" }).format(date),
    };
}

function getModalidad(item) {
    return item?.modalidad?.nombre || item?.modalidad_nombre || (typeof item?.modalidad === "string" ? item.modalidad : "") || "";
}

function getTipoEvento(item) {
    return item?.tipoEvento?.nombre || item?.tipo_evento?.nombre || item?.tipo_evento_nombre || "";
}

function getUbicacion(item) {
    return item?.ubicacion || item?.lugar || "";
}

function getEnlaceVirtual(item) {
    const url = item?.enlace_virtual || item?.enlaceVirtual || "";
    return typeof url === "string" && url.trim() ? url.trim() : null;
}

function getCupos(item) {
    const max = Number(item?.cupo_maximo);
    const ocupados = Number(item?.cupos_ocupados);
    if (!Number.isFinite(max) || max <= 0) return null;
    const usados = Number.isFinite(ocupados) ? ocupados : 0;
    return { max, usados, disponibles: Math.max(0, max - usados), porcentaje: Math.min(100, Math.max(0, (usados / max) * 100)) };
}

function getEstadoClave(item) {
    const estado = String(getStatus(item) || "").toLowerCase();
    if (estado.includes("cancel")) return "cancelado";
    if (estado.includes("realiz") || estado.includes("finaliz")) return "realizado";
    return "proximo";
}

function EventoImagenPrincipal({ imagenes, titulo }) {
    const [actual, setActual] = useState(0);
    const imagen = imagenes[actual];

    if (!imagenes.length) return null;

    function anterior() {
        setActual((value) => (value === 0 ? imagenes.length - 1 : value - 1));
    }

    function siguiente() {
        setActual((value) => (value === imagenes.length - 1 ? 0 : value + 1));
    }

    return (
        <div className="portal-event-detail-gallery">
            <div className="portal-event-detail-main-image">
                <img src={imagen.url} alt={imagen.titulo || titulo || "Imagen del evento"} />

                {imagenes.length > 1 && (
                    <>
                        <button type="button" className="portal-event-gallery-nav prev" onClick={anterior} aria-label="Imagen anterior">‹</button>
                        <button type="button" className="portal-event-gallery-nav next" onClick={siguiente} aria-label="Imagen siguiente">›</button>
                        <span className="portal-event-gallery-count">{actual + 1} / {imagenes.length}</span>
                    </>
                )}
            </div>

            {imagenes.length > 1 && (
                <div className="portal-event-gallery-thumbs">
                    {imagenes.map((img, index) => (
                        <button
                            type="button"
                            key={`${img.url}-${index}`}
                            className={index === actual ? "is-active" : ""}
                            onClick={() => setActual(index)}
                            aria-label={`Ver imagen ${index + 1}`}
                        >
                            <img src={img.url} alt="" />
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

function EventoDetalleModal({ evento, onClose }) {
    const imagenes = useMemo(() => getGaleriaEvento(evento), [evento]);
    const fecha = getFechaPartes(getFechaInicio(evento));
    const fechaFin = getFechaPartes(getFechaFin(evento));
    const cupos = getCupos(evento);
    const modalidad = getModalidad(evento);
    const ubicacion = getUbicacion(evento);
    const enlaceVirtual = getEnlaceVirtual(evento);
    const tipoEvento = getTipoEvento(evento);
    const estado = getStatus(evento);
    const fileUrl = getFileUrl(evento);

    function cerrarConFondo(e) {
        if (e.target === e.currentTarget) onClose();
    }

    return (
        <div className="portal-event-modal-overlay" role="dialog" aria-modal="true" onClick={cerrarConFondo}>
            <div className="portal-event-modal">
                <div className="portal-event-modal-header">
                    <div>
                        <span className="portal-section-module">Eventos y capacitaciones</span>
                        <h3>{getTitle(evento)}</h3>
                    </div>
                    <button type="button" className="portal-event-modal-close" onClick={onClose} aria-label="Cerrar">×</button>
                </div>

                <div className="portal-event-modal-body">
                    <EventoImagenPrincipal imagenes={imagenes} titulo={getTitle(evento)} />

                    <div className="portal-event-detail-layout">
                        <div className="portal-event-detail-content">
                            <div className="portal-card-meta">
                                {getCategory(evento) && <span className="portal-card-badge">{getCategory(evento)}</span>}
                                {tipoEvento && <span className="portal-card-date">{tipoEvento}</span>}
                                {estado && <span className={`portal-event-estado is-${getEstadoClave(evento)}`}>{estado}</span>}
                                {modalidad && <span className="portal-card-date">{modalidad}</span>}
                                {getFileExtension(evento) && <span className="portal-card-date">{getFileExtension(evento)}</span>}
                            </div>

                            {getDescription(evento) && <p className="portal-event-detail-description">{getDescription(evento)}</p>}

                            <div className="portal-event-detail-data">
                                {fecha && (
                                    <div>
                                        <span>Fecha y hora</span>
                                        <strong>{fecha.completa} · {fecha.hora}{fechaFin ? ` – ${fechaFin.hora}` : ""}</strong>
                                    </div>
                                )}
                                {ubicacion && (
                                    <div>
                                        <span>Ubicación</span>
                                        <strong>{ubicacion}</strong>
                                    </div>
                                )}
                                {!ubicacion && enlaceVirtual && (
                                    <div>
                                        <span>Modalidad</span>
                                        <strong>Evento virtual</strong>
                                    </div>
                                )}
                                {cupos && (
                                    <div>
                                        <span>Cupos</span>
                                        <strong>{cupos.disponibles} disponibles de {cupos.max}</strong>
                                        <div className="portal-event-cupos-bar"><i style={{ width: `${cupos.porcentaje}%` }} /></div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <aside className="portal-event-detail-aside">
                            {fecha && (
                                <div className="portal-event-detail-date-card">
                                    <strong>{fecha.dia}</strong>
                                    <span>{fecha.mes} {fecha.anio}</span>
                                </div>
                            )}
                            <div className="portal-event-detail-actions">
                                {fileUrl && <ResourceButton item={evento} type="eventos" onOpenResource={null} />}
                                {enlaceVirtual && (
                                    <a href={enlaceVirtual} target="_blank" rel="noopener noreferrer" className="portal-event-join-link">Unirse al evento</a>
                                )}
                            </div>
                        </aside>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function EventAgenda({ items, emptyAction, onOpenResource = null, imgDefaultCard = null }) {
    const [eventoDetalle, setEventoDetalle] = useState(null);

    if (!items || items.length === 0) {
        return (
            <div className="portal-empty-state">
                <p>No hay eventos o capacitaciones registrados para este filtro.</p>
                {emptyAction && <button type="button" onClick={emptyAction}>Ver todos los eventos</button>}
            </div>
        );
    }

    return (
        <>
            <div className="portal-event-agenda">
                {items.map((item, index) => {
                    const imagenes = getGaleriaEvento(item);
                    const imagen = imagenes[0]?.url || null;
                    const fecha = getFechaPartes(getFechaInicio(item));
                    const horaFin = getFechaPartes(getFechaFin(item));
                    const modalidad = getModalidad(item);
                    const ubicacion = getUbicacion(item);
                    const enlaceVirtual = getEnlaceVirtual(item);
                    const cupos = getCupos(item);
                    const estadoClave = getEstadoClave(item);
                    const tipoEvento = getTipoEvento(item);

                    return (
                        <article className="portal-event-card" data-estado={estadoClave} data-con-imagen={imagen ? "si" : "no"} key={item.idevento || item.id || index}>
                            <div className={`portal-event-media ${imagen ? "" : "is-fallback"}`}>
                                {imagen ? (
                                    <img src={imagen} alt={getTitle(item) || "Evento"} loading="lazy" decoding="async" />
                                ) : (
                                    <PortalPlaceholderIcon type="eventos" size={30} imagenUrl={imgDefaultCard} alt={getTitle(item)} />
                                )}

                                {imagenes.length > 1 && (
                                    <span className="portal-event-image-count">+{imagenes.length - 1} imágenes</span>
                                )}

                                {fecha && (
                                    <div className="portal-event-fecha-chip">
                                        <strong>{fecha.dia}</strong>
                                        <span>{fecha.mes} {fecha.anio}</span>
                                    </div>
                                )}
                            </div>

                            <div className="portal-event-body">
                                <div className="portal-card-meta">
                                    {getCategory(item) && <span className="portal-card-badge">{getCategory(item)}</span>}
                                    {tipoEvento && <span className="portal-card-date">{tipoEvento}</span>}
                                    {getStatus(item) && <span className={`portal-event-estado is-${estadoClave}`}>{getStatus(item)}</span>}
                                    {modalidad && <span className="portal-card-date">{modalidad}</span>}
                                </div>

                                <h3>{getTitle(item)}</h3>
                                {getDescription(item) && <p>{getDescription(item)}</p>}

                                <ul className="portal-event-info">
                                    {fecha && <li className="portal-event-info-fecha">{fecha.dia} {fecha.mes} {fecha.anio} · {fecha.hora}{horaFin ? ` – ${horaFin.hora}` : ""}</li>}
                                    {ubicacion && <li className="portal-event-info-lugar">{ubicacion}</li>}
                                    {!ubicacion && enlaceVirtual && <li className="portal-event-info-virtual">Modalidad virtual</li>}
                                    {cupos && <li className="portal-event-info-cupos">{cupos.disponibles > 0 ? `${cupos.disponibles} cupos disponibles` : "Cupos completos"}<span> ({cupos.usados}/{cupos.max})</span></li>}
                                </ul>

                                <div className="portal-event-actions">
                                    <button type="button" className="portal-card-button" onClick={() => setEventoDetalle(item)}>
                                        Ver detalle
                                    </button>

                                    {getFileUrl(item) && (
                                        <ResourceButton item={item} type="eventos" onOpenResource={onOpenResource} />
                                    )}

                                    {enlaceVirtual && estadoClave !== "realizado" && estadoClave !== "cancelado" && (
                                        <a href={enlaceVirtual} target="_blank" rel="noopener noreferrer" className="portal-event-join-link">Unirse</a>
                                    )}
                                </div>
                            </div>
                        </article>
                    );
                })}
            </div>

            {eventoDetalle && <EventoDetalleModal evento={eventoDetalle} onClose={() => setEventoDetalle(null)} />}
        </>
    );
}
