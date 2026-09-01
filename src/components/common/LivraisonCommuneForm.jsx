import React, { useState, useEffect } from 'react';
import { ChevronDown, Check, MapPin } from 'lucide-react';

const LivraisonCommuneForm = ({ id = "livraison-commune-form", onSubmit, initialData, communes = [] }) => {
  const [formData, setFormData] = useState({ commune_id: '', montant: '' });
  const [isOpen, setIsOpen] = useState(false);
  const ref = React.useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (ref.current && !ref.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (initialData) {
      setFormData({
        id: initialData.id,
        commune_id: initialData.commune_id || initialData.commune?.id || '',
        montant: (parseFloat(initialData.montant) || 0).toString(),
      });
    }
  }, [initialData]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const submissionData = {
      commune_id: formData.commune_id,
      montant: parseFloat(formData.montant),
    };
    if (formData.id) submissionData.id = formData.id;
    onSubmit(submissionData);
  };

  const inputClasses = "w-full px-3 py-2.5 border rounded-md focus:ring-2 focus:ring-violet-500 focus:border-violet-500 bg-white transition-all font-medium text-slate-800";
  const labelClasses = "block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5 ml-1";
  const selectedCommune = communes.find(c => String(c.id) === String(formData.commune_id));

  return (
    <form id={id} onSubmit={handleSubmit} className="space-y-4">
      <div className={`bg-slate-50 p-3 rounded-lg border border-slate-200 ${formData.id ? 'opacity-60' : ''}`}>
        <label className={labelClasses}>Commune</label>
        <div className="relative mt-2" ref={ref}>
          <button
            type="button"
            disabled={!!formData.id}
            onClick={() => setIsOpen(!isOpen)}
            className={`${inputClasses} bg-white flex items-center justify-between text-left disabled:opacity-60 disabled:cursor-not-allowed`}
          >
            <div className="flex items-center gap-2 min-w-0">
              <MapPin className="text-slate-400 shrink-0" size={18} />
              <span className="truncate">{selectedCommune ? selectedCommune.nom : "Choisir une commune"}</span>
            </div>
            <ChevronDown className={`text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} size={18} />
          </button>

          {isOpen && (
            <div className="absolute left-0 right-0 top-full mt-2 py-1.5 bg-white border border-slate-200 rounded-lg shadow-xl shadow-slate-200/50 z-[100] overflow-hidden">
              <div className="max-h-64 overflow-y-auto">
                {communes.map(commune => (
                  <button
                    key={commune.id}
                    type="button"
                    onClick={() => { setFormData(prev => ({ ...prev, commune_id: commune.id })); setIsOpen(false); }}
                    className={`w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors ${String(formData.commune_id) === String(commune.id) ? 'bg-slate-100 text-slate-900 font-semibold' : 'text-slate-600 hover:bg-slate-50'}`}
                  >
                    <span className="truncate">{commune.nom}</span>
                    {String(formData.commune_id) === String(commune.id) && <Check className="h-4 w-4 text-slate-900" />}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div>
        <label className={labelClasses}>Montant de livraison à domicile (FCFA)</label>
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

export default LivraisonCommuneForm;
