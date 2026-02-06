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
  Loader2,
  Check
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
  const [isZoneDropdownOpen, setIsZoneDropdownOpen] = useState(false);
  const zoneDropdownRef = React.useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (zoneDropdownRef.current && !zoneDropdownRef.current.contains(event.target)) {
        setIsZoneDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

  const calculateTotal = () => {
    const base = parseFloat(formData.montant_base) || 0;
    const pourcentage = parseFloat(formData.pourcentage_prestation) || 0;
    return base + (base * pourcentage / 100);
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0
    }).format(value || 0);
  };

  const inputClasses = "w-full px-3 py-2.5 border rounded-md focus:ring-2 focus:ring-violet-500 focus:border-violet-500 bg-white transition-all font-medium text-slate-800";
  const labelClasses = "block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5 ml-1";

  return (
    <form onSubmit={handleSubmit} className="space-y-6 relative pb-4">
      {/* Indice & Zone Destination */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className={`bg-slate-50 p-3 rounded-lg border border-slate-200 ${formData.id ? 'opacity-60' : ''}`}>
          <label className={labelClasses}>Indice de Tarification</label>
          <div className="relative mt-2">
            {/* <Calculator className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} /> */}
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
          <div className="relative mt-2" ref={zoneDropdownRef}>
            <button
              type="button"
              onClick={() => setIsZoneDropdownOpen(!isZoneDropdownOpen)}
              className={`${inputClasses} bg-white flex items-center justify-between text-left`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <MapPin className="text-slate-400 shrink-0" size={18} />
                <span className="truncate">
                  {formData.zone_destination_id
                    ? zones.find(z => String(z.id) === String(formData.zone_destination_id))?.nom
                    : "Choisir une zone"
                  }
                </span>
              </div>
              <ChevronDown className={`text-gray-400 transition-transform duration-200 ${isZoneDropdownOpen ? 'rotate-180' : ''}`} size={18} />
            </button>

            {isZoneDropdownOpen && (
              <div className="absolute left-0 right-0 top-full mt-2 py-1.5 bg-white border border-slate-200 rounded-lg shadow-xl shadow-slate-200/50 z-[100] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200">
                  <button
                    type="button"
                    onClick={() => {
                      handleInputChange('zone_destination_id', '');
                      setIsZoneDropdownOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-4 py-2 text-sm transition-colors ${!formData.zone_destination_id ? 'bg-slate-50 text-slate-900 font-semibold' : 'text-slate-600 hover:bg-slate-50'}`}
                  >
                    <span>Choisir une zone</span>
                  </button>

                  <div className="h-px bg-slate-100 my-1 mx-2" />

                  {zones.map(zone => (
                    <button
                      key={zone.id}
                      type="button"
                      onClick={() => {
                        handleInputChange('zone_destination_id', zone.id);
                        setIsZoneDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors ${String(formData.zone_destination_id) === String(zone.id) ? 'bg-slate-100 text-slate-900 font-semibold' : 'text-slate-600 hover:bg-slate-50'}`}
                    >
                      <span className="truncate">{zone.nom}</span>
                      {String(formData.zone_destination_id) === String(zone.id) && <Check className="h-4 w-4 text-slate-900" />}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Pricing Details */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
          Détails du Prix
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className={labelClasses}>Montant de Base (FCFA)</label>
            <div className="relative mt-2">
              <input
                type="number"
                value={formData.montant_base}
                onChange={e => handleInputChange('montant_base', e.target.value)}
                placeholder="Ex: 3000"
                min="0"
                className={inputClasses}
                required
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400">
                FCFA
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className={labelClasses}>Prestation (%)</label>
            <div className="relative mt-2">
              <input
                type="number"
                value={formData.pourcentage_prestation}
                onChange={e => handleInputChange('pourcentage_prestation', e.target.value)}
                placeholder="Ex: 15"
                min="0"
                max="100"
                className={inputClasses}
                required
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-violet-600">
                %
              </div>
            </div>
          </div>
        </div>

        {/* Calculation Preview */}
        {formData.montant_base && formData.pourcentage_prestation && (
          <div className="mt-4 p-3 bg-white rounded-md border border-gray-200">
            <div className="text-xs text-slate-600 space-y-1">
              <div className="flex justify-between">
                <span>Base:</span>
                <span className="font-semibold">{formatCurrency(parseFloat(formData.montant_base) || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span>Prestation ({formData.pourcentage_prestation}%):</span>
                <span className="font-semibold text-violet-600">
                  +{formatCurrency((parseFloat(formData.montant_base) || 0) * (parseFloat(formData.pourcentage_prestation) || 0) / 100)}
                </span>
              </div>
              <div className="border-t border-gray-200 pt-1 mt-1"></div>
              <div className="flex justify-between font-bold text-sm">
                <span>Total:</span>
                <span className="text-emerald-600">{formatCurrency(calculateTotal())}</span>
              </div>
            </div>
          </div>
        )}
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
              Enregistrer
            </>
          )}
        </button>
      </div>

    </form>
  );
};

export default SimpleTarifForm;
