import api from './axios';

export const obtenerConfiguracion = async (params = {}) => {
    const response = await api.get('/admin/configuracion', { params });
    return response.data;
};

export const actualizarConfiguracion = async (payload) => {
    const response = await api.put('/admin/configuracion', {
        config: payload,
    });

    return response.data;
};

export const subirArchivoConfiguracion = async (clave, archivo) => {
    const formData = new FormData();

    formData.append('clave', clave);
    formData.append('archivo', archivo);

    const response = await api.post(
        '/admin/configuracion/archivo',
        formData
    );

    return response.data;
};

export const eliminarArchivoConfiguracion = async (clave) => {
    const response = await api.delete(
        `/admin/configuracion/archivo/${encodeURIComponent(clave)}`
    );

    return response.data;
};

export const obtenerConfiguracionPublica = async () => {
    const response = await api.get('/public/configuracion');
    return response.data;
};