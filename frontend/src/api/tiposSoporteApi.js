import api from './axios';

export const listarTiposSoporte = async () => {
    const response = await api.get('/admin/tipos-soporte');
    return response.data;
};

export const obtenerTipoSoporte = async (id) => {
    const response = await api.get(`/admin/tipos-soporte/${id}`);
    return response.data;
};

export const crearTipoSoporte = async (payload) => {
    const response = await api.post('/admin/tipos-soporte', payload);
    return response.data;
};

export const actualizarTipoSoporte = async (id, payload) => {
    const response = await api.put(`/admin/tipos-soporte/${id}`, payload);
    return response.data;
};

export const eliminarTipoSoporte = async (id) => {
    const response = await api.delete(`/admin/tipos-soporte/${id}`);
    return response.data;
};