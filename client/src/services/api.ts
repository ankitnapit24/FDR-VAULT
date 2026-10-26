import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
});

// Intercept requests and attach Bearer token
api.interceptors.request.use(config => {
  const token = localStorage.getItem('fdrvault_token') || localStorage.getItem('fdrflow_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Intercept responses for auth expiration
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401 && !window.location.pathname.includes('/login')) {
      localStorage.removeItem('fdrvault_token');
      localStorage.removeItem('fdrvault_user');
      localStorage.removeItem('fdrflow_token');
      localStorage.removeItem('fdrflow_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
