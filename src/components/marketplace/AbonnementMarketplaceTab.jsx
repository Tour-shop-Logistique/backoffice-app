import React, { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { CreditCard, Loader2, Pencil, RefreshCw, ShieldCheck, XCircle } from 'lucide-react';
import {
  fetchAbonnementSettings,
  updateAbonnementSettings,
  fetchAbonnementEcheances,
  validerPaiementAbonnement,
  rejeterPaiementAbonnement,
} from '../../redux/slices/abonnementBackofficeSlice';
import { showNotification } from '../../redux/slices/uiSlice';
import { getCurrencyLabel } from '../../utils/format';
import useHasPermission from '../../hooks/useHasPermission';
import Modal from '../common/Modal';

const ECHEANCE_STATUT_LABELS = {
  a_payer: { label: 'À payer', className: 'bg-slate-100 text-slate-600' },
  rappel_envoye: { label: 'Rappel envoyé', className: 'bg-amber-50 text-amber-700' },
  payee: { label: 'Payée', className: 'bg-emerald-50 text-emerald-700' },
  en_retard: { label: 'En retard', className: 'bg-red-50 text-red-700' },
};

const PAIEMENT_STATUT_LABELS = {
  en_attente: { label: 'En attente de validation', className: 'bg-amber-50 text-amber-700' },
  valide: { label: 'Validé', className: 'bg-emerald-50 text-emerald-700' },
  rejete: { label: 'Rejeté', className: 'bg-red-50 text-red-700' },
};

const AbonnementMarketplaceTab = () => {
  const dispatch = useDispatch();
  const canEdit = useHasPermission('marketplace.edit');
  const {
    settings,
    echeances,
    isLoadingSettings,
    isLoadingEcheances,
    isSaving,
    isValidating,
    settingsHasLoaded,
    echeancesHasLoaded,
  } = useSelector((state) => state.abonnementBackoffice);

  const [statutFiltre, setStatutFiltre] = useState('');
  const [typeFiltre, setTypeFiltre] = useState('');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [formData, setFormData] = useState({ montant_vendeur: '', montant_livreur: '', periodicite_jours: '', delai_rappel_jours: '' });
  const [paiementAction, setPaiementAction] = useState(null); // { echeance, mode: 'valider' | 'rejeter' }
  const [commentaireRejet, setCommentaireRejet] = useState('');
  const isFirstRun = useRef(true);

  useEffect(() => {
    if (!settingsHasLoaded && !isLoadingSettings) {
      dispatch(fetchAbonnementSettings());
    }
  }, [dispatch, settingsHasLoaded, isLoadingSettings]);

  const refreshEcheances = () => {
    dispatch(fetchAbonnementEcheances({
      statut: statutFiltre || undefined,
      type_abonne: typeFiltre || undefined,
    }));
  };

  useEffect(() => {
    if (isFirstRun.current) {
      isFirstRun.current = false;
      if (!echeancesHasLoaded) refreshEcheances();
      return;
    }
    refreshEcheances();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statutFiltre, typeFiltre]);

  useEffect(() => {
    if (settings) {
      setFormData({
        montant_vendeur: (settings.montant_vendeur ?? 0).toString(),
        montant_livreur: (settings.montant_livreur ?? 0).toString(),
        periodicite_jours: (settings.periodicite_jours ?? 30).toString(),
        delai_rappel_jours: (settings.delai_rappel_jours ?? 2).toString(),
      });
    }
  }, [settings]);

  const handleSubmitSettings = async (e) => {
    e.preventDefault();
    try {
      await dispatch(updateAbonnementSettings({
        montant_vendeur: parseFloat(formData.montant_vendeur) || 0,
        montant_livreur: parseFloat(formData.montant_livreur) || 0,
        periodicite_jours: parseInt(formData.periodicite_jours, 10) || 30,
        delai_rappel_jours: parseInt(formData.delai_rappel_jours, 10) || 2,
      })).unwrap();
      dispatch(showNotification({ type: 'success', message: "Configuration de l'abonnement mise à jour." }));
      setIsEditModalOpen(false);
    } catch (err) {
      dispatch(showNotification({ type: 'error', message: err || 'Erreur lors de la mise à jour.' }));
    }
  };

  const handleConfirmPaiementAction = async () => {
    if (!paiementAction) return;
    const { echeance, mode } = paiementAction;
    try {
      if (mode === 'valider') {
        await dispatch(validerPaiementAbonnement(echeance.paiement.id)).unwrap();
        dispatch(showNotification({ type: 'success', message: 'Paiement validé, accès rétabli.' }));
      } else {
        await dispatch(rejeterPaiementAbonnement({ paiementId: echeance.paiement.id, commentaire: commentaireRejet || null })).unwrap();
        dispatch(showNotification({ type: 'success', message: 'Paiement rejeté.' }));
      }
      setPaiementAction(null);
      setCommentaireRejet('');
    } catch (err) {
      dispatch(showNotification({ type: 'error', message: err || "Erreur lors du traitement du paiement." }));
    }
  };

  const items = echeances.data || [];
  const inputBase = "w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900 text-sm font-medium text-slate-900 transition-all";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-4 md:gap-6 items-start">
      {/* Échéances */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden order-2 lg:order-1">
        <div className="px-4 sm:px-6 py-4 border-b border-slate-100 flex flex-wrap items-center gap-3 justify-between">
          <div className="flex items-center gap-2">
            <select
              value={statutFiltre}
              onChange={(e) => setStatutFiltre(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 focus:outline-none focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900"
            >
              <option value="">Tous statuts</option>
              {Object.entries(ECHEANCE_STATUT_LABELS).map(([value, { label }]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
            <select
              value={typeFiltre}
              onChange={(e) => setTypeFiltre(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 focus:outline-none focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900"
            >
              <option value="">Vendeurs et livreurs</option>
              <option value="vendeur">Vendeurs</option>
              <option value="livreur">Livreurs</option>
            </select>
          </div>
          <button
            onClick={refreshEcheances}
            disabled={isLoadingEcheances}
            className="p-2 bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-all active:scale-95 disabled:opacity-50"
          >
            {isLoadingEcheances ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
          </button>
        </div>

        {isLoadingEcheances && items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-6">
            <Loader2 className="h-8 w-8 text-slate-900 animate-spin mb-3" />
          </div>
        ) : items.length === 0 ? (
          <div className="py-16 text-center px-6">
            <div className="bg-slate-50 w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3 border border-slate-100">
              <CreditCard className="text-slate-400" size={24} />
            </div>
            <h3 className="font-bold text-slate-900">Aucune échéance trouvée</h3>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50/50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left font-bold text-slate-500 uppercase tracking-wider text-xs">Utilisateur</th>
                  <th className="px-6 py-3 text-left font-bold text-slate-500 uppercase tracking-wider text-xs">Type</th>
                  <th className="px-6 py-3 text-left font-bold text-slate-500 uppercase tracking-wider text-xs">Échéance</th>
                  <th className="px-6 py-3 text-right font-bold text-slate-500 uppercase tracking-wider text-xs">Montant</th>
                  <th className="px-6 py-3 text-center font-bold text-slate-500 uppercase tracking-wider text-xs">Statut</th>
                  <th className="px-6 py-3 text-center font-bold text-slate-500 uppercase tracking-wider text-xs">Paiement</th>
                  <th className="px-6 py-3 text-right font-bold text-slate-500 uppercase tracking-wider text-xs">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {items.map((echeance) => {
                  const statut = ECHEANCE_STATUT_LABELS[echeance.statut] || { label: echeance.statut, className: 'bg-slate-100 text-slate-600' };
                  const paiement = echeance.paiement;
                  const paiementStatut = paiement ? (PAIEMENT_STATUT_LABELS[paiement.statut] || { label: paiement.statut, className: 'bg-slate-100 text-slate-600' }) : null;
                  const peutTraiter = canEdit && paiement && paiement.statut === 'en_attente';

                  return (
                    <tr key={echeance.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-3">
                        <div className="font-semibold text-slate-900">{`${echeance.user?.prenoms || ''} ${echeance.user?.nom || ''}`.trim() || '—'}</div>
                        <div className="text-xs text-slate-500">{echeance.user?.telephone || '—'}</div>
                      </td>
                      <td className="px-6 py-3 text-slate-600 capitalize">{echeance.abonnement?.type_abonne || '—'}</td>
                      <td className="px-6 py-3 text-slate-600">
                        {echeance.periode_fin ? format(new Date(echeance.periode_fin), 'dd MMM yyyy', { locale: fr }) : '—'}
                      </td>
                      <td className="px-6 py-3 text-right font-bold text-slate-900">
                        {(echeance.montant || 0).toLocaleString()} {getCurrencyLabel()}
                      </td>
                      <td className="px-6 py-3 text-center">
                        <span className={`inline-flex px-2 py-0.5 rounded-md text-xs font-semibold ${statut.className}`}>{statut.label}</span>
                      </td>
                      <td className="px-6 py-3 text-center">
                        {paiementStatut ? (
                          <span className={`inline-flex px-2 py-0.5 rounded-md text-xs font-semibold ${paiementStatut.className}`}>{paiementStatut.label}</span>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-6 py-3 text-right">
                        {peutTraiter && (
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => setPaiementAction({ echeance, mode: 'valider' })}
                              className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                              title="Valider le paiement"
                            >
                              <ShieldCheck size={16} />
                            </button>
                            <button
                              onClick={() => setPaiementAction({ echeance, mode: 'rejeter' })}
                              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Rejeter le paiement"
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
        )}
      </div>

      {/* Configuration */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 order-1 lg:order-2 lg:sticky lg:top-24 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <CreditCard size={18} />
          </div>
          <div>
            <h2 className="font-semibold text-slate-900">Configuration</h2>
            <p className="text-xs text-slate-500">Montants et délais de l'abonnement</p>
          </div>
        </div>

        {isLoadingSettings && !settings ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-6 w-6 text-slate-400 animate-spin" />
          </div>
        ) : (
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between px-3 py-2 bg-slate-50 rounded-lg">
              <span className="text-slate-600">Montant vendeur</span>
              <span className="font-bold text-slate-900">{(settings?.montant_vendeur ?? 0).toLocaleString()} {getCurrencyLabel()}</span>
            </div>
            <div className="flex items-center justify-between px-3 py-2 bg-slate-50 rounded-lg">
              <span className="text-slate-600">Montant livreur</span>
              <span className="font-bold text-slate-900">{(settings?.montant_livreur ?? 0).toLocaleString()} {getCurrencyLabel()}</span>
            </div>
            <div className="flex items-center justify-between px-3 py-2 bg-slate-50 rounded-lg">
              <span className="text-slate-600">Périodicité</span>
              <span className="font-bold text-slate-900">{settings?.periodicite_jours ?? 30} jours</span>
            </div>
            <div className="flex items-center justify-between px-3 py-2 bg-slate-50 rounded-lg">
              <span className="text-slate-600">Rappel</span>
              <span className="font-bold text-slate-900">J-{settings?.delai_rappel_jours ?? 2}</span>
            </div>
          </div>
        )}

        {canEdit && (
          <button
            onClick={() => setIsEditModalOpen(true)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 text-white rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-slate-800 transition-all active:scale-95"
          >
            <Pencil size={14} />
            Modifier
          </button>
        )}
      </div>

      {/* Modal édition config */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Configuration de l'abonnement"
        size="sm"
        onConfirm={handleSubmitSettings}
        isLoading={isSaving}
        confirmLabel="Enregistrer"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Montant vendeur</label>
            <input
              type="number"
              value={formData.montant_vendeur}
              onChange={(e) => setFormData((p) => ({ ...p, montant_vendeur: e.target.value }))}
              className={inputBase}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Montant livreur</label>
            <input
              type="number"
              value={formData.montant_livreur}
              onChange={(e) => setFormData((p) => ({ ...p, montant_livreur: e.target.value }))}
              className={inputBase}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Périodicité (jours)</label>
            <input
              type="number"
              value={formData.periodicite_jours}
              onChange={(e) => setFormData((p) => ({ ...p, periodicite_jours: e.target.value }))}
              className={inputBase}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Délai de rappel (jours avant échéance)</label>
            <input
              type="number"
              value={formData.delai_rappel_jours}
              onChange={(e) => setFormData((p) => ({ ...p, delai_rappel_jours: e.target.value }))}
              className={inputBase}
            />
          </div>
        </div>
      </Modal>

      {/* Modal valider/rejeter paiement, avec preuve */}
      <Modal
        isOpen={!!paiementAction}
        onClose={() => { setPaiementAction(null); setCommentaireRejet(''); }}
        title={paiementAction?.mode === 'valider' ? 'Valider le paiement' : 'Rejeter le paiement'}
        subtitle={paiementAction?.echeance?.user ? `${paiementAction.echeance.user.prenoms || ''} ${paiementAction.echeance.user.nom || ''}`.trim() : ''}
        size="sm"
        onConfirm={handleConfirmPaiementAction}
        isLoading={isValidating}
        confirmLabel={paiementAction?.mode === 'valider' ? 'Valider' : 'Rejeter'}
        confirmVariant={paiementAction?.mode === 'rejeter' ? 'danger' : 'primary'}
      >
        {paiementAction?.echeance?.paiement && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="px-3 py-2 bg-slate-50 rounded-lg">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Méthode</p>
                <p className="font-semibold text-slate-900 capitalize">{paiementAction.echeance.paiement.methode}</p>
              </div>
              <div className="px-3 py-2 bg-slate-50 rounded-lg">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Référence</p>
                <p className="font-semibold text-slate-900">{paiementAction.echeance.paiement.reference_transaction || '—'}</p>
              </div>
            </div>

            {paiementAction.echeance.paiement.preuve_url_publique ? (
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Preuve de paiement</p>
                <img
                  src={paiementAction.echeance.paiement.preuve_url_publique}
                  alt="Preuve de paiement"
                  className="w-full rounded-xl border border-slate-200"
                />
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">Aucune preuve jointe.</p>
            )}

            {paiementAction.mode === 'rejeter' && (
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Motif du rejet (optionnel)</label>
                <textarea
                  value={commentaireRejet}
                  onChange={(e) => setCommentaireRejet(e.target.value)}
                  placeholder="Ex : preuve illisible, montant incorrect..."
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

export default AbonnementMarketplaceTab;
