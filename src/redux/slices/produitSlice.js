import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import produitService from '../../services/produitService';

const initialState = {
    listProduits: [],
    categories: [],
    isLoading: false,
    error: null,
    hasLoadedProduits: false,
    hasLoadedCategories: false,
};

/* -----------------------------
    ASYNC THUNKS : PRODUITS
-------------------------------- */

// === FETCH PRODUITS ===
export const fetchProduits = createAsyncThunk(
    'produits/fetchProduits',
    async (options = {}, { rejectWithValue }) => {
        try {
            const listProduits = await produitService.getProduits();
            return listProduits;
        } catch (error) {
            console.error(error);
            return rejectWithValue(error.response?.data || "Erreur serveur");
        }
    }
);

// === ADD PRODUIT ===
export const addProduit = createAsyncThunk(
    'produits/addProduit',
    async (produitData, { rejectWithValue }) => {
        try {
            const newProduit = await produitService.addProduit(produitData);
            return newProduit;
        } catch (error) {
            console.error(error);
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

export const editProduit = createAsyncThunk(
    'produits/editProduit',
    async ({ produitId, produitData }, { rejectWithValue }) => {
        try {
            const updatedProduit = await produitService.editProduit(produitId, produitData);
            return updatedProduit;
        } catch (error) {
            console.error(error);
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

export const deleteProduit = createAsyncThunk(
    'produits/deleteProduit',
    async (produitId, { rejectWithValue }) => {
        try {
            const res = await produitService.deleteProduit(produitId);
            return { id: produitId, ...res };
        } catch (error) {
            console.error(error);
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

export const updateProduitStatus = createAsyncThunk(
    'produits/updateProduitStatus',
    async ({ produitId, status }, { rejectWithValue }) => {
        try {
            const updatedProduit = await produitService.updateProduitStatus(produitId, status);
            return updatedProduit;
        } catch (error) {
            console.error(error);
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

/* -----------------------------
    ASYNC THUNKS : CATEGORIES
-------------------------------- */

// === FETCH CATEGORIES ===
export const fetchCategories = createAsyncThunk(
    'produits/fetchCategories',
    async (options = {}, { rejectWithValue }) => {
        try {
            const categories = await produitService.getCategories();
            return categories;
        } catch (error) {
            return rejectWithValue(error.response?.data || "Erreur serveur");
        }
    }
);

// === ADD CATEGORY ===
export const addCategory = createAsyncThunk(
    'produits/addCategory',
    async (data, { rejectWithValue }) => {
        try {
            const newCat = await produitService.addCategory(data);
            return newCat;
        } catch (error) {
            console.error(error);
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

// === EDIT CATEGORY ===
export const editCategory = createAsyncThunk(
    'produits/editCategory',
    async ({ categoryId, categoryData }, { rejectWithValue }) => {
        try {
            const updated = await produitService.editCategory(categoryId, categoryData);
            return updated;
        } catch (error) {
            console.error(error);
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

// === DELETE CATEGORY ===
export const deleteCategory = createAsyncThunk(
    'produits/deleteCategory',
    async (categoryId, { rejectWithValue }) => {
        try {
            const res = await produitService.deleteCategory(categoryId);
            return { id: categoryId, ...res };
        } catch (error) {
            console.error(error);
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

// === UPDATE CATEGORY STATUS ===
export const updateCategoryStatus = createAsyncThunk(
    'produits/updateCategoryStatus',
    async ({ categoryId, status }, { rejectWithValue }) => {
        try {
            const updated = await produitService.updateCategoryStatus(categoryId, status);
            return updated;
        } catch (error) {
            console.error(error);
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

/* -----------------------------
                SLICE
-------------------------------- */
const produitSlice = createSlice({
    name: 'produits',
    initialState,
    reducers: {
        resetProduits: (state) => {
            state.listProduits = [];
            state.categories = [];
            state.isLoading = false;
            state.error = null;
        }
    },
    extraReducers: (builder) => {
        builder
            // FETCH CATEGORIES
            .addCase(fetchCategories.pending, (state, action) => {
                if (!action.meta.arg?.silent) {
                    state.isLoading = true;
                }
            })
            .addCase(fetchCategories.fulfilled, (state, action) => {
                state.isLoading = false;
                const data = Array.isArray(action.payload) ? action.payload : (action.payload?.data || []);
                state.categories = data.map(c => ({
                    ...c,
                    actif: c.actif === true || c.actif === 1 || c.actif === "1"
                }));
                state.hasLoadedCategories = true;
            })
            .addCase(fetchCategories.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
            })

            // FETCH PRODUITS
            .addCase(fetchProduits.pending, (state, action) => {
                if (!action.meta.arg?.silent) {
                    state.isLoading = true;
                }
            })
            .addCase(fetchProduits.fulfilled, (state, action) => {
                state.isLoading = false;
                const data = Array.isArray(action.payload) ? action.payload : (action.payload?.data || []);
                state.listProduits = data.map(p => ({
                    ...p,
                    actif: p.actif === true || p.actif === 1 || p.actif === "1"
                }));
                state.hasLoadedProduits = true;
            })
            .addCase(fetchProduits.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
            })

            // ADD CATEGORY
            .addCase(addCategory.fulfilled, (state, action) => {
                const newCat = action.payload?.category || action.payload;
                if (newCat) {
                    state.categories.unshift({
                        ...action.meta.arg,
                        ...newCat,
                        actif: newCat.actif !== undefined ? newCat.actif : true
                    });
                }
            })
            // EDIT CATEGORY
            .addCase(editCategory.fulfilled, (state, action) => {
                const updated = action.payload?.category || action.payload?.data || action.payload;
                const { categoryId, categoryData } = action.meta.arg;

                state.categories = state.categories.map(c =>
                    c.id === categoryId
                        ? { ...c, ...categoryData, ...(updated && updated.id ? updated : {}) }
                        : c
                );
            })
            // DELETE CATEGORY
            .addCase(deleteCategory.fulfilled, (state, action) => {
                state.categories = state.categories.filter(c => c.id !== action.payload.id);
            })

            // ADD PRODUIT
            .addCase(addProduit.fulfilled, (state, action) => {
                const newProduct = action.payload?.product || action.payload;
                if (newProduct) {
                    state.listProduits.unshift({
                        ...action.meta.arg,
                        ...newProduct,
                        actif: newProduct.actif !== undefined ? newProduct.actif : true
                    });
                }
            })
            // EDIT PRODUIT
            .addCase(editProduit.fulfilled, (state, action) => {
                const updated = action.payload?.product || action.payload?.data || action.payload;
                const { produitId, produitData } = action.meta.arg;

                state.listProduits = state.listProduits.map(p =>
                    p.id === produitId
                        ? { ...p, ...produitData, ...(updated && updated.id ? updated : {}) }
                        : p
                );
            })
            // DELETE PRODUIT
            .addCase(deleteProduit.fulfilled, (state, action) => {
                state.listProduits = state.listProduits.filter(p => p.id !== action.payload.id);
            })

            // UPDATE CATEGORY STATUS
            .addCase(updateCategoryStatus.pending, (state, action) => {
                const { categoryId } = action.meta.arg;
                const index = state.categories.findIndex(c => c.id === categoryId);
                if (index !== -1) {
                    state.categories[index].actif = !state.categories[index].actif;
                }
            })
            .addCase(updateCategoryStatus.rejected, (state, action) => {
                const { categoryId } = action.meta.arg;
                const index = state.categories.findIndex(c => c.id === categoryId);
                if (index !== -1) {
                    state.categories[index].actif = !state.categories[index].actif;
                }
                state.error = action.payload;
            })
            .addCase(updateCategoryStatus.fulfilled, (state, action) => {
                const updated = action.payload?.category || action.payload?.data || action.payload;
                const { categoryId } = action.meta.arg;

                if (updated && updated.id) {
                    state.categories = state.categories.map(c =>
                        c.id === categoryId ? updated : c
                    );
                } else {
                    // Logic already toggled in pending
                }
            })
            // UPDATE PRODUIT STATUS
            .addCase(updateProduitStatus.pending, (state, action) => {
                const { produitId } = action.meta.arg;
                const index = state.listProduits.findIndex(p => p.id === produitId);
                if (index !== -1) {
                    state.listProduits[index].actif = !state.listProduits[index].actif;
                }
            })
            .addCase(updateProduitStatus.rejected, (state, action) => {
                const { produitId } = action.meta.arg;
                const index = state.listProduits.findIndex(p => p.id === produitId);
                if (index !== -1) {
                    state.listProduits[index].actif = !state.listProduits[index].actif;
                }
                state.error = action.payload;
            })
            .addCase(updateProduitStatus.fulfilled, (state, action) => {
                const updated = action.payload?.product || action.payload?.data || action.payload;
                const { produitId } = action.meta.arg;

                if (updated && updated.id) {
                    state.listProduits = state.listProduits.map(p =>
                        p.id === produitId ? updated : p
                    );
                } else {
                    // Logic already toggled in pending
                }
            });
    }
});

export default produitSlice.reducer;
