import { tienePermiso } from '../services/authService';

/**
 * Renderiza sus hijos solo si el usuario autenticado tiene el permiso
 * indicado. A diferencia de RequirePermission (que bloquea rutas enteras),
 * este componente es para ocultar controles puntuales (botones de crear,
 * editar, eliminar) dentro de una página a la que el usuario sí tiene
 * acceso de solo lectura.
 */
export default function ConPermiso({ permiso, children }) {
    if (!tienePermiso(permiso)) return null;

    return children;
}
