import api from './api';
import { useSelector } from 'react-redux';

 
const getTarifs = async () => {
  const response = await api.get(`/tarification/list-simple`);

  return response.data.tarifs;
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
  const response = await api.delete(`/tarification/delete/${tarifId}`);
  return response.data;
};

const updateTarifStatus = async (tarifId) => {
  const response = await api.put(`/tarification/status/${tarifId}`);
  return response.data;
};

const getGroupedTarifs = async () => {
  const response = await api.get('/tarification/list-groupage');
  console.log(response.data.tarifs);
  return response.data.tarifs;
};

const addGroupedTarif = async (tarifData) => {
  const response = await api.post('/tarification/add-groupage', tarifData);
  return response.data;
};

const editGroupedTarif = async (tarifId, tarifData) => {
  const response = await api.put(`/tarification/edit-groupage/${tarifId}`, tarifData);
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
