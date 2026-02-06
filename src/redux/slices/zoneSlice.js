import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import zoneService from '../../services/zoneService';

const initialState = {
  zones: [],
  isLoading: false,
  error: null,
  hasLoaded: false,
};

// Thunk pour récupérer les zones
export const fetchZones = createAsyncThunk('zones/fetchZones', async (_, { rejectWithValue }) => {
  try {
    const zones = await zoneService.getZones();
    return zones;
  } catch (error) {
    return rejectWithValue(error.response.data);
  }
});

// Thunk pour ajouter une zone
export const addZone = createAsyncThunk('zones/addZone', async (zoneData, { rejectWithValue }) => {
  try {
    const newZone = await zoneService.addZone(zoneData);
    return newZone;
  } catch (error) {
    return rejectWithValue(error.response.data);
  }
});

export const editZone = createAsyncThunk('zones/editZone', async ({ zoneId, zoneData }, { rejectWithValue }) => {
  try {
    const updatedZone = await zoneService.editZone(zoneId, zoneData);
    return updatedZone;
  } catch (error) {
    return rejectWithValue(error.response.data);
  }
});

export const deleteZone = createAsyncThunk('zones/deleteZone', async (zoneId, { rejectWithValue }) => {
  try {
    await zoneService.deleteZone(zoneId);
    return zoneId;
  } catch (error) {
    return rejectWithValue(error.response.data);
  }
});

export const updateZoneStatus = createAsyncThunk('zones/updateZoneStatus', async ({ zoneId, status }, { rejectWithValue }) => {
  try {
    const updatedZone = await zoneService.updateZoneStatus(zoneId, status);
    return { zoneId, ...updatedZone };
  } catch (error) {
    return rejectWithValue(error.response?.data || error.message);
  }
});

const zoneSlice = createSlice({
  name: 'zones',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Fetch zones
      .addCase(fetchZones.pending, (state, action) => {
        if (!action.meta.arg?.silent) {
          state.isLoading = true;
        }
        state.error = null;
      })
      .addCase(fetchZones.fulfilled, (state, action) => {
        state.isLoading = false;
        const data = Array.isArray(action.payload) ? action.payload : (action.payload?.data || []);
        state.zones = data;
        state.hasLoaded = true;
      })
      .addCase(fetchZones.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Add zone
      .addCase(addZone.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(addZone.fulfilled, (state, action) => {
        state.isLoading = false;
        const newZone = action.payload?.data || action.payload;
        if (newZone) {
          // Ensure pays exists and actif is true by default
          // Merge with form data (meta.arg) to ensure all display fields are present
          const zoneToAdd = {
            pays: [],
            actif: true,
            ...action.meta.arg,
            ...newZone
          };
          state.zones.unshift(zoneToAdd);
        }
      })
      .addCase(addZone.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Edit zone
      .addCase(editZone.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(editZone.fulfilled, (state, action) => {
        state.isLoading = false;
        const updatedZone = action.payload?.data || action.payload;
        const { zoneId, zoneData } = action.meta.arg;

        state.zones = state.zones.map((zone) =>
          zone.id === zoneId
            ? { ...zone, ...zoneData, ...(updatedZone && updatedZone.id ? updatedZone : {}) }
            : zone
        );
      })
      .addCase(editZone.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Delete zone
      .addCase(deleteZone.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteZone.fulfilled, (state, action) => {
        state.isLoading = false;
        state.zones = state.zones.filter((zone) => zone.id !== action.payload);
      })
      .addCase(deleteZone.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Update zone status
      .addCase(updateZoneStatus.pending, (state, action) => {
        const { zoneId } = action.meta.arg;
        const index = state.zones.findIndex(z => z.id === zoneId);
        if (index !== -1) {
          state.zones[index].actif = !state.zones[index].actif;
        }
      })
      .addCase(updateZoneStatus.rejected, (state, action) => {
        const { zoneId } = action.meta.arg;
        const index = state.zones.findIndex(z => z.id === zoneId);
        if (index !== -1) {
          state.zones[index].actif = !state.zones[index].actif;
        }
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(updateZoneStatus.fulfilled, (state, action) => {
        state.isLoading = false;
        const updatedZone = action.payload?.data || action.payload;
        const { zoneId } = action.meta.arg;

        if (updatedZone && updatedZone.id) {
          state.zones = state.zones.map((zone) =>
            zone.id === zoneId ? updatedZone : zone
          );
        } else {
          // Logic already toggled in pending
        }
      });
  },
});

export default zoneSlice.reducer;
