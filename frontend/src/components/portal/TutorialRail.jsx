import {
    getCategory,
    getTitle,
    getDescription,
    getStatus,
    getFileExtension,
    getFileUrl,
} from "../../utils/portalUtils";
import { ResourceButton } from "./ResourceButton";
import PortalPlaceholderIcon from "./PortalPlaceholderIcon";

function normalizeText(value) {
    return String(value || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/\p{Diacritic}/gu, "")
        .trim();
}

function getResourceType(item) {
    const extension = normalizeText(getFileExtension(item));
    const category = normalizeText(getCategory(item));
    const url = normalizeText(getFileUrl(item));

    if (
        ["mp4", "webm", "mov"].includes(extension) ||
        category.includes("video") ||
        url.includes("youtube.com") ||
        url.includes("youtu.be") ||
        url.includes("vimeo.com")
    ) {
        return {
            key: "video",
            label: "Video",
            action: "Ver video",
        };
    }

    if (extension === "pdf") {
        return {
            key: "pdf",
            label: "Documento PDF",
            action: "Leer PDF",
        };
    }

    if (
        category.includes("guia") ||
        category.includes("manual")
    ) {
        return {
            key: "guia",
            label: "Guía de uso",
            action: "Ver guía",
        };
    }

    return {
        key: "enlace",
        label: "Recurso web",
        action: "Abrir recurso",
    };
}

export default function TutorialRail({
                                         items,
                                         emptyAction,
                                         onOpenResource = null,
                                         imgDefaultCard = null,
                                     }) {
    if (!items || items.length === 0) {
        return (
            <div className="portal-empty-state">
                <p>No hay tutoriales o recursos disponibles.</p>

                {emptyAction && (
                    <button type="button" onClick={emptyAction}>
                        Ver todos los tutoriales
                    </button>
                )}
            </div>
        );
    }

    return (
        <div className="portal-tutorial-wrapper">
            <div className="portal-tutorial-rail">
                {items.map((item, index) => (
                    <TutorialCard
                        key={item.idtutorial || item.id || index}
                        item={item}
                        onOpenResource={onOpenResource}
                        imgDefaultCard={imgDefaultCard}
                    />
                ))}
            </div>
        </div>
    );
}

function TutorialCard({ item, onOpenResource, imgDefaultCard }) {
    const title = getTitle(item) || "Tutorial";
    const description = getDescription(item);
    const category = getCategory(item);
    const status = getStatus(item);
    const extension = getFileExtension(item);
    const fileUrl = getFileUrl(item);
    const resourceType = getResourceType(item);

    return (
        <article
            className="portal-tutorial-card"
            data-resource-type={resourceType.key}
        >
            <div className="portal-tutorial-icon">
                <PortalPlaceholderIcon
                    type={`tutoriales-${resourceType.key}`}
                    size={22}
                    imagenUrl={imgDefaultCard}
                />
            </div>

            <div className="portal-tutorial-content">
                <div className="portal-card-meta">
                    <span className="portal-card-badge">
                        {resourceType.label}
                    </span>

                    {extension && (
                        <span className="portal-card-date">
                            {extension}
                        </span>
                    )}

                    {status && (
                        <span className="portal-card-date">
                            {status}
                        </span>
                    )}
                </div>

                <h3>{title}</h3>

                {description && <p>{description}</p>}

                {category && (
                    <small className="portal-tutorial-category">
                        {category}
                    </small>
                )}

                <div className="portal-tutorial-actions">
                    {fileUrl ? (
                        <ResourceButton
                            item={item}
                            type="tutoriales"
                            onOpenResource={onOpenResource}
                        />
                    ) : (
                        <span className="portal-tutorial-unavailable">
                            Recurso no disponible actualmente
                        </span>
                    )}
                </div>
            </div>
        </article>
    );
}