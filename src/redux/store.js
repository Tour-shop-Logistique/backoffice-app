import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import zoneReducer from './slices/zoneSlice'; // Importer le nouveau reducer

export const store = configureStore({
  reducer: {
    auth: authReducer,
    zones: zoneReducer, // Ajouter le reducer des zones
    // Ajoutez d'autres reducers ici pour les agents, colis, etc.
  },
});
