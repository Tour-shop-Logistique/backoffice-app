import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { fetchBackofficeConfig } from '../redux/slices/backofficeSlice';
import { showNotification } from '../redux/slices/uiSlice';
import {
    Globe,
    Building2,
    Save,
    Loader2,
    MapPin,
    Building,
    Phone,
    Mail,
    ChevronDown,
    ChevronRight,
    ChevronLeft,
    Info,
    CheckCircle2,
    Search
} from 'lucide-react';
import SearchableDropdown from '../components/common/SearchableDropdown';

const countryList = [
    "Côte d'Ivoire", "Guinée", "Guinée Bissau", "France", "Belgique", "Suisse",
    "Sénégal", "Mali", "Burkina Faso", "Nigeria", "Ghana", "Togo", "Bénin",
    "Guinée Équatoriale", "Cameroun", "Gabon", "Congo", "Zambie", "Zaire",
    "Zimbabwe", "Maroc", "Tunisie", "Algérie", "Canada", "États-Unis",
];

const BackofficeSetup = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { config, isConfigured } = useSelector((state) => state.backoffice);
    const { user } = useSelector((state) => state.auth);

    const isAdmin = user?.role === 'is_backoffice_admin';
    const [step, setStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [gpsSuccess, setGpsSuccess] = useState(false);

    const [formData, setFormData] = useState({
        nom_organisation: '',
        telephone: '',
        localisation: '',
        adresse: '',
        ville: '',
        commune: '',
        pays: 'Sénégal',
        email: '',
    });

    useEffect(() => {
        if (config) {
            setFormData({
                nom_organisation: config.nom_organisation || config.nom || '',
                telephone: config.telephone || '',
                localisation: config.localisation || '',
                adresse: config.adresse || '',
                ville: config.ville || '',
                commune: config.commune || '',
                pays: config.pays || 'Sénégal',
                email: config.email || '',
            });
        }
    }, [config]);

    const getLocation = () => {
        setGpsSuccess(false);
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    setFormData((prev) => ({ ...prev, localisation: `${latitude},${longitude}` }));
                    setGpsSuccess(true);
                    setTimeout(() => setGpsSuccess(false), 3000);
                },
                () => {
                    dispatch(showNotification({ type: 'error', message: "Impossible de récupérer la localisation." }));
                }
            );
        } else {
            dispatch(showNotification({ type: 'error', message: "La géolocalisation n'est pas supportée." }));
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const nextStep = () => {
        if (step === 1) {
            if (!formData.nom_organisation || !formData.telephone) {
                dispatch(showNotification({ type: 'error', message: "Veuillez remplir tous les champs obligatoires." }));
                return;
            }
        }
        setStep(step + 1);
    };

    const prevStep = () => setStep(step - 1);

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();

        // Validation finale
        if (!formData.pays || !formData.ville || !formData.adresse) {
            dispatch(showNotification({ type: 'error', message: "Veuillez remplir les informations de localisation obligatoires." }));
            return;
        }

        setIsLoading(true);
        try {
            if (isConfigured) {
                await api.put('/backoffice/update', formData);
                dispatch(showNotification({ type: 'success', message: 'Paramètres mis à jour !' }));
            } else {
                await api.post('/backoffice/setup', formData);
                dispatch(showNotification({ type: 'success', message: 'Configuration réussie !' }));
            }

            await dispatch(fetchBackofficeConfig()).unwrap();

            if (!isConfigured) {
                navigate('/');
            }
        } catch (error) {
            console.error(error);
            dispatch(showNotification({
                type: 'error',
                message: error.response?.data?.message || 'Une erreur est survenue.'
            }));
        } finally {
            setIsLoading(false);
        }
    };

    const inputBase = "w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-slate-900/5 focus:border-slate-900 outline-none transition-all placeholder:text-slate-400 text-sm font-medium text-slate-700 disabled:opacity-70 disabled:cursor-not-allowed";
    const labelBase = "text-xs font-bold text-slate-700 ml-1 uppercase tracking-wider block mb-1.5";

    return (
        <div className="min-h-screen py-2 px-4 flex items-start justify-center">
            <div className="w-full max-w-4xl bg-white rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-slate-100 overflow-hidden transition-all duration-300">
                {/* Header with Premium Gradient */}
                <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 md:p-10 p-6 pb-16 text-white relative">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -mr-32 -mt-32"></div>

                    <div className="flex flex-col md:flex-row md:items-center gap-4 relative z-10">
                        <div className="w-16 h-16 bg-white/10 rounded-xl border border-white/20 flex items-center justify-center backdrop-blur-md shrink-0 shadow-xl self-start">
                            <Building2 size={32} className="text-blue-400" />
                        </div>
                        <div className="space-y-1">
                            <h1 className="md:text-3xl text-2xl font-bold tracking-tight">
                                {isConfigured ? 'Paramètres' : 'Configuration'}
                            </h1>
                            <p className="text-slate-400 md:text-base text-sm font-medium flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                                {isConfigured ? 'Administration de la structure' : 'Finalisation de votre espace'}
                            </p>
                        </div>
                    </div>

                    {/* Enhanced Stepper */}
                    <div className="mt-8 flex items-center gap-4 relative z-10">
                        <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-blue-600 to-blue-400 transition-all duration-700 ease-out"
                                style={{ width: `${(step / 2) * 100}%` }}
                            ></div>
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-blue-400 bg-blue-400/10 px-2 py-1 rounded-md">
                            Étape {step}/2
                        </span>
                    </div>
                </div>

                <div className="md:p-10 p-6 -mt-4 bg-white relative z-20 shadow-[0_-10px_20px_rgba(0,0,0,0.05)] space-y-8">
                    {!isAdmin && isConfigured && (
                        <div className="bg-amber-50 border border-amber-100 text-amber-700 px-4 py-2 rounded-xl flex items-center gap-4 animate-in fade-in zoom-in-95 duration-500">
                            <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                                <Info size={20} />
                            </div>
                            <div>
                                <p className="text-xs font-bold uppercase tracking-wide">Mode Lecture Seule</p>
                            </div>
                        </div>
                    )}

                    {/* STEP 1: IDENTITY */}
                    {step === 1 && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="space-y-1">
                                <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-3">
                                    <span className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs">1</span>
                                    Identité du Backoffice
                                </h2>
                                <p className="text-slate-500 text-sm font-medium">Renseignez les informations d'identification de votre structure.</p>
                            </div>

                            <div className="grid grid-cols-1 gap-8">
                                <div className="space-y-2">
                                    <label className={labelBase}>Nom de l'organisation <span className="text-blue-500">*</span></label>
                                    <div className="group relative">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors">
                                            <Building className="h-5 w-5" />
                                        </div>
                                        <input
                                            required
                                            name="nom_organisation"
                                            type="text"
                                            value={formData.nom_organisation}
                                            onChange={handleChange}
                                            placeholder="Ex: Tour Shop Logistics"
                                            className={`${inputBase} pl-12 h-14 text-base font-semibold shadow-sm`}
                                            disabled={!isAdmin && isConfigured}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className={labelBase}>Téléphone <span className="text-blue-500">*</span></label>
                                        <div className="group relative">
                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors">
                                                <Phone className="h-5 w-5" />
                                            </div>
                                            <input
                                                required
                                                name="telephone"
                                                type="text"
                                                value={formData.telephone}
                                                onChange={handleChange}
                                                placeholder="+225 07 XX XX XX XX"
                                                className={`${inputBase} pl-12 h-14`}
                                                disabled={!isAdmin && isConfigured}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className={labelBase}>Email (Optionnel)</label>
                                        <div className="group relative">
                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors">
                                                <Mail className="h-5 w-5" />
                                            </div>
                                            <input
                                                name="email"
                                                type="email"
                                                value={formData.email}
                                                onChange={handleChange}
                                                placeholder="contact@tourshop.com"
                                                className={`${inputBase} pl-12 h-14`}
                                                disabled={!isAdmin && isConfigured}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* STEP 2: LOCATION */}
                    {step === 2 && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="space-y-1">
                                <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-3">
                                    <span className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs">2</span>
                                    Localisation Géographique
                                </h2>
                                <p className="text-slate-500 text-sm font-medium">Précisez l'emplacement physique de votre bureau central.</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                                <div className="space-y-2">
                                    <label className={labelBase}>Pays <span className="text-blue-500">*</span></label>
                                    <SearchableDropdown
                                        value={formData.pays}
                                        onChange={(value) => setFormData(prev => ({ ...prev, pays: value }))}
                                        options={countryList}
                                        placeholder="Sélectionner..."
                                        disabled={!isAdmin && isConfigured}
                                        themeColor="blue"
                                        className="h-14"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className={labelBase}>Ville <span className="text-blue-500">*</span></label>
                                    <div className="relative">
                                        <input
                                            required
                                            name="ville"
                                            type="text"
                                            value={formData.ville}
                                            onChange={handleChange}
                                            placeholder="Ex: Dakar"
                                            className={`${inputBase} h-14`}
                                            disabled={!isAdmin && isConfigured}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className={labelBase}>Commune / Secteur</label>
                                    <input
                                        name="commune"
                                        type="text"
                                        value={formData.commune}
                                        onChange={handleChange}
                                        placeholder="Ex: Plateau"
                                        className={`${inputBase} h-14`}
                                        disabled={!isAdmin && isConfigured}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className={labelBase}>Adresse précise <span className="text-blue-500">*</span></label>
                                    <input
                                        required
                                        name="adresse"
                                        type="text"
                                        value={formData.adresse}
                                        onChange={handleChange}
                                        placeholder="Numéro de porte, Immeuble..."
                                        className={`${inputBase} h-14`}
                                        disabled={!isAdmin && isConfigured}
                                    />
                                </div>

                                <div className="md:col-span-2 space-y-2">
                                    <div className="flex items-center justify-between px-1">
                                        <label className={labelBase}>Coordonnées GPS</label>
                                        {gpsSuccess && (
                                            <span className="text-[10px] font-bold text-green-600 uppercase flex items-center gap-1.5 bg-green-50 px-2 py-0.5 rounded-full">
                                                <CheckCircle2 size={12} /> Position Capturée
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex flex-col sm:flex-row gap-3">
                                        <div className="relative flex-1">
                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                                                <MapPin className="h-5 w-5" />
                                            </div>
                                            <input
                                                name="localisation"
                                                type="text"
                                                value={formData.localisation}
                                                onChange={handleChange}
                                                placeholder="Latitude, Longitude"
                                                className={`${inputBase} pl-12 h-14 font-mono text-xs`}
                                                disabled={!isAdmin && isConfigured}
                                            />
                                        </div>
                                        {isAdmin && (
                                            <button
                                                type="button"
                                                onClick={getLocation}
                                                className="h-14 sm:px-6 px-4 bg-white border-2 border-slate-900 text-slate-900 text-[11px] font-bold uppercase tracking-wider rounded-xl hover:bg-slate-900 hover:text-white transition-all flex items-center justify-center gap-2"
                                            >
                                                <Search size={16} />
                                                Auto-détection
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Navigation Actions */}
                    <div className="pt-8 border-t border-slate-100 flex flex-col-reverse sm:flex-row items-center justify-between gap-4">
                        <div className="w-full sm:w-auto">
                            {step > 1 ? (
                                <button
                                    type="button"
                                    onClick={prevStep}
                                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 text-slate-500 font-bold uppercase tracking-widest text-[11px] hover:text-slate-900 transition-colors"
                                >
                                    <ChevronLeft size={18} />
                                    Retour
                                </button>
                            ) : (
                                isConfigured && (
                                    <button
                                        type="button"
                                        onClick={() => navigate(-1)}
                                        className="w-full sm:w-auto px-8 py-4 text-slate-400 font-bold uppercase tracking-widest text-[11px] hover:text-slate-900 transition-colors text-center"
                                    >
                                        Fermer
                                    </button>
                                )
                            )}
                        </div>

                        <div className="w-full sm:w-auto">
                            {step < 2 ? (
                                <button
                                    type="button"
                                    onClick={nextStep}
                                    className="w-full sm:w-auto bg-slate-900 text-white px-5 py-3 rounded-lg font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-3 hover:bg-slate-800 transition-all active:scale-[0.98]"
                                >
                                    Continuer
                                    <ChevronRight size={18} />
                                </button>
                            ) : (
                                isAdmin && (
                                    <button
                                        type="button"
                                        onClick={handleSubmit}
                                        disabled={isLoading}
                                        className="w-full sm:w-auto bg-blue-600 text-white px-10 py-5 rounded-lg font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-3 hover:bg-blue-700 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-blue-600/20"
                                    >
                                        {isLoading ? (
                                            <Loader2 size={20} className="animate-spin" />
                                        ) : (
                                            <Save size={20} />
                                        )}
                                        {isConfigured ? 'Sauvegarder' : 'Finaliser'}
                                    </button>
                                )
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BackofficeSetup;
