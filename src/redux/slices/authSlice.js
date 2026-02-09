import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import authService from '../../services/authService';

// Récupérer l'utilisateur et le token depuis le localStorage pour la persistance
const user = JSON.parse(localStorage.getItem('user'));
const token = localStorage.getItem('token');

const initialState = {
  user: user || null,
  token: token || null,
  isAuthenticated: !!token,
  isLoading: false,
  error: null,
};

// Thunk pour la connexion
export const login = createAsyncThunk('auth/login', async (credentials, { rejectWithValue }) => {
  try {
    const data = await authService.login(credentials);
    return data;
  } catch (error) {
    console.log(error);
    return rejectWithValue(error.response.data);
  }
});


// Thunk pour l'inscription
export const register = createAsyncThunk('auth/register', async (userData, { rejectWithValue }) => {
  try {
    const data = await authService.register(userData);
    return data;
  } catch (error) {
    console.error(error);
    return rejectWithValue(error.response.data);
  }
});

import { resetBackoffice } from './backofficeSlice';
import { showNotification } from './uiSlice';

// Thunk pour la déconnexion avec feedback
export const performLogout = createAsyncThunk('auth/performLogout', async (_, { dispatch }) => {
  // 1. Feedback utilisateur immédiat
  dispatch(showNotification({
    type: 'success',
    message: 'Déconnexion en cours... À bientôt !'
  }));

  // 2. Nettoyage immédiat des données locales
  localStorage.removeItem('user');
  localStorage.removeItem('token');

  // 3. Vider le cache du backoffice
  dispatch(resetBackoffice());

  // 4. Appel API non-bloquant
  authService.logout().catch(console.error);

  // 5. Petit délai pour laisser le message apparaître (UX)
  await new Promise(resolve => setTimeout(resolve, 800));

  // 6. Redirection forcée vers l'accueil
  window.location.href = '/';
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = { ...action.payload.user, role: 'is_backoffice_admin' }; // Assign the correct admin role
        state.token = action.payload.token;
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Register
      .addCase(register.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(register.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const { logout } = authSlice.actions;

export default authSlice.reducer;
