import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import authService from '../../services/authService';
import profileService from '../../services/profileService';
import { resetBackoffice } from './backofficeSlice';
import { showNotification } from './uiSlice';

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

// Thunk pour mettre à jour le profil de l'utilisateur
export const updateUserProfile = createAsyncThunk('auth/updateUserProfile', async (profileData, { dispatch, rejectWithValue }) => {
  try {
    const data = await profileService.updateProfile(profileData);
    dispatch(showNotification({
      type: 'success',
      message: data.message || 'Profil mis à jour avec succès.'
    }));
    return data.user;
  } catch (error) {
    const message = error.response?.data?.message || 'Erreur lors de la mise à jour du profil.';
    dispatch(showNotification({
      type: 'error',
      message: message
    }));
    return rejectWithValue(error.response?.data || { message });
  }
});

// Thunk pour changer le mot de passe de l'utilisateur
export const changeUserPassword = createAsyncThunk('auth/changeUserPassword', async (passwordData, { dispatch, rejectWithValue }) => {
  try {
    const data = await profileService.changePassword(passwordData);
    dispatch(showNotification({
      type: 'success',
      message: 'Mot de passe changé avec succès. Veuillez vous reconnecter.'
    }));
    // Se déconnecter car le backend invalide les tokens lors du changement de mot de passe
    dispatch(performLogout());
    return data;
  } catch (error) {
    const message = error.response?.data?.message || 'Erreur lors du changement de mot de passe.';
    dispatch(showNotification({
      type: 'error',
      message: message
    }));
    return rejectWithValue(error.response?.data || { message });
  }
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
        state.user = action.payload.user;
        state.token = action.payload.token;

        // Persistance locale avec le vrai rôle
        localStorage.setItem('user', JSON.stringify(action.payload.user));
        localStorage.setItem('token', action.payload.token);
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
      .addCase(register.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.user = action.payload.user;
        state.token = null;
      })
      .addCase(register.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Update User Profile
      .addCase(updateUserProfile.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        // Persister les nouvelles données locales
        localStorage.setItem('user', JSON.stringify(action.payload));
      })
      .addCase(updateUserProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Change Password
      .addCase(changeUserPassword.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(changeUserPassword.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(changeUserPassword.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const { logout } = authSlice.actions;

export default authSlice.reducer;
