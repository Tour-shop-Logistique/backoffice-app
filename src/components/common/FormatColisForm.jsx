import React, { useState, useEffect } from 'react';

/**
 * Formulaire d'un format de colis (nom, ordre, seuils poids/dimensions,
 * format par défaut). Le volume n'est jamais saisi directement : le
 * backoffice renseigne longueur/largeur/hauteur max (affiché "L x l x H"
 * comme côté client/agence), le backend dérive volume_max automatiquement -
 * voir FormatColis::saving() côté backend. Le nom et l'ordre ne sont
 * modifiables qu'à la création : les changer après coup sur un format déjà
 * référencé par des colis/tarifs romprait la logique "le plus contraignant
 * gagne" - voir ExpeditionTarificationService::determinerFormatColis().
 */
const FormatColisForm = ({ id = "format-colis-form", onSubmit, initialData }) => {
  const [formData, setFormData] = useState({
    nom: '',
    ordre: '',
    poids_max: '',
    longueur_max: '',
    largeur_max: '',
    hauteur_max: '',
    is_default: false,
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        id: initialData.id,
        nom: initialData.nom || '',
        ordre: (initialData.ordre ?? '').toString(),
        poids_max: initialData.poids_max != null ? parseFloat(initialData.poids_max).toString() : '',
        longueur_max: initialData.longueur_max != null ? parseFloat(initialData.longueur_max).toString() : '',
        largeur_max: initialData.largeur_max != null ? parseFloat(initialData.largeur_max).toString() : '',
        hauteur_max: initialData.hauteur_max != null ? parseFloat(initialData.hauteur_max).toString() : '',
        is_default: Boolean(initialData.is_default),
      });
    }
  }, [initialData]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const submissionData = {
      nom: formData.nom,
      ordre: parseInt(formData.ordre, 10),
      poids_max: formData.poids_max === '' ? null : parseFloat(formData.poids_max),
      longueur_max: formData.longueur_max === '' ? null : parseFloat(formData.longueur_max),
      largeur_max: formData.largeur_max === '' ? null : parseFloat(formData.largeur_max),
      hauteur_max: formData.hauteur_max === '' ? null : parseFloat(formData.hauteur_max),
      is_default: formData.is_default,
    };
    if (formData.id) submissionData.id = formData.id;
    onSubmit(submissionData);
  };

  const inputClasses = "w-full px-3 py-2.5 border rounded-md focus:ring-2 focus:ring-violet-500 focus:border-violet-500 bg-white transition-all font-medium text-slate-800";
  const labelClasses = "block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5 ml-1";

  const volumeCalcule = (formData.longueur_max !== '' && formData.largeur_max !== '' && formData.hauteur_max !== '')
    ? (parseFloat(formData.longueur_max) || 0) * (parseFloat(formData.largeur_max) || 0) * (parseFloat(formData.hauteur_max) || 0)
    : null;

  return (
    <form id={id} onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className={labelClasses}>Nom du format</label>
        <input
          type="text"
          value={formData.nom}
          onChange={(e) => setFormData(prev => ({ ...prev, nom: e.target.value }))}
          placeholder="Ex: Très Grand"
          className={inputClasses}
          required
        />
      </div>

      <div>
        <label className={labelClasses}>Ordre (rang, 1 = le plus petit)</label>
        <input
          type="number"
          value={formData.ordre}
          onChange={(e) => setFormData(prev => ({ ...prev, ordre: e.target.value }))}
          placeholder="Ex: 4"
          min="1"
          step="1"
          className={inputClasses}
          required
        />
        <p className="text-xs text-slate-400 mt-1 ml-1">Détermine le rang du format entre poids et volume (le plus contraignant gagne).</p>
      </div>

      <div>
        <label className={labelClasses}>Poids maximum (kg)</label>
        <input
          type="number"
          value={formData.poids_max}
          onChange={(e) => setFormData(prev => ({ ...prev, poids_max: e.target.value }))}
          placeholder="Vide = illimité"
          min="0"
          step="0.1"
          className={inputClasses}
        />
      </div>

      <div>
        <label className={labelClasses}>Dimensions maximum (cm)</label>
        <div className="grid grid-cols-3 gap-2">
          <input
            type="number"
            value={formData.longueur_max}
            onChange={(e) => setFormData(prev => ({ ...prev, longueur_max: e.target.value }))}
            placeholder="Longueur"
            min="0"
            step="0.1"
            className={inputClasses}
          />
          <input
            type="number"
            value={formData.largeur_max}
            onChange={(e) => setFormData(prev => ({ ...prev, largeur_max: e.target.value }))}
            placeholder="Largeur"
            min="0"
            step="0.1"
            className={inputClasses}
          />
          <input
            type="number"
            value={formData.hauteur_max}
            onChange={(e) => setFormData(prev => ({ ...prev, hauteur_max: e.target.value }))}
            placeholder="Hauteur"
            min="0"
            step="0.1"
            className={inputClasses}
          />
        </div>
        <p className="text-xs text-slate-400 mt-1 ml-1">
          Laisser un champ vide (poids ou dimensions) pour le format le plus grand (aucune limite).
          {volumeCalcule !== null && (
            <span className="text-slate-500"> Volume calculé : <span className="font-semibold text-slate-600">{volumeCalcule.toLocaleString()} cm³</span></span>
          )}
        </p>
      </div>

      <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
        <button
          type="button"
          onClick={() => setFormData(prev => ({ ...prev, is_default: !prev.is_default }))}
          className={`relative w-10 h-5 rounded-full transition-colors duration-200 shrink-0 ${formData.is_default ? 'bg-slate-900' : 'bg-slate-300'}`}
        >
          <div className={`absolute top-0.5 left-0.5 bg-white w-4 h-4 rounded-full shadow-sm transform transition-transform duration-200 ${formData.is_default ? 'translate-x-5' : 'translate-x-0'}`} />
        </button>
        <div>
          <p className="text-sm font-semibold text-slate-800">Format par défaut</p>
          <p className="text-xs text-slate-500">Utilisé quand aucun format n'est précisé (un seul format par défaut à la fois).</p>
        </div>
      </div>
    </form>
  );
};

export default FormatColisForm;
