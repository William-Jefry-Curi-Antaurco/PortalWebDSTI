import api from './axios';

export const listarEstados = async () => {
    const response = await api.get('/admin/estados');
    return response.data;
};

export const obtenerEstado = async (id) => {
    const response = await api.get(`/admin/estados/${id}`);
    return response.data;
};

export const crearEstado = async (payload) => {
    const response = await api.post('/admin/estados', payload);
    return response.data;
};

export const actualizarEstado = async (id, payload) => {
    const response = await api.put(`/admin/estados/${id}`, payload);
    return response.data;
};

export const eliminarEstado = async (id) => {
    const response = await api.delete(`/admin/estados/${id}`);
    return response.data;
};