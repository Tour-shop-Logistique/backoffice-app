import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import roleService from '../../services/roleService';

const initialState = {
    roles: [],
    isLoading: false,
    error: null,
    hasLoaded: false,
};

export const fetchRoles = createAsyncThunk(
    'roles/fetchRoles',
    async (_, { rejectWithValue }) => {
        try {
            const response = await roleService.getRoles();
            return response || [];
        } catch (error) {
            return rejectWithValue(error.response?.data || 'Erreur lors de la récupération des rôles');
        }
    }
);

export const addRole = createAsyncThunk(
    'roles/addRole',
    async (roleData, { rejectWithValue }) => {
        try {
            const response = await roleService.addRole(roleData);
            return response.role;
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

export const editRole = createAsyncThunk(
    'roles/editRole',
    async ({ roleId, roleData }, { rejectWithValue }) => {
        try {
            const response = await roleService.editRole(roleId, roleData);
            return response.role;
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

export const deleteRole = createAsyncThunk(
    'roles/deleteRole',
    async (roleId, { rejectWithValue }) => {
        try {
            await roleService.deleteRole(roleId);
            return roleId;
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

const roleSlice = createSlice({
    name: 'roles',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchRoles.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(fetchRoles.fulfilled, (state, action) => {
                state.isLoading = false;
                state.roles = action.payload;
                state.hasLoaded = true;
            })
            .addCase(fetchRoles.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
            })
            .addCase(addRole.fulfilled, (state, action) => {
                if (action.payload) state.roles.unshift(action.payload);
            })
            .addCase(editRole.fulfilled, (state, action) => {
                const updated = action.payload;
                if (!updated) return;
                state.roles = state.roles.map((r) => (r.id === updated.id ? { ...r, ...updated } : r));
            })
            .addCase(deleteRole.fulfilled, (state, action) => {
                state.roles = state.roles.filter((r) => r.id !== action.payload);
            });
    },
});

export default roleSlice.reducer;
