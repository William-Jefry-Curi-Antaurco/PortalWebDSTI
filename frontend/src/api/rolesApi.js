import api from './axios';

const BASE_URL = '/admin/roles';

export const rolesApi = {
    listar: async () => {
        const response = await api.get(BASE_URL);
        return response.data;
    },

    obtener: async (id) => {
        const response = await api.get(`${BASE_URL}/${id}`);
        return response.data;
    },

    crear: async (payload) => {
        const response = await api.post(BASE_URL, payload);
        return response.data;
    },

    actualizar: async (id, payload) => {
        const response = await api.put(`${BASE_URL}/${id}`, payload);
        return response.data;
    },

    eliminar: async (id) => {
        const response = await api.delete(`${BASE_URL}/${id}`);
        return response.data;
    },
};