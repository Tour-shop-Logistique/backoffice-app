import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import missionGroupageService from '../../services/missionGroupageService';

const initialState = {
  missions: [],
  livreursDisponibles: [],
  isLoading: false,
  isLoadingLivreurs: false,
  error: null,
  hasLoaded: false,
};

export const fetchMissionsEnAttente = createAsyncThunk(
  'missionGroupage/fetchMissionsEnAttente',
  async (_, { rejectWithValue }) => {
    try {
      return await missionGroupageService.getMissionsEnAttente();
    } catch (error) {
      console.error(error);
      return rejectWithValue(error.response?.data);
    }
  },
  {
    condition: (_, { getState }) => {
      const { missionGroupage } = getState();
      if (missionGroupage.isLoading) return false;
    },
  }
);

export const fetchLivreursDisponibles = createAsyncThunk(
  'missionGroupage/fetchLivreursDisponibles',
  async (_, { rejectWithValue }) => {
    try {
      return await missionGroupageService.getLivreursDisponibles();
    } catch (error) {
      console.error(error);
      return rejectWithValue(error.response?.data);
    }
  }
);

export const assignerMission = createAsyncThunk(
  'missionGroupage/assignerMission',
  async ({ missionId, payload }, { rejectWithValue }) => {
    try {
      const data = await missionGroupageService.assignerMission(missionId, payload);
      return { missionId, ...data };
    } catch (error) {
      console.error(error);
      return rejectWithValue(error.response?.data);
    }
  }
);

const missionGroupageSlice = createSlice({
  name: 'missionGroupage',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchMissionsEnAttente.pending, (state, action) => {
        if (!action.meta.arg?.silent) {
          state.isLoading = true;
        }
        state.error = null;
      })
      .addCase(fetchMissionsEnAttente.fulfilled, (state, action) => {
        state.isLoading = false;
        state.missions = Array.isArray(action.payload) ? action.payload : (action.payload?.data || []);
        state.hasLoaded = true;
      })
      .addCase(fetchMissionsEnAttente.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(fetchLivreursDisponibles.pending, (state) => {
        state.isLoadingLivreurs = true;
      })
      .addCase(fetchLivreursDisponibles.fulfilled, (state, action) => {
        state.isLoadingLivreurs = false;
        state.livreursDisponibles = Array.isArray(action.payload) ? action.payload : (action.payload?.data || []);
      })
      .addCase(fetchLivreursDisponibles.rejected, (state, action) => {
        state.isLoadingLivreurs = false;
        state.error = action.payload;
      })
      .addCase(assignerMission.fulfilled, (state, action) => {
        // La mission assignée quitte la liste des missions en attente.
        state.missions = state.missions.filter((m) => m.id !== action.meta.arg.missionId);
      })
      .addCase(assignerMission.rejected, (state, action) => {
        state.error = action.payload;
      });
  },
});

export default missionGroupageSlice.reducer;
