const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://127.0.0.1:8000';

export const getFileUrl = (path) => {
    if (!path) return '#';

    const value = String(path);

    if (value.startsWith('http://') || value.startsWith('https://')) {
        return value;
    }

    return `${BACKEND_URL}/storage/${value}`;
};