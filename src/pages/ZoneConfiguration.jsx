import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchZones, addZone, editZone, deleteZone, updateZoneStatus } from '../redux/slices/zoneSlice';
import {
  Loader2,
  MapPin,
  PlusCircle,
  Edit2,
  Trash2,
  Globe2,
  Search,
  Eye,
  RefreshCw,
  Edit3
} from 'lucide-react';
import Modal from '../components/common/Modal';
import ZoneForm from '../components/common/ZoneForm';
import { showNotification } from '../redux/slices/uiSlice';
import DeleteModal from '../components/common/DeleteModal';

const ZoneConfiguration = () => {
  const dispatch = useDispatch();
  const { zones, isLoading, error, hasLoaded } = useSelector((state) => state.zones);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedZone, setSelectedZone] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [viewCountries, setViewCountries] = useState(null);
  const [notification, setNotification] = useState(null);
  const [zoneToDelete, setZoneToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!hasLoaded) {
      dispatch(fetchZones());
    }
  }, [dispatch, hasLoaded]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await dispatch(fetchZones({ silent: true })).unwrap();
      dispatch(showNotification({ type: 'success', message: 'Liste des zones mise à jour.' }));
    } catch (error) {
      dispatch(showNotification({ type: 'error', message: 'Erreur lors du rafraîchissement.' }));
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleAddZone = async (zoneData) => {
    setIsSubmitting(true);
    try {
      const result = await dispatch(addZone(zoneData)).unwrap();
      if (result) {
        setIsModalOpen(false);
        dispatch(showNotification({ type: 'success', message: 'Zone ajoutée avec succès.' }));
        dispatch(fetchZones({ silent: true }));
      }
    } catch (error) {
      dispatch(showNotification({ type: 'error', message: "Erreur lors de l'ajout de la zone." }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditZone = async (zoneData) => {
    setIsSubmitting(true);
    try {
      const result = await dispatch(editZone({ zoneId: selectedZone.id, zoneData })).unwrap();
      if (result) {
        setIsEditModalOpen(false);
        setSelectedZone(null);
        dispatch(showNotification({ type: 'success', message: 'Zone modifiée avec succès.' }));
        dispatch(fetchZones({ silent: true }));
      }
    } catch (error) {
      dispatch(showNotification({ type: 'error', message: 'Erreur lors de la modification de la zone.' }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditModal = (zone) => {
    setSelectedZone(zone);
    setIsEditModalOpen(true);
  };

  const handleDeleteZone = async () => {
    if (!zoneToDelete) return;

    setIsDeleting(true);
    try {
      await dispatch(deleteZone(zoneToDelete.id)).unwrap();
      dispatch(showNotification({ type: 'success', message: 'Zone supprimée avec succès.' }));
      setZoneToDelete(null);
      dispatch(fetchZones({ silent: true }));
    } catch (error) {
      dispatch(showNotification({ type: 'error', message: error.message || 'Erreur lors de la suppression.' }));
    } finally {
      setIsDeleting(false);
    }
  };

  const handleStatusChange = async (zoneId, currentStatus) => {
    try {
      setUpdatingStatus(prev => ({ ...prev, [zoneId]: true }));
      const newStatus = !currentStatus;

      await dispatch(updateZoneStatus({
        zoneId,
        status: newStatus
      })).unwrap();
      // dispatch(showNotification({ type: 'success', message: 'Statut mis à jour.' }));
    } catch (error) {
      console.error('Erreur lors du changement de statut:', error);
      dispatch(showNotification({ type: 'error', message: 'Erreur lors du changement de statut.' }));
    } finally {
      setUpdatingStatus(prev => ({ ...prev, [zoneId]: false }));
    }
  };

  // 1. Filtrer d'abord par recherche (pour les compteurs)
  const filteredBySearch = useMemo(() => {
    return (zones || []).filter(zone => {
      const nom = zone.nom || '';
      const pays = Array.isArray(zone.pays) ? zone.pays : [];
      const search = searchTerm.toLowerCase();

      return nom.toLowerCase().includes(search) ||
        pays.some(p => p.toLowerCase().includes(search));
    });
  }, [zones, searchTerm]);

  // 2. Filtrer par statut pour l'affichage
  const filteredZones = useMemo(() => {
    return filteredBySearch.filter(zone => {
      const matchesStatus = filterStatus === 'all' ||
        (filterStatus === 'active' && zone.actif) ||
        (filterStatus === 'inactive' && !zone.actif);
      return matchesStatus;
    });
  }, [filteredBySearch, filterStatus]);

  // 3. Compteurs basés sur la recherche uniquement
  const counts = useMemo(() => ({
    all: filteredBySearch.length,
    active: filteredBySearch.filter(z => z.actif).length,
    inactive: filteredBySearch.filter(z => !z.actif).length
  }), [filteredBySearch]);

  return (
    <div className="space-y-4 pb-6 md:space-y-6 md:pb-12">

      {/* HEADER - Mobile Optimized */}
      <header className="space-y-3 md:space-y-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
              Gestion des Zones
            </h1>
            <p className="text-xs md:text-sm text-slate-500 mt-0.5">
              Gérez les zones géographiques de livraison
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="inline-flex items-center justify-center p-3 text-sm font-medium rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-all disabled:opacity-50"
              title="Rafraîchir"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="hidden md:inline md:ml-2">Rafraîchir</span>
            </button>

            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center p-3 text-white text-sm font-medium bg-slate-900 hover:bg-slate-800 rounded-lg hover:shadow-lg transition-colors"
              title="Ajouter"
            >
              <PlusCircle className="h-4 w-4" />
              <span className="hidden md:inline md:ml-2">Ajouter</span>
            </button>
          </div>
        </div>
      </header>

      {/* SEARCH BAR - Mobile Optimized */}
      <div className="relative">
        <Search className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 h-4 w-4 md:h-5 md:w-5 text-slate-400" />
        <input
          type="text"
          placeholder="Rechercher par nom de zone ou pays..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 md:pl-12 pr-3 md:pr-4 py-2.5 md:py-3 bg-white border border-slate-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 transition-all text-sm placeholder:text-slate-400"
        />
      </div>

      {/* TABS + TABLE - Mobile Optimized */}
      <div className="bg-white rounded-lg md:rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Tabs */}
        <div className="border-b border-slate-200 bg-slate-50/50">
          <div className="flex overflow-x-auto">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-4 md:px-6 py-2 md:py-3 text-xs md:text-sm font-medium whitespace-nowrap transition-all ${filterStatus === 'all'
                ? 'text-slate-900 border-b-2 border-slate-900 bg-white'
                : 'text-slate-500 hover:text-slate-700'
                }`}
            >
              Toutes ({counts.all})
            </button>
            <button
              onClick={() => setFilterStatus('active')}
              className={`px-4 md:px-6 py-2 md:py-3 text-xs md:text-sm font-medium whitespace-nowrap transition-all ${filterStatus === 'active'
                ? 'text-emerald-600 border-b-2 border-emerald-600 bg-white'
                : 'text-slate-500 hover:text-slate-700'
                }`}
            >
              Actives ({counts.active})
            </button>
            <button
              onClick={() => setFilterStatus('inactive')}
              className={`px-4 md:px-6 py-2 md:py-3 text-xs md:text-sm font-medium whitespace-nowrap transition-all ${filterStatus === 'inactive'
                ? 'text-rose-600 border-b-2 border-rose-600 bg-white'
                : 'text-slate-500 hover:text-slate-700'
                }`}
            >
              Inactives ({counts.inactive})
            </button>
          </div>
        </div>

        {/* Table Content */}
        {isLoading && zones.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-6">
            <Loader2 className="animate-spin text-slate-900 mb-4" size={48} strokeWidth={1.5} />
            <p className="text-slate-500 font-medium text-sm">Chargement des zones...</p>
          </div>
        ) : filteredZones.length === 0 ? (
          <div className="py-20 text-center px-6">
            <div className="bg-slate-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <MapPin className="text-slate-400" size={32} />
            </div>
            <h3 className="font-bold text-slate-900 text-lg">Aucune zone trouvée</h3>
            <p className="text-slate-500 text-sm mt-2">Ajustez vos filtres ou ajoutez une nouvelle zone.</p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50/50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">ID</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Zone</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Pays</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Statut</th>
                    <th className="px-6 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredZones.map((zone) => (
                    <tr key={zone.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-900">{zone.id}</span>
                        </div>
                      </td>
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-slate-400" />
                          <span className="font-semibold text-slate-900">{zone.nom}</span>
                        </div>
                      </td>
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setViewCountries(zone)}
                            className="inline-flex items-center gap-1 px-3 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-md text-xs font-medium transition-all"
                          >
                            <Globe2 className="h-3 w-3" />
                            {zone.pays?.length || 0} pays
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-3">
                        <button
                          onClick={() => handleStatusChange(zone.id, zone.actif)}
                          disabled={updatingStatus[zone.id]}
                          className="group relative flex items-center gap-3 transition-all active:scale-95 disabled:opacity-50"
                          title={`Cliquez pour ${zone.actif ? 'désactiver' : 'activer'}`}
                        >
                          <div className={`relative w-10 h-5 rounded-full transition-colors duration-200 ${zone.actif ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                            <div className={`absolute top-0.5 left-0.5 bg-white w-4 h-4 rounded-full shadow-sm transform transition-transform duration-200 ${zone.actif ? 'translate-x-5' : 'translate-x-0'}`} />
                          </div>
                        </button>
                      </td>
                      <td className="px-6 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEditModal(zone)}
                            className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
                            title="Modifier"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => setZoneToDelete(zone)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all"
                            title="Supprimer"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards - Native App Style */}
            <div className="md:hidden divide-y divide-slate-200">
              {filteredZones.map((zone) => (
                <div key={zone.id} className="p-3 space-y-2.5 active:bg-slate-50 transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-2">
                        <MapPin className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                        <span className="font-semibold text-slate-900 text-sm truncate">{zone.nom}</span>
                      </div>
                      <button
                        onClick={() => setViewCountries(zone)}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 active:bg-blue-200 text-blue-700 rounded-md text-sm font-medium transition-all"
                      >
                        <Globe2 className="h-3 w-3" />
                        {zone.pays.length} pays
                      </button>
                    </div>
                    <button
                      onClick={() => handleStatusChange(zone.id, zone.actif)}
                      disabled={updatingStatus[zone.id]}
                      className="flex items-center gap-2 active:scale-95 transition-all"
                    >
                      <div className={`relative w-8 h-4 rounded-full transition-colors ${zone.actif ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                        <div className={`absolute top-0.5 left-0.5 bg-white w-3 h-3 rounded-full transform transition-transform ${zone.actif ? 'translate-x-4' : 'translate-x-0'}`} />
                      </div>
                    </button>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => openEditModal(zone)}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-50 active:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-medium transition-all active:scale-95"
                    >
                      <Edit3 size={13} />
                      Modifier
                    </button>
                    <button
                      onClick={() => setZoneToDelete(zone)}
                      className="inline-flex items-center justify-center p-2 text-red-500 active:bg-red-50 border border-red-100 rounded-lg transition-all active:scale-95"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* MODAL AJOUT ZONE */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setIsSubmitting(false);
        }}
        title="Nouvelle Zone"
        subtitle="Créez une nouvelle zone géographique de livraison"
        size="xl"
      >
        <ZoneForm
          onSubmit={handleAddZone}
          onCancel={() => {
            setIsModalOpen(false);
            setIsSubmitting(false);
          }}
          isLoading={isSubmitting}
        />
      </Modal>

      {/* MODAL ÉDITION ZONE */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedZone(null);
          setIsSubmitting(false);
        }}
        title="Modifier la Zone"
        subtitle="Mettez à jour les informations de la zone"
        size="xl"
      >
        {selectedZone && (
          <ZoneForm
            initialData={selectedZone}
            onSubmit={handleEditZone}
            onCancel={() => {
              setIsEditModalOpen(false);
              setSelectedZone(null);
              setIsSubmitting(false);
            }}
            isLoading={isSubmitting}
          />
        )}
      </Modal>

      {/* MODAL VISUALISATION PAYS */}
      <Modal
        isOpen={!!viewCountries}
        onClose={() => setViewCountries(null)}
        title={`Pays de la zone: ${viewCountries?.nom}`}
        size="md"
      >
        <div className="space-y-2">
          {viewCountries?.pays.map((pays, index) => (
            <div
              key={index}
              className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 border border-slate-100"
            >
              <Globe2 className="h-4 w-4 text-slate-400" />
              <span className="text-sm font-medium text-slate-700">{pays}</span>
            </div>
          ))}
        </div>
      </Modal>

      <DeleteModal
        isOpen={!!zoneToDelete}
        onClose={() => setZoneToDelete(null)}
        onConfirm={handleDeleteZone}
        itemName={zoneToDelete?.nom}
        isLoading={isDeleting}
      />
    </div>
  );
};

export default ZoneConfiguration;