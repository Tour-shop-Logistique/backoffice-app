import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import produitService from '../../services/produitService';

const initialState = {
    listProduits: [],
    categories: [],
    isLoading: false,
    error: null,
};

/* -----------------------------
    ASYNC THUNKS : PRODUITS
-------------------------------- */

// === FETCH PRODUITS ===
export const fetchProduits = createAsyncThunk(
    'produits/fetchProduits',
    async (_, { rejectWithValue }) => {
        try {
            const listProduits = await produitService.getProduits();
            console.log(listProduits , "Produits");
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
            await produitService.deleteProduit(produitId);
            return produitId;
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
    async (_, { rejectWithValue }) => {
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
            await produitService.deleteCategory(categoryId);
            return categoryId;
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
    reducers: {},
    extraReducers: (builder) => {
        builder

            // FETCH CATEGORIES
            .addCase(fetchCategories.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(fetchCategories.fulfilled, (state, action) => {
                state.isLoading = false;
                state.categories = action.payload;  // 🔥 STOCKÉ EN REDUX
            })
            .addCase(fetchCategories.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
            });

        builder
            // FETCH PRODUITS
            .addCase(fetchProduits.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(fetchProduits.fulfilled, (state, action) => {
                state.isLoading = false;
                 state.listProduits = action.payload; 
            })
            .addCase(fetchProduits.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
            });
    }
});

export default produitSlice.reducer;
