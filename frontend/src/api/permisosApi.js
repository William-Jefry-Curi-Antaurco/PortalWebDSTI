import api from './axios';

export const listarPermisos = async (params = {}) => {
    const response = await api.get('/admin/permisos', { params });
    return response.data;
};

export const obtenerPermiso = async (id) => {
    const response = await api.get(`/admin/permisos/${id}`);
    return response.data;
};

export const crearPermiso = async (payload) => {
    const response = await api.post('/admin/permisos', payload);
    return response.data;
};

export const actualizarPermiso = async (id, payload) => {
    const response = await api.put(`/admin/permisos/${id}`, payload);
    return response.data;
};

export const eliminarPermiso = async (id) => {
    const response = await api.delete(`/admin/permisos/${id}`);
    return response.data;
};