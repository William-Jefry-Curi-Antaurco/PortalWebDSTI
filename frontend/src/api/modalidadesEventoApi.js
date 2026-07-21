import api from './axios';

export const listarModalidadesEvento = async () => {
    const response = await api.get('/admin/modalidades-evento');
    return response.data;
};

export const obtenerModalidadEvento = async (id) => {
    const response = await api.get(`/admin/modalidades-evento/${id}`);
    return response.data;
};

export const crearModalidadEvento = async (payload) => {
    const response = await api.post('/admin/modalidades-evento', payload);
    return response.data;
};

export const actualizarModalidadEvento = async (id, payload) => {
    const response = await api.put(`/admin/modalidades-evento/${id}`, payload);
    return response.data;
};

export const eliminarModalidadEvento = async (id) => {
    const response = await api.delete(`/admin/modalidades-evento/${id}`);
    return response.data;
};