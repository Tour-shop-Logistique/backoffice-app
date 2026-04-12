import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { format } from 'date-fns';
import api from '../../services/api';


export const fetchParcels = createAsyncThunk(
    'parcels/fetchParcels',
    async ({ listType = 'todo', date_debut = null, date_fin = null } = {}, { rejectWithValue }) => {
        try {
            let url = `/backoffice/list-expedition`;

            if (listType === 'history') {
                url += `?status=depart_expedition_succes`;
            } else {
                url += `?status=en_transit_entrepot`;
            }

            if (date_debut) url += `&date_debut=${date_debut}`;
            if (date_fin) url += `&date_fin=${date_fin}`;

            const response = await api.get(url);

            let finalData = response.data;

            // Flatten results to parcels so grouping logic in UI continues to work
            if (response.data.data) {
                const flattenedParcels = [];
                response.data.data.forEach(expedition => {
                    const { colis, ...expeditionInfo } = expedition;
                    if (colis && Array.isArray(colis)) {
                        colis.forEach(c => {
                            flattenedParcels.push({
                                ...c,
                                expedition: expeditionInfo
                            });
                        });
                    }
                });
                finalData = {
                    ...response.data,
                    data: flattenedParcels
                };
            }

            return { listType, data: finalData };
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

export const fetchIncomingParcels = createAsyncThunk(
    'parcels/fetchIncomingParcels',
    async ({ date_debut = null, date_fin = null } = {}, { rejectWithValue }) => {
        try {
            let url = `/backoffice/list-expedition?mode=arrivee&status=depart_expedition_succes`;
            if (date_debut) url += `&date_debut=${date_debut}`;
            if (date_fin) url += `&date_fin=${date_fin}`;

            const response = await api.get(url);
            let finalData = response.data;

            if (response.data.data) {
                const flattenedParcels = [];
                response.data.data.forEach(expedition => {
                    const { colis, ...expeditionInfo } = expedition;
                    if (colis && Array.isArray(colis)) {
                        colis.forEach(c => {
                            flattenedParcels.push({ ...c, expedition: expeditionInfo });
                        });
                    }
                });
                finalData = { ...response.data, data: flattenedParcels };
            }

            return finalData;
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

export const updateExpeditionInfo = createAsyncThunk(
    'parcels/updateExpeditionInfo',
    async ({ id, frais_annexes, code_suivi_expedition }, { rejectWithValue }) => {
        try {
            const response = await api.put(`/backoffice/update-expedition-info/${id}`, {
                frais_annexes: frais_annexes || 0,
                code_suivi_expedition
            });
            return { id, frais_annexes, code_suivi_expedition, data: response.data };
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

export const confirmExpeditionDepart = createAsyncThunk(
    'parcels/confirmExpeditionDepart',
    async (id, { rejectWithValue }) => {
        try {
            const response = await api.put(`/backoffice/confirm-expedition-depart/${id}`);
            return { id, data: response.data };
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

// Bloquer un ou plusieurs colis
export const blockParcels = createAsyncThunk(
    'parcels/blockParcels',
    async ({ codes, motif_blocage }, { rejectWithValue }) => {
        try {
            const response = await api.put('/backoffice/block-colis', { 
                codes, 
                motif_blocage 
            });
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

export const controlParcels = createAsyncThunk(
    'parcels/controlParcels',
    async (codes, { rejectWithValue }) => {
        try {
            const response = await api.put(`/backoffice/control-colis`, { codes });
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

export const receiveParcels = createAsyncThunk(
    'parcels/receiveParcels',
    async ({ codes, agence_id }, { rejectWithValue }) => {
        try {
            const response = await api.put(`/backoffice/receive-colis`, { codes, agence_id });
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

export const fetchDashboardStats = createAsyncThunk(
    'parcels/fetchDashboardStats',
    async (params = {}, { rejectWithValue }) => {
        try {
            const days = params.delayed_control_days || 3;
            const response = await api.get(`/backoffice/dashboard?delayed_control_days=${days}`);
            return response.data.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

export const fetchAccountingData = createAsyncThunk(
    'parcels/fetchAccountingData',
    async ({ date_debut = null, date_fin = null } = {}, { rejectWithValue }) => {
        try {
            const response = await api.get(`/backoffice/accounting`, {
                params: { date_debut, date_fin }
            });
            return response.data;
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
        hasLoaded: false,
        error: null,
        lastUpdated: null
    },
    // List for incoming parcels (mode=arrivee)
    incomingList: {
        items: [],
        meta: { current_page: 1, last_page: 1, per_page: 15, total: 0 },
        isLoading: false,
        hasLoaded: false,
        error: null,
        lastUpdated: null
    },
    // Detail view state
    currentParcel: null,
    isLoadingDetail: false,
    detailError: null,
    isUpdatingExpedition: false,
    isBulkControlling: false,
    isBulkBlocking: false,
    isBulkReceiving: false,
    // Dashboard state
    dashboard: {
        data: null,
        loading: false,
        error: null,
        lastUpdated: null
    },
    // Accounting state
    accounting: {
        items: [],
        summary: null,
        filters: {
            date_debut: format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), 'yyyy-MM-dd'),
            date_fin: format(new Date(), 'yyyy-MM-dd'),
            mode: null // null (all), 'depart', 'reception'
        },
        hasLoaded: false,
        isLoading: false,
        error: null,
        lastUpdated: null
    }
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
        },
        setAccountingFilters: (state, action) => {
            state.accounting.filters = {
                ...state.accounting.filters,
                ...action.payload
            };
            // Whenever filters change, we might want to reset hasLoaded to force a refresh
            // But usually the user calls handleLoadData manually after changing dates.
            // Let's set hasLoaded to false so the next useEffect trigger (if any) knows it's dirty.
            state.accounting.hasLoaded = false;
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

            // Update Expedition Info
            .addCase(updateExpeditionInfo.pending, (state) => {
                state.isUpdatingExpedition = true;
            })
            .addCase(updateExpeditionInfo.fulfilled, (state, action) => {
                state.isUpdatingExpedition = false;
                const { id, frais_annexes, code_suivi_expedition } = action.payload;

                const updateInList = (list) => {
                    list.items.forEach(parcel => {
                        if (parcel.expedition?.id === id) {
                            parcel.expedition = {
                                ...parcel.expedition,
                                frais_annexes: Number(frais_annexes || 0),
                                code_suivi_expedition
                            };
                        }
                    });
                };

                updateInList(state.todoList);
                updateInList(state.historyList);
                updateInList(state.incomingList);

                if (state.currentParcel?.expedition?.id === id) {
                    state.currentParcel.expedition = {
                        ...state.currentParcel.expedition,
                        frais_annexes: Number(frais_annexes || 0),
                        code_suivi_expedition
                    };
                }
            })
            .addCase(updateExpeditionInfo.rejected, (state) => {
                state.isUpdatingExpedition = false;
            })

            // Confirm Expedition Depart
            .addCase(confirmExpeditionDepart.pending, (state) => {
                state.isUpdatingExpedition = true;
            })
            .addCase(confirmExpeditionDepart.fulfilled, (state, action) => {
                state.isUpdatingExpedition = false;
                const { id } = action.payload;

                // Remove from todoList as it is now successfully departed
                state.todoList.items = state.todoList.items.filter(p => p.expedition?.id !== id);
                
                // Set status to departed in others if needed
                const setStatusDeparted = (list) => {
                    list.items.forEach(parcel => {
                        if (parcel.expedition?.id === id) {
                            parcel.expedition.statut_expedition = 'depart_expedition_succes';
                        }
                    });
                };
                setStatusDeparted(state.historyList);
                setStatusDeparted(state.incomingList);
            })
            .addCase(confirmExpeditionDepart.rejected, (state) => {
                state.isUpdatingExpedition = false;
            })
            // Control Parcels (Bulk)
            .addCase(controlParcels.pending, (state) => {
                state.isBulkControlling = true;
            })
            .addCase(controlParcels.fulfilled, (state, action) => {
                state.isBulkControlling = false;
                const updatedParcels = action.payload?.data || [];
                
                // Mise à jour réactive des listes locales
                updatedParcels.forEach(updatedParcel => {
                    // Update in todoList (Liste globale)
                    const todoIdx = state.todoList.items.findIndex(p => p.id === updatedParcel.id);
                    if (todoIdx !== -1) {
                        state.todoList.items[todoIdx] = { 
                            ...state.todoList.items[todoIdx], 
                            ...updatedParcel 
                        };
                    }

                    // Update currentParcel if active
                    if (state.currentParcel && state.currentParcel.id === updatedParcel.id) {
                        state.currentParcel = { 
                            ...state.currentParcel, 
                            ...updatedParcel 
                        };
                    }
                });
            })
            .addCase(controlParcels.rejected, (state) => {
                state.isBulkControlling = false;
            })

            // Receive Parcels (Bulk)
            .addCase(receiveParcels.pending, (state) => {
                state.isBulkReceiving = true;
            })
            .addCase(receiveParcels.fulfilled, (state, action) => {
                state.isBulkReceiving = false;
                const updatedParcels = action.payload?.data || [];
                const codesToRemove = updatedParcels.map(p => p.code_colis);

                // Remove received items from incomingList
                state.incomingList.items = state.incomingList.items.filter(
                    item => !codesToRemove.includes(item.code_colis)
                );
            })
            .addCase(receiveParcels.rejected, (state) => {
                state.isBulkReceiving = false;
            })

            // Fetch Incoming Parcels (mode=arrivee)
            .addCase(fetchIncomingParcels.pending, (state) => {
                state.incomingList.isLoading = true;
                state.incomingList.error = null;
            })
            .addCase(fetchIncomingParcels.fulfilled, (state, action) => {
                state.incomingList.isLoading = false;
                state.incomingList.hasLoaded = true;
                state.incomingList.items = action.payload.data || [];
                state.incomingList.meta = action.payload.meta || state.incomingList.meta;
                state.incomingList.lastUpdated = new Date().toISOString();
            })
            .addCase(fetchIncomingParcels.rejected, (state, action) => {
                state.incomingList.isLoading = false;
                state.incomingList.error = action.payload;
            })

            // Dashboard
            .addCase(fetchDashboardStats.pending, (state) => {
                state.dashboard.loading = true;
                state.dashboard.error = null;
            })
            .addCase(fetchDashboardStats.fulfilled, (state, action) => {
                state.dashboard.loading = false;
                state.dashboard.data = action.payload;
                state.dashboard.lastUpdated = new Date().toISOString();
            })
            .addCase(fetchDashboardStats.rejected, (state, action) => {
                state.dashboard.loading = false;
                state.dashboard.error = action.payload;
            })

            // Accounting
            .addCase(fetchAccountingData.pending, (state) => {
                state.accounting.isLoading = true;
                state.accounting.error = null;
            })
            .addCase(fetchAccountingData.fulfilled, (state, action) => {
                state.accounting.isLoading = false;
                state.accounting.items = action.payload.data || [];
                state.accounting.summary = action.payload.summary || null;
                state.accounting.hasLoaded = true;
                state.accounting.lastUpdated = new Date().toISOString();
            })
            .addCase(fetchAccountingData.rejected, (state, action) => {
                state.accounting.isLoading = false;
                state.accounting.error = action.payload;
            })
            // Block Parcels
            .addCase(blockParcels.pending, (state) => {
                state.isBulkBlocking = true;
            })
            .addCase(blockParcels.fulfilled, (state, action) => {
                state.isBulkBlocking = false;
                const updatedParcels = action.payload?.data || [];
                
                // Mise à jour réactive des listes locales
                updatedParcels.forEach(updatedParcel => {
                    // Update in todoList (Liste globale)
                    const todoIdx = state.todoList.items.findIndex(p => p.id === updatedParcel.id);
                    if (todoIdx !== -1) {
                        state.todoList.items[todoIdx] = { 
                            ...state.todoList.items[todoIdx], 
                            ...updatedParcel 
                        };
                    }

                    // Update in incomingList (Arrivages Hub)
                    const incIdx = state.incomingList.items.findIndex(p => p.id === updatedParcel.id);
                    if (incIdx !== -1) {
                        state.incomingList.items[incIdx] = { 
                            ...state.incomingList.items[incIdx], 
                            ...updatedParcel 
                        };
                    }

                    // Update currentParcel if active
                    if (state.currentParcel && state.currentParcel.id === updatedParcel.id) {
                        state.currentParcel = { 
                            ...state.currentParcel, 
                            ...updatedParcel 
                        };
                    }
                });
            })
            .addCase(blockParcels.rejected, (state, action) => {
                state.isBulkBlocking = false;
                state.incomingList.error = action.payload;
            });
    }
});

export const { cleartodoList, clearHistoryList, clearCurrentParcel, setCurrentParcel, setAccountingFilters } = parcelSlice.actions;
export default parcelSlice.reducer;
