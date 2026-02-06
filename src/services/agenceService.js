import api from './api';

const agenceService = {
    getAgences: async () => {
        const response = await api.get('/agence/list');
        return response.data;
    },

    updateAgenceStatus: async (agenceId, status) => {
        const response = await api.put(`/agence/status/${agenceId}`, { status });
        return response.data;
    },

    getAgenceById: async (agenceId) => {
        const response = await api.get(`/agence/show/${agenceId}`);
        return response.data;
    },

    getAgenceTarifsGroupage: async (agenceId) => {
        const response = await api.get(`/agence/list-tarifs-groupage?agence_id=${agenceId}`);
        return response.data;
    },

    getAgenceTarifsSimple: async (agenceId) => {
        const response = await api.get(`/agence/list-tarifs-simple?agence_id=${agenceId}`);
        return response.data;
    }
};

export default agenceService;
