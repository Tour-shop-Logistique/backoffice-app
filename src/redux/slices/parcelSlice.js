import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

export const fetchParcels = createAsyncThunk(
    'parcels/fetchParcels',
    async (_, { rejectWithValue }) => {
        try {
            const response = await api.get('/backoffice/list-colis?is_controlled=false');
            return response.data; // { success: true, data: [...] }
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
            return response.data; // { success: true, data: {...} }
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

const parcelSlice = createSlice({
    name: 'parcels',
    initialState: {
        items: [],
        meta: {
            current_page: 1,
            last_page: 1,
            per_page: 15,
            total: 0
        },
        isLoading: false,
        isLoadingDetail: false,
        hasLoaded: false,
        currentParcel: null,
        error: null,
        lastUpdated: null
    },
    reducers: {
        clearParcels: (state) => {
            state.items = [];
            state.error = null;
        },
        clearCurrentParcel: (state) => {
            state.currentParcel = null;
            state.error = null;
        },
        setCurrentParcel: (state, action) => {
            state.currentParcel = action.payload;
            state.isLoadingDetail = false;
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchParcels.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(fetchParcels.fulfilled, (state, action) => {
                state.isLoading = false;
                state.hasLoaded = true;
                state.items = action.payload.data || [];
                state.meta = action.payload.meta || state.meta;
                state.lastUpdated = new Date().toISOString();
            })
            .addCase(fetchParcels.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
            })
            // fetchParcelByCode
            .addCase(fetchParcelByCode.pending, (state) => {
                state.isLoadingDetail = true;
                state.error = null;
            })
            .addCase(fetchParcelByCode.fulfilled, (state, action) => {
                state.isLoadingDetail = false;
                state.currentParcel = action.payload.colis;
            })
            .addCase(fetchParcelByCode.rejected, (state, action) => {
                state.isLoadingDetail = false;
                state.error = action.payload;
            });
    }
});

export const { clearParcels, clearCurrentParcel, setCurrentParcel } = parcelSlice.actions;
export default parcelSlice.reducer;
