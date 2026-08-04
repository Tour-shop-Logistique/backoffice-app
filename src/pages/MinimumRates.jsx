import React, { useState, useEffect, useMemo } from 'react';
import { Loader2, RefreshCw, ShieldCheck } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { showNotification } from '../redux/slices/uiSlice';
import { fetchMinimumGroupedTarifs, upsertMinimumGroupedTarif } from '../redux/slices/tarificationSlice';
import useHasPermission from '../hooks/useHasPermission';

const TYPES_GROUPAGE = [
  { value: 'groupage_afrique', label: 'Groupage Afrique' },
  { value: 'groupage_ca', label: 'Groupage CA' },
  { value: 'groupage_dhd_aerien', label: 'DHD Aérien' },
  { value: 'groupage_dhd_maritime', label: 'DHD Maritime' },
];

const MinimumRates = () => {
  const dispatch = useDispatch();
  const canEdit = useHasPermission('tarification_groupage.create');

  const { minimumGroupedTarifs, isLoadingMinimumGrouped, minimumGroupedHasLoaded } = useSelector(
    (state) => state.tarification
  );

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [forms, setForms] = useState({});
  const [savingType, setSavingType] = useState(null);

  useEffect(() => {
    if (!minimumGroupedHasLoaded && !isLoadingMinimumGrouped) {
      dispatch(fetchMinimumGroupedTarifs());
    }
  }, [dispatch, minimumGroupedHasLoaded, isLoadingMinimumGrouped]);

  const tarifsByType = useMemo(() => {
    const map = {};
    (minimumGroupedTarifs || []).forEach((t) => {
      map[t.type_expedition] = t;
    });
    return map;
  }, [minimumGroupedTarifs]);

  const getFormValue = (type, field) => {
    if (forms[type]?.[field] !== undefined) return forms[type][field];
    const existing = tarifsByType[type];
    if (field === 'montant_base') return existing?.montant_base ?? '';
    if (field === 'pourcentage_prestation') return existing?.pourcentage_prestation ?? '';
    return '';
  };

  const handleChange = (type, field, value) => {
    setForms((prev) => ({
      ...prev,
      [type]: { ...prev[type], [field]: value },
    }));
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await dispatch(fetchMinimumGroupedTarifs()).unwrap();
    } catch (err) {
      dispatch(showNotification({ type: 'error', message: 'Erreur lors du rafraîchissement.' }));
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleSave = async (type) => {
    const montantBase = parseFloat(getFormValue(type, 'montant_base'));
    const pourcentagePrestation = parseFloat(getFormValue(type, 'pourcentage_prestation'));

    if (isNaN(montantBase) || montantBase < 0) {
      return dispatch(showNotification({ type: 'error', message: 'Le montant de base doit être un nombre positif.' }));
    }
    if (isNaN(pourcentagePrestation) || pourcentagePrestation < 0 || pourcentagePrestation > 100) {
      return dispatch(showNotification({ type: 'error', message: 'Le pourcentage de prestation doit être entre 0 et 100.' }));
    }

    setSavingType(type);
    try {
      await dispatch(upsertMinimumGroupedTarif({
        type_expedition: type,
        montant_base: montantBase,
        pourcentage_prestation: pourcentagePrestation,
      })).unwrap();
      dispatch(showNotification({ type: 'success', message: 'Tarif minimum enregistré avec succès.' }));
      setForms((prev) => ({ ...prev, [type]: undefined }));
    } catch (err) {
      dispatch(showNotification({ type: 'error', message: err?.message || "Erreur lors de l'enregistrement." }));
    } finally {
      setSavingType(null);
    }
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-lg border border-indigo-100 shrink-0">
            <ShieldCheck size={20} />
          </div>
          <div>
            <h2 className="font-bold text-slate-900">Tarifs minimum par type de groupage</h2>
            <p className="text-sm text-slate-500 mt-0.5">
              Si le tarif calculé pour une expédition groupage est en dessous de ce plancher, ce tarif minimum est utilisé à la place.
            </p>
          </div>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="shrink-0 inline-flex items-center justify-center p-3 text-sm font-medium rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-all disabled:opacity-50 shadow-sm"
          title="Rafraîchir"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {isLoadingMinimumGrouped && minimumGroupedTarifs.length === 0 ? (
        <div className="bg-white rounded-lg md:rounded-xl border border-slate-200 shadow-sm flex flex-col items-center justify-center py-20 px-6">
          <Loader2 className="animate-spin text-slate-900 mb-4" size={48} strokeWidth={1.5} />
          <p className="text-slate-500 font-medium text-sm">Chargement des tarifs minimum...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {TYPES_GROUPAGE.map(({ value, label }) => {
            const montantBase = parseFloat(getFormValue(value, 'montant_base')) || 0;
            const pourcentagePrestation = parseFloat(getFormValue(value, 'pourcentage_prestation')) || 0;
            const montantPrestation = (montantBase * pourcentagePrestation) / 100;
            const montantExpedition = montantBase + montantPrestation;
            const existing = tarifsByType[value];
            const isSaving = savingType === value;

            return (
              <div key={value} className="bg-white rounded-lg md:rounded-xl border border-slate-200 shadow-sm p-4 md:p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-slate-900">{label}</p>
                  {existing ? (
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full uppercase tracking-wide">
                      Configuré
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-slate-400 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full uppercase tracking-wide">
                      Non configuré
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Montant de base</label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        disabled={!canEdit}
                        value={getFormValue(value, 'montant_base')}
                        onChange={(e) => handleChange(value, 'montant_base', e.target.value)}
                        placeholder="0"
                        className="w-full pl-3 pr-14 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900 text-sm font-bold text-slate-900 transition-all disabled:opacity-60"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 uppercase tracking-wider pointer-events-none">
                        FCFA
                      </span>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Prestation agence</label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        disabled={!canEdit}
                        value={getFormValue(value, 'pourcentage_prestation')}
                        onChange={(e) => handleChange(value, 'pourcentage_prestation', e.target.value)}
                        placeholder="0"
                        className="w-full pl-3 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900 text-sm font-bold text-slate-900 transition-all disabled:opacity-60"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 pointer-events-none">
                        %
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Prestation calculée</p>
                    <p className="text-sm font-bold text-slate-700">{montantPrestation.toLocaleString()} FCFA</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tarif minimum</p>
                    <p className="text-base font-bold text-indigo-600">{montantExpedition.toLocaleString()} FCFA</p>
                  </div>
                </div>

                {canEdit && (
                  <button
                    onClick={() => handleSave(value)}
                    disabled={isSaving}
                    className="w-full px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isSaving && <Loader2 size={14} className="animate-spin" />}
                    Enregistrer
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MinimumRates;
