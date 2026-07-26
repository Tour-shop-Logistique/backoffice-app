import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

export const fetchFactureForExpedition = createAsyncThunk(
    'factures/fetchForExpedition',
    async (expeditionId, { rejectWithValue }) => {
        try {
            const response = await api.get('/backoffice/factures', { params: { expedition_id: expeditionId } });
            return { expeditionId, facture: response.data.data?.[0] ?? null };
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || error.message);
        }
    }
);

export const generateFacture = createAsyncThunk(
    'factures/generate',
    async (expeditionId, { rejectWithValue }) => {
        try {
            const response = await api.post(`/backoffice/factures/expedition/${expeditionId}`);
            if (response.data.success) {
                return { expeditionId, facture: response.data.facture };
            }
            return rejectWithValue("Impossible de générer la facture");
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || error.message || "Erreur lors de la génération de la facture");
        }
    }
);

export const updateFactureStatut = createAsyncThunk(
    'factures/updateStatut',
    async ({ id, statut }, { rejectWithValue }) => {
        try {
            const response = await api.put(`/backoffice/factures/${id}/statut`, { statut });
            if (response.data.success) {
                return response.data.facture;
            }
            return rejectWithValue("Impossible de mettre à jour le statut");
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || error.message);
        }
    }
);

export const sendFactureEmail = createAsyncThunk(
    'factures/sendEmail',
    async ({ id, email }, { rejectWithValue }) => {
        try {
            const response = await api.post(`/backoffice/factures/${id}/send-email`, { email });
            if (response.data.success) {
                return response.data.message;
            }
            return rejectWithValue("Impossible d'envoyer la facture");
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || error.message || "Erreur lors de l'envoi de la facture");
        }
    }
);

const factureSlice = createSlice({
    name: 'factures',
    initialState: {
        // Facture courante par expedition_id : { [expeditionId]: Facture | null }
        byExpedition: {},
        isLoading: false,
        isGenerating: false,
        isSending: false,
        error: null,
    },
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchFactureForExpedition.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(fetchFactureForExpedition.fulfilled, (state, action) => {
                state.isLoading = false;
                state.byExpedition[action.payload.expeditionId] = action.payload.facture;
            })
            .addCase(fetchFactureForExpedition.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
            })
            .addCase(generateFacture.pending, (state) => {
                state.isGenerating = true;
                state.error = null;
            })
            .addCase(generateFacture.fulfilled, (state, action) => {
                state.isGenerating = false;
                state.byExpedition[action.payload.expeditionId] = action.payload.facture;
            })
            .addCase(generateFacture.rejected, (state, action) => {
                state.isGenerating = false;
                state.error = action.payload;
            })
            .addCase(updateFactureStatut.fulfilled, (state, action) => {
                const facture = action.payload;
                const expeditionId = facture.expedition_id;
                if (state.byExpedition[expeditionId]) {
                    state.byExpedition[expeditionId] = facture;
                }
            })
            .addCase(sendFactureEmail.pending, (state) => {
                state.isSending = true;
            })
            .addCase(sendFactureEmail.fulfilled, (state) => {
                state.isSending = false;
            })
            .addCase(sendFactureEmail.rejected, (state, action) => {
                state.isSending = false;
                state.error = action.payload;
            });
    },
});

export default factureSlice.reducer;
