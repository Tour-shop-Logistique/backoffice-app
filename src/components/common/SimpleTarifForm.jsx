import React, { useState, useEffect } from 'react';
import {
  MapPin,
  ChevronDown,
  Check,
  Plus,
  Trash2,
} from 'lucide-react';
import { getCurrencyLabel } from '../../utils/format';

const formatCurrency = (value) => new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'XOF',
  minimumFractionDigits: 0
}).format(value || 0);

const inputClasses = "w-full px-3 py-2.5 border rounded-md focus:ring-2 focus:ring-violet-500 focus:border-violet-500 bg-white transition-all font-medium text-slate-800";
const labelClasses = "block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5 ml-1";

/**
 * Sélecteur de zone réutilisé par les deux modes (édition unitaire et
 * création groupée) - extrait ici pour éviter la duplication.
 */
const ZoneSelector = ({ value, onChange, zones, disabled }) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = React.useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (ref.current && !ref.current.contains(event.target)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`${inputClasses} bg-white flex items-center justify-between text-left ${disabled ? 'cursor-not-allowed opacity-60' : ''}`}
      >
        <div className="flex items-center gap-2 min-w-0">
          <MapPin className="text-slate-400 shrink-0" size={18} />
          <span className="truncate">
            {value ? zones.find(z => String(z.id) === String(value))?.nom : "Choisir une zone"}
          </span>
        </div>
        <ChevronDown className={`text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} size={18} />
      </button>

      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-2 py-1.5 bg-white border border-slate-200 rounded-lg shadow-xl shadow-slate-200/50 z-[100] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200">
            {zones.map(zone => (
              <button
                key={zone.id}
                type="button"
                onClick={() => { onChange(zone.id); setIsOpen(false); }}
                className={`w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors ${String(value) === String(zone.id) ? 'bg-slate-100 text-slate-900 font-semibold' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                <span className="truncate">{zone.nom}</span>
                {String(value) === String(zone.id) && <Check className="h-4 w-4 text-slate-900" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Formulaire de tarif simple (LD) :
 * - en édition (initialData fourni) : un seul couple (indice fixe, zone,
 *   montant, %) classique, comme avant.
 * - à la création (pas d'initialData) : saisie groupée pour UNE zone -
 *   choisie une fois, avec un % de prestation partagé pour tout le lot
 *   (constaté constant au sein d'une même zone sur les grilles existantes),
 *   et une liste de lignes (indice, montant de base) ajoutées une à une.
 *   onSubmit reçoit { zone_destination_id, pourcentage_prestation, lignes }
 *   à la création.
 */
const SimpleTarifForm = ({ id = "simple-tarif-form", onSubmit, initialData, zones = [] }) => {
  const isEditing = !!initialData;

  // --- Mode édition (une ligne) ---
  const [formData, setFormData] = useState({
    indice: '',
    zone_destination_id: '',
    montant_base: '',
    pourcentage_prestation: '',
  });

  useEffect(() => {
    if (initialData) {
      const data = initialData.prix_zones?.[0] || initialData;
      setFormData({
        id: data.id,
        indice: initialData.indice || data.indice || '',
        zone_destination_id: data.zone_destination_id || '',
        montant_base: (parseFloat(data.montant_base) || 0).toString(),
        pourcentage_prestation: (parseFloat(data.pourcentage_prestation) || 0).toString(),
      });
    }
  }, [initialData]);

  // --- Mode création groupée ---
  const [zoneId, setZoneId] = useState('');
  const [pctLot, setPctLot] = useState('');
  const [lignes, setLignes] = useState([{ indice: '', montant_base: '', pourcentage_prestation: '' }]);
  const [error, setError] = useState('');

  const updateLigne = (index, field, value) => {
    setLignes((prev) => prev.map((l, i) => (i === index ? { ...l, [field]: value } : l)));
  };

  const addLigne = () => {
    setLignes((prev) => [...prev, { indice: '', montant_base: '', pourcentage_prestation: '' }]);
  };

  const removeLigne = (index) => {
    setLignes((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== index) : prev));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (isEditing) {
      onSubmit({
        id: formData.id,
        indice: parseFloat(formData.indice),
        zone_destination_id: formData.zone_destination_id,
        montant_base: parseFloat(formData.montant_base),
        pourcentage_prestation: parseFloat(formData.pourcentage_prestation),
      });
      return;
    }

    if (!zoneId) {
      setError('Sélectionnez une zone de destination.');
      return;
    }
    if (!pctLot || parseFloat(pctLot) < 0) {
      setError('Renseignez le pourcentage de prestation du lot.');
      return;
    }

    const lignesValides = lignes.filter((l) => l.indice !== '' && l.montant_base !== '');
    if (lignesValides.length === 0) {
      setError('Ajoutez au moins un indice avec son montant de base.');
      return;
    }

    onSubmit({
      zone_destination_id: zoneId,
      pourcentage_prestation: parseFloat(pctLot),
      lignes: lignesValides.map((l) => ({
        indice: parseFloat(l.indice),
        montant_base: parseFloat(l.montant_base),
        // Redéfinition optionnelle du % pour cette ligne uniquement - si
        // vide, le backend applique le % du lot (pourcentage_prestation).
        ...(l.pourcentage_prestation !== '' ? { pourcentage_prestation: parseFloat(l.pourcentage_prestation) } : {}),
      })),
    });
  };

  // ─────────────────────────────────────────────
  // Mode édition
  // ─────────────────────────────────────────────
  if (isEditing) {
    const total = (parseFloat(formData.montant_base) || 0) * (1 + (parseFloat(formData.pourcentage_prestation) || 0) / 100);

    return (
      <form id={id} onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 opacity-60">
            <label className={labelClasses}>Indice de Tarification</label>
            <input
              type="number"
              value={formData.indice}
              step="0.1"
              min="0"
              className={`${inputClasses} bg-white cursor-not-allowed mt-2`}
              disabled
            />
          </div>
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
            <label className={labelClasses}>Zone de Destination</label>
            <div className="mt-2">
              <ZoneSelector value={formData.zone_destination_id} onChange={(v) => setFormData({ ...formData, zone_destination_id: v })} zones={zones} />
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Détails du Prix</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className={labelClasses}>Montant de Base ({getCurrencyLabel()})</label>
              <input
                type="number"
                value={formData.montant_base}
                onChange={(e) => setFormData({ ...formData, montant_base: e.target.value })}
                min="0"
                className={inputClasses}
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className={labelClasses}>Prestation (%)</label>
              <input
                type="number"
                value={formData.pourcentage_prestation}
                onChange={(e) => setFormData({ ...formData, pourcentage_prestation: e.target.value })}
                min="0"
                max="100"
                className={inputClasses}
                required
              />
            </div>
          </div>

          {formData.montant_base && formData.pourcentage_prestation && (
            <div className="mt-4 p-3 bg-white rounded-md border border-gray-200 flex justify-between font-bold text-sm">
              <span>Total:</span>
              <span className="text-emerald-600">{formatCurrency(total)}</span>
            </div>
          )}
        </div>
      </form>
    );
  }

  // ─────────────────────────────────────────────
  // Mode création groupée
  // ─────────────────────────────────────────────
  return (
    <form id={id} onSubmit={handleSubmit} className="flex flex-col gap-5">
      {/* Bloc fixe : zone + prestation du lot (ne scrolle pas avec la grille) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 shrink-0">
        <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
          <label className={labelClasses}>Zone de Destination</label>
          <div className="mt-2">
            <ZoneSelector value={zoneId} onChange={setZoneId} zones={zones} />
          </div>
        </div>
        <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
          <label className={labelClasses}>Prestation du lot (%)</label>
          <div className="relative mt-2">
            <input
              type="number"
              value={pctLot}
              onChange={(e) => setPctLot(e.target.value)}
              placeholder="Ex: 10"
              min="0"
              max="100"
              className={inputClasses}
            />
          </div>
          <p className="text-[11px] text-slate-400 mt-1.5 ml-1">
            Appliqué à tous les indices ci-dessous, modifiable ligne par ligne si besoin.
          </p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col min-h-0">
        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-3 shrink-0">Grille par indice</h3>

        {/* Seule cette zone scrolle - le bloc du dessus reste fixe. */}
        <div className="space-y-2 overflow-y-auto max-h-[40vh] pr-1 -mr-1">
          {lignes.map((ligne, i) => {
            const pctEffectif = ligne.pourcentage_prestation !== '' ? ligne.pourcentage_prestation : pctLot;
            const total = (parseFloat(ligne.montant_base) || 0) * (1 + (parseFloat(pctEffectif) || 0) / 100);
            return (
              <div key={i} className="flex flex-col gap-1.5 p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                <div className="grid grid-cols-[1fr_1.3fr_0.9fr_auto] gap-2 items-center">
                  <input
                    type="number"
                    value={ligne.indice}
                    onChange={(e) => updateLigne(i, 'indice', e.target.value)}
                    step="0.1"
                    min="0"
                    placeholder="Indice"
                    className={`${inputClasses} py-2 text-sm`}
                  />
                  <input
                    type="number"
                    value={ligne.montant_base}
                    onChange={(e) => updateLigne(i, 'montant_base', e.target.value)}
                    min="0"
                    placeholder="Montant de base"
                    className={`${inputClasses} py-2 text-sm`}
                  />
                  <input
                    type="number"
                    value={ligne.pourcentage_prestation}
                    onChange={(e) => updateLigne(i, 'pourcentage_prestation', e.target.value)}
                    min="0"
                    max="100"
                    placeholder={pctLot ? `${pctLot}%` : '%'}
                    title="Prestation (%) pour cet indice uniquement - laisser vide pour utiliser le % du lot"
                    className={`${inputClasses} py-2 text-sm`}
                  />
                  <button
                    type="button"
                    onClick={() => removeLigne(i)}
                    disabled={lignes.length === 1}
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                {ligne.montant_base && pctEffectif !== '' && (
                  <p className="text-[11px] font-semibold text-emerald-600 text-right pr-10">
                    = {formatCurrency(total)} <span className="text-slate-400 font-normal">({pctEffectif}% de prestation)</span>
                  </p>
                )}
              </div>
            );
          })}

          <button
            type="button"
            onClick={addLigne}
            className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-semibold text-violet-700 bg-violet-50 hover:bg-violet-100 rounded-lg transition-colors"
          >
            <Plus size={14} /> Ajouter un indice
          </button>
        </div>
      </div>

      {error && (
        <p className="text-xs font-semibold text-rose-600 ml-1">{error}</p>
      )}
    </form>
  );
};

export default SimpleTarifForm;
