import api from './axios';

export const listarTiposTutorial = async () => {
    const response = await api.get('/admin/tipos-tutorial');
    return response.data;
};

export const obtenerTipoTutorial = async (id) => {
    const response = await api.get(`/admin/tipos-tutorial/${id}`);
    return response.data;
};

export const crearTipoTutorial = async (payload) => {
    const response = await api.post('/admin/tipos-tutorial', payload);
    return response.data;
};

export const actualizarTipoTutorial = async (id, payload) => {
    const response = await api.put(`/admin/tipos-tutorial/${id}`, payload);
    return response.data;
};

export const eliminarTipoTutorial = async (id) => {
    const response = await api.delete(`/admin/tipos-tutorial/${id}`);
    return response.data;
};