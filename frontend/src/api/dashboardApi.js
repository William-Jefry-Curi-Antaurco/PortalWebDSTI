import api from './axios';

export const obtenerDashboard = async () => {
    const response = await api.get('/admin/dashboard');
    return response.data;
};

