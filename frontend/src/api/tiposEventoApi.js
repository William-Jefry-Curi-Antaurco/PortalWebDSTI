import api from './axios';

export const listarTiposEvento = async () => {
    const response = await api.get('/admin/tipos-evento');
    return response.data;
};

export const obtenerTipoEvento = async (id) => {
    const response = await api.get(`/admin/tipos-evento/${id}`);
    return response.data;
};

export const crearTipoEvento = async (payload) => {
    const response = await api.post('/admin/tipos-evento', payload);
    return response.data;
};

export const actualizarTipoEvento = async (id, payload) => {
    const response = await api.put(`/admin/tipos-evento/${id}`, payload);
    return response.data;
};

export const eliminarTipoEvento = async (id) => {
    const response = await api.delete(`/admin/tipos-evento/${id}`);
    return response.data;
};