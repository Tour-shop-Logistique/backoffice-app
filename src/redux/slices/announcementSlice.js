import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

export const fetchAnnouncements = createAsyncThunk(
    'announcements/fetchAll',
    async (_, { rejectWithValue }) => {
        try {
            const response = await api.get('/backoffice/announcements');
            if (response.data.success) {
                return response.data.data;
            }
            return rejectWithValue("Impossible de charger les annonces");
        } catch (error) {
            return rejectWithValue(error.message || "Erreur lors de la récupération des annonces");
        }
    }
);

export const createAnnouncement = createAsyncThunk(
    'announcements/create',
    async ({ titre, message, agence_id }, { rejectWithValue }) => {
        try {
            const response = await api.post('/backoffice/announcements', { titre, message, agence_id });
            if (response.data.success) {
                return response.data.data;
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

const announcementSlice = createSlice({
    name: 'announcements',
    initialState: {
        items: [],
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
                state.items = action.payload;
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
                state.items.unshift(action.payload);
            })
            .addCase(createAnnouncement.rejected, (state, action) => {
                state.isSending = false;
                state.error = action.payload;
            })
            .addCase(deleteAnnouncement.fulfilled, (state, action) => {
                state.items = state.items.filter((a) => a.id !== action.payload);
            });
    }
});

export default announcementSlice.reducer;
