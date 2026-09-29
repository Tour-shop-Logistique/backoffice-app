import React, { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Loader2, Banknote, RefreshCw, ShieldCheck, XCircle, Phone } from 'lucide-react';
import { fetchRetraitsLivreur, confirmerRetraitLivreur, rejeterRetraitLivreur } from '../../redux/slices/livreurValidationSlice';
import { showNotification } from '../../redux/slices/uiSlice';
import { getCurrencyLabel } from '../../utils/format';
import useHasPermission from '../../hooks/useHasPermission';
import Modal from '../common/Modal';

const STATUT_LABELS = {
  en_attente: { label: 'En attente', className: 'bg-amber-50 text-amber-700' },
  traite: { label: 'Traité', className: 'bg-emerald-50 text-emerald-700' },
  rejete: { label: 'Rejeté', className: 'bg-red-50 text-red-700' },
};

/**
 * Demandes de retrait des gains réels des livreurs (missions classiques,
 * distinct du solde marketplace informatif) - voir SoldeLivreurController::demanderRetrait
 * côté livreur et RetraitLivreurController côté backoffice. Le solde n'est
 * décrémenté qu'à la confirmation ici, jamais à la demande.
 */
const RetraitsLivreurTab = () => {
  const dispatch = useDispatch();
  const canEdit = useHasPermission('livreurs.edit');
  const { retraits, isLoadingRetraits, retraitsHasLoaded, isSaving } = useSelector((state) => state.livreurValidation);

  const [statutFiltre, setStatutFiltre] = useState('en_attente');
  const [action, setAction] = useState(null); // { retrait, mode: 'confirmer' | 'rejeter' }
  const [notes, setNotes] = useState('');
  const isFirstRun = useRef(true);

  const refresh = () => dispatch(fetchRetraitsLivreur({ statut: statutFiltre || undefined }));

  useEffect(() => {
    if (isFirstRun.current) {
      isFirstRun.current = false;
      if (!retraitsHasLoaded) refresh();
      return;
    }
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statutFiltre]);

  const handleConfirmAction = async () => {
    if (!action) return;
    try {
      if (action.mode === 'confirmer') {
        await dispatch(confirmerRetraitLivreur(action.retrait.id)).unwrap();
        dispatch(showNotification({ type: 'success', message: 'Retrait confirmé, solde débité.' }));
      } else {
        await dispatch(rejeterRetraitLivreur({ retraitId: action.retrait.id, notes: notes || null })).unwrap();
        dispatch(showNotification({ type: 'success', message: 'Retrait rejeté.' }));
      }
      setAction(null);
      setNotes('');
    } catch (err) {
      dispatch(showNotification({ type: 'error', message: err || 'Erreur lors du traitement.' }));
    }
  };

  const nomComplet = (livreur) => `${livreur?.prenoms || ''} ${livreur?.nom || ''}`.trim();

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-4 sm:px-6 py-4 border-b border-slate-100 flex flex-wrap items-center gap-3 justify-between">
        <select
          value={statutFiltre}
          onChange={(e) => setStatutFiltre(e.target.value)}
          className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 focus:outline-none focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900"
        >
          <option value="">Tous statuts</option>
          {Object.entries(STATUT_LABELS).map(([value, { label }]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
        <button
          onClick={refresh}
          disabled={isLoadingRetraits}
          className="p-2 bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-all active:scale-95 disabled:opacity-50"
        >
          {isLoadingRetraits ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
        </button>
      </div>

      {isLoadingRetraits && retraits.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-6">
          <Loader2 className="animate-spin text-slate-900 mb-4" size={40} strokeWidth={1.5} />
          <p className="text-slate-500 font-medium text-sm">Chargement...</p>
        </div>
      ) : retraits.length === 0 ? (
        <div className="py-20 text-center px-6">
          <div className="bg-slate-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Banknote className="text-slate-400" size={32} />
          </div>
          <h3 className="font-bold text-slate-900 text-lg">Aucune demande de retrait</h3>
        </div>
      ) : (
        <>
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50/50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left font-bold text-slate-500 uppercase tracking-wider text-xs">Livreur</th>
                  <th className="px-6 py-3 text-right font-bold text-slate-500 uppercase tracking-wider text-xs">Montant</th>
                  <th className="px-6 py-3 text-left font-bold text-slate-500 uppercase tracking-wider text-xs">Demandé le</th>
                  <th className="px-6 py-3 text-center font-bold text-slate-500 uppercase tracking-wider text-xs">Statut</th>
                  <th className="px-6 py-3 text-right font-bold text-slate-500 uppercase tracking-wider text-xs">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {retraits.map((retrait) => {
                  const statut = STATUT_LABELS[retrait.statut] || { label: retrait.statut, className: 'bg-slate-100 text-slate-600' };
                  const peutTraiter = canEdit && retrait.statut === 'en_attente';
                  return (
                    <tr key={retrait.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-3">
                        <div className="font-semibold text-slate-900">{nomComplet(retrait.livreur) || '—'}</div>
                        <div className="text-xs text-slate-500 flex items-center gap-1">
                          <Phone className="h-3 w-3" /> {retrait.livreur?.telephone || '—'}
                        </div>
                      </td>
                      <td className="px-6 py-3 text-right font-bold text-slate-900">
                        {(retrait.montant || 0).toLocaleString()} {getCurrencyLabel()}
                      </td>
                      <td className="px-6 py-3 text-slate-600">
                        {retrait.created_at ? format(new Date(retrait.created_at), 'dd MMM yyyy HH:mm', { locale: fr }) : '—'}
                      </td>
                      <td className="px-6 py-3 text-center">
                        <span className={`inline-flex px-2 py-0.5 rounded-md text-xs font-semibold ${statut.className}`}>{statut.label}</span>
                      </td>
                      <td className="px-6 py-3 text-right">
                        {peutTraiter && (
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => setAction({ retrait, mode: 'confirmer' })}
                              className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                              title="Confirmer le retrait"
                            >
                              <ShieldCheck size={16} />
                            </button>
                            <button
                              onClick={() => setAction({ retrait, mode: 'rejeter' })}
                              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Rejeter le retrait"
                            >
                              <XCircle size={16} />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="md:hidden divide-y divide-slate-200">
            {retraits.map((retrait) => {
              const statut = STATUT_LABELS[retrait.statut] || { label: retrait.statut, className: 'bg-slate-100 text-slate-600' };
              const peutTraiter = canEdit && retrait.statut === 'en_attente';
              return (
                <div key={retrait.id} className="p-3 space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900 text-sm truncate">{nomComplet(retrait.livreur) || '—'}</p>
                      <p className="text-xs text-slate-500 flex items-center gap-1"><Phone className="h-3 w-3" /> {retrait.livreur?.telephone || '—'}</p>
                    </div>
                    <span className={`inline-flex px-2 py-0.5 rounded-md text-[10px] font-semibold whitespace-nowrap ${statut.className}`}>{statut.label}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="font-bold text-slate-900 text-sm">{(retrait.montant || 0).toLocaleString()} {getCurrencyLabel()}</span>
                    <span>{retrait.created_at ? format(new Date(retrait.created_at), 'dd MMM yyyy', { locale: fr }) : '—'}</span>
                  </div>
                  {peutTraiter && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => setAction({ retrait, mode: 'confirmer' })}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-lg text-xs font-medium active:scale-95 transition-all"
                      >
                        <ShieldCheck size={13} /> Confirmer
                      </button>
                      <button
                        onClick={() => setAction({ retrait, mode: 'rejeter' })}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-red-50 text-red-600 border border-red-100 rounded-lg text-xs font-medium active:scale-95 transition-all"
                      >
                        <XCircle size={13} /> Rejeter
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      <Modal
        isOpen={!!action}
        onClose={() => { setAction(null); setNotes(''); }}
        title={action?.mode === 'confirmer' ? 'Confirmer le retrait' : 'Rejeter le retrait'}
        subtitle={action?.retrait ? nomComplet(action.retrait.livreur) : ''}
        size="sm"
        onConfirm={handleConfirmAction}
        isLoading={isSaving}
        confirmLabel={action?.mode === 'confirmer' ? 'Confirmer' : 'Rejeter'}
        confirmVariant={action?.mode === 'rejeter' ? 'danger' : 'primary'}
      >
        {action?.retrait && (
          <div className="space-y-4">
            <div className="px-3 py-2 bg-slate-50 rounded-lg text-sm">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Montant à {action.mode === 'confirmer' ? 'verser' : 'rejeter'}</p>
              <p className="font-bold text-slate-900 text-lg">{(action.retrait.montant || 0).toLocaleString()} {getCurrencyLabel()}</p>
            </div>

            {action.retrait.notes && (
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Notes du livreur</p>
                <p className="text-sm text-slate-600">{action.retrait.notes}</p>
              </div>
            )}

            {action.mode === 'confirmer' && (
              <p className="text-xs text-slate-500 italic">
                Assurez-vous d'avoir remis les fonds au livreur (cash, mobile money...) avant de confirmer : cette action débite immédiatement son solde.
              </p>
            )}

            {action.mode === 'rejeter' && (
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Motif du rejet (optionnel)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ex : montant incorrect, demande erronée..."
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900 text-sm font-medium text-slate-900 transition-all min-h-[80px] resize-none"
                />
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default RetraitsLivreurTab;
