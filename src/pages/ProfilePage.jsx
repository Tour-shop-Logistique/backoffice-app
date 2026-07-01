import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  User, 
  Lock, 
  Mail, 
  Phone, 
  Eye, 
  EyeOff, 
  Loader2, 
  Save, 
  ShieldAlert,
  KeyRound,
  CheckCircle2
} from 'lucide-react';
import { updateUserProfile, changeUserPassword } from '../redux/slices/authSlice';
import { showNotification } from '../redux/slices/uiSlice';
import profileService from '../services/profileService';

const ProfilePage = () => {
  const dispatch = useDispatch();
  const { user, isLoading: authLoading } = useSelector((state) => state.auth);

  const [activeTab, setActiveTab] = useState('info'); // 'info' or 'password'
  const [profileLoading, setProfileLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Formulaire Info
  const [infoForm, setInfoForm] = useState({
    nom: '',
    prenoms: '',
    telephone: '',
    email: '',
  });

  // Formulaire Mot de passe
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    password: '',
    password_confirmation: '',
  });

  // Visibilité des mots de passe
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  // Charger le profil frais de l'utilisateur au montage
  useEffect(() => {
    const loadFreshProfile = async () => {
      try {
        setProfileLoading(true);
        const data = await profileService.getProfile();
        if (data.success && data.user) {
          setInfoForm({
            nom: data.user.nom || '',
            prenoms: data.user.prenoms || '',
            telephone: data.user.telephone || '',
            email: data.user.email || '',
          });
        }
      } catch (err) {
        console.error('Erreur lors du chargement du profil:', err);
        // Fallback sur le user du store
        if (user) {
          setInfoForm({
            nom: user.nom || '',
            prenoms: user.prenoms || '',
            telephone: user.telephone || '',
            email: user.email || '',
          });
        }
      } finally {
        setProfileLoading(false);
      }
    };

    loadFreshProfile();
  }, [user]);

  const handleInfoChange = (e) => {
    const { name, value } = e.target;
    setInfoForm((prev) => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleInfoSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!infoForm.nom || !infoForm.telephone) {
      dispatch(showNotification({
        type: 'error',
        message: 'Le nom et le numéro de téléphone sont requis.'
      }));
      return;
    }

    setIsSubmitting(true);
    try {
      await dispatch(updateUserProfile(infoForm)).unwrap();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!passwordForm.current_password || !passwordForm.password || !passwordForm.password_confirmation) {
      dispatch(showNotification({
        type: 'error',
        message: 'Veuillez remplir tous les champs du mot de passe.'
      }));
      return;
    }

    if (passwordForm.password.length < 8) {
      dispatch(showNotification({
        type: 'error',
        message: 'Le nouveau mot de passe doit faire au moins 8 caractères.'
      }));
      return;
    }

    if (passwordForm.password !== passwordForm.password_confirmation) {
      dispatch(showNotification({
        type: 'error',
        message: 'Les nouveaux mots de passe ne correspondent pas.'
      }));
      return;
    }

    setIsSubmitting(true);
    try {
      await dispatch(changeUserPassword(passwordForm)).unwrap();
      // En cas de succès, performLogout est automatiquement appelé par le thunk
      setPasswordForm({
        current_password: '',
        password: '',
        password_confirmation: '',
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (profileLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Loader2 className="h-10 w-10 animate-spin text-slate-600" />
        <p className="text-slate-500 font-medium">Chargement de votre profil...</p>
      </div>
    );
  }

  // Rôle de l'utilisateur lisible
  const getRoleBadge = (role) => {
    switch (role) {
      case 'is_backoffice_admin':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200">Administrateur</span>;
      case 'is_backoffice_agent':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-100 text-slate-800 border border-slate-200">Agent Logistique</span>;
      default:
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800 border border-gray-200">Agent</span>;
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      {/* En-tête */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-slate-200 pb-5 mb-6 space-y-4 md:space-y-0">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Mon Profil</h2>
          <p className="text-sm text-slate-500 mt-1">Gérez vos informations de compte et vos paramètres de sécurité</p>
        </div>
        <div className="flex items-center space-x-2">
          {getRoleBadge(user?.role)}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Navigation Onglets */}
        <div className="md:col-span-1">
          <div className="flex flex-row md:flex-col space-x-2 md:space-x-0 md:space-y-1 bg-slate-100 md:bg-transparent p-1 md:p-0 rounded-lg">
            <button
              onClick={() => setActiveTab('info')}
              className={`flex-1 md:flex-initial flex items-center justify-center md:justify-start px-4 py-2.5 text-sm font-medium rounded-lg transition-all ${
                activeTab === 'info'
                  ? 'bg-white md:bg-slate-900 text-slate-950 md:text-white shadow-sm md:shadow-none'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <User className="h-4.5 w-4.5 mr-2.5 shrink-0" />
              Mes Informations
            </button>
            <button
              onClick={() => setActiveTab('password')}
              className={`flex-1 md:flex-initial flex items-center justify-center md:justify-start px-4 py-2.5 text-sm font-medium rounded-lg transition-all ${
                activeTab === 'password'
                  ? 'bg-white md:bg-slate-900 text-slate-950 md:text-white shadow-sm md:shadow-none'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Lock className="h-4.5 w-4.5 mr-2.5 shrink-0" />
              Sécurité & Accès
            </button>
          </div>
        </div>

        {/* Formulaires */}
        <div className="md:col-span-3">
          {activeTab === 'info' && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="border-b border-slate-100 bg-slate-50/50 px-6 py-4">
                <h3 className="font-semibold text-slate-900">Informations personnelles</h3>
                <p className="text-xs text-slate-500 mt-0.5">Ces informations permettent de vous identifier sur l'application.</p>
              </div>

              <form onSubmit={handleInfoSubmit} className="p-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Nom */}
                  <div className="flex flex-col space-y-1.5">
                    <label htmlFor="nom" className="text-xs font-semibold text-slate-700">Nom *</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <User className="h-4 w-4" />
                      </div>
                      <input
                        type="text"
                        name="nom"
                        id="nom"
                        value={infoForm.nom}
                        onChange={handleInfoChange}
                        required
                        placeholder="Ex: Kouassi"
                        className="w-full pl-9 pr-4 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-colors bg-white text-slate-900"
                      />
                    </div>
                  </div>

                  {/* Prénoms */}
                  <div className="flex flex-col space-y-1.5">
                    <label htmlFor="prenoms" className="text-xs font-semibold text-slate-700">Prénom(s)</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <User className="h-4 w-4" />
                      </div>
                      <input
                        type="text"
                        name="prenoms"
                        id="prenoms"
                        value={infoForm.prenoms}
                        onChange={handleInfoChange}
                        placeholder="Ex: Jean-Marc"
                        className="w-full pl-9 pr-4 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-colors bg-white text-slate-900"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Téléphone */}
                  <div className="flex flex-col space-y-1.5">
                    <label htmlFor="telephone" className="text-xs font-semibold text-slate-700">Téléphone *</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <Phone className="h-4 w-4" />
                      </div>
                      <input
                        type="tel"
                        name="telephone"
                        id="telephone"
                        value={infoForm.telephone}
                        onChange={handleInfoChange}
                        required
                        placeholder="Ex: +225 0102030405"
                        className="w-full pl-9 pr-4 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-colors bg-white text-slate-900"
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div className="flex flex-col space-y-1.5">
                    <label htmlFor="email" className="text-xs font-semibold text-slate-700">Adresse E-mail</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <Mail className="h-4 w-4" />
                      </div>
                      <input
                        type="email"
                        name="email"
                        id="email"
                        value={infoForm.email}
                        onChange={handleInfoChange}
                        placeholder="Ex: jean.marc@tourshop.com"
                        className="w-full pl-9 pr-4 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-colors bg-white text-slate-900"
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 italic">Note : Si vous changez d'e-mail, un code de vérification vous sera envoyé.</p>
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-slate-100">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex items-center px-4 py-2 text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Enregistrement...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" /> Sauvegarder
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'password' && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="border-b border-slate-100 bg-slate-50/50 px-6 py-4">
                <h3 className="font-semibold text-slate-900 flex items-center">
                  <KeyRound className="h-5 w-5 mr-2 text-slate-500" /> Sécurité du compte
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Modifier votre mot de passe pour sécuriser votre accès.</p>
              </div>

              <div className="bg-amber-50 border-l-4 border-amber-500 p-4 m-6 rounded-r-lg flex items-start space-x-3">
                <ShieldAlert className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-800">
                  <span className="font-semibold">Attention :</span> Après avoir changé votre mot de passe avec succès, toutes vos sessions actives (y compris celle-ci) seront déconnectées pour des raisons de sécurité. Vous devrez vous reconnecter avec votre nouveau mot de passe.
                </div>
              </div>

              <form onSubmit={handlePasswordSubmit} className="px-6 pb-6 space-y-4">
                {/* Mot de passe actuel */}
                <div className="flex flex-col space-y-1.5">
                  <label htmlFor="current_password" className="text-xs font-semibold text-slate-700">Mot de passe actuel *</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Lock className="h-4 w-4" />
                    </div>
                    <input
                      type={showCurrentPass ? 'text' : 'password'}
                      name="current_password"
                      id="current_password"
                      value={passwordForm.current_password}
                      onChange={handlePasswordChange}
                      required
                      placeholder="Saisissez votre mot de passe actuel"
                      className="w-full pl-9 pr-10 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-colors bg-white text-slate-900"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPass(!showCurrentPass)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                    >
                      {showCurrentPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Nouveau mot de passe */}
                <div className="flex flex-col space-y-1.5">
                  <label htmlFor="password" className="text-xs font-semibold text-slate-700">Nouveau mot de passe *</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Lock className="h-4 w-4" />
                    </div>
                    <input
                      type={showNewPass ? 'text' : 'password'}
                      name="password"
                      id="password"
                      value={passwordForm.password}
                      onChange={handlePasswordChange}
                      required
                      placeholder="Minimum 8 caractères"
                      className="w-full pl-9 pr-10 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-colors bg-white text-slate-900"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPass(!showNewPass)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                    >
                      {showNewPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Confirmation */}
                <div className="flex flex-col space-y-1.5">
                  <label htmlFor="password_confirmation" className="text-xs font-semibold text-slate-700">Confirmer le nouveau mot de passe *</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Lock className="h-4 w-4" />
                    </div>
                    <input
                      type={showConfirmPass ? 'text' : 'password'}
                      name="password_confirmation"
                      id="password_confirmation"
                      value={passwordForm.password_confirmation}
                      onChange={handlePasswordChange}
                      required
                      placeholder="Répétez le nouveau mot de passe"
                      className="w-full pl-9 pr-10 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-colors bg-white text-slate-900"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPass(!showConfirmPass)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                    >
                      {showConfirmPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-slate-100">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex items-center px-4 py-2 text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Mise à jour...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" /> Changer le mot de passe
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
