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
} from 'lucide-react';
import { updateUserProfile, changeUserPassword } from '../redux/slices/authSlice';
import { showNotification } from '../redux/slices/uiSlice';
import profileService from '../services/profileService';

const ProfilePage = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

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
      <div className="flex flex-col items-center justify-center min-h-[40vh] space-y-3">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
        <p className="text-slate-500 text-sm font-medium">Chargement de votre profil...</p>
      </div>
    );
  }

  const getRoleBadge = (role) => {
    switch (role) {
      case 'is_backoffice_admin':
        return { label: 'Administrateur', className: 'bg-indigo-50 text-indigo-700 border-indigo-200' };
      case 'is_backoffice_agent':
        return { label: 'Agent Logistique', className: 'bg-slate-100 text-slate-700 border-slate-200' };
      default:
        return { label: 'Agent', className: 'bg-slate-100 text-slate-700 border-slate-200' };
    }
  };

  const roleBadge = getRoleBadge(user?.role);
  const initials = `${infoForm.nom?.[0] || ''}${infoForm.prenoms?.[0] || ''}`.toUpperCase() || 'U';

  const inputBase = "w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-colors placeholder:text-slate-400 text-sm font-medium text-slate-900";
  const labelBase = "text-sm font-semibold text-slate-700 flex items-center gap-1.5";

  return (
    <div>
      {/* Carte identité */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-6 flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-slate-900 text-white flex items-center justify-center text-xl font-bold shrink-0">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-lg font-bold text-slate-900 truncate">
            {infoForm.nom} {infoForm.prenoms}
          </p>
          <p className="text-sm text-slate-500 truncate">{infoForm.email || 'Aucun e-mail renseigné'}</p>
        </div>
        <span className={`px-3 py-1.5 text-xs font-semibold rounded-full border w-fit ${roleBadge.className}`}>
          {roleBadge.label}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Navigation Onglets */}
        <div className="md:col-span-1">
          <div className="flex flex-row md:flex-col gap-2 bg-white p-1.5 rounded-xl border border-slate-200 shadow-sm">
            <button
              onClick={() => setActiveTab('info')}
              className={`flex-1 md:flex-initial flex items-center justify-center md:justify-start gap-2.5 px-4 py-2.5 text-sm font-semibold rounded-lg transition-all ${
                activeTab === 'info'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <User size={16} className="shrink-0" />
              Mes informations
            </button>
            <button
              onClick={() => setActiveTab('password')}
              className={`flex-1 md:flex-initial flex items-center justify-center md:justify-start gap-2.5 px-4 py-2.5 text-sm font-semibold rounded-lg transition-all ${
                activeTab === 'password'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Lock size={16} className="shrink-0" />
              Sécurité & accès
            </button>
          </div>
        </div>

        {/* Formulaires */}
        <div className="md:col-span-3">
          {activeTab === 'info' && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                  <User size={18} />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">Informations personnelles</h3>
                  <p className="text-xs text-slate-500">Ces informations permettent de vous identifier sur l'application</p>
                </div>
              </div>

              <form onSubmit={handleInfoSubmit} className="p-6 space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label htmlFor="nom" className={labelBase}>Nom <span className="text-rose-500">*</span></label>
                    <div className="relative">
                      <User className="h-4.5 w-4.5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        name="nom"
                        id="nom"
                        value={infoForm.nom}
                        onChange={handleInfoChange}
                        required
                        placeholder="Ex: Kouassi"
                        className={inputBase}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="prenoms" className={labelBase}>Prénom(s)</label>
                    <div className="relative">
                      <User className="h-4.5 w-4.5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        name="prenoms"
                        id="prenoms"
                        value={infoForm.prenoms}
                        onChange={handleInfoChange}
                        placeholder="Ex: Jean-Marc"
                        className={inputBase}
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label htmlFor="telephone" className={labelBase}>Téléphone <span className="text-rose-500">*</span></label>
                    <div className="relative">
                      <Phone className="h-4.5 w-4.5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="tel"
                        name="telephone"
                        id="telephone"
                        value={infoForm.telephone}
                        onChange={handleInfoChange}
                        required
                        placeholder="Ex: +225 0102030405"
                        className={inputBase}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="email" className={labelBase}>Adresse e-mail</label>
                    <div className="relative">
                      <Mail className="h-4.5 w-4.5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="email"
                        name="email"
                        id="email"
                        value={infoForm.email}
                        onChange={handleInfoChange}
                        placeholder="Ex: jean.marc@tourshop.com"
                        className={inputBase}
                      />
                    </div>
                  </div>
                </div>
                <p className="text-xs text-slate-500 -mt-2">Si vous changez d'e-mail, un code de vérification vous sera envoyé.</p>

                <div className="flex justify-end pt-4 border-t border-slate-100">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white text-sm font-semibold rounded-xl hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 size={18} className="animate-spin" /> Enregistrement...
                      </>
                    ) : (
                      <>
                        <Save size={18} /> Sauvegarder
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'password' && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                  <KeyRound size={18} />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">Sécurité du compte</h3>
                  <p className="text-xs text-slate-500">Modifiez votre mot de passe pour sécuriser votre accès</p>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 text-amber-800 mx-6 mt-6 p-4 rounded-xl flex items-start gap-3">
                <ShieldAlert size={18} className="shrink-0 mt-0.5" />
                <p className="text-xs font-medium">
                  Après le changement de mot de passe, toutes vos sessions actives (y compris celle-ci) seront déconnectées. Vous devrez vous reconnecter avec votre nouveau mot de passe.
                </p>
              </div>

              <form onSubmit={handlePasswordSubmit} className="p-6 space-y-5">
                {/* Mot de passe actuel */}
                <div className="space-y-1.5">
                  <label htmlFor="current_password" className={labelBase}>Mot de passe actuel <span className="text-rose-500">*</span></label>
                  <div className="relative">
                    <Lock className="h-4.5 w-4.5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type={showCurrentPass ? 'text' : 'password'}
                      name="current_password"
                      id="current_password"
                      value={passwordForm.current_password}
                      onChange={handlePasswordChange}
                      required
                      placeholder="Saisissez votre mot de passe actuel"
                      className={`${inputBase} pr-11`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPass(!showCurrentPass)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showCurrentPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Nouveau mot de passe */}
                <div className="space-y-1.5">
                  <label htmlFor="password" className={labelBase}>Nouveau mot de passe <span className="text-rose-500">*</span></label>
                  <div className="relative">
                    <Lock className="h-4.5 w-4.5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type={showNewPass ? 'text' : 'password'}
                      name="password"
                      id="password"
                      value={passwordForm.password}
                      onChange={handlePasswordChange}
                      required
                      placeholder="Minimum 8 caractères"
                      className={`${inputBase} pr-11`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPass(!showNewPass)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showNewPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Confirmation */}
                <div className="space-y-1.5">
                  <label htmlFor="password_confirmation" className={labelBase}>Confirmer le nouveau mot de passe <span className="text-rose-500">*</span></label>
                  <div className="relative">
                    <Lock className="h-4.5 w-4.5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type={showConfirmPass ? 'text' : 'password'}
                      name="password_confirmation"
                      id="password_confirmation"
                      value={passwordForm.password_confirmation}
                      onChange={handlePasswordChange}
                      required
                      placeholder="Répétez le nouveau mot de passe"
                      className={`${inputBase} pr-11`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPass(!showConfirmPass)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showConfirmPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-slate-100">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white text-sm font-semibold rounded-xl hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 size={18} className="animate-spin" /> Mise à jour...
                      </>
                    ) : (
                      <>
                        <Save size={18} /> Changer le mot de passe
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
