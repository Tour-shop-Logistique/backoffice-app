import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

export const fetchParcels = createAsyncThunk(
    'parcels/fetchParcels',
    async ({ listType = 'todo', isControlled = false, date_debut = null, date_fin = null } = {}, { rejectWithValue }) => {
        try {
            let url = `/backoffice/list-colis?is_controlled=${isControlled}`;
            if (date_debut) url += `&date_debut=${date_debut}`;
            if (date_fin) url += `&date_fin=${date_fin}`;

            const response = await api.get(url);
            return { listType, data: response.data };
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

export const fetchParcelByCode = createAsyncThunk(
    'parcels/fetchParcelByCode',
    async (code, { rejectWithValue }) => {
        try {
            const response = await api.get(`/backoffice/show-colis/${code}`);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

export const updateExpedition = createAsyncThunk(
    'parcels/updateExpedition',
    async ({ id, frais_expedition, lien_tracking }, { rejectWithValue }) => {
        try {
            await api.post(`/backoffice/edit-expedition/${id}`, {
                frais_annexes: frais_expedition,
                code_suivi_expedition: lien_tracking
            });
            return { id, frais_annexes: frais_expedition, code_suivi_expedition: lien_tracking };
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

const initialState = {
    // List for "To Control" (is_controlled=false)
    todoList: {
        items: [],
        meta: { current_page: 1, last_page: 1, per_page: 15, total: 0 },
        isLoading: false,
        hasLoaded: false,
        error: null,
        lastUpdated: null
    },
    // List for "History" (is_controlled=true)
    historyList: {
        items: [],
        meta: { current_page: 1, last_page: 1, per_page: 15, total: 0 },
        isLoading: false,
        hasLoaded: false, // Not strictly used for auto-refresh logic usually, but consistent
        error: null,
        lastUpdated: null
    },
    // Detail view state
    currentParcel: null,
    isLoadingDetail: false,
    detailError: null,
    isUpdatingExpedition: false
};

const parcelSlice = createSlice({
    name: 'parcels',
    initialState,
    reducers: {
        cleartodoList: (state) => {
            state.todoList.items = [];
            state.todoList.hasLoaded = false;
        },
        clearHistoryList: (state) => {
            state.historyList.items = [];
            state.historyList.hasLoaded = false;
        },
        clearCurrentParcel: (state) => {
            state.currentParcel = null;
            state.detailError = null;
        },
        setCurrentParcel: (state, action) => {
            state.currentParcel = action.payload;
            state.isLoadingDetail = false;
        }
    },
    extraReducers: (builder) => {
        builder
            // Fetch Parcels
            .addCase(fetchParcels.pending, (state, action) => {
                const listType = action.meta.arg.listType || 'todo';
                if (listType === 'history') {
                    state.historyList.isLoading = true;
                    state.historyList.error = null;
                } else {
                    state.todoList.isLoading = true;
                    state.todoList.error = null;
                }
            })
            .addCase(fetchParcels.fulfilled, (state, action) => {
                const { listType, data } = action.payload;
                if (listType === 'history') {
                    state.historyList.isLoading = false;
                    state.historyList.hasLoaded = true;
                    state.historyList.items = data.data || [];
                    state.historyList.meta = data.meta || state.historyList.meta;
                    state.historyList.lastUpdated = new Date().toISOString();
                } else {
                    state.todoList.isLoading = false;
                    state.todoList.hasLoaded = true;
                    state.todoList.items = data.data || [];
                    state.todoList.meta = data.meta || state.todoList.meta;
                    state.todoList.lastUpdated = new Date().toISOString();
                }
            })
            .addCase(fetchParcels.rejected, (state, action) => {
                const listType = action.meta.arg.listType || 'todo';
                if (listType === 'history') {
                    state.historyList.isLoading = false;
                    state.historyList.error = action.payload;
                } else {
                    state.todoList.isLoading = false;
                    state.todoList.error = action.payload;
                }
            })

            // Fetch Parcel By Code
            .addCase(fetchParcelByCode.pending, (state) => {
                state.isLoadingDetail = true;
                state.detailError = null;
            })
            .addCase(fetchParcelByCode.fulfilled, (state, action) => {
                state.isLoadingDetail = false;
                state.currentParcel = action.payload.colis;
            })
            .addCase(fetchParcelByCode.rejected, (state, action) => {
                state.isLoadingDetail = false;
                state.detailError = action.payload;
            })

            // Update Expedition
            .addCase(updateExpedition.pending, (state) => {
                state.isUpdatingExpedition = true;
            })
            .addCase(updateExpedition.fulfilled, (state, action) => {
                state.isUpdatingExpedition = false;
                const { id, frais_annexes, code_suivi_expedition } = action.payload;

                // Helper to update expedition in list
                const updateInList = (list) => {
                    list.items.forEach(parcel => {
                        if (parcel.expedition?.id === id) {
                            parcel.expedition = {
                                ...parcel.expedition,
                                frais_annexes,
                                code_suivi_expedition
                            };
                        }
                    });
                };

                updateInList(state.todoList);
                updateInList(state.historyList);

                if (state.currentParcel?.expedition?.id === id) {
                    state.currentParcel.expedition = {
                        ...state.currentParcel.expedition,
                        frais_annexes,
                        code_suivi_expedition
                    };
                }
            })
            .addCase(updateExpedition.rejected, (state) => {
                state.isUpdatingExpedition = false;
            });
    }
});

export const { cleartodoList, clearHistoryList, clearCurrentParcel, setCurrentParcel } = parcelSlice.actions;
export default parcelSlice.reducer;
