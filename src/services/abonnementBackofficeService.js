import api from './api';

const getSettings = async () => {
  const response = await api.get('/abonnement/backoffice/settings');
  return response.data.setting;
};

const updateSettings = async (settingsData) => {
  const response = await api.put('/abonnement/backoffice/settings', settingsData);
  return response.data.setting;
};

const getEcheances = async (params = {}) => {
  const response = await api.get('/abonnement/backoffice/echeances', { params });
  return response.data.echeances;
};

const getEcheance = async (id) => {
  const response = await api.get(`/abonnement/backoffice/echeances/${id}`);
  return response.data.echeance;
};

const validerPaiement = async (paiementId) => {
  const response = await api.post(`/abonnement/backoffice/paiements/${paiementId}/valider`);
  return response.data;
};

const rejeterPaiement = async (paiementId, commentaire) => {
  const response = await api.post(`/abonnement/backoffice/paiements/${paiementId}/rejeter`, { commentaire });
  return response.data;
};

const abonnementBackofficeService = {
  getSettings,
  updateSettings,
  getEcheances,
  getEcheance,
  validerPaiement,
  rejeterPaiement,
};

export default abonnementBackofficeService;
