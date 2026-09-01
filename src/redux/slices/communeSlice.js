import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import communeService from '../../services/communeService';

const initialState = {
  communes: [],
  isLoading: false,
  error: null,
  hasLoaded: false,
};

export const fetchCommunes = createAsyncThunk(
  'communes/fetchCommunes',
  async (_, { rejectWithValue }) => {
    try {
      const communes = await communeService.getCommunes();
      return communes;
    } catch (error) {
      console.error(error);
      return rejectWithValue(error.response.data);
    }
  },
  {
    condition: (_, { getState }) => {
      const { communes } = getState();
      if (communes.isLoading) return false;
    },
  }
);

export const addCommune = createAsyncThunk('communes/addCommune', async (communeData, { rejectWithValue }) => {
  try {
    const newCommune = await communeService.addCommune(communeData);
    return newCommune;
  } catch (error) {
    console.error(error);
    return rejectWithValue(error.response.data);
  }
});

export const editCommune = createAsyncThunk('communes/editCommune', async ({ communeId, communeData }, { rejectWithValue }) => {
  try {
    const updatedCommune = await communeService.editCommune(communeId, communeData);
    return updatedCommune;
  } catch (error) {
    console.error(error);
    return rejectWithValue(error.response.data);
  }
});

export const deleteCommune = createAsyncThunk('communes/deleteCommune', async (communeId, { rejectWithValue }) => {
  try {
    await communeService.deleteCommune(communeId);
    return communeId;
  } catch (error) {
    console.error(error);
    return rejectWithValue(error.response.data);
  }
});

export const updateCommuneStatus = createAsyncThunk('communes/updateCommuneStatus', async (communeId, { rejectWithValue }) => {
  try {
    const updatedCommune = await communeService.updateCommuneStatus(communeId);
    return { communeId, ...updatedCommune };
  } catch (error) {
    console.error(error);
    return rejectWithValue(error.response?.data || error.message);
  }
});

const communeSlice = createSlice({
  name: 'communes',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCommunes.pending, (state, action) => {
        if (!action.meta.arg?.silent) {
          state.isLoading = true;
        }
        state.error = null;
      })
      .addCase(fetchCommunes.fulfilled, (state, action) => {
        state.isLoading = false;
        const data = Array.isArray(action.payload) ? action.payload : (action.payload?.data || []);
        state.communes = data;
        state.hasLoaded = true;
      })
      .addCase(fetchCommunes.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(addCommune.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(addCommune.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(addCommune.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(editCommune.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(editCommune.fulfilled, (state, action) => {
        state.isLoading = false;
        const updatedCommune = action.payload?.data || action.payload;
        const { communeId, communeData } = action.meta.arg;

        state.communes = state.communes.map((commune) =>
          commune.id === communeId
            ? { ...commune, ...communeData, ...(updatedCommune && updatedCommune.id ? updatedCommune : {}) }
            : commune
        );
      })
      .addCase(editCommune.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(deleteCommune.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteCommune.fulfilled, (state, action) => {
        state.isLoading = false;
        state.communes = state.communes.filter((commune) => commune.id !== action.payload);
      })
      .addCase(deleteCommune.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(updateCommuneStatus.pending, (state, action) => {
        const communeId = action.meta.arg;
        const index = state.communes.findIndex(c => c.id === communeId);
        if (index !== -1) {
          state.communes[index].actif = !state.communes[index].actif;
        }
      })
      .addCase(updateCommuneStatus.rejected, (state, action) => {
        const communeId = action.meta.arg;
        const index = state.communes.findIndex(c => c.id === communeId);
        if (index !== -1) {
          state.communes[index].actif = !state.communes[index].actif;
        }
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(updateCommuneStatus.fulfilled, (state, action) => {
        state.isLoading = false;
        const updatedCommune = action.payload?.commune || action.payload;
        const id = action.meta.arg;

        if (updatedCommune && updatedCommune.id) {
          state.communes = state.communes.map((commune) =>
            commune.id === id ? updatedCommune : commune
          );
        }
      });
  },
});

export default communeSlice.reducer;
