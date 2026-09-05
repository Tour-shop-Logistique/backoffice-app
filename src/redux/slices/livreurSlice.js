import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import livreurService from '../../services/livreurService';

const initialState = {
  livreurs: [],
  isLoading: false,
  error: null,
  hasLoaded: false,
};

export const fetchLivreurs = createAsyncThunk(
  'livreurs/fetchLivreurs',
  async (_, { rejectWithValue }) => {
    try {
      const livreurs = await livreurService.getLivreurs();
      return livreurs;
    } catch (error) {
      console.error(error);
      return rejectWithValue(error.response.data);
    }
  },
  {
    condition: (_, { getState }) => {
      const { livreurs } = getState();
      if (livreurs.isLoading) return false;
    },
  }
);

export const addLivreur = createAsyncThunk('livreurs/addLivreur', async (livreurData, { rejectWithValue }) => {
  try {
    const newLivreur = await livreurService.addLivreur(livreurData);
    return newLivreur;
  } catch (error) {
    console.error(error);
    return rejectWithValue(error.response.data);
  }
});

export const editLivreur = createAsyncThunk('livreurs/editLivreur', async ({ livreurId, livreurData }, { rejectWithValue }) => {
  try {
    const updatedLivreur = await livreurService.editLivreur(livreurId, livreurData);
    return updatedLivreur;
  } catch (error) {
    console.error(error);
    return rejectWithValue(error.response.data);
  }
});

export const deleteLivreur = createAsyncThunk('livreurs/deleteLivreur', async (livreurId, { rejectWithValue }) => {
  try {
    await livreurService.deleteLivreur(livreurId);
    return livreurId;
  } catch (error) {
    console.error(error);
    return rejectWithValue(error.response.data);
  }
});

export const updateLivreurStatus = createAsyncThunk('livreurs/updateLivreurStatus', async (livreurId, { rejectWithValue }) => {
  try {
    const updatedLivreur = await livreurService.updateLivreurStatus(livreurId);
    return { livreurId, ...updatedLivreur };
  } catch (error) {
    console.error(error);
    return rejectWithValue(error.response?.data || error.message);
  }
});

// Bascule optimiste du statut actif, porté par livreur.user.actif (pas un
// champ direct sur le livreur - le statut est celui du compte User associé,
// voir LivreurController::toggleStatus() côté backend).
const toggleLivreurActifLocal = (state, livreurId) => {
  const index = state.livreurs.findIndex((l) => l.id === livreurId);
  if (index !== -1 && state.livreurs[index].user) {
    state.livreurs[index].user.actif = !state.livreurs[index].user.actif;
  }
};

const livreurSlice = createSlice({
  name: 'livreurs',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchLivreurs.pending, (state, action) => {
        if (!action.meta.arg?.silent) {
          state.isLoading = true;
        }
        state.error = null;
      })
      .addCase(fetchLivreurs.fulfilled, (state, action) => {
        state.isLoading = false;
        const data = Array.isArray(action.payload) ? action.payload : (action.payload?.data || []);
        state.livreurs = data;
        state.hasLoaded = true;
      })
      .addCase(fetchLivreurs.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(addLivreur.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(addLivreur.fulfilled, (state, action) => {
        state.isLoading = false;
        const newLivreur = action.payload?.livreur || action.payload?.data || action.payload;
        if (newLivreur) {
          state.livreurs.unshift(newLivreur);
        }
      })
      .addCase(addLivreur.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(editLivreur.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(editLivreur.fulfilled, (state, action) => {
        state.isLoading = false;
        const updatedLivreur = action.payload?.livreur || action.payload?.data || action.payload;
        const { livreurId, livreurData } = action.meta.arg;

        state.livreurs = state.livreurs.map((livreur) =>
          livreur.id === livreurId
            ? { ...livreur, ...livreurData, ...(updatedLivreur && updatedLivreur.id ? updatedLivreur : {}) }
            : livreur
        );
      })
      .addCase(editLivreur.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(deleteLivreur.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteLivreur.fulfilled, (state, action) => {
        state.isLoading = false;
        state.livreurs = state.livreurs.filter((livreur) => livreur.id !== action.payload);
      })
      .addCase(deleteLivreur.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(updateLivreurStatus.pending, (state, action) => {
        toggleLivreurActifLocal(state, action.meta.arg);
      })
      .addCase(updateLivreurStatus.rejected, (state, action) => {
        toggleLivreurActifLocal(state, action.meta.arg);
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(updateLivreurStatus.fulfilled, (state, action) => {
        state.isLoading = false;
        const updatedLivreur = action.payload?.livreur || action.payload;
        const id = action.meta.arg;

        if (updatedLivreur && updatedLivreur.id) {
          state.livreurs = state.livreurs.map((livreur) =>
            livreur.id === id ? { ...livreur, ...updatedLivreur } : livreur
          );
        }
      });
  },
});

export default livreurSlice.reducer;
