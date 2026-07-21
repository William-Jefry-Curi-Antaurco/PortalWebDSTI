import api from './axios';

const normalizeResponse = (response) => {
    const body = response.data;

    if (body?.data) {
        return body.data;
    }

    return body;
};

export const listarCategorias = async () => {
    const response = await api.get('/admin/categorias');
    return normalizeResponse(response);
};

export const listarEstados = async () => {
    const response = await api.get('/admin/estados');
    return normalizeResponse(response);
};

export const listarTiposPublicacion = async () => {
    const response = await api.get('/admin/tipos-publicacion');
    return normalizeResponse(response);
};