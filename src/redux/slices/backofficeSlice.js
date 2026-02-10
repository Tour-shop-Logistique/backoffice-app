import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

// Clés localStorage
const BACKOFFICE_CACHE_KEY = 'backoffice_config';

// Helpers pour le cache localStorage
const saveBackofficeToCache = (data) => {
  try {
    localStorage.setItem(BACKOFFICE_CACHE_KEY, JSON.stringify({
      data,
      timestamp: Date.now()
    }));
  } catch (error) {
    console.error('Erreur lors de la sauvegarde du cache backoffice:', error);
  }
};

const loadBackofficeFromCache = () => {
  try {
    const cached = localStorage.getItem(BACKOFFICE_CACHE_KEY);
    if (cached) {
      const { data, timestamp } = JSON.parse(cached);
      // Cache valide pendant 24h
      const isValid = (Date.now() - timestamp) < 24 * 60 * 60 * 1000;
      if (isValid) {
        return data;
      }
    }
  } catch (error) {
    console.error('Erreur lors du chargement du cache backoffice:', error);
  }
  return null;
};

const clearBackofficeCache = () => {
  try {
    localStorage.removeItem(BACKOFFICE_CACHE_KEY);
  } catch (error) {
    console.error('Erreur lors de la suppression du cache backoffice:', error);
  }
};

export const fetchBackofficeConfig = createAsyncThunk(
  'backoffice/fetchConfig',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/backoffice/show');
      return response.data.backoffice;
    } catch (error) {
      console.error(error);
      if (error.response && error.response.status === 404) {
        return rejectWithValue('not_configured');
      }
      return rejectWithValue(error.message);
    }
  }
);

// Charger le cache au démarrage
const cachedConfig = loadBackofficeFromCache();

const backofficeSlice = createSlice({
  name: 'backoffice',
  initialState: {
    config: cachedConfig,
    isConfigured: !!cachedConfig,
    loading: 'idle',
    backoffice_id: cachedConfig?.id || null,
    pays: cachedConfig?.pays || null,
    error: null,
  },
  reducers: {
    setConfigured: (state, action) => {
      state.isConfigured = action.payload;
    },
    resetBackoffice: (state) => {
      state.config = null;
      state.isConfigured = true;
      state.loading = 'idle';
      state.backoffice_id = null;
      state.pays = null;
      state.error = null;
      clearBackofficeCache();
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchBackofficeConfig.pending, (state) => {
        state.loading = 'pending';
      })
      .addCase(fetchBackofficeConfig.fulfilled, (state, action) => {
        state.loading = 'succeeded';
        state.config = action.payload;
        state.isConfigured = !!action.payload;
        if (action.payload) {
          state.backoffice_id = action.payload.id;
          state.pays = action.payload.pays;
          console.log(state.pays, "state.pays");
          // Sauvegarder dans le cache
          saveBackofficeToCache(action.payload);
        }
      })
      .addCase(fetchBackofficeConfig.rejected, (state, action) => {
        state.loading = 'failed';
        state.isConfigured = false;
        state.config = null;
        if (action.payload === 'not_configured') {
          state.error = null;
        } else {
          state.error = action.payload || action.error.message;
        }
      });
  },
});

export const { setConfigured, resetBackoffice } = backofficeSlice.actions;

export default backofficeSlice.reducer;

