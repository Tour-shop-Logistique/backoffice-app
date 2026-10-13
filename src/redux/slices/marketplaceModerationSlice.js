import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import marketplaceModerationService from '../../services/marketplaceModerationService';

const initialState = {
  annonces: { data: [], pagination: null },
  commandes: { data: [], pagination: null },
  selectedAnnonce: null,
  isLoadingAnnonces: false,
  isLoadingCommandes: false,
  isLoadingAnnonce: false,
  isSaving: false,
  error: null,
  annoncesHasLoaded: false,
  commandesHasLoaded: false,
};

export const fetchMarketplaceAnnonces = createAsyncThunk(
  'marketplaceModeration/fetchAnnonces',
  async (params = {}, { rejectWithValue }) => {
    try {
      return await marketplaceModerationService.getAnnonces(params);
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const fetchMarketplaceAnnonce = createAsyncThunk(
  'marketplaceModeration/fetchAnnonce',
  async (id, { rejectWithValue }) => {
    try {
      return await marketplaceModerationService.getAnnonce(id);
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const masquerAnnonceMarketplace = createAsyncThunk(
  'marketplaceModeration/masquerAnnonce',
  async (id, { rejectWithValue }) => {
    try {
      const data = await marketplaceModerationService.masquerAnnonce(id);
      return { id, annonce: data.annonce };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const fetchMarketplaceCommandes = createAsyncThunk(
  'marketplaceModeration/fetchCommandes',
  async (params = {}, { rejectWithValue }) => {
    try {
      return await marketplaceModerationService.getCommandes(params);
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

const marketplaceModerationSlice = createSlice({
  name: 'marketplaceModeration',
  initialState,
  reducers: {
    clearSelectedAnnonce: (state) => {
      state.selectedAnnonce = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMarketplaceAnnonce.pending, (state) => {
        state.isLoadingAnnonce = true;
      })
      .addCase(fetchMarketplaceAnnonce.fulfilled, (state, action) => {
        state.isLoadingAnnonce = false;
        state.selectedAnnonce = action.payload;
      })
      .addCase(fetchMarketplaceAnnonce.rejected, (state, action) => {
        state.isLoadingAnnonce = false;
        state.error = action.payload;
      })

      .addCase(fetchMarketplaceAnnonces.pending, (state) => {
        state.isLoadingAnnonces = true;
        state.error = null;
      })
      .addCase(fetchMarketplaceAnnonces.fulfilled, (state, action) => {
        state.isLoadingAnnonces = false;
        state.annonces = { data: action.payload.data || [], pagination: action.payload };
        state.annoncesHasLoaded = true;
      })
      .addCase(fetchMarketplaceAnnonces.rejected, (state, action) => {
        state.isLoadingAnnonces = false;
        state.error = action.payload;
      })

      .addCase(masquerAnnonceMarketplace.pending, (state) => {
        state.isSaving = true;
        state.error = null;
      })
      .addCase(masquerAnnonceMarketplace.fulfilled, (state, action) => {
        state.isSaving = false;
        const idx = state.annonces.data.findIndex((a) => a.id === action.payload.id);
        if (idx !== -1) state.annonces.data[idx] = action.payload.annonce;
      })
      .addCase(masquerAnnonceMarketplace.rejected, (state, action) => {
        state.isSaving = false;
        state.error = action.payload;
      })

      .addCase(fetchMarketplaceCommandes.pending, (state) => {
        state.isLoadingCommandes = true;
        state.error = null;
      })
      .addCase(fetchMarketplaceCommandes.fulfilled, (state, action) => {
        state.isLoadingCommandes = false;
        state.commandes = { data: action.payload.data || [], pagination: action.payload };
        state.commandesHasLoaded = true;
      })
      .addCase(fetchMarketplaceCommandes.rejected, (state, action) => {
        state.isLoadingCommandes = false;
        state.error = action.payload;
      });
  },
});

export const { clearSelectedAnnonce } = marketplaceModerationSlice.actions;

export default marketplaceModerationSlice.reducer;
