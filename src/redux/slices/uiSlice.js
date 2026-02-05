import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    notification: null, // { type: 'success' | 'error' | 'info', message: string, id: number }
};

const uiSlice = createSlice({
    name: 'ui',
    initialState,
    reducers: {
        showNotification: (state, action) => {
            // On utilise un id basé sur le timestamp pour forcer le re-render si le message est identique
            state.notification = {
                ...action.payload,
                id: Date.now()
            };
        },
        hideNotification: (state) => {
            state.notification = null;
        },
    },
});

export const { showNotification, hideNotification } = uiSlice.actions;
export default uiSlice.reducer;
