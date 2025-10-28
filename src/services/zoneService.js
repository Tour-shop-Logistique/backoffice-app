import api from './api';

const getZones = async () => {
  const response = await api.get('/zones/list');
  return response.data.zones;
};

const addZone = async (zoneData) => {
  const response = await api.post('/zones/add', zoneData);
  return response.data;
};

const editZone = async (zoneId, zoneData) => {
  const response = await api.put(`/zones/edit/${zoneId}`, zoneData);
  return response.data;
};

const deleteZone = async (zoneId) => {
  const response = await api.delete(`/zones/delete/${zoneId}`);
  return response.data;
};

const updateZoneStatus = async (zoneId, status) => {
  const response = await api.put(`/zones/status/${zoneId}`, { status });
  return response.data;
};

const zoneService = {
  getZones,
  addZone,
  editZone,
  deleteZone,
  updateZoneStatus,
};

export default zoneService;
