import axios from 'axios';

// URL racine du backend, SANS suffixe /api (ex: https://api.tourshop-express.com)
export const API_URL = import.meta.env.VITE_API_URL;

// En développement : utilise le proxy Vite (/api, voir vite.config.js)
// En production : appelle directement l'API, en ajoutant le préfixe /api ici
// plutôt que de l'exiger dans VITE_API_URL (source d'erreurs silencieuses si
// oublié).
const baseURL = import.meta.env.DEV ? '/api' : `${API_URL}/api`;

const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'ngrok-skip-browser-warning': 'true', // Pour bypasser la page d'avertissement ngrok
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
  (response) => {
    console.log(`✅ Response SUCCESS [${response.config.url}]:`, response.status);
    return response;
  },
  (error) => {
    if (error.response) {
      // Le serveur a répondu avec un code d'erreur
      console.error('❌ API Error Status:', error.response.status);
      console.error('❌ API Error Data:', error.response.data);
    } else if (error.request) {
      // La requête a été faite mais pas de réponse reçue
      console.error('⚠️ No Response from server (Network Error or CORS):', error.message);
      console.log('Detailed Request:', error.request);
    } else {
      // Erreur lors de la configuration de la requête
      console.error('🚫 Request Setup Error:', error.message);
    }
    return Promise.reject(error);
  }
);

export default api;
