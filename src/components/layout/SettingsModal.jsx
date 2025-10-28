import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setConfigured } from '../../redux/slices/backofficeSlice';
import api from '../../services/api';

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
      if(closeModal) closeModal(); // closeModal peut ne pas être fourni si on force la config
    } catch (err) {
      setError('Erreur lors de la sauvegarde des paramètres.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div>Chargement...</div>;
  }

  return (
    <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Paramètres du Backoffice</h2>
      
      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input type="text" name="nom_organisation" value={formData.nom_organisation} onChange={handleChange} placeholder="Nom de l'organisation" className="p-2 border rounded" />
          <input type="text" name="telephone" value={formData.telephone} onChange={handleChange} placeholder="Téléphone" className="p-2 border rounded" />
        </div>
        <div className="flex items-center space-x-2">
            <input type="text" name="localisation" value={formData.localisation} onChange={handleChange} placeholder="Localisation (latitude,longitude)" className="p-2 border rounded w-full" />
            <button type="button" onClick={getLocation} className="p-2 bg-blue-500 text-white rounded">Obtenir</button>
        </div>
        <input type="text" name="adresse" value={formData.adresse} onChange={handleChange} placeholder="Adresse" className="p-2 border rounded w-full" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input type="text" name="ville" value={formData.ville} onChange={handleChange} placeholder="Ville" className="p-2 border rounded" />
            <input type="text" name="commune" value={formData.commune} onChange={handleChange} placeholder="Commune" className="p-2 border rounded" />
            <input type="text" name="pays" value={formData.pays} onChange={handleChange} placeholder="Pays" className="p-2 border rounded" />
        </div>
        <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="Email de contact" className="p-2 border rounded w-full" />
        
        <div className="flex justify-end space-x-4 pt-4">
          <button type="button" onClick={closeModal} className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400">Annuler</button>
          <button type="submit" disabled={isLoading} className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-green-300">Sauvegarder</button>
        </div>
      </form>
    </div>
  );
};

export default SettingsModal;
