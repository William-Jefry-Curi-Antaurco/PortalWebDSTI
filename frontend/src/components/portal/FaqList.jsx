import { useId, useMemo, useState } from "react";
import { HelpCircle } from "lucide-react";
import {
    getCategory,
    getTitle,
    getDescription,
} from "../../utils/portalUtils";

function normalizeText(value) {
    return String(value || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/\p{Diacritic}/gu, "")
        .trim();
}

function getQuestion(item) {
    return item?.pregunta || getTitle(item) || "Pregunta frecuente";
}

function getAnswer(item) {
    return (
        item?.respuesta ||
        item?.contenido ||
        getDescription(item) ||
        "La respuesta no se encuentra disponible actualmente."
    );
}

function getFaqCategory(item) {
    return getCategory(item) || "General";
}

function getFaqId(item, index) {
    return item?.idfaq || item?.id || index;
}

export default function FaqList({
                                    items = [],
                                    emptyAction = null,
                                    onGoToSupport = null,
                                }) {
    const componentId = useId();
    const [search, setSearch] = useState("");
    const [activeCategory, setActiveCategory] = useState("todos");
    const [openItems, setOpenItems] = useState(() => new Set());

    const categories = useMemo(() => {
        const unique = new Map();

        items.forEach((item) => {
            const category = getFaqCategory(item);
            const key = normalizeText(category);

            if (key && !unique.has(key)) {
                unique.set(key, category);
            }
        });

        return Array.from(unique.entries()).map(([key, label]) => ({
            key,
            label,
        }));
    }, [items]);

    const filteredItems = useMemo(() => {
        const term = normalizeText(search);

        return items.filter((item) => {
            const category = normalizeText(getFaqCategory(item));

            const matchesCategory =
                activeCategory === "todos" ||
                category === activeCategory;

            if (!matchesCategory) return false;

            if (!term) return true;

            const searchable = normalizeText(
                `${getQuestion(item)} ${getAnswer(item)} ${getFaqCategory(item)}`
            );

            return searchable.includes(term);
        });
    }, [items, search, activeCategory]);

    function toggleFaq(id) {
        setOpenItems((current) => {
            const next = new Set();

            /*
             * Se abre una sola pregunta a la vez.
             * Si se pulsa la que ya está abierta, se cierra.
             */
            if (!current.has(id)) {
                next.add(id);
            }

            return next;
        });
    }

    function expandAll() {
        setOpenItems(
            new Set(
                filteredItems.map((item, index) =>
                    getFaqId(item, index)
                )
            )
        );
    }

    function closeAll() {
        setOpenItems(new Set());
    }

    function clearFilters() {
        setSearch("");
        setActiveCategory("todos");
        setOpenItems(new Set());
    }

    if (!items.length) {
        return (
            <div className="portal-empty-state">
                <p>No hay preguntas frecuentes disponibles.</p>

                {emptyAction && (
                    <button type="button" onClick={emptyAction}>
                        Ver todas las preguntas
                    </button>
                )}
            </div>
        );
    }

    return (
        <div className="portal-faq-experience">
            <div className="portal-faq-toolbar">
                <div className="portal-search portal-faq-search">
                    <input
                        type="search"
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Escribe tu duda: correo, contraseña, SGA..."
                        aria-label="Buscar en preguntas frecuentes"
                    />
                </div>

                <div className="portal-faq-toolbar-actions">
                    <button type="button" onClick={expandAll}>
                        Expandir todas
                    </button>

                    <button type="button" onClick={closeAll}>
                        Cerrar todas
                    </button>
                </div>
            </div>

            <div
                className="portal-faq-categories"
                aria-label="Categorías de preguntas frecuentes"
            >
                <button
                    type="button"
                    className={
                        activeCategory === "todos"
                            ? "is-active"
                            : ""
                    }
                    onClick={() => setActiveCategory("todos")}
                >
                    Todas
                    <span>-</span>
                </button>

                {categories.map((category) => {
                    const count = items.filter(
                        (item) =>
                            normalizeText(getFaqCategory(item)) ===
                            category.key
                    ).length;

                    return (
                        <button
                            type="button"
                            key={category.key}
                            className={
                                activeCategory === category.key
                                    ? "is-active"
                                    : " "
                            }
                            onClick={() =>
                                setActiveCategory(category.key)
                            }
                        >
                            {category.label}

                        </button>
                    );
                })}
            </div>

            <div className="portal-faq-results-head">
                <p aria-live="polite">
                    {filteredItems.length === 1
                        ? "1 respuesta encontrada"
                        : `${filteredItems.length} respuestas encontradas`}
                </p>

                {(search || activeCategory !== "todos") && (
                    <button
                        type="button"
                        className="portal-faq-clear"
                        onClick={clearFilters}
                    >
                        Limpiar filtros
                    </button>
                )}
            </div>

            {filteredItems.length === 0 ? (
                <div className="portal-empty-state">
                    <p>
                        No encontramos una respuesta relacionada con
                        “{search}”.
                    </p>

                    <button
                        type="button"
                        onClick={clearFilters}
                    >
                        Ver todas las preguntas
                    </button>
                </div>
            ) : (
                <div className="portal-faq-list">


                    {filteredItems.map((item, index) => {
                        const faqId = getFaqId(item, index);
                        const isOpen = openItems.has(faqId);

                        const buttonId =
                            `${componentId}-faq-button-${faqId}`;

                        const panelId =
                            `${componentId}-faq-panel-${faqId}`;

                        return (
                            <article
                                className={`portal-faq ${
                                    isOpen ? "is-open" : ""
                                }`}
                                key={faqId}
                            >
                                <h3 className="portal-faq-question">
                                    <button
                                        id={buttonId}
                                        type="button"
                                        aria-expanded={isOpen}
                                        aria-controls={panelId}
                                        onClick={() => toggleFaq(faqId)}
                                    >
                                        <span className="portal-faq-question-content">
                                            <span className="portal-faq-number">
                                                {String(index + 1).padStart(
                                                    2,
                                                    "0"
                                                )}
                                            </span>

                                            <span>


                                                <strong>
                                                    {getQuestion(item)}
                                                </strong>
                                            </span>
                                        </span>

                                        <span
                                            className="portal-faq-toggle"
                                            aria-hidden="true"
                                        />
                                    </button>
                                </h3>

                                <div
                                    id={panelId}
                                    role="region"
                                    aria-labelledby={buttonId}
                                    className="portal-faq-answer"
                                    hidden={!isOpen}
                                >
                                    <div className="portal-faq-answer-content">
                                        <p>{getAnswer(item)}</p>

                                        <div className="portal-faq-helpful">
                                            <span>
                                                ¿Esta respuesta solucionó tu
                                                duda?
                                            </span>

                                            <a href="#soporte">
                                                Necesito más ayuda
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            </article>
                        );
                    })}
                </div>
            )}

            <aside className="portal-faq-support-card">
                <div className="portal-faq-support-icon">
                    <HelpCircle size={24} aria-hidden="true" />
                </div>

                <div>
                    <span>Atención personalizada</span>
                    <h3>¿No encontraste la respuesta que buscabas?</h3>
                    <p>
                        Registra una solicitud en la Mesa de Ayuda y describe
                        el inconveniente para que el equipo de la DSTI pueda
                        orientarte.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={() => {
                        if (onGoToSupport) {
                            onGoToSupport();
                            return;
                        }

                        document
                            .getElementById("soporte")
                            ?.scrollIntoView({
                                behavior: "smooth",
                                block: "start",
                            });
                    }}
                >
                    Ir a la Mesa de Ayuda
                </button>
            </aside>
        </div>
    );
}