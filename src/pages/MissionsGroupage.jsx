import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchMissionsEnAttente,
  fetchLivreursDisponibles,
  assignerMission,
} from '../redux/slices/missionGroupageSlice';
import {
  Loader2,
  Truck,
  Search,
  RefreshCw,
  Phone,
  MapPin,
  UserCheck,
} from 'lucide-react';
import Modal from '../components/common/Modal';
import { showNotification } from '../redux/slices/uiSlice';
import useHasPermission from '../hooks/useHasPermission';

// Le contact pertinent pour une Mission d'enlèvement est l'expéditeur (celui
// chez qui le livreur doit passer récupérer le colis) — pas le destinataire.
const contactEnlevement = (expedition) => expedition?.expediteur || {};

const MissionsGroupage = () => {
  const dispatch = useDispatch();
  const { missions, isLoading, hasLoaded, livreursDisponibles, isLoadingLivreurs } = useSelector(
    (state) => state.missionGroupage
  );
  const canAssign = useHasPermission('missions.assign');

  const [searchTerm, setSearchTerm] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [missionToAssign, setMissionToAssign] = useState(null);
  const [selectedLivreurId, setSelectedLivreurId] = useState('');
  const [montant, setMontant] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!hasLoaded && !isLoading) {
      dispatch(fetchMissionsEnAttente());
    }
  }, [dispatch, hasLoaded, isLoading]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await dispatch(fetchMissionsEnAttente({ silent: true })).unwrap();
      dispatch(showNotification({ type: 'success', message: 'Liste des missions mise à jour.' }));
    } catch (error) {
      dispatch(showNotification({ type: 'error', message: 'Erreur lors du rafraîchissement.' }));
    } finally {
      setIsRefreshing(false);
    }
  };

  const openAssignModal = (mission) => {
    setMissionToAssign(mission);
    setSelectedLivreurId('');
    setMontant(mission.montant_fixe != null ? String(mission.montant_fixe) : '');
    dispatch(fetchLivreursDisponibles());
  };

  const closeAssignModal = () => {
    setMissionToAssign(null);
    setSelectedLivreurId('');
    setMontant('');
  };

  const handleAssigner = async (e) => {
    e.preventDefault();
    if (!missionToAssign || !selectedLivreurId) return;

    const tarifResolu = missionToAssign.montant_fixe != null;
    setIsSubmitting(true);
    try {
      await dispatch(
        assignerMission({
          missionId: missionToAssign.id,
          payload: {
            livreur_id: selectedLivreurId,
            ...(tarifResolu ? {} : { montant: montant !== '' ? Number(montant) : null }),
          },
        })
      ).unwrap();
      dispatch(showNotification({ type: 'success', message: 'Livreur assigné avec succès.' }));
      closeAssignModal();
    } catch (error) {
      dispatch(showNotification({ type: 'error', message: error?.message || "Erreur lors de l'assignation." }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredMissions = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return (missions || []).filter((mission) => {
      const contact = contactEnlevement(mission.expedition);
      return (
        (mission.expedition?.reference || '').toLowerCase().includes(term) ||
        (contact.nom || '').toLowerCase().includes(term) ||
        (contact.telephone || '').toLowerCase().includes(term)
      );
    });
  }, [missions, searchTerm]);

  const tarifResoluPourModal = missionToAssign?.montant_fixe != null;

  return (
    <div className="space-y-4 pb-6 md:space-y-6 md:pb-12">
      <div className="sticky top-[-24px] md:top-[-32px] z-30 bg-[#f1f5f9] -mx-6 px-6 py-3 md:-mx-8 md:px-8 space-y-4 pt-4 lg:pt-2 pb-3">
        <header className="space-y-3 md:space-y-0 text-black">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
                Missions groupage
              </h1>
              <p className="text-sm md:text-base text-slate-500 mt-0.5 font-medium">
                Demandes d'enlèvement en attente d'un livreur de votre backoffice
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="inline-flex items-center justify-center p-3 text-sm font-medium rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-all disabled:opacity-50 shadow-sm"
                title="Rafraîchir"
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span className="hidden md:inline md:ml-2">Rafraîchir</span>
              </button>
            </div>
          </div>
        </header>

        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-slate-900 transition-colors" />
          <input
            type="text"
            placeholder="Rechercher (référence, expéditeur, téléphone)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 md:pl-12 pr-3 md:pr-4 py-2.5 md:py-3 bg-white border border-slate-200 rounded-lg shadow-sm focus:outline-none focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900 transition-all text-sm placeholder:text-slate-400 text-black font-medium"
          />
        </div>
      </div>

      <div className="bg-white rounded-lg md:rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading && missions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-6">
            <Loader2 className="animate-spin text-slate-900 mb-4" size={48} strokeWidth={1.5} />
            <p className="text-slate-500 font-medium text-sm">Chargement des missions...</p>
          </div>
        ) : filteredMissions.length === 0 ? (
          <div className="py-20 text-center px-6">
            <div className="bg-slate-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Truck className="text-slate-400" size={32} />
            </div>
            <h3 className="font-bold text-slate-900 text-lg">Aucune mission en attente</h3>
            <p className="text-slate-500 text-sm mt-2">
              Les demandes d'enlèvement en mode groupage apparaîtront ici.
            </p>
          </div>
        ) : (
          <>
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50/50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Expédition</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Expéditeur</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Lieu d'enlèvement</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Tarif</th>
                    <th className="px-6 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredMissions.map((mission) => {
                    const contact = contactEnlevement(mission.expedition);
                    return (
                      <tr key={mission.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-3">
                          <span className="font-semibold text-slate-900">{mission.expedition?.reference || '—'}</span>
                        </td>
                        <td className="px-6 py-3">
                          <div className="text-slate-900 font-medium">{contact.nom || '—'}</div>
                          <div className="flex items-center gap-1.5 text-slate-500 text-xs mt-0.5">
                            <Phone className="h-3 w-3" />
                            {contact.telephone || '—'}
                          </div>
                        </td>
                        <td className="px-6 py-3">
                          <div className="flex items-center gap-1.5 text-slate-600 text-sm">
                            <MapPin className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                            <span className="truncate max-w-xs">{mission.expedition?.instructions_enlevement || '—'}</span>
                          </div>
                        </td>
                        <td className="px-6 py-3 text-slate-600">
                          {mission.montant_fixe != null ? `${mission.montant_fixe} FCFA` : 'À saisir'}
                        </td>
                        <td className="px-6 py-3">
                          <div className="flex items-center justify-end">
                            {canAssign && (
                              <button
                                onClick={() => openAssignModal(mission)}
                                className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium rounded-lg shadow-sm transition-all"
                              >
                                <UserCheck size={14} />
                                Assigner
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
              {filteredMissions.map((mission) => {
                const contact = contactEnlevement(mission.expedition);
                return (
                  <div key={mission.id} className="p-3 space-y-2.5 active:bg-slate-50 transition-colors">
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-semibold text-slate-900 text-sm truncate">{mission.expedition?.reference || '—'}</span>
                      <span className="text-xs text-slate-600 flex-shrink-0">
                        {mission.montant_fixe != null ? `${mission.montant_fixe} FCFA` : 'À saisir'}
                      </span>
                    </div>

                    <div className="text-sm text-slate-700">{contact.nom || '—'}</div>
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3" /> {contact.telephone || '—'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <MapPin className="h-3 w-3 flex-shrink-0" />
                      <span className="truncate">{mission.expedition?.instructions_enlevement || '—'}</span>
                    </div>

                    {canAssign && (
                      <button
                        onClick={() => openAssignModal(mission)}
                        className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-900 active:bg-slate-800 text-white text-xs font-medium rounded-lg transition-all active:scale-95"
                      >
                        <UserCheck size={14} />
                        Assigner un livreur
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      <Modal
        isOpen={!!missionToAssign}
        onClose={closeAssignModal}
        title="Assigner un livreur"
        subtitle={missionToAssign?.expedition?.reference}
        size="md"
        confirmFormId="assign-mission-form"
        isLoading={isSubmitting}
        confirmLabel="Assigner"
        confirmDisabled={!selectedLivreurId}
      >
        <form id="assign-mission-form" onSubmit={handleAssigner} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5 ml-1">
              Livreur disponible
            </label>
            {isLoadingLivreurs ? (
              <div className="flex items-center gap-2 text-slate-500 text-sm py-2">
                <Loader2 className="animate-spin h-4 w-4" /> Chargement des livreurs...
              </div>
            ) : livreursDisponibles.length === 0 ? (
              <p className="text-sm text-slate-500 py-2">Aucun livreur disponible pour le moment.</p>
            ) : (
              <select
                value={selectedLivreurId}
                onChange={(e) => setSelectedLivreurId(e.target.value)}
                required
                className="w-full px-3 py-2.5 border rounded-md focus:ring-2 focus:ring-violet-500 focus:border-violet-500 bg-white transition-all font-medium text-slate-800"
              >
                <option value="" disabled>Sélectionner un livreur</option>
                {livreursDisponibles.map((livreur) => (
                  <option key={livreur.user_id} value={livreur.user_id}>
                    {`${livreur.user?.nom || ''} ${livreur.user?.prenoms || ''}`.trim()} — {livreur.type_vehicule}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5 ml-1">
              Tarif (FCFA)
            </label>
            <input
              type="number"
              min="0"
              step="1"
              value={montant}
              onChange={(e) => setMontant(e.target.value)}
              disabled={tarifResoluPourModal}
              required={!tarifResoluPourModal}
              placeholder="Montant à verser au livreur"
              className="w-full px-3 py-2.5 border rounded-md focus:ring-2 focus:ring-violet-500 focus:border-violet-500 bg-white transition-all font-medium text-slate-800 disabled:bg-slate-50 disabled:text-slate-500"
            />
            {tarifResoluPourModal && (
              <p className="text-xs text-slate-400 mt-1 ml-1">Tarif déjà résolu automatiquement pour cet enlèvement.</p>
            )}
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default MissionsGroupage;
