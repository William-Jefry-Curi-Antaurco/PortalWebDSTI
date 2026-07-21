export const saveAuth = (data) => {
    localStorage.setItem('auth_token', data.token);
    localStorage.setItem('auth_user', JSON.stringify(data.usuario));
};

export const getToken = () => {
    return localStorage.getItem('auth_token');
};

export const getUser = () => {
    const user = localStorage.getItem('auth_user');
    return user ? JSON.parse(user) : null;
};

export const clearAuth = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
};

export const isAuthenticated = () => {
    return Boolean(getToken());
};