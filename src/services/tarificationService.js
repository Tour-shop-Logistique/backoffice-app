import api from './api';
import { useSelector } from 'react-redux';

 
const getTarifs = async (pays) => {
  console.log(pays);
  const response = await api.get(`/tarification/list?pays=${pays}`);

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

const tarificationService = {
  getTarifs,
  addSimpleTarif,
  editSimpleTarif,
  deleteTarif,
  updateTarifStatus,
};

export default tarificationService;
