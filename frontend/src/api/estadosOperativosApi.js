import api from './axios';

export const listarEstadosOperativos = async () => {
    const response = await api.get('/admin/estados-operativos');
    return response.data;
};

export const obtenerEstadoOperativo = async (id) => {
    const response = await api.get(`/admin/estados-operativos/${id}`);
    return response.data;
};

export const crearEstadoOperativo = async (payload) => {
    const response = await api.post('/admin/estados-operativos', payload);
    return response.data;
};

export const actualizarEstadoOperativo = async (id, payload) => {
    const response = await api.put(`/admin/estados-operativos/${id}`, payload);
    return response.data;
};

export const eliminarEstadoOperativo = async (id) => {
    const response = await api.delete(`/admin/estados-operativos/${id}`);
    return response.data;
};