import React, { useState, useEffect } from 'react';
import { X, Globe2, MapPin, Tag } from 'lucide-react';
import SearchableDropdown from './SearchableDropdown';
import { COUNTRY_OPTIONS, getCountryName } from '../../utils/countries';

const ZoneForm = ({ id = "zone-form", onSubmit, onCancel, isLoading, initialData }) => {
  const [formData, setFormData] = useState({
    id: '',
    nom: '',
    paysCodes: [],
  });

  useEffect(() => {
    if (initialData) {
      // pays_codes est la source de vérité ; si une zone n'a pas encore été
      // migrée (pays_codes absent), on retombe sur un tableau vide plutôt
      // que d'afficher les anciens noms texte libre non fiables.
      setFormData({
        id: initialData.id || '',
        nom: initialData.nom || '',
        paysCodes: Array.isArray(initialData.pays_codes) ? [...initialData.pays_codes] : [],
      });
    }
  }, [initialData]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAddCountry = (code) => {
    if (code && !formData.paysCodes.includes(code)) {
      setFormData({
        ...formData,
        paysCodes: [...formData.paysCodes, code]
      });
    }
  };

  const removeCountry = (indexToRemove) => {
    setFormData({
      ...formData,
      paysCodes: formData.paysCodes.filter((_, index) => index !== indexToRemove)
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.paysCodes.length === 0) {
      alert('Veuillez ajouter au moins un pays.');
      return;
    }

    const dataToSubmit = initialData
      ? { id: formData.id, nom: formData.nom, pays_codes: formData.paysCodes }
      : { nom: formData.nom, pays_codes: formData.paysCodes };

    onSubmit(dataToSubmit);
  };

  return (
    <form id={id} onSubmit={handleSubmit} className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Afficher l'ID uniquement en mode édition */}
        {initialData && (
          <div className="space-y-1.5 sm:w-32 shrink-0">
            <label htmlFor="id" className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">
              <Tag className="h-3.5 w-3.5 text-indigo-400" />
              ID
            </label>
            <input
              id="id"
              name="id"
              type="text"
              value={formData.id}
              readOnly
              className="w-full border rounded-lg p-2.5 text-sm font-bold text-center outline-none transition-all bg-indigo-50 text-indigo-700 cursor-not-allowed border-indigo-100"
            />
          </div>
        )}

        <div className="space-y-1.5 flex-1">
          <label htmlFor="nom" className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">
            <MapPin className="h-3.5 w-3.5 text-indigo-400" />
            Nom de la Zone <span className="text-red-500">*</span>
          </label>
          <input
            id="nom"
            name="nom"
            type="text"
            value={formData.nom}
            onChange={handleChange}
            placeholder="Ex: Afrique de l'Ouest"
            className="w-full border border-slate-200 rounded-lg p-2.5 text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all bg-white"
            required
          />
        </div>
      </div>

      <div className="h-px bg-slate-100" />

      <div className="space-y-3">
        <div className="flex items-center justify-between ml-1">
          <label className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-widest">
            <Globe2 className="h-3.5 w-3.5 text-indigo-400" />
            Destinations (Pays) <span className="text-red-500">*</span>
          </label>
          <span className="inline-flex items-center text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full">
            {formData.paysCodes.length} pays
          </span>
        </div>

        <SearchableDropdown
          value=""
          onChange={handleAddCountry}
          options={COUNTRY_OPTIONS
            .filter((c) => !formData.paysCodes.includes(c.id))
            .map((c) => ({ label: c.label, value: c.id }))}
          placeholder="Rechercher un pays à ajouter..."
          themeColor="purple"
        />

        {/* Liste des pays ajoutés */}
        {formData.paysCodes.length === 0 ? (
          <div className="min-h-[280px] flex flex-col items-center justify-center gap-1 p-4 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-slate-400">
            <Globe2 className="h-8 w-8 mb-2 text-slate-300" />
            <p className="text-sm font-medium">Aucun pays ajouté pour le moment</p>
            <p className="text-xs">Utilisez le champ de recherche ci-dessus pour en ajouter</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2 min-h-[280px] max-h-[320px] overflow-y-auto custom-scrollbar pr-1 content-start">
            {formData.paysCodes.map((code, index) => (
              <div
                key={code}
                className="flex items-center justify-between gap-2 p-2 rounded-lg bg-indigo-50/60 border border-indigo-100 group hover:border-indigo-300 hover:bg-indigo-50 transition-colors"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Globe2 className="h-4 w-4 text-indigo-400 shrink-0" />
                  <span className="text-sm font-semibold text-indigo-900 truncate">{getCountryName(code)}</span>
                </div>
                <button
                  type="button"
                  onClick={() => removeCountry(index)}
                  className="shrink-0 p-1 text-indigo-300 hover:text-rose-500 hover:bg-rose-50 rounded-md transition-all"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </form>
  );
};

export default ZoneForm;
