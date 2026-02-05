import React, { useState, useEffect } from 'react';
import { Plus, X, Globe, Loader2 } from 'lucide-react';

const ZoneForm = ({ onSubmit, onCancel, isLoading, initialData }) => {
  const [formData, setFormData] = useState({
    id: '',
    nom: '',
    pays: [],
  });
  const [countryInput, setCountryInput] = useState('');

  useEffect(() => {
    if (initialData) {
      setFormData({
        id: initialData.id || '',
        nom: initialData.nom || '',
        pays: Array.isArray(initialData.pays) ? [...initialData.pays] : [],
      });
    }
  }, [initialData]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAddCountry = (e) => {
    e.preventDefault();
    const country = countryInput.trim();
    if (country && !formData.pays.includes(country)) {
      setFormData({
        ...formData,
        pays: [...formData.pays, country]
      });
      setCountryInput('');
    }
  };

  const removeCountry = (indexToRemove) => {
    setFormData({
      ...formData,
      pays: formData.pays.filter((_, index) => index !== indexToRemove)
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.pays.length === 0) {
      alert('Veuillez ajouter au moins un pays.');
      return;
    }
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-1.5">
        <label htmlFor="id" className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">
          ID de la Zone <span className="text-red-500">*</span>
        </label>
        <input
          id="id"
          name="id"
          type="text"
          value={formData.id}
          onChange={handleChange}
          readOnly={!!initialData}
          placeholder="Ex: ZONE_A"
          className={`w-full border rounded-lg p-2.5 text-sm font-medium outline-none transition-all ${!!initialData
            ? 'bg-slate-50 text-slate-400 cursor-not-allowed border-slate-200'
            : 'bg-white border-slate-200 focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500'
            }`}
          required
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="nom" className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">
          Nom de la Zone <span className="text-red-500">*</span>
        </label>
        <input
          id="nom"
          name="nom"
          type="text"
          value={formData.nom}
          onChange={handleChange}
          placeholder="Ex: Afrique de l'Ouest"
          className="w-full border border-slate-200 rounded-lg p-2.5 text-sm font-medium focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all bg-white"
          required
        />
      </div>

      <div className="space-y-3">
        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">
          Destinations (Pays) <span className="text-red-500">*</span>
        </label>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={countryInput}
              onChange={(e) => setCountryInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddCountry(e)}
              placeholder="Entrez un pays..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
            />
          </div>
          <button
            type="button"
            onClick={handleAddCountry}
            className="px-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center shadow-sm shadow-indigo-200"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        {/* Liste des pays ajoutés */}
        <div className="min-h-[100px] p-3 bg-slate-50 border border-slate-100 rounded-xl overflow-hidden">
          {formData.pays.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center py-4 text-slate-400">
              <p className="text-[11px] font-medium italic">Aucun pays ajouté pour le moment</p>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {formData.pays.map((p, index) => (
                <div
                  key={index}
                  className="inline-flex items-center bg-white border border-slate-200 pl-2 pr-1 py-1 rounded-md shadow-sm group hover:border-indigo-200 transition-colors"
                >
                  <span className="text-xs font-semibold text-slate-600 mr-2">{p}</span>
                  <button
                    type="button"
                    onClick={() => removeCountry(index)}
                    className="p-0.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded transition-all"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end items-center space-x-4 pt-4 border-t border-slate-50">
        <button
          type="button"
          onClick={onCancel}
          className="text-xs font-bold text-slate-400 hover:text-slate-600 uppercase tracking-widest transition-colors"
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={isLoading || formData.pays.length === 0}
          className="px-6 py-2.5 bg-slate-900 text-white text-xs font-bold uppercase tracking-widest rounded-lg hover:bg-slate-800 transition-all flex items-center gap-2 shadow-lg shadow-slate-900/10 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
          {initialData ? 'Enregistrer' : 'Créer la zone'}
        </button>
      </div>
    </form>
  );
};

export default ZoneForm;
