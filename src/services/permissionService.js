import api from "./api";

const getAvailablePermissions = async () => {
    const response = await api.get('/backoffice/roles/available-permissions');
    return response.data.resources;
};

const permissionService = {
    getAvailablePermissions,
};

export default permissionService;
