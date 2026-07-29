import { createSlice } from '@reduxjs/toolkit';

const STORAGE_KEY = 'inapp_notifications';
const MAX_ITEMS = 50;

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { items: [], unreadCount: 0 };
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed.items)) return { items: [], unreadCount: 0 };
    return {
      items: parsed.items,
      unreadCount: parsed.items.filter((n) => !n.read).length,
    };
  } catch {
    return { items: [], unreadCount: 0 };
  }
}

function saveToStorage(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ items: state.items }));
  } catch {
    // localStorage indisponible (quota, navigation privée...) : on continue
    // sans persistance, ce n'est pas une fonctionnalité critique.
  }
}

const inAppNotificationsSlice = createSlice({
  name: 'inAppNotifications',
  initialState: loadFromStorage(),
  reducers: {
    notificationAdded: (state, action) => {
      const entry = action.payload;
      if (!entry || state.items.some((n) => n.id === entry.id)) return;
      state.items.unshift(entry);
      if (state.items.length > MAX_ITEMS) {
        state.items.length = MAX_ITEMS;
      }
      if (!entry.read) state.unreadCount += 1;
      saveToStorage(state);
    },
    notificationRead: (state, action) => {
      const item = state.items.find((n) => n.id === action.payload);
      if (item && !item.read) {
        item.read = true;
        state.unreadCount = Math.max(0, state.unreadCount - 1);
        saveToStorage(state);
      }
    },
    allNotificationsRead: (state) => {
      state.items.forEach((n) => { n.read = true; });
      state.unreadCount = 0;
      saveToStorage(state);
    },
    notificationsCleared: (state) => {
      state.items = [];
      state.unreadCount = 0;
      saveToStorage(state);
    },
  },
});

export const { notificationAdded, notificationRead, allNotificationsRead, notificationsCleared } = inAppNotificationsSlice.actions;

export const selectInAppNotifications = (state) => state.inAppNotifications.items;
export const selectInAppUnreadCount = (state) => state.inAppNotifications.unreadCount;

export default inAppNotificationsSlice.reducer;
