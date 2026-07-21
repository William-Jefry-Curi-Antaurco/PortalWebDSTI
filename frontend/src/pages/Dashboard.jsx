import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { obtenerDashboard } from '../api/dashboardApi';
import { getUser } from '../services/authService';
import '../styles/modules/dashboard.css';

const EMPTY_STATS = {
    noticias: 0,
    servicios: 0,
    documentos: 0,
    soporte: 0,
    usuarios: 0,
    eventos: 0,
};

const STAT_CARDS = [
    {
        key: 'noticias',
        label: 'Noticias',
        description: 'Noticias y comunicados registrados.',
        route: '/admin/noticias',
        icon: 'N',
    },
    {
        key: 'servicios',
        label: 'Servicios',
        description: 'Servicios tecnológicos publicados.',
        route: '/admin/servicios',
        icon: 'S',
    },
    {
        key: 'documentos',
        label: 'Documentos',
        description: 'Manuales, directivas y archivos disponibles.',
        route: '/admin/documentos',
        icon: 'D',
    },
    {
        key: 'soporte',
        label: 'Soporte',
        description: 'Solicitudes recibidas desde el portal.',
        route: '/admin/soporte',
        icon: 'T',
    },
    {
        key: 'usuarios',
        label: 'Usuarios',
        description: 'Usuarios administrativos registrados.',
        route: '/admin/usuarios',
        icon: 'U',
    },
    {
        key: 'eventos',
        label: 'Eventos',
        description: 'Eventos y capacitaciones registrados.',
        route: '/admin/eventos',
        icon: 'E',
    },
];

const QUICK_ACTIONS = [
    {
        title: 'Registrar noticia',
        description: 'Publica un comunicado o aviso institucional.',
        route: '/admin/noticias',
        icon: '+',
    },
    {
        title: 'Gestionar servicios',
        description: 'Administra los servicios tecnológicos de la DSTI.',
        route: '/admin/servicios',
        icon: 'S',
    },
    {
        title: 'Revisar soporte',
        description: 'Consulta y atiende solicitudes de los usuarios.',
        route: '/admin/soporte',
        icon: 'T',
    },
    {
        title: 'Ver portal público',
        description: 'Abre la página pública del Portal Web DSTI.',
        route: '/',
        icon: '↗',
        external: true,
    },
];

function formatDate(value) {
    if (!value) return 'Sin fecha';

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return 'Sin fecha';
    }

    return new Intl.DateTimeFormat('es-PE', {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(date);
}

function getActionLabel(action) {
    const actions = {
        crear: 'Creó',
        registrar: 'Registró',
        actualizar: 'Actualizó',
        eliminar: 'Eliminó',
        subir_archivo: 'Subió un archivo',
        eliminar_archivo: 'Eliminó un archivo',
        iniciar_sesion: 'Inició sesión',
        cerrar_sesion: 'Cerró sesión',
    };

    return actions[action] || action || 'Realizó una acción';
}

function getInitials(name) {
    const parts = String(name || 'Administrador')
        .trim()
        .split(/\s+/)
        .filter(Boolean);

    return parts
        .slice(0, 2)
        .map((part) => part.charAt(0).toUpperCase())
        .join('');
}

export default function Dashboard() {
    const user = getUser();

    const [dashboard, setDashboard] = useState({
        estadisticas: EMPTY_STATS,
        actividad_reciente: [],
    });

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState('');

    const loadDashboard = useCallback(async ({ refresh = false } = {}) => {
        try {
            setError('');

            if (refresh) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }

            const response = await obtenerDashboard();

            setDashboard({
                estadisticas: {
                    ...EMPTY_STATS,
                    ...(response?.data?.estadisticas || {}),
                },
                actividad_reciente:
                    response?.data?.actividad_reciente || [],
            });
        } catch (err) {
            console.error('Error al cargar el dashboard:', err);

            setError(
                err?.response?.data?.message ||
                'No se pudo cargar la información del dashboard.'
            );
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        loadDashboard();
    }, [loadDashboard]);

    const totalRegistros = useMemo(() => {
        return Object.values(dashboard.estadisticas).reduce(
            (total, value) => total + Number(value || 0),
            0
        );
    }, [dashboard.estadisticas]);

    const currentDate = useMemo(() => {
        return new Intl.DateTimeFormat('es-PE', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        }).format(new Date());
    }, []);

    return (
        <section className="dashboard-page">
            <header className="dashboard-header">
                <div className="dashboard-heading">
                    <span className="dashboard-eyebrow">
                        Panel administrativo
                    </span>

                    <h1>Dashboard</h1>

                    <p>
                        Supervisa el contenido, los servicios y las solicitudes
                        del Portal Web DSTI.
                    </p>

                    <span className="dashboard-current-date">
                        {currentDate}
                    </span>
                </div>

                <button
                    type="button"
                    className="dashboard-refresh-button"
                    onClick={() => loadDashboard({ refresh: true })}
                    disabled={loading || refreshing}
                >
                    <span
                        className={refreshing ? 'dashboard-refresh-icon spinning' : ''}
                        aria-hidden="true"
                    >
                        ↻
                    </span>

                    {refreshing ? 'Actualizando...' : 'Actualizar'}
                </button>
            </header>

            {user && (
                <article className="dashboard-welcome-card">
                    <div className="dashboard-user-avatar">
                        {getInitials(user.nombre_completo)}
                    </div>

                    <div className="dashboard-user-info">
                        <span>Bienvenido nuevamente</span>
                        <h2>{user.nombre_completo || 'Administrador'}</h2>
                        <p>{user.email}</p>
                    </div>

                    <div className="dashboard-user-role">
                        <span>Rol actual</span>
                        <strong>{user.rol || 'Administrador'}</strong>
                    </div>

                    <div className="dashboard-total-summary">
                        <span>Registros gestionados</span>
                        <strong>{totalRegistros}</strong>
                    </div>
                </article>
            )}

            {error && (
                <div className="dashboard-alert" role="alert">
                    <div>
                        <strong>No se pudo cargar el dashboard</strong>
                        <p>{error}</p>
                    </div>

                    <button
                        type="button"
                        onClick={() => loadDashboard()}
                    >
                        Reintentar
                    </button>
                </div>
            )}

            <div className="dashboard-section-heading">
                <div>
                    <span className="dashboard-section-eyebrow">
                        Resumen general
                    </span>
                    <h2>Estadísticas del portal</h2>
                </div>
            </div>

            <div className="dashboard-grid">
                {STAT_CARDS.map((card) => (
                    <Link
                        to={card.route}
                        className="dashboard-stat-card"
                        key={card.key}
                    >
                        <div className="dashboard-stat-card-top">
                            <span className="dashboard-stat-icon">
                                {card.icon}
                            </span>

                            <span className="dashboard-stat-link">
                                Ver módulo →
                            </span>
                        </div>

                        <span className="dashboard-stat-label">
                            {card.label}
                        </span>

                        {loading ? (
                            <span className="dashboard-stat-skeleton" />
                        ) : (
                            <strong>
                                {dashboard.estadisticas[card.key] ?? 0}
                            </strong>
                        )}

                        <p>{card.description}</p>
                    </Link>
                ))}
            </div>

            <div className="dashboard-content-grid">
                <section className="dashboard-panel">
                    <div className="dashboard-panel-header">
                        <div>
                            <span className="dashboard-section-eyebrow">
                                Auditoría
                            </span>
                            <h2>Actividad reciente</h2>
                        </div>

                        <Link
                            to="/admin/auditoria"
                            className="dashboard-panel-link"
                        >
                            Ver auditoría
                        </Link>
                    </div>

                    {loading ? (
                        <div className="dashboard-activity-loading">
                            {[1, 2, 3, 4].map((item) => (
                                <div
                                    className="dashboard-activity-skeleton"
                                    key={item}
                                >
                                    <span />
                                    <div>
                                        <strong />
                                        <small />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : dashboard.actividad_reciente.length > 0 ? (
                        <div className="dashboard-activity-list">
                            {dashboard.actividad_reciente.map(
                                (activity, index) => (
                                    <article
                                        className="dashboard-activity-item"
                                        key={
                                            activity.idlog ||
                                            `${activity.entidad}-${index}`
                                        }
                                    >
                                        <span className="dashboard-activity-marker" />

                                        <div className="dashboard-activity-content">
                                            <p>
                                                <strong>
                                                    {activity.usuario ||
                                                        'Sistema'}
                                                </strong>{' '}
                                                {getActionLabel(activity.accion)}
                                                {activity.entidad && (
                                                    <>
                                                        {' '}
                                                        en{' '}
                                                        <span>
                                                            {activity.entidad}
                                                        </span>
                                                    </>
                                                )}
                                            </p>

                                            <small>
                                                {formatDate(
                                                    activity.created_at
                                                )}
                                            </small>
                                        </div>
                                    </article>
                                )
                            )}
                        </div>
                    ) : (
                        <div className="dashboard-empty-state">
                            <span>✓</span>
                            <h3>Sin actividad reciente</h3>
                            <p>
                                Las operaciones administrativas aparecerán en
                                esta sección.
                            </p>
                        </div>
                    )}
                </section>

                <aside className="dashboard-panel">
                    <div className="dashboard-panel-header">
                        <div>
                            <span className="dashboard-section-eyebrow">
                                Navegación
                            </span>
                            <h2>Accesos rápidos</h2>
                        </div>
                    </div>

                    <div className="dashboard-quick-actions">
                        {QUICK_ACTIONS.map((action) => (
                            <Link
                                to={action.route}
                                className="dashboard-quick-action"
                                key={action.title}
                                target={action.external ? '_blank' : undefined}
                                rel={
                                    action.external
                                        ? 'noopener noreferrer'
                                        : undefined
                                }
                            >
                                <span className="dashboard-quick-icon">
                                    {action.icon}
                                </span>

                                <span>
                                    <strong>{action.title}</strong>
                                    <small>{action.description}</small>
                                </span>

                                <span
                                    className="dashboard-quick-arrow"
                                    aria-hidden="true"
                                >
                                    →
                                </span>
                            </Link>
                        ))}
                    </div>
                </aside>
            </div>
        </section>
    );
}