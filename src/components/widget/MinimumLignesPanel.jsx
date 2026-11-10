import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { Loader2, Trash2, Edit2, Check, X } from 'lucide-react';
import tarificationService from '../../services/tarificationService';
import { showNotification } from '../../redux/slices/uiSlice';
import { getCurrencyLabel } from '../../utils/format';
import useHasPermission from '../../hooks/useHasPermission';

const TYPES_DHD = {
  groupage_dhd_aerien: 'DHD Aérien',
  groupage_dhd_maritime: 'DHD Maritime',
};

const cle = (type, departId, arriveeId) => `${type}|${departId}|${arriveeId}`;
const fmt = (v) => Number(v || 0).toLocaleString();

// Survit au démontage du panneau (changement d'onglet) : l'API n'est appelée
// qu'au premier affichage puis après chaque enregistrement/suppression.
let cacheMinimums = null;

/**
 * Tarif minimum par ligne DHD : si le total calculé d'une expédition sur une
 * ligne (tous colis et catégories confondus) est inférieur, ce montant est
 * facturé à la place. Les lignes proposées sont celles des tarifs DHD déjà
 * créés.
 */
const MinimumLignesPanel = ({ tarifs }) => {
  const dispatch = useDispatch();
  const canEdit = useHasPermission('tarification_groupage.edit');
  const canDelete = useHasPermission('tarification_groupage.delete');
  const [minimums, setMinimums] = useState(cacheMinimums ?? []);
  const [isLoading, setIsLoading] = useState(false);
  const [editingKey, setEditingKey] = useState(null);
  const [form, setForm] = useState({ montant_minimum: '', pourcentage_prestation_minimum: '' });
  const [isSaving, setIsSaving] = useState(false);

  const charger = useCallback(async () => {
    setIsLoading(true);
    try {
      cacheMinimums = await tarificationService.getMinimumsLigne();
      setMinimums(cacheMinimums);
    } catch {
      dispatch(showNotification({ type: 'error', message: 'Impossible de charger les tarifs minimum.' }));
    } finally {
      setIsLoading(false);
    }
  }, [dispatch]);

  useEffect(() => {
    if (cacheMinimums === null) charger();
  }, [charger]);

  const lignes = useMemo(() => {
    const parCle = new Map();
    (tarifs || []).forEach((t) => {
      const type = t.type_expedition?.toLowerCase();
      if (!TYPES_DHD[type] || !t.commune_depart_id || !t.commune_arrivee_id) return;
      const k = cle(type, t.commune_depart_id, t.commune_arrivee_id);
      if (!parCle.has(k)) {
        parCle.set(k, {
          key: k,
          type,
          commune_depart_id: t.commune_depart_id,
          commune_arrivee_id: t.commune_arrivee_id,
          itineraire: `${t.commune_depart?.nom ?? ''} → ${t.commune_arrivee?.nom ?? ''}`,
        });
      }
    });
    return Array.from(parCle.values()).sort((a, b) => a.itineraire.localeCompare(b.itineraire));
  }, [tarifs]);

  const minimumDe = (ligne) => minimums.find((m) => cle(m.type_expedition, m.commune_depart_id, m.commune_arrivee_id) === ligne.key);

  const commencerEdition = (ligne) => {
    const m = minimumDe(ligne);
    setForm({
      montant_minimum: m?.montant_minimum ?? '',
      pourcentage_prestation_minimum: m?.pourcentage_prestation_minimum ?? '',
    });
    setEditingKey(ligne.key);
  };

  const enregistrer = async (ligne) => {
    if (form.montant_minimum === '' || form.pourcentage_prestation_minimum === '') {
      dispatch(showNotification({ type: 'error', message: 'Montant et pourcentage de prestation requis.' }));
      return;
    }
    setIsSaving(true);
    try {
      await tarificationService.saveMinimumLigne({
        type_expedition: ligne.type,
        commune_depart_id: ligne.commune_depart_id,
        commune_arrivee_id: ligne.commune_arrivee_id,
        montant_minimum: parseFloat(form.montant_minimum),
        pourcentage_prestation_minimum: parseFloat(form.pourcentage_prestation_minimum),
      });
      setEditingKey(null);
      await charger();
      dispatch(showNotification({ type: 'success', message: 'Tarif minimum enregistré.' }));
    } catch (e) {
      dispatch(showNotification({ type: 'error', message: e.response?.data?.message || 'Erreur lors de l\'enregistrement.' }));
    } finally {
      setIsSaving(false);
    }
  };

  const supprimer = async (minimum) => {
    try {
      await tarificationService.deleteMinimumLigne(minimum.id);
      await charger();
      dispatch(showNotification({ type: 'success', message: 'Tarif minimum supprimé.' }));
    } catch (e) {
      dispatch(showNotification({ type: 'error', message: e.response?.data?.message || 'Erreur lors de la suppression.' }));
    }
  };

  if (lignes.length === 0) {
    return <p className="py-16 text-center text-sm text-slate-500">Aucune ligne DHD : créez d'abord un tarif DHD Aérien ou Maritime.</p>;
  }

  if (isLoading && minimums.length === 0) {
    return <div className="py-16 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-slate-400" /></div>;
  }

  const totalForm = (parseFloat(form.montant_minimum) || 0) * (1 + (parseFloat(form.pourcentage_prestation_minimum) || 0) / 100);
  const inputCls = 'w-full px-2 py-1.5 border border-slate-300 rounded-md bg-white text-sm font-medium text-slate-800 focus:ring-2 focus:ring-amber-500 focus:border-amber-500';

  const actions = (ligne, m, enEdition) => enEdition ? (
    <div className="flex justify-end gap-1">
      <button type="button" onClick={() => setEditingKey(null)} disabled={isSaving} className="p-2 rounded-md text-slate-500 hover:bg-slate-100" aria-label="Annuler">
        <X className="h-4 w-4" />
      </button>
      <button type="button" onClick={() => enregistrer(ligne)} disabled={isSaving} className="p-2 rounded-md bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-60" aria-label="Enregistrer">
        {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
      </button>
    </div>
  ) : (
    <div className="flex justify-end gap-1">
      {canEdit && (
        <button type="button" onClick={() => commencerEdition(ligne)} className="p-2 rounded-md text-slate-500 hover:bg-slate-100" aria-label={m ? 'Modifier le minimum' : 'Définir le minimum'}>
          <Edit2 className="h-4 w-4" />
        </button>
      )}
      {m && canDelete && (
        <button type="button" onClick={() => supprimer(m)} className="p-2 rounded-md text-red-500 hover:bg-red-50" aria-label="Supprimer le minimum">
          <Trash2 className="h-4 w-4" />
        </button>
      )}
    </div>
  );

  return (
    <>
      <p className="px-4 md:px-6 py-3 text-xs text-slate-500 border-b border-slate-100">
        Le minimum remplace le total de l'expédition (toutes catégories confondues) quand celui-ci lui est inférieur.
      </p>

      {/* Desktop */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50/50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-3 text-left font-bold text-slate-500 uppercase tracking-wider text-xs">Type</th>
              <th className="px-6 py-3 text-left font-bold text-slate-500 uppercase tracking-wider text-xs">Itinéraire</th>
              <th className="px-6 py-3 text-left font-bold text-slate-500 uppercase tracking-wider text-xs">Montant minimum</th>
              <th className="px-6 py-3 text-left font-bold text-slate-500 uppercase tracking-wider text-xs">Prestation</th>
              <th className="px-6 py-3 text-left font-bold text-slate-500 uppercase tracking-wider text-xs">Total minimum</th>
              <th className="px-6 py-3 text-right font-bold text-slate-500 uppercase tracking-wider text-xs">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {lignes.map((ligne) => {
              const m = minimumDe(ligne);
              const enEdition = editingKey === ligne.key;
              return (
                <tr key={ligne.key} className={enEdition ? 'bg-amber-50/50' : 'hover:bg-slate-50/50 transition-colors'}>
                  <td className="px-6 py-3">
                    <span className={`text-sm font-semibold px-2 py-1 rounded uppercase ${ligne.type.includes('aerien') ? 'bg-blue-100 text-blue-700' : 'bg-indigo-100 text-indigo-700'}`}>
                      {TYPES_DHD[ligne.type]}
                    </span>
                  </td>
                  <td className="px-6 py-3 font-semibold uppercase text-slate-700">{ligne.itineraire}</td>
                  <td className="px-6 py-3">
                    {enEdition ? (
                      <input type="number" min="0" value={form.montant_minimum} onChange={(e) => setForm((f) => ({ ...f, montant_minimum: e.target.value }))} className={`${inputCls} max-w-[9rem]`} placeholder="10000" autoFocus />
                    ) : m ? (
                      <span className="font-medium text-slate-700">{fmt(m.montant_minimum)} <span className="text-xs">{getCurrencyLabel()}</span></span>
                    ) : <span className="text-slate-400">—</span>}
                  </td>
                  <td className="px-6 py-3">
                    {enEdition ? (
                      <input type="number" min="0" max="100" value={form.pourcentage_prestation_minimum} onChange={(e) => setForm((f) => ({ ...f, pourcentage_prestation_minimum: e.target.value }))} className={`${inputCls} max-w-[6rem]`} placeholder="10" />
                    ) : m ? (
                      <div className="flex gap-2">
                        <span className="inline-flex items-center px-2 py-0.5 rounded bg-orange-50 text-orange-700 border border-orange-100 font-bold">{Number(m.pourcentage_prestation_minimum)}%</span>
                        <span className="text-slate-500 font-medium whitespace-nowrap">({fmt(m.montant_prestation_minimum)} <span className="text-xs">{getCurrencyLabel()}</span>)</span>
                      </div>
                    ) : <span className="text-slate-400">—</span>}
                  </td>
                  <td className="px-6 py-3">
                    {enEdition ? (
                      <span className="font-bold text-emerald-600">{fmt(Math.round(totalForm * 100) / 100)} <span className="text-xs">{getCurrencyLabel()}</span></span>
                    ) : m ? (
                      <span className="font-bold text-slate-900">{fmt(m.montant_expedition_minimum)} <span className="text-xs">{getCurrencyLabel()}</span></span>
                    ) : <span className="text-xs text-slate-400">Non défini</span>}
                  </td>
                  <td className="px-6 py-3">{actions(ligne, m, enEdition)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile */}
      <div className="md:hidden divide-y divide-slate-200">
        {lignes.map((ligne) => {
          const m = minimumDe(ligne);
          const enEdition = editingKey === ligne.key;
          return (
            <div key={ligne.key} className={`p-3 space-y-2.5 ${enEdition ? 'bg-amber-50/50' : ''}`}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-semibold text-slate-900 text-sm uppercase truncate">{ligne.itineraire}</p>
                  <p className="text-xs text-slate-500">{TYPES_DHD[ligne.type]}</p>
                </div>
                {actions(ligne, m, enEdition)}
              </div>
              {enEdition ? (
                <div className="grid grid-cols-2 gap-2">
                  <label className="text-xs font-semibold text-slate-600">
                    Montant ({getCurrencyLabel()})
                    <input type="number" min="0" value={form.montant_minimum} onChange={(e) => setForm((f) => ({ ...f, montant_minimum: e.target.value }))} className={`${inputCls} mt-1`} />
                  </label>
                  <label className="text-xs font-semibold text-slate-600">
                    Prestation (%)
                    <input type="number" min="0" max="100" value={form.pourcentage_prestation_minimum} onChange={(e) => setForm((f) => ({ ...f, pourcentage_prestation_minimum: e.target.value }))} className={`${inputCls} mt-1`} />
                  </label>
                  <p className="col-span-2 text-xs text-slate-600">Total : <span className="font-bold text-emerald-600">{fmt(Math.round(totalForm * 100) / 100)} {getCurrencyLabel()}</span></p>
                </div>
              ) : m ? (
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-slate-50 rounded-lg p-2 border border-slate-100">
                    <p className="text-[11px] text-slate-500 font-bold">Base</p>
                    <p className="text-xs font-semibold text-slate-700">{fmt(m.montant_minimum)}</p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-2 border border-slate-100">
                    <p className="text-[11px] text-slate-500 font-bold">Prestation</p>
                    <p className="text-xs font-semibold text-orange-600">{Number(m.pourcentage_prestation_minimum)}%</p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-2 border border-slate-100">
                    <p className="text-[11px] text-slate-500 font-bold">Total</p>
                    <p className="text-xs font-bold text-slate-900">{fmt(m.montant_expedition_minimum)}</p>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-400">Minimum non défini</p>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
};

export default MinimumLignesPanel;
