import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { fetchBackofficeConfig } from '../redux/slices/backofficeSlice';
import { showNotification } from '../redux/slices/uiSlice';
import {
    Globe,
    Save,
    Loader2,
    MapPin,
    Building,
    MessageCircle,
    Mail,
    Info,
    CheckCircle2,
    Navigation,
    Lock,
} from 'lucide-react';
import SearchableDropdown from '../components/common/SearchableDropdown';
import PhoneInput from '../components/common/PhoneInput';
import { COUNTRY_OPTIONS } from '../utils/countries';
import { splitPhoneNumber, joinPhoneNumber } from '../utils/phoneCountries';
import { CURRENCY_OPTIONS } from '../utils/format';

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
        localisation: '',
        adresse: '',
        ville: '',
        code_pays: 'SN',
        devise: 'XOF',
        email: '',
    });

    // Téléphone et WhatsApp restent chacun un seul champ côté backend
    // (Backoffice.telephone / Backoffice.whatsapp), mais s'affichent en deux
    // parties (indicatif + numéro local, voir PhoneInput) - fusionnées avant
    // l'envoi (voir handleSubmit) et séparées ici au chargement de la config.
    const [telDialCode, setTelDialCode] = useState('');
    const [telLocalNumber, setTelLocalNumber] = useState('');
    const [waDialCode, setWaDialCode] = useState('');
    const [waLocalNumber, setWaLocalNumber] = useState('');

    useEffect(() => {
        if (config) {
            setFormData({
                nom_organisation: config.nom_organisation || config.nom || '',
                localisation: config.localisation || '',
                adresse: config.adresse || '',
                ville: config.ville || '',
                code_pays: config.code_pays || 'SN',
                devise: config.devise || 'XOF',
                email: config.email || '',
            });
            const tel = splitPhoneNumber(config.telephone);
            setTelDialCode(tel.dialCode);
            setTelLocalNumber(tel.localNumber);
            const wa = splitPhoneNumber(config.whatsapp);
            setWaDialCode(wa.dialCode);
            setWaLocalNumber(wa.localNumber);
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

        if (!formData.nom_organisation || !telDialCode || !telLocalNumber) {
            dispatch(showNotification({ type: 'error', message: "Le nom de l'organisation et le téléphone (avec indicatif) sont obligatoires." }));
            return;
        }

        if (!formData.code_pays || !formData.ville) {
            dispatch(showNotification({ type: 'error', message: "Veuillez remplir les informations de localisation obligatoires." }));
            return;
        }

        const payload = {
            ...formData,
            telephone: joinPhoneNumber(telDialCode, telLocalNumber),
            whatsapp: joinPhoneNumber(waDialCode, waLocalNumber) || null,
        };

        setIsLoading(true);
        try {
            if (isConfigured) {
                await api.put('/backoffice/update', payload);
                dispatch(showNotification({ type: 'success', message: 'Paramètres mis à jour !' }));
            } else {
                await api.post('/backoffice/setup', payload);
                dispatch(showNotification({ type: 'success', message: 'Configuration réussie !' }));
            }

            await dispatch(fetchBackofficeConfig()).unwrap();

            if (!isConfigured) {
                navigate('/');
            }
        } catch (error) {
            console.error(error);
            // En 422, `errors` porte le détail champ par champ (format Laravel
            // standard) - le message générique seul ("Erreur de validation des
            // données.") ne dit jamais ce qui a réellement échoué.
            const fieldErrors = error.response?.data?.errors;
            const firstFieldMessage = fieldErrors && typeof fieldErrors === 'object' && !Array.isArray(fieldErrors)
                ? Object.values(fieldErrors)[0]?.[0]
                : null;
            dispatch(showNotification({
                type: 'error',
                message: firstFieldMessage || error.response?.data?.message || 'Une erreur est survenue.'
            }));
        } finally {
            setIsLoading(false);
        }
    };

    const inputBase = "w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-colors placeholder:text-slate-400 text-sm font-medium text-slate-900 disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed";
    const plainInputBase = "w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-colors placeholder:text-slate-400 text-sm font-medium text-slate-900 disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed";
    const labelBase = "text-sm font-semibold text-slate-700 flex items-center gap-1.5";

    return (
        <div>
            {!isConfigured && (
                <div className="mb-8 text-center space-y-1.5">
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
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
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
                                <PhoneInput
                                    dialCode={telDialCode}
                                    localNumber={telLocalNumber}
                                    onDialCodeChange={setTelDialCode}
                                    onLocalNumberChange={setTelLocalNumber}
                                    inputClassName={plainInputBase}
                                    disabled={readOnly}
                                />
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

                        <div className="space-y-1.5">
                            <label className={labelBase}><MessageCircle size={14} className="text-emerald-600" /> WhatsApp <span className="text-xs font-normal text-slate-400">(optionnel)</span></label>
                            <PhoneInput
                                dialCode={waDialCode}
                                localNumber={waLocalNumber}
                                onDialCodeChange={setWaDialCode}
                                onLocalNumberChange={setWaLocalNumber}
                                required={false}
                                inputClassName={plainInputBase}
                                disabled={readOnly}
                            />
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
                                    value={formData.code_pays}
                                    onChange={(code) => setFormData(prev => ({ ...prev, code_pays: code }))}
                                    options={COUNTRY_OPTIONS.map((c) => ({ label: c.label, value: c.id }))}
                                    placeholder="Sélectionner..."
                                    disabled={readOnly}
                                    themeColor="emerald"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className={labelBase}>Devise <span className="text-rose-500">*</span></label>
                                <SearchableDropdown
                                    value={formData.devise}
                                    onChange={(code) => setFormData(prev => ({ ...prev, devise: code }))}
                                    options={CURRENCY_OPTIONS}
                                    placeholder="Sélectionner..."
                                    disabled={readOnly}
                                    themeColor="emerald"
                                />
                                <p className="text-[11px] text-slate-400">Préremplie selon le pays, modifiable si besoin.</p>
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

                        <div className="space-y-1.5">
                            <label className={labelBase}>Adresse précise</label>
                            <input
                                name="adresse"
                                type="text"
                                value={formData.adresse}
                                onChange={handleChange}
                                placeholder="Numéro de porte, Immeuble..."
                                className={plainInputBase}
                                disabled={readOnly}
                            />
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
                </div>

                {!readOnly && (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4">
                        <p className="text-xs text-slate-500 flex items-center gap-2">
                            <Info size={14} className="shrink-0" />
                            Les champs marqués <span className="text-rose-500 font-semibold">*</span> sont obligatoires
                        </p>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-slate-900 text-white text-sm font-semibold rounded-xl hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
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
