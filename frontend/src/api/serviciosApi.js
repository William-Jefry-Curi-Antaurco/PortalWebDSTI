import api from './axios';

export const listarServicios = async (params = {}) => {
    const response = await api.get('/admin/servicios', { params });
    return response.data;
};

export const obtenerServicio = async (id) => {
    const response = await api.get(`/admin/servicios/${id}`);
    return response.data;
};

export const crearServicio = async (payload) => {
    const response = await api.post('/admin/servicios', payload);
    return response.data;
};

export const actualizarServicio = async (id, payload) => {
    const response = await api.put(`/admin/servicios/${id}`, payload);
    return response.data;
};

export const eliminarServicio = async (id) => {
    const response = await api.delete(`/admin/servicios/${id}`);
    return response.data;
};

export const listarEtiquetas = async () => {
    const response = await api.get('/admin/etiquetas');
    return response.data;
};