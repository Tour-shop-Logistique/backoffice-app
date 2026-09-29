import api from './api';

const getLivreursEnAttente = async () => {
  const response = await api.get('/backoffice/livreurs-en-attente');
  return response.data.livreurs;
};

const validerLivreur = async (livreurId) => {
  const response = await api.post(`/backoffice/livreurs/${livreurId}/valider`);
  return response.data;
};

const rejeterLivreur = async (livreurId, commentaire) => {
  const response = await api.post(`/backoffice/livreurs/${livreurId}/rejeter`, { commentaire });
  return response.data;
};

const getRetraitsLivreur = async (params = {}) => {
  const response = await api.get('/backoffice/retraits-livreur', { params });
  return response.data.retraits;
};

const confirmerRetraitLivreur = async (retraitId) => {
  const response = await api.post(`/backoffice/retraits-livreur/${retraitId}/confirmer`);
  return response.data;
};

const rejeterRetraitLivreur = async (retraitId, notes) => {
  const response = await api.post(`/backoffice/retraits-livreur/${retraitId}/rejeter`, { notes });
  return response.data;
};

const livreurValidationService = {
  getLivreursEnAttente,
  validerLivreur,
  rejeterLivreur,
  getRetraitsLivreur,
  confirmerRetraitLivreur,
  rejeterRetraitLivreur,
};

export default livreurValidationService;
