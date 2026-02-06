import api from './api';

const agenceService = {
    getAgences: async () => {
        const response = await api.get('/agence/list');
        return response.data;
    },

    updateAgenceStatus: async (agenceId, status) => {
        const response = await api.put(`/agence/status/${agenceId}`, { status });
        return response.data;
    }
};

export default agenceService;
