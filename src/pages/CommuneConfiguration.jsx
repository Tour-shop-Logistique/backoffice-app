import React, { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchCommunes, addCommune, editCommune, deleteCommune, updateCommuneStatus } from '../redux/slices/communeSlice';
import {
  Loader2,
  MapPin,
  PlusCircle,
  Trash2,
  Search,
  RefreshCw,
  Edit3
} from 'lucide-react';
import Modal from '../components/common/Modal';
import CommuneForm from '../components/common/CommuneForm';
import RowActions from '../components/common/RowActions';
import { showNotification } from '../redux/slices/uiSlice';
import DeleteModal from '../components/common/DeleteModal';
import useHasPermission from '../hooks/useHasPermission';

const CommuneConfiguration = () => {
  const dispatch = useDispatch();
  const { communes, isLoading, hasLoaded } = useSelector((state) => state.communes);
  const canCreate = useHasPermission('communes.create');
  const canEdit = useHasPermission('communes.edit');
  const canDelete = useHasPermission('communes.delete');
  const canToggleStatus = useHasPermission('communes.toggle_status');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedCommune, setSelectedCommune] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [communeToDelete, setCommuneToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!hasLoaded && !isLoading) {
      dispatch(fetchCommunes());
    }
  }, [dispatch, hasLoaded, isLoading]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await dispatch(fetchCommunes({ silent: true })).unwrap();
      dispatch(showNotification({ type: 'success', message: 'Liste des communes mise à jour.' }));
    } catch (error) {
      dispatch(showNotification({ type: 'error', message: 'Erreur lors du rafraîchissement.' }));
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleAddCommune = async (communeData) => {
    setIsSubmitting(true);
    try {
      await dispatch(addCommune(communeData)).unwrap();
      setIsModalOpen(false);
      dispatch(showNotification({ type: 'success', message: 'Commune ajoutée avec succès.' }));
      dispatch(fetchCommunes({ silent: true }));
    } catch (error) {
      dispatch(showNotification({ type: 'error', message: error?.message || "Erreur lors de l'ajout de la commune." }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditCommune = async (communeData) => {
    setIsSubmitting(true);
    try {
      await dispatch(editCommune({ communeId: selectedCommune.id, communeData })).unwrap();
      setIsEditModalOpen(false);
      setSelectedCommune(null);
      dispatch(showNotification({ type: 'success', message: 'Commune modifiée avec succès.' }));
      dispatch(fetchCommunes({ silent: true }));
    } catch (error) {
      dispatch(showNotification({ type: 'error', message: error?.message || 'Erreur lors de la modification de la commune.' }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditModal = (commune) => {
    setSelectedCommune(commune);
    setIsEditModalOpen(true);
  };

  const handleDeleteCommune = async () => {
    if (!communeToDelete) return;
    setIsDeleting(true);
    try {
      await dispatch(deleteCommune(communeToDelete.id)).unwrap();
      dispatch(showNotification({ type: 'success', message: 'Commune supprimée avec succès.' }));
      setCommuneToDelete(null);
      dispatch(fetchCommunes({ silent: true }));
    } catch (error) {
      dispatch(showNotification({ type: 'error', message: error.message || 'Erreur lors de la suppression.' }));
    } finally {
      setIsDeleting(false);
    }
  };

  const handleStatusChange = async (communeId) => {
    try {
      setUpdatingStatus(prev => ({ ...prev, [communeId]: true }));
      await dispatch(updateCommuneStatus(communeId)).unwrap();
    } catch (error) {
      dispatch(showNotification({ type: 'error', message: 'Erreur lors du changement de statut.' }));
    } finally {
      setUpdatingStatus(prev => ({ ...prev, [communeId]: false }));
    }
  };

  const filteredBySearch = useMemo(() => {
    return (communes || []).filter(commune =>
      (commune.nom || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [communes, searchTerm]);

  const filteredCommunes = useMemo(() => {
    return filteredBySearch.filter(commune => {
      const matchesStatus = filterStatus === 'all' ||
        (filterStatus === 'active' && commune.actif) ||
        (filterStatus === 'inactive' && !commune.actif);
      return matchesStatus;
    });
  }, [filteredBySearch, filterStatus]);

  const counts = useMemo(() => ({
    all: filteredBySearch.length,
    active: filteredBySearch.filter(c => c.actif).length,
    inactive: filteredBySearch.filter(c => !c.actif).length
  }), [filteredBySearch]);

  return (
    <div className="space-y-4 pb-6 md:space-y-6 md:pb-12">
      <div className="sticky top-[-24px] md:top-[-32px] z-30 bg-[#f1f5f9] -mx-6 px-6 py-3 md:-mx-8 md:px-8 space-y-4 pt-4 lg:pt-2 pb-3">
        <header className="space-y-3 md:space-y-0 text-black">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
                Communes
              </h1>
              <p className="text-sm md:text-base text-slate-500 mt-0.5 font-medium">
                Communes utilisées pour la tarification interville
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

              {canCreate && (
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="flex items-center p-3 text-white text-sm font-medium bg-slate-900 hover:bg-slate-800 rounded-lg shadow-sm hover:shadow-lg transition-all"
                  title="Ajouter"
                >
                  <PlusCircle className="h-4 w-4" />
                  <span className="hidden md:inline md:ml-2">Ajouter</span>
                </button>
              )}
            </div>
          </div>
        </header>

        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-slate-900 transition-colors" />
          <input
            type="text"
            placeholder="Rechercher une commune..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 md:pl-12 pr-3 md:pr-4 py-2.5 md:py-3 bg-white border border-slate-200 rounded-lg shadow-sm focus:outline-none focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900 transition-all text-sm placeholder:text-slate-400 text-black font-medium"
          />
        </div>
      </div>

      <div className="bg-white rounded-lg md:rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="border-b border-slate-200 bg-slate-50/50">
          <div className="flex overflow-x-auto">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-4 md:px-6 py-2 md:py-3 text-xs md:text-sm font-medium whitespace-nowrap transition-all ${filterStatus === 'all' ? 'text-slate-900 border-b-2 border-slate-900 bg-white' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Toutes ({counts.all})
            </button>
            <button
              onClick={() => setFilterStatus('active')}
              className={`px-4 md:px-6 py-2 md:py-3 text-xs md:text-sm font-medium whitespace-nowrap transition-all ${filterStatus === 'active' ? 'text-emerald-600 border-b-2 border-emerald-600 bg-white' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Actives ({counts.active})
            </button>
            <button
              onClick={() => setFilterStatus('inactive')}
              className={`px-4 md:px-6 py-2 md:py-3 text-xs md:text-sm font-medium whitespace-nowrap transition-all ${filterStatus === 'inactive' ? 'text-rose-600 border-b-2 border-rose-600 bg-white' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Inactives ({counts.inactive})
            </button>
          </div>
        </div>

        {isLoading && communes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-6">
            <Loader2 className="animate-spin text-slate-900 mb-4" size={48} strokeWidth={1.5} />
            <p className="text-slate-500 font-medium text-sm">Chargement des communes...</p>
          </div>
        ) : filteredCommunes.length === 0 ? (
          <div className="py-20 text-center px-6">
            <div className="bg-slate-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <MapPin className="text-slate-400" size={32} />
            </div>
            <h3 className="font-bold text-slate-900 text-lg">Aucune commune trouvée</h3>
            <p className="text-slate-500 text-sm mt-2">Ajustez vos filtres ou ajoutez une nouvelle commune.</p>
          </div>
        ) : (
          <>
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50/50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Commune</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Statut</th>
                    <th className="px-6 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredCommunes.map((commune) => (
                    <tr key={commune.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-slate-400" />
                          <span className="font-semibold text-slate-900">{commune.nom}</span>
                        </div>
                      </td>
                      <td className="px-6 py-3">
                        {canToggleStatus ? (
                          <button
                            onClick={() => handleStatusChange(commune.id)}
                            disabled={updatingStatus[commune.id]}
                            className="group relative flex items-center gap-3 transition-all active:scale-95 disabled:opacity-50"
                            title={`Cliquez pour ${commune.actif ? 'désactiver' : 'activer'}`}
                          >
                            <div className={`relative w-10 h-5 rounded-full transition-colors duration-200 ${commune.actif ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                              <div className={`absolute top-0.5 left-0.5 bg-white w-4 h-4 rounded-full shadow-sm transform transition-transform duration-200 ${commune.actif ? 'translate-x-5' : 'translate-x-0'}`} />
                            </div>
                          </button>
                        ) : (
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${commune.actif ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                            {commune.actif ? 'Actif' : 'Inactif'}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-3">
                        <div className="flex items-center justify-end">
                          <RowActions
                            onEdit={canEdit ? () => openEditModal(commune) : undefined}
                            onDelete={canDelete ? () => setCommuneToDelete(commune) : undefined}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="md:hidden divide-y divide-slate-200">
              {filteredCommunes.map((commune) => (
                <div key={commune.id} className="p-3 space-y-2.5 active:bg-slate-50 transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <MapPin className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                      <span className="font-semibold text-slate-900 text-sm truncate">{commune.nom}</span>
                    </div>
                    {canToggleStatus ? (
                      <button
                        onClick={() => handleStatusChange(commune.id)}
                        disabled={updatingStatus[commune.id]}
                        className="flex items-center gap-2 active:scale-95 transition-all"
                      >
                        <div className={`relative w-8 h-4 rounded-full transition-colors ${commune.actif ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                          <div className={`absolute top-0.5 left-0.5 bg-white w-3 h-3 rounded-full transform transition-transform ${commune.actif ? 'translate-x-4' : 'translate-x-0'}`} />
                        </div>
                      </button>
                    ) : (
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${commune.actif ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                        {commune.actif ? 'Actif' : 'Inactif'}
                      </span>
                    )}
                  </div>

                  {(canEdit || canDelete) && (
                    <div className="flex gap-2">
                      {canEdit && (
                        <button
                          onClick={() => openEditModal(commune)}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-50 active:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-medium transition-all active:scale-95"
                        >
                          <Edit3 size={13} />
                          Modifier
                        </button>
                      )}
                      {canDelete && (
                        <button
                          onClick={() => setCommuneToDelete(commune)}
                          className="inline-flex items-center justify-center p-2 text-red-500 active:bg-red-50 border border-red-100 rounded-lg transition-all active:scale-95"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setIsSubmitting(false); }}
        title="Nouvelle Commune"
        subtitle="Ajoutez une commune utilisable dans la tarification interville"
        size="lg"
        confirmFormId="add-commune-form"
        isLoading={isSubmitting}
        confirmLabel="Créer la commune"
      >
        <CommuneForm id="add-commune-form" onSubmit={handleAddCommune} />
      </Modal>

      <Modal
        isOpen={isEditModalOpen}
        onClose={() => { setIsEditModalOpen(false); setSelectedCommune(null); setIsSubmitting(false); }}
        title="Modifier la Commune"
        subtitle="Mettez à jour le nom de la commune"
        size="lg"
        confirmFormId="edit-commune-form"
        isLoading={isSubmitting}
        confirmLabel="Enregistrer"
      >
        {selectedCommune && (
          <CommuneForm id="edit-commune-form" initialData={selectedCommune} onSubmit={handleEditCommune} />
        )}
      </Modal>

      <DeleteModal
        isOpen={!!communeToDelete}
        onClose={() => setCommuneToDelete(null)}
        onConfirm={handleDeleteCommune}
        itemName={communeToDelete?.nom}
        isLoading={isDeleting}
      />
    </div>
  );
};

export default CommuneConfiguration;
