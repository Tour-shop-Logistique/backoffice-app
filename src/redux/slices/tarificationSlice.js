import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import tarificationService from '../../services/tarificationService';

const initialState = {
  tarifs: [],
  groupedTarifs: [],
  intervilleTarifs: [],
  enlevementTranchesKm: [],
  formatsColis: [],
  // Flags séparés (et non un isLoading partagé) : fetchTarifs et
  // fetchGroupedTarifs sont dispatchés en parallèle au montage du Layout, et
  // un flag commun faisait échouer silencieusement le second thunk via son
  // `condition` guard (il voyait isLoading déjà à true à cause du premier).
  isLoadingSimple: false,
  isLoadingGrouped: false,
  isLoadingInterville: false,
  isLoadingEnlevementTranchesKm: false,
  isLoadingFormatsColis: false,
  error: null,
  hasLoaded: false,
  groupedHasLoaded: false,
  intervilleHasLoaded: false,
  enlevementTranchesKmHasLoaded: false,
  formatsColisHasLoaded: false,
};

/*--------------------------- SIMPLE TARIFS ---------------------------*/

export const fetchTarifs = createAsyncThunk(
  'tarification/fetchTarifs',
  async (options = {}, { rejectWithValue }) => {
    try {
      return await tarificationService.getTarifs();
    } catch (error) {
      console.error(error);
      return rejectWithValue(error.response.data);
    }
  },
  {
    // Évite seulement un appel concurrent (double-montage StrictMode en dev) ;
    // ne doit pas empêcher un rafraîchissement manuel une fois déjà chargé.
    condition: (_, { getState }) => {
      const { tarification } = getState();
      if (tarification.isLoadingSimple) return false;
    },
  }
);

export const addSimpleTarif = createAsyncThunk(
  'tarification/addSimpleTarif',
  async (tarifData, { rejectWithValue }) => {
    try {
      return await tarificationService.addSimpleTarif(tarifData);
    } catch (error) {
      console.error(error);
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
      console.error(error);
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
      console.error(error);
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
      console.error(error);
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
      console.error(error);
      return rejectWithValue(error.response.data);
    }
  },
  {
    condition: (_, { getState }) => {
      const { tarification } = getState();
      if (tarification.isLoadingGrouped) return false;
    },
  }
);

export const addGroupedTarif = createAsyncThunk(
  'tarification/addGroupedTarif',
  async (tarifData, { rejectWithValue }) => {
    try {
      return await tarificationService.addGroupedTarif(tarifData);
    } catch (error) {
      console.error(error);
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
      console.error(error);
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
      console.error(error);
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
      console.error(error);
      return rejectWithValue(error.response.data);
    }
  }
);

/*--------------------------- INTERVILLE TARIFS ---------------------------*/

export const fetchIntervilleTarifs = createAsyncThunk(
  'tarification/fetchIntervilleTarifs',
  async (options = {}, { rejectWithValue }) => {
    try {
      return await tarificationService.getIntervilleTarifs();
    } catch (error) {
      console.error(error);
      return rejectWithValue(error.response.data);
    }
  },
  {
    condition: (_, { getState }) => {
      const { tarification } = getState();
      if (tarification.isLoadingInterville) return false;
    },
  }
);

export const addIntervilleTarif = createAsyncThunk(
  'tarification/addIntervilleTarif',
  async (tarifData, { rejectWithValue }) => {
    try {
      return await tarificationService.addIntervilleTarif(tarifData);
    } catch (error) {
      console.error(error);
      return rejectWithValue(error.response.data);
    }
  }
);

export const editIntervilleTarif = createAsyncThunk(
  'tarification/editIntervilleTarif',
  async ({ tarifId, tarifData }, { rejectWithValue }) => {
    try {
      return await tarificationService.editIntervilleTarif(tarifId, tarifData);
    } catch (error) {
      console.error(error);
      return rejectWithValue(error.response.data);
    }
  }
);

export const deleteIntervilleTarif = createAsyncThunk(
  'tarification/deleteIntervilleTarif',
  async (tarifId, { rejectWithValue }) => {
    try {
      await tarificationService.deleteIntervilleTarif(tarifId);
      return tarifId;
    } catch (error) {
      console.error(error);
      return rejectWithValue(error.response.data);
    }
  }
);

export const updateIntervilleTarifStatus = createAsyncThunk(
  'tarification/updateIntervilleTarifStatus',
  async (tarifId, { rejectWithValue }) => {
    try {
      return await tarificationService.updateIntervilleTarifStatus(tarifId);
    } catch (error) {
      console.error(error);
      return rejectWithValue(error.response.data);
    }
  }
);

/*--------------------------- ENLEVEMENT TRANCHES KM ---------------------------*/
// Grille tarifaire par (backoffice, commune) : plusieurs tranches par
// commune (une grille complète), contrairement aux autres blocs ci-dessus
// où 1 ligne = 1 tarif complet. Le state reste une liste à plat, filtrée
// par commune_id côté composant.

export const fetchEnlevementTranchesKm = createAsyncThunk(
  'tarification/fetchEnlevementTranchesKm',
  async (options = {}, { rejectWithValue }) => {
    try {
      return await tarificationService.getEnlevementTranchesKm(options.communeId);
    } catch (error) {
      console.error(error);
      return rejectWithValue(error.response.data);
    }
  },
  {
    condition: (_, { getState }) => {
      const { tarification } = getState();
      if (tarification.isLoadingEnlevementTranchesKm) return false;
    },
  }
);

export const addEnlevementTrancheKm = createAsyncThunk(
  'tarification/addEnlevementTrancheKm',
  async (trancheData, { rejectWithValue }) => {
    try {
      return await tarificationService.addEnlevementTrancheKm(trancheData);
    } catch (error) {
      console.error(error);
      return rejectWithValue(error.response.data);
    }
  }
);

export const editEnlevementTrancheKm = createAsyncThunk(
  'tarification/editEnlevementTrancheKm',
  async ({ trancheId, trancheData }, { rejectWithValue }) => {
    try {
      return await tarificationService.editEnlevementTrancheKm(trancheId, trancheData);
    } catch (error) {
      console.error(error);
      return rejectWithValue(error.response.data);
    }
  }
);

export const deleteEnlevementTrancheKm = createAsyncThunk(
  'tarification/deleteEnlevementTrancheKm',
  async (trancheId, { rejectWithValue }) => {
    try {
      await tarificationService.deleteEnlevementTrancheKm(trancheId);
      return trancheId;
    } catch (error) {
      console.error(error);
      return rejectWithValue(error.response.data);
    }
  }
);

export const updateEnlevementTrancheKmStatus = createAsyncThunk(
  'tarification/updateEnlevementTrancheKmStatus',
  async (trancheId, { rejectWithValue }) => {
    try {
      return await tarificationService.updateEnlevementTrancheKmStatus(trancheId);
    } catch (error) {
      console.error(error);
      return rejectWithValue(error.response.data);
    }
  }
);

/*--------------------------- FORMATS COLIS ---------------------------*/

export const fetchFormatsColis = createAsyncThunk(
  'tarification/fetchFormatsColis',
  async (options = {}, { rejectWithValue }) => {
    try {
      return await tarificationService.getFormatsColis();
    } catch (error) {
      console.error(error);
      return rejectWithValue(error.response.data);
    }
  },
  {
    condition: (_, { getState }) => {
      const { tarification } = getState();
      if (tarification.isLoadingFormatsColis) return false;
    },
  }
);

export const addFormatColis = createAsyncThunk(
  'tarification/addFormatColis',
  async (formatData, { rejectWithValue }) => {
    try {
      return await tarificationService.addFormatColis(formatData);
    } catch (error) {
      console.error(error);
      return rejectWithValue(error.response.data);
    }
  }
);

export const editFormatColis = createAsyncThunk(
  'tarification/editFormatColis',
  async ({ formatId, formatData }, { rejectWithValue }) => {
    try {
      return await tarificationService.editFormatColis(formatId, formatData);
    } catch (error) {
      console.error(error);
      return rejectWithValue(error.response.data);
    }
  }
);

export const deleteFormatColis = createAsyncThunk(
  'tarification/deleteFormatColis',
  async (formatId, { rejectWithValue }) => {
    try {
      await tarificationService.deleteFormatColis(formatId);
      return formatId;
    } catch (error) {
      console.error(error);
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
          state.isLoadingSimple = true;
        }
        state.error = null;
      })
      .addCase(fetchTarifs.fulfilled, (state, action) => {
        state.isLoadingSimple = false;
        const data = Array.isArray(action.payload) ? action.payload : (action.payload?.data || []);
        state.tarifs = data.map(t => ({
          ...t,
          actif: t.actif === true || t.actif === 1 || t.actif === "1"
        }));
        state.hasLoaded = true;
      })
      .addCase(fetchTarifs.rejected, (state, action) => {
        state.isLoadingSimple = false;
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
          state.isLoadingGrouped = true;
        }
        state.error = null;
      })
      .addCase(fetchGroupedTarifs.fulfilled, (state, action) => {
        state.isLoadingGrouped = false;
        const data = Array.isArray(action.payload) ? action.payload : (action.payload?.data || []);
        state.groupedTarifs = data.map(t => ({
          ...t,
          actif: t.actif === true || t.actif === 1 || t.actif === "1"
        }));
        state.groupedHasLoaded = true;
      })
      .addCase(fetchGroupedTarifs.rejected, (state, action) => {
        state.isLoadingGrouped = false;
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

    /*---------------- INTERVILLE ----------------*/
    builder
      .addCase(fetchIntervilleTarifs.pending, (state, action) => {
        if (!action.meta.arg?.silent) {
          state.isLoadingInterville = true;
        }
        state.error = null;
      })
      .addCase(fetchIntervilleTarifs.fulfilled, (state, action) => {
        state.isLoadingInterville = false;
        const data = Array.isArray(action.payload) ? action.payload : (action.payload?.data || []);
        state.intervilleTarifs = data.map(t => ({
          ...t,
          actif: t.actif === true || t.actif === 1 || t.actif === "1"
        }));
        state.intervilleHasLoaded = true;
      })
      .addCase(fetchIntervilleTarifs.rejected, (state, action) => {
        state.isLoadingInterville = false;
        state.error = action.payload;
      })

      .addCase(addIntervilleTarif.fulfilled, (state, action) => {
        const newTarif = action.payload?.tarif || action.payload?.data || action.payload;
        if (newTarif) {
          state.intervilleTarifs.unshift({
            ...newTarif,
            actif: newTarif.actif !== undefined ? newTarif.actif : true
          });
        }
      })

      .addCase(editIntervilleTarif.fulfilled, (state, action) => {
        const updated = action.payload?.tarif || action.payload?.data || action.payload;
        const { tarifId, tarifData } = action.meta.arg;

        state.intervilleTarifs = state.intervilleTarifs.map((t) =>
          t.id === tarifId
            ? { ...t, ...tarifData, ...(updated && updated.id ? updated : {}) }
            : t
        );
      })

      .addCase(deleteIntervilleTarif.fulfilled, (state, action) => {
        state.intervilleTarifs = state.intervilleTarifs.filter((t) => t.id !== action.payload);
      })

      .addCase(updateIntervilleTarifStatus.pending, (state, action) => {
        const tarifId = action.meta.arg;
        const index = state.intervilleTarifs.findIndex(t => t.id === tarifId);
        if (index !== -1) {
          state.intervilleTarifs[index].actif = !state.intervilleTarifs[index].actif;
        }
      })
      .addCase(updateIntervilleTarifStatus.rejected, (state, action) => {
        const tarifId = action.meta.arg;
        const index = state.intervilleTarifs.findIndex(t => t.id === tarifId);
        if (index !== -1) {
          state.intervilleTarifs[index].actif = !state.intervilleTarifs[index].actif;
        }
      })
      .addCase(updateIntervilleTarifStatus.fulfilled, (state, action) => {
        const updated = action.payload?.tarif || action.payload?.data || action.payload;
        if (updated) {
          state.intervilleTarifs = state.intervilleTarifs.map((t) =>
            t.id === updated.id ? updated : t
          );
        }
      });

    /*---------------- ENLEVEMENT TRANCHES KM ----------------*/
    builder
      .addCase(fetchEnlevementTranchesKm.pending, (state, action) => {
        if (!action.meta.arg?.silent) {
          state.isLoadingEnlevementTranchesKm = true;
        }
        state.error = null;
      })
      .addCase(fetchEnlevementTranchesKm.fulfilled, (state, action) => {
        state.isLoadingEnlevementTranchesKm = false;
        const data = Array.isArray(action.payload) ? action.payload : (action.payload?.data || []);
        state.enlevementTranchesKm = data.map(t => ({
          ...t,
          actif: t.actif === true || t.actif === 1 || t.actif === "1"
        }));
        state.enlevementTranchesKmHasLoaded = true;
      })
      .addCase(fetchEnlevementTranchesKm.rejected, (state, action) => {
        state.isLoadingEnlevementTranchesKm = false;
        state.error = action.payload;
      })

      .addCase(addEnlevementTrancheKm.fulfilled, (state, action) => {
        const newTranche = action.payload?.tarif || action.payload?.data || action.payload;
        if (newTranche) {
          state.enlevementTranchesKm.unshift({
            ...newTranche,
            actif: newTranche.actif !== undefined ? newTranche.actif : true
          });
        }
      })

      .addCase(editEnlevementTrancheKm.fulfilled, (state, action) => {
        const updated = action.payload?.tarif || action.payload?.data || action.payload;
        const { trancheId, trancheData } = action.meta.arg;

        state.enlevementTranchesKm = state.enlevementTranchesKm.map((t) =>
          t.id === trancheId
            ? { ...t, ...trancheData, ...(updated && updated.id ? updated : {}) }
            : t
        );
      })

      .addCase(deleteEnlevementTrancheKm.fulfilled, (state, action) => {
        state.enlevementTranchesKm = state.enlevementTranchesKm.filter((t) => t.id !== action.payload);
      })

      .addCase(updateEnlevementTrancheKmStatus.pending, (state, action) => {
        const trancheId = action.meta.arg;
        const index = state.enlevementTranchesKm.findIndex(t => t.id === trancheId);
        if (index !== -1) {
          state.enlevementTranchesKm[index].actif = !state.enlevementTranchesKm[index].actif;
        }
      })
      .addCase(updateEnlevementTrancheKmStatus.rejected, (state, action) => {
        const trancheId = action.meta.arg;
        const index = state.enlevementTranchesKm.findIndex(t => t.id === trancheId);
        if (index !== -1) {
          state.enlevementTranchesKm[index].actif = !state.enlevementTranchesKm[index].actif;
        }
      })
      .addCase(updateEnlevementTrancheKmStatus.fulfilled, (state, action) => {
        const updated = action.payload?.tarif || action.payload?.data || action.payload;
        if (updated) {
          state.enlevementTranchesKm = state.enlevementTranchesKm.map((t) =>
            t.id === updated.id ? updated : t
          );
        }
      });

    /*---------------- FORMATS COLIS ----------------*/
    builder
      .addCase(fetchFormatsColis.pending, (state, action) => {
        if (!action.meta.arg?.silent) {
          state.isLoadingFormatsColis = true;
        }
        state.error = null;
      })
      .addCase(fetchFormatsColis.fulfilled, (state, action) => {
        state.isLoadingFormatsColis = false;
        state.formatsColis = Array.isArray(action.payload) ? action.payload : (action.payload?.data || []);
        state.formatsColisHasLoaded = true;
      })
      .addCase(fetchFormatsColis.rejected, (state, action) => {
        state.isLoadingFormatsColis = false;
        state.error = action.payload;
      })

      .addCase(addFormatColis.fulfilled, (state, action) => {
        const newFormat = action.payload?.format || action.payload?.data || action.payload;
        if (newFormat) {
          state.formatsColis.push(newFormat);
          state.formatsColis.sort((a, b) => a.ordre - b.ordre);
        }
      })

      .addCase(editFormatColis.fulfilled, (state, action) => {
        const updated = action.payload?.format || action.payload?.data || action.payload;
        if (updated) {
          state.formatsColis = state.formatsColis.map((f) => (f.id === updated.id ? updated : f));
          state.formatsColis.sort((a, b) => a.ordre - b.ordre);
        }
      })

      .addCase(deleteFormatColis.fulfilled, (state, action) => {
        state.formatsColis = state.formatsColis.filter((f) => f.id !== action.payload);
      });
  },
});

export default tarificationSlice.reducer;
