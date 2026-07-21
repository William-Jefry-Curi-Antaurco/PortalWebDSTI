import api from './axios';

export const getPublicInicio = async () => {
    const response = await api.get('/public/inicio');
    return response.data;
};

export const getPublicCatalogos = async () => {
    const response = await api.get('/public/catalogos');
    return response.data;
};

export const getPublicInstitucional = async () => {
    const response = await api.get('/public/institucional');
    return response.data;
};

export const getPublicAutoridades = async () => {
    const response = await api.get('/public/autoridades');
    return response.data;
};

export const getPublicProyectos = async (params = {}) => {
    const response = await api.get('/public/proyectos', { params });
    return response.data;
};

export const getPublicServicios = async (params = {}) => {
    const response = await api.get('/public/servicios', { params });
    return response.data;
};

export const getPublicSistemas = async (params = {}) => {
    const response = await api.get('/public/sistemas', { params });
    return response.data;
};

export const getPublicNoticias = async (params = {}) => {
    const response = await api.get('/public/noticias', { params });
    return response.data;
};

export const getPublicDocumentos = async (params = {}) => {
    const response = await api.get('/public/documentos', { params });
    return response.data;
};

export const getPublicEventos = async (params = {}) => {
    const response = await api.get('/public/eventos', { params });
    return response.data;
};

export const getPublicTutoriales = async (params = {}) => {
    const response = await api.get('/public/tutoriales', { params });
    return response.data;
};

export const getPublicFaqs = async (params = {}) => {
    const response = await api.get('/public/faqs', { params });
    return response.data;
};

export const registrarPublicSoporte = async (payload) => {
    const response = await api.post('/public/soporte', payload);
    return response.data;
};


export const getPublicConfiguracion = async () => {
    const response = await api.get('/public/configuracion');
    return response.data;
};

export const getPublicNoticiaDetalle = (slug) => {
    return api.get(`/public/noticias/${slug}`);
};