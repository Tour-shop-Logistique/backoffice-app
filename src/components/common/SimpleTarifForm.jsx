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

const SimpleTarifForm = ({ onSubmit, onCancel, isLoading, initialData }) => {
  const dispatch = useDispatch();
  const { zones } = useSelector(state => state.zones);

  const [formData, setFormData] = useState({
    indice: '',
    prix_zones: [
      { zone_destination_id: '', montant_base: '', pourcentage_prestation: '', montant_prestation: '0.00', montant_expedition: '0.00' },
    ],
  });

  useEffect(() => {
    dispatch(fetchZones());

    if (initialData) {
      setFormData({
        ...initialData,
        prix_zones: initialData.prix_zones.map(pz => {
          const mb = parseFloat(pz.montant_base) || 0;
          const pp = parseFloat(pz.pourcentage_prestation) || 0;
          const mp = mb * (pp / 100);
          const me = mb + mp;
          return {
            ...pz,
            montant_base: mb,
            pourcentage_prestation: pp,
            montant_prestation: mp.toFixed(2),
            montant_expedition: me.toFixed(2)
          };
        })
      });
    }
  }, [dispatch, initialData]);

  const handlePrixZoneChange = (index, field, value) => {
    const newPrixZones = [...formData.prix_zones];
    newPrixZones[index][field] = value;

    // recalcul automatique
    const mb = parseFloat(newPrixZones[index].montant_base) || 0;
    const pp = parseFloat(newPrixZones[index].pourcentage_prestation) || 0;
    const mp = mb * (pp / 100);
    const me = mb + mp;

    newPrixZones[index].montant_prestation = mp.toFixed(2);
    newPrixZones[index].montant_expedition = me.toFixed(2);

    setFormData({ ...formData, prix_zones: newPrixZones });
  };

  const handleAddPrixZone = () => {
    setFormData({
      ...formData,
      prix_zones: [
        ...formData.prix_zones,
        { zone_destination_id: '', montant_base: '', pourcentage_prestation: '', montant_prestation: '0.00', montant_expedition: '0.00' },
      ],
    });
  };

  const handleRemovePrixZone = (index) => {
    const newPrixZones = formData.prix_zones.filter((_, i) => i !== index);
    setFormData({ ...formData, prix_zones: newPrixZones });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const submissionData = {
      indice: Number(formData.indice),
      zones: formData.prix_zones.map(pz => ({
        id: pz.id, // optional for edit
        zone_destination_id: pz.zone_destination_id,
        montant_base: Number(pz.montant_base),
        pourcentage_prestation: Number(pz.pourcentage_prestation),
      })),
    };
    onSubmit(submissionData);
  };

  const inputClasses = "w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 outline-none transition-all placeholder:text-gray-400 text-sm font-medium text-gray-700";
  const labelClasses = "block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5 ml-1";

  return (
    <form onSubmit={handleSubmit} className="space-y-6 relative pb-8">
      {/* Indice Section */}
      <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 relative overflow-hidden">
        <div className="relative">
          <label className={labelClasses}>Indice de Tarification</label>
          <div className="relative">
            <Calculator className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="number"
              value={formData.indice}
              onChange={e => setFormData({ ...formData, indice: e.target.value })}
              step="0.1"
              min="0"
              placeholder="Ex: 1.5, 2.0..."
              className={`${inputClasses} bg-white`}
              required
            />
          </div>
          <p className="text-[10px] font-bold text-slate-400 mt-2 px-1 uppercase tracking-wider">L'indice permet d'identifier cette grille tarifaire spécifique.</p>
        </div>
      </div>

      <div className="flex items-center justify-between px-2 pt-4">
        <h3 className="text-xl font-black text-gray-900 flex items-center gap-2 tracking-tight">
          <MapPin className="text-indigo-600" size={22} />
          Configuration par Zone
        </h3>
        <span className="text-xs font-bold text-indigo-500 bg-indigo-50 px-3 py-1 rounded-full">{formData.prix_zones.length} zones configurées</span>
      </div>

      {/* List of Zones */}
      <div className="space-y-4 max-h-[50vh] overflow-y-auto px-1 pr-2 custom-scrollbar">
        {formData.prix_zones.map((pz, index) => (
          <div
            key={index}
            className="group relative bg-white p-6 rounded-xl border border-gray-200 shadow-sm transition-all"
          >
            {/* Remove button */}
            {formData.prix_zones.length > 1 && (
              <button
                type="button"
                onClick={() => handleRemovePrixZone(index)}
                className="absolute -top-2 -right-2 p-2 bg-white border border-red-100 text-red-500 rounded-xl shadow-lg hover:bg-red-50 hover:scale-110 transition-all opacity-0 group-hover:opacity-100 z-10"
                title="Supprimer cette zone"
              >
                <Trash2 size={16} />
              </button>
            )}

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end">
              {/* Destination Selection */}
              <div className="md:col-span-4">
                <label className={labelClasses}>Zone de Destination</label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <select
                    value={pz.zone_destination_id}
                    onChange={e => handlePrixZoneChange(index, 'zone_destination_id', e.target.value)}
                    className={`${inputClasses} appearance-none cursor-pointer`}
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

              {/* Base Price */}
              <div className="md:col-span-4">
                <label className={labelClasses}>Montant de Base (FCFA)</label>
                <div className="relative">
                  <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-green-500" size={18} />
                  <input
                    type="number"
                    value={pz.montant_base}
                    onChange={e => handlePrixZoneChange(index, 'montant_base', e.target.value)}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    className={inputClasses}
                    required
                  />
                </div>
              </div>

              {/* Prestation Percentage */}
              <div className="md:col-span-4">
                <label className={labelClasses}>Prestation (%)</label>
                <div className="relative">
                  <Percent className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-400" size={18} />
                  <input
                    type="number"
                    value={pz.pourcentage_prestation}
                    onChange={e => handlePrixZoneChange(index, 'pourcentage_prestation', e.target.value)}
                    placeholder="0"
                    min="0"
                    max="100"
                    step="0.1"
                    className={inputClasses}
                    required
                  />
                </div>
              </div>

              {/* Results row (auto-calculated) */}
              <div className="md:col-span-12 grid grid-cols-2 gap-4 mt-2">
                <div className="p-3 bg-gray-50 rounded-lg flex items-center justify-between border border-gray-200">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Montant Prestation</span>
                  <span className="text-sm font-bold text-gray-600">{parseFloat(pz.montant_prestation).toLocaleString()} <span className="text-[10px]">FCFA</span></span>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg flex items-center justify-between border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Expédition</span>
                  <span className="text-sm font-bold text-slate-900">{parseFloat(pz.montant_expedition).toLocaleString()} <span className="text-[10px]">FCFA</span></span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Actions for list */}
      <div className="pt-2">
        <button
          type="button"
          onClick={handleAddPrixZone}
          className="flex items-center gap-2 px-6 py-3 bg-white border border-dashed border-slate-300 text-slate-600 rounded-lg font-semibold hover:border-slate-400 hover:bg-slate-50 transition-colors w-full justify-center text-sm"
        >
          <Plus size={18} />
          Ajouter une autre zone de destination
        </button>
      </div>

      {/* Footer Form Actions */}
      <div className="pt-6 border-t border-gray-100 flex flex-col sm:flex-row gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="order-2 sm:order-1 flex-1 px-6 py-2.5 text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="order-1 sm:order-2 flex-1 px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-2 text-xs"
        >
          {isLoading ? (
            <Loader2 className="animate-spin" size={16} />
          ) : (
            <>
              <Save size={16} />
              {initialData ? 'Mettre à jour' : 'Enregistrer'}
            </>
          )}
        </button>
      </div>

      {/* Warning Note */}
      <div className="mt-6 flex gap-3 p-4 bg-amber-50 rounded-lg border border-amber-100">
        <AlertCircle className="text-amber-500 shrink-0" size={16} />
        <p className="text-[10px] leading-relaxed font-bold text-amber-700 uppercase tracking-wider">
          Vérifiez bien vos montants avant d'enregistrer. L'expédition totale est calculée automatiquement par : (Montant Base + (Montant Base * Pourcentage))
        </p>
      </div>
    </form>
  );
};

export default SimpleTarifForm;
