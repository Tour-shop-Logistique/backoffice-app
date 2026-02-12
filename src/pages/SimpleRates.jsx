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
    MapPin,
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
import { showNotification } from '../redux/slices/uiSlice';

const SimpleRates = () => {
    const dispatch = useDispatch();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);

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
    const [updatingStatus, setUpdatingStatus] = useState({});

    const handleRefresh = async () => {
        setIsRefreshing(true);
        try {
            await Promise.all([
                dispatch(fetchTarifs({ silent: true })).unwrap(),
                dispatch(fetchZones({ silent: true })).unwrap()
            ]);
            dispatch(showNotification({ type: 'success', message: 'Tarifs et zones mis à jour.' }));
        } catch (error) {
            dispatch(showNotification({ type: 'error', message: 'Erreur lors du rafraîchissement.' }));
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
            await dispatch(addSimpleTarif(tarifData)).unwrap();
            setIsModalOpen(false);
            dispatch(showNotification({ type: 'success', message: 'Nouveau tarif ajouté avec succès.' }));
            // Refresh in background
            dispatch(fetchTarifs({ silent: true }));
        } catch (error) {
            dispatch(showNotification({ type: 'error', message: error.message || "Erreur lors de l'ajout du tarif." }));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEditTarif = async (tarifData) => {
        setIsSubmitting(true);
        try {
            const { id, zone_destination_id, montant_base, pourcentage_prestation } = tarifData;

            // Body restricted as per user specs for modification
            const modificationPayload = {
                zone_destination_id,
                montant_base,
                pourcentage_prestation
            };

            if (id) {
                await dispatch(editSimpleTarif({
                    tarifId: id,
                    tarifData: modificationPayload
                })).unwrap();
            }

            setIsEditingModalOpen(false);
            setSelectedTarif(null);
            dispatch(showNotification({ type: 'success', message: 'Tarif mis à jour.' }));
            // Refresh in background
            dispatch(fetchTarifs({ silent: true }));
        } catch (error) {
            dispatch(showNotification({ type: 'error', message: error.message || 'Erreur lors de la modification.' }));
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
            await dispatch(deleteTarif(tarifToDelete.id)).unwrap();

            setIsDeleteModalOpen(false);
            setTarifToDelete(null);
            dispatch(showNotification({ type: 'success', message: 'Tarif supprimé avec succès.' }));
            // Refresh in background
            dispatch(fetchTarifs({ silent: true }));
        } catch (error) {
            dispatch(showNotification({ type: 'error', message: 'Erreur lors de la suppression.' }));
        } finally {
            setIsDeleting(false);
        }
    };

    const handleStatusChange = async (tarif) => {
        try {
            setUpdatingStatus(prev => ({ ...prev, [tarif.id]: true }));
            await dispatch(updateTarifStatus(tarif.id)).unwrap();
            // dispatch(showNotification({ type: 'success', message: 'Statut mis à jour.' }));
        } catch (error) {
            dispatch(showNotification({ type: 'error', message: 'Erreur lors du changement de statut.' }));
        } finally {
            setUpdatingStatus(prev => ({ ...prev, [tarif.id]: false }));
        }
    };

    // 1. Filtrer d'abord par type et par recherche (pour les compteurs)
    const filteredBySearch = useMemo(() => {
        if (!Array.isArray(tarifs)) return [];
        const raw = tarifs.filter((t) => t && t.type_expedition === "simple");

        return raw.filter(tarif => {
            const indice = tarif.indice?.toString() || '';
            const zone = zones.find(z => z.id === tarif.zone_destination_id);
            const zoneName = (zone?.nom || tarif.pays || '').toLowerCase();
            const search = searchTerm.toLowerCase();
            return indice.includes(search) || zoneName.includes(search);
        });
    }, [tarifs, zones, searchTerm]);

    // 2. Filtrer par statut pour l'affichage
    const simpleTarifs = useMemo(() => {
        const filtered = filteredBySearch.filter(tarif => {
            const matchesStatus = filterStatus === 'all' ||
                (filterStatus === 'active' && tarif.actif) ||
                (filterStatus === 'inactive' && !tarif.actif);
            return matchesStatus;
        });

        return filtered.sort((a, b) => {
            if (a.indice !== b.indice) return (a.indice || 0) - (b.indice || 0);
            return (a.pays || '').localeCompare(b.pays || '');
        });
    }, [filteredBySearch, filterStatus]);

    // 3. Compteurs basés sur la recherche uniquement
    const counts = useMemo(() => ({
        all: filteredBySearch.length,
        active: filteredBySearch.filter(t => t.actif).length,
        inactive: filteredBySearch.filter(t => !t.actif).length
    }), [filteredBySearch]);

    return (
        <div className="space-y-4 pb-6 md:space-y-6 md:pb-12">

            {/* HEADER - Mobile Optimized */}
            <header className="space-y-3 md:space-y-0">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
                            Tarifs Simples
                        </h1>
                        <p className="text-xs md:text-sm text-slate-500 mt-0.5 font-medium">
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
                    placeholder="Rechercher par indice ou pays..."
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

                {/* Body Content */}
                {isLoading && simpleTarifs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 px-6">
                        <Loader2 className="h-10 w-10 text-slate-900 animate-spin mb-3" />
                        <p className="text-slate-500 text-sm font-medium">Chargement des tarifs...</p>
                    </div>
                ) : simpleTarifs.length === 0 ? (
                    <div className="py-20 text-center px-6">
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
                                        <th className="px-6 py-3 text-left font-bold text-slate-500 uppercase tracking-wider text-xs">Indice</th>
                                        <th className="px-6 py-3 text-left font-bold text-slate-500 uppercase tracking-wider text-xs">Destination</th>
                                        <th className="px-6 py-3 text-left font-bold text-slate-500 uppercase tracking-wider text-xs">Montant Base</th>
                                        <th className="px-6 py-3 text-left font-bold text-slate-500 uppercase tracking-wider text-xs">Prestation</th>
                                        <th className="px-6 py-3 text-left font-bold text-slate-500 uppercase tracking-wider text-xs">Total</th>
                                        <th className="px-6 py-3 text-center font-bold text-slate-500 uppercase tracking-wider text-xs">Statut</th>
                                        <th className="px-6 py-3 text-right font-bold text-slate-500 uppercase tracking-wider text-xs">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200">
                                    {simpleTarifs.map((tarif) => {
                                        const zoneName = zones.find(z => z.id === tarif.zone_destination_id)?.nom || tarif.pays || 'Zone ?';
                                        const mb = parseFloat(tarif.montant_base) || 0;
                                        const pp = parseFloat(tarif.pourcentage_prestation) || 0;
                                        const mp = mb * (pp / 100);
                                        const total = mb + mp;

                                        return (
                                            <tr key={tarif.id} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="px-6 py-3">
                                                    <div className="inline-flex items-center justify-center px-2.5 py-1 rounded bg-blue-100 text-slate-700 font-bold text-xs border border-slate-200">
                                                        {tarif.indice}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-3">
                                                    <div className="flex items-center gap-2">
                                                        <MapPin size={14} className="text-slate-400" />
                                                        <p className="font-semibold text-slate-900">{zoneName}</p>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-3">
                                                    <p className="font-medium text-slate-700">{mb.toLocaleString()} <span className="text-[10px]">FCFA</span></p>
                                                </td>
                                                <td className="px-6 py-3">
                                                    <div className="flex flex-row gap-2">
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded bg-orange-50 text-orange-700 border border-orange-100 font-bold w-fit">
                                                            {pp}%
                                                        </span>
                                                        <span className="text-slate-400 font-medium mt-0.5 whitespace-nowrap">
                                                            ({mp.toLocaleString()} <span className="text-[10px]">FCFA</span>)
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-3">
                                                    <p className="font-bold text-slate-900">{total.toLocaleString()} <span className="text-[10px]">FCFA</span></p>
                                                </td>
                                                <td className="px-6 py-3 text-center">
                                                    <button
                                                        onClick={() => handleStatusChange(tarif)}
                                                        disabled={updatingStatus[tarif.id]}
                                                        className="group relative flex items-center gap-3 transition-all active:scale-95 mx-auto disabled:opacity-50"
                                                        title={`Cliquez pour ${tarif.actif ? 'désactiver' : 'activer'}`}
                                                    >
                                                        <div className={`relative w-10 h-5 rounded-full transition-colors duration-200 ${tarif.actif ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                                                            <div className={`absolute top-0.5 left-0.5 bg-white w-4 h-4 rounded-full shadow-sm transform transition-transform duration-200 ${tarif.actif ? 'translate-x-5' : 'translate-x-0'}`} />
                                                        </div>
                                                    </button>
                                                </td>
                                                <td className="px-6 py-3">
                                                    <div className="flex justify-end gap-2">
                                                        <button
                                                            onClick={() => handleOpenEditModal(tarif)}
                                                            className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
                                                            title="Modifier"
                                                        >
                                                            <Edit2 size={16} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleOpenDeleteModal(tarif)}
                                                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                                            title="Supprimer"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile Cards - Native App Style */}
                        <div className="md:hidden divide-y divide-slate-200">
                            {simpleTarifs.map((tarif) => {
                                const mb = parseFloat(tarif.montant_base) || 0;
                                const pp = parseFloat(tarif.pourcentage_prestation) || 0;
                                const mp = mb * (pp / 100);
                                const total = mb + mp;

                                return (
                                    <div key={tarif.id} className="p-3 space-y-2.5 active:bg-slate-50 transition-colors">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex items-center gap-2.5 min-w-0">
                                                <div className="px-2 py-1 rounded bg-blue-100 text-slate-700 font-bold text-xs border border-slate-200 shrink-0">
                                                    {tarif.indice}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-semibold text-slate-900 text-sm truncate">
                                                        {zones.find(z => z.id === tarif.zone_destination_id)?.nom || tarif.pays || '?'}
                                                    </p>
                                                    <p className="text-xs text-slate-500 font-bold uppercase">
                                                        {total.toLocaleString()} FCFA
                                                    </p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleStatusChange(tarif)}
                                                disabled={updatingStatus[tarif.id]}
                                                className="flex items-center gap-2 active:scale-95 transition-all disabled:opacity-50"
                                            >
                                                <div className={`relative w-8 h-4 rounded-full transition-colors duration-200 ${tarif.actif ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                                                    <div className={`absolute top-0.5 left-0.5 bg-white w-3 h-3 rounded-full shadow-sm transform transition-transform duration-200 ${tarif.actif ? 'translate-x-4' : 'translate-x-0'}`} />
                                                </div>
                                            </button>
                                        </div>

                                        <div className="grid grid-cols-2 gap-2">
                                            <div className="bg-slate-50 rounded-lg p-2 flex flex-col items-center justify-center border border-slate-100">
                                                <span className="text-[9px] text-slate-400 font-bold">Montant Base</span>
                                                <span className="text-xs font-semibold text-slate-700">{mb.toLocaleString()}</span>
                                            </div>
                                            <div className="bg-slate-50 rounded-lg p-2 flex flex-col items-center justify-center border border-slate-100">
                                                <span className="text-[9px] text-slate-400 font-bold">Prestation</span>
                                                <div className="flex flex-row items-center gap-2">
                                                    <span className="text-xs font-semibold text-orange-600">{pp}%</span>
                                                    <span className="text-xs text-slate-400 font-medium">({mp.toLocaleString()} F)</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleOpenEditModal(tarif)}
                                                className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-50 active:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-medium transition-all active:scale-95"
                                            >
                                                <Edit3 size={13} />
                                                Modifier
                                            </button>
                                            <button
                                                onClick={() => handleOpenDeleteModal(tarif)}
                                                className="inline-flex items-center justify-center p-2 text-red-500 active:bg-red-50 border border-red-100 rounded-lg transition-all active:scale-95"
                                            >
                                                <Trash2 size={15} />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </>
                )}
            </div>

            {/* MODALS */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Nouveau Tarif Simple"
                subtitle="Définissez l'indice, la zone et les prix"
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
                title="Modifier Tarif Simple"
                subtitle={`Mise à jour de la grille pour l'indice #${selectedTarif?.indice}`}
                size="xl"
            >
                {selectedTarif && (
                    <SimpleTarifForm
                        initialData={selectedTarif}
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
                itemName={`${tarifToDelete?.indice} KG (${zones.find(z => z.id === tarifToDelete?.zone_destination_id)?.nom || tarifToDelete?.pays || '?'})`}
                isLoading={isDeleting}
            />
        </div>
    );
};

export default SimpleRates;