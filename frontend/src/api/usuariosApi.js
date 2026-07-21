import api from './axios';

const BASE_URL = '/admin/usuarios';

export const usuariosApi = {
    listar: async (params = {}) => {
        const response = await api.get(BASE_URL, { params });
        return response.data;
    },

    obtener: async (idusuario) => {
        const response = await api.get(`${BASE_URL}/${idusuario}`);
        return response.data;
    },

    crear: async (payload) => {
        const response = await api.post(BASE_URL, payload);
        return response.data;
    },

    actualizar: async (idusuario, payload) => {
        const response = await api.put(`${BASE_URL}/${idusuario}`, payload);
        return response.data;
    },

    eliminar: async (idusuario) => {
        const response = await api.delete(`${BASE_URL}/${idusuario}`);
        return response.data;
    },
};