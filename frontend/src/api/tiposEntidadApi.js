import api from './axios';

export const listarTiposEntidad = async () => {
    const response = await api.get('/admin/tipos-entidad');
    return response.data;
};

export const obtenerTipoEntidad = async (id) => {
    const response = await api.get(`/admin/tipos-entidad/${id}`);
    return response.data;
};

export const crearTipoEntidad = async (payload) => {
    const response = await api.post('/admin/tipos-entidad', payload);
    return response.data;
};

export const actualizarTipoEntidad = async (id, payload) => {
    const response = await api.put(`/admin/tipos-entidad/${id}`, payload);
    return response.data;
};

export const eliminarTipoEntidad = async (id) => {
    const response = await api.delete(`/admin/tipos-entidad/${id}`);
    return response.data;
};