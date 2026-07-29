import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import permissionService from '../../services/permissionService';

const initialState = {
    resources: [],
    isLoading: false,
    error: null,
    hasLoaded: false,
};

export const fetchAvailablePermissions = createAsyncThunk(
    'permissions/fetchAvailable',
    async (_, { rejectWithValue }) => {
        try {
            const response = await permissionService.getAvailablePermissions();
            return response || [];
        } catch (error) {
            return rejectWithValue(error.response?.data || 'Erreur lors de la récupération des permissions disponibles');
        }
    }
);

const permissionsSlice = createSlice({
    name: 'permissions',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchAvailablePermissions.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(fetchAvailablePermissions.fulfilled, (state, action) => {
                state.isLoading = false;
                state.resources = action.payload;
                state.hasLoaded = true;
            })
            .addCase(fetchAvailablePermissions.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
            });
    },
});

export default permissionsSlice.reducer;
