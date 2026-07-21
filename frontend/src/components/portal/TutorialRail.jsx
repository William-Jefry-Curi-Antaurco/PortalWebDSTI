import { useMemo, useState } from "react";
import {
    getCategory,
    getTitle,
    getDescription,
    getStatus,
    getFileExtension,
    getFileUrl,
} from "../../utils/portalUtils";
import { ResourceButton } from "./ResourceButton";

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
                                     }) {
    const [search, setSearch] = useState("");

    const filteredItems = useMemo(() => {
        const term = normalizeText(search);

        if (!term) return items || [];

        return (items || []).filter((item) => {
            const searchable = normalizeText(
                [
                    getTitle(item),
                    getDescription(item),
                    getCategory(item),
                    getFileExtension(item),
                ].join(" ")
            );

            return searchable.includes(term);
        });
    }, [items, search]);

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
            <div className="portal-tutorial-toolbar">
                <div className="portal-search portal-search-inline">
                    <input
                        type="search"
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Buscar tutorial, guía o video..."
                        aria-label="Buscar tutoriales y recursos"
                    />
                </div>

                <span
                    className="portal-tutorial-counter"
                    aria-live="polite"
                >
                    {filteredItems.length === 1
                        ? "1 recurso encontrado"
                        : `${filteredItems.length} recursos encontrados`}
                </span>
            </div>

            {filteredItems.length === 0 ? (
                <div className="portal-empty-state">
                    <p>
                        No se encontraron recursos relacionados con
                        “{search}”.
                    </p>

                    <button
                        type="button"
                        onClick={() => setSearch("")}
                    >
                        Limpiar búsqueda
                    </button>
                </div>
            ) : (
                <div className="portal-tutorial-rail">
                    {filteredItems.map((item, index) => (
                        <TutorialCard
                            key={item.idtutorial || item.id || index}
                            item={item}
                            onOpenResource={onOpenResource}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

function TutorialCard({ item, onOpenResource }) {
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
            <div className="portal-tutorial-icon" aria-hidden="true" />

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