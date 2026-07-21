import api from './axios';

export const listarInfoInstitucional = async (params = {}) => {
    const response = await api.get('/admin/info-institucional', { params });
    return response.data;
};

export const obtenerInfoInstitucional = async (id) => {
    const response = await api.get(`/admin/info-institucional/${id}`);
    return response.data;
};

export const crearInfoInstitucional = async (payload) => {
    const response = await api.post('/admin/info-institucional', payload);
    return response.data;
};

export const actualizarInfoInstitucional = async (id, payload) => {
    const response = await api.put(`/admin/info-institucional/${id}`, payload);
    return response.data;
};

export const eliminarInfoInstitucional = async (id) => {
    const response = await api.delete(`/admin/info-institucional/${id}`);
    return response.data;
};