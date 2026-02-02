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

const updateGroupedTarifStatus = async (tarifId) => {
  const response = await api.put(`/tarification/status-groupage/${tarifId}`);
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
};

export default tarificationService;
