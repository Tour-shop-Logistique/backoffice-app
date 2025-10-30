import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchTarifs,
  addSimpleTarif,
  editSimpleTarif,
  deleteTarif,
  updateTarifStatus,
} from "../redux/slices/tarificationSlice";
import { fetchZones } from "../redux/slices/zoneSlice";
import Modal from "../components/common/Modal";
import SimpleTarifForm from "../components/common/SimpleTarifForm";
import { Loader2, PlusCircle, Edit3, Trash2, CheckCircle, XCircle } from "lucide-react";

const SimpleRates = () => {
  const dispatch = useDispatch();
  const { tarifs, isLoading, error } = useSelector((state) => state.tarification);
  const { zones } = useSelector((state) => state.zones);
  const pays = useSelector((state) => state.backoffice.pays);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTarif, setSelectedTarif] = useState(null);

  // Charger les tarifs et zones
  useEffect(() => {
    if (pays) dispatch(fetchTarifs(pays));
    dispatch(fetchZones());
    
  }, [dispatch, pays]);

  // Ajout d’un tarif
  const handleAddTarif = async (tarifData) => {
    const result = await dispatch(addSimpleTarif(tarifData));
    if (addSimpleTarif.fulfilled.match(result)) {
      setIsModalOpen(false);
      dispatch(fetchTarifs(pays));
    }
  };

  // Modification d’un tarif
  const handleEditTarif = async (tarifData) => {
    if (!selectedTarif) return;
    const result = await dispatch(editSimpleTarif({ tarifId: selectedTarif.id, tarifData }));
    if (editSimpleTarif.fulfilled.match(result)) {
      setSelectedTarif(null);
      dispatch(fetchTarifs(pays));
    }
  };

  // Suppression d’un tarif
  const handleDeleteTarif = async (tarifId) => {
    if (window.confirm("Voulez-vous vraiment supprimer ce tarif ?")) {
      await dispatch(deleteTarif(tarifId));
      if (selectedTarif?.id === tarifId) setSelectedTarif(null);
      dispatch(fetchTarifs(pays));
    }
  };

  // Changement de statut
  const handleStatusChange = (tarifId) => {
    dispatch(updateTarifStatus(tarifId)).then(() => dispatch(fetchTarifs(pays)));
  };

  // Liste filtrée
  const simpleTarifs = tarifs.filter((t) => t.mode_expedition === "simple");

  return (
    <div className="p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Tarifs Simples</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-md transition"
        >
          <PlusCircle size={18} />
          Nouveau Tarif
        </button>
      </div>

      {/* États de chargement ou d’erreur */}
      {isLoading && (
        <div className="flex justify-center items-center h-40">
          <Loader2 className="animate-spin text-indigo-600" size={40} />
        </div>
      )}
      {error && <p className="text-red-600 text-center bg-red-100 p-3 rounded-md">{error}</p>}

      {/* Tableau des tarifs */}
      {!isLoading && !error && (
        <>
          {simpleTarifs.length === 0 ? (
            <div className="text-center py-16 text-gray-500">
              Aucun tarif simple disponible.
              <br />
              <button
                onClick={() => setIsModalOpen(true)}
                className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg"
              >
                Ajouter un tarif
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto bg-white shadow-md rounded-lg">
              <table className="min-w-full text-sm text-gray-700">
                <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
                  <tr>
                    <th className="px-6 py-3 text-left">Indice</th>
                    <th className="px-6 py-3 text-left">Zones</th>
                    <th className="px-6 py-3 text-left">Statut</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {simpleTarifs.map((tarif) => (
                    <tr
                      key={tarif.id}
                      className={`border-b hover:bg-gray-50 transition cursor-pointer ${
                        selectedTarif?.id === tarif.id ? "bg-indigo-50" : ""
                      }`}
                      onClick={() => setSelectedTarif(tarif)}
                    >
                      <td className="px-6 py-4 font-medium">{tarif.indice}</td>
                      <td className="px-6 py-4">{tarif.prix_zones.length} zone(s)</td>
                      <td className="px-6 py-4">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStatusChange(tarif.id);
                          }}
                          className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${
                            tarif.actif ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                          }`}
                        >
                          {tarif.actif ? <CheckCircle size={14} /> : <XCircle size={14} />}
                          {tarif.actif ? "Actif" : "Inactif"}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-right space-x-3">
                        <button
                          onClick={(e) => { e.stopPropagation(); setSelectedTarif(tarif); }}
                          className="text-indigo-600 hover:text-indigo-800"
                          title="Voir ou modifier"
                        >
                          <Edit3 size={16} />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDeleteTarif(tarif.id); }}
                          className="text-red-600 hover:text-red-800"
                          title="Supprimer"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Détails du tarif sélectionné */}
      {selectedTarif && (
        <div className="mt-6 bg-white shadow-md rounded-lg p-4 overflow-x-auto">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
            <h2 className="text-lg font-semibold text-gray-800">
              Détails du Tarif - Indice {selectedTarif.indice}
            </h2>
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedTarif(selectedTarif)}
                className="px-3 py-1 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm flex items-center gap-1"
              >
                <Edit3 size={14} /> Modifier
              </button>
              <button
                onClick={() => handleDeleteTarif(selectedTarif.id)}
                className="px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm flex items-center gap-1"
              >
                <Trash2 size={14} /> Supprimer
              </button>
            </div>
          </div>

          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
              <tr>
                <th className="px-4 py-2 text-left">Zone Destination</th>
                <th className="px-4 py-2 text-left">Montant Base</th>
                <th className="px-4 py-2 text-left">% Prestation</th>
                <th className="px-4 py-2 text-left">Montant Prestation</th>
                <th className="px-4 py-2 text-left">Montant Expédition</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {selectedTarif.prix_zones.map((pz, index) => {
                const zone = zones.find((z) => z.id === pz.zone_destination_id);
                return (
                  <tr key={index}>
                    <td className="px-4 py-2">{zone ? zone.nom : pz.zone_destination_id}</td>
                    <td className="px-4 py-2">{pz.montant_base}</td>
                    <td className="px-4 py-2">{pz.pourcentage_prestation}%</td>
                    <td className="px-4 py-2">{pz.montant_prestation}</td>
                    <td className="px-4 py-2">{pz.montant_expedition}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal d’ajout */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Ajouter un nouveau tarif simple"
        size="4xl"
      >
        <SimpleTarifForm
          onSubmit={handleAddTarif}
          onCancel={() => setIsModalOpen(false)}
          isLoading={isLoading}
        />
      </Modal>

      {/* Modal de modification */}
      {selectedTarif && (
        <Modal
          isOpen={!!selectedTarif}
          onClose={() => setSelectedTarif(null)}
          title={`Modifier le tarif (Indice ${selectedTarif.indice})`}
          size="4xl"
        >
          <SimpleTarifForm
            onSubmit={handleEditTarif}
            onCancel={() => setSelectedTarif(null)}
            isLoading={isLoading}
            initialData={selectedTarif}
          />
        </Modal>
      )}
    </div>
  );
};

export default SimpleRates;
