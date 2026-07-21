import api from './axios';

export const listarFaqs = async (params = {}) => {
    const response = await api.get('/admin/faqs', { params });
    return response.data;
};

export const obtenerFaq = async (id) => {
    const response = await api.get(`/admin/faqs/${id}`);
    return response.data;
};

export const crearFaq = async (payload) => {
    const response = await api.post('/admin/faqs', payload);
    return response.data;
};

export const actualizarFaq = async (id, payload) => {
    const response = await api.put(`/admin/faqs/${id}`, payload);
    return response.data;
};

export const eliminarFaq = async (id) => {
    const response = await api.delete(`/admin/faqs/${id}`);
    return response.data;
};

export const listarCategorias = async (params = {}) => {
    const response = await api.get('/admin/categorias', { params });
    return response.data;
};

export const listarEstados = async (params = {}) => {
    const response = await api.get('/admin/estados', { params });
    return response.data;
};