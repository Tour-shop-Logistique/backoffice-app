import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

export const fetchConversations = createAsyncThunk(
    'messages/fetchConversations',
    async (_, { rejectWithValue }) => {
        try {
            const response = await api.get('/backoffice/messages');
            if (response.data.success) {
                return response.data.data;
            }
            return rejectWithValue("Impossible de charger les conversations");
        } catch (error) {
            return rejectWithValue(error.message || "Erreur lors de la récupération des conversations");
        }
    }
);

export const fetchConversation = createAsyncThunk(
    'messages/fetchConversation',
    async (agenceId, { rejectWithValue }) => {
        try {
            const response = await api.get(`/backoffice/messages/${agenceId}`);
            if (response.data.success) {
                return { agenceId, messages: response.data.messages };
            }
            return rejectWithValue("Impossible de charger la conversation");
        } catch (error) {
            return rejectWithValue(error.message || "Erreur lors de la récupération de la conversation");
        }
    }
);

export const sendMessage = createAsyncThunk(
    'messages/send',
    async ({ agenceId, body, attachments }, { rejectWithValue }) => {
        try {
            const formData = new FormData();
            if (body) formData.append('body', body);
            (attachments || []).forEach((file) => formData.append('attachments[]', file));

            const response = await api.post(`/backoffice/messages/${agenceId}`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            if (response.data.success) {
                return { agenceId, message: response.data.message };
            }
            return rejectWithValue("Impossible d'envoyer le message");
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || error.message || "Erreur lors de l'envoi du message");
        }
    }
);

const messageSlice = createSlice({
    name: 'messages',
    initialState: {
        conversations: [],
        conversationsLoaded: false,
        isLoadingConversations: false,
        // Messages par agenceId : { [agenceId]: Message[] }
        byAgence: {},
        isLoadingConversation: false,
        isSending: false,
        error: null,
    },
    reducers: {
        // Reçu en temps réel via WebSocket (canal backoffice.{id}, event Message/created).
        // L'agenceId est résolu côté hook d'écoute (useRealtimeMessages), pas dans le payload broadcast.
        appendMessageToConversation: (state, action) => {
            const { agenceId, message } = action.payload;
            if (!state.byAgence[agenceId]) {
                state.byAgence[agenceId] = [];
            }
            const alreadyExists = state.byAgence[agenceId].some((m) => m.id === message.id);
            if (!alreadyExists) {
                state.byAgence[agenceId].push(message);
            }

            const conv = state.conversations.find((c) => c.agence?.id === agenceId);
            if (conv) {
                conv.last_message = { body: message.body, created_at: message.created_at };
                conv.non_lu = true;
            }
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchConversations.pending, (state) => {
                state.isLoadingConversations = true;
                state.error = null;
            })
            .addCase(fetchConversations.fulfilled, (state, action) => {
                state.isLoadingConversations = false;
                state.conversations = action.payload;
                state.conversationsLoaded = true;
            })
            .addCase(fetchConversations.rejected, (state, action) => {
                state.isLoadingConversations = false;
                state.error = action.payload;
            })
            .addCase(fetchConversation.pending, (state) => {
                state.isLoadingConversation = true;
                state.error = null;
            })
            .addCase(fetchConversation.fulfilled, (state, action) => {
                state.isLoadingConversation = false;
                state.byAgence[action.payload.agenceId] = action.payload.messages;
                const conv = state.conversations.find((c) => c.agence?.id === action.payload.agenceId);
                if (conv) conv.non_lu = false;
            })
            .addCase(fetchConversation.rejected, (state, action) => {
                state.isLoadingConversation = false;
                state.error = action.payload;
            })
            .addCase(sendMessage.pending, (state) => {
                state.isSending = true;
                state.error = null;
            })
            .addCase(sendMessage.fulfilled, (state, action) => {
                state.isSending = false;
                const { agenceId, message } = action.payload;
                if (!state.byAgence[agenceId]) state.byAgence[agenceId] = [];
                state.byAgence[agenceId].push(message);
            })
            .addCase(sendMessage.rejected, (state, action) => {
                state.isSending = false;
                state.error = action.payload;
            });
    }
});

export const { appendMessageToConversation } = messageSlice.actions;
export default messageSlice.reducer;
