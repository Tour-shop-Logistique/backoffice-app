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

export const fetchAgenceById = createAsyncThunk(
    'agences/fetchById',
    async (agenceId, { rejectWithValue }) => {
        try {
            const data = await agenceService.getAgenceById(agenceId);
            if (data.success) {
                return data.agence;
            }
            return rejectWithValue("Impossible de charger l'agence");
        } catch (error) {
            return rejectWithValue(error.message || "Erreur lors de la récupération de l'agence");
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

export const fetchAgenceTarifsGroupage = createAsyncThunk(
    'agences/fetchTarifsGroupage',
    async (agenceId, { rejectWithValue }) => {
        try {
            const data = await agenceService.getAgenceTarifsGroupage(agenceId);
            if (data.success) {
                return data.tarifs;
            }
            return rejectWithValue("Impossible de charger les tarifs groupage");
        } catch (error) {
            return rejectWithValue(error.message || "Erreur lors de la récupération des tarifs groupage");
        }
    }
);

export const fetchAgenceTarifsSimple = createAsyncThunk(
    'agences/fetchTarifsSimple',
    async (agenceId, { rejectWithValue }) => {
        try {
            const data = await agenceService.getAgenceTarifsSimple(agenceId);
            if (data.success) {
                return data.tarifs;
            }
            return rejectWithValue("Impossible de charger les tarifs simple");
        } catch (error) {
            return rejectWithValue(error.message || "Erreur lors de la récupération des tarifs simple");
        }
    }
);

export const fetchAgenceExpeditions = createAsyncThunk(
    'agences/fetchExpeditions',
    async ({ agenceId, page = 1 }, { rejectWithValue }) => {
        try {
            const data = await agenceService.getAgenceExpeditions(agenceId, page);
            if (data.success) {
                return {
                    expeditions: data.data,
                    meta: data.meta
                };
            }
            return rejectWithValue("Impossible de charger les expéditions");
        } catch (error) {
            return rejectWithValue(error.message || "Erreur lors de la récupération des expéditions");
        }
    }
);

const agenceSlice = createSlice({
    name: 'agences',
    initialState: {
        agences: [],
        isLoading: false,
        isLoadingTarifs: false,
        error: null,
        hasLoaded: false,
        currentAgence: null,
        currentAgencyTarifsGroupage: [],
        currentAgencyTarifsSimple: [],
        currentAgencyExpeditions: [],
        expeditionsMeta: null,
        isLoadingExpeditions: false,
    },
    reducers: {
        resetAgences: (state) => {
            state.agences = [];
            state.hasLoaded = false;
        },
        clearCurrentAgency: (state) => {
            state.currentAgence = null;
            state.currentAgencyTarifsGroupage = [];
            state.currentAgencyTarifsSimple = [];
            state.currentAgencyExpeditions = [];
            state.expeditionsMeta = null;
        },
        clearCurrentAgencyTarifs: (state) => {
            state.currentAgencyTarifsGroupage = [];
            state.currentAgencyTarifsSimple = [];
        },
        setCurrentAgence: (state, action) => {
            state.currentAgence = action.payload;
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
            })
            // FETCH TARIFS GROUPAGE
            .addCase(fetchAgenceTarifsGroupage.pending, (state) => {
                state.isLoadingTarifs = true;
                state.error = null;
            })
            .addCase(fetchAgenceTarifsGroupage.fulfilled, (state, action) => {
                state.isLoadingTarifs = false;
                state.currentAgencyTarifsGroupage = action.payload;
            })
            .addCase(fetchAgenceTarifsGroupage.rejected, (state, action) => {
                state.isLoadingTarifs = false;
                state.error = action.payload;
            })
            // FETCH TARIFS SIMPLE
            .addCase(fetchAgenceTarifsSimple.pending, (state) => {
                state.isLoadingTarifs = true;
                state.error = null;
            })
            .addCase(fetchAgenceTarifsSimple.fulfilled, (state, action) => {
                state.isLoadingTarifs = false;
                state.currentAgencyTarifsSimple = action.payload;
            })
            .addCase(fetchAgenceTarifsSimple.rejected, (state, action) => {
                state.isLoadingTarifs = false;
                state.error = action.payload;
            })
            // FETCH AGENCE BY ID
            .addCase(fetchAgenceById.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(fetchAgenceById.fulfilled, (state, action) => {
                state.isLoading = false;
                state.currentAgence = action.payload;
            })
            .addCase(fetchAgenceById.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
            })
            // FETCH EXPEDITIONS
            .addCase(fetchAgenceExpeditions.pending, (state) => {
                state.isLoadingExpeditions = true;
                state.error = null;
            })
            .addCase(fetchAgenceExpeditions.fulfilled, (state, action) => {
                state.isLoadingExpeditions = false;
                state.currentAgencyExpeditions = action.payload.expeditions;
                state.expeditionsMeta = action.payload.meta;
            })
            .addCase(fetchAgenceExpeditions.rejected, (state, action) => {
                state.isLoadingExpeditions = false;
                state.error = action.payload;
            });
    }
});

export const { resetAgences, clearCurrentAgency, clearCurrentAgencyTarifs, setCurrentAgence } = agenceSlice.actions;
export default agenceSlice.reducer;
