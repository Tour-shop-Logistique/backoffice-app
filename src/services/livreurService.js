import api from './api';

const getLivreurs = async () => {
  const response = await api.get('/backoffice/list-livreurs');
  return response.data.livreurs;
};

const addLivreur = async (livreurData) => {
  const response = await api.post('/backoffice/add-livreur', livreurData);
  return response.data;
};

const editLivreur = async (livreurId, livreurData) => {
  const response = await api.put(`/backoffice/edit-livreur/${livreurId}`, livreurData);
  return response.data;
};

const deleteLivreur = async (livreurId) => {
  const response = await api.delete(`/backoffice/delete-livreur/${livreurId}`);
  return response.data;
};

const updateLivreurStatus = async (livreurId) => {
  const response = await api.put(`/backoffice/status-livreur/${livreurId}`);
  return response.data;
};

const livreurService = {
  getLivreurs,
  addLivreur,
  editLivreur,
  deleteLivreur,
  updateLivreurStatus,
};

export default livreurService;
