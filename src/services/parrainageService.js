import api from './api';

const getTaux = async () => {
  const response = await api.get('/backoffice/parrainage/taux');
  return response.data.taux;
};

const updateTaux = async (tauxData) => {
  const response = await api.put('/backoffice/parrainage/taux', tauxData);
  return response.data;
};

const getClients = async () => {
  const response = await api.get('/backoffice/parrainage/clients');
  return response.data.clients;
};

const parrainageService = {
  getTaux,
  updateTaux,
  getClients,
};

export default parrainageService;
