import React, { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
    fetchEnlevementTranchesKm,
    addEnlevementTrancheKm,
    editEnlevementTrancheKm,
    deleteEnlevementTrancheKm,
    updateEnlevementTrancheKmStatus,
} from "../redux/slices/tarificationSlice";
import { fetchCommunes } from "../redux/slices/communeSlice";

import Modal from "../components/common/Modal";
import DeleteModal from "../components/common/DeleteModal";
import TarifEnlevementTrancheKmForm from "../components/common/TarifEnlevementTrancheKmForm";
import RowActions from "../components/common/RowActions";
import useHasPermission from "../hooks/useHasPermission";
import {
    MapPin,
    Ruler,
    Search,
    RefreshCw,
    PlusCircle,
    ListOrdered,
    Edit3,
    Trash2,
    Loader2,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";
import { showNotification } from '../redux/slices/uiSlice';

const TarifsEnlevementRates = () => {
    const dispatch = useDispatch();
    const canCreate = useHasPermission('tarification_enlevement_km.create');
    const canEdit = useHasPermission('tarification_enlevement_km.edit');
    const canDelete = useHasPermission('tarification_enlevement_km.delete');
    const canToggleStatus = useHasPermission('tarification_enlevement_km.toggle_status');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const { enlevementTranchesKm: tranches, isLoadingEnlevementTranchesKm: isLoading, enlevementTranchesKmHasLoaded: hasLoadedTranches } = useSelector((state) => state.tarification);
    const { communes, hasLoaded: hasLoadedCommunes, isLoading: isLoadingCommunes } = useSelector((state) => state.communes);

    const [selectedCommuneId, setSelectedCommuneId] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedTranche, setSelectedTranche] = useState(null);
    const [isEditingModalOpen, setIsEditingModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);
    const [trancheToDelete, setTrancheToDelete] = useState(null);
    const [updatingStatus, setUpdatingStatus] = useState({});

    useEffect(() => {
        if (!hasLoadedTranches && !isLoading) {
            dispatch(fetchEnlevementTranchesKm());
        }
    }, [dispatch, hasLoadedTranches, isLoading]);

    useEffect(() => {
        if (!hasLoadedCommunes && !isLoadingCommunes) {
            dispatch(fetchCommunes());
        }
    }, [dispatch, hasLoadedCommunes, isLoadingCommunes]);

    const handleRefresh = async () => {
        setIsRefreshing(true);
        try {
            await dispatch(fetchEnlevementTranchesKm({ silent: true })).unwrap();
            dispatch(showNotification({ type: 'success', message: 'Grilles mises à jour.' }));
        } catch (error) {
            dispatch(showNotification({ type: 'error', message: 'Erreur lors du rafraîchissement.' }));
        } finally {
            setIsRefreshing(false);
        }
    };

    const handleAddTranche = async (trancheData) => {
        setIsSubmitting(true);
        try {
            await dispatch(addEnlevementTrancheKm(trancheData)).unwrap();
            setIsModalOpen(false);
            dispatch(showNotification({ type: 'success', message: 'Tranche ajoutée avec succès.' }));
        } catch (error) {
            dispatch(showNotification({ type: 'error', message: error.message || "Erreur lors de l'ajout de la tranche." }));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEditTranche = async (trancheData) => {
        setIsSubmitting(true);
        try {
            const { id, ...rest } = trancheData;
            if (id) {
                await dispatch(editEnlevementTrancheKm({ trancheId: id, trancheData: rest })).unwrap();
            }
            setIsEditingModalOpen(false);
            setSelectedTranche(null);
            dispatch(showNotification({ type: 'success', message: 'Tranche mise à jour.' }));
        } catch (error) {
            dispatch(showNotification({ type: 'error', message: error.message || 'Erreur lors de la modification.' }));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteTranche = async () => {
        if (!trancheToDelete) return;
        setIsDeleting(true);
        try {
            await dispatch(deleteEnlevementTrancheKm(trancheToDelete.id)).unwrap();
            setTrancheToDelete(null);
            dispatch(showNotification({ type: 'success', message: 'Tranche supprimée avec succès.' }));
        } catch (error) {
            dispatch(showNotification({ type: 'error', message: 'Erreur lors de la suppression.' }));
        } finally {
            setIsDeleting(false);
        }
    };

    const handleStatusChange = async (tranche) => {
        try {
            setUpdatingStatus(prev => ({ ...prev, [tranche.id]: true }));
            await dispatch(updateEnlevementTrancheKmStatus(tranche.id)).unwrap();
        } catch (error) {
            dispatch(showNotification({ type: 'error', message: 'Erreur lors du changement de statut.' }));
        } finally {
            setUpdatingStatus(prev => ({ ...prev, [tranche.id]: false }));
        }
    };

    const tranchesParCommune = useMemo(() => {
        const map = new Map();
        (tranches || []).forEach(t => {
            const key = t.commune_id || t.commune?.id;
            if (!map.has(key)) map.set(key, []);
            map.get(key).push(t);
        });
        return map;
    }, [tranches]);

    const communesFiltrees = useMemo(() => {
        if (!Array.isArray(communes)) return [];
        return communes.filter(c => (c.nom || '').toLowerCase().includes(searchTerm.toLowerCase()));
    }, [communes, searchTerm]);

    const communeSelectionnee = communes.find(c => String(c.id) === String(selectedCommuneId));
    const trancheSelectionnees = (tranchesParCommune.get(selectedCommuneId) || [])
        .slice()
        .sort((a, b) => (parseFloat(a.km_min) || 0) - (parseFloat(b.km_min) || 0));

    const formatKmMax = (kmMax) => kmMax == null ? 'et plus' : `${kmMax} km`;

    // ------------------- Vue détail : grille de tranches d'une commune -------------------
    if (selectedCommuneId) {
        return (
            <div className="space-y-4 pb-6 md:space-y-6 md:pb-12">
                <div className="sticky top-[-24px] md:top-[-32px] z-30 bg-[#f1f5f9] -mx-6 px-6 py-3 md:-mx-8 md:px-8 space-y-4 pt-4 lg:pt-2 pb-3">
                    <header className="space-y-3 md:space-y-0 text-black">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 min-w-0">
                                <button
                                    onClick={() => setSelectedCommuneId(null)}
                                    className="inline-flex items-center justify-center p-2.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-all shadow-sm shrink-0"
                                    title="Retour"
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </button>
                                <div className="min-w-0">
                                    <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight truncate">
                                        {communeSelectionnee?.nom || 'Commune'}
                                    </h1>
                                    <p className="text-sm md:text-base text-slate-500 mt-0.5 font-medium">
                                        Grille de tarifs d'enlèvement et de livraison par tranche de distance
                                    </p>
                                </div>
                            </div>

                            {canCreate && (
                                <button
                                    onClick={() => { setSelectedTranche(null); setIsModalOpen(true); }}
                                    className="flex items-center p-3 text-white text-sm font-medium bg-slate-900 hover:bg-slate-800 rounded-lg shadow-sm hover:shadow-lg transition-all shrink-0"
                                    title="Ajouter une tranche"
                                >
                                    <PlusCircle className="h-4 w-4" />
                                    <span className="hidden md:inline md:ml-2">Ajouter une tranche</span>
                                </button>
                            )}
                        </div>
                    </header>
                </div>

                <div className="bg-white rounded-lg md:rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    {trancheSelectionnees.length === 0 ? (
                        <div className="py-20 text-center px-6">
                            <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
                                <Ruler className="text-slate-400" size={32} />
                            </div>
                            <h3 className="font-bold text-slate-900 text-lg">Aucune tranche définie</h3>
                            <p className="text-slate-500 text-sm mt-2">Ajoutez une première tranche pour cette commune.</p>
                        </div>
                    ) : (
                        <>
                            <div className="hidden md:block overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-slate-50/50 border-b border-slate-200">
                                        <tr>
                                            <th className="px-6 py-3 text-left font-bold text-slate-500 uppercase tracking-wider text-xs">Distance</th>
                                            <th className="px-6 py-3 text-left font-bold text-slate-500 uppercase tracking-wider text-xs">Montant</th>
                                            <th className="px-6 py-3 text-center font-bold text-slate-500 uppercase tracking-wider text-xs">Statut</th>
                                            <th className="px-6 py-3 text-right font-bold text-slate-500 uppercase tracking-wider text-xs">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200">
                                        {trancheSelectionnees.map((tranche) => (
                                            <tr key={tranche.id} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="px-6 py-3">
                                                    <div className="flex items-center gap-2">
                                                        <Ruler size={14} className="text-slate-400" />
                                                        <p className="font-semibold text-slate-900">
                                                            {tranche.km_min} km — {formatKmMax(tranche.km_max)}
                                                        </p>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-3">
                                                    <p className="font-bold text-slate-900">{(parseFloat(tranche.montant) || 0).toLocaleString()} <span className="text-xs">FCFA</span></p>
                                                </td>
                                                <td className="px-6 py-3 text-center">
                                                    {canToggleStatus ? (
                                                        <button
                                                            onClick={() => handleStatusChange(tranche)}
                                                            disabled={updatingStatus[tranche.id]}
                                                            className="group relative flex items-center gap-3 transition-all active:scale-95 mx-auto disabled:opacity-50"
                                                        >
                                                            <div className={`relative w-10 h-5 rounded-full transition-colors duration-200 ${tranche.actif ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                                                                <div className={`absolute top-0.5 left-0.5 bg-white w-4 h-4 rounded-full shadow-sm transform transition-transform duration-200 ${tranche.actif ? 'translate-x-5' : 'translate-x-0'}`} />
                                                            </div>
                                                        </button>
                                                    ) : (
                                                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${tranche.actif ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                                                            {tranche.actif ? 'Actif' : 'Inactif'}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-3">
                                                    <div className="flex justify-end">
                                                        <RowActions
                                                            onEdit={canEdit ? () => { setSelectedTranche(tranche); setIsEditingModalOpen(true); } : undefined}
                                                            onDelete={canDelete ? () => setTrancheToDelete(tranche) : undefined}
                                                        />
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div className="md:hidden divide-y divide-slate-200">
                                {trancheSelectionnees.map((tranche) => (
                                    <div key={tranche.id} className="p-3 space-y-2.5 active:bg-slate-50 transition-colors">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex items-center gap-2.5 min-w-0">
                                                <Ruler size={16} className="text-slate-400 shrink-0" />
                                                <div className="min-w-0">
                                                    <p className="font-semibold text-slate-900 text-sm truncate">
                                                        {tranche.km_min} km — {formatKmMax(tranche.km_max)}
                                                    </p>
                                                    <p className="text-xs text-slate-500 font-bold uppercase">
                                                        {(parseFloat(tranche.montant) || 0).toLocaleString()} FCFA
                                                    </p>
                                                </div>
                                            </div>
                                            {canToggleStatus ? (
                                                <button
                                                    onClick={() => handleStatusChange(tranche)}
                                                    disabled={updatingStatus[tranche.id]}
                                                    className="flex items-center gap-2 active:scale-95 transition-all disabled:opacity-50"
                                                >
                                                    <div className={`relative w-8 h-4 rounded-full transition-colors duration-200 ${tranche.actif ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                                                        <div className={`absolute top-0.5 left-0.5 bg-white w-3 h-3 rounded-full shadow-sm transform transition-transform duration-200 ${tranche.actif ? 'translate-x-4' : 'translate-x-0'}`} />
                                                    </div>
                                                </button>
                                            ) : (
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${tranche.actif ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                                                    {tranche.actif ? 'Actif' : 'Inactif'}
                                                </span>
                                            )}
                                        </div>

                                        {(canEdit || canDelete) && (
                                            <div className="flex gap-2">
                                                {canEdit && (
                                                    <button
                                                        onClick={() => { setSelectedTranche(tranche); setIsEditingModalOpen(true); }}
                                                        className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-50 active:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-medium transition-all active:scale-95"
                                                    >
                                                        <Edit3 size={13} />
                                                        Modifier
                                                    </button>
                                                )}
                                                {canDelete && (
                                                    <button
                                                        onClick={() => setTrancheToDelete(tranche)}
                                                        className="inline-flex items-center justify-center p-2 text-red-500 active:bg-red-50 border border-red-100 rounded-lg transition-all active:scale-95"
                                                    >
                                                        <Trash2 size={15} />
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>

                <Modal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    title="Nouvelle Tranche"
                    subtitle={`Commune : ${communeSelectionnee?.nom || '?'}`}
                    size="lg"
                    confirmFormId="add-tranche-km-form"
                    isLoading={isSubmitting}
                    confirmLabel="Enregistrer"
                >
                    <TarifEnlevementTrancheKmForm id="add-tranche-km-form" onSubmit={handleAddTranche} communeId={selectedCommuneId} />
                </Modal>

                <Modal
                    isOpen={isEditingModalOpen}
                    onClose={() => setIsEditingModalOpen(false)}
                    title="Modifier la Tranche"
                    subtitle={`Commune : ${communeSelectionnee?.nom || '?'}`}
                    size="lg"
                    confirmFormId="edit-tranche-km-form"
                    isLoading={isSubmitting}
                    confirmLabel="Mettre à jour"
                >
                    {selectedTranche && (
                        <TarifEnlevementTrancheKmForm id="edit-tranche-km-form" initialData={selectedTranche} onSubmit={handleEditTranche} communeId={selectedCommuneId} />
                    )}
                </Modal>

                <DeleteModal
                    isOpen={!!trancheToDelete}
                    onClose={() => setTrancheToDelete(null)}
                    onConfirm={handleDeleteTranche}
                    itemName={trancheToDelete ? `${trancheToDelete.km_min} km — ${formatKmMax(trancheToDelete.km_max)}` : ''}
                    isLoading={isDeleting}
                />
            </div>
        );
    }

    // ------------------- Vue liste : communes ayant (ou non) une grille -------------------
    return (
        <div className="space-y-4 pb-6 md:space-y-6 md:pb-12">
            <div className="sticky top-[-24px] md:top-[-32px] z-30 bg-[#f1f5f9] -mx-6 px-6 py-3 md:-mx-8 md:px-8 space-y-4 pt-4 lg:pt-2 pb-3">
                <header className="space-y-3 md:space-y-0 text-black">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">Enlèvement & Livraison à domicile</h1>
                            <p className="text-sm md:text-base text-slate-500 mt-0.5 font-medium">
                                Grille de tarifs par tranche de distance, par commune — partagée entre enlèvement et livraison
                            </p>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleRefresh}
                                disabled={isRefreshing}
                                className="inline-flex items-center justify-center p-3 text-sm font-medium rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-all disabled:opacity-50 shadow-sm"
                                title="Rafraîchir"
                            >
                                <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                                <span className="hidden md:inline md:ml-2">Rafraîchir</span>
                            </button>
                        </div>
                    </div>
                </header>

                <div className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-slate-900 transition-colors" />
                    <input
                        type="text"
                        placeholder="Rechercher une commune..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 md:pl-12 pr-3 md:pr-4 py-2.5 md:py-3 bg-white border border-slate-200 rounded-lg shadow-sm focus:outline-none focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900 transition-all text-sm placeholder:text-slate-400 text-black font-medium"
                    />
                </div>
            </div>

            <div className="bg-white rounded-lg md:rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                {(isLoading || isLoadingCommunes) && communesFiltrees.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 px-6">
                        <Loader2 className="h-10 w-10 text-slate-900 animate-spin mb-3" />
                        <p className="text-slate-500 text-sm font-medium">Chargement...</p>
                    </div>
                ) : communesFiltrees.length === 0 ? (
                    <div className="py-20 text-center px-6">
                        <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
                            <ListOrdered className="text-slate-400" size={32} />
                        </div>
                        <h3 className="font-bold text-slate-900 text-lg">Aucune commune trouvée</h3>
                        <p className="text-slate-500 text-sm mt-2">Ajustez votre recherche, ou créez des communes dans Zones et Communes.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-200">
                        {communesFiltrees.map((commune) => {
                            const nbTranches = (tranchesParCommune.get(commune.id) || []).length;
                            return (
                                <button
                                    key={commune.id}
                                    onClick={() => setSelectedCommuneId(commune.id)}
                                    className="w-full flex items-center justify-between gap-3 px-6 py-3.5 hover:bg-slate-50/50 transition-colors text-left"
                                >
                                    <div className="flex items-center gap-2.5 min-w-0">
                                        <MapPin size={16} className="text-slate-400 shrink-0" />
                                        <span className="font-semibold text-slate-900 truncate">{commune.nom}</span>
                                    </div>
                                    <div className="flex items-center gap-3 shrink-0">
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${nbTranches > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                                            {nbTranches > 0 ? `${nbTranches} tranche${nbTranches > 1 ? 's' : ''}` : 'Non configuré'}
                                        </span>
                                        <ChevronRight size={16} className="text-slate-400" />
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default TarifsEnlevementRates;
