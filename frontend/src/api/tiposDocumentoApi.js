import api from './axios';

export const listarTiposDocumento = async () => {
    const response = await api.get('/admin/tipos-documento');
    return response.data;
};

export const obtenerTipoDocumento = async (id) => {
    const response = await api.get(`/admin/tipos-documento/${id}`);
    return response.data;
};

export const crearTipoDocumento = async (payload) => {
    const response = await api.post('/admin/tipos-documento', payload);
    return response.data;
};

export const actualizarTipoDocumento = async (id, payload) => {
    const response = await api.put(`/admin/tipos-documento/${id}`, payload);
    return response.data;
};

export const eliminarTipoDocumento = async (id) => {
    const response = await api.delete(`/admin/tipos-documento/${id}`);
    return response.data;
};