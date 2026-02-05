import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import tarificationService from '../../services/tarificationService';

const initialState = {
  tarifs: [],
  groupedTarifs: [],
  isLoading: false,
  error: null,
  hasLoaded: false,
  groupedHasLoaded: false,
};

/*--------------------------- SIMPLE TARIFS ---------------------------*/

export const fetchTarifs = createAsyncThunk(
  'tarification/fetchTarifs',
  async (options = {}, { rejectWithValue }) => {
    try {
      return await tarificationService.getTarifs();
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const addSimpleTarif = createAsyncThunk(
  'tarification/addSimpleTarif',
  async (tarifData, { rejectWithValue }) => {
    try {
      return await tarificationService.addSimpleTarif(tarifData);
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const editSimpleTarif = createAsyncThunk(
  'tarification/editSimpleTarif',
  async ({ tarifId, tarifData }, { rejectWithValue }) => {
    try {
      return await tarificationService.editSimpleTarif(tarifId, tarifData);
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const deleteTarif = createAsyncThunk(
  'tarification/deleteTarif',
  async (tarifId, { rejectWithValue }) => {
    try {
      await tarificationService.deleteTarif(tarifId);
      return tarifId;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const updateTarifStatus = createAsyncThunk(
  'tarification/updateTarifStatus',
  async (tarifId, { rejectWithValue }) => {
    try {
      return await tarificationService.updateTarifStatus(tarifId);
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

/*--------------------------- GROUPED TARIFS ---------------------------*/

export const fetchGroupedTarifs = createAsyncThunk(
  'tarification/fetchGroupedTarifs',
  async (options = {}, { rejectWithValue }) => {
    try {
      return await tarificationService.getGroupedTarifs();
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const addGroupedTarif = createAsyncThunk(
  'tarification/addGroupedTarif',
  async (tarifData, { rejectWithValue }) => {
    try {
      return await tarificationService.addGroupedTarif(tarifData);
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const editGroupedTarif = createAsyncThunk(
  'tarification/editGroupedTarif',
  async ({ tarifId, tarifData }, { rejectWithValue }) => {
    try {
      return await tarificationService.editGroupedTarif(tarifId, tarifData);
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const deleteGroupedTarif = createAsyncThunk(
  'tarification/deleteGroupedTarif',
  async (tarifId, { rejectWithValue }) => {
    try {
      await tarificationService.deleteGroupedTarif(tarifId);
      return tarifId;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const updateGroupedTarifStatus = createAsyncThunk(
  'tarification/updateGroupedTarifStatus',
  async (tarifId, { rejectWithValue }) => {
    try {
      return await tarificationService.updateGroupedTarifStatus(tarifId);
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

/*--------------------------- SLICE ---------------------------*/

const tarificationSlice = createSlice({
  name: 'tarification',
  initialState,
  reducers: {},
  extraReducers: (builder) => {

    /*---------------- SIMPLE ----------------*/
    builder
      .addCase(fetchTarifs.pending, (state, action) => {
        if (!action.meta.arg?.silent) {
          state.isLoading = true;
        }
        state.error = null;
      })
      .addCase(fetchTarifs.fulfilled, (state, action) => {
        state.isLoading = false;
        const data = Array.isArray(action.payload) ? action.payload : (action.payload?.data || []);
        state.tarifs = data;
        state.hasLoaded = true;
      })
      .addCase(fetchTarifs.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      .addCase(addSimpleTarif.fulfilled, (state, action) => {
        if (action.payload) {
          state.tarifs.push(action.payload);
        }
      })

      .addCase(editSimpleTarif.fulfilled, (state, action) => {
        if (action.payload) {
          state.tarifs = state.tarifs.map((t) =>
            t.id === action.payload.id ? action.payload : t
          );
        }
      })

      .addCase(deleteTarif.fulfilled, (state, action) => {
        state.tarifs = state.tarifs.filter((t) => t.id !== action.payload);
      })

      .addCase(updateTarifStatus.fulfilled, (state, action) => {
        if (action.payload) {
          state.tarifs = state.tarifs.map((t) =>
            t.id === action.payload.id ? action.payload : t
          );
        }
      });

    /*---------------- GROUPED ----------------*/
    builder
      .addCase(fetchGroupedTarifs.pending, (state, action) => {
        if (!action.meta.arg?.silent) {
          state.isLoading = true;
        }
        state.error = null;
      })
      .addCase(fetchGroupedTarifs.fulfilled, (state, action) => {
        state.isLoading = false;
        const data = Array.isArray(action.payload) ? action.payload : (action.payload?.data || []);
        state.groupedTarifs = data;
        state.groupedHasLoaded = true;
      })
      .addCase(fetchGroupedTarifs.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      .addCase(addGroupedTarif.fulfilled, (state, action) => {
        state.groupedTarifs.push(action.payload);
      })

      .addCase(editGroupedTarif.fulfilled, (state, action) => {
        state.groupedTarifs = state.groupedTarifs.map((t) =>
          t.id === action.payload.id ? action.payload : t
        );
      })

      .addCase(deleteGroupedTarif.fulfilled, (state, action) => {
        state.groupedTarifs = state.groupedTarifs.filter(
          (t) => t.id !== action.payload
        );
      })

      .addCase(updateGroupedTarifStatus.fulfilled, (state, action) => {
        state.groupedTarifs = state.groupedTarifs.map((t) =>
          t.id === action.payload.id ? action.payload : t
        );
      });
  },
});

export default tarificationSlice.reducer;
