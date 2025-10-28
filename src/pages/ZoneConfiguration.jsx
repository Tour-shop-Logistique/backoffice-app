import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchZones, addZone, editZone, deleteZone, updateZoneStatus } from '../redux/slices/zoneSlice';
import { Loader2 } from 'lucide-react';
import Modal from '../components/common/Modal';
import ZoneForm from '../components/common/ZoneForm';

const ZoneConfiguration = () => {
  const dispatch = useDispatch();
  const { zones, isLoading, error } = useSelector((state) => state.zones);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedZone, setSelectedZone] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState({});

  useEffect(() => {
   if(!zones.length) dispatch(fetchZones());
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
      
      // Si on arrive ici, la mise à jour a réussi
    } catch (error) {
      console.error('Erreur lors du changement de statut:', error);
      // Vous pourriez vouloir afficher un message d'erreur à l'utilisateur ici
    } finally {
      setUpdatingStatus(prev => ({ ...prev, [zoneId]: false }));
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Configuration des Zones</h1>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
        >
          Ajouter une Zone
        </button>
      </div>

      {isLoading && <p>Chargement des zones...</p>}
      {error && <p className="text-red-500">Erreur: {error.message || 'Impossible de charger les zones'}</p>}
      
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nom</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pays</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {zones.map((zone) => (
              <tr key={zone.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{zone.id}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{zone.nom}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{zone.pays.join(', ')}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <div className="flex items-center">
                    {updatingStatus[zone.id] ? (
                      <Loader2 className="animate-spin h-5 w-5 text-gray-500" />
                    ) : (
                      <button
                        onClick={() => handleStatusChange(zone.id, zone.actif)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full ${zone.actif ? 'bg-green-500' : 'bg-gray-300'} transition-colors`}
                        disabled={updatingStatus[zone.id]}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${zone.actif ? 'translate-x-6' : 'translate-x-1'}`}
                        />
                      </button>
                    )}
                    <span className={`ml-2 text-sm font-medium ${zone.actif ? 'text-green-700' : 'text-red-700'}`}>
                      {zone.actif ? 'Actif' : 'Inactif'}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button onClick={() => openEditModal(zone)} className="text-indigo-600 hover:text-indigo-900">Modifier</button>
                  <button onClick={() => handleDeleteZone(zone.id)} className="text-red-600 hover:text-red-900 ml-4">Supprimer</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Ajouter une nouvelle zone">
        <ZoneForm 
          onSubmit={handleAddZone} 
          onCancel={() => setIsModalOpen(false)} 
          isLoading={isLoading}
        />
      </Modal>

      {selectedZone && (
        <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Modifier la zone">
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
