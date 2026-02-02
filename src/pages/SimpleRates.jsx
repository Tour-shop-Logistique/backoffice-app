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
import {
    Loader2,
    PlusCircle,
    Edit3,
    Trash2,
    CheckCircle,
    XCircle,
    DollarSign,
    ListOrdered,
    MapPin,
    ChevronRight,
    Info,
    Layers,
    ArrowRight
} from "lucide-react";

const SimpleRates = () => {
    const dispatch = useDispatch();
    const { tarifs, isLoading, error } = useSelector((state) => state.tarification);
    const { zones } = useSelector((state) => state.zones);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedTarif, setSelectedTarif] = useState(null);
    const [isEditingModalOpen, setIsEditingModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [tarifToDelete, setTarifToDelete] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        dispatch(fetchTarifs());
        dispatch(fetchZones());
    }, [dispatch]);

    const handleOpenAddModal = () => {
        setSelectedTarif(null);
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (tarif) => {
        setSelectedTarif(tarif);
        setIsEditingModalOpen(true);
    };

    const handleAddTarif = async (tarifData) => {
        setIsSubmitting(true);
        try {
            const result = await dispatch(addSimpleTarif(tarifData));
            if (addSimpleTarif.fulfilled.match(result)) {
                setIsModalOpen(false);
                dispatch(fetchTarifs());
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEditTarif = async (tarifData) => {
        if (!selectedTarif) return;
        setIsSubmitting(true);
        try {
            const result = await dispatch(editSimpleTarif({ tarifId: selectedTarif.id, tarifData }));
            if (editSimpleTarif.fulfilled.match(result)) {
                setIsEditingModalOpen(false);
                setSelectedTarif(null);
                dispatch(fetchTarifs());
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleOpenDeleteModal = (tarif) => {
        setTarifToDelete(tarif);
        setIsDeleteModalOpen(true);
    };

    const handleDeleteTarif = async () => {
        if (!tarifToDelete) return;
        setIsDeleting(true);
        try {
            const result = await dispatch(deleteTarif(tarifToDelete.id));
            if (deleteTarif.fulfilled.match(result)) {
                if (selectedTarif?.id === tarifToDelete.id) setSelectedTarif(null);
                setIsDeleteModalOpen(false);
                setTarifToDelete(null);
                dispatch(fetchTarifs());
            }
        } finally {
            setIsDeleting(false);
        }
    };

    const handleStatusChange = async (tarifId) => {
        const result = await dispatch(updateTarifStatus(tarifId));
        if (updateTarifStatus.fulfilled.match(result)) {
            dispatch(fetchTarifs());
        }
    };

    const simpleTarifs = (tarifs || []).filter((t) => t.type_expedition === "simple");

    if (isLoading && simpleTarifs.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
                <Loader2 className="animate-spin text-indigo-600" size={48} />
                <p className="text-gray-500 font-medium text-lg italic">Chargement des tarifs simples...</p>
            </div>
        );
    }

    return (
        <div className="p-3 sm:p-5 bg-gray-50/50 min-h-screen animate-fade-in">
            {/* Header Section */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-6 transition-all hover:shadow-md">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                    <div>
                        <h1 className="text-3xl font-black text-gray-900 flex items-center gap-3 tracking-tight">
                            <div className="p-3 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-200">
                                <Layers size={28} className="text-white" />
                            </div>
                            <span className="bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                                Tarifs Simples
                            </span>
                        </h1>
                        <p className="text-gray-500 mt-2 font-medium flex items-center gap-2">
                            <Info size={16} className="text-indigo-400" />
                            Gérez vos grilles tarifaires standard par zones de destination.
                        </p>
                    </div>
                    <button
                        onClick={handleOpenAddModal}
                        className="group flex items-center gap-2 px-6 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold shadow-xl shadow-indigo-500/25 transition-all active:scale-95 text-base w-full sm:w-auto justify-center"
                    >
                        <PlusCircle size={20} className="group-hover:rotate-90 transition-transform duration-300" />
                        Nouveau Tarif
                    </button>
                </div>
            </div>

            {error && (
                <div className="mb-8 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-700 font-semibold animate-shake">
                    <XCircle size={20} />
                    {error}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                {/* Main List Column */}
                <div className="lg:col-span-7 space-y-6">
                    {simpleTarifs.length === 0 ? (
                        <div className="text-center py-20 bg-white rounded-3xl shadow-sm border border-gray-100 animate-fade-in">
                            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                <ListOrdered size={40} className="text-gray-300" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-800">Aucun tarif configuré</h3>
                            <p className="text-gray-500 mt-2 mb-8 max-w-xs mx-auto">Commencez par créer votre première grille tarifaire standard.</p>
                            <button
                                onClick={handleOpenAddModal}
                                className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-indigo-200"
                            >
                                Ajouter mon premier tarif
                            </button>
                        </div>
                    ) : (
                        <>
                            {/* Desktop View Table */}
                            <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="bg-gray-50/50 border-b border-gray-100">
                                            <th className="px-6 py-5 text-sm font-bold text-gray-500 uppercase tracking-wider">Indice</th>
                                            <th className="px-6 py-5 text-sm font-bold text-gray-500 uppercase tracking-wider">Zones</th>
                                            <th className="px-6 py-5 text-sm font-bold text-gray-500 uppercase tracking-wider">Statut</th>
                                            <th className="px-6 py-5 text-right text-sm font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {simpleTarifs.map((tarif) => (
                                            <tr
                                                key={tarif.id}
                                                onClick={() => setSelectedTarif(tarif)}
                                                className={`group transition-all cursor-pointer hover:bg-indigo-50/30 ${selectedTarif?.id === tarif.id ? 'bg-indigo-50/60 border-l-4 border-l-indigo-600' : 'border-l-4 border-l-transparent'}`}
                                            >
                                                <td className="px-6 py-5">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center font-black text-gray-400 group-hover:bg-white group-hover:text-indigo-600 transition-colors">
                                                            {tarif.indice}
                                                        </div>
                                                        <span className="font-bold text-gray-900">Config #{tarif.indice}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <div className="flex flex-col gap-1.5">
                                                        <div className="flex items-center gap-1.5 px-3 py-1 bg-gray-50 rounded-lg text-xs font-bold text-gray-600 w-fit">
                                                            <MapPin size={14} className="text-gray-400" />
                                                            {tarif.prix_zones.length} Zones
                                                        </div>
                                                        <div className="flex flex-wrap gap-1">
                                                            {Array.from(new Set(tarif.prix_zones.map(pz => pz.pourcentage_prestation))).map((pct, idx) => (
                                                                <span key={idx} className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">+{pct}%</span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleStatusChange(tarif.id); }}
                                                        className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold transition-all ${tarif.actif ? 'bg-green-50 text-green-600 hover:bg-green-100' : 'bg-red-50 text-red-500 hover:bg-red-100'}`}
                                                    >
                                                        <div className={`w-1.5 h-1.5 rounded-full ${tarif.actif ? 'bg-green-500' : 'bg-red-500'} shadow-sm`} />
                                                        {tarif.actif ? 'Actif' : 'Inactif'}
                                                    </button>
                                                </td>
                                                <td className="px-6 py-5 text-right">
                                                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleOpenEditModal(tarif); }}
                                                            className="p-2 text-indigo-600 hover:bg-white rounded-lg transition-all"
                                                        >
                                                            <Edit3 size={18} />
                                                        </button>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleOpenDeleteModal(tarif); }}
                                                            className="p-2 text-red-500 hover:bg-white rounded-lg transition-all"
                                                        >
                                                            <Trash2 size={18} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Mobile Card View */}
                            <div className="md:hidden space-y-4">
                                {simpleTarifs.map((tarif) => (
                                    <div
                                        key={tarif.id}
                                        onClick={() => setSelectedTarif(tarif)}
                                        className={`p-5 bg-white rounded-2xl border transition-all active:scale-[0.98] ${selectedTarif?.id === tarif.id ? 'border-indigo-600 ring-2 ring-indigo-600/10' : 'border-gray-100'}`}
                                    >
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center font-black text-indigo-600 text-lg">
                                                    {tarif.indice}
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-gray-900">Tarif Simple</h3>
                                                    <p className="text-xs font-medium text-gray-500">Configurée le {new Date(tarif.created_at).toLocaleDateString()}</p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleStatusChange(tarif.id); }}
                                                className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${tarif.actif ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}
                                            >
                                                {tarif.actif ? 'Actif' : 'Inactif'}
                                            </button>
                                        </div>
                                        <div className="flex items-center justify-between text-sm">
                                            <div className="flex flex-col gap-2">
                                                <div className="flex items-center gap-2 font-bold text-gray-600">
                                                    <MapPin size={16} className="text-gray-400" />
                                                    {tarif.prix_zones.length} Zones desservies
                                                </div>
                                                <div className="flex flex-wrap gap-1">
                                                    {Array.from(new Set(tarif.prix_zones.map(pz => pz.pourcentage_prestation))).map((pct, idx) => (
                                                        <span key={idx} className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">+{pct}%</span>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <button onClick={(e) => { e.stopPropagation(); handleOpenEditModal(tarif); }} className="p-2 bg-indigo-50 text-indigo-600 rounded-xl"><Edit3 size={18} /></button>
                                                <button onClick={(e) => { e.stopPropagation(); handleOpenDeleteModal(tarif); }} className="p-2 bg-red-50 text-red-500 rounded-xl"><Trash2 size={18} /></button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>

                {/* Details Column */}
                <div className="lg:col-span-5">
                    <div className="sticky top-5">
                        {selectedTarif ? (
                            <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden animate-slide-in-right">
                                <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 p-8 text-white">
                                    <div className="flex justify-between items-start mb-6">
                                        <div>
                                            <span className="text-indigo-100 text-xs font-black uppercase tracking-widest bg-white/10 px-3 py-1 rounded-full">Détails de la grille</span>
                                            <h2 className="text-3xl font-black mt-2">Indice {selectedTarif.indice}</h2>
                                        </div>
                                        <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md">
                                            <DollarSign size={24} />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-4 bg-white/10 rounded-2xl backdrop-blur-sm">
                                            <p className="text-indigo-100 text-[10px] font-bold uppercase tracking-wider">Zones total</p>
                                            <p className="text-2xl font-black">{selectedTarif.prix_zones.length}</p>
                                        </div>
                                        <div className="p-4 bg-white/10 rounded-2xl backdrop-blur-sm">
                                            <p className="text-indigo-100 text-[10px] font-bold uppercase tracking-wider">Statut actuel</p>
                                            <p className="text-2xl font-black uppercase leading-tight">{selectedTarif.actif ? 'Actif' : 'Inactif'}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-6">
                                    <h4 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center justify-between">
                                        Grille de prix par zone
                                        <div className="h-px bg-gray-100 flex-1 ml-4" />
                                    </h4>
                                    <div className="space-y-3">
                                        {selectedTarif.prix_zones.map((pz, index) => {
                                            const zone = zones.find((z) => z.id === pz.zone_destination_id);
                                            return (
                                                <div key={index} className="flex flex-col p-4 bg-gray-50 rounded-xl border border-transparent hover:border-indigo-100 hover:bg-white hover:shadow-lg hover:shadow-indigo-500/5 transition-all group">
                                                    <div className="flex justify-between items-center mb-2">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xs uppercase">
                                                                {zone?.nom?.substring(0, 2) || 'Z'}
                                                            </div>
                                                            <span className="font-bold text-gray-800 group-hover:text-indigo-600 transition-colors">{zone?.nom || `Zone ID: ${pz.zone_destination_id}`}</span>
                                                        </div>
                                                        <div className="text-lg font-black text-gray-900">
                                                            {pz.montant_expedition.toLocaleString()} <span className="text-[10px] text-gray-400 uppercase">FCFA</span>
                                                        </div>
                                                    </div>
                                                    <div className="grid grid-cols-3 gap-2 mt-2">
                                                        <div className="text-center">
                                                            <p className="text-[9px] font-black text-gray-400 uppercase leading-none mb-1">Base</p>
                                                            <p className="text-xs font-bold text-gray-700">{pz.montant_base.toLocaleString()} FCFA</p>
                                                        </div>
                                                        <div className="text-center border-x border-gray-200">
                                                            <p className="text-[9px] font-black text-gray-400 uppercase leading-none mb-1">Prést. %</p>
                                                            <p className="text-xs font-bold text-indigo-600">{pz.pourcentage_prestation}%</p>
                                                        </div>
                                                        <div className="text-center">
                                                            <p className="text-[9px] font-black text-gray-400 uppercase leading-none mb-1">Prést. FCFA</p>
                                                            <p className="text-xs font-bold text-gray-700">{pz.montant_prestation.toLocaleString()} FCFA</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    <div className="mt-8 pt-6 border-t border-gray-100 flex gap-3">
                                        <button
                                            onClick={() => handleOpenEditModal(selectedTarif)}
                                            className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-indigo-50 text-indigo-600 rounded-2xl font-bold hover:bg-indigo-100 transition-all uppercase text-[10px] tracking-widest"
                                        >
                                            <Edit3 size={16} /> Modifier
                                        </button>
                                        <button
                                            onClick={() => handleOpenDeleteModal(selectedTarif)}
                                            className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-red-50 text-red-500 rounded-2xl font-bold hover:bg-red-100 transition-all uppercase text-[10px] tracking-widest"
                                        >
                                            <Trash2 size={16} /> Supprimer
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-white rounded-2xl shadow-sm border border-dashed border-gray-200 p-12 text-center">
                                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <ArrowRight size={32} className="text-gray-300 animate-bounce-x" />
                                </div>
                                <h3 className="font-bold text-gray-800">Sélectionnez un tarif</h3>
                                <p className="text-sm text-gray-400 mt-2">Cliquez sur une ligne dans la liste pour voir les détails de prix par zone.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Modals */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Configuration de Tarif"
                size="4xl"
            >
                <div className="p-2 sm:p-4">
                    <SimpleTarifForm
                        onSubmit={handleAddTarif}
                        onCancel={() => setIsModalOpen(false)}
                        isLoading={isSubmitting}
                        zones={zones}
                        tarifs={tarifs}
                    />
                </div>
            </Modal>

            {selectedTarif && (
                <Modal
                    isOpen={isEditingModalOpen}
                    onClose={() => setIsEditingModalOpen(false)}
                    title={`Modification du Tarif #${selectedTarif.indice}`}
                    size="4xl"
                >
                    <div className="p-2 sm:p-4">
                        <SimpleTarifForm
                            onSubmit={handleEditTarif}
                            onCancel={() => setIsEditingModalOpen(false)}
                            isLoading={isSubmitting}
                            initialData={selectedTarif}
                            zones={zones}
                            tarifs={tarifs}
                        />
                    </div>
                </Modal>
            )}

            {/* Confirmation de suppression */}
            <Modal
                isOpen={isDeleteModalOpen}
                onClose={() => !isDeleting && setIsDeleteModalOpen(false)}
                title="Confirmer la suppression"
                size="md"
            >
                <div className="text-center p-2">
                    <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Trash2 size={32} />
                    </div>
                    <h4 className="text-xl font-black text-gray-900 mb-2">Êtes-vous sûr ?</h4>
                    <p className="text-gray-500 text-sm mb-8">
                        Vous êtes sur le point de supprimer le tarif <span className="font-bold text-gray-900">#{tarifToDelete?.indice}</span>.
                        Cette action est définitive et ne pourra pas être annulée.
                    </p>
                    <div className="flex gap-3">
                        <button
                            onClick={() => setIsDeleteModalOpen(false)}
                            disabled={isDeleting}
                            className="flex-1 px-4 py-3 bg-gray-100 text-gray-600 rounded-xl font-bold hover:bg-gray-200 transition-all"
                        >
                            Annuler
                        </button>
                        <button
                            onClick={handleDeleteTarif}
                            disabled={isDeleting}
                            className="flex-1 px-4 py-3 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 transition-all shadow-lg shadow-red-500/20 flex items-center justify-center gap-2"
                        >
                            {isDeleting ? (
                                <>
                                    <Loader2 size={18} className="animate-spin" />
                                    Suppression...
                                </>
                            ) : (
                                "Oui, supprimer"
                            )}
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default SimpleRates;