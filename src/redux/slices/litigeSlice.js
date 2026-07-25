import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

export const fetchLitiges = createAsyncThunk(
    'litiges/fetchAll',
    async (statut, { rejectWithValue }) => {
        try {
            const response = await api.get('/litiges', { params: statut ? { statut } : {} });
            if (response.data.success) {
                return response.data.data;
            }
            return rejectWithValue("Impossible de charger les litiges");
        } catch (error) {
            return rejectWithValue(error.message || "Erreur lors de la récupération des litiges");
        }
    }
);

export const createLitige = createAsyncThunk(
    'litiges/create',
    async ({ code_colis, motif, description }, { rejectWithValue }) => {
        try {
            const response = await api.post('/litiges', { code_colis, motif, description });
            if (response.data.success) {
                return response.data.data;
            }
            return rejectWithValue("Impossible d'ouvrir le litige");
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || error.message || "Erreur lors de l'ouverture du litige");
        }
    }
);

export const resolveLitige = createAsyncThunk(
    'litiges/resolve',
    async ({ litigeId, note_resolution }, { rejectWithValue }) => {
        try {
            const response = await api.put(`/litiges/${litigeId}/resolve`, { note_resolution });
            if (response.data.success) {
                return response.data.data;
            }
            return rejectWithValue("Impossible de résoudre le litige");
        } catch (error) {
            return rejectWithValue(error.message || "Erreur lors de la résolution du litige");
        }
    }
);

const litigeSlice = createSlice({
    name: 'litiges',
    initialState: {
        items: [],
        isLoading: false,
        isSending: false,
        error: null,
        hasLoaded: false,
    },
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchLitiges.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(fetchLitiges.fulfilled, (state, action) => {
                state.isLoading = false;
                state.items = action.payload;
                state.hasLoaded = true;
            })
            .addCase(fetchLitiges.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
            })
            .addCase(createLitige.pending, (state) => {
                state.isSending = true;
                state.error = null;
            })
            .addCase(createLitige.fulfilled, (state, action) => {
                state.isSending = false;
                state.items.unshift(action.payload);
            })
            .addCase(createLitige.rejected, (state, action) => {
                state.isSending = false;
                state.error = action.payload;
            })
            .addCase(resolveLitige.fulfilled, (state, action) => {
                const index = state.items.findIndex((l) => l.id === action.payload.id);
                if (index !== -1) {
                    state.items[index] = { ...state.items[index], ...action.payload };
                }
            });
    }
});

export default litigeSlice.reducer;
