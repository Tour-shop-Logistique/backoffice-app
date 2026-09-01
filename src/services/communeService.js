import api from './api';

const getCommunes = async () => {
  const response = await api.get('/communes/list');
  return response.data.communes;
};

const addCommune = async (communeData) => {
  const response = await api.post('/communes/add', communeData);
  return response.data;
};

const editCommune = async (communeId, communeData) => {
  const response = await api.put(`/communes/edit/${communeId}`, communeData);
  return response.data;
};

const deleteCommune = async (communeId) => {
  const response = await api.delete(`/communes/delete/${communeId}`);
  return response.data;
};

const updateCommuneStatus = async (communeId) => {
  const response = await api.put(`/communes/status/${communeId}`);
  return response.data;
};

const communeService = {
  getCommunes,
  addCommune,
  editCommune,
  deleteCommune,
  updateCommuneStatus,
};

export default communeService;
