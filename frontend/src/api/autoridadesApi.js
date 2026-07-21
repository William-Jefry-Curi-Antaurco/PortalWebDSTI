import api from './axios';

export const listarAutoridades = async (params = {}) => {
    const response = await api.get('/admin/autoridades', { params });
    return response.data;
};

export const obtenerAutoridad = async (id) => {
    const response = await api.get(`/admin/autoridades/${id}`);
    return response.data;
};

export const crearAutoridad = async (payload) => {
    const response = await api.post('/admin/autoridades', payload, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });

    return response.data;
};

export const actualizarAutoridad = async (id, payload) => {
    const response = await api.post(`/admin/autoridades/${id}`, payload, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });

    return response.data;
};

export const eliminarAutoridad = async (id) => {
    const response = await api.delete(`/admin/autoridades/${id}`);
    return response.data;
};