import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import zoneReducer from './slices/zoneSlice';
import tarificationReducer from './slices/tarificationSlice';
import backofficeReducer from './slices/backofficeSlice';
import produitReducer from './slices/produitSlice';
import agentReducer from './slices/agentSlice';
import roleReducer from './slices/roleSlice';
import permissionsReducer from './slices/permissionsSlice';
import agenceReducer from './slices/agenceSlice';
import uiReducer from './slices/uiSlice';
import parcelReducer from './slices/parcelSlice';
import announcementReducer from './slices/announcementSlice';
import messageReducer from './slices/messageSlice';
import inAppNotificationsReducer from './slices/inAppNotificationsSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    zones: zoneReducer,
    tarification: tarificationReducer,
    backoffice: backofficeReducer,
    produits: produitReducer,
    agents: agentReducer,
    roles: roleReducer,
    permissions: permissionsReducer,
    agences: agenceReducer,
    ui: uiReducer,
    parcels: parcelReducer,
    announcements: announcementReducer,
    messages: messageReducer,
    inAppNotifications: inAppNotificationsReducer,
  },
});
