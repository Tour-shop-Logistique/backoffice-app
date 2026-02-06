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
  async (arg, { rejectWithValue }) => {
    try {
      const id = typeof arg === 'object' ? arg.tarifId : arg;
      return await tarificationService.updateGroupedTarifStatus(id);
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
        state.tarifs = data.map(t => ({
          ...t,
          actif: t.actif === true || t.actif === 1 || t.actif === "1"
        }));
        state.hasLoaded = true;
      })
      .addCase(fetchTarifs.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      .addCase(addSimpleTarif.fulfilled, (state, action) => {
        const newTarif = action.payload?.data || action.payload;
        if (newTarif) {
          state.tarifs.unshift({
            ...action.meta.arg,
            ...newTarif,
            actif: newTarif.actif !== undefined ? newTarif.actif : true
          });
        }
      })

      .addCase(editSimpleTarif.fulfilled, (state, action) => {
        const updated = action.payload?.data || action.payload;
        const { tarifId, tarifData } = action.meta.arg;

        state.tarifs = state.tarifs.map((t) =>
          t.id === tarifId
            ? { ...t, ...tarifData, ...(updated && updated.id ? updated : {}) }
            : t
        );
      })

      .addCase(deleteTarif.fulfilled, (state, action) => {
        state.tarifs = state.tarifs.filter((t) => t.id !== action.payload);
      })

      .addCase(updateTarifStatus.pending, (state, action) => {
        const tarifId = action.meta.arg;
        const index = state.tarifs.findIndex(t => t.id === tarifId);
        if (index !== -1) {
          state.tarifs[index].actif = !state.tarifs[index].actif;
        }
      })
      .addCase(updateTarifStatus.rejected, (state, action) => {
        const tarifId = action.meta.arg;
        const index = state.tarifs.findIndex(t => t.id === tarifId);
        if (index !== -1) {
          state.tarifs[index].actif = !state.tarifs[index].actif;
        }
      })
      .addCase(updateTarifStatus.fulfilled, (state, action) => {
        const updated = action.payload?.data || action.payload;
        if (updated) {
          state.tarifs = state.tarifs.map((t) =>
            t.id === updated.id ? updated : t
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
        state.groupedTarifs = data.map(t => ({
          ...t,
          actif: t.actif === true || t.actif === 1 || t.actif === "1"
        }));
        state.groupedHasLoaded = true;
      })
      .addCase(fetchGroupedTarifs.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      .addCase(addGroupedTarif.fulfilled, (state, action) => {
        const newTarif = action.payload?.data || action.payload;
        if (newTarif) {
          state.groupedTarifs.unshift({
            ...action.meta.arg,
            ...newTarif,
            actif: newTarif.actif !== undefined ? newTarif.actif : true
          });
        }
      })

      .addCase(editGroupedTarif.fulfilled, (state, action) => {
        const updated = action.payload?.data || action.payload;
        const { tarifId, tarifData } = action.meta.arg;

        state.groupedTarifs = state.groupedTarifs.map((t) =>
          t.id === tarifId
            ? { ...t, ...tarifData, ...(updated && updated.id ? updated : {}) }
            : t
        );
      })

      .addCase(deleteGroupedTarif.fulfilled, (state, action) => {
        state.groupedTarifs = state.groupedTarifs.filter(
          (t) => t.id !== action.payload
        );
      })

      .addCase(updateGroupedTarifStatus.pending, (state, action) => {
        // Support both direct ID or object with tarifId
        const tarifId = typeof action.meta.arg === 'object' ? action.meta.arg.tarifId : action.meta.arg;
        const index = state.groupedTarifs.findIndex(t => t.id === tarifId);
        if (index !== -1) {
          state.groupedTarifs[index].actif = !state.groupedTarifs[index].actif;
        }
      })
      .addCase(updateGroupedTarifStatus.rejected, (state, action) => {
        const tarifId = typeof action.meta.arg === 'object' ? action.meta.arg.tarifId : action.meta.arg;
        const index = state.groupedTarifs.findIndex(t => t.id === tarifId);
        if (index !== -1) {
          state.groupedTarifs[index].actif = !state.groupedTarifs[index].actif;
        }
      })
      .addCase(updateGroupedTarifStatus.fulfilled, (state, action) => {
        const updated = action.payload?.data || action.payload;
        const tarifId = typeof action.meta.arg === 'object' ? action.meta.arg.tarifId : action.meta.arg;

        if (updated && updated.id) {
          state.groupedTarifs = state.groupedTarifs.map((t) =>
            t.id === updated.id ? updated : t
          );
        } else {
          // If API doesn't return the full object, the pending state already toggled 'actif'
          // We just leave it as is or refresh if necessary.
        }
      });
  },
});

export default tarificationSlice.reducer;
