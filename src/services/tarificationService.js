import api from './api';
import { useSelector } from 'react-redux';


const getTarifs = async () => {
  const response = await api.get(`/tarification/list-simple`);
  // Retourner response.data.tarifs s'il existe, sinon response.data.data.tarifs, sinon response.data (si c'est déjà un tableau)
  return response.data.tarifs || response.data.data?.tarifs || response.data;
};

const addSimpleTarif = async (tarifData) => {
  const response = await api.post('/tarification/add-simple', tarifData);
  return response.data;
};

const editSimpleTarif = async (tarifId, tarifData) => {
  const response = await api.put(`/tarification/edit-simple/${tarifId}`, tarifData);
  return response.data;
};

const deleteTarif = async (tarifId) => {
  const response = await api.delete(`/tarification/delete-simple/${tarifId}`);
  return response.data;
};

const updateTarifStatus = async (tarifId) => {
  const response = await api.put(`/tarification/status-simple/${tarifId}`);
  return response.data;
};

const getGroupedTarifs = async () => {
  const response = await api.get('/tarification/list-groupage');
  return response.data.tarifs;
};

const addGroupedTarif = async (tarifData) => {
  console.log("API POST /tarification/add-groupage | Payload:", tarifData);
  const response = await api.post('/tarification/add-groupage', tarifData);
  console.log("API Response (Add):", response.data);
  return response.data;
};

const editGroupedTarif = async (tarifId, tarifData) => {
  console.log(`API PUT /tarification/edit-groupage/${tarifId} | Payload:`, tarifData);
  const response = await api.put(`/tarification/edit-groupage/${tarifId}`, tarifData);
  console.log("API Response (Edit):", response.data);
  return response.data;
};

const deleteGroupedTarif = async (tarifId) => {
  const response = await api.delete(`/tarification/delete-groupage/${tarifId}`);
  return response.data;
};

const updateGroupedTarifStatus = async (arg) => {
  // Extract ID whether it's a primitive or an object
  const tarifId = typeof arg === 'object' && arg !== null ? (arg.tarifId || arg.id) : arg;
  const response = await api.put(`/tarification/status-groupage/${tarifId}`);
  return response.data;
};

const getIntervilleTarifs = async () => {
  const response = await api.get('/tarification/list-interville');
  return response.data.tarifs;
};

const addIntervilleTarif = async (tarifData) => {
  const response = await api.post('/tarification/add-interville', tarifData);
  return response.data;
};

const editIntervilleTarif = async (tarifId, tarifData) => {
  const response = await api.put(`/tarification/edit-interville/${tarifId}`, tarifData);
  return response.data;
};

const deleteIntervilleTarif = async (tarifId) => {
  const response = await api.delete(`/tarification/delete-interville/${tarifId}`);
  return response.data;
};

const updateIntervilleTarifStatus = async (tarifId) => {
  const response = await api.put(`/tarification/status-interville/${tarifId}`);
  return response.data;
};

const getLivraisonCommuneTarifs = async () => {
  const response = await api.get('/tarification/list-livraison-commune');
  return response.data.tarifs;
};

const addLivraisonCommuneTarif = async (tarifData) => {
  const response = await api.post('/tarification/add-livraison-commune', tarifData);
  return response.data;
};

const editLivraisonCommuneTarif = async (tarifId, tarifData) => {
  const response = await api.put(`/tarification/edit-livraison-commune/${tarifId}`, tarifData);
  return response.data;
};

const deleteLivraisonCommuneTarif = async (tarifId) => {
  const response = await api.delete(`/tarification/delete-livraison-commune/${tarifId}`);
  return response.data;
};

const updateLivraisonCommuneTarifStatus = async (tarifId) => {
  const response = await api.put(`/tarification/status-livraison-commune/${tarifId}`);
  return response.data;
};

const getEnlevementCommuneTarifs = async () => {
  const response = await api.get('/tarification/list-enlevement-commune');
  return response.data.tarifs;
};

const addEnlevementCommuneTarif = async (tarifData) => {
  const response = await api.post('/tarification/add-enlevement-commune', tarifData);
  return response.data;
};

const editEnlevementCommuneTarif = async (tarifId, tarifData) => {
  const response = await api.put(`/tarification/edit-enlevement-commune/${tarifId}`, tarifData);
  return response.data;
};

const deleteEnlevementCommuneTarif = async (tarifId) => {
  const response = await api.delete(`/tarification/delete-enlevement-commune/${tarifId}`);
  return response.data;
};

const updateEnlevementCommuneTarifStatus = async (tarifId) => {
  const response = await api.put(`/tarification/status-enlevement-commune/${tarifId}`);
  return response.data;
};

const tarificationService = {
  getTarifs,
  getGroupedTarifs,
  addSimpleTarif,
  editSimpleTarif,
  deleteTarif,
  updateTarifStatus,
  addGroupedTarif,
  editGroupedTarif,
  deleteGroupedTarif,
  updateGroupedTarifStatus,
  getIntervilleTarifs,
  addIntervilleTarif,
  editIntervilleTarif,
  deleteIntervilleTarif,
  updateIntervilleTarifStatus,
  getLivraisonCommuneTarifs,
  addLivraisonCommuneTarif,
  editLivraisonCommuneTarif,
  deleteLivraisonCommuneTarif,
  updateLivraisonCommuneTarifStatus,
  getEnlevementCommuneTarifs,
  addEnlevementCommuneTarif,
  editEnlevementCommuneTarif,
  deleteEnlevementCommuneTarif,
  updateEnlevementCommuneTarifStatus,
};

export default tarificationService;
