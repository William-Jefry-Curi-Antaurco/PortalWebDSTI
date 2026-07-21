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

import { Outlet, useNavigate, NavLink } from 'react-router-dom';
import { logoutRequest } from '../api/authApi';
import { clearAuth, getUser } from '../services/authService';

const iconSize = 18;

const menuGroups = [
    {
        title: 'Panel',
        items: [
            {
                label: 'Dashboard',
                path: '/admin/dashboard',
                icon: <LayoutDashboard size={iconSize} />,
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
            },
            {
                label: 'Servicios tecnológicos',
                path: '/admin/servicios',
                icon: <Wrench size={iconSize} />,
            },
            {
                label: 'Sistemas institucionales',
                path: '/admin/sistemas',
                icon: <Link2 size={iconSize} />,
            },
            {
                label: 'Documentos y manuales',
                path: '/admin/documentos',
                icon: <FileText size={iconSize} />,
            },
            {
                label: 'Eventos y capacitaciones',
                path: '/admin/eventos',
                icon: <Calendar size={iconSize} />,
            },
            {
                label: 'Tutoriales',
                path: '/admin/tutoriales',
                icon: <GraduationCap size={iconSize} />,
            },
            {
                label: 'Preguntas frecuentes',
                path: '/admin/faqs',
                icon: <HelpCircle size={iconSize} />,
            },
            {
                label: 'Solicitudes de soporte',
                path: '/admin/soporte',
                icon: <Headphones size={iconSize} />,
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
            },
            {
                label: 'Autoridades',
                path: '/admin/autoridades',
                icon: <UsersRound size={iconSize} />,
            },
            {
                label: 'Proyectos tecnológicos',
                path: '/admin/proyectos',
                icon: <Rocket size={iconSize} />,
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
            },
            {
                label: 'Categorías',
                path: '/admin/categorias',
                icon: <Tags size={iconSize} />,
            },
            {
                label: 'Estados',
                path: '/admin/estados',
                icon: <CheckCircle2 size={iconSize} />,
            },
            {
                label: 'Tipos de entidad',
                path: '/admin/tipos-entidad',
                icon: <Shapes size={iconSize} />,
            },
            {
                label: 'Tipos de publicación',
                path: '/admin/tipos-publicacion',
                icon: <FileType size={iconSize} />,
            },
            {
                label: 'Tipos de documento',
                path: '/admin/tipos-documento',
                icon: <BookOpen size={iconSize} />,
            },

            {
                label: 'Estados operativos',
                path: '/admin/estados-operativos',
                icon: <Activity size={iconSize} />,
            },
            {
                label: 'Tipos de evento',
                path: '/admin/tipos-evento',
                icon: <Calendar size={iconSize} />,
            },
            {
                label: 'Modalidades de evento',
                path: '/admin/modalidades-evento',
                icon: <MapPinned size={iconSize} />,
            },
            {
                label: 'Tipos de tutorial',
                path: '/admin/tipos-tutorial',
                icon: <Video size={iconSize} />,
            },
            {
                label: 'Tipos de soporte',
                path: '/admin/tipos-soporte',
                icon: <LifeBuoy size={iconSize} />,
            },
            {
                label: 'Prioridades',
                path: '/admin/prioridades',
                icon: <SignalHigh size={iconSize} />,
            },
            {
                label: 'Etiquetas',
                path: '/admin/etiquetas',
                icon: <Badge size={iconSize} />,
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
            },
            {
                label: 'Roles',
                path: '/admin/roles',
                icon: <ShieldCheck size={iconSize} />,
            },
            {
                label: 'Permisos',
                path: '/admin/permisos',
                icon: <KeyRound size={iconSize} />,
            },
            {
                label: 'Auditoría',
                path: '/admin/logs',
                icon: <ScrollText size={iconSize} />,
            },
        ],
    },
];

export default function AdminLayout() {
    const navigate = useNavigate();
    const user = getUser();

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
                    {menuGroups.map((group) => (
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