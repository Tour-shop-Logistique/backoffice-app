import api from './api';

const getProfile = async () => {
  const response = await api.get('/profile');
  return response.data;
};

const updateProfile = async (profileData) => {
  const response = await api.put('/profile/update', profileData);
  return response.data;
};

const changePassword = async (passwordData) => {
  const response = await api.put('/profile/change-password', passwordData);
  return response.data;
};

const profileService = {
  getProfile,
  updateProfile,
  changePassword,
};

export default profileService;
