import api from './axios';

export const listarNoticias = async () => {
    const response = await api.get('/admin/noticias');
    return response.data;
};

export const crearNoticia = async (payload) => {
    const response = await api.post('/admin/noticias', payload);
    return response.data;
};

export const actualizarNoticia = async (id, payload) => {
    const response = await api.put(`/admin/noticias/${id}`, payload);
    return response.data;
};

export const eliminarNoticia = async (id) => {
    const response = await api.delete(`/admin/noticias/${id}`);
    return response.data;
};

export const subirImagenNoticia = async (idnoticia, payload) => {
    const response = await api.post(`/admin/noticias/${idnoticia}/imagenes`, payload);
    return response.data;
};

export const eliminarImagenNoticia = async (idimagen) => {
    const response = await api.delete(`/admin/noticias/imagenes/${idimagen}`);
    return response.data;
};

export const listarEtiquetas = async () => {
    const response = await api.get('/admin/etiquetas');
    return response.data;
};