import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

export const fetchBackofficeConfig = createAsyncThunk(
  'backoffice/fetchConfig',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/backoffice/show');
      console.log(" response ‼️‼️‼️", response.data);
      return response.data.backoffice;
    } catch (error) {
      if (error.response && error.response.status === 404) {
        return rejectWithValue('not_configured');
      }
      return rejectWithValue(error.message);
    }
  }
);

const backofficeSlice = createSlice({
  name: 'backoffice',
  initialState: {
    config: null,
    isConfigured: true,
    loading: 'idle',
    backoffice_id: null,
    pays: null,
    error: null,
  },
  reducers: {
    setConfigured: (state, action) => {
        state.isConfigured = action.payload;
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
        state.isConfigured = true;
        state.backoffice_id = action.payload.id;
        state.pays = action.payload.pays;
        console.log(state.pays,"state.pays");
      })
      .addCase(fetchBackofficeConfig.rejected, (state, action) => {
        state.loading = 'failed';
        if (action.payload === 'not_configured') {
          state.isConfigured = false;
          state.error = null;
        } else {
          state.error = action.error.message;
        }
      });
  },
});

export const { setConfigured } = backofficeSlice.actions;

export default backofficeSlice.reducer;
