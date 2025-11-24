import api from './api';

const getCategories = async () => {
    const response = await api.get('/produits/list-categories');
    return response.data.categories;
};

const addCategory = async (categoryData) => {
    const response = await api.post('/produits/add-category', categoryData);
    return response.data;
};

const editCategory = async (categoryId, categoryData) => {
    const response = await api.put(`/produits/edit-category/${categoryId}`, categoryData);
    return response.data;
};

const deleteCategory = async (categoryId) => {
    const response = await api.delete(`/produits/delete-category/${categoryId}`);
    return response.data;
};

const updateCategoryStatus = async (categoryId, status) => {
    const response = await api.put(`/produits/status-category/${categoryId}`, { status });
    return response.data;
};
const getProduits = async () => {
    const response = await api.get('/produits/list');
    return response.data.products;
};
const addProduit = async (produitData) => {
    const response = await api.post('/produits/add', produitData);
    return response.data;
};
const editProduit = async (produitId, produitData) => {
    const response = await api.put(`/produits/edit/${produitId}`, produitData);
    return response.data;
};
const deleteProduit = async (produitId) => {
    const response = await api.delete(`/produits/delete/${produitId}`);
    return response.data;
};
const updateProduitStatus = async (produitId, status) => {
    const response = await api.put(`/produits/status/${produitId}`, { status });
    return response.data;
};

const produitService = {
    getCategories,
    addCategory,
    editCategory,
    deleteCategory,
    updateCategoryStatus,
    getProduits,
    addProduit,
    editProduit,
    deleteProduit,
    updateProduitStatus,
};
export default produitService;