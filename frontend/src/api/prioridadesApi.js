import api from './axios';

export const listarPrioridades = async () => {
    const response = await api.get('/admin/prioridades');
    return response.data;
};

export const obtenerPrioridad = async (id) => {
    const response = await api.get(`/admin/prioridades/${id}`);
    return response.data;
};

export const crearPrioridad = async (payload) => {
    const response = await api.post('/admin/prioridades', payload);
    return response.data;
};

export const actualizarPrioridad = async (id, payload) => {
    const response = await api.put(`/admin/prioridades/${id}`, payload);
    return response.data;
};

export const eliminarPrioridad = async (id) => {
    const response = await api.delete(`/admin/prioridades/${id}`);
    return response.data;
};