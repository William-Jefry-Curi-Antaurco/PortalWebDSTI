import toast from 'react-hot-toast';

export const notifySuccess = (message = 'Operación realizada correctamente.') => {
    toast.success(message);
};

export const notifyError = (message = 'Ocurrió un error.') => {
    toast.error(message);
};

export const notifyInfo = (message = 'Información') => {
    toast(message);
};

export const notifyLoading = (message = 'Procesando...') => {
    return toast.loading(message);
};

export const closeNotify = (toastId) => {
    toast.dismiss(toastId);
};

export const getApiErrorMessage = (
    error,
    fallback = 'Ocurrió un error inesperado.'
) => {
    const errors = error.response?.data?.errors;

    if (errors) {
        return Object.values(errors).flat()[0] || fallback;
    }

    return error.response?.data?.message || fallback;
};