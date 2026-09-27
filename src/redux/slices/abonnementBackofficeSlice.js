import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import abonnementBackofficeService from '../../services/abonnementBackofficeService';

const initialState = {
  settings: null,
  echeances: { data: [], pagination: null },
  isLoadingSettings: false,
  isLoadingEcheances: false,
  isSaving: false,
  isValidating: false,
  error: null,
  settingsHasLoaded: false,
  echeancesHasLoaded: false,
};

export const fetchAbonnementSettings = createAsyncThunk(
  'abonnementBackoffice/fetchSettings',
  async (_, { rejectWithValue }) => {
    try {
      return await abonnementBackofficeService.getSettings();
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const updateAbonnementSettings = createAsyncThunk(
  'abonnementBackoffice/updateSettings',
  async (settingsData, { rejectWithValue }) => {
    try {
      return await abonnementBackofficeService.updateSettings(settingsData);
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const fetchAbonnementEcheances = createAsyncThunk(
  'abonnementBackoffice/fetchEcheances',
  async (params = {}, { rejectWithValue }) => {
    try {
      return await abonnementBackofficeService.getEcheances(params);
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const validerPaiementAbonnement = createAsyncThunk(
  'abonnementBackoffice/validerPaiement',
  async (paiementId, { rejectWithValue }) => {
    try {
      const data = await abonnementBackofficeService.validerPaiement(paiementId);
      return { paiementId, paiement: data.paiement };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const rejeterPaiementAbonnement = createAsyncThunk(
  'abonnementBackoffice/rejeterPaiement',
  async ({ paiementId, commentaire }, { rejectWithValue }) => {
    try {
      const data = await abonnementBackofficeService.rejeterPaiement(paiementId, commentaire);
      return { paiementId, paiement: data.paiement };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

const abonnementBackofficeSlice = createSlice({
  name: 'abonnementBackoffice',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAbonnementSettings.pending, (state) => {
        state.isLoadingSettings = true;
        state.error = null;
      })
      .addCase(fetchAbonnementSettings.fulfilled, (state, action) => {
        state.isLoadingSettings = false;
        state.settings = action.payload;
        state.settingsHasLoaded = true;
      })
      .addCase(fetchAbonnementSettings.rejected, (state, action) => {
        state.isLoadingSettings = false;
        state.error = action.payload;
      })

      .addCase(updateAbonnementSettings.pending, (state) => {
        state.isSaving = true;
        state.error = null;
      })
      .addCase(updateAbonnementSettings.fulfilled, (state, action) => {
        state.isSaving = false;
        state.settings = action.payload;
      })
      .addCase(updateAbonnementSettings.rejected, (state, action) => {
        state.isSaving = false;
        state.error = action.payload;
      })

      .addCase(fetchAbonnementEcheances.pending, (state) => {
        state.isLoadingEcheances = true;
        state.error = null;
      })
      .addCase(fetchAbonnementEcheances.fulfilled, (state, action) => {
        state.isLoadingEcheances = false;
        state.echeances = { data: action.payload.data || [], pagination: action.payload };
        state.echeancesHasLoaded = true;
      })
      .addCase(fetchAbonnementEcheances.rejected, (state, action) => {
        state.isLoadingEcheances = false;
        state.error = action.payload;
      })

      .addCase(validerPaiementAbonnement.pending, (state) => {
        state.isValidating = true;
        state.error = null;
      })
      .addCase(validerPaiementAbonnement.fulfilled, (state, action) => {
        state.isValidating = false;
        const echeance = state.echeances.data.find((e) => e.paiement?.id === action.payload.paiementId);
        if (echeance) {
          echeance.paiement = action.payload.paiement;
          echeance.statut = 'payee';
        }
      })
      .addCase(validerPaiementAbonnement.rejected, (state, action) => {
        state.isValidating = false;
        state.error = action.payload;
      })

      .addCase(rejeterPaiementAbonnement.pending, (state) => {
        state.isValidating = true;
        state.error = null;
      })
      .addCase(rejeterPaiementAbonnement.fulfilled, (state, action) => {
        state.isValidating = false;
        const echeance = state.echeances.data.find((e) => e.paiement?.id === action.payload.paiementId);
        if (echeance) {
          echeance.paiement = action.payload.paiement;
        }
      })
      .addCase(rejeterPaiementAbonnement.rejected, (state, action) => {
        state.isValidating = false;
        state.error = action.payload;
      });
  },
});

export default abonnementBackofficeSlice.reducer;
