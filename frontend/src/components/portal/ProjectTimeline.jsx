// src/components/portal/ProjectTimeline.jsx
import { getCategory, getTitle, getDescription, getStatus, getFileExtension, getFileUrl } from "../../utils/portalUtils";
import { ResourceButton } from "./ResourceButton";

function getAvance(item) {
    const valor = Number(item?.porcentaje_avance);
    if (!Number.isFinite(valor)) return null;
    return Math.min(100, Math.max(0, Math.round(valor)));
}

function getResponsable(item) {
    return item?.responsable || item?.responsable_nombre || "";
}

function getUrlResultado(item) {
    const url = item?.url_resultado || item?.urlResultado || "";
    return typeof url === "string" && url.trim() ? url.trim() : null;
}

export default function ProjectTimeline({ items, emptyAction, onOpenResource = null }) {
    if (!items || items.length === 0) {
        return (
            <div className="portal-empty-state">
                <p>No hay proyectos tecnológicos registrados para este filtro.</p>
                {emptyAction && (
                    <button type="button" onClick={emptyAction}>
                        Ver todos los proyectos
                    </button>
                )}
            </div>
        );
    }

    return (
        <div className="portal-project-timeline">
            {items.map((item, index) => {
                const avance = getAvance(item);
                const responsable = getResponsable(item);
                const urlResultado = getUrlResultado(item);

                return (
                    <article
                        className="portal-project-item"
                        key={item.idproyecto || item.id || index}
                    >
                        <span className="portal-project-marker" aria-hidden="true" />

                        <div className="portal-project-content">
                            <div className="portal-card-meta">
                                {getCategory(item) && (
                                    <span className="portal-card-badge">{getCategory(item)}</span>
                                )}
                                {getStatus(item) && (
                                    <span className="portal-card-date">{getStatus(item)}</span>
                                )}
                                {getFileExtension(item) && (
                                    <span className="portal-card-date">{getFileExtension(item)}</span>
                                )}
                            </div>

                            <h3>{getTitle(item)}</h3>

                            {getDescription(item) && <p>{getDescription(item)}</p>}

                            {responsable && (
                                <p className="portal-project-responsable">
                                    <span>Responsable</span> {responsable}
                                </p>
                            )}

                            {avance !== null && (
                                <div
                                    className="portal-project-progress"
                                    role="progressbar"
                                    aria-valuenow={avance}
                                    aria-valuemin={0}
                                    aria-valuemax={100}
                                >
                                    <div className="portal-project-progress-head">
                                        <span>Avance del proyecto</span>
                                        <strong>{avance}%</strong>
                                    </div>
                                    <div className="portal-project-progress-track">
                                        <div
                                            className="portal-project-progress-fill"
                                            data-nivel={
                                                avance >= 100
                                                    ? "completo"
                                                    : avance >= 60
                                                        ? "alto"
                                                        : avance >= 30
                                                            ? "medio"
                                                            : "bajo"
                                            }
                                            style={{ width: `${avance}%` }}
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="portal-project-actions">
                                {getFileUrl(item) && (
                                    <ResourceButton
                                        item={item}
                                        type="proyectos"
                                        onOpenResource={onOpenResource}
                                    />
                                )}

                                {urlResultado && (
                                    <a
                                        href={urlResultado}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="portal-project-result-link"
                                    >
                                        Ver resultado
                                    </a>
                                )}
                            </div>
                        </div>
                    </article>
                );
            })}
        </div>
    );
}
