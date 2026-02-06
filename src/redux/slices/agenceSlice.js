import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import agenceService from '../../services/agenceService';

export const fetchAgences = createAsyncThunk(
    'agences/fetchAgences',
    async (_, { rejectWithValue }) => {
        try {
            const data = await agenceService.getAgences();
            if (data.success) {
                return data.agences;
            }
            return rejectWithValue("Impossible de charger les agences");
        } catch (error) {
            return rejectWithValue(error.message || "Erreur lors de la récupération des agences");
        }
    }
);

export const toggleAgenceStatus = createAsyncThunk(
    'agences/toggleStatus',
    async ({ agenceId, status }, { rejectWithValue }) => {
        try {
            const data = await agenceService.updateAgenceStatus(agenceId, status);
            if (data.success) {
                return { agenceId, status };
            }
            return rejectWithValue("Erreur lors de la mise à jour du statut");
        } catch (error) {
            return rejectWithValue(error.message || "Erreur lors de la mise à jour du statut");
        }
    }
);

const agenceSlice = createSlice({
    name: 'agences',
    initialState: {
        agences: [],
        isLoading: false,
        error: null,
        hasLoaded: false,
    },
    reducers: {
        resetAgences: (state) => {
            state.agences = [];
            state.hasLoaded = false;
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchAgences.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(fetchAgences.fulfilled, (state, action) => {
                state.isLoading = false;
                state.agences = action.payload.map(agence => ({
                    ...agence,
                    actif: agence.actif === true || agence.actif === 1 || agence.actif === "1"
                }));
                state.hasLoaded = true;
            })
            .addCase(fetchAgences.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
            })
            // Toggle Status (Optimistic Update)
            .addCase(toggleAgenceStatus.pending, (state, action) => {
                const { agenceId, status } = action.meta.arg;
                const index = state.agences.findIndex(a => String(a.id) === String(agenceId));
                if (index !== -1) {
                    // Optimistic update: toggle the status immediately
                    state.agences[index].actif = status === 1 || status === true || status === "1";
                }
                state.error = null;
            })
            .addCase(toggleAgenceStatus.fulfilled, (state, action) => {
                // Already updated in pending, but we ensure consistency if API returns different data
                const { agenceId, status } = action.payload;
                const index = state.agences.findIndex(a => String(a.id) === String(agenceId));
                if (index !== -1) {
                    state.agences[index].actif = status === 1 || status === true || status === "1";
                }
            })
            .addCase(toggleAgenceStatus.rejected, (state, action) => {
                const { agenceId, status } = action.meta.arg;
                const index = state.agences.findIndex(a => String(a.id) === String(agenceId));
                if (index !== -1) {
                    // Revert on failure: set back to what it was before (opposite of what we tried to set)
                    state.agences[index].actif = !(status === 1 || status === true || status === "1");
                }
                state.error = action.payload;
            });
    }
});

export const { resetAgences } = agenceSlice.actions;
export default agenceSlice.reducer;
