import axios from 'axios';

const api = axios.create({
  baseURL: 'https://tourshop.loophole.site/api' ? "https://tourshop.nport.link/api" : "https://tourshop.loophole.site/api",
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Intercepteur pour ajouter le token d'authentification à chaque requête
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export default api;
