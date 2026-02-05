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
import SimpleTarifForm from "../components/common/SimpleTarifForm";
import {
    ArrowRight,
    CheckCircle2,
    XCircle,
    Search,
    RefreshCw,
    PlusCircle,
    ListOrdered,
    Edit3,
    Trash2,
    ChevronRight,
    Info,
    Layers,
    Loader2,
    MapPin,
    DollarSign
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
            // New API requires individual requests for each zone
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
            dispatch(fetchTarifs());
        } catch (error) {
            console.error("Erreur lors de l'ajout des tarifs:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEditTarif = async (tarifData) => {
        setIsSubmitting(true);
        try {
            // For editing, we need to handle each zone update individually
            // Note: In the group design, some might be new, some existing.
            // For simplicity based on current flow: delete then re-add or update individual records
            // Assuming the simpleTarifForm returns the full state
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
            dispatch(fetchTarifs());
        } catch (error) {
            console.error("Erreur lors de la modification des tarifs:", error);
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
            // Since the API is now per-zone, deleting a "group" means deleting each record in it
            const promises = tarifToDelete.prix_zones.map(pz =>
                dispatch(deleteTarif(pz.id))
            );

            await Promise.all(promises);

            if (selectedTarif?.indice === tarifToDelete.indice && selectedTarif?.pays === tarifToDelete.pays) {
                setSelectedTarif(null);
            }
            setIsDeleteModalOpen(false);
            setTarifToDelete(null);
            dispatch(fetchTarifs());
        } catch (error) {
            console.error("Erreur lors de la suppression des tarifs:", error);
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
            dispatch(fetchTarifs());
        } catch (error) {
            console.error("Erreur lors du changement de statut:", error);
        }
    };

    const simpleTarifs = useMemo(() => {
        if (!tarifs) return [];
        const raw = tarifs.filter((t) => t.type_expedition === "simple");

        const filtered = raw.filter(tarif => {
            const matchesSearch = tarif.indice.toString().includes(searchTerm) ||
                tarif.pays.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStatus = filterStatus === 'all' ||
                (filterStatus === 'active' && tarif.actif) ||
                (filterStatus === 'inactive' && !tarif.actif);
            return matchesSearch && matchesStatus;
        });

        const groups = {};
        filtered.forEach(tarif => {
            const key = `${tarif.indice}-${tarif.pays}`;
            if (!groups[key]) {
                groups[key] = {
                    ...tarif,
                    prix_zones: []
                };
            }
            groups[key].prix_zones.push(tarif);
        });

        return Object.values(groups).sort((a, b) => parseFloat(a.indice) - parseFloat(b.indice));
    }, [tarifs, searchTerm, filterStatus]);



    return (
        <div className="p-4 sm:p-6 space-y-6">
            {/* Main Header - Clean and Professional */}
            <header className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                        Tarification Standard
                    </h1>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleRefresh}
                        disabled={isRefreshing}
                        className="p-3 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-all active:scale-95 disabled:opacity-50 shadow-sm"
                        title="Rafraîchir"
                    >
                        <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                    </button>
                    <button
                        onClick={handleOpenAddModal}
                        className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-sm font-bold transition-all shadow-lg shadow-slate-900/10"
                    >
                        <PlusCircle size={16} />
                        Nouvelle Grille
                    </button>
                </div>
            </header>

            {/* Barre unifiée Stats + Recherche */}
            <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center">
                <div className="grid grid-cols-2 gap-4 lg:flex lg:gap-4 shrink-0">
                    {/* Actives */}
                    <div
                        onClick={() => setFilterStatus(filterStatus === 'active' ? 'all' : 'active')}
                        className={`flex-1 lg:w-64 rounded-xl px-4 py-3 shadow-sm border transition-all cursor-pointer hover:shadow-md ${filterStatus === 'active'
                            ? 'bg-emerald-100 border-emerald-500 ring-2 ring-emerald-500/10'
                            : 'bg-emerald-50/50 border-emerald-100 hover:border-emerald-200'
                            }`}
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${filterStatus === 'active' ? 'text-emerald-800' : 'text-emerald-600/70'}`}>Grilles Actives</p>
                                <p className={`text-2xl font-black ${filterStatus === 'active' ? 'text-emerald-900' : 'text-emerald-700'}`}>
                                    {tarifs.filter(t => t.type_expedition === 'simple' && t.actif).length}
                                </p>
                            </div>
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center border transition-colors ${filterStatus === 'active' ? 'bg-emerald-500 text-white border-emerald-400' : 'bg-white text-emerald-500 border-emerald-100'
                                }`}>
                                <CheckCircle2 className="h-6 w-6" />
                            </div>
                        </div>
                    </div>

                    {/* Inactives */}
                    <div
                        onClick={() => setFilterStatus(filterStatus === 'inactive' ? 'all' : 'inactive')}
                        className={`flex-1 lg:w-64 rounded-xl px-4 py-3 shadow-sm border transition-all cursor-pointer hover:shadow-md ${filterStatus === 'inactive'
                            ? 'bg-rose-100 border-rose-500 ring-2 ring-rose-500/10'
                            : 'bg-rose-50/50 border-rose-100 hover:border-rose-200'
                            }`}
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${filterStatus === 'inactive' ? 'text-rose-800' : 'text-rose-600/70'}`}>Grilles Inactives</p>
                                <p className={`text-2xl font-black ${filterStatus === 'inactive' ? 'text-rose-900' : 'text-rose-700'}`}>
                                    {tarifs.filter(t => t.type_expedition === 'simple' && !t.actif).length}
                                </p>
                            </div>
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center border transition-colors ${filterStatus === 'inactive' ? 'bg-rose-500 text-white border-rose-400' : 'bg-white text-rose-500 border-rose-100'
                                }`}>
                                <XCircle className="h-6 w-6" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Recherche */}
                <div className="flex-1 relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-slate-300 group-focus-within:text-indigo-500 transition-colors" />
                    </div>
                    <input
                        type="text"
                        placeholder="Rechercher par indice ou pays..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full h-full min-h-[72px] pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-xl shadow-sm focus:outline-none focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900 transition-all text-sm font-bold placeholder:text-slate-300 placeholder:font-medium"
                    />
                </div>
            </div>

            {error && (
                <div className="p-4 bg-red-50 border border-red-100 rounded-lg flex items-center gap-3 text-red-700 font-bold text-xs uppercase tracking-wide">
                    <XCircle size={16} />
                    {error}
                </div>
            )}

            {isLoading && simpleTarifs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-slate-200 shadow-sm">
                    <Loader2 className="animate-spin text-indigo-600 mb-4" size={40} />
                    <p className="text-slate-500 font-medium text-sm tracking-wide uppercase">Chargement des tarifs...</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Left Column: Simplified List */}
                    <div className="lg:col-span-5 space-y-4">
                        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                            <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Grilles Disponibles</span>
                                <span className="text-[10px] font-bold text-slate-400">{simpleTarifs.length} total</span>
                            </div>

                            {simpleTarifs.length === 0 ? (
                                <div className="p-12 text-center">
                                    <ListOrdered size={32} className="text-slate-200 mx-auto mb-3" />
                                    <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">Aucun tarif configuré</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-slate-100 max-h-[calc(100vh-280px)] overflow-y-auto custom-scrollbar">
                                    {simpleTarifs.map((tarif) => {
                                        const isSelected = selectedTarif?.indice === tarif.indice && selectedTarif?.pays === tarif.pays;
                                        return (
                                            <div
                                                key={`${tarif.indice}-${tarif.pays}`}
                                                onClick={() => setSelectedTarif(tarif)}
                                                className={`group relative flex items-center justify-between p-4 cursor-pointer transition-all hover:bg-slate-50 ${isSelected ? 'bg-slate-50 ring-1 ring-inset ring-slate-900/5' : ''}`}
                                            >
                                                {/* Selection Marker */}
                                                {isSelected && <div className="absolute left-0 top-0 bottom-0 w-1 bg-slate-900" />}

                                                <div className="flex items-center gap-4">
                                                    <div className={`w-8 h-8 rounded flex items-center justify-center font-bold text-xs ${isSelected ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500'}`}>
                                                        {tarif.indice}
                                                    </div>
                                                    <div>
                                                        <p className={`text-sm font-bold ${isSelected ? 'text-slate-900' : 'text-slate-700'}`}>
                                                            Configuration {tarif.indice}
                                                        </p>
                                                        <p className="text-[11px] text-slate-400 font-medium uppercase tracking-tight">{tarif.pays}</p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-3">
                                                    {/* Actions hidden until hover, except on mobile where they are always visible or handled differently */}
                                                    <div className="hidden group-hover:flex items-center gap-1">
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleOpenEditModal(tarif); }}
                                                            className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-white rounded border border-transparent hover:border-slate-200 transition-all"
                                                        >
                                                            <Edit3 size={14} />
                                                        </button>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleOpenDeleteModal(tarif); }}
                                                            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded border border-transparent hover:border-red-100 transition-all"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>

                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleStatusChange(tarif); }}
                                                        className={`w-2 h-2 rounded-full ${tarif.actif ? 'bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.4)]' : 'bg-slate-300'}`}
                                                        title={tarif.actif ? 'Actif' : 'Inactif'}
                                                    />

                                                    <ChevronRight size={16} className={`transition-transform duration-200 ${isSelected ? 'text-slate-900 translate-x-1' : 'text-slate-300'}`} />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                        {/* Professional Micro-copy */}
                        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex gap-3">
                            <Info size={16} className="text-slate-400 shrink-0 mt-0.5" />
                            <p className="text-[11px] leading-relaxed text-slate-500 font-medium">
                                Les grilles tarifaires standard s'appliquent automatiquement aux expéditions de type "Simple". Les tarifs sont calculés sur une base fixe par zone, à laquelle s'ajoute une commission de prestation.
                            </p>
                        </div>
                    </div>

                    {/* Right Column: Refined Detail Panel */}
                    <div className="lg:col-span-7">
                        <div className="sticky top-6">
                            {selectedTarif ? (
                                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                                    {/* Compact Detail Header */}
                                    <div className="px-6 py-4 border-b border-slate-100 bg-white flex justify-between items-center">
                                        <div className="flex items-center gap-3">
                                            <div className="p-1.5 bg-slate-100 rounded text-slate-600">
                                                <Layers size={16} />
                                            </div>
                                            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-widest">Détails de la Grille #{selectedTarif.indice}</h2>
                                        </div>
                                        <button
                                            onClick={() => handleOpenEditModal(selectedTarif)}
                                            className="text-[10px] font-bold text-slate-500 hover:text-slate-900 uppercase tracking-widest flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-colors"
                                        >
                                            <Edit3 size={12} /> Modifier la grille
                                        </button>
                                    </div>

                                    <div className="p-6 space-y-8 overflow-y-auto max-h-[calc(100vh-250px)] custom-scrollbar">
                                        {/* Key Info Cards */}
                                        <div className="grid grid-cols-3 gap-4">
                                            <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Zones</p>
                                                <p className="text-lg font-bold text-slate-900">{selectedTarif.prix_zones.length}</p>
                                            </div>
                                            <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Pays cible</p>
                                                <p className="text-sm font-bold text-slate-900 truncate">{selectedTarif.pays}</p>
                                            </div>
                                            <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Statut</p>
                                                <span className={`text-[10px] font-bold uppercase tracking-tight py-0.5 px-2 rounded-full border ${selectedTarif.actif ? 'bg-green-50 border-green-100 text-green-600' : 'bg-slate-100 border-slate-200 text-slate-400'}`}>
                                                    {selectedTarif.actif ? 'Opérationnel' : 'Désactivé'}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Detailed Grids Section */}
                                        <section className="space-y-4">
                                            <div className="flex items-center gap-4">
                                                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">Ventilation par zone</h3>
                                                <div className="h-px bg-slate-100 w-full" />
                                            </div>

                                            <div className="space-y-3">
                                                {selectedTarif.prix_zones.map((pz, index) => {
                                                    const zone = zones.find((z) => z.id === pz.zone_destination_id);
                                                    return (
                                                        <div key={index} className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-lg hover:border-slate-200 transition-colors">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center border border-slate-100 text-slate-400">
                                                                    <MapPin size={14} />
                                                                </div>
                                                                <div>
                                                                    <p className="text-sm font-bold text-slate-800">{zone?.nom || `Zone ${pz.zone_destination_id}`}</p>
                                                                    <p className="text-[10px] font-medium text-slate-400 italic">Prestation de {pz.pourcentage_prestation}% incluse</p>
                                                                </div>
                                                            </div>
                                                            <div className="text-right">
                                                                <p className="text-sm font-bold text-slate-900">{pz.montant_expedition.toLocaleString()} FCFA</p>
                                                                <div className="flex items-center justify-end gap-2 mt-0.5">
                                                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Base: {pz.montant_base.toLocaleString()}</span>
                                                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">+</span>
                                                                    <span className="text-[9px] font-bold text-indigo-500 uppercase tracking-tighter">{pz.montant_prestation.toLocaleString()}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </section>

                                        {/* Secondary Action: Delete */}
                                        <div className="pt-6 border-t border-slate-50 flex justify-end">
                                            <button
                                                onClick={() => handleOpenDeleteModal(selectedTarif)}
                                                className="text-[9px] font-bold text-slate-300 hover:text-red-500 uppercase tracking-widest transition-colors flex items-center gap-1.5"
                                            >
                                                <Trash2 size={10} /> Supprimer cette grille tarifaire
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-white rounded-xl border border-dashed border-slate-200 p-16 text-center shadow-sm">
                                    <div className="w-12 h-12 bg-slate-50 rounded-lg flex items-center justify-center mx-auto mb-6 border border-slate-100">
                                        <ArrowRight size={24} className="text-slate-300" />
                                    </div>
                                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest">Gestion des Tarifs</h3>
                                    <p className="text-xs text-slate-400 mt-2 max-w-[240px] mx-auto leading-relaxed">
                                        Sélectionnez une grille tarifaire dans la liste de gauche pour consulter ou modifier la répartition des prix par zone.
                                    </p>
                                    <div className="mt-8 pt-8 border-t border-slate-50">
                                        <p className="text-[10px] font-bold text-slate-300 uppercase tracking-tighter italic">"La précision des tarifs garantit la transparence client"</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Modals - Unified with standard design */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Configuration Grille Tarifaire"
                size="4xl"
            >
                <div className="p-4">
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
                    title={`Édition Grille #${selectedTarif.indice}`}
                    size="4xl"
                >
                    <div className="p-4">
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

            {/* Modal de suppression - Enterprise Clean */}
            <Modal
                isOpen={isDeleteModalOpen}
                onClose={() => !isDeleting && setIsDeleteModalOpen(false)}
                title="Validation de suppression"
                size="md"
            >
                <div className="p-6 flex flex-col items-center">
                    <div className="w-14 h-14 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-5 border border-red-100">
                        <Trash2 size={24} />
                    </div>
                    <h4 className="text-lg font-bold text-slate-900 mb-2">Retirer cette tarification ?</h4>
                    <p className="text-slate-500 text-sm text-center mb-8 px-4 leading-relaxed">
                        Vous êtes sur le point de supprimer définitivement la grille <span className="font-bold text-slate-900">#{tarifToDelete?.indice}</span>. Cette opération impactera les calculs de prix futurs.
                    </p>
                    <div className="grid grid-cols-2 gap-3 w-full">
                        <button
                            onClick={() => setIsDeleteModalOpen(false)}
                            disabled={isDeleting}
                            className="px-4 py-2.5 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-slate-200 transition-colors"
                        >
                            Annuler
                        </button>
                        <button
                            onClick={handleDeleteTarif}
                            disabled={isDeleting}
                            className="px-4 py-2.5 bg-red-600 text-white rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-red-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-600/10"
                        >
                            {isDeleting ? <Loader2 size={14} className="animate-spin" /> : "Supprimer"}
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

export default SimpleRates;