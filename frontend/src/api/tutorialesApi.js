import api from './axios';

export const listarTutoriales = async (params = {}) => {
    const response = await api.get('/admin/tutoriales', { params });
    return response.data;
};

export const obtenerTutorial = async (id) => {
    const response = await api.get(`/admin/tutoriales/${id}`);
    return response.data;
};

export const crearTutorial = async (data) => {
    const response = await api.post('/admin/tutoriales', data);
    return response.data;
};

export const actualizarTutorial = async (id, data) => {
    const response = await api.post(`/admin/tutoriales/${id}`, data);
    return response.data;
};

export const eliminarTutorial = async (id) => {
    const response = await api.delete(`/admin/tutoriales/${id}`);
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

export const listarTiposTutorial = async (params = {}) => {
    const response = await api.get('/admin/tipos-tutorial', { params });
    return response.data;
};

export const listarEtiquetas = async () => {
    const response = await api.get('/admin/etiquetas');
    return response.data;
};