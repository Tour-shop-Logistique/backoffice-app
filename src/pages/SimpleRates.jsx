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
import tarificationService from "../services/tarificationService";
import { Loader2, PlusCircle, Edit3, Trash2, CheckCircle, XCircle, DollarSign, ListOrdered } from "lucide-react";

const SimpleRates = () => {
    const dispatch = useDispatch();
    const {tarifs, isLoading, error } = useSelector((state) => state.tarification);
    const { zones } = useSelector((state) => state.zones);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedTarif, setSelectedTarif] = useState(null);
    const [isEditingModalOpen, setIsEditingModalOpen] = useState(false); // État pour la modale d'édition
    const [loading, setLoading] = useState(false);

    // Charger les tarifs et zones
   useEffect(() => {
    if(tarifs.length === 0){
    dispatch(fetchTarifs());
    }
    if(zones.length === 0){
    dispatch(fetchZones());
    }
}, [dispatch]);

    // const loadSimpleTarifs = async () => {
    //   try {
    //     setLoading(true);
    //     const data = await tarificationService.getTarifs();
    //     setTarifs(data);
    //   } catch (err) {
    //     console.error('Erreur lors du chargement des tarifs:', err);
    //   } finally {
    //     setLoading(false);
    //   }
    // };

    // Ouvre la modale d'ajout
    const handleOpenAddModal = () => {
        setSelectedTarif(null);
        setIsModalOpen(true);
    };

    // Ouvre la modale d'édition
    const handleOpenEditModal = (tarif) => {
        setSelectedTarif(tarif);
        setIsEditingModalOpen(true);
    };

    // Ajout d’un tarif
    const handleAddTarif = async (tarifData) => {
        const result = await dispatch(addSimpleTarif(tarifData));
        if (addSimpleTarif.fulfilled.match(result)) {
            setIsModalOpen(false);
            dispatch(fetchTarifs()); // Recharger après succès
        }
    };

    // Modification d’un tarif
    const handleEditTarif = async (tarifData) => {
        if (!selectedTarif) return;
        const result = await dispatch(editSimpleTarif({ tarifId: selectedTarif.id, tarifData }));
        if (editSimpleTarif.fulfilled.match(result)) {
            setIsEditingModalOpen(false);
            setSelectedTarif(null);
            dispatch(fetchTarifs()); // Recharger après succès
        }
    };

    // Suppression d’un tarif
    const handleDeleteTarif = async (tarifId) => {
        // Ajouter une modale de confirmation plus stylée si possible
        if (window.confirm("Voulez-vous vraiment supprimer ce tarif ? Cette action est irréversible.")) {
            // await dispatch(deleteTarif(tarifId));
            if (selectedTarif?.id === tarifId) setSelectedTarif(null);
            dispatch(fetchTarifs()); // Recharger après succès
        }
    };

    // Changement de statut
    const handleStatusChange = (tarifId) => {
        dispatch(updateTarifStatus(tarifId)).then(() => dispatch(fetchTarifs()));
    };

    // Liste filtrée
    const simpleTarifs = tarifs.filter((t) => t.mode_expedition === "simple");

    // Classe de style pour les boutons principaux
    const buttonPrimaryClass = "flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold shadow-lg shadow-indigo-500/30 transition duration-300 active:scale-95";

    return (
        <div className="p-4 sm:p-8 bg-gray-50 min-h-screen">
            
            {/* Header */}
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 pb-4 border-b border-gray-200">
                <h1 className="text-3xl font-extrabold text-gray-900 flex items-center gap-2">
                    <DollarSign size={28} className="text-indigo-600" />
                    Tarifs Simples
                </h1>
                <button
                    onClick={handleOpenAddModal}
                    className={buttonPrimaryClass}
                >
                    <PlusCircle size={20} />
                    Nouveau Tarif
                </button>
            </header>

            {/* États de chargement ou d’erreur */}
            {isLoading && (
                <div className="flex justify-center items-center h-40 bg-white rounded-xl shadow-lg">
                    <Loader2 className="animate-spin text-indigo-600" size={40} />
                </div>
            )}
            {error && <p className="text-red-700 font-medium text-center bg-red-100 p-4 rounded-xl border border-red-300 shadow-md">{error}</p>}

            {/* Tableau des tarifs */}
            {!isLoading && !error && (
                <>
                    {simpleTarifs.length === 0 ? (
                        <div className="text-center py-16 bg-white rounded-xl shadow-lg border border-gray-100">
                            <ListOrdered size={40} className="text-gray-400 mx-auto mb-4" />
                            <p className="text-lg font-semibold text-gray-800">Aucun tarif simple configuré.</p>
                            <p className="text-gray-500 mt-2 mb-6">Commencez par créer une nouvelle grille tarifaire.</p>
                            <button
                                onClick={handleOpenAddModal}
                                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold transition"
                            >
                                <PlusCircle size={18} className="inline mr-2" />
                                Ajouter un tarif
                            </button>
                        </div>
                    ) : (
                        <div className="overflow-x-auto bg-white shadow-xl rounded-xl border border-gray-100">
                            <table className="min-w-full divide-y divide-gray-200 text-sm">
                                <thead className="bg-gray-100 text-gray-600 uppercase text-xs tracking-wider">
                                    <tr>
                                        <th className="px-6 py-3 text-left font-bold">Indice</th>
                                        <th className="px-6 py-3 text-left font-bold">Zones Affectées</th>
                                        <th className="px-6 py-3 text-left font-bold">Statut</th>
                                        <th className="px-6 py-3 text-center font-bold">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {simpleTarifs.map((tarif) => (
                                        <tr
                                            key={tarif.id}
                                            className={`hover:bg-indigo-50/50 transition duration-150 cursor-pointer ${
                                                selectedTarif?.id === tarif.id ? "bg-indigo-50/70 shadow-inner" : ""
                                            }`}
                                            onClick={() => setSelectedTarif(tarif)}
                                        >
                                            <td className="px-6 py-4 font-semibold text-gray-900">{tarif.indice}</td>
                                            <td className="px-6 py-4 text-gray-700">
                                                <span className="font-medium text-indigo-600">{tarif.prix_zones.length}</span> zone(s)
                                            </td>
                                            <td className="px-6 py-4">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleStatusChange(tarif.id);
                                                    }}
                                                    className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold transition-colors duration-200 ${
                                                        tarif.actif ? "bg-green-100 text-green-700 hover:bg-green-200" : "bg-red-100 text-red-700 hover:bg-red-200"
                                                    }`}
                                                >
                                                    {tarif.actif ? <CheckCircle size={14} /> : <XCircle size={14} />}
                                                    {tarif.actif ? "Actif" : "Inactif"}
                                                </button>
                                            </td>
                                            <td className="px-6 py-4 text-center space-x-3">
                                                <div className="inline-flex gap-2">
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleOpenEditModal(tarif); }}
                                                        className="text-indigo-600 hover:text-indigo-800 p-2 rounded-full hover:bg-indigo-50 transition-colors"
                                                        title="Modifier le tarif"
                                                    >
                                                        <Edit3 size={16} />
                                                    </button>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleDeleteTarif(tarif.id); }}
                                                        className="text-red-600 hover:text-red-800 p-2 rounded-full hover:bg-red-50 transition-colors"
                                                        title="Supprimer le tarif"
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
                    )}
                </>
            )}

            {/* Détails du tarif sélectionné (Panneau d'information) */}
            {selectedTarif && (
                <div className="mt-8 bg-white shadow-xl rounded-xl p-6 border border-indigo-100">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 pb-3 border-b border-gray-200">
                        <h2 className="text-xl font-bold text-gray-900">
                            Détails du Tarif : Indice <span className="text-indigo-600">{selectedTarif.indice}</span>
                        </h2>
                        <div className="flex gap-3 mt-3 sm:mt-0">
                            <button
                                onClick={() => handleOpenEditModal(selectedTarif)}
                                className="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 text-sm flex items-center gap-1 transition"
                            >
                                <Edit3 size={16} /> Modifier
                            </button>
                            <button
                                onClick={() => handleDeleteTarif(selectedTarif.id)}
                                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 text-sm flex items-center gap-1 transition"
                            >
                                <Trash2 size={16} /> Supprimer
                            </button>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 text-sm">
                            <thead className="bg-gray-50 text-gray-600 uppercase text-xs tracking-wider">
                                <tr>
                                    <th className="px-4 py-2 text-left font-bold">Zone Destination</th>
                                    <th className="px-4 py-2 text-right font-bold">Montant Base (€)</th>
                                    <th className="px-4 py-2 text-right font-bold">% Prést.</th>
                                    <th className="px-4 py-2 text-right font-bold">Montant Prést. (€)</th>
                                    <th className="px-4 py-2 text-right font-bold">Total Expédition (€)</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-100">
                                {selectedTarif.prix_zones.map((pz, index) => {
                                    const zone = zones.find((z) => z.id === pz.zone_destination_id);
                                    return (
                                        <tr key={index} className="hover:bg-gray-50">
                                            <td className="px-4 py-2 font-medium text-gray-800">
                                                {zone ? zone.nom : `ID: ${pz.zone_destination_id}`}
                                            </td>
                                            <td className="px-4 py-2 text-right">{pz.montant_base.toFixed(2)}</td>
                                            <td className="px-4 py-2 text-right font-semibold text-indigo-600">{pz.pourcentage_prestation}%</td>
                                            <td className="px-4 py-2 text-right">{pz.montant_prestation.toFixed(2)}</td>
                                            <td className="px-4 py-2 text-right font-bold text-lg">{pz.montant_expedition.toFixed(2)}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Modal d’ajout */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Ajouter un nouveau tarif simple"
                size="4xl"
            >
                {/* Passer les zones et tarifs pour la logique de formulaire si nécessaire */}
                <SimpleTarifForm
                    onSubmit={handleAddTarif}
                    onCancel={() => setIsModalOpen(false)}
                    isLoading={isLoading}
                    zones={zones} // Ajout de zones pour le formulaire
                    tarifs={tarifs} // Ajout des tarifs pour validation
                />
            </Modal>

            {/* Modal de modification */}
            {selectedTarif && (
                <Modal
                    isOpen={isEditingModalOpen}
                    onClose={() => setIsEditingModalOpen(false)}
                    title={`Modifier le tarif (Indice ${selectedTarif.indice})`}
                    size="4xl"
                >
                    <SimpleTarifForm
                        onSubmit={handleEditTarif}
                        onCancel={() => setIsEditingModalOpen(false)}
                        isLoading={isLoading}
                        initialData={selectedTarif}
                        zones={zones} // Ajout de zones pour le formulaire
                        tarifs={tarifs} // Ajout des tarifs pour validation
                    />
                </Modal>
            )}
        </div>
    );
};

export default SimpleRates;