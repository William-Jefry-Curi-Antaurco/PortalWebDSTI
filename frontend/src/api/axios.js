import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api',
    headers: {
        Accept: 'application/json',
    },
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('auth_token');

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
});

// Si el backend responde 401 (token vencido, revocado o inválido) en una
// petición autenticada, la sesión local ya no sirve: se limpia y se manda
// al login. No aplica a /auth/login (credenciales inválidas ahí es 422).
api.interceptors.response.use(
    (response) => response,
    (error) => {
        const esNoAutorizado = error.response?.status === 401;
        const yaEstaEnLogin = window.location.pathname === '/login';

        if (esNoAutorizado && !yaEstaEnLogin) {
            localStorage.removeItem('auth_token');
            localStorage.removeItem('auth_user');
            window.location.href = '/login';
        }

        return Promise.reject(error);
    }
);

export default api;