import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  Loader2, UserCheck, RefreshCw, ShieldCheck, XCircle,
  Phone, IdCard, Car, MapPin, Calendar, User, ChevronRight, Bike,
} from 'lucide-react';
import { fetchLivreursEnAttente, validerLivreur, rejeterLivreur } from '../../redux/slices/livreurValidationSlice';
import { showNotification } from '../../redux/slices/uiSlice';
import useHasPermission from '../../hooks/useHasPermission';
import Modal from '../common/Modal';

const VEHICULE_LABELS = { moto: 'Moto', voiture: 'Voiture' };
const PIECE_LABELS = { cni: 'CNI', passeport: 'Passeport', permis_conduire: 'Permis de conduire' };

const VehiculeIcon = ({ type, size = 16 }) =>
  type === 'moto' ? <Bike size={size} /> : <Car size={size} />;

/**
 * Livreurs inscrits en self-service, en attente de validation de leurs
 * documents (pièce d'identité, véhicule) avant activation du compte —
 * voir AuthController::registerLivreur et LivreurController::validerInscription.
 */
const LivreursEnAttenteTab = () => {
  const dispatch = useDispatch();
  const canEdit = useHasPermission('livreurs.edit');
  const { livreursEnAttente, isLoadingEnAttente, enAttenteHasLoaded, isSaving } = useSelector(
    (state) => state.livreurValidation
  );

  const [selected, setSelected] = useState(null);
  const [action, setAction] = useState(null); // { livreur, mode: 'valider' | 'rejeter' }
  const [commentaire, setCommentaire] = useState('');

  const refresh = () => dispatch(fetchLivreursEnAttente());

  useEffect(() => {
    if (!enAttenteHasLoaded && !isLoadingEnAttente) refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Synchronise le panneau si les données sont rechargées après action
  useEffect(() => {
    if (selected) {
      const updated = livreursEnAttente.find((l) => l.id === selected.id);
      if (!updated) setSelected(null);
      else setSelected(updated);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [livreursEnAttente]);

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
      {/* En-tête */}
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
          {/* Tableau desktop */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50/50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left font-bold text-slate-500 uppercase tracking-wider text-xs">Livreur</th>
                  <th className="px-6 py-3 text-left font-bold text-slate-500 uppercase tracking-wider text-xs">Téléphone</th>
                  <th className="px-6 py-3 text-left font-bold text-slate-500 uppercase tracking-wider text-xs">Véhicule</th>
                  <th className="px-6 py-3 text-left font-bold text-slate-500 uppercase tracking-wider text-xs">Ville</th>
                  <th className="px-6 py-3 text-left font-bold text-slate-500 uppercase tracking-wider text-xs">Inscrit le</th>
                  <th className="px-6 py-3 text-right font-bold text-slate-500 uppercase tracking-wider text-xs">Voir détails</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {livreursEnAttente.map((livreur) => (
                  <tr
                    key={livreur.id}
                    onClick={() => setSelected(livreur)}
                    className={`cursor-pointer hover:bg-slate-50/80 transition-colors ${selected?.id === livreur.id ? 'bg-indigo-50/40' : ''}`}
                  >
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-2">
                        {livreur.photo_profil_url ? (
                          <img
                            src={livreur.photo_profil_url}
                            alt=""
                            className="w-8 h-8 rounded-full object-cover border border-slate-200"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                            <User className="h-4 w-4 text-slate-400" />
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
                      <div className="flex items-center gap-1.5">
                        <VehiculeIcon type={livreur.type_vehicule} size={14} />
                        {VEHICULE_LABELS[livreur.type_vehicule] || livreur.type_vehicule || '—'}
                        {livreur.numero_vehicule && (
                          <span className="text-slate-400">· {livreur.numero_vehicule}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-3 text-slate-600">{livreur.ville || '—'}</td>
                    <td className="px-6 py-3 text-slate-500">
                      {livreur.user?.created_at
                        ? format(new Date(livreur.user.created_at), 'dd MMM yyyy', { locale: fr })
                        : '—'}
                    </td>
                    <td className="px-6 py-3 text-right">
                      <ChevronRight className="inline text-slate-400" size={18} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Cards mobile */}
          <div className="md:hidden divide-y divide-slate-200">
            {livreursEnAttente.map((livreur) => (
              <button
                key={livreur.id}
                onClick={() => setSelected(livreur)}
                className="w-full text-left p-4 space-y-2.5 hover:bg-slate-50 active:bg-slate-100 transition-colors"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    {livreur.photo_profil_url ? (
                      <img
                        src={livreur.photo_profil_url}
                        alt=""
                        className="w-9 h-9 rounded-full object-cover border border-slate-200 flex-shrink-0"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                        <User className="h-4 w-4 text-slate-400" />
                      </div>
                    )}
                    <span className="font-semibold text-slate-900 text-sm truncate">
                      {nomComplet(livreur) || '—'}
                    </span>
                  </div>
                  <ChevronRight className="text-slate-400 flex-shrink-0" size={18} />
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap pl-11">
                  <span className="flex items-center gap-1">
                    <Phone className="h-3 w-3" /> {livreur.user?.telephone || '—'}
                  </span>
                  <span className="flex items-center gap-1">
                    <VehiculeIcon type={livreur.type_vehicule} size={12} />
                    {VEHICULE_LABELS[livreur.type_vehicule] || '—'}
                  </span>
                  {livreur.ville && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> {livreur.ville}
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </>
      )}

      {/* Panneau latéral détail */}
      <Modal
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        title="Dossier livreur"
        subtitle={selected ? nomComplet(selected) : ''}
        position="right"
        size="lg"
        showFooter={false}
      >
        {selected && (
          <div className="space-y-6">
            {/* Photo profil */}
            <div className="flex items-center gap-4">
              {selected.photo_profil_url ? (
                <img
                  src={selected.photo_profil_url}
                  alt=""
                  className="w-16 h-16 rounded-2xl object-cover border border-slate-200"
                />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center">
                  <User className="h-8 w-8 text-slate-400" />
                </div>
              )}
              <div>
                <p className="font-bold text-slate-900 text-lg leading-tight">{nomComplet(selected)}</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  <Calendar className="inline h-3 w-3 mr-1" />
                  Inscrit le{' '}
                  {selected.user?.created_at
                    ? format(new Date(selected.user.created_at), 'dd MMMM yyyy', { locale: fr })
                    : '—'}
                </p>
              </div>
            </div>

            {/* Infos contact */}
            <div className="grid grid-cols-1 gap-3">
              <InfoRow icon={<Phone size={15} />} label="Téléphone" value={selected.user?.telephone} />
              <InfoRow icon={<MapPin size={15} />} label="Ville" value={selected.ville} />
            </div>

            {/* Véhicule */}
            <Section title="Véhicule">
              <div className="grid grid-cols-2 gap-3">
                <InfoBlock label="Type" value={VEHICULE_LABELS[selected.type_vehicule] || selected.type_vehicule} />
                <InfoBlock label="Numéro" value={selected.numero_vehicule} />
                {selected.zone_de_livraison_km && (
                  <InfoBlock label="Zone (km)" value={`${selected.zone_de_livraison_km} km`} />
                )}
              </div>
            </Section>

            {/* Pièce d'identité */}
            <Section title="Pièce d'identité">
              <div className="grid grid-cols-2 gap-3 mb-3">
                <InfoBlock label="Type" value={PIECE_LABELS[selected.nom_piece_identite] || selected.nom_piece_identite} />
                <InfoBlock label="Numéro" value={selected.numero_piece_identite} />
              </div>
              {selected.piece_identite_url ? (
                <img
                  src={selected.piece_identite_url}
                  alt="Pièce d'identité"
                  className="w-full rounded-xl border border-slate-200 object-contain max-h-60"
                />
              ) : (
                <p className="text-xs text-slate-400 italic">Aucun document joint.</p>
              )}
            </Section>

            {/* Actions */}
            {canEdit && (
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setAction({ livreur: selected, mode: 'valider' })}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold text-sm transition-all active:scale-95"
                >
                  <ShieldCheck size={16} /> Valider
                </button>
                <button
                  onClick={() => setAction({ livreur: selected, mode: 'rejeter' })}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 bg-white border border-red-200 text-red-600 hover:bg-red-50 rounded-xl font-semibold text-sm transition-all active:scale-95"
                >
                  <XCircle size={16} /> Rejeter
                </button>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Modal confirmation valider/rejeter */}
      <Modal
        isOpen={!!action}
        onClose={() => { setAction(null); setCommentaire(''); }}
        title={action?.mode === 'valider' ? "Confirmer la validation" : "Confirmer le rejet"}
        subtitle={action?.livreur ? nomComplet(action.livreur) : ''}
        size="sm"
        onConfirm={handleConfirmAction}
        isLoading={isSaving}
        confirmLabel={action?.mode === 'valider' ? 'Valider le compte' : 'Rejeter'}
        confirmVariant={action?.mode === 'rejeter' ? 'danger' : 'primary'}
      >
        {action?.livreur && (
          <div className="space-y-4">
            {action.mode === 'valider' ? (
              <p className="text-sm text-slate-600">
                Le compte de <strong>{nomComplet(action.livreur)}</strong> sera activé et le livreur
                pourra se connecter et recevoir des missions.
              </p>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-slate-600">
                  L'inscription de <strong>{nomComplet(action.livreur)}</strong> sera rejetée.
                  Le livreur recevra une notification.
                </p>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                    Motif du rejet (optionnel)
                  </label>
                  <textarea
                    value={commentaire}
                    onChange={(e) => setCommentaire(e.target.value)}
                    placeholder="Ex : document illisible, informations incohérentes..."
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900 text-sm font-medium text-slate-900 transition-all min-h-[80px] resize-none"
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

const InfoRow = ({ icon, label, value }) => (
  <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 rounded-xl">
    <span className="text-slate-400">{icon}</span>
    <div className="min-w-0">
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
      <p className="font-semibold text-slate-900 text-sm truncate">{value || '—'}</p>
    </div>
  </div>
);

const InfoBlock = ({ label, value }) => (
  <div className="px-3 py-2.5 bg-slate-50 rounded-xl">
    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">{label}</p>
    <p className="font-semibold text-slate-900 text-sm">{value || '—'}</p>
  </div>
);

const Section = ({ title, children }) => (
  <div>
    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">{title}</p>
    {children}
  </div>
);

export default LivreursEnAttenteTab;
