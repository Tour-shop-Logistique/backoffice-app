import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

export const fetchParcels = createAsyncThunk(
    'parcels/fetchParcels',
    async (_, { rejectWithValue }) => {
        try {
            const response = await api.get('/backoffice/list-colis');
            return response.data; // { success: true, data: [...] }
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

const parcelSlice = createSlice({
    name: 'parcels',
    initialState: {
        items: [],
        isLoading: false,
        hasLoaded: false,
        error: null,
        lastUpdated: null
    },
    reducers: {
        clearParcels: (state) => {
            state.items = [];
            state.error = null;
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
                state.lastUpdated = new Date().toISOString();
            })
            .addCase(fetchParcels.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
            });
    }
});

export const { clearParcels } = parcelSlice.actions;
export default parcelSlice.reducer;
