import React, { useEffect, useState, useRef, useCallback, useMemo } from "react";
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
import DeleteModal from "../components/common/DeleteModal";
import SimpleTarifForm from "../components/common/SimpleTarifForm";
import {
    CheckCircle2,
    XCircle,
    Search,
    RefreshCw,
    PlusCircle,
    ListOrdered,
    Edit3,
    Trash2,
    Loader2,
    Edit2,
    Package
} from "lucide-react";
import NotificationPortal from '../components/widget/notification';

const SimpleRates = () => {
    const dispatch = useDispatch();
    const [notification, setNotification] = useState(null);
    const notificationTimeoutRef = useRef(null);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const showNotification = useCallback((type, message) => {
        if (notificationTimeoutRef.current) clearTimeout(notificationTimeoutRef.current);
        setNotification({ type, message });
        notificationTimeoutRef.current = setTimeout(() => setNotification(null), 4000);
    }, []);

    useEffect(() => () => {
        if (notificationTimeoutRef.current) clearTimeout(notificationTimeoutRef.current);
    }, []);

    const { tarifs, isLoading, error, hasLoaded: hasLoadedTarifs } = useSelector((state) => state.tarification);
    const { zones, hasLoaded: hasLoadedZones } = useSelector((state) => state.zones);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedTarif, setSelectedTarif] = useState(null);
    const [isEditingModalOpen, setIsEditingModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [isDeleting, setIsDeleting] = useState(false);
    const [tarifToDelete, setTarifToDelete] = useState(null);

    const handleRefresh = async () => {
        setIsRefreshing(true);
        try {
            await Promise.all([
                dispatch(fetchTarifs({ silent: true })).unwrap(),
                dispatch(fetchZones({ silent: true })).unwrap()
            ]);
            showNotification('success', 'Tarifs et zones mis à jour.');
        } catch (error) {
            showNotification('error', 'Erreur lors du rafraîchissement.');
        } finally {
            setIsRefreshing(false);
        }
    };

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
            const promises = tarifData.zones.map(zone =>
                dispatch(addSimpleTarif({
                    indice: tarifData.indice,
                    montant_base: zone.montant_base,
                    zone_destination_id: zone.zone_destination_id,
                    pourcentage_prestation: zone.pourcentage_prestation
                }))
            );

            await Promise.all(promises);
            setIsModalOpen(false);
            showNotification('success', 'Nouveaux tarifs ajoutés avec succès.');
        } catch (error) {
            showNotification('error', "Erreur lors de l'ajout des tarifs.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEditTarif = async (tarifData) => {
        setIsSubmitting(true);
        try {
            const promises = tarifData.zones.map(zone => {
                if (zone.id) {
                    return dispatch(editSimpleTarif({
                        tarifId: zone.id,
                        tarifData: {
                            indice: tarifData.indice,
                            montant_base: zone.montant_base,
                            zone_destination_id: zone.zone_destination_id,
                            pourcentage_prestation: zone.pourcentage_prestation
                        }
                    }));
                } else {
                    return dispatch(addSimpleTarif({
                        indice: tarifData.indice,
                        montant_base: zone.montant_base,
                        zone_destination_id: zone.zone_destination_id,
                        pourcentage_prestation: zone.pourcentage_prestation
                    }));
                }
            });

            await Promise.all(promises);
            setIsEditingModalOpen(false);
            setSelectedTarif(null);
            showNotification('success', 'Grille tarifaire mise à jour.');
        } catch (error) {
            showNotification('error', 'Erreur lors de la modification.');
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
            const promises = tarifToDelete.prix_zones.map(pz =>
                dispatch(deleteTarif(pz.id))
            );

            await Promise.all(promises);

            if (selectedTarif?.indice === tarifToDelete.indice && selectedTarif?.pays === tarifToDelete.pays) {
                setSelectedTarif(null);
            }
            setIsDeleteModalOpen(false);
            setTarifToDelete(null);
            showNotification('success', 'Grille tarifaire supprimée.');
        } catch (error) {
            showNotification('error', 'Erreur lors de la suppression.');
        } finally {
            setIsDeleting(false);
        }
    };

    const handleStatusChange = async (tarifGroup) => {
        try {
            const promises = tarifGroup.prix_zones.map(pz =>
                dispatch(updateTarifStatus(pz.id))
            );
            await Promise.all(promises);
            showNotification('success', 'Statut mis à jour.');
        } catch (error) {
            showNotification('error', 'Erreur lors du changement de statut.');
        }
    };

    const simpleTarifs = useMemo(() => {
        if (!Array.isArray(tarifs)) return [];

        const raw = tarifs.filter((t) => t && t.type_expedition === "simple");

        const filtered = raw.filter(tarif => {
            const indice = tarif.indice?.toString() || '';
            const pays = tarif.pays?.toLowerCase() || '';
            const search = searchTerm.toLowerCase();

            const matchesSearch = indice.includes(search) || pays.includes(search);
            const matchesStatus = filterStatus === 'all' ||
                (filterStatus === 'active' && tarif.actif) ||
                (filterStatus === 'inactive' && !tarif.actif);
            return matchesSearch && matchesStatus;
        });

        const grouped = {};
        filtered.forEach(tarif => {
            const key = `${tarif.indice}-${tarif.pays}`;
            if (!grouped[key]) {
                grouped[key] = {
                    key,
                    indice: tarif.indice,
                    pays: tarif.pays,
                    actif: true,
                    prix_zones: []
                };
            }
            grouped[key].prix_zones.push(tarif);
            if (!tarif.actif) grouped[key].actif = false;
        });

        return Object.values(grouped).sort((a, b) => (a.indice || 0) - (b.indice || 0));
    }, [tarifs, searchTerm, filterStatus]);

    return (
        <div className="space-y-4 pb-6 md:space-y-6 md:pb-12">
            <NotificationPortal notification={notification} onClose={() => setNotification(null)} />

            {/* HEADER - Mobile Optimized */}
            <header className="space-y-3 md:space-y-0">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
                            Tarifs Simples
                        </h1>
                        <p className="text-xs md:text-sm text-slate-500 mt-0.5">
                            Gérez les prix par indice d'expédition
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
                            onClick={handleOpenAddModal}
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
                    placeholder="Rechercher par indice ou pays de départ..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 md:pl-12 pr-3 md:pr-4 py-2.5 md:py-3 bg-white border border-slate-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 transition-all text-sm placeholder:text-slate-400"
                />
            </div>

            {/* TABS + CONTENT - Mobile Optimized */}
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
                            Toutes ({simpleTarifs.length})
                        </button>
                        <button
                            onClick={() => setFilterStatus('active')}
                            className={`px-4 md:px-6 py-2 md:py-3 text-xs md:text-sm font-medium whitespace-nowrap transition-all ${filterStatus === 'active'
                                ? 'text-emerald-600 border-b-2 border-emerald-600 bg-white'
                                : 'text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            Actives ({simpleTarifs.filter(t => t.actif).length})
                        </button>
                        <button
                            onClick={() => setFilterStatus('inactive')}
                            className={`px-4 md:px-6 py-2 md:py-3 text-xs md:text-sm font-medium whitespace-nowrap transition-all ${filterStatus === 'inactive'
                                ? 'text-rose-600 border-b-2 border-rose-600 bg-white'
                                : 'text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            Inactives ({simpleTarifs.filter(t => !t.actif).length})
                        </button>
                    </div>
                </div>

                {/* Body Content */}
                {isLoading && simpleTarifs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <Loader2 className="h-10 w-10 text-slate-900 animate-spin mb-3" />
                        <p className="text-slate-500 text-sm font-medium">Chargement des tarifs...</p>
                    </div>
                ) : simpleTarifs.length === 0 ? (
                    <div className="py-20 text-center">
                        <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
                            <ListOrdered className="text-slate-400" size={32} />
                        </div>
                        <h3 className="font-bold text-slate-900 text-lg">Aucune grille trouvée</h3>
                        <p className="text-slate-500 text-sm mt-2">Ajustez votre recherche ou ajoutez un nouveau tarif.</p>
                    </div>
                ) : (
                    <>
                        {/* Desktop Table */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-slate-50/50 border-b border-slate-200">
                                    <tr>
                                        <th className="px-6 py-4 text-left font-bold text-slate-500 uppercase tracking-wider text-xs">Indice</th>
                                        <th className="px-6 py-4 text-left font-bold text-slate-500 uppercase tracking-wider text-xs">Départ</th>
                                        <th className="px-6 py-4 text-left font-bold text-slate-500 uppercase tracking-wider text-xs">Détails Zones</th>
                                        <th className="px-6 py-4 text-center font-bold text-slate-500 uppercase tracking-wider text-xs">Statut</th>
                                        <th className="px-6 py-4 text-right font-bold text-slate-500 uppercase tracking-wider text-xs">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {simpleTarifs.map((groupe) => (
                                        <tr key={groupe.key} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="inline-flex items-center justify-center px-2.5 py-1 rounded bg-slate-100 text-slate-700 font-bold text-xs border border-slate-200">
                                                    #{groupe.indice}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="font-bold text-slate-900">{groupe.pays}</p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-wrap gap-1.5">
                                                    {groupe.prix_zones.map(pz => {
                                                        const zoneName = zones.find(z => z.id === pz.zone_destination_id)?.nom || 'Zone ?';
                                                        return (
                                                            <span key={pz.id} className="inline-flex items-center text-[10px] px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-100 font-bold">
                                                                {zoneName}: {pz.montant_base}/{pz.pourcentage_prestation}%
                                                            </span>
                                                        );
                                                    })}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <button
                                                    onClick={() => handleStatusChange(groupe)}
                                                    className="group relative flex items-center gap-3 transition-all active:scale-95"
                                                    title={`Cliquez pour ${groupe.actif ? 'désactiver' : 'activer'}`}
                                                >
                                                    <div className={`relative w-10 h-5 rounded-full transition-colors duration-200 ${groupe.actif ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                                                        <div className={`absolute top-0.5 left-0.5 bg-white w-4 h-4 rounded-full shadow-sm transform transition-transform duration-200 ${groupe.actif ? 'translate-x-5' : 'translate-x-0'}`} />
                                                    </div>
                                                    <span className={`text-[10px] font-bold uppercase tracking-wider ${groupe.actif ? 'text-emerald-700' : 'text-slate-400'}`}>
                                                        {groupe.actif ? 'ACTIF' : 'INACTIF'}
                                                    </span>
                                                </button>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        onClick={() => handleOpenEditModal(groupe)}
                                                        className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
                                                        title="Modifier"
                                                    >
                                                        <Edit2 size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleOpenDeleteModal(groupe)}
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
                        <div className="md:hidden divide-y divide-slate-100">
                            {simpleTarifs.map((groupe) => (
                                <div key={groupe.key} className="p-3 space-y-2.5 active:bg-slate-50 transition-colors">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex items-center gap-2.5 min-w-0">
                                            <div className="px-2 py-1 rounded bg-slate-100 text-slate-700 font-bold text-xs border border-slate-200 shrink-0">
                                                #{groupe.indice}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-bold text-slate-900 text-sm truncate">{groupe.pays}</p>
                                                <p className="text-[11px] text-slate-500 truncate">{groupe.prix_zones.length} zone(s)</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleStatusChange(groupe)}
                                            className="flex items-center gap-2 active:scale-95 transition-all"
                                        >
                                            <div className={`relative w-8 h-4 rounded-full transition-colors ${groupe.actif ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                                                <div className={`absolute top-0.5 left-0.5 bg-white w-3 h-3 rounded-full transform transition-transform ${groupe.actif ? 'translate-x-4' : 'translate-x-0'}`} />
                                            </div>
                                            <span className={`text-[9px] font-black tracking-tighter ${groupe.actif ? 'text-emerald-600' : 'text-slate-400'}`}>
                                                {groupe.actif ? 'ACTIF' : 'INACTIF'}
                                            </span>
                                        </button>
                                    </div>

                                    <div className="bg-slate-50 rounded-lg p-2 flex flex-wrap gap-1.5">
                                        {groupe.prix_zones.map(pz => {
                                            const zoneName = zones.find(z => z.id === pz.zone_destination_id)?.nom || '?';
                                            return (
                                                <span key={pz.id} className="inline-flex items-center text-[10px] px-1.5 py-0.5 rounded bg-white text-slate-600 border border-slate-100 font-bold">
                                                    {zoneName}: <span className="ml-1 text-slate-900">{pz.montant_base}</span>
                                                </span>
                                            );
                                        })}
                                    </div>

                                    <div className="flex gap-2 pt-1">
                                        <button
                                            onClick={() => handleOpenEditModal(groupe)}
                                            className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-50 active:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-medium transition-all active:scale-95"
                                        >
                                            <Edit3 size={13} />
                                            Modifier
                                        </button>
                                        <button
                                            onClick={() => handleOpenDeleteModal(groupe)}
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

            {/* MODALS */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Configuration Tarif Simple"
                subtitle="Définissez les prix de base et les pourcentages par zone"
                size="xl"
            >
                <SimpleTarifForm
                    onSubmit={handleAddTarif}
                    onCancel={() => setIsModalOpen(false)}
                    zones={zones}
                    isLoading={isSubmitting}
                />
            </Modal>

            <Modal
                isOpen={isEditingModalOpen}
                onClose={() => setIsEditingModalOpen(false)}
                title="Modification Tarif Simple"
                subtitle={`Mise à jour de la grille pour l'indice #${selectedTarif?.indice}`}
                size="xl"
            >
                {selectedTarif && (
                    <SimpleTarifForm
                        initialData={{
                            indice: selectedTarif.indice,
                            zones: selectedTarif.prix_zones
                        }}
                        onSubmit={handleEditTarif}
                        onCancel={() => setIsEditingModalOpen(false)}
                        zones={zones}
                        isLoading={isSubmitting}
                    />
                )}
            </Modal>

            <DeleteModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDeleteTarif}
                itemName={`#${tarifToDelete?.indice} (${tarifToDelete?.pays})`}
                isLoading={isDeleting}
            />
        </div>
    );
};

export default SimpleRates;