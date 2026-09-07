import React, { useState, useEffect } from 'react';

/**
 * Formulaire d'une seule tranche (km_min, km_max, montant) pour une
 * commune donnée. km_max vide = tranche illimitée vers le haut (dernière
 * tranche de la grille) - voir TarifEnlevementTrancheKm côté backend.
 */
const TarifEnlevementTrancheKmForm = ({ id = "tranche-km-form", onSubmit, initialData, communeId }) => {
  const [formData, setFormData] = useState({ km_min: '', km_max: '', montant: '' });

  useEffect(() => {
    if (initialData) {
      setFormData({
        id: initialData.id,
        km_min: (parseFloat(initialData.km_min) || 0).toString(),
        km_max: initialData.km_max != null ? parseFloat(initialData.km_max).toString() : '',
        montant: (parseFloat(initialData.montant) || 0).toString(),
      });
    }
  }, [initialData]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const submissionData = {
      commune_id: communeId,
      km_min: parseFloat(formData.km_min),
      km_max: formData.km_max === '' ? null : parseFloat(formData.km_max),
      montant: parseFloat(formData.montant),
    };
    if (formData.id) submissionData.id = formData.id;
    onSubmit(submissionData);
  };

  const inputClasses = "w-full px-3 py-2.5 border rounded-md focus:ring-2 focus:ring-violet-500 focus:border-violet-500 bg-white transition-all font-medium text-slate-800";
  const labelClasses = "block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5 ml-1";

  return (
    <form id={id} onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClasses}>Distance minimum (km)</label>
          <input
            type="number"
            value={formData.km_min}
            onChange={(e) => setFormData(prev => ({ ...prev, km_min: e.target.value }))}
            placeholder="Ex: 0"
            min="0"
            step="0.1"
            className={inputClasses}
            required
          />
        </div>
        <div>
          <label className={labelClasses}>Distance maximum (km)</label>
          <input
            type="number"
            value={formData.km_max}
            onChange={(e) => setFormData(prev => ({ ...prev, km_max: e.target.value }))}
            placeholder="Vide = illimité"
            min="0"
            step="0.1"
            className={inputClasses}
          />
          <p className="text-xs text-slate-400 mt-1 ml-1">Laisser vide pour la dernière tranche (illimitée).</p>
        </div>
      </div>

      <div>
        <label className={labelClasses}>Montant (FCFA)</label>
        <input
          type="number"
          value={formData.montant}
          onChange={(e) => setFormData(prev => ({ ...prev, montant: e.target.value }))}
          placeholder="Ex: 1500"
          min="0"
          className={inputClasses}
          required
        />
      </div>
    </form>
  );
};

export default TarifEnlevementTrancheKmForm;
