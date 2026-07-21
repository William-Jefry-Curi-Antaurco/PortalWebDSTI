import { useEffect, useMemo, useState } from 'react';
import {
    listarLogsActividad,
    obtenerLogActividad,
    eliminarLogActividad,
    limpiarLogsActividad,
} from '../api/auditoriaApi';
import '../styles/modules/auditoria.css';

const ACTION_OPTIONS = [
    { value: 'crear', label: 'Crear' },
    { value: 'actualizar', label: 'Actualizar' },
    { value: 'eliminar', label: 'Eliminar' },
];

const INITIAL_FILTERS = {
    buscar: '',
    idusuario: '',
    accion: '',
    entidad: '',
    identificador_entidad: '',
    fecha_inicio: '',
    fecha_fin: '',
};

const INITIAL_PAGINATION = {
    current_page: 1,
    last_page: 1,
    per_page: 20,
    total: 0,
    from: 0,
    to: 0,
};

const MAX_SEARCH_LENGTH = 120;
const MAX_ENTITY_LENGTH = 50;

const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
};

const isPositiveInteger = (value) => {
    if (value === '' || value === null || value === undefined) return true;
    return Number.isInteger(Number(value)) && Number(value) > 0;
};

const isValidDateString = (value) => {
    if (!value) return true;

    const date = new Date(`${value}T00:00:00`);
    return !Number.isNaN(date.getTime());
};

const isFutureDate = (value) => {
    if (!value) return false;

    const inputDate = new Date(`${value}T00:00:00`);
    const today = new Date();

    today.setHours(0, 0, 0, 0);

    return inputDate > today;
};

const isAllowedAction = (value) => {
    if (!value) return true;
    return ACTION_OPTIONS.some((option) => option.value === value);
};

const normalizePaginatedResponse = (response) => {
    const paginated = response?.data;

    if (!paginated) {
        return {
            logs: [],
            pagination: INITIAL_PAGINATION,
        };
    }

    if (Array.isArray(paginated)) {
        return {
            logs: paginated,
            pagination: {
                ...INITIAL_PAGINATION,
                total: paginated.length,
                from: paginated.length > 0 ? 1 : 0,
                to: paginated.length,
            },
        };
    }

    return {
        logs: Array.isArray(paginated.data) ? paginated.data : [],
        pagination: {
            current_page: Number(paginated.current_page) || 1,
            last_page: Number(paginated.last_page) || 1,
            per_page: Number(paginated.per_page) || 20,
            total: Number(paginated.total) || 0,
            from: Number(paginated.from) || 0,
            to: Number(paginated.to) || 0,
        },
    };
};

const getApiErrorMessage = (error) => {
    const data = error?.response?.data;

    if (data?.errors) {
        const firstKey = Object.keys(data.errors)[0];

        if (firstKey && Array.isArray(data.errors[firstKey])) {
            return data.errors[firstKey][0];
        }
    }

    if (data?.message) return data.message;

    return 'Ocurrió un error inesperado.';
};

const formatDateTime = (value) => {
    if (!value) return 'Sin fecha';

    try {
        return new Date(value).toLocaleString('es-PE', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
        });
    } catch {
        return value;
    }
};

const getUsuarioName = (log) => {
    if (log?.usuario?.nombre_completo) return log.usuario.nombre_completo;
    if (log?.usuario?.email) return log.usuario.email;
    if (log?.idusuario) return `Usuario #${log.idusuario}`;

    return 'Sistema';
};

const getActionClass = (accion = '') => {
    const value = accion.toLowerCase();

    if (value.includes('crear') || value.includes('insert') || value.includes('registr')) {
        return 'auditoria-action-create';
    }

    if (value.includes('actualizar') || value.includes('update') || value.includes('editar')) {
        return 'auditoria-action-update';
    }

    if (value.includes('eliminar') || value.includes('delete')) {
        return 'auditoria-action-delete';
    }

    return 'auditoria-action-default';
};

const getActionLabel = (accion = '') => {
    const value = accion.toLowerCase();
    const option = ACTION_OPTIONS.find((item) => item.value === value);

    return option?.label || accion || 'Sin acción';
};

const parseDetalles = (detalles) => {
    if (!detalles) return null;

    if (typeof detalles === 'object') return detalles;

    try {
        return JSON.parse(detalles);
    } catch {
        return detalles;
    }
};

const formatDetalles = (detalles) => {
    const parsed = parseDetalles(detalles);

    if (!parsed) return 'Sin detalles';

    if (typeof parsed === 'string') return parsed;

    return JSON.stringify(parsed, null, 2);
};

const Auditoria = () => {
    const [logs, setLogs] = useState([]);
    const [pagination, setPagination] = useState(INITIAL_PAGINATION);

    const [filters, setFilters] = useState(INITIAL_FILTERS);
    const [appliedFilters, setAppliedFilters] = useState(INITIAL_FILTERS);

    const [selectedLog, setSelectedLog] = useState(null);
    const [cleanDate, setCleanDate] = useState('');

    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [isCleanOpen, setIsCleanOpen] = useState(false);

    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingDetail, setIsLoadingDetail] = useState(false);
    const [isCleaning, setIsCleaning] = useState(false);

    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const hasFilters = useMemo(() => {
        return Object.values(appliedFilters).some((value) => String(value).trim() !== '');
    }, [appliedFilters]);

    const visiblePages = useMemo(() => {
        const current = pagination.current_page;
        const last = pagination.last_page;
        const pages = [];

        const start = Math.max(1, current - 2);
        const end = Math.min(last, current + 2);

        for (let page = start; page <= end; page += 1) {
            pages.push(page);
        }

        return pages;
    }, [pagination]);

    const summary = useMemo(() => {
        const creaciones = logs.filter((log) => {
            const action = String(log.accion || '').toLowerCase();
            return action.includes('crear') || action.includes('insert') || action.includes('registr');
        }).length;

        const actualizaciones = logs.filter((log) => {
            const action = String(log.accion || '').toLowerCase();
            return action.includes('actualizar') || action.includes('update') || action.includes('editar');
        }).length;

        const eliminaciones = logs.filter((log) => {
            const action = String(log.accion || '').toLowerCase();
            return action.includes('eliminar') || action.includes('delete');
        }).length;

        return {
            totalPagina: logs.length,
            creaciones,
            actualizaciones,
            eliminaciones,
        };
    }, [logs]);

    const clearMessages = () => {
        setError('');
        setSuccessMessage('');
    };

    const validateFilters = (values) => {
        const buscar = values.buscar.trim();
        const entidad = values.entidad.trim();

        if (buscar.length > MAX_SEARCH_LENGTH) {
            setError(`La búsqueda no debe superar los ${MAX_SEARCH_LENGTH} caracteres.`);
            return false;
        }

        if (!isAllowedAction(values.accion)) {
            setError('Seleccione una acción válida: Crear, Actualizar o Eliminar.');
            return false;
        }

        if (entidad.length > MAX_ENTITY_LENGTH) {
            setError(`La entidad no debe superar los ${MAX_ENTITY_LENGTH} caracteres.`);
            return false;
        }

        if (!isPositiveInteger(values.idusuario)) {
            setError('El ID de usuario debe ser un número entero mayor que cero.');
            return false;
        }

        if (!isPositiveInteger(values.identificador_entidad)) {
            setError('El ID de entidad debe ser un número entero mayor que cero.');
            return false;
        }

        if (!isValidDateString(values.fecha_inicio)) {
            setError('La fecha de inicio no tiene un formato válido.');
            return false;
        }

        if (!isValidDateString(values.fecha_fin)) {
            setError('La fecha fin no tiene un formato válido.');
            return false;
        }

        if (isFutureDate(values.fecha_inicio)) {
            setError('La fecha de inicio no puede ser futura.');
            return false;
        }

        if (isFutureDate(values.fecha_fin)) {
            setError('La fecha fin no puede ser futura.');
            return false;
        }

        if (values.fecha_inicio && values.fecha_fin) {
            const inicio = new Date(`${values.fecha_inicio}T00:00:00`);
            const fin = new Date(`${values.fecha_fin}T00:00:00`);

            if (inicio > fin) {
                setError('La fecha de inicio no puede ser mayor que la fecha fin.');
                return false;
            }
        }

        return true;
    };

    const validateCleanDate = () => {
        if (!cleanDate) {
            setError('Debe indicar la fecha límite para limpiar logs.');
            return false;
        }

        if (!isValidDateString(cleanDate)) {
            setError('La fecha límite no tiene un formato válido.');
            return false;
        }

        if (isFutureDate(cleanDate)) {
            setError('La fecha límite no puede ser futura.');
            return false;
        }

        return true;
    };

    const buildParams = (page = 1, customFilters = appliedFilters) => {
        const safePage = Number.isInteger(Number(page)) && Number(page) > 0 ? Number(page) : 1;

        const params = {
            page: safePage,
            buscar: customFilters.buscar.trim() || undefined,
            idusuario: customFilters.idusuario ? Number(customFilters.idusuario) : undefined,
            accion: customFilters.accion || undefined,
            entidad: customFilters.entidad.trim() || undefined,
            identificador_entidad: customFilters.identificador_entidad
                ? Number(customFilters.identificador_entidad)
                : undefined,
            fecha_inicio: customFilters.fecha_inicio || undefined,
            fecha_fin: customFilters.fecha_fin || undefined,
        };

        Object.keys(params).forEach((key) => {
            if (params[key] === undefined || params[key] === '') {
                delete params[key];
            }
        });

        return params;
    };

    const loadLogs = async (page = 1, customFilters = appliedFilters) => {
        try {
            setIsLoading(true);
            setError('');

            const response = await listarLogsActividad(buildParams(page, customFilters));
            const { logs: data, pagination: meta } = normalizePaginatedResponse(response);

            setLogs(data);
            setPagination(meta);
        } catch (err) {
            setError(getApiErrorMessage(err));
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadLogs(1, INITIAL_FILTERS);
    }, []);

    const handleFilterChange = (event) => {
        const { name, value } = event.target;

        setFilters((currentFilters) => ({
            ...currentFilters,
            [name]: value,
        }));
    };

    const handleOnlyPositiveIntegerChange = (event) => {
        const { name, value } = event.target;

        if (value === '' || /^[1-9]\d*$/.test(value)) {
            setFilters((currentFilters) => ({
                ...currentFilters,
                [name]: value,
            }));
        }
    };

    const handleSearch = async (event) => {
        event.preventDefault();
        clearMessages();

        if (!validateFilters(filters)) return;

        setAppliedFilters(filters);
        await loadLogs(1, filters);
    };

    const handleClearFilters = async () => {
        clearMessages();

        setFilters(INITIAL_FILTERS);
        setAppliedFilters(INITIAL_FILTERS);

        await loadLogs(1, INITIAL_FILTERS);
    };

    const handlePageChange = async (page) => {
        if (
            page < 1 ||
            page > pagination.last_page ||
            page === pagination.current_page ||
            isLoading
        ) {
            return;
        }

        await loadLogs(page);
    };

    const handleOpenDetail = async (log) => {
        try {
            clearMessages();
            setIsLoadingDetail(true);
            setIsDetailOpen(true);
            setSelectedLog(null);

            const response = await obtenerLogActividad(log.idlog);
            setSelectedLog(response.data || log);
        } catch (err) {
            setError(getApiErrorMessage(err));
            setIsDetailOpen(false);
        } finally {
            setIsLoadingDetail(false);
        }
    };

    const handleCloseDetail = () => {
        setIsDetailOpen(false);
        setSelectedLog(null);
    };

    const handleDelete = async (log) => {
        clearMessages();

        const confirmed = window.confirm(
            `¿Estás seguro de eliminar el log #${log.idlog}? Esta acción no se puede deshacer.`
        );

        if (!confirmed) return;

        try {
            setIsLoading(true);

            await eliminarLogActividad(log.idlog);

            setSuccessMessage('Log de actividad eliminado correctamente.');

            const pageToLoad = logs.length === 1 && pagination.current_page > 1
                ? pagination.current_page - 1
                : pagination.current_page;

            await loadLogs(pageToLoad);
        } catch (err) {
            setError(getApiErrorMessage(err));
        } finally {
            setIsLoading(false);
        }
    };

    const handleOpenClean = () => {
        clearMessages();
        setCleanDate('');
        setIsCleanOpen(true);
    };

    const handleCloseClean = () => {
        if (isCleaning) return;

        setCleanDate('');
        setIsCleanOpen(false);
    };

    const handleCleanLogs = async (event) => {
        event.preventDefault();
        clearMessages();

        if (!validateCleanDate()) return;

        const confirmed = window.confirm(
            `¿Estás seguro de eliminar todos los logs creados hasta el ${cleanDate}? Esta acción no se puede deshacer.`
        );

        if (!confirmed) return;

        try {
            setIsCleaning(true);

            const response = await limpiarLogsActividad({
                fecha_fin: cleanDate,
            });



            const eliminados = response?.data?.eliminados ?? 0;

            setSuccessMessage(`Limpieza completada. Logs eliminados: ${eliminados}.`);
            setIsCleanOpen(false);
            setCleanDate('');

            await loadLogs(1);
        } catch (err) {
            setError(getApiErrorMessage(err));
        } finally {
            setIsCleaning(false);
        }
    };

    return (
        <section className="auditoria-page">
            <header className="auditoria-header">
                <div>
                    <p className="auditoria-kicker">Seguridad y trazabilidad</p>
                    <h1>Auditoría del sistema</h1>
                    <p>
                        Consulta los registros de actividad generados por el panel administrativo.
                    </p>
                </div>

                <div className="auditoria-header-actions">
                    <button
                        type="button"
                        className="auditoria-btn auditoria-btn-secondary"
                        onClick={() => loadLogs(pagination.current_page)}
                        disabled={isLoading}
                    >
                        {isLoading ? 'Actualizando...' : 'Actualizar'}
                    </button>

                    <button
                        type="button"
                        className="auditoria-btn auditoria-btn-danger"
                        onClick={handleOpenClean}
                        disabled={isLoading}
                    >
                        Limpiar logs
                    </button>
                </div>
            </header>

            {error && (
                <div className="auditoria-alert auditoria-alert-error">{error}</div>
            )}

            {successMessage && (
                <div className="auditoria-alert auditoria-alert-success">
                    {successMessage}
                </div>
            )}

            <div className="auditoria-summary-grid">
                <div className="auditoria-summary-card">
                    <span>Total registros</span>
                    <strong>{pagination.total}</strong>
                    <small>
                        Mostrando {pagination.from || 0} - {pagination.to || 0}
                    </small>
                </div>

                <div className="auditoria-summary-card">
                    <span>Registros en página</span>
                    <strong>{summary.totalPagina}</strong>
                    <small>Página {pagination.current_page}</small>
                </div>

                <div className="auditoria-summary-card">
                    <span>Creaciones</span>
                    <strong>{summary.creaciones}</strong>
                    <small>En la página actual</small>
                </div>

                <div className="auditoria-summary-card">
                    <span>Actualizaciones</span>
                    <strong>{summary.actualizaciones}</strong>
                    <small>En la página actual</small>
                </div>

                <div className="auditoria-summary-card auditoria-summary-danger">
                    <span>Eliminaciones</span>
                    <strong>{summary.eliminaciones}</strong>
                    <small>En la página actual</small>
                </div>
            </div>

            <div className="auditoria-card">
                <form className="auditoria-filters" onSubmit={handleSearch}>
                    <div className="auditoria-filter-main">
                        <label htmlFor="buscar">Búsqueda general</label>
                        <input
                            id="buscar"
                            name="buscar"
                            type="search"
                            value={filters.buscar}
                            onChange={handleFilterChange}
                            placeholder="Buscar por acción, entidad, IP o navegador..."
                            maxLength={MAX_SEARCH_LENGTH}
                            disabled={isLoading}
                        />
                    </div>

                    <div className="auditoria-filter-grid">
                        <div className="auditoria-field">
                            <label htmlFor="accion">Acción</label>
                            <select
                                id="accion"
                                name="accion"
                                value={filters.accion}
                                onChange={handleFilterChange}
                                disabled={isLoading}
                            >
                                <option value="">Todas las acciones</option>
                                {ACTION_OPTIONS.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="auditoria-field">
                            <label htmlFor="entidad">Entidad</label>
                            <input
                                id="entidad"
                                name="entidad"
                                type="text"
                                value={filters.entidad}
                                onChange={handleFilterChange}
                                placeholder="noticias, usuarios, roles..."
                                maxLength={MAX_ENTITY_LENGTH}
                                disabled={isLoading}
                            />
                        </div>

                        <div className="auditoria-field">
                            <label htmlFor="idusuario">ID usuario</label>
                            <input
                                id="idusuario"
                                name="idusuario"
                                type="text"
                                inputMode="numeric"
                                value={filters.idusuario}
                                onChange={handleOnlyPositiveIntegerChange}
                                placeholder="Ej. 1"
                                disabled={isLoading}
                            />
                        </div>

                        <div className="auditoria-field">
                            <label htmlFor="identificador_entidad">ID entidad</label>
                            <input
                                id="identificador_entidad"
                                name="identificador_entidad"
                                type="text"
                                inputMode="numeric"
                                value={filters.identificador_entidad}
                                onChange={handleOnlyPositiveIntegerChange}
                                placeholder="Ej. 25"
                                disabled={isLoading}
                            />
                        </div>

                        <div className="auditoria-field">
                            <label htmlFor="fecha_inicio">Fecha inicio</label>
                            <input
                                id="fecha_inicio"
                                name="fecha_inicio"
                                type="date"
                                value={filters.fecha_inicio}
                                onChange={handleFilterChange}
                                max={filters.fecha_fin || getTodayDate()}
                                disabled={isLoading}
                            />
                        </div>

                        <div className="auditoria-field">
                            <label htmlFor="fecha_fin">Fecha fin</label>
                            <input
                                id="fecha_fin"
                                name="fecha_fin"
                                type="date"
                                value={filters.fecha_fin}
                                onChange={handleFilterChange}
                                min={filters.fecha_inicio || undefined}
                                max={getTodayDate()}
                                disabled={isLoading}
                            />
                        </div>
                    </div>

                    <div className="auditoria-filter-actions">
                        <button
                            type="submit"
                            className="auditoria-btn auditoria-btn-primary"
                            disabled={isLoading}
                        >
                            Buscar
                        </button>

                        <button
                            type="button"
                            className="auditoria-btn auditoria-btn-light"
                            onClick={handleClearFilters}
                            disabled={isLoading}
                        >
                            Limpiar filtros
                        </button>

                        {hasFilters && (
                            <span className="auditoria-filter-badge">
                                Filtros activos
                            </span>
                        )}
                    </div>
                </form>
            </div>

            <div className="auditoria-card auditoria-table-card">
                <div className="auditoria-table-header">
                    <div>
                        <h2>Logs de actividad</h2>
                        <p>{pagination.total} registro(s) encontrado(s)</p>
                    </div>
                </div>

                <div className="auditoria-table-wrapper">
                    <table className="auditoria-table">
                        <thead>
                        <tr>
                            <th>ID</th>
                            <th>Acción</th>
                            <th>Entidad</th>
                            <th>Identificador</th>
                            <th>Usuario</th>
                            <th>IP</th>
                            <th>Fecha</th>
                            <th>Acciones</th>
                        </tr>
                        </thead>

                        <tbody>
                        {isLoading ? (
                            <tr>
                                <td colSpan="8" className="auditoria-empty">
                                    Cargando logs de actividad...
                                </td>
                            </tr>
                        ) : logs.length === 0 ? (
                            <tr>
                                <td colSpan="8" className="auditoria-empty">
                                    No se encontraron registros de auditoría.
                                </td>
                            </tr>
                        ) : (
                            logs.map((log) => (
                                <tr key={log.idlog}>
                                    <td>#{log.idlog}</td>

                                    <td>
                                            <span
                                                className={`auditoria-action-badge ${getActionClass(log.accion)}`}
                                            >
                                                {getActionLabel(log.accion)}
                                            </span>
                                    </td>

                                    <td>
                                        <strong className="auditoria-entity">
                                            {log.entidad || 'Sin entidad'}
                                        </strong>
                                    </td>

                                    <td>
                                        {log.identificador_entidad ? (
                                            <span className="auditoria-id-badge">
                                                    #{log.identificador_entidad}
                                                </span>
                                        ) : (
                                            <span className="auditoria-muted">—</span>
                                        )}
                                    </td>

                                    <td>
                                        <div className="auditoria-user-cell">
                                            <strong>{getUsuarioName(log)}</strong>
                                            {log.usuario?.email && (
                                                <span>{log.usuario.email}</span>
                                            )}
                                        </div>
                                    </td>

                                    <td>
                                            <span className="auditoria-ip">
                                                {log.ip_origen || 'Sin IP'}
                                            </span>
                                    </td>

                                    <td>{formatDateTime(log.created_at)}</td>

                                    <td>
                                        <div className="auditoria-actions">
                                            <button
                                                type="button"
                                                className="auditoria-action-btn auditoria-action-view"
                                                onClick={() => handleOpenDetail(log)}
                                            >
                                                Ver detalle
                                            </button>

                                            <button
                                                type="button"
                                                className="auditoria-action-btn auditoria-action-delete"
                                                onClick={() => handleDelete(log)}
                                            >
                                                Eliminar
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                        </tbody>
                    </table>
                </div>

                <div className="auditoria-pagination">
                    <button
                        type="button"
                        className="auditoria-page-btn"
                        onClick={() => handlePageChange(pagination.current_page - 1)}
                        disabled={isLoading || pagination.current_page <= 1}
                    >
                        Anterior
                    </button>

                    {visiblePages.map((page) => (
                        <button
                            key={page}
                            type="button"
                            className={
                                page === pagination.current_page
                                    ? 'auditoria-page-btn auditoria-page-btn-active'
                                    : 'auditoria-page-btn'
                            }
                            onClick={() => handlePageChange(page)}
                            disabled={isLoading}
                        >
                            {page}
                        </button>
                    ))}

                    <button
                        type="button"
                        className="auditoria-page-btn"
                        onClick={() => handlePageChange(pagination.current_page + 1)}
                        disabled={
                            isLoading ||
                            pagination.current_page >= pagination.last_page
                        }
                    >
                        Siguiente
                    </button>
                </div>
            </div>

            {isDetailOpen && (
                <div className="auditoria-modal-overlay" role="dialog" aria-modal="true">
                    <div className="auditoria-modal auditoria-detail-modal">
                        <div className="auditoria-modal-header">
                            <div>
                                <p className="auditoria-kicker">Detalle de auditoría</p>
                                <h2>
                                    {selectedLog
                                        ? `Log #${selectedLog.idlog}`
                                        : 'Cargando detalle...'}
                                </h2>
                            </div>

                            <button
                                type="button"
                                className="auditoria-modal-close"
                                onClick={handleCloseDetail}
                                aria-label="Cerrar detalle"
                            >
                                ×
                            </button>
                        </div>

                        {isLoadingDetail ? (
                            <div className="auditoria-empty">Cargando detalle...</div>
                        ) : selectedLog ? (
                            <div className="auditoria-detail">
                                <div className="auditoria-detail-grid">
                                    <div>
                                        <span>Acción</span>
                                        <strong>{getActionLabel(selectedLog.accion)}</strong>
                                    </div>

                                    <div>
                                        <span>Entidad</span>
                                        <strong>{selectedLog.entidad || 'Sin entidad'}</strong>
                                    </div>

                                    <div>
                                        <span>ID entidad</span>
                                        <strong>{selectedLog.identificador_entidad || '—'}</strong>
                                    </div>

                                    <div>
                                        <span>Usuario</span>
                                        <strong>{getUsuarioName(selectedLog)}</strong>
                                    </div>

                                    <div>
                                        <span>IP origen</span>
                                        <strong>{selectedLog.ip_origen || 'Sin IP'}</strong>
                                    </div>

                                    <div>
                                        <span>Fecha</span>
                                        <strong>{formatDateTime(selectedLog.created_at)}</strong>
                                    </div>
                                </div>

                                <div className="auditoria-detail-section">
                                    <h3>User Agent</h3>
                                    <p>{selectedLog.user_agent || 'No registrado'}</p>
                                </div>

                                <div className="auditoria-detail-section">
                                    <h3>Detalles JSON</h3>
                                    <pre>{formatDetalles(selectedLog.detalles)}</pre>
                                </div>
                            </div>
                        ) : (
                            <div className="auditoria-empty">
                                No se pudo cargar el detalle del log.
                            </div>
                        )}
                    </div>
                </div>
            )}

            {isCleanOpen && (
                <div className="auditoria-modal-overlay" role="dialog" aria-modal="true">
                    <div className="auditoria-modal auditoria-clean-modal">
                        <div className="auditoria-modal-header">
                            <div>
                                <p className="auditoria-kicker">Mantenimiento</p>
                                <h2>Limpiar logs antiguos</h2>
                            </div>

                            <button
                                type="button"
                                className="auditoria-modal-close"
                                onClick={handleCloseClean}
                                disabled={isCleaning}
                                aria-label="Cerrar limpieza"
                            >
                                ×
                            </button>
                        </div>

                        <form className="auditoria-clean-form" onSubmit={handleCleanLogs}>
                            <p>
                                Esta acción eliminará todos los registros de auditoría creados
                                hasta la fecha indicada. No se puede deshacer.
                            </p>

                            <div className="auditoria-field">
                                <label htmlFor="cleanDate">Eliminar hasta</label>
                                <input
                                    id="cleanDate"
                                    type="date"
                                    value={cleanDate}
                                    max={getTodayDate()}
                                    onChange={(event) => setCleanDate(event.target.value)}
                                    disabled={isCleaning}
                                />
                            </div>

                            <div className="auditoria-form-actions">
                                <button
                                    type="submit"
                                    className="auditoria-btn auditoria-btn-danger"
                                    disabled={isCleaning}
                                >
                                    {isCleaning ? 'Limpiando...' : 'Limpiar logs'}
                                </button>

                                <button
                                    type="button"
                                    className="auditoria-btn auditoria-btn-light"
                                    onClick={handleCloseClean}
                                    disabled={isCleaning}
                                >
                                    Cancelar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </section>
    );
};

export default Auditoria;