import axios from 'axios';

export const API_URL = import.meta.env.VITE_API_URL;

// En développement : utilise le proxy Vite (/api)
// En production : utilise l'URL directe de l'API
const baseURL = import.meta.env.DEV ? '/api' : API_URL;

const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Intercepteur pour ajouter le token d'authentification à chaque requête
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');

  console.log('🔍 Request Debug:', {
    url: config.url,
    baseURL: config.baseURL,
    fullURL: `${config.baseURL}${config.url}`,
    hasToken: !!token,
    token: token ? `${token.substring(0, 20)}...` : 'NO TOKEN',
    headers: config.headers
  });

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  } else {
    console.warn('⚠️ NO TOKEN FOUND IN LOCALSTORAGE!');
  }

  return config;
}, (error) => {
  return Promise.reject(error);
});

// Intercepteur de réponse pour logger les erreurs
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.status, error.response?.data);
    return Promise.reject(error);
  }
);

export default api;
