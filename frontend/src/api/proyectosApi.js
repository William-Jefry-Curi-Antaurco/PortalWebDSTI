import api from './axios';

export const listarProyectos = async (params = {}) => {
    const response = await api.get('/admin/proyectos', { params });
    return response.data;
};

export const obtenerProyecto = async (id) => {
    const response = await api.get(`/admin/proyectos/${id}`);
    return response.data;
};

export const crearProyecto = async (payload) => {
    const response = await api.post('/admin/proyectos', payload, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });

    return response.data;
};

export const actualizarProyecto = async (id, payload) => {
    const response = await api.post(`/admin/proyectos/${id}`, payload, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });

    return response.data;
};

export const eliminarProyecto = async (id) => {
    const response = await api.delete(`/admin/proyectos/${id}`);
    return response.data;
};


export const listarEtiquetas = async () => {
    const response = await api.get('/admin/etiquetas');
    return response.data;
};