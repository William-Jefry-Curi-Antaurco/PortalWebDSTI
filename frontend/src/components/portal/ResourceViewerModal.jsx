import { createPortal } from "react-dom";
import { getTitle, getDescription, getViewerUrl, getFileUrl, getResourceKind, getFileExtension, getFileSize, getCategory, getResourceActionText } from "../../utils/portalUtils";

export default function ResourceViewerModal({ resource, onClose }) {
    if (!resource) return null;

    const { item, type } = resource;
    const title = getTitle(item) || "Recurso";
    const description = getDescription(item);
    const url = getViewerUrl(item);
    const originalUrl = getFileUrl(item);
    const kind = getResourceKind(item);
    const extension = getFileExtension(item);
    const size = getFileSize(item);

    function handleBackdropClick(e) {
        if (e.target === e.currentTarget) onClose();
    }

    return createPortal(
        <div
            className="portal-resource-modal"
            role="dialog"
            aria-modal="true"
            aria-label={title}
            onClick={handleBackdropClick}
        >
            <div className="portal-resource-dialog">
                <div className="portal-resource-header">
                    <div>
                        <span className="portal-section-module">
                            {getResourceActionText(item, type)}
                        </span>

                        <h3>{title}</h3>

                        <div className="portal-card-meta">
                            {extension && (
                                <span className="portal-card-date">
                                    {extension}
                                </span>
                            )}

                            {size && (
                                <span className="portal-card-date">
                                    {size}
                                </span>
                            )}

                            {getCategory(item) && (
                                <span className="portal-card-badge">
                                    {getCategory(item)}
                                </span>
                            )}
                        </div>
                    </div>

                    <button
                        type="button"
                        className="portal-resource-close"
                        onClick={onClose}
                        aria-label="Cerrar visor"
                    >
                        ×
                    </button>
                </div>

                {description && (
                    <p className="portal-resource-description">
                        {description}
                    </p>
                )}

                <div className="portal-resource-body">
                    {kind === "pdf" && (
                        <iframe
                            src={url}
                            title={title}
                            className="portal-resource-frame"
                        />
                    )}

                    {kind === "video" && (
                        <video
                            src={url}
                            className="portal-resource-video"
                            controls
                            preload="metadata"
                        >
                            Tu navegador no soporta la reproducción de video.
                        </video>
                    )}

                    {kind === "external-video" && (
                        <iframe
                            src={url}
                            title={title}
                            className="portal-resource-frame portal-resource-video-frame"
                            allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                            allowFullScreen
                        />
                    )}

                    {kind === "image" && (
                        <img
                            src={url}
                            alt={title}
                            className="portal-resource-image"
                        />
                    )}

                    {kind === "html" && (
                        <iframe
                            src={url}
                            title={title}
                            className="portal-resource-frame"
                        />
                    )}

                    {(kind === "link" || kind === "download" || kind === "none") && (
                        <div className="portal-resource-fallback">
                            <p>
                                Este recurso se abrirá como enlace externo o descarga.
                            </p>

                            {originalUrl && (
                                <a
                                    href={originalUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="portal-card-button"
                                >
                                    Abrir recurso
                                </a>
                            )}
                        </div>
                    )}
                </div>

                {originalUrl && (
                    <div className="portal-resource-footer">
                        <a
                            href={originalUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="portal-card-link"
                        >
                            Abrir en nueva pestaña
                        </a>
                    </div>
                )}
            </div>
        </div>,
        document.body
    );
}