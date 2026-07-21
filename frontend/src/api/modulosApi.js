import api from './axios';

export const listarModulos = async () => {
    const response = await api.get('/admin/modulos');
    return response.data;
};

export const obtenerModulo = async (id) => {
    const response = await api.get(`/admin/modulos/${id}`);
    return response.data;
};

export const crearModulo = async (payload) => {
    const response = await api.post('/admin/modulos', payload);
    return response.data;
};

export const actualizarModulo = async (id, payload) => {
    const response = await api.put(`/admin/modulos/${id}`, payload);
    return response.data;
};

export const eliminarModulo = async (id) => {
    const response = await api.delete(`/admin/modulos/${id}`);
    return response.data;
};