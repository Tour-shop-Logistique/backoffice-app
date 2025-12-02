import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchZones, addZone, editZone, deleteZone, updateZoneStatus } from '../redux/slices/zoneSlice';
import { 
  Loader2, 
  MapPin, 
  Plus, 
  Edit2, 
  Trash2, 
  Globe2, 
  CheckCircle2, 
  XCircle,
  AlertCircle,
  Search
} from 'lucide-react';
import Modal from '../components/common/Modal';
import ZoneForm from '../components/common/ZoneForm';

const ZoneConfiguration = () => {
  const dispatch = useDispatch();
  const { zones, isLoading, error } = useSelector((state) => state.zones);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedZone, setSelectedZone] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    if (!zones.length) dispatch(fetchZones());
  }, [dispatch]);

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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
              <MapPin className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                Configuration des Zones
              </h1>
              <p className="text-sm text-gray-500 mt-0.5">
                Gérez les zones géographiques de livraison
              </p>
            </div>
          </div>
          
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center space-x-2 px-5 py-3 text-white bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl hover:shadow-lg hover:scale-105 transition-all duration-200 shadow-md"
          >
            <Plus className="h-5 w-5" />
            <span className="font-medium">Ajouter une Zone</span>
          </button>
        </div>
      </div>

      {/* Stats rapides */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Total Zones</p>
              <p className="text-2xl font-bold text-gray-800">{zones.length}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-indigo-50 flex items-center justify-center">
              <MapPin className="h-6 w-6 text-indigo-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Zones Actives</p>
              <p className="text-2xl font-bold text-green-600">
                {zones.filter((z) => z.actif).length}
              </p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-green-50 flex items-center justify-center">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Zones Inactives</p>
              <p className="text-2xl font-bold text-red-600">
                {zones.filter((z) => !z.actif).length}
              </p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-red-50 flex items-center justify-center">
              <XCircle className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Barre de recherche et filtres */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher par nom ou pays..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
          />
        </div>

        <div className="relative">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="pl-4 pr-10 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none cursor-pointer"
          >
            <option value="all">Tous les statuts</option>
            <option value="active">Actives uniquement</option>
            <option value="inactive">Inactives uniquement</option>
          </select>
        </div>
      </div>

      {/* États de chargement et erreur */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="h-12 w-12 text-indigo-600 animate-spin mb-4" />
          <p className="text-gray-500">Chargement des zones...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center space-x-3 mb-6">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
          <p className="text-red-700">
            Erreur: {error.message || 'Impossible de charger les zones'}
          </p>
        </div>
      )}

      {/* Table des zones */}
      {!isLoading && !error && (
        <div className="bg-white shadow-sm rounded-xl overflow-hidden border border-gray-200">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    ID
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Nom de la Zone
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Pays Couverts
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {filteredZones.map((zone) => (
                  <tr 
                    key={zone.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 text-sm font-bold">
                        {zone.id}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                          <MapPin className="h-5 w-5 text-white" />
                        </div>
                        <span className="text-sm font-semibold text-gray-900">
                          {zone.nom}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1.5">
                        {zone.pays.map((pays, index) => (
                          <span 
                            key={index}
                            className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200"
                          >
                            <Globe2 className="h-3 w-3 mr-1" />
                            {pays}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-3">
                        {updatingStatus[zone.id] ? (
                          <Loader2 className="animate-spin h-5 w-5 text-gray-500" />
                        ) : (
                          <button
                            onClick={() => handleStatusChange(zone.id, zone.actif)}
                            className={`relative inline-flex h-7 w-12 items-center rounded-full transition-all duration-200 ${
                              zone.actif 
                                ? 'bg-gradient-to-r from-green-500 to-emerald-500 shadow-md' 
                                : 'bg-gray-300'
                            }`}
                            disabled={updatingStatus[zone.id]}
                          >
                            <span
                              className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition-transform duration-200 ${
                                zone.actif ? 'translate-x-6' : 'translate-x-1'
                              }`}
                            />
                          </button>
                        )}
                        <span 
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                            zone.actif 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {zone.actif ? (
                            <>
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Actif
                            </>
                          ) : (
                            <>
                              <XCircle className="h-3 w-3 mr-1" />
                              Inactif
                            </>
                          )}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button 
                          onClick={() => openEditModal(zone)} 
                          className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="Modifier"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => handleDeleteZone(zone.id)} 
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Supprimer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* État vide */}
          {filteredZones.length === 0 && (
            <div className="text-center py-12">
              <MapPin className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                Aucune zone trouvée
              </h3>
              <p className="text-gray-500">
                {searchTerm || filterStatus !== 'all' 
                  ? 'Essayez de modifier vos critères de recherche'
                  : 'Commencez par ajouter une nouvelle zone'
                }
              </p>
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
    </div>
  );
};

export default ZoneConfiguration;