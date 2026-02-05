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
            console.log(listProduits, "Produits");
            return listProduits;
        } catch (error) {
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
                state.categories = data;
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
                state.listProduits = data;
                state.hasLoadedProduits = true;
            })
            .addCase(fetchProduits.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
            })

            // ADD CATEGORY
            .addCase(addCategory.fulfilled, (state, action) => {
                if (action.payload?.category) {
                    state.categories.unshift(action.payload.category);
                }
            })
            // EDIT CATEGORY
            .addCase(editCategory.fulfilled, (state, action) => {
                if (action.payload?.category) {
                    const index = state.categories.findIndex(c => c.id === action.payload.category.id);
                    if (index !== -1) {
                        state.categories[index] = action.payload.category;
                    }
                }
            })
            // DELETE CATEGORY
            .addCase(deleteCategory.fulfilled, (state, action) => {
                state.categories = state.categories.filter(c => c.id !== action.payload.id);
            })

            // ADD PRODUIT
            .addCase(addProduit.fulfilled, (state, action) => {
                if (action.payload?.product) {
                    state.listProduits.unshift(action.payload.product);
                }
            })
            // EDIT PRODUIT
            .addCase(editProduit.fulfilled, (state, action) => {
                if (action.payload?.product) {
                    const index = state.listProduits.findIndex(p => p.id === action.payload.product.id);
                    if (index !== -1) {
                        state.listProduits[index] = action.payload.product;
                    }
                }
            })
            // DELETE PRODUIT
            .addCase(deleteProduit.fulfilled, (state, action) => {
                state.listProduits = state.listProduits.filter(p => p.id !== action.payload.id);
            })

            // UPDATE CATEGORY STATUS
            .addCase(updateCategoryStatus.fulfilled, (state, action) => {
                const category = action.payload?.category || action.payload;
                if (category) {
                    const index = state.categories.findIndex(c => c.id === category.id);
                    if (index !== -1) {
                        state.categories[index] = category;
                    }
                }
            });
    }
});

export default produitSlice.reducer;
