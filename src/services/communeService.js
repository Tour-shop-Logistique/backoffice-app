import api from './api';

const getCommunes = async () => {
  const response = await api.get('/communes/list');
  return response.data.communes;
};

// Variante publique, filtrée par pays plutôt que par le backoffice de
// l'utilisateur connecté - utilisée pour choisir la commune de destination
// d'un tarif DHD, qui peut appartenir à n'importe quel backoffice actif
// (voir CommuneController::listPublic() côté backend).
const getCommunesByPays = async (codePays) => {
  const response = await api.get(`/communes?code_pays=${encodeURIComponent(codePays)}`);
  return response.data.communes || [];
};

const addCommune = async (communeData) => {
  const response = await api.post('/communes/add', communeData);
  return response.data;
};

// Création groupée : { noms: string[] } -> { creees, ignorees, message }
const addCommunesBulk = async (noms) => {
  const response = await api.post('/communes/add-bulk', { noms });
  return response.data;
};

const editCommune = async (communeId, communeData) => {
  const response = await api.put(`/communes/edit/${communeId}`, communeData);
  return response.data;
};

const deleteCommune = async (communeId) => {
  const response = await api.delete(`/communes/delete/${communeId}`);
  return response.data;
};

const updateCommuneStatus = async (communeId) => {
  const response = await api.put(`/communes/status/${communeId}`);
  return response.data;
};

const communeService = {
  getCommunes,
  getCommunesByPays,
  addCommune,
  addCommunesBulk,
  editCommune,
  deleteCommune,
  updateCommuneStatus,
};

export default communeService;
