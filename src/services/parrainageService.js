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

const getRetraits = async (parrainId) => {
  const response = await api.get('/backoffice/parrainage/retraits', {
    params: parrainId ? { parrain_id: parrainId } : {},
  });
  return response.data.retraits;
};

const createRetrait = async (retraitData) => {
  const response = await api.post('/backoffice/parrainage/retraits', retraitData);
  return response.data;
};

const parrainageService = {
  getTaux,
  updateTaux,
  getClients,
  getRetraits,
  createRetrait,
};

export default parrainageService;
