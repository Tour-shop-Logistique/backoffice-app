import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import livreurValidationService from '../../services/livreurValidationService';

const initialState = {
  livreursEnAttente: [],
  isLoadingEnAttente: false,
  enAttenteHasLoaded: false,
  retraits: [],
  isLoadingRetraits: false,
  retraitsHasLoaded: false,
  isSaving: false,
  error: null,
};

export const fetchLivreursEnAttente = createAsyncThunk(
  'livreurValidation/fetchEnAttente',
  async (_, { rejectWithValue }) => {
    try {
      return await livreurValidationService.getLivreursEnAttente();
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const validerLivreur = createAsyncThunk(
  'livreurValidation/valider',
  async (livreurId, { rejectWithValue }) => {
    try {
      await livreurValidationService.validerLivreur(livreurId);
      return livreurId;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const rejeterLivreur = createAsyncThunk(
  'livreurValidation/rejeter',
  async ({ livreurId, commentaire }, { rejectWithValue }) => {
    try {
      await livreurValidationService.rejeterLivreur(livreurId, commentaire);
      return livreurId;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const fetchRetraitsLivreur = createAsyncThunk(
  'livreurValidation/fetchRetraits',
  async (params = {}, { rejectWithValue }) => {
    try {
      return await livreurValidationService.getRetraitsLivreur(params);
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const confirmerRetraitLivreur = createAsyncThunk(
  'livreurValidation/confirmerRetrait',
  async (retraitId, { rejectWithValue }) => {
    try {
      const data = await livreurValidationService.confirmerRetraitLivreur(retraitId);
      return { retraitId, retrait: data.retrait };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const rejeterRetraitLivreur = createAsyncThunk(
  'livreurValidation/rejeterRetrait',
  async ({ retraitId, notes }, { rejectWithValue }) => {
    try {
      const data = await livreurValidationService.rejeterRetraitLivreur(retraitId, notes);
      return { retraitId, retrait: data.retrait };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

const livreurValidationSlice = createSlice({
  name: 'livreurValidation',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchLivreursEnAttente.pending, (state) => {
        state.isLoadingEnAttente = true;
        state.error = null;
      })
      .addCase(fetchLivreursEnAttente.fulfilled, (state, action) => {
        state.isLoadingEnAttente = false;
        state.livreursEnAttente = action.payload || [];
        state.enAttenteHasLoaded = true;
      })
      .addCase(fetchLivreursEnAttente.rejected, (state, action) => {
        state.isLoadingEnAttente = false;
        state.error = action.payload;
      })

      .addCase(validerLivreur.pending, (state) => {
        state.isSaving = true;
        state.error = null;
      })
      .addCase(validerLivreur.fulfilled, (state, action) => {
        state.isSaving = false;
        state.livreursEnAttente = state.livreursEnAttente.filter((l) => l.id !== action.payload);
      })
      .addCase(validerLivreur.rejected, (state, action) => {
        state.isSaving = false;
        state.error = action.payload;
      })

      .addCase(rejeterLivreur.pending, (state) => {
        state.isSaving = true;
        state.error = null;
      })
      .addCase(rejeterLivreur.fulfilled, (state, action) => {
        state.isSaving = false;
        state.livreursEnAttente = state.livreursEnAttente.filter((l) => l.id !== action.payload);
      })
      .addCase(rejeterLivreur.rejected, (state, action) => {
        state.isSaving = false;
        state.error = action.payload;
      })

      .addCase(fetchRetraitsLivreur.pending, (state) => {
        state.isLoadingRetraits = true;
        state.error = null;
      })
      .addCase(fetchRetraitsLivreur.fulfilled, (state, action) => {
        state.isLoadingRetraits = false;
        state.retraits = action.payload || [];
        state.retraitsHasLoaded = true;
      })
      .addCase(fetchRetraitsLivreur.rejected, (state, action) => {
        state.isLoadingRetraits = false;
        state.error = action.payload;
      })

      .addCase(confirmerRetraitLivreur.pending, (state) => {
        state.isSaving = true;
        state.error = null;
      })
      .addCase(confirmerRetraitLivreur.fulfilled, (state, action) => {
        state.isSaving = false;
        const idx = state.retraits.findIndex((r) => r.id === action.payload.retraitId);
        if (idx !== -1) state.retraits[idx] = action.payload.retrait;
      })
      .addCase(confirmerRetraitLivreur.rejected, (state, action) => {
        state.isSaving = false;
        state.error = action.payload;
      })

      .addCase(rejeterRetraitLivreur.pending, (state) => {
        state.isSaving = true;
        state.error = null;
      })
      .addCase(rejeterRetraitLivreur.fulfilled, (state, action) => {
        state.isSaving = false;
        const idx = state.retraits.findIndex((r) => r.id === action.payload.retraitId);
        if (idx !== -1) state.retraits[idx] = action.payload.retrait;
      })
      .addCase(rejeterRetraitLivreur.rejected, (state, action) => {
        state.isSaving = false;
        state.error = action.payload;
      });
  },
});

export default livreurValidationSlice.reducer;
