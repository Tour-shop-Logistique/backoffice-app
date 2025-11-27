import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import tarificationService from '../../services/tarificationService';

const initialState = {
  tarifs: [],
  isLoading: false,
  error: null,
};


export const fetchTarifs = createAsyncThunk('tarification/fetchTarifs', async ({ rejectWithValue }) => {
  try {
    const tarifs = await tarificationService.getTarifs();
    console.log(tarifs);
    return tarifs;
  } catch (error) {
    return rejectWithValue(error.response.data);
  }
});

export const addSimpleTarif = createAsyncThunk('tarification/addSimpleTarif', async (tarifData, { rejectWithValue }) => {
  try {
    const newTarif = await tarificationService.addSimpleTarif(tarifData);
    return newTarif;
  } catch (error) {
    return rejectWithValue(error.response.data);
  }
});

export const editSimpleTarif = createAsyncThunk('tarification/editSimpleTarif', async ({ tarifId, tarifData }, { rejectWithValue }) => {
  try {
    const updatedTarif = await tarificationService.editSimpleTarif(tarifId, tarifData);
    return updatedTarif;
  } catch (error) {
    return rejectWithValue(error.response.data);
  }
});

export const deleteTarif = createAsyncThunk('tarification/deleteTarif', async (tarifId, { rejectWithValue }) => {
  try {
    await tarificationService.deleteTarif(tarifId);
    return tarifId;
  } catch (error) {
    return rejectWithValue(error.response.data);
  }
});

export const updateTarifStatus = createAsyncThunk('tarification/updateTarifStatus', async (tarifId, { rejectWithValue }) => {
  try {
    const updatedTarif = await tarificationService.updateTarifStatus(tarifId);
    return updatedTarif;
  } catch (error) {
    return rejectWithValue(error.response.data);
  }
});


export const addGroupedTarif = createAsyncThunk('tarification/addGroupedTarif', async (tarifData, { rejectWithValue }) => {
  try {
    const newTarif = await tarificationService.addGroupedTarif(tarifData);
    return newTarif;
  } catch (error) {
    return rejectWithValue(error.response.data);
  }
});

export const editGroupedTarif = createAsyncThunk('tarification/editGroupedTarif', async ({ tarifId, tarifData }, { rejectWithValue }) => {
  try {
    const updatedTarif = await tarificationService.editGroupedTarif(tarifId, tarifData);
    return updatedTarif;
  } catch (error) {
    return rejectWithValue(error.response.data);
  }
});

export const deleteGroupedTarif = createAsyncThunk('tarification/deleteGroupedTarif', async (tarifId, { rejectWithValue }) => {
  try {
    await tarificationService.deleteGroupedTarif(tarifId);
    return tarifId;
  } catch (error) {
    return rejectWithValue(error.response.data);
  }
});

export const updateGroupedTarifStatus = createAsyncThunk('tarification/updateGroupedTarifStatus', async (tarifId, { rejectWithValue }) => {
  try {
    const updatedTarif = await tarificationService.updateGroupedTarifStatus(tarifId);
    console.log(updatedTarif);
    return updatedTarif;
  } catch (error) {
    return rejectWithValue(error.response.data);
  }
});

const tarificationSlice = createSlice({
  name: 'tarification',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchTarifs.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchTarifs.fulfilled, (state, action) => {
        state.isLoading = false;
        state.tarifs = action.payload;
      })
      .addCase(fetchTarifs.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(addSimpleTarif.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(addSimpleTarif.fulfilled, (state, action) => {
        state.isLoading = false;
        state.tarifs.push(action.payload);
      })
      .addCase(addSimpleTarif.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Edit simple tarif
      .addCase(editSimpleTarif.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(editSimpleTarif.fulfilled, (state, action) => {
        state.isLoading = false;
        state.tarifs = state.tarifs.map((tarif) =>
          tarif.id === action.payload.id ? action.payload : tarif
        );
      })
      .addCase(editSimpleTarif.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Delete tarif
      .addCase(deleteTarif.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteTarif.fulfilled, (state, action) => {
        state.isLoading = false;
        state.tarifs = state.tarifs.filter((tarif) => tarif.id !== action.payload);
      })
      .addCase(deleteTarif.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Update tarif status
      .addCase(updateTarifStatus.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateTarifStatus.fulfilled, (state, action) => {
        state.isLoading = false;
        state.tarifs = state.tarifs.map((tarif) =>
          tarif.id === action.payload.id ? action.payload : tarif
        );
      })
      .addCase(updateTarifStatus.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Add grouped tarif
      .addCase(addGroupedTarif.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(addGroupedTarif.fulfilled, (state, action) => {
        state.isLoading = false;
        state.tarifs.push(action.payload);
      })
      .addCase(addGroupedTarif.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Edit grouped tarif
      .addCase(editGroupedTarif.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(editGroupedTarif.fulfilled, (state, action) => {
        state.isLoading = false;
        state.tarifs = state.tarifs.map((tarif) =>
          tarif.id === action.payload.id ? action.payload : tarif
        );
      })
      .addCase(editGroupedTarif.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Delete grouped tarif
      .addCase(deleteGroupedTarif.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteGroupedTarif.fulfilled, (state, action) => {
        state.isLoading = false;
        state.tarifs = state.tarifs.filter((tarif) => tarif.id !== action.payload);
      })
      .addCase(deleteGroupedTarif.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Update grouped tarif status
      .addCase(updateGroupedTarifStatus.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateGroupedTarifStatus.fulfilled, (state, action) => {
        state.isLoading = false;
        state.tarifs = state.tarifs.map((tarif) =>
          tarif.id === action.payload.id ? action.payload : tarif
        );
      })
      .addCase(updateGroupedTarifStatus.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export default tarificationSlice.reducer;
