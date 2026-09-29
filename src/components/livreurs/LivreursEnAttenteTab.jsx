import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Loader2, UserCheck, RefreshCw, ShieldCheck, XCircle, Phone, IdCard } from 'lucide-react';
import { fetchLivreursEnAttente, validerLivreur, rejeterLivreur } from '../../redux/slices/livreurValidationSlice';
import { showNotification } from '../../redux/slices/uiSlice';
import useHasPermission from '../../hooks/useHasPermission';
import Modal from '../common/Modal';

const VEHICULE_LABELS = { moto: 'Moto', voiture: 'Voiture' };
const PIECE_LABELS = { cni: 'CNI', passeport: 'Passeport', permis_conduire: 'Permis de conduire' };

/**
 * Livreurs inscrits en self-service, en attente de validation de leurs
 * documents (pièce d'identité, véhicule) avant activation de leur compte -
 * voir AuthController::registerLivreur et LivreurController::validerInscription.
 */
const LivreursEnAttenteTab = () => {
  const dispatch = useDispatch();
  const canEdit = useHasPermission('livreurs.edit');
  const { livreursEnAttente, isLoadingEnAttente, enAttenteHasLoaded, isSaving } = useSelector((state) => state.livreurValidation);

  const [action, setAction] = useState(null); // { livreur, mode: 'valider' | 'rejeter' }
  const [commentaire, setCommentaire] = useState('');
  const [imageAgrandie, setImageAgrandie] = useState(null);

  const refresh = () => dispatch(fetchLivreursEnAttente());

  useEffect(() => {
    if (!enAttenteHasLoaded && !isLoadingEnAttente) {
      refresh();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const nomComplet = (livreur) => `${livreur.user?.prenoms || ''} ${livreur.user?.nom || ''}`.trim();

  const handleConfirmAction = async () => {
    if (!action) return;
    try {
      if (action.mode === 'valider') {
        await dispatch(validerLivreur(action.livreur.id)).unwrap();
        dispatch(showNotification({ type: 'success', message: 'Livreur validé, son compte est maintenant actif.' }));
      } else {
        await dispatch(rejeterLivreur({ livreurId: action.livreur.id, commentaire: commentaire || null })).unwrap();
        dispatch(showNotification({ type: 'success', message: 'Inscription rejetée.' }));
      }
      setAction(null);
      setCommentaire('');
    } catch (err) {
      dispatch(showNotification({ type: 'error', message: err || 'Erreur lors du traitement.' }));
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-4 sm:px-6 py-4 border-b border-slate-100 flex items-center justify-between">
        <p className="text-sm text-slate-500 font-medium">
          {livreursEnAttente.length} livreur{livreursEnAttente.length > 1 ? 's' : ''} en attente de validation
        </p>
        <button
          onClick={refresh}
          disabled={isLoadingEnAttente}
          className="p-2 bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-all active:scale-95 disabled:opacity-50"
        >
          {isLoadingEnAttente ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
        </button>
      </div>

      {isLoadingEnAttente && livreursEnAttente.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-6">
          <Loader2 className="animate-spin text-slate-900 mb-4" size={40} strokeWidth={1.5} />
          <p className="text-slate-500 font-medium text-sm">Chargement...</p>
        </div>
      ) : livreursEnAttente.length === 0 ? (
        <div className="py-20 text-center px-6">
          <div className="bg-slate-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <UserCheck className="text-slate-400" size={32} />
          </div>
          <h3 className="font-bold text-slate-900 text-lg">Aucune inscription en attente</h3>
          <p className="text-slate-500 text-sm mt-2">Les nouvelles inscriptions self-service apparaîtront ici.</p>
        </div>
      ) : (
        <>
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50/50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left font-bold text-slate-500 uppercase tracking-wider text-xs">Livreur</th>
                  <th className="px-6 py-3 text-left font-bold text-slate-500 uppercase tracking-wider text-xs">Téléphone</th>
                  <th className="px-6 py-3 text-left font-bold text-slate-500 uppercase tracking-wider text-xs">Véhicule</th>
                  <th className="px-6 py-3 text-left font-bold text-slate-500 uppercase tracking-wider text-xs">Pièce d'identité</th>
                  <th className="px-6 py-3 text-left font-bold text-slate-500 uppercase tracking-wider text-xs">Inscrit le</th>
                  <th className="px-6 py-3 text-right font-bold text-slate-500 uppercase tracking-wider text-xs">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {livreursEnAttente.map((livreur) => (
                  <tr key={livreur.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-2">
                        {livreur.photo_profil_url ? (
                          <img
                            src={livreur.photo_profil_url}
                            alt=""
                            onClick={() => setImageAgrandie(livreur.photo_profil_url)}
                            className="w-8 h-8 rounded-full object-cover border border-slate-200 cursor-pointer"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                            <UserCheck className="h-4 w-4 text-slate-400" />
                          </div>
                        )}
                        <span className="font-semibold text-slate-900">{nomComplet(livreur) || '—'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <Phone className="h-3.5 w-3.5 text-slate-400" />
                        {livreur.user?.telephone || '—'}
                      </div>
                    </td>
                    <td className="px-6 py-3 text-slate-600">
                      {VEHICULE_LABELS[livreur.type_vehicule] || livreur.type_vehicule || '—'}
                      {livreur.numero_vehicule && <span className="text-slate-400"> · {livreur.numero_vehicule}</span>}
                    </td>
                    <td className="px-6 py-3">
                      {livreur.piece_identite_url ? (
                        <button
                          onClick={() => setImageAgrandie(livreur.piece_identite_url)}
                          className="inline-flex items-center gap-1.5 text-indigo-600 hover:text-indigo-800 font-medium"
                        >
                          <IdCard className="h-3.5 w-3.5" />
                          {PIECE_LABELS[livreur.nom_piece_identite] || livreur.nom_piece_identite || 'Document'}
                        </button>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-3 text-slate-500">
                      {livreur.user?.created_at ? format(new Date(livreur.user.created_at), 'dd MMM yyyy', { locale: fr }) : '—'}
                    </td>
                    <td className="px-6 py-3 text-right">
                      {canEdit && (
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setAction({ livreur, mode: 'valider' })}
                            className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                            title="Valider l'inscription"
                          >
                            <ShieldCheck size={16} />
                          </button>
                          <button
                            onClick={() => setAction({ livreur, mode: 'rejeter' })}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Rejeter l'inscription"
                          >
                            <XCircle size={16} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="md:hidden divide-y divide-slate-200">
            {livreursEnAttente.map((livreur) => (
              <div key={livreur.id} className="p-3 space-y-2.5">
                <div className="flex items-center gap-2">
                  {livreur.photo_profil_url ? (
                    <img
                      src={livreur.photo_profil_url}
                      alt=""
                      onClick={() => setImageAgrandie(livreur.photo_profil_url)}
                      className="w-8 h-8 rounded-full object-cover border border-slate-200"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                      <UserCheck className="h-4 w-4 text-slate-400" />
                    </div>
                  )}
                  <span className="font-semibold text-slate-900 text-sm truncate">{nomComplet(livreur) || '—'}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                  <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {livreur.user?.telephone || '—'}</span>
                  <span>{VEHICULE_LABELS[livreur.type_vehicule] || livreur.type_vehicule || '—'}</span>
                </div>
                {livreur.piece_identite_url && (
                  <button
                    onClick={() => setImageAgrandie(livreur.piece_identite_url)}
                    className="inline-flex items-center gap-1.5 text-indigo-600 text-xs font-medium"
                  >
                    <IdCard className="h-3.5 w-3.5" />
                    Voir {PIECE_LABELS[livreur.nom_piece_identite] || 'le document'}
                  </button>
                )}
                {canEdit && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => setAction({ livreur, mode: 'valider' })}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-lg text-xs font-medium active:scale-95 transition-all"
                    >
                      <ShieldCheck size={13} /> Valider
                    </button>
                    <button
                      onClick={() => setAction({ livreur, mode: 'rejeter' })}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-red-50 text-red-600 border border-red-100 rounded-lg text-xs font-medium active:scale-95 transition-all"
                    >
                      <XCircle size={13} /> Rejeter
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {/* Modal valider/rejeter */}
      <Modal
        isOpen={!!action}
        onClose={() => { setAction(null); setCommentaire(''); }}
        title={action?.mode === 'valider' ? "Valider l'inscription" : "Rejeter l'inscription"}
        subtitle={action?.livreur ? nomComplet(action.livreur) : ''}
        size="sm"
        onConfirm={handleConfirmAction}
        isLoading={isSaving}
        confirmLabel={action?.mode === 'valider' ? 'Valider' : 'Rejeter'}
        confirmVariant={action?.mode === 'rejeter' ? 'danger' : 'primary'}
      >
        {action?.livreur && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="px-3 py-2 bg-slate-50 rounded-lg">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Pièce d'identité</p>
                <p className="font-semibold text-slate-900">{PIECE_LABELS[action.livreur.nom_piece_identite] || '—'}</p>
              </div>
              <div className="px-3 py-2 bg-slate-50 rounded-lg">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Numéro</p>
                <p className="font-semibold text-slate-900">{action.livreur.numero_piece_identite || '—'}</p>
              </div>
            </div>

            {action.livreur.piece_identite_url ? (
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Document</p>
                <img
                  src={action.livreur.piece_identite_url}
                  alt="Pièce d'identité"
                  className="w-full rounded-xl border border-slate-200"
                />
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">Aucun document joint.</p>
            )}

            {action.mode === 'rejeter' && (
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Motif du rejet (optionnel)</label>
                <textarea
                  value={commentaire}
                  onChange={(e) => setCommentaire(e.target.value)}
                  placeholder="Ex : document illisible, informations incohérentes..."
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900 text-sm font-medium text-slate-900 transition-all min-h-[80px] resize-none"
                />
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Image agrandie (pièce d'identité / photo de profil) */}
      <Modal
        isOpen={!!imageAgrandie}
        onClose={() => setImageAgrandie(null)}
        title="Document"
        size="2xl"
      >
        {imageAgrandie && <img src={imageAgrandie} alt="Document agrandi" className="w-full rounded-xl" />}
      </Modal>
    </div>
  );
};

export default LivreursEnAttenteTab;
