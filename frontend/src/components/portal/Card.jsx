// src/components/portal/Card.jsx
import {
    getTitle,
    getDescription,
    getCategory,
    getStatus,
    getImageUrl,
    getFileUrl,
    getFileExtension,
    getFileSize,
    formatDate,
} from '../../utils/portalUtils';

import { Link } from 'react-router-dom';
import { ResourceButton } from './ResourceButton';


function getDateValue(item) {
    return (
        item?.fecha_publicacion ||
        item?.fecha_inicio      ||
        item?.fecha_evento      ||
        item?.fecha_documento   ||
        item?.created_at        ||
        ''
    );
}


export default function Card({
                                 item,
                                 type,
                                 variant = 'default',
                                 compact = false,
                                 onOpenResource = null,
                             }) {
    const title       = getTitle(item);
    const description = getDescription(item);
    const category    = getCategory(item);
    const status      = getStatus(item);
    const date        = formatDate(getDateValue(item));
    const image       = getImageUrl(item);
    const fileUrl     = getFileUrl(item);
    const extension   = getFileExtension(item);
    const size        = getFileSize(item);

    const isAutoridad = variant === 'autoridad';
    const cardType    = isAutoridad ? 'autoridad' : type || 'generico';
    const firstLetter = (title || 'P').trim().charAt(0).toUpperCase();

    const isNoticia = type === 'noticias';

    function handleImageError(e) {
        const imageElement = e.currentTarget;
        const wrapper      = imageElement.parentElement;

        imageElement.remove();

        if (wrapper) {
            wrapper.classList.add('has-default-image');
            wrapper.setAttribute('data-type',   cardType);
            wrapper.setAttribute('data-letter', firstLetter);
        }
    }

    return (
        <article
            className={`portal-card ${isAutoridad ? 'portal-card-autoridad' : ''} ${compact ? 'portal-card-compact' : ''}`}
            data-type={cardType}
        >
            {/* ── Imagen ── */}
            <div
                className={`portal-card-image-wrap ${!image ? 'has-default-image' : ''}`}
                data-type={cardType}
                data-letter={firstLetter}
            >
                {image && (
                    <img
                        src={image}
                        alt={title || 'Imagen'}
                        className="portal-card-image"
                        loading="lazy"
                        decoding="async"
                        onError={handleImageError}
                    />
                )}
            </div>

            {/* ── Cuerpo ── */}
            <div className="portal-card-body">
                <div className="portal-card-meta">
                    {category  && <span className="portal-card-badge">{category}</span>}
                    {date      && <span className="portal-card-date">{date}</span>}
                    {!date && status && <span className="portal-card-date">{status}</span>}

                    {/* En noticias no mostramos extensión de archivo */}
                    {!isNoticia && extension && (
                        <span className="portal-card-date">{extension}</span>
                    )}
                </div>

                {title && <h3>{title}</h3>}

                {item?.cargo && (
                    <p className="portal-card-cargo">{item.cargo}</p>
                )}

                {description && <p>{description}</p>}

                {!isNoticia && size && (
                    <small className="portal-file-size">{size}</small>
                )}

                {item?.correo_institucional && (
                    <a
                        href={`mailto:${item.correo_institucional}`}
                        className="portal-card-link"
                    >
                        {item.correo_institucional}
                    </a>
                )}

                {/* Noticias: siempre redirige al detalle */}
                {isNoticia && item?.slug && (
                    <Link
                        to={`/noticias/${item.slug}`}
                        className="portal-card-button"
                    >
                        Leer más
                    </Link>
                )}

                {/* Otros recursos: documentos, eventos, tutoriales, proyectos, etc. */}
                {!isNoticia && fileUrl && (
                    <ResourceButton
                        item={item}
                        type={type}
                        onOpenResource={onOpenResource}
                    />
                )}

                {!isNoticia && !fileUrl && item?.slug && type && (
                    <a href={`/${type}/${item.slug}`} className="portal-card-button">
                        Ver más
                    </a>
                )}
            </div>
        </article>
    );
}