import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchZones, addZone, editZone, deleteZone, updateZoneStatus } from '../redux/slices/zoneSlice';
import {
  Loader2,
  MapPin,
  PlusCircle,
  Edit2,
  Trash2,
  Globe2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Search,
  Eye,
  RefreshCw
} from 'lucide-react';
import Modal from '../components/common/Modal';
import ZoneForm from '../components/common/ZoneForm';
import NotificationPortal from '../components/widget/notification';

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
  const notificationTimeoutRef = useRef(null);

  const showNotification = useCallback((type, message) => {
    if (notificationTimeoutRef.current) clearTimeout(notificationTimeoutRef.current);
    setNotification({ type, message });
    notificationTimeoutRef.current = setTimeout(() => setNotification(null), 4000);
  }, []);

  useEffect(() => () => {
    if (notificationTimeoutRef.current) clearTimeout(notificationTimeoutRef.current);
  }, []);

  useEffect(() => {
    if (!hasLoaded) {
      dispatch(fetchZones());
    }
  }, [dispatch, hasLoaded]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await dispatch(fetchZones({ silent: true })).unwrap();
      showNotification('success', 'Liste des zones mise à jour.');
    } catch (error) {
      showNotification('error', 'Erreur lors du rafraîchissement.');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleAddZone = (zoneData) => {
    dispatch(addZone(zoneData)).then((result) => {
      if (addZone.fulfilled.match(result)) {
        setIsModalOpen(false);
        dispatch(fetchZones());
      }
    });
  };

  const handleEditZone = (zoneData) => {
    dispatch(editZone({ zoneId: selectedZone.id, zoneData })).then((result) => {
      if (editZone.fulfilled.match(result)) {
        setIsEditModalOpen(false);
        setSelectedZone(null);
        dispatch(fetchZones());
      }
    });
  };

  const openEditModal = (zone) => {
    setSelectedZone(zone);
    setIsEditModalOpen(true);
  };

  const handleDeleteZone = (zoneId) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette zone ?')) {
      dispatch(deleteZone(zoneId));
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
    } catch (error) {
      console.error('Erreur lors du changement de statut:', error);
    } finally {
      setUpdatingStatus(prev => ({ ...prev, [zoneId]: false }));
    }
  };

  // Filtrage des zones
  const filteredZones = zones.filter(zone => {
    const matchesSearch = zone.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      zone.pays.some(p => p.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = filterStatus === 'all' ||
      (filterStatus === 'active' && zone.actif) ||
      (filterStatus === 'inactive' && !zone.actif);
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Configuration des Zones
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Gérez les zones géographiques de livraison
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="inline-flex items-center justify-center p-3 text-sm font-medium rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-all disabled:opacity-50"
            title="Rafraîchir"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Rafraîchir la liste</span>
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center p-3 text-white text-sm font-medium bg-slate-900 hover:bg-slate-800 rounded-lg hover:shadow-lg transition-colors"
          >
            <PlusCircle className="h-4 w-4 mr-2" />
            <span>Ajouter une Zone</span>
          </button>
        </div>
      </header>

      {/* Stats rapides & Barre de recherche - Alignés sur Desktop */}
      <div className="flex flex-col lg:flex-row gap-4 mb-8 items-stretch lg:items-center">
        {/* Grille des Stats - 2 colonnes sur mobile, largeur fixe sur desktop */}
        <div className="grid grid-cols-2 gap-4 lg:flex lg:gap-4 shrink-0">
          {/* Carte Zones Actives */}
          <div
            onClick={() => setFilterStatus(filterStatus === 'active' ? 'all' : 'active')}
            className={`flex-1 lg:w-64 rounded-lg px-4 py-2 shadow-sm border transition-all cursor-pointer hover:shadow-md ${filterStatus === 'active'
              ? 'bg-emerald-100 border-emerald-500 ring-2 ring-emerald-500/10'
              : 'bg-emerald-50/50 border-emerald-100 hover:border-emerald-200'
              }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-xs md:text-sm font-medium mb-1 ${filterStatus === 'active' ? 'text-emerald-800' : 'text-emerald-600/70'}`}>Actives</p>
                <p className={`text-xl md:text-2xl font-bold ${filterStatus === 'active' ? 'text-emerald-900' : 'text-emerald-700'}`}>
                  {zones.filter((z) => z.actif).length}
                </p>
              </div>
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center border transition-colors ${filterStatus === 'active' ? 'bg-emerald-500 text-white border-emerald-400' : 'bg-white text-emerald-500 border-emerald-100'
                }`}>
                <CheckCircle2 className="h-6 w-6" />
              </div>
            </div>
          </div>

          {/* Carte Zones Inactives */}
          <div
            onClick={() => setFilterStatus(filterStatus === 'inactive' ? 'all' : 'inactive')}
            className={`flex-1 lg:w-64 rounded-lg px-4 py-2 shadow-sm border transition-all cursor-pointer hover:shadow-md ${filterStatus === 'inactive'
              ? 'bg-rose-100 border-rose-500 ring-2 ring-rose-500/10'
              : 'bg-rose-50/50 border-rose-100 hover:border-rose-200'
              }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-xs md:text-sm font-medium mb-1 ${filterStatus === 'inactive' ? 'text-rose-800' : 'text-rose-600/70'}`}>Inactives</p>
                <p className={`text-xl md:text-2xl font-bold ${filterStatus === 'inactive' ? 'text-rose-900' : 'text-rose-700'}`}>
                  {zones.filter((z) => !z.actif).length}
                </p>
              </div>
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center border transition-colors ${filterStatus === 'inactive' ? 'bg-rose-500 text-white border-rose-400' : 'bg-white text-rose-500 border-rose-100'
                }`}>
                <XCircle className="h-6 w-6" />
              </div>
            </div>
          </div>
        </div>

        {/* Barre de recherche - Prend tout l'espace restant sur desktop */}
        <div className="flex-1 relative group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-slate-300 group-focus-within:text-indigo-500 transition-colors" />
          </div>
          <input
            type="text"
            placeholder="Rechercher une zone ou un pays..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-full min-h-[50px] md:min-h-[72px] pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-lg shadow-sm focus:outline-none focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900 transition-all text-sm font-bold placeholder:text-slate-300 placeholder:font-medium"
          />
        </div>
      </div>

      {/* États de chargement et erreur */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="h-12 w-12 text-indigo-600 animate-spin mb-4" />
          <p className="text-gray-500">Chargement des zones...</p>
        </div>
      )}

      {error && !isLoading && (
        <div className="text-red-700 bg-red-50 p-4 rounded-lg border border-red-100 flex items-center gap-2">
          <AlertTriangle size={18} />
          <span className="text-xs font-bold uppercase tracking-wide">{error}</span>
        </div>
      )}

      {/* Liste des Zones - Responsive */}
      {!isLoading && !error && (
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
          {/* Vue Desktop: Table minimaliste */}
          <div className="hidden md:block">
            <table className="min-w-full divide-y divide-slate-100">
              <thead className="bg-slate-50">
                <tr>
                  {['ID', 'Zone', 'Destinations', 'Statut', 'Actions'].map(header => (
                    <th key={header} className={`px-6 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest ${header === 'Actions' ? 'text-right' : ''}`}>{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredZones.map((zone) => (
                  <tr key={zone.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-4 py-3 whitespace-nowrap text-xs font-medium text-slate-400">#{zone.id}</td>
                    {/* zone */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <MapPin className="h-3.5 w-3.5 text-indigo-500" />
                        <span className="text-sm font-medium text-slate-700">{zone.nom}</span>
                      </div>
                    </td>
                    {/* destination */}
                    <td className="px-4 py-3">
                      <div
                        className="inline-flex items-center space-x-3 bg-blue-50 rounded-lg p-2 w-full cursor-pointer group/dest"
                        onClick={() => setViewCountries(zone)}
                      >
                        <div className="flex flex-wrap gap-1.5">
                          {zone.pays.slice(0, 5).map((p, i) => (
                            <span key={i} className="px-2 py-0.5 bg-slate-50 text-slate-600 text-[10px] font-medium rounded border border-slate-200/50 whitespace-nowrap">
                              {p}
                            </span>
                          ))}
                          {zone.pays.length > 5 && (
                            <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-bold rounded border border-indigo-100">
                              +{zone.pays.length - 5}
                            </span>
                          )}
                        </div>
                        <div className="p-1 rounded-full group-hover/dest:bg-indigo-50 transition-colors">
                          <Eye className="h-3.5 w-3.5 text-red-600 group-hover/dest:text-indigo-600 transition-colors" />
                        </div>
                      </div>
                    </td>
                    {/* statut */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        {updatingStatus[zone.id] ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin text-indigo-500" />
                        ) : (
                          <button
                            onClick={() => handleStatusChange(zone.id, zone.actif)}
                            className={`w-8 h-4 rounded-full relative transition-colors duration-200 border ${zone.actif ? 'bg-indigo-600 border-indigo-600' : 'bg-slate-200 border-slate-300'}`}
                          >
                            <span className={`absolute top-0.5 h-2.5 w-2.5 rounded-full bg-white transition-all duration-200 ${zone.actif ? 'left-[18px]' : 'left-0.5'}`} />
                          </button>
                        )}
                        <span className={`text-[11px] font-medium p-0.5 rounded ${zone.actif ? 'text-emerald-600' : 'text-slate-400'}`}>
                          {zone.actif ? 'Actif' : 'Inactif'}
                        </span>
                      </div>
                    </td>
                    {/* action */}
                    <td className="px-4 py-3 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end space-x-1 transition-opacity">
                        <button onClick={() => openEditModal(zone)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-all">
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => handleDeleteZone(zone.id)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-all">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Vue Mobile: Liste compacte */}
          <div className="md:hidden divide-y divide-slate-200">
            {filteredZones.map((zone) => (
              <div key={zone.id} className="p-4 mb-4 bg-white active:bg-slate-50 transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center space-x-2">
                    <h3 className="text-sm font-semibold text-slate-700">{zone.nom}</h3>
                  </div>
                  <div className="flex items-center space-x-2">
                    {updatingStatus[zone.id] ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-indigo-500" />
                    ) : (
                      <button
                        onClick={() => handleStatusChange(zone.id, zone.actif)}
                        className={`w-8 h-4 rounded-full relative transition-colors duration-200 border ${zone.actif ? 'bg-indigo-600 border-indigo-600' : 'bg-slate-200 border-slate-300'}`}
                      >
                        <span className={`absolute top-0.5 h-2.5 w-2.5 rounded-full bg-white transition-all duration-200 ${zone.actif ? 'right-0.5' : 'left-0.5'}`} />
                      </button>
                    )}
                  </div>
                </div>

                <div
                  className="flex items-center justify-between mb-3 bg-blue-50 rounded-lg p-2 w-full cursor-pointer group/dest"
                  onClick={() => setViewCountries(zone)}
                >
                  <div className="flex flex-wrap gap-1 flex-1">
                    {zone.pays.slice(0, 3).map((p, i) => (
                      <span key={i} className="px-2 py-0.5 bg-slate-50 text-slate-500 text-[10px] font-medium rounded border border-slate-100 whitespace-nowrap">
                        {p}
                      </span>
                    ))}
                    {zone.pays.length > 3 && (
                      <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-[10px] font-bold rounded border border-indigo-100">
                        +{zone.pays.length - 3}
                      </span>
                    )}
                  </div>
                  <Eye className="h-4 w-4 text-red-600 active:text-indigo-500 ml-2" />
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-50">
                  <div className={`text-[10px] font-bold uppercase tracking-wider ${zone.actif ? 'text-emerald-500' : 'text-slate-300'}`}>
                    {zone.actif ? 'Zone Active' : 'Zone Inactive'}
                  </div>
                  <div className="flex space-x-3">
                    <button onClick={() => openEditModal(zone)} className="flex items-center text-indigo-600 text-xs font-medium">
                      <Edit2 className="h-3 w-3 mr-1" /> Modifier
                    </button>
                    <button onClick={() => handleDeleteZone(zone.id)} className="flex items-center text-rose-600 text-xs font-medium">
                      <Trash2 className="h-3 w-3 mr-1" /> Supprimer
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* État vide */}
          {filteredZones.length === 0 && (
            <div className="text-center py-16">
              <div className="mx-auto w-12 h-12 bg-slate-50 rounded flex items-center justify-center mb-3 border border-slate-100">
                <MapPin className="h-5 w-5 text-slate-300" />
              </div>
              <p className="text-sm font-medium text-slate-500">Aucune zone ne correspond à votre recherche</p>
              <button onClick={() => { setSearchTerm(''); setFilterStatus('all'); }} className="mt-2 text-xs text-indigo-600 hover:underline">
                Réinitialiser les filtres
              </button>
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Ajouter une nouvelle zone"
      >
        <ZoneForm
          onSubmit={handleAddZone}
          onCancel={() => setIsModalOpen(false)}
          isLoading={isLoading}
        />
      </Modal>

      {selectedZone && (
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          title="Modifier la zone"
        >
          <ZoneForm
            onSubmit={handleEditZone}
            onCancel={() => setIsEditModalOpen(false)}
            isLoading={isLoading}
            initialData={selectedZone}
          />
        </Modal>
      )}

      {/* Modal d'affichage des pays */}
      <Modal
        isOpen={!!viewCountries}
        onClose={() => setViewCountries(null)}
        title={`Destinations pour ${viewCountries?.nom}`}
      >
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {viewCountries?.pays.map((p, i) => (
              <span key={i} className="px-3 py-1 bg-slate-50 text-slate-600 text-xs font-medium rounded border border-slate-200/60">
                {p}
              </span>
            ))}
          </div>
          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              onClick={() => setViewCountries(null)}
              className="px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded hover:bg-slate-800 transition-colors"
            >
              Fermer
            </button>
          </div>
        </div>
      </Modal>

      {notification && (
        <NotificationPortal
          type={notification.type}
          message={notification.message}
          onClose={() => setNotification(null)}
        />
      )}
    </div>
  );
};

export default ZoneConfiguration;