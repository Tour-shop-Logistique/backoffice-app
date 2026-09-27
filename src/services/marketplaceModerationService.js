import api from './api';

const getAnnonces = async (params = {}) => {
  const response = await api.get('/marketplace/backoffice/annonces/list', { params });
  return response.data.annonces;
};

const masquerAnnonce = async (id) => {
  const response = await api.post(`/marketplace/backoffice/annonces/${id}/masquer`);
  return response.data;
};

const getCommandes = async (params = {}) => {
  const response = await api.get('/marketplace/backoffice/commandes/list', { params });
  return response.data.commandes;
};

const getCommande = async (id) => {
  const response = await api.get(`/marketplace/backoffice/commandes/show/${id}`);
  return response.data.commande;
};

const marketplaceModerationService = {
  getAnnonces,
  masquerAnnonce,
  getCommandes,
  getCommande,
};

export default marketplaceModerationService;
