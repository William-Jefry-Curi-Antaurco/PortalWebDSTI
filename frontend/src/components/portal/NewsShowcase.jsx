import { useRef, useState } from "react";
import {
    getCategory,
    getTitle,
    getDescription,
    getFileUrl,
    getImageUrl,
    formatDate,
} from "../../utils/portalUtils";
import { ResourceButton } from "./ResourceButton.jsx";
import EtiquetaBadges from "./EtiquetaBadges.jsx";
import PortalPlaceholderIcon from "./PortalPlaceholderIcon.jsx";

export default function NewsShowcase({
                                         items,
                                         emptyAction,
                                         onOpenResource = null,
                                         onOpenNoticia = null,
                                         imgDefaultCard = null,
                                     }) {
    const trackRef = useRef(null);

    if (!items || items.length === 0) {
        return (
            <div className="portal-empty-state">
                <p>No se encontraron noticias o comunicados con esos criterios.</p>

                {emptyAction && (
                    <button type="button" onClick={emptyAction}>
                        Ver todas las noticias
                    </button>
                )}
            </div>
        );
    }

    function scrollCarousel(direction) {
        const track = trackRef.current;

        if (!track) return;

        const cardWidth = track.querySelector(".portal-news-carousel-card")
            ?.offsetWidth || 360;

        track.scrollBy({
            left: direction === "next" ? cardWidth + 24 : -(cardWidth + 24),
            behavior: "smooth",
        });
    }

    return (
        <div className="portal-news-carousel-wrapper">
            <div className="portal-news-carousel-head">
                <div>
                    <span className="portal-section-module">
                        Últimas publicaciones
                    </span>
                    <h3>Noticias destacadas</h3>
                    <p>
                        Revisa comunicados, avisos y novedades institucionales
                        publicadas recientemente.
                    </p>
                </div>

                <div className="portal-news-carousel-controls">
                    <button
                        type="button"
                        onClick={() => scrollCarousel("prev")}
                        aria-label="Ver noticias anteriores"
                    >
                        ‹
                    </button>

                    <button
                        type="button"
                        onClick={() => scrollCarousel("next")}
                        aria-label="Ver más noticias"
                    >
                        ›
                    </button>
                </div>
            </div>

            <div className="portal-news-carousel-bleed">
                <div className="portal-news-carousel-track" ref={trackRef}>
                    {items.map((item, index) => (
                        <NewsCarouselCard
                            key={item.idnoticia || item.id || index}
                            item={item}
                            index={index}
                            onOpenResource={onOpenResource}
                            onOpenNoticia={onOpenNoticia}
                            imgDefaultCard={imgDefaultCard}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}

function NewsCarouselCard({ item, index, onOpenResource, onOpenNoticia, imgDefaultCard }) {
    const title = getTitle(item);
    const description = getDescription(item);
    const category = getCategory(item);
    const image = getImageUrl(item);
    const fileUrl = getFileUrl(item);
    const date = formatDate(getDateValue(item));
    const [imageFailed, setImageFailed] = useState(false);
    const mostrarImagen = image && !imageFailed;

    return (
        <article
            className={`portal-news-carousel-card ${
                index === 0 ? "portal-news-carousel-card-featured" : ""
            }`}
            data-type="noticias"
        >
            <div
                className={`portal-news-carousel-image ${
                    !mostrarImagen ? "has-default-image" : ""
                }`}
                data-type="noticias"
            >
                {mostrarImagen ? (
                    <img
                        src={image}
                        alt={title || "Noticia"}
                        loading="lazy"
                        decoding="async"
                        onError={() => setImageFailed(true)}
                    />
                ) : (
                    <PortalPlaceholderIcon
                        type="noticias"
                        size={34}
                        imagenUrl={imgDefaultCard}
                        alt={title}
                    />
                )}

                <div className="portal-news-carousel-gradient" />

                <div className="portal-news-carousel-floating-meta">
                    {category && <span>{category}</span>}
                    {date && <span>{date}</span>}
                </div>
            </div>

            <div className="portal-news-carousel-body">
                <div className="portal-card-meta">
                    {category && (
                        <span className="portal-card-badge">{category}</span>
                    )}

                    {date && (
                        <span className="portal-card-date">{date}</span>
                    )}
                </div>

                {title && <h3>{title}</h3>}

                {description && <p>{description}</p>}

                <EtiquetaBadges item={item} />

                <div className="portal-news-carousel-actions">
                    {fileUrl && (
                        <ResourceButton
                            item={item}
                            type="noticias"
                            onOpenResource={onOpenResource}
                        />
                    )}

                    {!fileUrl && item?.slug && (
                        <button
                            type="button"
                            className="portal-card-button"
                            onClick={() =>
                                onOpenNoticia
                                    ? onOpenNoticia(item.slug)
                                    : (window.location.href = `/noticias/${item.slug}`)
                            }
                        >
                            Leer más
                        </button>
                    )}
                </div>
            </div>
        </article>
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

function getNewsImages(item) {
    const posiblesImagenes =
        item?.imagenes ||
        item?.noticias_imagen ||
        item?.noticiasImagen ||
        item?.imagenes_noticia ||
        item?.imagenesNoticia ||
        [];

    const desdeRelacion = Array.isArray(posiblesImagenes)
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

    const directas = [
        item?.imagen_portada_url,
        item?.portada_url,
        item?.imagen_url,
        item?.imagen_portada?.url,
        item?.imagen_portada?.ruta,
        item?.imagen?.url,
        item?.imagen?.ruta,
        item?.archivo?.url,
        item?.archivo?.ruta,
    ]
        .filter(Boolean)
        .map(getStorageUrl)
        .filter(Boolean);

    return [...desdeRelacion, ...directas];
}