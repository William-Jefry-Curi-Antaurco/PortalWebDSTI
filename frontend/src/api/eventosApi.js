import api from './axios';

export const listarEventos = async (params = {}) => {
    const response = await api.get('/admin/eventos', { params });
    return response.data;
};

export const obtenerEvento = async (id) => {
    const response = await api.get(`/admin/eventos/${id}`);
    return response.data;
};

export const crearEvento = async (data) => {
    const response = await api.post('/admin/eventos', data, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });

    return response.data;
};

export const actualizarEvento = async (id, data) => {
    const response = await api.post(`/admin/eventos/${id}`, data, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });

    return response.data;
};

export const eliminarEvento = async (id) => {
    const response = await api.delete(`/admin/eventos/${id}`);
    return response.data;
};

export const subirArchivoEvento = async (idEvento, data) => {
    const response = await api.post(`/admin/eventos/${idEvento}/archivos`, data, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });

    return response.data;
};

export const actualizarArchivoEvento = async (idArchivoEvento, data) => {
    const response = await api.post(`/admin/eventos/archivos/${idArchivoEvento}`, data, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });

    return response.data;
};

export const eliminarArchivoEvento = async (idArchivoEvento) => {
    const response = await api.delete(`/admin/eventos/archivos/${idArchivoEvento}`);
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

export const listarTiposEvento = async (params = {}) => {
    const response = await api.get('/admin/tipos-evento', { params });
    return response.data;
};

export const listarModalidadesEvento = async (params = {}) => {
    const response = await api.get('/admin/modalidades-evento', { params });
    return response.data;
};

export const listarEtiquetas = async () => {
    const response = await api.get('/admin/etiquetas');
    return response.data;
};