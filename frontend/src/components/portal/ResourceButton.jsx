import { getFileUrl, getResourceActionText } from "../../utils/portalUtils";

export function ResourceButton({
                                   item,
                                   type,
                                   className = "portal-card-button",
                                   onOpenResource,
                               }) {
    const fileUrl = getFileUrl(item);

    if (!fileUrl) return null;

    function handleClick(e) {
        e.preventDefault();
        e.stopPropagation();

        if (onOpenResource) {
            onOpenResource(item, type);
            return;
        }

        window.open(fileUrl, "_blank", "noopener,noreferrer");
    }

    return (
        <button
            type="button"
            className={className}
            onClick={handleClick}
        >
            {getResourceActionText(item, type)}
        </button>
    );
}