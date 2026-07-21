import api from './axios';

export const listarEtiquetas = async (params = {}) => {
    const response = await api.get('/admin/etiquetas', { params });
    return response.data;
};

export const obtenerEtiqueta = async (id) => {
    const response = await api.get(`/admin/etiquetas/${id}`);
    return response.data;
};

export const crearEtiqueta = async (payload) => {
    const response = await api.post('/admin/etiquetas', payload);
    return response.data;
};

export const actualizarEtiqueta = async (id, payload) => {
    const response = await api.put(`/admin/etiquetas/${id}`, payload);
    return response.data;
};

export const eliminarEtiqueta = async (id) => {
    const response = await api.delete(`/admin/etiquetas/${id}`);
    return response.data;
};

export const asignarEtiquetaContenido = async (payload) => {
    const response = await api.post('/admin/etiquetas/asignar-contenido', payload);
    return response.data;
};

export const listarEtiquetasPorContenido = async (params) => {
    const response = await api.get('/admin/etiquetas/contenido', { params });
    return response.data;
};

export const quitarEtiquetaContenido = async (payload) => {
    const response = await api.delete('/admin/etiquetas/quitar-contenido', {
        data: payload,
    });
    return response.data;
};