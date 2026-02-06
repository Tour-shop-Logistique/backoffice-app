import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setConfigured } from '../../redux/slices/backofficeSlice';
import api from '../../services/api';
import { X, MapPin, Building, Phone, Mail, Globe, ChevronDown as LucideChevronDown, Info } from 'lucide-react';

const countryList = [
  "Côte d'Ivoire",
  "Guinée",
  "Guinée Bissau",
  "France",
  "Belgique",
  "Suisse",
  "Sénégal",
  "Mali",
  "Burkina Faso",
  "Nigeria",
  "Ghana",
  "Togo",
  "Bénin",
  "Guinée Équatoriale",
  "Cameroun",
  "Gabon",
  "Congo",
  "Zambie",
  "Zaire",
  "Zimbabwe",
  "Maroc",
  "Tunisie",
  "Algérie",
  "Canada",
  "États-Unis",
];


const SettingsModal = ({ closeModal }) => {
  const dispatch = useDispatch();
  const { config } = useSelector((state) => state.backoffice);
  const { user } = useSelector((state) => state.auth);

  const isAdmin = user?.role === 'is_backoffice_admin';
  const [formData, setFormData] = useState({
    nom_organisation: '',
    telephone: '',
    localisation: '',
    adresse: '',
    ville: '',
    commune: '',
    pays: '',
    email: '',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [gpsSuccess, setGpsSuccess] = useState(false);

  useEffect(() => {
    if (config) {
      setFormData(config);
    }
    setIsLoading(false);
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
        (err) => {
          setError("Impossible de récupérer la localisation. Veuillez l'entrer manuellement.");
        }
      );
    } else {
      setError("La géolocalisation n'est pas supportée par votre navigateur.");
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      if (config) {
        // Si une config existe, on met à jour
        await api.put('/backoffice/update', formData);
      } else {
        // Sinon, on crée
        await api.post('/backoffice/setup', formData);
      }
      dispatch(setConfigured(true));
      // On pourrait aussi vouloir rafraîchir les données après la sauvegarde
      // dispatch(fetchBackofficeConfig());
      if (closeModal) closeModal(); // closeModal peut ne pas être fourni si on force la config
    } catch (err) {
      setError('Erreur lors de la sauvegarde des paramètres.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white p-12 rounded-lg shadow-xl w-full max-w-lg mx-auto flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 border-4 border-slate-100 border-t-slate-900 rounded-full animate-spin"></div>
        <p className="text-slate-500 font-medium">Chargement des paramètres...</p>
      </div>
    );
  }

  const inputBase = "w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 outline-none transition-all placeholder:text-slate-400 text-sm font-medium text-slate-700";
  const sectionTitle = "text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-2";
  const microCopy = "text-[10px] text-slate-400 mb-4 font-medium italic";

  return (
    <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-auto overflow-hidden flex flex-col max-h-[90vh]">
      {/* Header cleanup: smaller, cleaner */}
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Configuration du backoffice</h2>
          <p className="text-xs text-slate-500">Mettez à jour les informations de votre stucture.</p>
        </div>
        <button
          onClick={closeModal}
          className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
        <div className="px-8 py-6 space-y-8 overflow-y-auto custom-scrollbar">
          {error && (
            <div className="bg-red-50 border border-red-100 text-red-700 px-4 py-3 rounded-lg flex items-center gap-3" role="alert">
              <span className="text-sm font-bold">L'opération a échoué :</span>
              <p className="text-xs">{error}</p>
            </div>
          )}

          {!isAdmin && (
            <div className="bg-blue-50 border border-blue-100 text-blue-700 px-4 py-3 rounded-lg flex items-center gap-3 mb-4">
              <Info size={18} className="shrink-0" />
              <div className="flex flex-col">
                <span className="text-sm font-bold uppercase tracking-wide">Mode Lecture Seule</span>
                <p className="text-xs">Seul un administrateur peut modifier ces informations.</p>
              </div>
            </div>
          )}

          {/* Section 1: Identité */}
          <section>
            <h3 className={sectionTitle}>
              <Building size={14} />
              Identité de l'agence
            </h3>
            <p className={microCopy}>Ces informations apparaîtront sur vos factures et documents officiels.</p>

            <div className="space-y-5">
              {/* Highlight prioritized field */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-700 ml-1 uppercase tracking-wide">Nom de l'organisation <span className="text-red-500">*</span></label>
                <div className="relative">
                  <Building className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    name="nom_organisation"
                    value={formData.nom_organisation}
                    onChange={handleChange}
                    placeholder="Ex: TousShop International Services"
                    className={`${inputBase} pl-10 text-base font-bold bg-white border-slate-300 py-3 shadow-sm ${!isAdmin ? 'opacity-70 bg-slate-50' : ''}`}
                    required
                    disabled={!isAdmin}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-700 ml-1 uppercase tracking-wide">Email Professionnel <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="contact@tousshop.com"
                      className={`${inputBase} pl-10 ${!isAdmin ? 'opacity-70 text-slate-500' : ''}`}
                      required
                      disabled={!isAdmin}
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-700 ml-1 uppercase tracking-wide">Ligne Téléphonique <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      name="telephone"
                      value={formData.telephone}
                      onChange={handleChange}
                      placeholder="+224 6XX XX XX XX"
                      className={`${inputBase} pl-10 ${!isAdmin ? 'opacity-70 text-slate-500' : ''}`}
                      required
                      disabled={!isAdmin}
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Section 2: Localisation */}
          <section>
            <h3 className={sectionTitle}>
              <MapPin size={14} />
              Localisation & Siège social
            </h3>
            <p className={microCopy}>Précisez l'emplacement physique de votre agence principale.</p>

            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-700 ml-1 uppercase tracking-wide">Pays <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 pointer-events-none" />
                    <select
                      name="pays"
                      value={formData.pays}
                      onChange={handleChange}
                      className={`${inputBase} pl-10 appearance-none cursor-pointer ${!isAdmin ? 'opacity-70 text-slate-500' : ''}`}
                      required
                      disabled={!isAdmin}
                    >
                      <option value="">Sélectionner</option>
                      {countryList.map((country) => (
                        <option key={country} value={country}>{country}</option>
                      ))}
                    </select>
                    <LucideChevronDown className="absolute right-3 top-3 h-4 w-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>
                <div className="space-y-1.5 md:col-span-1">
                  <label className="text-[11px] font-bold text-slate-700 ml-1 uppercase tracking-wide">Ville <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    name="ville"
                    value={formData.ville}
                    onChange={handleChange}
                    placeholder="Ex: Conakry"
                    className={`${inputBase} ${!isAdmin ? 'opacity-70 text-slate-500' : ''}`}
                    required
                    disabled={!isAdmin}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-700 ml-1 uppercase tracking-wide">Commune</label>
                  <input
                    type="text"
                    name="commune"
                    value={formData.commune}
                    onChange={handleChange}
                    placeholder="Ex: Kaloum"
                    className={`${inputBase} ${!isAdmin ? 'opacity-70 text-slate-500' : ''}`}
                    disabled={!isAdmin}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-700 ml-1 uppercase tracking-wide">Adresse précises (Rue/Quartier) <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  name="adresse"
                  value={formData.adresse}
                  onChange={handleChange}
                  placeholder="Ex: Rue KA 002, Secteur 4..."
                  className={`${inputBase} ${!isAdmin ? 'opacity-70 text-slate-500' : ''}`}
                  required
                  disabled={!isAdmin}
                />
              </div>

              {/* GPS with UX feedback */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-700 ml-1 uppercase tracking-wide flex justify-between">
                  Coordonnées GPS
                  {gpsSuccess && <span className="text-green-600 animate-pulse flex items-center gap-1 font-bold text-[9px] uppercase"><MapPin size={10} /> Position capturée !</span>}
                </label>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      name="localisation"
                      value={formData.localisation}
                      onChange={handleChange}
                      placeholder="Latitude, Longitude"
                      className={`${inputBase} pl-10 font-mono text-xs ${!isAdmin ? 'opacity-70 text-slate-500' : ''}`}
                      disabled={!isAdmin}
                    />
                  </div>
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={getLocation}
                      className={`px-4 py-2 text-xs font-bold rounded-lg transition-all border whitespace-nowrap ${gpsSuccess ? 'bg-green-600 border-green-600 text-white' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-900 hover:text-white hover:border-slate-900'}`}
                    >
                      Auto-détection
                    </button>
                  )}
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Sticky Footer */}
        <div className="px-8 py-5 border-t border-slate-100 bg-slate-50 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={closeModal}
            className="text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors uppercase tracking-widest"
          >
            {isAdmin ? 'Annuler les changements' : 'Fermer'}
          </button>

          {isAdmin && (
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={isLoading}
                className="px-6 py-2.5 bg-slate-900 text-white text-xs font-bold rounded-lg hover:bg-slate-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-widest shadow-lg shadow-slate-900/10"
              >
                {isLoading ? 'Enregistrement...' : 'Valider la configuration'}
              </button>
            </div>
          )}
        </div>
      </form>
    </div>
  );
};

export default SettingsModal;
