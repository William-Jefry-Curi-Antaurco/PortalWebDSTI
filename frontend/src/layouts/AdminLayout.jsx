import {
    LayoutDashboard,
    Settings,
    Newspaper,
    Wrench,
    Link2,
    FileText,
    Calendar,
    GraduationCap,
    HelpCircle,
    Headphones,
    Building2,
    UsersRound,
    Rocket,
    Boxes,
    Tags,
    CheckCircle2,
    Shapes,
    FileType,
    BookOpen,
    Activity,
    MapPinned,
    Video,
    LifeBuoy,
    SignalHigh,
    Badge,
    UserCog,
    ShieldCheck,
    KeyRound,
    ScrollText,
    LogOut,
} from 'lucide-react';

import { useEffect } from 'react';
import { Outlet, useNavigate, NavLink } from 'react-router-dom';
import { logoutRequest, refreshRequest } from '../api/authApi';
import { clearAuth, getUser, actualizarToken } from '../services/authService';

// El token del backend expira a los 120 min (SANCTUM_TOKEN_EXPIRATION). Se
// renueva en segundo plano a los 90 (75%) mientras el panel siga abierto,
// para no interrumpir a un usuario activo; si la pestaña se cierra o queda
// inactiva, el token simplemente expira dentro de esa ventana.
const INTERVALO_REFRESCO_MS = 90 * 60 * 1000;

const iconSize = 18;

const menuGroups = [
    {
        title: 'Panel',
        items: [
            {
                label: 'Dashboard',
                path: '/admin/dashboard',
                icon: <LayoutDashboard size={iconSize} />,
                permiso: null,
            },
        ],
    },
    {
        title: 'Configuración',
        items: [
            {
                label: 'Configuración general',
                path: '/admin/configuracion',
                icon: <Settings size={iconSize} />,
                permiso: 'catalogos.ver',
            },
        ],
    },


    {
        title: 'Contenido del portal',
        items: [
            {
                label: 'Noticias y comunicados',
                path: '/admin/noticias',
                icon: <Newspaper size={iconSize} />,
                permiso: 'noticias.ver',
            },
            {
                label: 'Servicios tecnológicos',
                path: '/admin/servicios',
                icon: <Wrench size={iconSize} />,
                permiso: 'servicios.ver',
            },
            {
                label: 'Sistemas institucionales',
                path: '/admin/sistemas',
                icon: <Link2 size={iconSize} />,
                permiso: 'sistemas.ver',
            },
            {
                label: 'Documentos y manuales',
                path: '/admin/documentos',
                icon: <FileText size={iconSize} />,
                permiso: 'documentos.ver',
            },
            {
                label: 'Eventos y capacitaciones',
                path: '/admin/eventos',
                icon: <Calendar size={iconSize} />,
                permiso: 'eventos.ver',
            },
            {
                label: 'Tutoriales',
                path: '/admin/tutoriales',
                icon: <GraduationCap size={iconSize} />,
                permiso: 'tutoriales.ver',
            },
            {
                label: 'Preguntas frecuentes',
                path: '/admin/faqs',
                icon: <HelpCircle size={iconSize} />,
                permiso: 'tutoriales.ver',
            },
            {
                label: 'Solicitudes de soporte',
                path: '/admin/soporte',
                icon: <Headphones size={iconSize} />,
                permiso: 'soporte.ver',
            },
        ],
    },
    {
        title: 'Información institucional',
        items: [
            {
                label: 'Información institucional',
                path: '/admin/institucional',
                icon: <Building2 size={iconSize} />,
                permiso: 'institucional.ver',
            },
            {
                label: 'Autoridades',
                path: '/admin/autoridades',
                icon: <UsersRound size={iconSize} />,
                permiso: 'institucional.ver',
            },
            {
                label: 'Proyectos tecnológicos',
                path: '/admin/proyectos',
                icon: <Rocket size={iconSize} />,
                permiso: 'proyectos.ver',
            },
        ],
    },
    {
        title: 'Clasificación y configuración',
        items: [
            {
                label: 'Módulos',
                path: '/admin/modulos',
                icon: <Boxes size={iconSize} />,
                permiso: 'catalogos.ver',
            },
            {
                label: 'Categorías',
                path: '/admin/categorias',
                icon: <Tags size={iconSize} />,
                permiso: 'catalogos.ver',
            },
            {
                label: 'Estados',
                path: '/admin/estados',
                icon: <CheckCircle2 size={iconSize} />,
                permiso: 'catalogos.ver',
            },
            {
                label: 'Tipos de entidad',
                path: '/admin/tipos-entidad',
                icon: <Shapes size={iconSize} />,
                permiso: 'catalogos.ver',
            },
            {
                label: 'Tipos de publicación',
                path: '/admin/tipos-publicacion',
                icon: <FileType size={iconSize} />,
                permiso: 'catalogos.ver',
            },
            {
                label: 'Tipos de documento',
                path: '/admin/tipos-documento',
                icon: <BookOpen size={iconSize} />,
                permiso: 'catalogos.ver',
            },

            {
                label: 'Estados operativos',
                path: '/admin/estados-operativos',
                icon: <Activity size={iconSize} />,
                permiso: 'catalogos.ver',
            },
            {
                label: 'Tipos de evento',
                path: '/admin/tipos-evento',
                icon: <Calendar size={iconSize} />,
                permiso: 'catalogos.ver',
            },
            {
                label: 'Modalidades de evento',
                path: '/admin/modalidades-evento',
                icon: <MapPinned size={iconSize} />,
                permiso: 'catalogos.ver',
            },
            {
                label: 'Tipos de tutorial',
                path: '/admin/tipos-tutorial',
                icon: <Video size={iconSize} />,
                permiso: 'catalogos.ver',
            },
            {
                label: 'Tipos de soporte',
                path: '/admin/tipos-soporte',
                icon: <LifeBuoy size={iconSize} />,
                permiso: 'catalogos.ver',
            },
            {
                label: 'Prioridades',
                path: '/admin/prioridades',
                icon: <SignalHigh size={iconSize} />,
                permiso: 'catalogos.ver',
            },
            {
                label: 'Etiquetas',
                path: '/admin/etiquetas',
                icon: <Badge size={iconSize} />,
                permiso: 'catalogos.ver',
            },
        ],
    },
    {
        title: 'Seguridad y administración',
        items: [
            {
                label: 'Usuarios',
                path: '/admin/usuarios',
                icon: <UserCog size={iconSize} />,
                permiso: 'seguridad.ver',
            },
            {
                label: 'Roles',
                path: '/admin/roles',
                icon: <ShieldCheck size={iconSize} />,
                permiso: 'seguridad.ver',
            },
            {
                label: 'Permisos',
                path: '/admin/permisos',
                icon: <KeyRound size={iconSize} />,
                permiso: 'seguridad.ver',
            },
            {
                label: 'Auditoría',
                path: '/admin/logs',
                icon: <ScrollText size={iconSize} />,
                permiso: 'seguridad.ver',
            },
        ],
    },
];

export default function AdminLayout() {
    const navigate = useNavigate();
    const user = getUser();

    const permisosUsuario = Array.isArray(user?.permisos) ? user.permisos : [];

    useEffect(() => {
        const intervalo = setInterval(async () => {
            try {
                const respuesta = await refreshRequest();
                actualizarToken(respuesta.data.token);
            } catch {
                // Si falla (token ya vencido/revocado), el interceptor de
                // axios se encarga de cerrar la sesión y redirigir.
            }
        }, INTERVALO_REFRESCO_MS);

        return () => clearInterval(intervalo);
    }, []);

    const visibleMenuGroups = menuGroups
        .map((group) => ({
            ...group,
            items: group.items.filter(
                (item) => !item.permiso || permisosUsuario.includes(item.permiso)
            ),
        }))
        .filter((group) => group.items.length > 0);

    const handleLogout = async () => {
        try {
            await logoutRequest();
        } catch {
            // Aunque falle el backend, se limpia la sesión local.
        } finally {
            clearAuth();
            navigate('/login', { replace: true });
        }
    };

    return (
        <div className="admin-layout">
            <aside className="sidebar">
                <div className="sidebar-brand">
                    <div className="brand-logo">D</div>

                    <div>
                        <h2>DSTI</h2>
                        <span>Portal Web Admin</span>
                    </div>
                </div>

                <nav className="sidebar-nav">
                    {visibleMenuGroups.map((group) => (
                        <section className="menu-group" key={group.title}>
                            <p className="menu-title">{group.title}</p>

                            {group.items.map((item) => (
                                <NavLink
                                    key={item.path}
                                    to={item.path}
                                    className={({ isActive }) =>
                                        isActive ? 'nav-item active' : 'nav-item'
                                    }
                                >
                                    <span className="nav-icon" aria-hidden="true">
                                        {item.icon}
                                    </span>

                                    <span className="nav-label">{item.label}</span>
                                </NavLink>
                            ))}
                        </section>
                    ))}
                </nav>
            </aside>

            <div className="admin-main">
                <header className="admin-header">
                    <div className="header-title">
                        <h1>Panel administrativo</h1>
                        <p>Gestión integral del Portal Web DSTI - UNASAM</p>
                    </div>

                    <div className="header-user">
                        <div className="user-info">
                            <strong>{user?.nombre_completo || 'Administrador DSTI'}</strong>
                            <small>{user?.email || 'Sesión administrativa'}</small>

                            {user?.rol && (
                                <span className="user-role">
                                    {user.rol}
                                </span>
                            )}
                        </div>

                        <button
                            type="button"
                            className="logout-button"
                            onClick={handleLogout}
                        >
                            <LogOut size={16} />
                            <span>Cerrar sesión</span>
                        </button>
                    </div>
                </header>

                <main className="admin-content">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}