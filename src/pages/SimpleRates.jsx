import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchTarifs, addSimpleTarif, editSimpleTarif, deleteTarif, updateTarifStatus } from '../redux/slices/tarificationSlice';
import { fetchZones } from '../redux/slices/zoneSlice';
import Modal from '../components/common/Modal';
import SimpleTarifForm from '../components/common/SimpleTarifForm';

const SimpleRates = () => {
  const dispatch = useDispatch();
  const { tarifs, isLoading, error } = useSelector((state) => state.tarification);
  const { zones } = useSelector((state) => state.zones);
const pays = useSelector((state) => state.backoffice.pays);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedTarif, setSelectedTarif] = useState(null);
  

  useEffect(() => {
  if (pays) { 
    console.log("Chargement des tarifs pour le pays:", pays);
    dispatch(fetchTarifs(pays));
  }
    dispatch(fetchZones());
  }, [dispatch,pays]);

  const handleAddTarif = (tarifData) => {
    dispatch(addSimpleTarif(tarifData)).then((result) => {
      if (addSimpleTarif.fulfilled.match(result)) {
        setIsModalOpen(false);
        dispatch(fetchTarifs());
      }
    });
  };

  const handleEditTarif = (tarifData) => {
    dispatch(editSimpleTarif({ tarifId: selectedTarif.id, tarifData })).then((result) => {
      if (editSimpleTarif.fulfilled.match(result)) {
        setIsEditModalOpen(false);
        setSelectedTarif(null);
        dispatch(fetchTarifs());
      }
    });
  };

  const openEditModal = () => {
    setIsEditModalOpen(true);
  };

  const handleDeleteTarif = () => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce tarif ?')) {
      dispatch(deleteTarif(selectedTarif.id)).then(() => {
        setSelectedTarif(null);
      });
    }
  };

  const handleStatusChange = (tarifId) => {
    dispatch(updateTarifStatus(tarifId)).then((result) => {
      if (updateTarifStatus.fulfilled.match(result) && selectedTarif && selectedTarif.id === tarifId) {
        setSelectedTarif(result.payload);
      }
    });
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Tarifs Simples</h1>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
        >
          Ajouter un Tarif Simple
        </button>
      </div>

      {isLoading && <p>Chargement des tarifs...</p>}
      {error && <p className="text-red-500">Erreur: {error.message || 'Impossible de charger les tarifs'}</p>}
      
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Indice</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prix par Zone</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {tarifs.filter(t => t.mode_expedition === 'simple').map((tarif) => (
              <tr 
                key={tarif.id} 
                onClick={() => setSelectedTarif(tarif)}
                className={`cursor-pointer ${selectedTarif && selectedTarif.id === tarif.id ? 'bg-indigo-100' : 'hover:bg-gray-50'}`}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{tarif.indice}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {tarif.prix_zones.length} zone(s)
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <button onClick={() => handleStatusChange(tarif.id)} className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${tarif.actif ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {tarif.actif ? 'Actif' : 'Inactif'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Ajouter un nouveau tarif simple" size="4xl">
        <SimpleTarifForm 
          onSubmit={handleAddTarif} 
          onCancel={() => setIsModalOpen(false)} 
          isLoading={isLoading}
        />
      </Modal>

      {selectedTarif && (
        <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Modifier le tarif simple" size="4xl">
          <SimpleTarifForm 
            onSubmit={handleEditTarif} 
            onCancel={() => setIsEditModalOpen(false)} 
            isLoading={isLoading}
            initialData={selectedTarif}
          />
        </Modal>
      )}

      {selectedTarif && (
        <div className="mt-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-800">Détails du Tarif (Indice: {selectedTarif.indice})</h2>
            <div>
              <button onClick={openEditModal} className="px-4 py-2 text-white bg-indigo-600 rounded-md hover:bg-indigo-700">Modifier</button>
              <button onClick={handleDeleteTarif} className="px-4 py-2 text-white bg-red-600 rounded-md hover:bg-red-700 ml-4">Supprimer</button>
            </div>
          </div>
          <div className="mt-4 bg-white shadow-md rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Zone Destination</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Montant de Base</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">% Prestation</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Montant Prestation</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Montant Expédition</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {selectedTarif.prix_zones.map((pz) => {
                  const zone = zones.find(z => z.id === pz.zone_destination_id);
                  return (
                    <tr key={pz.zone_destination_id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{zone ? zone.nom : pz.zone_destination_id}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{pz.montant_base}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{pz.pourcentage_prestation}%</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{pz.montant_prestation}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{pz.montant_expedition}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default SimpleRates;
