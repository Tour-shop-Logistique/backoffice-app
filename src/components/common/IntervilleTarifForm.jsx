import React, { useState, useEffect } from 'react';
import { ChevronDown, Check, MapPin } from 'lucide-react';
import { sortFormatsColisParTaille } from '../../utils/formatColisSort';
import { getCurrencyLabel } from '../../utils/format';

const inputClasses = "w-full px-3 py-2.5 border rounded-md focus:ring-2 focus:ring-violet-500 focus:border-violet-500 bg-white transition-all font-medium text-slate-800";
const labelClasses = "block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5 ml-1";

const formatCurrency = (value) => new Intl.NumberFormat('fr-FR', {
  style: 'currency', currency: 'XOF', minimumFractionDigits: 0
}).format(value || 0);

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

/**
 * Formulaire de tarif interville :
 * - en édition (initialData fourni) : un seul format (fixe, non
 *   modifiable), montant + commissions classiques, comme avant.
 * - à la création (pas d'initialData) : saisie groupée pour UN trajet
 *   (couple de communes, choisi une fois) - une ligne par format de colis,
 *   chacune avec son propre montant de base et ses propres commissions
 *   départ/arrivée. Contrairement aux tarifs simples (% de prestation
 *   constant par zone), rien ne garantit que les commissions soient
 *   identiques d'un format à l'autre : aucune valeur n'est donc partagée
 *   par défaut ici, chaque ligne saisit tout. onSubmit reçoit
 *   { commune_depart_id, commune_arrivee_id, lignes } à la création.
 */
const IntervilleTarifForm = ({ id = "interville-tarif-form", onSubmit, initialData, communes = [], formats = [] }) => {
  const isEditing = !!initialData;
  const formatsTries = sortFormatsColisParTaille(formats);

  // --- Mode édition (un format) ---
  const [formData, setFormData] = useState({
    commune_depart_id: '',
    commune_arrivee_id: '',
    format_colis_id: '',
    montant_base: '',
    pourcentage_commission_depart: '',
    pourcentage_commission_arrivee: '',
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        id: initialData.id,
        commune_depart_id: initialData.commune_a_id || '',
        commune_arrivee_id: initialData.commune_b_id || '',
        format_colis_id: initialData.format_colis_id || initialData.format_colis?.id || '',
        montant_base: (parseFloat(initialData.montant_base) || 0).toString(),
        pourcentage_commission_depart: (parseFloat(initialData.pourcentage_commission_depart) || 0).toString(),
        pourcentage_commission_arrivee: (parseFloat(initialData.pourcentage_commission_arrivee) || 0).toString(),
      });
    }
  }, [initialData]);

  // --- Mode création groupée ---
  const [communeDepartId, setCommuneDepartId] = useState('');
  const [communeArriveeId, setCommuneArriveeId] = useState('');
  const [lignes, setLignes] = useState({});
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isEditing) {
      // Une ligne par format disponible, initialisée vide - l'utilisateur
      // ne remplit que les formats pour lesquels il veut créer un tarif.
      setLignes((prev) => {
        const next = { ...prev };
        formatsTries.forEach((f) => {
          if (!next[f.id]) {
            next[f.id] = { montant_base: '', pourcentage_commission_depart: '', pourcentage_commission_arrivee: '' };
          }
        });
        return next;
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditing, formats.length]);

  const updateLigne = (formatId, field, value) => {
    setLignes((prev) => ({ ...prev, [formatId]: { ...prev[formatId], [field]: value } }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (isEditing) {
      onSubmit({
        id: formData.id,
        commune_depart_id: formData.commune_depart_id,
        commune_arrivee_id: formData.commune_arrivee_id,
        format_colis_id: formData.format_colis_id,
        montant_base: parseFloat(formData.montant_base),
        pourcentage_commission_depart: parseFloat(formData.pourcentage_commission_depart),
        pourcentage_commission_arrivee: parseFloat(formData.pourcentage_commission_arrivee),
      });
      return;
    }

    if (!communeDepartId || !communeArriveeId) {
      setError('Sélectionnez les deux communes du trajet.');
      return;
    }

    const lignesValides = Object.entries(lignes)
      .filter(([, l]) => l.montant_base !== '' && l.pourcentage_commission_depart !== '' && l.pourcentage_commission_arrivee !== '')
      .map(([formatId, l]) => ({
        format_colis_id: formatId,
        montant_base: parseFloat(l.montant_base),
        pourcentage_commission_depart: parseFloat(l.pourcentage_commission_depart),
        pourcentage_commission_arrivee: parseFloat(l.pourcentage_commission_arrivee),
      }));

    if (lignesValides.length === 0) {
      setError('Renseignez le prix et les commissions d\'au moins un format.');
      return;
    }

    onSubmit({
      commune_depart_id: communeDepartId,
      commune_arrivee_id: communeArriveeId,
      lignes: lignesValides,
    });
  };

  // ─────────────────────────────────────────────
  // Mode édition
  // ─────────────────────────────────────────────
  if (isEditing) {
    const formatSelectionne = formatsTries.find(f => String(f.id) === String(formData.format_colis_id));
    const mb = parseFloat(formData.montant_base) || 0;
    const pDepart = parseFloat(formData.pourcentage_commission_depart) || 0;
    const pArrivee = parseFloat(formData.pourcentage_commission_arrivee) || 0;
    const mDepart = mb * pDepart / 100;
    const mArrivee = mb * pArrivee / 100;
    const total = mb + mDepart + mArrivee;

    return (
      <form id={id} onSubmit={handleSubmit} className="space-y-6 relative pb-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <CommuneSelect
            label="Commune de départ"
            value={formData.commune_depart_id}
            onChange={(v) => setFormData(prev => ({ ...prev, commune_depart_id: v }))}
            communes={communes}
            excludeId={formData.commune_arrivee_id}
            disabled
          />
          <CommuneSelect
            label="Commune d'arrivée"
            value={formData.commune_arrivee_id}
            onChange={(v) => setFormData(prev => ({ ...prev, commune_arrivee_id: v }))}
            communes={communes}
            excludeId={formData.commune_depart_id}
            disabled
          />
        </div>

        <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
          <label className={labelClasses}>Format du colis</label>
          <p className="mt-2 px-3 py-2.5 border rounded-md bg-white text-slate-500 font-medium">
            {formatSelectionne?.nom || '—'}
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Détails du Prix</h3>

          <div className="space-y-1.5 mb-4">
            <label className={labelClasses}>Montant de Base ({getCurrencyLabel()})</label>
            <input
              type="number"
              value={formData.montant_base}
              onChange={e => setFormData(prev => ({ ...prev, montant_base: e.target.value }))}
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
                onChange={e => setFormData(prev => ({ ...prev, pourcentage_commission_depart: e.target.value }))}
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
                onChange={e => setFormData(prev => ({ ...prev, pourcentage_commission_arrivee: e.target.value }))}
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
  }

  // ─────────────────────────────────────────────
  // Mode création groupée
  // ─────────────────────────────────────────────
  return (
    <form id={id} onSubmit={handleSubmit} className="flex flex-col gap-5">
      {/* Bloc fixe : trajet (ne scrolle pas avec la grille des formats) */}
      <div className="shrink-0 space-y-2">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <CommuneSelect
            label="Commune de départ"
            value={communeDepartId}
            onChange={setCommuneDepartId}
            communes={communes}
            excludeId={communeArriveeId}
          />
          <CommuneSelect
            label="Commune d'arrivée"
            value={communeArriveeId}
            onChange={setCommuneArriveeId}
            communes={communes}
            excludeId={communeDepartId}
          />
        </div>
        <p className="text-xs text-slate-400 ml-1">Le tarif est symétrique : il s'appliquera dans les deux sens du trajet.</p>
      </div>

      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col min-h-0">
        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-1 shrink-0">Prix par format de colis</h3>
        <p className="text-xs text-slate-400 mb-3 shrink-0">
          Renseignez le prix et les commissions des formats concernés - laissez vide les formats sans tarif pour ce trajet.
        </p>

        {formatsTries.length === 0 ? (
          <p className="text-sm text-amber-600">Aucun format configuré - créez-en d'abord dans Formats de colis.</p>
        ) : (
          <div className="space-y-2 overflow-y-auto max-h-[45vh] pr-1 -mr-1">
            {formatsTries.map((format) => {
              const ligne = lignes[format.id] || { montant_base: '', pourcentage_commission_depart: '', pourcentage_commission_arrivee: '' };
              const mb = parseFloat(ligne.montant_base) || 0;
              const pDepart = parseFloat(ligne.pourcentage_commission_depart) || 0;
              const pArrivee = parseFloat(ligne.pourcentage_commission_arrivee) || 0;
              const total = mb + (mb * pDepart / 100) + (mb * pArrivee / 100);
              const rempli = ligne.montant_base !== '';

              return (
                <div key={format.id} className={`flex flex-col gap-1.5 p-2.5 rounded-lg border ${rempli ? 'bg-white border-slate-200' : 'bg-slate-50 border-slate-100'}`}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">{format.nom}</span>
                    {rempli && (
                      <span className="text-[11px] font-semibold text-emerald-600">= {formatCurrency(total)}</span>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <input
                      type="number"
                      value={ligne.montant_base}
                      onChange={(e) => updateLigne(format.id, 'montant_base', e.target.value)}
                      min="0"
                      placeholder="Montant de base"
                      className={`${inputClasses} py-2 text-sm`}
                    />
                    <input
                      type="number"
                      value={ligne.pourcentage_commission_depart}
                      onChange={(e) => updateLigne(format.id, 'pourcentage_commission_depart', e.target.value)}
                      min="0"
                      max="100"
                      placeholder="% départ"
                      className={`${inputClasses} py-2 text-sm`}
                    />
                    <input
                      type="number"
                      value={ligne.pourcentage_commission_arrivee}
                      onChange={(e) => updateLigne(format.id, 'pourcentage_commission_arrivee', e.target.value)}
                      min="0"
                      max="100"
                      placeholder="% arrivée"
                      className={`${inputClasses} py-2 text-sm`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {error && (
        <p className="text-xs font-semibold text-rose-600 ml-1">{error}</p>
      )}
    </form>
  );
};

export default IntervilleTarifForm;
