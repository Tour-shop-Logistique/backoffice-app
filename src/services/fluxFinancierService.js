import api from './api';

/**
 * Règlements entre les agences et le backoffice. L'agence qui encaisse le
 * client garde sa commission et reverse le reste ; le backoffice garde sa
 * part et redistribue la commission de l'autre agence. Les virements se
 * font hors plateforme, seules les preuves sont tracées.
 */

const getFlux = async (params = {}) => {
  const response = await api.get('/backoffice/flux-financiers', { params });
  return response.data.flux;
};

const marquerPaye = async (id, { notes, referenceTransaction, photo } = {}) => {
  const formData = new FormData();
  if (notes) formData.append('notes', notes);
  if (referenceTransaction) formData.append('reference_transaction', referenceTransaction);
  if (photo) formData.append('photo', photo);

  const response = await api.post(`/backoffice/flux-financiers/${id}/payer`, formData);
  return response.data;
};

const confirmerReception = async (id) => {
  const response = await api.post(`/backoffice/flux-financiers/${id}/confirmer`);
  return response.data;
};

const fluxFinancierService = {
  getFlux,
  marquerPaye,
  confirmerReception,
};

export default fluxFinancierService;
