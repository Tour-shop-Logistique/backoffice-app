import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setConfigured } from '../../redux/slices/backofficeSlice';
import api from '../../services/api';
import { X, MapPin, Building, Phone, Mail, Globe, ChevronDown as LucideChevronDown } from 'lucide-react';

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

  useEffect(() => {
    if (config) {
      setFormData(config);
    }
    setIsLoading(false);
  }, [config]);

  const getLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setFormData((prev) => ({ ...prev, localisation: `${latitude},${longitude}` }));
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
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-2xl mx-auto flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-primary-100 border-t-primary-600 rounded-full animate-spin"></div>
        <p className="text-surface-600 font-medium">Chargement des paramètres...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-auto overflow-hidden animate-in zoom-in-95 duration-200">
      {/* Header */}
      <div className="px-8 py-3 border-b border-surface-100 flex items-center justify-between bg-surface-50">
        <div>
          <h2 className="text-xl font-bold text-surface-900">Paramètres de l'Agence</h2>
          <p className="text-sm text-surface-500 mt-1">Configurez les informations de votre organisation</p>
        </div>
        <button
          onClick={closeModal}
          className="p-2 text-surface-400 hover:text-surface-600 hover:bg-surface-200 rounded-lg transition-all"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="px-8 py-5">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center space-x-3 mb-6" role="alert">
            <span className="text-red-500">⚠️</span>
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-surface-700 ml-1">Nom de l'organisation</label>
              <div className="relative">
                <Building className="absolute left-3 top-2.5 h-4.5 w-4.5 text-surface-400" />
                <input
                  type="text"
                  name="nom_organisation"
                  value={formData.nom_organisation}
                  onChange={handleChange}
                  placeholder="Ex: Ma Super Agence"
                  className="w-full pl-10 pr-4 py-2.5 bg-surface-50 border border-surface-200 rounded-xl focus:ring-2 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all placeholder:text-surface-400"
                  required
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-surface-700 ml-1">Téléphone</label>
              <div className="relative">
                <Phone className="absolute left-3 top-2.5 h-4.5 w-4.5 text-surface-400" />
                <input
                  type="text"
                  name="telephone"
                  value={formData.telephone}
                  onChange={handleChange}
                  placeholder="+224 6XX XX XX XX"
                  className="w-full pl-10 pr-4 py-2.5 bg-surface-50 border border-surface-200 rounded-xl focus:ring-2 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all"
                  required
                />
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-surface-700 ml-1">Localisation GPS</label>
            <div className="flex items-center space-x-3">
              <div className="relative flex-1">
                <MapPin className="absolute left-3 top-2.5 h-4.5 w-4.5 text-surface-400" />
                <input
                  type="text"
                  name="localisation"
                  value={formData.localisation}
                  onChange={handleChange}
                  placeholder="Latitude, Longitude"
                  className="w-full pl-10 pr-4 py-2.5 bg-surface-50 border border-surface-200 rounded-xl focus:ring-2 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all"
                />
              </div>
              <button
                type="button"
                onClick={getLocation}
                className="px-4 py-2.5 bg-primary-50 text-primary-600 font-semibold rounded-xl hover:bg-primary-100 transition-all border border-primary-200 whitespace-nowrap"
              >
                Ma position
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-surface-700 ml-1">Adresse complète</label>
            <input
              type="text"
              name="adresse"
              value={formData.adresse}
              onChange={handleChange}
              placeholder="Rue, Quartier, Secteur..."
              className="w-full px-4 py-2.5 bg-surface-50 border border-surface-200 rounded-xl focus:ring-2 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-surface-700 ml-1">Ville</label>
              <input
                type="text"
                name="ville"
                value={formData.ville}
                onChange={handleChange}
                placeholder="Ville"
                className="w-full px-4 py-2.5 bg-surface-50 border border-surface-200 rounded-xl focus:ring-2 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all"
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-surface-700 ml-1">Commune</label>
              <input
                type="text"
                name="commune"
                value={formData.commune}
                onChange={handleChange}
                placeholder="Commune"
                className="w-full px-4 py-2.5 bg-surface-50 border border-surface-200 rounded-xl focus:ring-2 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-surface-700 ml-1">Pays</label>
              <div className="relative">
                <Globe className="absolute left-3 top-2.5 h-4.5 w-4.5 text-surface-400 pointer-events-none" />
                <select
                  name="pays"
                  value={formData.pays}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2.5 bg-surface-50 border border-surface-200 rounded-xl focus:ring-2 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all appearance-none cursor-pointer"
                  required
                >
                  <option value="">Sélectionner</option>
                  {countryList.map((country) => (
                    <option key={country} value={country}>{country}</option>
                  ))}
                </select>
                <LucideChevronDown className="absolute right-3 top-3 h-4 w-4 text-surface-400 pointer-events-none" />
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-surface-700 ml-1">Email de contact</label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 h-4.5 w-4.5 text-surface-400" />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="contact@agence.com"
                className="w-full pl-10 pr-4 py-2.5 bg-surface-50 border border-surface-200 rounded-xl focus:ring-2 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all"
                required
              />
            </div>
          </div>

          <div className="flex justify-end space-x-4 pt-4 border-t border-surface-100">
            <button
              type="button"
              onClick={closeModal}
              className="px-6 py-2.5 text-surface-600 font-semibold hover:bg-surface-100 rounded-xl transition-all"
            >
              Plus tard
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-8 py-2.5 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 shadow-lg shadow-primary-500/20 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Enregistrement...' : 'Sauvegarder les paramètres'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SettingsModal;
