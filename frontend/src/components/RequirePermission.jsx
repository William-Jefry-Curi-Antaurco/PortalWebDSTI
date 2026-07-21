import { Navigate } from 'react-router-dom';
import { getUser } from '../services/authService';

export default function RequirePermission({ permiso, children }) {
    if (!permiso) return children;

    const user = getUser();
    const permisos = Array.isArray(user?.permisos) ? user.permisos : [];

    if (!permisos.includes(permiso)) {
        return <Navigate to="/admin/dashboard" replace />;
    }

    return children;
}
