import api from './axios';

export const listarDocumentos = async (params = {}) => {
    const response = await api.get('/admin/documentos', { params });
    return response.data;
};

export const obtenerDocumento = async (id) => {
    const response = await api.get(`/admin/documentos/${id}`);
    return response.data;
};

export const crearDocumento = async (data) => {
    const response = await api.post('/admin/documentos', data, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });

    return response.data;
};

export const actualizarDocumento = async (id, data) => {
    const response = await api.post(`/admin/documentos/${id}`, data, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });

    return response.data;
};

export const eliminarDocumento = async (id) => {
    const response = await api.delete(`/admin/documentos/${id}`);
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

export const listarTiposDocumento = async (params = {}) => {
    const response = await api.get('/admin/tipos-documento', { params });
    return response.data;
};

export const listarEtiquetas = async () => {
    const response = await api.get('/admin/etiquetas');
    return response.data;
};