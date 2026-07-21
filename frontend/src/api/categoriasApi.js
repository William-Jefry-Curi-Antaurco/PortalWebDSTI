import api from './axios';

export const listarCategorias = async () => {
    const response = await api.get('/admin/categorias');
    return response.data;
};

export const obtenerCategoria = async (id) => {
    const response = await api.get(`/admin/categorias/${id}`);
    return response.data;
};

export const crearCategoria = async (payload) => {
    const response = await api.post('/admin/categorias', payload);
    return response.data;
};

export const actualizarCategoria = async (id, payload) => {
    const response = await api.put(`/admin/categorias/${id}`, payload);
    return response.data;
};

export const eliminarCategoria = async (id) => {
    const response = await api.delete(`/admin/categorias/${id}`);
    return response.data;
};