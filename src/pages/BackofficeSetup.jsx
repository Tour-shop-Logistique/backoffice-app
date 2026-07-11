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
    Info,
    CheckCircle2,
    Navigation,
    Lock,
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
    const readOnly = !isAdmin && isConfigured;
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

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();

        if (!formData.nom_organisation || !formData.telephone) {
            dispatch(showNotification({ type: 'error', message: "Le nom de l'organisation et le téléphone sont obligatoires." }));
            return;
        }

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

    const inputBase = "w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-colors placeholder:text-slate-400 text-sm font-medium text-slate-900 disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed";
    const plainInputBase = "w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-colors placeholder:text-slate-400 text-sm font-medium text-slate-900 disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed";
    const labelBase = "text-sm font-semibold text-slate-700 flex items-center gap-1.5";

    return (
        <div className={isConfigured ? '' : 'max-w-3xl mx-auto'}>
            {!isConfigured && (
                <div className="mb-6 text-center space-y-2">
                    <div className="w-14 h-14 rounded-2xl bg-slate-900 text-white flex items-center justify-center mx-auto shadow-sm">
                        <Building2 size={26} />
                    </div>
                    <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">Bienvenue sur TourShop</h1>
                    <p className="text-slate-500 text-sm md:text-base max-w-md mx-auto">
                        Configurons votre backoffice. Ces informations pourront être modifiées plus tard depuis les Paramètres.
                    </p>
                </div>
            )}

            {readOnly && (
                <div className="mb-6 bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-xl flex items-center gap-3">
                    <Lock size={18} className="shrink-0" />
                    <p className="text-sm font-medium">Lecture seule — seul un administrateur peut modifier ces informations.</p>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Identité */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                            <Building size={18} />
                        </div>
                        <div>
                            <h2 className="font-semibold text-slate-900">Identité de l'organisation</h2>
                            <p className="text-xs text-slate-500">Le nom et les coordonnées de contact de votre backoffice</p>
                        </div>
                    </div>

                    <div className="p-6 space-y-5">
                        <div className="space-y-1.5">
                            <label className={labelBase}>Nom de l'organisation <span className="text-rose-500">*</span></label>
                            <div className="relative">
                                <Building className="h-4.5 w-4.5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    required
                                    name="nom_organisation"
                                    type="text"
                                    value={formData.nom_organisation}
                                    onChange={handleChange}
                                    placeholder="Ex: Tour Shop Logistics"
                                    className={inputBase}
                                    disabled={readOnly}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            <div className="space-y-1.5">
                                <label className={labelBase}>Téléphone <span className="text-rose-500">*</span></label>
                                <div className="relative">
                                    <Phone className="h-4.5 w-4.5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input
                                        required
                                        name="telephone"
                                        type="text"
                                        value={formData.telephone}
                                        onChange={handleChange}
                                        placeholder="+225 07 XX XX XX XX"
                                        className={inputBase}
                                        disabled={readOnly}
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className={labelBase}>Email</label>
                                <div className="relative">
                                    <Mail className="h-4.5 w-4.5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input
                                        name="email"
                                        type="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        placeholder="contact@tourshop.com"
                                        className={inputBase}
                                        disabled={readOnly}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Localisation */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                            <MapPin size={18} />
                        </div>
                        <div>
                            <h2 className="font-semibold text-slate-900">Localisation</h2>
                            <p className="text-xs text-slate-500">L'emplacement physique de votre bureau central</p>
                        </div>
                    </div>

                    <div className="p-6 space-y-5">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            <div className="space-y-1.5">
                                <label className={labelBase}>Pays <span className="text-rose-500">*</span></label>
                                <SearchableDropdown
                                    value={formData.pays}
                                    onChange={(value) => setFormData(prev => ({ ...prev, pays: value }))}
                                    options={countryList}
                                    placeholder="Sélectionner..."
                                    disabled={readOnly}
                                    themeColor="emerald"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className={labelBase}>Ville <span className="text-rose-500">*</span></label>
                                <input
                                    required
                                    name="ville"
                                    type="text"
                                    value={formData.ville}
                                    onChange={handleChange}
                                    placeholder="Ex: Dakar"
                                    className={plainInputBase}
                                    disabled={readOnly}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            <div className="space-y-1.5">
                                <label className={labelBase}>Commune / Secteur</label>
                                <input
                                    name="commune"
                                    type="text"
                                    value={formData.commune}
                                    onChange={handleChange}
                                    placeholder="Ex: Plateau"
                                    className={plainInputBase}
                                    disabled={readOnly}
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className={labelBase}>Adresse précise <span className="text-rose-500">*</span></label>
                                <input
                                    required
                                    name="adresse"
                                    type="text"
                                    value={formData.adresse}
                                    onChange={handleChange}
                                    placeholder="Numéro de porte, Immeuble..."
                                    className={plainInputBase}
                                    disabled={readOnly}
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                                <label className={labelBase}>Coordonnées GPS</label>
                                {gpsSuccess && (
                                    <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-full">
                                        <CheckCircle2 size={12} /> Position capturée
                                    </span>
                                )}
                            </div>
                            <div className="flex flex-col sm:flex-row gap-3">
                                <div className="relative flex-1">
                                    <Globe className="h-4.5 w-4.5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input
                                        name="localisation"
                                        type="text"
                                        value={formData.localisation}
                                        onChange={handleChange}
                                        placeholder="Latitude, Longitude"
                                        className={`${inputBase} font-mono text-xs`}
                                        disabled={readOnly}
                                    />
                                </div>
                                {!readOnly && (
                                    <button
                                        type="button"
                                        onClick={getLocation}
                                        className="px-5 py-3 bg-slate-50 border border-slate-200 text-slate-700 text-sm font-semibold rounded-xl hover:bg-slate-100 transition-colors flex items-center justify-center gap-2 shrink-0"
                                    >
                                        <Navigation size={16} />
                                        Détecter ma position
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {!readOnly && (
                    <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4">
                        <p className="text-xs text-slate-500 flex items-center gap-2">
                            <Info size={14} className="shrink-0" />
                            Les champs marqués <span className="text-rose-500 font-semibold">*</span> sont obligatoires
                        </p>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white text-sm font-semibold rounded-xl hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                        >
                            {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                            {isConfigured ? 'Enregistrer' : 'Finaliser la configuration'}
                        </button>
                    </div>
                )}
            </form>
        </div>
    );
};

export default BackofficeSetup;
