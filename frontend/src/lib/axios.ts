import axios from "axios";

const api = axios.create({
    baseURL: '/',
});

// Interceptador para añadir el token de autenticación a cada petición
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

// Interceptador para manejar errores globales (ej: 401 Unauthorized)
api.interceptors.response.use((response) => {
    return response;
}, (error) => {
    if (error.response?.status === 401) {
        // Redirigir al login si el token expiró o es inválido
        console.warn('Sesión expirada o no autorizada. Redirigiendo al login...');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
    }
    return Promise.reject(error);
});

export default api;
