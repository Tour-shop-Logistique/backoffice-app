import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Loader2,
  Check,
  Upload,
  ExternalLink,
  RefreshCw,
} from 'lucide-react';
import {
  fetchFluxFinanciers,
  marquerFluxPaye,
  confirmerFluxRecu,
} from '../../redux/slices/fluxFinancierSlice';
import { showNotification } from '../../redux/slices/uiSlice';
import { getCurrencyLabel } from '../../utils/format';

/**
 * Règlements entre le backoffice et ses agences. Une seule agence encaisse
 * réellement le client : elle garde sa commission et reverse le reste au
 * backoffice, qui prend sa part et redistribue la commission de l'autre
 * agence. Les virements se font hors plateforme ; on suit ici ce qui est
 * dû, déclaré réglé, puis confirmé reçu.
 */

const BADGES_STATUT = {
  du: { label: 'À régler', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  paye: { label: 'Réglé', className: 'bg-sky-50 text-sky-700 border-sky-200' },
  confirme: { label: 'Confirmé', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
};

const FluxAgences = () => {
  const dispatch = useDispatch();
  const { items: flux, isLoading, isSaving, hasLoaded } = useSelector((state) => state.fluxFinancier);

  const [filtreStatut, setFiltreStatut] = useState('');
  const [reglement, setReglement] = useState(null);

  useEffect(() => {
    dispatch(fetchFluxFinanciers(filtreStatut ? { statut: filtreStatut } : {}));
  }, [dispatch, filtreStatut]);

  const totaux = useMemo(
    () =>
      flux.reduce(
        (acc, f) => {
          if (f.statut !== 'du') return acc;
          const montant = Number(f.montant) || 0;
          if (f.type_flux === 'agence_vers_backoffice') acc.aRecevoir += montant;
          else acc.aReverser += montant;
          return acc;
        },
        { aRecevoir: 0, aReverser: 0 }
      ),
    [flux]
  );

  const formatMontant = (value) =>
    new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(Number(value) || 0);

  const handleRefresh = () =>
    dispatch(fetchFluxFinanciers(filtreStatut ? { statut: filtreStatut } : {}));

  const handlePayer = async () => {
    const result = await dispatch(marquerFluxPaye(reglement));
    if (result.meta.requestStatus === 'fulfilled') {
      dispatch(showNotification({ type: 'success', message: 'Règlement enregistré.' }));
      setReglement(null);
    } else {
      dispatch(showNotification({
        type: 'error',
        message: result.payload?.message || "Erreur lors de l'enregistrement.",
      }));
    }
  };

  const handleConfirmer = async (id) => {
    const result = await dispatch(confirmerFluxRecu(id));
    if (result.meta.requestStatus === 'fulfilled') {
      dispatch(showNotification({ type: 'success', message: 'Réception confirmée.' }));
    } else {
      dispatch(showNotification({
        type: 'error',
        message: result.payload?.message || 'Erreur lors de la confirmation.',
      }));
    }
  };

  const inputClasses =
    'w-full px-3 py-2.5 border border-slate-200 rounded-md focus:ring-2 focus:ring-violet-500 focus:border-violet-500 bg-white transition-all text-sm font-medium text-slate-800';

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-widest">
            Flux avec les agences
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Virements hors plateforme, suivis ici avec leurs preuves.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={filtreStatut}
            onChange={(e) => setFiltreStatut(e.target.value)}
            className="px-3 py-2 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/20"
          >
            <option value="">Tous les statuts</option>
            <option value="du">À régler</option>
            <option value="paye">Réglés</option>
            <option value="confirme">Confirmés</option>
          </select>

          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
            title="Actualiser"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="p-4 rounded-lg border border-slate-200 bg-white shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
          <div className="flex justify-between items-start mb-2">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
              À recevoir des agences
            </p>
            <ArrowDownLeft className="w-4 h-4 text-emerald-600 opacity-40" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-bold tabular-nums text-emerald-600">
              {formatMontant(totaux.aRecevoir)}
            </span>
            <span className="text-[10px] font-bold text-slate-400">{getCurrencyLabel()}</span>
          </div>
        </div>

        <div className="p-4 rounded-lg border border-slate-200 bg-white shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-amber-500" />
          <div className="flex justify-between items-start mb-2">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
              À reverser aux agences
            </p>
            <ArrowUpRight className="w-4 h-4 text-amber-600 opacity-40" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-bold tabular-nums text-amber-600">
              {formatMontant(totaux.aReverser)}
            </span>
            <span className="text-[10px] font-bold text-slate-400">{getCurrencyLabel()}</span>
          </div>
        </div>
      </div>

      {reglement && (
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
          <p className="text-xs font-bold text-slate-600 uppercase tracking-widest">
            Déclarer le règlement de {formatMontant(reglement.montantAffiche)} {getCurrencyLabel()}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                Référence (optionnel)
              </label>
              <input
                type="text"
                value={reglement.referenceTransaction}
                onChange={(e) => setReglement((p) => ({ ...p, referenceTransaction: e.target.value }))}
                placeholder="N° de transaction"
                className={inputClasses}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                Preuve (optionnel)
              </label>
              <input
                type="file"
                accept="image/jpeg,image/png,image/jpg,image/webp"
                onChange={(e) => setReglement((p) => ({ ...p, photo: e.target.files?.[0] || null }))}
                className="w-full text-xs text-slate-600 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-violet-50 file:text-violet-600 hover:file:bg-violet-100 file:cursor-pointer"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">
              Notes (optionnel)
            </label>
            <textarea
              value={reglement.notes}
              onChange={(e) => setReglement((p) => ({ ...p, notes: e.target.value }))}
              rows={2}
              className={inputClasses}
            />
          </div>

          <div className="flex items-center justify-end gap-2">
            <button
              onClick={() => setReglement(null)}
              className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors uppercase tracking-widest"
            >
              Annuler
            </button>
            <button
              onClick={handlePayer}
              disabled={isSaving}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-violet-600 hover:bg-violet-700 disabled:bg-slate-300 rounded-lg transition-colors uppercase tracking-widest"
            >
              {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              Confirmer
            </button>
          </div>
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
        {isLoading && flux.length === 0 ? (
          <div className="flex items-center justify-center py-12 text-slate-400">
            <Loader2 className="w-5 h-5 animate-spin" />
          </div>
        ) : hasLoaded && flux.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-12">
            Aucun flux financier. Les lignes apparaissent dès qu'une expédition est terminée.
          </p>
        ) : (
          <>
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50/50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 text-left font-bold text-slate-500 uppercase tracking-wider text-xs">Sens</th>
                    <th className="px-6 py-3 text-left font-bold text-slate-500 uppercase tracking-wider text-xs">Agence</th>
                    <th className="px-6 py-3 text-left font-bold text-slate-500 uppercase tracking-wider text-xs">Expédition</th>
                    <th className="px-6 py-3 text-left font-bold text-slate-500 uppercase tracking-wider text-xs">Montant</th>
                    <th className="px-6 py-3 text-center font-bold text-slate-500 uppercase tracking-wider text-xs">Statut</th>
                    <th className="px-6 py-3 text-right font-bold text-slate-500 uppercase tracking-wider text-xs">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {flux.map((f) => {
                    const entrant = f.type_flux === 'agence_vers_backoffice';
                    const badge = BADGES_STATUT[f.statut] || BADGES_STATUT.du;
                    const agence = entrant ? f.emetteur_agence : f.destinataire_agence;
                    const preuve = f.preuves_paiement?.[0];

                    return (
                      <tr key={f.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-3">
                          <div className="flex items-center gap-2">
                            {entrant ? (
                              <ArrowDownLeft className="w-4 h-4 text-emerald-600" />
                            ) : (
                              <ArrowUpRight className="w-4 h-4 text-amber-600" />
                            )}
                            <span className="text-xs font-semibold text-slate-700">
                              {entrant ? 'Reçu' : 'Reversé'}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-3 text-slate-700">{agence?.nom_agence || '—'}</td>
                        <td className="px-6 py-3 text-slate-500 text-xs">{f.expedition?.reference || '—'}</td>
                        <td className="px-6 py-3">
                          <p className={`font-bold tabular-nums ${entrant ? 'text-emerald-600' : 'text-amber-600'}`}>
                            {formatMontant(f.montant)} <span className="text-xs">{getCurrencyLabel()}</span>
                          </p>
                          {f.commission_retenue > 0 && (
                            <p className="text-[10px] text-slate-400">
                              commission retenue {formatMontant(f.commission_retenue)}
                            </p>
                          )}
                        </td>
                        <td className="px-6 py-3 text-center">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${badge.className}`}>
                            {badge.label}
                          </span>
                        </td>
                        <td className="px-6 py-3">
                          <div className="flex items-center justify-end gap-1.5">
                            {preuve?.photo_path && (
                              <a
                                href={preuve.photo_path}
                                target="_blank"
                                rel="noopener noreferrer"
                                title="Voir la preuve"
                                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            )}

                            {!entrant && f.statut === 'du' && (
                              <button
                                onClick={() =>
                                  setReglement({
                                    id: f.id,
                                    montantAffiche: f.montant,
                                    notes: '',
                                    referenceTransaction: '',
                                    photo: null,
                                  })
                                }
                                className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-violet-600 bg-violet-50 hover:bg-violet-100 rounded-lg transition-colors"
                              >
                                <Upload className="w-3.5 h-3.5" />
                                Régler
                              </button>
                            )}

                            {entrant && f.statut === 'paye' && (
                              <button
                                onClick={() => handleConfirmer(f.id)}
                                disabled={isSaving}
                                className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors disabled:opacity-50"
                              >
                                <Check className="w-3.5 h-3.5" />
                                Confirmer réception
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="md:hidden divide-y divide-slate-200">
              {flux.map((f) => {
                const entrant = f.type_flux === 'agence_vers_backoffice';
                const badge = BADGES_STATUT[f.statut] || BADGES_STATUT.du;
                const agence = entrant ? f.emetteur_agence : f.destinataire_agence;
                const preuve = f.preuves_paiement?.[0];

                return (
                  <div key={f.id} className="p-3 space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        {entrant ? (
                          <ArrowDownLeft className="w-4 h-4 text-emerald-600 shrink-0" />
                        ) : (
                          <ArrowUpRight className="w-4 h-4 text-amber-600 shrink-0" />
                        )}
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900 text-sm truncate">
                            {agence?.nom_agence || '—'}
                          </p>
                          <p className="text-[11px] text-slate-400">{f.expedition?.reference || '—'}</p>
                          <p className={`text-xs font-bold mt-0.5 ${entrant ? 'text-emerald-600' : 'text-amber-600'}`}>
                            {formatMontant(f.montant)} {getCurrencyLabel()}
                          </p>
                        </div>
                      </div>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border shrink-0 ${badge.className}`}>
                        {badge.label}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {preuve?.photo_path && (
                        <a
                          href={preuve.photo_path}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 rounded-lg"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          Preuve
                        </a>
                      )}

                      {!entrant && f.statut === 'du' && (
                        <button
                          onClick={() =>
                            setReglement({
                              id: f.id,
                              montantAffiche: f.montant,
                              notes: '',
                              referenceTransaction: '',
                              photo: null,
                            })
                          }
                          className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-violet-600 bg-violet-50 rounded-lg"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          Régler
                        </button>
                      )}

                      {entrant && f.statut === 'paye' && (
                        <button
                          onClick={() => handleConfirmer(f.id)}
                          disabled={isSaving}
                          className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 rounded-lg disabled:opacity-50"
                        >
                          <Check className="w-3.5 h-3.5" />
                          Confirmer
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default FluxAgences;
