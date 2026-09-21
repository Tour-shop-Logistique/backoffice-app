import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import parrainageService from '../../services/parrainageService';

const initialState = {
  taux: null,
  clients: [],
  retraits: [],
  isLoadingTaux: false,
  isLoadingClients: false,
  isLoadingRetraits: false,
  isSaving: false,
  isSavingRetrait: false,
  error: null,
  tauxHasLoaded: false,
  clientsHasLoaded: false,
};

export const fetchTauxParrainage = createAsyncThunk(
  'parrainage/fetchTauxParrainage',
  async (options = {}, { rejectWithValue }) => {
    try {
      return await parrainageService.getTaux();
    } catch (error) {
      console.error(error);
      return rejectWithValue(error.response?.data);
    }
  },
  {
    condition: (_, { getState }) => {
      const { parrainage } = getState();
      if (parrainage.isLoadingTaux) return false;
    },
  }
);

export const updateTauxParrainage = createAsyncThunk(
  'parrainage/updateTauxParrainage',
  async (tauxData, { rejectWithValue }) => {
    try {
      return await parrainageService.updateTaux(tauxData);
    } catch (error) {
      console.error(error);
      return rejectWithValue(error.response?.data);
    }
  }
);

export const fetchParrainageClients = createAsyncThunk(
  'parrainage/fetchParrainageClients',
  async (options = {}, { rejectWithValue }) => {
    try {
      return await parrainageService.getClients();
    } catch (error) {
      console.error(error);
      return rejectWithValue(error.response?.data);
    }
  },
  {
    condition: (_, { getState }) => {
      const { parrainage } = getState();
      if (parrainage.isLoadingClients) return false;
    },
  }
);

export const fetchRetraitsParrainage = createAsyncThunk(
  'parrainage/fetchRetraitsParrainage',
  async (parrainId, { rejectWithValue }) => {
    try {
      return await parrainageService.getRetraits(parrainId);
    } catch (error) {
      console.error(error);
      return rejectWithValue(error.response?.data);
    }
  }
);

export const createRetraitParrainage = createAsyncThunk(
  'parrainage/createRetraitParrainage',
  async (retraitData, { rejectWithValue }) => {
    try {
      return await parrainageService.createRetrait(retraitData);
    } catch (error) {
      console.error(error);
      return rejectWithValue(error.response?.data);
    }
  }
);

const parrainageSlice = createSlice({
  name: 'parrainage',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchTauxParrainage.pending, (state, action) => {
        if (!action.meta.arg?.silent) {
          state.isLoadingTaux = true;
        }
        state.error = null;
      })
      .addCase(fetchTauxParrainage.fulfilled, (state, action) => {
        state.isLoadingTaux = false;
        state.taux = action.payload;
        state.tauxHasLoaded = true;
      })
      .addCase(fetchTauxParrainage.rejected, (state, action) => {
        state.isLoadingTaux = false;
        state.error = action.payload;
      })

      .addCase(updateTauxParrainage.pending, (state) => {
        state.isSaving = true;
        state.error = null;
      })
      .addCase(updateTauxParrainage.fulfilled, (state, action) => {
        state.isSaving = false;
        const updated = action.payload?.taux || action.payload;
        if (updated) {
          state.taux = updated;
        }
      })
      .addCase(updateTauxParrainage.rejected, (state, action) => {
        state.isSaving = false;
        state.error = action.payload;
      })

      .addCase(fetchParrainageClients.pending, (state, action) => {
        if (!action.meta.arg?.silent) {
          state.isLoadingClients = true;
        }
        state.error = null;
      })
      .addCase(fetchParrainageClients.fulfilled, (state, action) => {
        state.isLoadingClients = false;
        state.clients = Array.isArray(action.payload) ? action.payload : (action.payload?.data || []);
        state.clientsHasLoaded = true;
      })
      .addCase(fetchParrainageClients.rejected, (state, action) => {
        state.isLoadingClients = false;
        state.error = action.payload;
      })

      .addCase(fetchRetraitsParrainage.pending, (state) => {
        state.isLoadingRetraits = true;
        state.error = null;
      })
      .addCase(fetchRetraitsParrainage.fulfilled, (state, action) => {
        state.isLoadingRetraits = false;
        state.retraits = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchRetraitsParrainage.rejected, (state, action) => {
        state.isLoadingRetraits = false;
        state.error = action.payload;
      })

      .addCase(createRetraitParrainage.pending, (state) => {
        state.isSavingRetrait = true;
        state.error = null;
      })
      .addCase(createRetraitParrainage.fulfilled, (state, action) => {
        state.isSavingRetrait = false;
        // Met à jour le solde du client concerné localement (évite un
        // rechargement complet de la liste des clients juste pour ça).
        const nouveauSolde = action.payload?.nouveau_solde;
        const parrainId = action.payload?.retrait?.parrain_id;
        if (parrainId && nouveauSolde !== undefined) {
          const client = state.clients.find((c) => c.id === parrainId);
          if (client) client.solde_parrainage = nouveauSolde;
        }
      })
      .addCase(createRetraitParrainage.rejected, (state, action) => {
        state.isSavingRetrait = false;
        state.error = action.payload;
      });
  },
});

export default parrainageSlice.reducer;
