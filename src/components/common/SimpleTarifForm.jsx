import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchZones } from '../../redux/slices/zoneSlice';
import {
  Plus,
  Trash2,
  DollarSign,
  Percent,
  MapPin,
  Calculator,
  Info,
  AlertCircle,
  ChevronDown,
  Save,
  X,
  Loader2
} from 'lucide-react';

const SimpleTarifForm = ({ onSubmit, onCancel, isLoading, initialData, zones = [] }) => {
  const [formData, setFormData] = useState({
    indice: '',
    zone_destination_id: '',
    montant_base: '',
    pourcentage_prestation: '',
    montant_prestation: '0.00',
    montant_expedition: '0.00'
  });

  useEffect(() => {
    if (initialData) {
      // If we receive the grouped object, we pick the first one or the data directly
      const data = initialData.prix_zones?.[0] || initialData;
      const mb = parseFloat(data.montant_base) || 0;
      const pp = parseFloat(data.pourcentage_prestation) || 0;
      const mp = mb * (pp / 100);
      const me = mb + mp;

      setFormData({
        id: data.id,
        indice: initialData.indice || data.indice || '',
        zone_destination_id: data.zone_destination_id || '',
        montant_base: mb.toString(),
        pourcentage_prestation: pp.toString(),
        montant_prestation: mp.toFixed(2),
        montant_expedition: me.toFixed(2)
      });
    }
  }, [initialData]);

  const handleInputChange = (field, value) => {
    const newData = { ...formData, [field]: value };

    // recalcul automatique si montant ou pourcentage change
    if (field === 'montant_base' || field === 'pourcentage_prestation') {
      const mb = parseFloat(field === 'montant_base' ? value : formData.montant_base) || 0;
      const pp = parseFloat(field === 'pourcentage_prestation' ? value : formData.pourcentage_prestation) || 0;
      const mp = mb * (pp / 100);
      const me = mb + mp;
      newData.montant_prestation = mp.toFixed(2);
      newData.montant_expedition = me.toFixed(2);
    }

    setFormData(newData);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const submissionData = {
      indice: parseFloat(formData.indice),
      zone_destination_id: formData.zone_destination_id,
      montant_base: parseFloat(formData.montant_base),
      pourcentage_prestation: parseFloat(formData.pourcentage_prestation),
    };
    if (formData.id) submissionData.id = formData.id;
    onSubmit(submissionData);
  };

  const inputClasses = "w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 outline-none transition-all placeholder:text-gray-400 text-sm font-medium text-gray-700";
  const labelClasses = "block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5 ml-1";

  return (
    <form onSubmit={handleSubmit} className="space-y-6 relative pb-4">
      {/* Indice & Zone Destination */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className={`bg-slate-50 p-3 rounded-lg border border-slate-200 ${formData.id ? 'opacity-60' : ''}`}>
          <label className={labelClasses}>Indice de Tarification</label>
          <div className="relative mt-2">
            <Calculator className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="number"
              value={formData.indice}
              onChange={e => handleInputChange('indice', e.target.value)}
              step="0.1"
              min="0"
              placeholder="Ex: 2.0"
              className={`${inputClasses} bg-white ${formData.id ? 'cursor-not-allowed' : ''}`}
              required
              disabled={!!formData.id}
            />
          </div>
        </div>

        <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
          <label className={labelClasses}>Zone de Destination</label>
          <div className="relative mt-2">
            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <select
              value={formData.zone_destination_id}
              onChange={e => handleInputChange('zone_destination_id', e.target.value)}
              className={`${inputClasses} bg-white appearance-none cursor-pointer`}
              required
            >
              <option value="">Choisir une zone</option>
              {zones.map(zone => (
                <option key={zone.id} value={zone.id}>{zone.nom}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
          </div>
        </div>
      </div>

      {/* Pricing Details */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
          Détails du Prix
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className={labelClasses}>Montant de Base (FCFA)</label>
            <div className="relative mt-2">
              <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-green-500" size={18} />
              <input
                type="number"
                value={formData.montant_base}
                onChange={e => handleInputChange('montant_base', e.target.value)}
                placeholder="27000"
                min="0"
                className={inputClasses}
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className={labelClasses}>Prestation (%)</label>
            <div className="relative mt-2">
              <Percent className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-400" size={18} />
              <input
                type="number"
                value={formData.pourcentage_prestation}
                onChange={e => handleInputChange('pourcentage_prestation', e.target.value)}
                placeholder="15"
                min="0"
                max="100"
                className={inputClasses}
                required
              />
            </div>
          </div>
        </div>

        {/* Results row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div className="p-4 bg-gray-100 rounded-lg flex flex-col border border-gray-100">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Montant Prestation</span>
            <span className="text-xl font-bold text-gray-700">{parseFloat(formData.montant_prestation).toLocaleString()} <span className="text-xs font-medium">FCFA</span></span>
          </div>
          <div className="p-4 bg-slate-900 rounded-lg flex flex-col shadow-lg shadow-slate-900/20">
            <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest mb-1">Total Expédition</span>
            <span className="text-xl font-bold text-white">{parseFloat(formData.montant_expedition).toLocaleString()} <span className="text-xs font-medium">FCFA</span></span>
          </div>
        </div>
      </div>

      {/* Footer Form Actions */}
      <div className="pt-6 border-t border-gray-100 flex gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-6 py-2.5 text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-gray-600 rounded-lg transition-colors border border-transparent hover:border-gray-100"
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="flex-[2] px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-2 text-xs shadow-lg shadow-slate-900/10"
        >
          {isLoading ? (
            <Loader2 className="animate-spin" size={16} />
          ) : (
            <>
              <Save size={16} />
              Enregistrer le Tarif
            </>
          )}
        </button>
      </div>

    </form>
  );
};

export default SimpleTarifForm;
