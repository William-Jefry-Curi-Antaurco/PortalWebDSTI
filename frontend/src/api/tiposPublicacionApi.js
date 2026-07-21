import api from './axios';

export const listarTiposPublicacion = async () => {
    const response = await api.get('/admin/tipos-publicacion');
    return response.data;
};

export const obtenerTipoPublicacion = async (id) => {
    const response = await api.get(`/admin/tipos-publicacion/${id}`);
    return response.data;
};

export const crearTipoPublicacion = async (payload) => {
    const response = await api.post('/admin/tipos-publicacion', payload);
    return response.data;
};

export const actualizarTipoPublicacion = async (id, payload) => {
    const response = await api.put(`/admin/tipos-publicacion/${id}`, payload);
    return response.data;
};

export const eliminarTipoPublicacion = async (id) => {
    const response = await api.delete(`/admin/tipos-publicacion/${id}`);
    return response.data;
};