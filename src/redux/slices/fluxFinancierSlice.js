import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import fluxFinancierService from '../../services/fluxFinancierService';

const initialState = {
  items: [],
  pagination: null,
  isLoading: false,
  isSaving: false,
  hasLoaded: false,
  error: null,
};

export const fetchFluxFinanciers = createAsyncThunk(
  'fluxFinancier/fetchFluxFinanciers',
  async (params = {}, { rejectWithValue }) => {
    try {
      return await fluxFinancierService.getFlux(params);
    } catch (error) {
      console.error(error);
      return rejectWithValue(error.response?.data);
    }
  },
  {
    condition: (_, { getState }) => {
      const { fluxFinancier } = getState();
      if (fluxFinancier.isLoading) return false;
    },
  }
);

export const marquerFluxPaye = createAsyncThunk(
  'fluxFinancier/marquerFluxPaye',
  async ({ id, ...payload }, { rejectWithValue }) => {
    try {
      return await fluxFinancierService.marquerPaye(id, payload);
    } catch (error) {
      console.error(error);
      return rejectWithValue(error.response?.data);
    }
  }
);

export const confirmerFluxRecu = createAsyncThunk(
  'fluxFinancier/confirmerFluxRecu',
  async (id, { rejectWithValue }) => {
    try {
      return await fluxFinancierService.confirmerReception(id);
    } catch (error) {
      console.error(error);
      return rejectWithValue(error.response?.data);
    }
  }
);

const fluxFinancierSlice = createSlice({
  name: 'fluxFinancier',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchFluxFinanciers.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchFluxFinanciers.fulfilled, (state, action) => {
        state.isLoading = false;
        state.hasLoaded = true;
        // L'API pagine : les lignes sont dans data, le reste décrit la page.
        state.items = action.payload?.data || [];
        state.pagination = action.payload || null;
      })
      .addCase(fetchFluxFinanciers.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(marquerFluxPaye.pending, (state) => {
        state.isSaving = true;
        state.error = null;
      })
      .addCase(marquerFluxPaye.fulfilled, (state, action) => {
        state.isSaving = false;
        const flux = action.payload?.flux;
        const idx = state.items.findIndex((f) => f.id === flux?.id);
        if (idx !== -1) state.items[idx] = { ...state.items[idx], ...flux };
      })
      .addCase(marquerFluxPaye.rejected, (state, action) => {
        state.isSaving = false;
        state.error = action.payload;
      })
      .addCase(confirmerFluxRecu.pending, (state) => {
        state.isSaving = true;
        state.error = null;
      })
      .addCase(confirmerFluxRecu.fulfilled, (state, action) => {
        state.isSaving = false;
        const flux = action.payload?.flux;
        const idx = state.items.findIndex((f) => f.id === flux?.id);
        if (idx !== -1) state.items[idx] = { ...state.items[idx], ...flux };
      })
      .addCase(confirmerFluxRecu.rejected, (state, action) => {
        state.isSaving = false;
        state.error = action.payload;
      });
  },
});

export default fluxFinancierSlice.reducer;
