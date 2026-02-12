import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import zoneReducer from './slices/zoneSlice';
import tarificationReducer from './slices/tarificationSlice';
import backofficeReducer from './slices/backofficeSlice';
import produitReducer from './slices/produitSlice';
import agentReducer from './slices/agentSlice';
import agenceReducer from './slices/agenceSlice';
import uiReducer from './slices/uiSlice';
import parcelReducer from './slices/parcelSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    zones: zoneReducer,
    tarification: tarificationReducer,
    backoffice: backofficeReducer,
    produits: produitReducer,
    agents: agentReducer,
    agences: agenceReducer,
    ui: uiReducer,
    parcels: parcelReducer,
  },
});
