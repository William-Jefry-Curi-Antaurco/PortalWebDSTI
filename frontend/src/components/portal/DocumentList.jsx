// src/components/portal/DocumentList.jsx
import { getCategory, getTitle, getDescription, getFileExtension, getFileSize, getFileUrl, formatDate } from "../../utils/portalUtils";
import { ResourceButton } from "./ResourceButton";
import PortalPlaceholderIcon from "./PortalPlaceholderIcon";

export default function DocumentList({ items, emptyAction, onOpenResource = null, imgDefaultCard = null }) {
    if (!items || items.length === 0) {
        return (
            <div className="portal-empty-state">
                <p>No hay documentos o manuales registrados para este filtro.</p>
                {emptyAction && (
                    <button type="button" onClick={emptyAction}>
                        Ver todos los documentos
                    </button>
                )}
            </div>
        );
    }

    return (
        <div className="portal-document-list">
            {items.map((item, index) => (
                <article
                    className="portal-document-row"
                    key={item.iddocumento || item.id || index}
                >
                    <span className="portal-document-icon">
                        <PortalPlaceholderIcon type="documentos" size={22} imagenUrl={imgDefaultCard} />
                    </span>

                    <div className="portal-document-main">
                        <div className="portal-card-meta">
                            {getCategory(item) && (
                                <span className="portal-card-badge">
                                    {getCategory(item)}
                                </span>
                            )}

                            {item?.version && (
                                <span className="portal-card-date">
                                    v{item.version}
                                </span>
                            )}

                            {getFileExtension(item) && (
                                <span className="portal-card-date">
                                    {getFileExtension(item)}
                                </span>
                            )}

                            {getFileSize(item) && (
                                <span className="portal-card-date">
                                    {getFileSize(item)}
                                </span>
                            )}

                            {formatDate(getDateValue(item)) && (
                                <span className="portal-card-date">
                                    {formatDate(getDateValue(item))}
                                </span>
                            )}
                        </div>

                        <h3>{getTitle(item)}</h3>

                        {getDescription(item) && (
                            <p>{getDescription(item)}</p>
                        )}
                    </div>

                    {getFileUrl(item) && (
                        <ResourceButton
                            item={item}
                            type="documentos"
                            className="portal-document-action"
                            onOpenResource={onOpenResource}
                        />
                    )}
                </article>
            ))}
        </div>
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