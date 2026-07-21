import api from './axios';

export const listarSistemasInstitucionales = async (params = {}) => {
    const response = await api.get('/admin/enlaces-sistemas', { params });
    return response.data;
};

export const obtenerSistemaInstitucional = async (id) => {
    const response = await api.get(`/admin/enlaces-sistemas/${id}`);
    return response.data;
};

export const crearSistemaInstitucional = async (payload) => {
    const response = await api.post('/admin/enlaces-sistemas', payload);
    return response.data;
};

export const actualizarSistemaInstitucional = async (id, payload) => {
    const response = await api.post(`/admin/enlaces-sistemas/${id}`, payload);
    return response.data;
};

export const eliminarSistemaInstitucional = async (id) => {
    const response = await api.delete(`/admin/enlaces-sistemas/${id}`);
    return response.data;
};

export const listarCategorias = async (params = {}) => {
    const response = await api.get('/admin/categorias', { params });
    return response.data;
};

export const listarEstadosOperativos = async (params = {}) => {
    const response = await api.get('/admin/estados-operativos', { params });
    return response.data;
};

export const listarEtiquetas = async () => {
    const response = await api.get('/admin/etiquetas');
    return response.data;
};