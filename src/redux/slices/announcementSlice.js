import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

export const fetchAnnouncements = createAsyncThunk(
    'announcements/fetchAll',
    async (filters = {}, { rejectWithValue }) => {
        try {
            const response = await api.get('/backoffice/announcements', { params: filters });
            if (response.data.success) {
                return { data: response.data.data, pagination: response.data.pagination };
            }
            return rejectWithValue("Impossible de charger les annonces");
        } catch (error) {
            return rejectWithValue(error.message || "Erreur lors de la récupération des annonces");
        }
    }
);

export const createAnnouncement = createAsyncThunk(
    'announcements/create',
    async (payload, { rejectWithValue }) => {
        try {
            const response = await api.post('/backoffice/announcements', payload);
            if (response.data.success) {
                return { announcement: response.data.data, nbDestinataires: response.data.nb_destinataires };
            }
            return rejectWithValue("Impossible d'envoyer l'annonce");
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || error.message || "Erreur lors de l'envoi de l'annonce");
        }
    }
);

export const deleteAnnouncement = createAsyncThunk(
    'announcements/delete',
    async (announcementId, { rejectWithValue }) => {
        try {
            const response = await api.delete(`/backoffice/announcements/${announcementId}`);
            if (response.data.success) {
                return announcementId;
            }
            return rejectWithValue("Impossible de supprimer l'annonce");
        } catch (error) {
            return rejectWithValue(error.message || "Erreur lors de la suppression de l'annonce");
        }
    }
);

export const bulkDeleteAnnouncements = createAsyncThunk(
    'announcements/bulkDelete',
    async (ids, { rejectWithValue }) => {
        try {
            const response = await api.delete('/backoffice/announcements/bulk-delete', { data: { ids } });
            if (response.data.success) {
                return ids;
            }
            return rejectWithValue("Impossible de supprimer les annonces");
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || error.message || "Erreur lors de la suppression des annonces");
        }
    }
);

const announcementSlice = createSlice({
    name: 'announcements',
    initialState: {
        items: [],
        pagination: null,
        isLoading: false,
        isSending: false,
        error: null,
        hasLoaded: false,
    },
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchAnnouncements.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(fetchAnnouncements.fulfilled, (state, action) => {
                state.isLoading = false;
                state.items = action.payload.data;
                state.pagination = action.payload.pagination;
                state.hasLoaded = true;
            })
            .addCase(fetchAnnouncements.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
            })
            .addCase(createAnnouncement.pending, (state) => {
                state.isSending = true;
                state.error = null;
            })
            .addCase(createAnnouncement.fulfilled, (state, action) => {
                state.isSending = false;
                state.items.unshift(action.payload.announcement);
            })
            .addCase(createAnnouncement.rejected, (state, action) => {
                state.isSending = false;
                state.error = action.payload;
            })
            .addCase(deleteAnnouncement.fulfilled, (state, action) => {
                state.items = state.items.filter((a) => a.id !== action.payload);
            })
            .addCase(bulkDeleteAnnouncements.fulfilled, (state, action) => {
                const deletedIds = new Set(action.payload);
                state.items = state.items.filter((a) => !deletedIds.has(a.id));
            });
    }
});

export default announcementSlice.reducer;
