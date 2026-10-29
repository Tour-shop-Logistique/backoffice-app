import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { ChevronDown, Loader2, Trash2, Edit2, Check, X } from 'lucide-react';
import tarificationService from '../../services/tarificationService';
import { showNotification } from '../../redux/slices/uiSlice';
import { getCurrencyLabel } from '../../utils/format';
import useHasPermission from '../../hooks/useHasPermission';

const TYPES_DHD = {
  groupage_dhd_aerien: 'DHD Aérien',
  groupage_dhd_maritime: 'DHD Maritime',
};

const cle = (type, departId, arriveeId) => `${type}|${departId}|${arriveeId}`;

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
  const [open, setOpen] = useState(false);
  const [minimums, setMinimums] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingKey, setEditingKey] = useState(null);
  const [form, setForm] = useState({ montant_minimum: '', pourcentage_prestation_minimum: '' });
  const [isSaving, setIsSaving] = useState(false);

  const charger = useCallback(async () => {
    setIsLoading(true);
    try {
      setMinimums(await tarificationService.getMinimumsLigne());
    } catch {
      dispatch(showNotification({ type: 'error', message: 'Impossible de charger les tarifs minimum.' }));
    } finally {
      setIsLoading(false);
    }
  }, [dispatch]);

  useEffect(() => {
    if (open) charger();
  }, [open, charger]);

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

  if (lignes.length === 0) return null;

  const totalForm = (parseFloat(form.montant_minimum) || 0) * (1 + (parseFloat(form.pourcentage_prestation_minimum) || 0) / 100);

  return (
    <div className="bg-white rounded-lg md:rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-slate-50 transition-colors"
      >
        <div className="min-w-0">
          <p className="text-sm font-bold text-slate-900">Tarif minimum par ligne</p>
          <p className="text-xs text-slate-500">Appliqué si le total calculé de l'expédition est inférieur</p>
        </div>
        <ChevronDown className={`h-4 w-4 text-slate-500 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="border-t border-slate-200 divide-y divide-slate-100">
          {isLoading && minimums.length === 0 ? (
            <div className="p-6 flex justify-center"><Loader2 className="h-5 w-5 animate-spin text-slate-400" /></div>
          ) : lignes.map((ligne) => {
            const m = minimumDe(ligne);
            const enEdition = editingKey === ligne.key;
            return (
              <div key={ligne.key} className="px-4 py-3 flex flex-col gap-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">{ligne.itineraire}</p>
                    <p className="text-xs text-slate-500">{TYPES_DHD[ligne.type]}</p>
                  </div>
                  {!enEdition && (
                    <div className="flex items-center gap-2 shrink-0">
                      {m ? (
                        <span className="px-2 py-1 rounded text-xs font-bold bg-amber-50 text-amber-700 border border-amber-100 whitespace-nowrap">
                          Min : {Number(m.montant_expedition_minimum).toLocaleString()} {getCurrencyLabel()}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">Non défini</span>
                      )}
                      {canEdit && (
                        <button type="button" onClick={() => commencerEdition(ligne)} className="p-2 rounded-md text-slate-500 hover:bg-slate-100" aria-label="Modifier le minimum">
                          <Edit2 className="h-4 w-4" />
                        </button>
                      )}
                      {m && canDelete && (
                        <button type="button" onClick={() => supprimer(m)} className="p-2 rounded-md text-red-500 hover:bg-red-50" aria-label="Supprimer le minimum">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {enEdition && (
                  <div className="flex flex-col gap-3 rounded-lg bg-amber-50/60 border border-amber-100 p-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <label className="text-xs font-semibold text-slate-700">
                        Montant minimum ({getCurrencyLabel()})
                        <input
                          type="number"
                          min="0"
                          value={form.montant_minimum}
                          onChange={(e) => setForm((f) => ({ ...f, montant_minimum: e.target.value }))}
                          className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-sm font-medium text-slate-800 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                          placeholder="10000"
                        />
                      </label>
                      <label className="text-xs font-semibold text-slate-700">
                        Prestation agence (%)
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={form.pourcentage_prestation_minimum}
                          onChange={(e) => setForm((f) => ({ ...f, pourcentage_prestation_minimum: e.target.value }))}
                          className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-sm font-medium text-slate-800 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                          placeholder="10"
                        />
                      </label>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-xs text-slate-600">
                        Total facturé : <span className="font-bold text-emerald-600">{Math.round(totalForm * 100) / 100} {getCurrencyLabel()}</span>
                      </p>
                      <div className="flex gap-2">
                        <button type="button" onClick={() => setEditingKey(null)} disabled={isSaving} className="h-9 px-3 rounded-md border border-slate-300 text-sm text-slate-600 hover:bg-white inline-flex items-center gap-1">
                          <X className="h-4 w-4" /> Annuler
                        </button>
                        <button type="button" onClick={() => enregistrer(ligne)} disabled={isSaving} className="h-9 px-3 rounded-md bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 disabled:opacity-60 inline-flex items-center gap-1">
                          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Enregistrer
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MinimumLignesPanel;
