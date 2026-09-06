import api from './api';

const getMissionsEnAttente = async () => {
  const response = await api.get('/backoffice/missions-groupage-en-attente');
  return response.data.missions;
};

const getLivreursDisponibles = async () => {
  const response = await api.get('/backoffice/missions-groupage/livreurs-disponibles');
  return response.data.livreurs;
};

const assignerMission = async (missionId, payload) => {
  const response = await api.post(`/backoffice/missions-groupage/${missionId}/assigner`, payload);
  return response.data;
};

const missionGroupageService = {
  getMissionsEnAttente,
  getLivreursDisponibles,
  assignerMission,
};

export default missionGroupageService;
