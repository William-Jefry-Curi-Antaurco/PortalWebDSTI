import api from './axios';

export const listarLogsActividad = async (params = {}) => {
    const response = await api.get('/admin/logs-actividad', { params });
    return response.data;
};

export const obtenerLogActividad = async (id) => {
    const response = await api.get(`/admin/logs-actividad/${id}`);
    return response.data;
};

export const eliminarLogActividad = async (id) => {
    const response = await api.delete(`/admin/logs-actividad/${id}`);
    return response.data;
};

export const limpiarLogsActividad = async (payload) => {
    const response = await api.delete('/admin/logs-actividad', {
        data: payload,
    });

    return response.data;
};