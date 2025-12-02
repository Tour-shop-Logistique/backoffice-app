import api from "./api";

const getAgents = async () => {
    const response = await api.get('/backoffice/list-users');
    return response.data.users;
};

const addAgent = async (agentData) => {
    const response = await api.post('/backoffice/create-user', agentData);
    return response.data;
};

const editAgent = async (agentId, agentData) => {
    const response = await api.put(`/backoffice/edit-user/${agentId}`, agentData);
    return response.data;
};

const deleteAgent = async (agentId) => {
    const response = await api.delete(`/backoffice/delete-user/${agentId}`);
    return response.data;
};

const updateAgentStatus = async (agentId) => {
    const response = await api.put(`/backoffice/status-user/${agentId}`);
    return response.data;
};

const agentService = {
    getAgents,
    addAgent,
    editAgent,
    deleteAgent,
    updateAgentStatus,
};

export default agentService;