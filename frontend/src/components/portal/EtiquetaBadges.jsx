import { getEtiquetas } from "../../utils/portalUtils";

export default function EtiquetaBadges({ item, etiquetas, className = "" }) {
    const lista = etiquetas ?? getEtiquetas(item);

    if (!Array.isArray(lista) || lista.length === 0) return null;

    return (
        <div className={`portal-etiquetas ${className}`}>
            {lista.map((etiqueta) => (
                <span
                    key={etiqueta.idetiqueta}
                    className="portal-etiqueta-badge"
                    style={{ "--etiqueta-color": etiqueta.color || "#2563eb" }}
                >
                    {etiqueta.nombre}
                </span>
            ))}
        </div>
    );
}
