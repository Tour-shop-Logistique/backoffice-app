import api from "./api";

const getRoles = async () => {
    const response = await api.get('/backoffice/roles');
    return response.data.roles;
};

const addRole = async (roleData) => {
    const response = await api.post('/backoffice/roles', roleData);
    return response.data;
};

const editRole = async (roleId, roleData) => {
    const response = await api.put(`/backoffice/roles/${roleId}`, roleData);
    return response.data;
};

const deleteRole = async (roleId) => {
    const response = await api.delete(`/backoffice/roles/${roleId}`);
    return response.data;
};

const roleService = {
    getRoles,
    addRole,
    editRole,
    deleteRole,
};

export default roleService;
