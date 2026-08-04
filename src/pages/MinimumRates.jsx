import React, { useState, useEffect, useMemo } from 'react';
import { PlusCircle, Loader2, RefreshCw, Search, ShieldCheck, Plane, Ship } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { showNotification } from '../redux/slices/uiSlice';
import {
  fetchMinimumGroupedTarifs,
  upsertMinimumGroupedTarif,
  deleteMinimumGroupedTarif,
} from '../redux/slices/tarificationSlice';
import AddMinimumTarif from '../components/widget/AddMinimumTarif';
import Modal from '../components/common/Modal';
import DeleteModal from '../components/common/DeleteModal';
import RowActions from '../components/common/RowActions';
import useHasPermission from '../hooks/useHasPermission';

const getTypeLabel = (type) => {
  switch (type) {
    case 'groupage_dhd_aerien': return 'DHD Aérien';
    case 'groupage_dhd_maritime': return 'DHD Maritime';
    default: return type || 'N/A';
  }
};

const getTypeIcon = (type) => (type === 'groupage_dhd_aerien' ? Plane : Ship);

const MinimumRates = () => {
  const dispatch = useDispatch();
  const canCreate = useHasPermission('tarification_groupage.create');
  const canEdit = useHasPermission('tarification_groupage.edit');
  const canDelete = useHasPermission('tarification_groupage.delete');

  const { minimumGroupedTarifs, isLoadingMinimumGrouped, minimumGroupedHasLoaded } = useSelector(
    (state) => state.tarification
  );

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [tarifToEdit, setTarifToEdit] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tarifToDelete, setTarifToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!minimumGroupedHasLoaded && !isLoadingMinimumGrouped) {
      dispatch(fetchMinimumGroupedTarifs());
    }
  }, [dispatch, minimumGroupedHasLoaded, isLoadingMinimumGrouped]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await dispatch(fetchMinimumGroupedTarifs({ silent: true })).unwrap();
      dispatch(showNotification({ type: 'success', message: 'Tarifs minimum mis à jour.' }));
    } catch (err) {
      dispatch(showNotification({ type: 'error', message: 'Erreur lors du rafraîchissement.' }));
    } finally {
      setIsRefreshing(false);
    }
  };

  const openModal = (tarif = null) => {
    setTarifToEdit(tarif);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setTarifToEdit(null);
  };

  const handleSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      await dispatch(upsertMinimumGroupedTarif(data)).unwrap();
      dispatch(showNotification({ type: 'success', message: 'Tarif minimum enregistré avec succès.' }));
      closeModal();
    } catch (err) {
      dispatch(showNotification({ type: 'error', message: err?.message || "Erreur lors de l'enregistrement." }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!tarifToDelete) return;
    setIsDeleting(true);
    try {
      await dispatch(deleteMinimumGroupedTarif(tarifToDelete.id)).unwrap();
      dispatch(showNotification({ type: 'success', message: 'Tarif minimum supprimé avec succès.' }));
      setTarifToDelete(null);
    } catch (err) {
      dispatch(showNotification({ type: 'error', message: 'Erreur lors de la suppression.' }));
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredTarifs = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return minimumGroupedTarifs || [];
    return (minimumGroupedTarifs || []).filter((t) =>
      (t.ligne || '').toLowerCase().includes(term) || getTypeLabel(t.type_expedition).toLowerCase().includes(term)
    );
  }, [minimumGroupedTarifs, searchTerm]);

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-start gap-3">
          <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-lg border border-indigo-100 shrink-0">
            <ShieldCheck size={20} />
          </div>
          <div>
            <h2 className="font-bold text-slate-900">Tarifs minimum DHD par ligne</h2>
            <p className="text-sm text-slate-500 mt-0.5 max-w-xl">
              Si le tarif DHD calculé pour une ligne (départ → arrivée) est en dessous de ce plancher, ce tarif minimum est utilisé à la place.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="inline-flex items-center justify-center p-3 text-sm font-medium rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-all disabled:opacity-50 shadow-sm"
            title="Rafraîchir"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
          {canCreate && (
            <button
              onClick={() => openModal(null)}
              className="flex items-center gap-2 p-3 text-white text-sm font-medium bg-slate-900 hover:bg-slate-800 rounded-lg shadow-sm hover:shadow-lg transition-all"
            >
              <PlusCircle className="h-4 w-4" />
              <span className="hidden md:inline">Nouveau tarif minimum</span>
            </button>
          )}
        </div>
      </div>

      <div className="relative group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-slate-900 transition-colors" />
        <input
          type="text"
          placeholder="Rechercher par ligne ou mode..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-12 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg shadow-sm focus:outline-none focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900 transition-all text-sm placeholder:text-slate-400 text-black font-medium"
        />
      </div>

      <div className="bg-white rounded-lg md:rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoadingMinimumGrouped && (minimumGroupedTarifs || []).length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-6">
            <Loader2 className="animate-spin text-slate-900 mb-4" size={48} strokeWidth={1.5} />
            <p className="text-slate-500 font-medium text-sm">Chargement des tarifs minimum...</p>
          </div>
        ) : filteredTarifs.length === 0 ? (
          <div className="py-20 text-center px-6">
            <div className="bg-slate-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShieldCheck className="text-slate-400" size={32} />
            </div>
            <h3 className="font-bold text-slate-900 text-lg">Aucun tarif minimum configuré</h3>
            <p className="text-slate-500 text-sm mt-2">Ajoutez un plancher pour une ligne DHD afin de garantir un tarif minimum.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredTarifs.map((tarif) => {
              const TypeIcon = getTypeIcon(tarif.type_expedition);
              return (
                <div key={tarif.id} className="p-4 md:p-5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center border border-slate-200 shrink-0">
                      <TypeIcon size={18} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-slate-900 capitalize truncate">{(tarif.ligne || '').replace('-', ' → ')}</p>
                        <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full uppercase tracking-wide">
                          {getTypeLabel(tarif.type_expedition)}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Base: {Number(tarif.montant_base).toLocaleString()} FCFA · Prestation: {tarif.pourcentage_prestation}%
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    <p className="text-sm font-bold text-indigo-600 whitespace-nowrap">
                      {Number(tarif.montant_expedition).toLocaleString()} FCFA
                    </p>
                    <RowActions
                      onEdit={canEdit ? () => openModal(tarif) : undefined}
                      onDelete={canDelete ? () => setTarifToDelete(tarif) : undefined}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Modal
        isOpen={showModal}
        onClose={closeModal}
        title={tarifToEdit ? 'Modifier le tarif minimum' : 'Nouveau tarif minimum'}
        subtitle="Plancher appliqué si le tarif DHD calculé pour cette ligne est en dessous"
        size="md"
        confirmFormId="minimum-tarif-form"
        isLoading={isSubmitting}
        confirmLabel={tarifToEdit ? 'Mettre à jour' : 'Enregistrer'}
      >
        <AddMinimumTarif id="minimum-tarif-form" tarifToEdit={tarifToEdit} onSubmit={handleSubmit} />
      </Modal>

      <DeleteModal
        isOpen={!!tarifToDelete}
        onClose={() => setTarifToDelete(null)}
        onConfirm={handleDelete}
        itemName={tarifToDelete ? `${getTypeLabel(tarifToDelete.type_expedition)} - ${tarifToDelete.ligne}` : ''}
        isLoading={isDeleting}
      />
    </div>
  );
};

export default MinimumRates;
