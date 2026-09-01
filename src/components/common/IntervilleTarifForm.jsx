import React, { useState, useEffect } from 'react';
import { ChevronDown, Check, MapPin } from 'lucide-react';

const CommuneSelect = ({ label, value, onChange, communes, excludeId, disabled }) => {
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

  const inputClasses = "w-full px-3 py-2.5 border rounded-md focus:ring-2 focus:ring-violet-500 focus:border-violet-500 bg-white transition-all font-medium text-slate-800";
  const labelClasses = "block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5 ml-1";

  const selectedCommune = communes.find(c => String(c.id) === String(value));
  const options = communes.filter(c => String(c.id) !== String(excludeId));

  return (
    <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
      <label className={labelClasses}>{label}</label>
      <div className="relative mt-2" ref={ref}>
        <button
          type="button"
          disabled={disabled}
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
              {options.map(commune => (
                <button
                  key={commune.id}
                  type="button"
                  onClick={() => { onChange(commune.id); setIsOpen(false); }}
                  className={`w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors ${String(value) === String(commune.id) ? 'bg-slate-100 text-slate-900 font-semibold' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                  <span className="truncate">{commune.nom}</span>
                  {String(value) === String(commune.id) && <Check className="h-4 w-4 text-slate-900" />}
                </button>
              ))}
              {options.length === 0 && (
                <p className="px-4 py-3 text-sm text-slate-400">Aucune commune disponible</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const IntervilleTarifForm = ({ id = "interville-tarif-form", onSubmit, initialData, communes = [] }) => {
  const [formData, setFormData] = useState({
    indice: '',
    commune_depart_id: '',
    commune_arrivee_id: '',
    montant_base: '',
    pourcentage_commission_depart: '',
    pourcentage_commission_arrivee: '',
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        id: initialData.id,
        indice: initialData.indice ?? '',
        commune_depart_id: initialData.commune_a_id || '',
        commune_arrivee_id: initialData.commune_b_id || '',
        montant_base: (parseFloat(initialData.montant_base) || 0).toString(),
        pourcentage_commission_depart: (parseFloat(initialData.pourcentage_commission_depart) || 0).toString(),
        pourcentage_commission_arrivee: (parseFloat(initialData.pourcentage_commission_arrivee) || 0).toString(),
      });
    }
  }, [initialData]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const submissionData = {
      indice: parseFloat(formData.indice),
      commune_depart_id: formData.commune_depart_id,
      commune_arrivee_id: formData.commune_arrivee_id,
      montant_base: parseFloat(formData.montant_base),
      pourcentage_commission_depart: parseFloat(formData.pourcentage_commission_depart),
      pourcentage_commission_arrivee: parseFloat(formData.pourcentage_commission_arrivee),
    };
    if (formData.id) submissionData.id = formData.id;
    onSubmit(submissionData);
  };

  const formatCurrency = (value) => new Intl.NumberFormat('fr-FR', {
    style: 'currency', currency: 'XOF', minimumFractionDigits: 0
  }).format(value || 0);

  const inputClasses = "w-full px-3 py-2.5 border rounded-md focus:ring-2 focus:ring-violet-500 focus:border-violet-500 bg-white transition-all font-medium text-slate-800";
  const labelClasses = "block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5 ml-1";

  const mb = parseFloat(formData.montant_base) || 0;
  const pDepart = parseFloat(formData.pourcentage_commission_depart) || 0;
  const pArrivee = parseFloat(formData.pourcentage_commission_arrivee) || 0;
  const mDepart = mb * pDepart / 100;
  const mArrivee = mb * pArrivee / 100;
  const total = mb + mDepart + mArrivee;

  return (
    <form id={id} onSubmit={handleSubmit} className="space-y-6 relative pb-4">
      <div className={`bg-slate-50 p-3 rounded-lg border border-slate-200 ${formData.id ? 'opacity-60' : ''}`}>
        <label className={labelClasses}>Indice de Tarification</label>
        <input
          type="number"
          value={formData.indice}
          onChange={e => handleInputChange('indice', e.target.value)}
          step="0.1"
          min="0"
          placeholder="Ex: 2.0"
          className={`${inputClasses} mt-2 bg-white ${formData.id ? 'cursor-not-allowed' : ''}`}
          required
          disabled={!!formData.id}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <CommuneSelect
          label="Commune de départ"
          value={formData.commune_depart_id}
          onChange={(v) => handleInputChange('commune_depart_id', v)}
          communes={communes}
          excludeId={formData.commune_arrivee_id}
          disabled={!!formData.id}
        />
        <CommuneSelect
          label="Commune d'arrivée"
          value={formData.commune_arrivee_id}
          onChange={(v) => handleInputChange('commune_arrivee_id', v)}
          communes={communes}
          excludeId={formData.commune_depart_id}
          disabled={!!formData.id}
        />
      </div>
      {!formData.id && (
        <p className="text-xs text-slate-400 -mt-4 ml-1">Le tarif est symétrique : il s'appliquera dans les deux sens du trajet.</p>
      )}

      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Détails du Prix</h3>

        <div className="space-y-1.5 mb-4">
          <label className={labelClasses}>Montant de Base (FCFA)</label>
          <input
            type="number"
            value={formData.montant_base}
            onChange={e => handleInputChange('montant_base', e.target.value)}
            placeholder="Ex: 5000"
            min="0"
            className={inputClasses}
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className={labelClasses}>Commission agence départ (%)</label>
            <input
              type="number"
              value={formData.pourcentage_commission_depart}
              onChange={e => handleInputChange('pourcentage_commission_depart', e.target.value)}
              placeholder="Ex: 10"
              min="0"
              max="100"
              className={inputClasses}
              required
            />
          </div>
          <div className="space-y-1.5">
            <label className={labelClasses}>Commission agence arrivée (%)</label>
            <input
              type="number"
              value={formData.pourcentage_commission_arrivee}
              onChange={e => handleInputChange('pourcentage_commission_arrivee', e.target.value)}
              placeholder="Ex: 8"
              min="0"
              max="100"
              className={inputClasses}
              required
            />
          </div>
        </div>

        {formData.montant_base && (
          <div className="mt-4 p-3 bg-white rounded-md border border-gray-200">
            <div className="text-xs text-slate-600 space-y-1">
              <div className="flex justify-between">
                <span>Base:</span>
                <span className="font-semibold">{formatCurrency(mb)}</span>
              </div>
              <div className="flex justify-between">
                <span>Commission départ ({pDepart}%):</span>
                <span className="font-semibold text-violet-600">+{formatCurrency(mDepart)}</span>
              </div>
              <div className="flex justify-between">
                <span>Commission arrivée ({pArrivee}%):</span>
                <span className="font-semibold text-violet-600">+{formatCurrency(mArrivee)}</span>
              </div>
              <div className="border-t border-gray-200 pt-1 mt-1"></div>
              <div className="flex justify-between font-bold text-sm">
                <span>Total facturé au client:</span>
                <span className="text-emerald-600">{formatCurrency(total)}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </form>
  );
};

export default IntervilleTarifForm;
