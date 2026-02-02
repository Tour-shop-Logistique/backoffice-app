import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import agentService from '../../services/agentService';

const initialState = {
    agents: [],
    isLoading: false,
    error: null,
};

export const fetchAgents = createAsyncThunk(
    'agent/fetchAgents',
    async (_, { rejectWithValue }) => {
        try {
            const response = await agentService.getAgents();
            return response || [];
        } catch (error) {
            return rejectWithValue(error.response?.data || "Erreur lors de la récupération des agents");
        }
    }
);

export const addAgent = createAsyncThunk(
    'agent/addAgent',
    async (agentData, { rejectWithValue }) => {
        try {
            const response = await agentService.addAgent(agentData);
            return response.data || response;
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

export const editAgent = createAsyncThunk(
    'agent/editAgent',
    async ({ agentId, agentData }, { rejectWithValue }) => {
        try {
            const response = await agentService.editAgent(agentId, agentData);
            return response.data || response;
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

export const deleteAgent = createAsyncThunk(
    'agent/deleteAgent',
    async (agentId, { rejectWithValue }) => {
        try {
            const res = await agentService.deleteAgent(agentId);
            return { id: agentId, ...res };
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

export const updateAgentStatus = createAsyncThunk(
    'agent/updateAgentStatus',
    async ({ agentId, status }, { rejectWithValue }) => {
        try {
            const response = await agentService.updateAgentStatus(agentId, status);
            return response.data || response;
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

const agentSlice = createSlice({
    name: 'agents',
    initialState,
    reducers: {
        resetAgents: (state) => {
            state.agents = [];
            state.isLoading = false;
            state.error = null;
        }
    },
    extraReducers: (builder) => {
        builder
            // FETCH
            .addCase(fetchAgents.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(fetchAgents.fulfilled, (state, action) => {
                state.isLoading = false;
                state.agents = Array.isArray(action.payload) ? action.payload : (action.payload?.data || []);
            })
            .addCase(fetchAgents.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
            })

            // ADD
            .addCase(addAgent.fulfilled, (state, action) => {
                const newAgent = action.payload?.agent || action.payload;
                if (newAgent) {
                    state.agents.unshift(newAgent);
                }
            })

            // EDIT
            .addCase(editAgent.fulfilled, (state, action) => {
                const updatedAgent = action.payload?.agent || action.payload;
                if (updatedAgent) {
                    const index = state.agents.findIndex(agent => agent.id === updatedAgent.id);
                    if (index !== -1) {
                        state.agents[index] = updatedAgent;
                    }
                }
            })

            // DELETE
            .addCase(deleteAgent.fulfilled, (state, action) => {
                state.agents = state.agents.filter(agent => agent.id !== action.payload.id);
            })

            // STATUS
            .addCase(updateAgentStatus.fulfilled, (state, action) => {
                const updatedAgent = action.payload?.agent || action.payload;
                if (updatedAgent) {
                    const index = state.agents.findIndex(agent => agent.id === updatedAgent.id);
                    if (index !== -1) {
                        state.agents[index] = updatedAgent;
                    }
                }
            });
    },
});

export default agentSlice.reducer;