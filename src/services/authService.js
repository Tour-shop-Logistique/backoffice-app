import api from './api';

const login = async (credentials) => {
  const response = await api.post('/login', { ...credentials, type: 'backoffice' });
  console.log(response);
  if (response.data.token) {
    localStorage.setItem('user', JSON.stringify(response.data.user));
    localStorage.setItem('token', response.data.token);
  }
  return response.data;
};

const register = async (userData) => {
  console.log(userData);
  const response = await api.post('/register', { ...userData, type: 'backoffice' });
  console.log(response);
  return response.data;
};

const logout = () => {
  localStorage.removeItem('user');
  localStorage.removeItem('token');
  // Idéalement, appeler une API de déconnexion ici si elle existe
  // await api.post('/logout');
};

const authService = {
  login,
  register,
  logout,
};

export default authService;
