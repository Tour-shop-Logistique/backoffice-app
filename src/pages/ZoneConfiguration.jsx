import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchZones, addZone, editZone, deleteZone, updateZoneStatus } from '../redux/slices/zoneSlice';
import Modal from '../components/common/Modal';
import ZoneForm from '../components/common/ZoneForm';

const ZoneConfiguration = () => {
  const dispatch = useDispatch();
  const { zones, isLoading, error } = useSelector((state) => state.zones);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedZone, setSelectedZone] = useState(null);

  useEffect(() => {
    dispatch(fetchZones());
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

  const handleStatusChange = (zoneId) => {
    dispatch(updateZoneStatus(zoneId));
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
                  <button onClick={() => handleStatusChange(zone.id)} className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${zone.actif ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {zone.actif ? 'Actif' : 'Inactif'}
                  </button>
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
