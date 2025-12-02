import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import agentService from '../../services/agentService';

const initialState = {
    agents: [],
    isLoading: false,
    error: null,
};

export const fetchAgents = createAsyncThunk(
    'agent/fetchAgents',    
    async () => {
        const response = await agentService.getAgents();
        console.log(response); // <- voir exactement la structure
        // Retourne la liste correcte selon ta réponse
        return response || response.data || [];
    }
);

export const addAgent = createAsyncThunk(
    'agent/addAgent',
    async (agentData) => {
        const response = await agentService.addAgent(agentData);
        return response.data;
    }
);

export const editAgent = createAsyncThunk(
    'agent/editAgent',
    async ({ agentId, agentData }) => {
        const response = await agentService.editAgent(agentId, agentData);
        return response.data;
    }
);

export const deleteAgent = createAsyncThunk(
    'agent/deleteAgent',
    async (agentId) => {
        const response = await agentService.deleteAgent(agentId);
        return response.data;
    }
);

export const updateAgentStatus = createAsyncThunk(
    'agent/updateAgentStatus',
    async (agentId) => {
        const response = await agentService.updateAgentStatus(agentId);
        return response.data;
    }
);


const agentSlice = createSlice({
    name: 'agents',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchAgents.pending, (state) => { state.isLoading = true; })
            .addCase(fetchAgents.fulfilled, (state, action) => {
                state.isLoading = false;
                state.agents = action.payload;
            })
            .addCase(fetchAgents.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.error.message;
            })
            .addCase(addAgent.fulfilled, (state, action) => { state.agents.push(action.payload); })
            .addCase(editAgent.fulfilled, (state, action) => {
                const index = state.agents.findIndex(agent => agent.id === action.meta.arg.agentId);
                if (index !== -1) state.agents[index] = action.payload;
            })
            .addCase(deleteAgent.fulfilled, (state, action) => {
                state.agents = state.agents.filter(agent => agent.id !== action.meta.arg);
            })
            .addCase(updateAgentStatus.fulfilled, (state, action) => {
                const index = state.agents.findIndex(agent => agent.id === action.meta.arg.agentId);
                if (index !== -1) state.agents[index].actif = action.payload.actif;
            });
    },
});
export default agentSlice.reducer;