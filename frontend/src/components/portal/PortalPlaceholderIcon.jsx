import {
    Newspaper,
    FileText,
    Calendar,
    GraduationCap,
    Rocket,
    Building2,
    User,
    Mail,
    Phone,
    MapPin,
    HelpCircle,
    Video,
    BookOpen,
    Link2,
} from "lucide-react";

const ICONOS_POR_TIPO = {
    noticias: Newspaper,
    documentos: FileText,
    eventos: Calendar,
    tutoriales: GraduationCap,
    "tutoriales-video": Video,
    "tutoriales-pdf": FileText,
    "tutoriales-guia": BookOpen,
    "tutoriales-enlace": Link2,
    proyectos: Rocket,
    institucional: Building2,
    autoridades: User,
    correo: Mail,
    telefono: Phone,
    direccion: MapPin,
    ayuda: HelpCircle,
};

export default function PortalPlaceholderIcon({
                                                   type,
                                                   size = 22,
                                                   className = "",
                                                   imagenUrl = null,
                                                   alt = "",
                                               }) {
    if (imagenUrl) {
        return (
            <img
                src={imagenUrl}
                alt={alt}
                className={`portal-placeholder-image ${className}`}
            />
        );
    }

    const Icono = ICONOS_POR_TIPO[type] || Newspaper;

    return (
        <Icono
            size={size}
            className={`portal-placeholder-icon ${className}`}
            strokeWidth={1.8}
            aria-hidden="true"
        />
    );
}
