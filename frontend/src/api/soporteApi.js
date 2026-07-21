import api from './axios';

export const listarSolicitudesSoporte = async (params = {}) => {
    const response = await api.get('/admin/solicitudes-soporte', { params });
    return response.data;
};

export const obtenerSolicitudSoporte = async (id) => {
    const response = await api.get(`/admin/solicitudes-soporte/${id}`);
    return response.data;
};

export const crearSolicitudSoporte = async (data) => {
    const response = await api.post('/admin/solicitudes-soporte', data, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });

    return response.data;
};

export const actualizarSolicitudSoporte = async (id, data) => {
    const response = await api.post(`/admin/solicitudes-soporte/${id}`, data, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });

    return response.data;
};

export const eliminarSolicitudSoporte = async (id) => {
    const response = await api.delete(`/admin/solicitudes-soporte/${id}`);
    return response.data;
};

export const responderSolicitudSoporte = async (id, payload) => {
    const response = await api.post(`/admin/solicitudes-soporte/${id}/respuestas`, payload);
    return response.data;
};

export const eliminarRespuestaSoporte = async (id) => {
    const response = await api.delete(`/admin/solicitudes-soporte/respuestas/${id}`);
    return response.data;
};

export const listarTiposSoporte = async (params = {}) => {
    const response = await api.get('/admin/tipos-soporte', { params });
    return response.data;
};

export const listarPrioridades = async (params = {}) => {
    const response = await api.get('/admin/prioridades', { params });
    return response.data;
};

export const listarEstados = async (params = {}) => {
    const response = await api.get('/admin/estados', { params });
    return response.data;
};