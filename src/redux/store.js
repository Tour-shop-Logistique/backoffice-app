import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import zoneReducer from './slices/zoneSlice';
import tarificationReducer from './slices/tarificationSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    zones: zoneReducer,
    tarification: tarificationReducer,
    // Ajoutez d'autres reducers ici pour les agents, colis, etc.
  },
});
