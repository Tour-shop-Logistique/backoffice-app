import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

/**
 * Formulaire commune : en édition (initialData fourni), un seul champ nom
 * classique. À la création, saisie groupée - une commune par ligne (ou
 * séparées par virgule), affichées en puces au fur et à mesure - pour
 * configurer d'un coup toutes les communes d'un pays plutôt qu'une par une.
 * onSubmit reçoit { nom } en édition, { noms: string[] } à la création.
 */
const CommuneForm = ({ id = "commune-form", onSubmit, initialData }) => {
  const isEditing = !!initialData;

  const [nom, setNom] = useState('');
  const [draft, setDraft] = useState('');
  const [noms, setNoms] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialData) {
      setNom(initialData.nom || '');
    }
  }, [initialData]);

  const addFromDraft = () => {
    // Une ligne peut elle-même contenir plusieurs communes séparées par
    // virgule (copier-coller depuis une liste existante).
    const candidats = draft
      .split(/[,\n]/)
      .map((v) => v.trim())
      .filter(Boolean);
    if (candidats.length === 0) return;

    setNoms((prev) => {
      const vus = new Set(prev.map((n) => n.toLowerCase()));
      const ajouts = candidats.filter((n) => !vus.has(n.toLowerCase()));
      return [...prev, ...ajouts];
    });
    setDraft('');
  };

  const handleDraftKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addFromDraft();
    }
  };

  const removeNom = (index) => {
    setNoms((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    if (isEditing) {
      onSubmit({ nom });
      return;
    }

    // Inclut ce qui reste tapé dans le champ (pas encore validé par Entrée)
    // au moment de la soumission - évite de perdre la dernière saisie.
    const restant = draft
      .split(/[,\n]/)
      .map((v) => v.trim())
      .filter(Boolean);
    const vus = new Set(noms.map((n) => n.toLowerCase()));
    const tous = [...noms, ...restant.filter((n) => !vus.has(n.toLowerCase()))];

    if (tous.length === 0) {
      setError('Ajoutez au moins une commune avant de valider.');
      return;
    }
    onSubmit({ noms: tous });
  };

  const inputClasses = "w-full px-3 py-2.5 border rounded-md focus:ring-2 focus:ring-violet-500 focus:border-violet-500 bg-white transition-all font-medium text-slate-800";
  const labelClasses = "block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5 ml-1";

  if (isEditing) {
    return (
      <form id={id} onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={labelClasses}>Nom de la commune</label>
          <input
            type="text"
            value={nom}
            onChange={(e) => setNom(e.target.value)}
            placeholder="Ex: Abidjan, Plateau ou Bouaké"
            className={inputClasses}
            required
          />
        </div>
      </form>
    );
  }

  return (
    <form id={id} onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className={labelClasses}>Communes à ajouter</label>
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleDraftKeyDown}
          onBlur={addFromDraft}
          placeholder={"Une commune par ligne, ou séparées par virgule\nEx: Abidjan, Plateau, Bouaké..."}
          rows={3}
          className={`${inputClasses} resize-none`}
        />
        <p className="text-xs text-slate-400 mt-1.5 ml-1">
          Appuyez sur Entrée ou virgule pour valider chaque commune.
        </p>
        {error && (
          <p className="text-xs font-semibold text-rose-600 mt-1.5 ml-1">{error}</p>
        )}
      </div>

      {noms.length > 0 && (
        <div>
          <label className={labelClasses}>
            {noms.length} commune{noms.length > 1 ? 's' : ''} prête{noms.length > 1 ? 's' : ''}
          </label>
          <div className="flex flex-wrap gap-1.5 p-3 bg-slate-50 border border-slate-200 rounded-md max-h-40 overflow-y-auto">
            {noms.map((n, i) => (
              <span
                key={`${n}-${i}`}
                className="inline-flex items-center gap-1 pl-2.5 pr-1.5 py-1 bg-white border border-slate-200 rounded-full text-xs font-semibold text-slate-700"
              >
                {n}
                <button
                  type="button"
                  onClick={() => removeNom(i)}
                  className="p-0.5 rounded-full hover:bg-rose-50 hover:text-rose-600 transition-colors"
                >
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}
    </form>
  );
};

export default CommuneForm;
