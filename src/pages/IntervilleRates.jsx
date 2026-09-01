import React, { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
    fetchIntervilleTarifs,
    addIntervilleTarif,
    editIntervilleTarif,
    deleteIntervilleTarif,
    updateIntervilleTarifStatus,
} from "../redux/slices/tarificationSlice";
import { fetchCommunes } from "../redux/slices/communeSlice";

import Modal from "../components/common/Modal";
import DeleteModal from "../components/common/DeleteModal";
import IntervilleTarifForm from "../components/common/IntervilleTarifForm";
import RowActions from "../components/common/RowActions";
import useHasPermission from "../hooks/useHasPermission";
import {
    MapPin,
    ArrowLeftRight,
    Search,
    RefreshCw,
    PlusCircle,
    ListOrdered,
    Edit3,
    Trash2,
    Loader2,
} from "lucide-react";
import { showNotification } from '../redux/slices/uiSlice';

const IntervilleRates = () => {
    const dispatch = useDispatch();
    const canCreate = useHasPermission('tarification_interville.create');
    const canEdit = useHasPermission('tarification_interville.edit');
    const canDelete = useHasPermission('tarification_interville.delete');
    const canToggleStatus = useHasPermission('tarification_interville.toggle_status');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const { intervilleTarifs: tarifs, isLoadingInterville: isLoading, hasLoaded: hasLoadedTarifs } = useSelector((state) => state.tarification);
    const { communes, hasLoaded: hasLoadedCommunes, isLoading: isLoadingCommunes } = useSelector((state) => state.communes);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedTarif, setSelectedTarif] = useState(null);
    const [isEditingModalOpen, setIsEditingModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [isDeleting, setIsDeleting] = useState(false);
    const [tarifToDelete, setTarifToDelete] = useState(null);
    const [updatingStatus, setUpdatingStatus] = useState({});

    useEffect(() => {
        if (!hasLoadedTarifs && !isLoading) {
            dispatch(fetchIntervilleTarifs());
        }
    }, [dispatch, hasLoadedTarifs, isLoading]);

    useEffect(() => {
        if (!hasLoadedCommunes && !isLoadingCommunes) {
            dispatch(fetchCommunes());
        }
    }, [dispatch, hasLoadedCommunes, isLoadingCommunes]);

    const handleRefresh = async () => {
        setIsRefreshing(true);
        try {
            await dispatch(fetchIntervilleTarifs({ silent: true })).unwrap();
            dispatch(showNotification({ type: 'success', message: 'Tarifs mis à jour.' }));
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
            await dispatch(addIntervilleTarif(tarifData)).unwrap();
            setIsModalOpen(false);
            dispatch(showNotification({ type: 'success', message: 'Nouveau tarif interville ajouté avec succès.' }));
            dispatch(fetchIntervilleTarifs({ silent: true }));
        } catch (error) {
            dispatch(showNotification({ type: 'error', message: error.message || "Erreur lors de l'ajout du tarif." }));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEditTarif = async (tarifData) => {
        setIsSubmitting(true);
        try {
            const { id, montant_base, pourcentage_commission_depart, pourcentage_commission_arrivee } = tarifData;

            if (id) {
                await dispatch(editIntervilleTarif({
                    tarifId: id,
                    tarifData: { montant_base, pourcentage_commission_depart, pourcentage_commission_arrivee }
                })).unwrap();
            }

            setIsEditingModalOpen(false);
            setSelectedTarif(null);
            dispatch(showNotification({ type: 'success', message: 'Tarif mis à jour.' }));
            dispatch(fetchIntervilleTarifs({ silent: true }));
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
            await dispatch(deleteIntervilleTarif(tarifToDelete.id)).unwrap();
            setIsDeleteModalOpen(false);
            setTarifToDelete(null);
            dispatch(showNotification({ type: 'success', message: 'Tarif supprimé avec succès.' }));
            dispatch(fetchIntervilleTarifs({ silent: true }));
        } catch (error) {
            dispatch(showNotification({ type: 'error', message: 'Erreur lors de la suppression.' }));
        } finally {
            setIsDeleting(false);
        }
    };

    const handleStatusChange = async (tarif) => {
        try {
            setUpdatingStatus(prev => ({ ...prev, [tarif.id]: true }));
            await dispatch(updateIntervilleTarifStatus(tarif.id)).unwrap();
        } catch (error) {
            dispatch(showNotification({ type: 'error', message: 'Erreur lors du changement de statut.' }));
        } finally {
            setUpdatingStatus(prev => ({ ...prev, [tarif.id]: false }));
        }
    };

    const filteredBySearch = useMemo(() => {
        if (!Array.isArray(tarifs)) return [];
        return tarifs.filter(tarif => {
            const indice = tarif.indice?.toString() || '';
            const communeA = (tarif.commune_a?.nom || '').toLowerCase();
            const communeB = (tarif.commune_b?.nom || '').toLowerCase();
            const search = searchTerm.toLowerCase();
            return indice.includes(search) || communeA.includes(search) || communeB.includes(search);
        });
    }, [tarifs, searchTerm]);

    const intervilleTarifs = useMemo(() => {
        const filtered = filteredBySearch.filter(tarif => {
            const matchesStatus = filterStatus === 'all' ||
                (filterStatus === 'active' && tarif.actif) ||
                (filterStatus === 'inactive' && !tarif.actif);
            return matchesStatus;
        });

        return filtered.sort((a, b) => (a.indice || 0) - (b.indice || 0));
    }, [filteredBySearch, filterStatus]);

    const counts = useMemo(() => ({
        all: filteredBySearch.length,
        active: filteredBySearch.filter(t => t.actif).length,
        inactive: filteredBySearch.filter(t => !t.actif).length
    }), [filteredBySearch]);

    return (
        <div className="space-y-4 pb-6 md:space-y-6 md:pb-12">
            <div className="sticky top-[-24px] md:top-[-32px] z-30 bg-[#f1f5f9] -mx-6 px-6 py-3 md:-mx-8 md:px-8 space-y-4 pt-4 lg:pt-2 pb-3">
                <header className="space-y-3 md:space-y-0 text-black">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">Tarifs Interville</h1>
                            <p className="text-sm md:text-base text-slate-500 mt-0.5 font-medium">
                                Transport entre communes d'un même pays
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

                            {canCreate && (
                                <button
                                    onClick={handleOpenAddModal}
                                    className="flex items-center p-3 text-white text-sm font-medium bg-slate-900 hover:bg-slate-800 rounded-lg shadow-sm hover:shadow-lg transition-all"
                                    title="Ajouter"
                                >
                                    <PlusCircle className="h-4 w-4" />
                                    <span className="hidden md:inline md:ml-2">Ajouter</span>
                                </button>
                            )}
                        </div>
                    </div>
                </header>

                <div className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-slate-900 transition-colors" />
                    <input
                        type="text"
                        placeholder="Rechercher par indice ou commune..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 md:pl-12 pr-3 md:pr-4 py-2.5 md:py-3 bg-white border border-slate-200 rounded-lg shadow-sm focus:outline-none focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900 transition-all text-sm placeholder:text-slate-400 text-black font-medium"
                    />
                </div>
            </div>

            <div className="bg-white rounded-lg md:rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="border-b border-slate-200 bg-slate-50/50">
                    <div className="flex overflow-x-auto">
                        <button
                            onClick={() => setFilterStatus('all')}
                            className={`px-4 md:px-6 py-2 md:py-3 text-xs md:text-sm font-medium whitespace-nowrap transition-all ${filterStatus === 'all' ? 'text-slate-900 border-b-2 border-slate-900 bg-white' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Toutes ({counts.all})
                        </button>
                        <button
                            onClick={() => setFilterStatus('active')}
                            className={`px-4 md:px-6 py-2 md:py-3 text-xs md:text-sm font-medium whitespace-nowrap transition-all ${filterStatus === 'active' ? 'text-emerald-600 border-b-2 border-emerald-600 bg-white' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Actives ({counts.active})
                        </button>
                        <button
                            onClick={() => setFilterStatus('inactive')}
                            className={`px-4 md:px-6 py-2 md:py-3 text-xs md:text-sm font-medium whitespace-nowrap transition-all ${filterStatus === 'inactive' ? 'text-rose-600 border-b-2 border-rose-600 bg-white' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Inactives ({counts.inactive})
                        </button>
                    </div>
                </div>

                {isLoading && intervilleTarifs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 px-6">
                        <Loader2 className="h-10 w-10 text-slate-900 animate-spin mb-3" />
                        <p className="text-slate-500 text-sm font-medium">Chargement des tarifs...</p>
                    </div>
                ) : intervilleTarifs.length === 0 ? (
                    <div className="py-20 text-center px-6">
                        <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
                            <ListOrdered className="text-slate-400" size={32} />
                        </div>
                        <h3 className="font-bold text-slate-900 text-lg">Aucun tarif trouvé</h3>
                        <p className="text-slate-500 text-sm mt-2">Ajustez votre recherche ou ajoutez un nouveau tarif.</p>
                    </div>
                ) : (
                    <>
                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-slate-50/50 border-b border-slate-200">
                                    <tr>
                                        <th className="px-6 py-3 text-left font-bold text-slate-500 uppercase tracking-wider text-xs">Indice</th>
                                        <th className="px-6 py-3 text-left font-bold text-slate-500 uppercase tracking-wider text-xs">Trajet</th>
                                        <th className="px-6 py-3 text-left font-bold text-slate-500 uppercase tracking-wider text-xs">Montant Base</th>
                                        <th className="px-6 py-3 text-left font-bold text-slate-500 uppercase tracking-wider text-xs">Commission départ</th>
                                        <th className="px-6 py-3 text-left font-bold text-slate-500 uppercase tracking-wider text-xs">Commission arrivée</th>
                                        <th className="px-6 py-3 text-left font-bold text-slate-500 uppercase tracking-wider text-xs">Total</th>
                                        <th className="px-6 py-3 text-center font-bold text-slate-500 uppercase tracking-wider text-xs">Statut</th>
                                        <th className="px-6 py-3 text-right font-bold text-slate-500 uppercase tracking-wider text-xs">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200">
                                    {intervilleTarifs.map((tarif) => {
                                        const mb = parseFloat(tarif.montant_base) || 0;
                                        const mDepart = parseFloat(tarif.montant_commission_depart) || 0;
                                        const mArrivee = parseFloat(tarif.montant_commission_arrivee) || 0;
                                        const total = parseFloat(tarif.montant_expedition) || (mb + mDepart + mArrivee);

                                        return (
                                            <tr key={tarif.id} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="px-6 py-3">
                                                    <div className="inline-flex items-center justify-center px-2.5 py-1 rounded bg-blue-100 text-slate-700 font-bold text-xs border border-slate-200">
                                                        {tarif.indice}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-3">
                                                    <div className="flex items-center gap-1.5 text-slate-900 font-semibold">
                                                        <span>{tarif.commune_a?.nom || '?'}</span>
                                                        <ArrowLeftRight size={12} className="text-slate-400 shrink-0" />
                                                        <span>{tarif.commune_b?.nom || '?'}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-3">
                                                    <p className="font-medium text-slate-700">{mb.toLocaleString()} <span className="text-xs">FCFA</span></p>
                                                </td>
                                                <td className="px-6 py-3">
                                                    <div className="flex flex-row gap-2">
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded bg-orange-50 text-orange-700 border border-orange-100 font-bold w-fit">
                                                            {tarif.pourcentage_commission_depart}%
                                                        </span>
                                                        <span className="text-slate-500 font-medium mt-0.5 whitespace-nowrap">
                                                            ({mDepart.toLocaleString()} F)
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-3">
                                                    <div className="flex flex-row gap-2">
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded bg-orange-50 text-orange-700 border border-orange-100 font-bold w-fit">
                                                            {tarif.pourcentage_commission_arrivee}%
                                                        </span>
                                                        <span className="text-slate-500 font-medium mt-0.5 whitespace-nowrap">
                                                            ({mArrivee.toLocaleString()} F)
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-3">
                                                    <p className="font-bold text-slate-900">{total.toLocaleString()} <span className="text-xs">FCFA</span></p>
                                                </td>
                                                <td className="px-6 py-3 text-center">
                                                    {canToggleStatus ? (
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
                                                    ) : (
                                                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${tarif.actif ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                                                            {tarif.actif ? 'Actif' : 'Inactif'}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-3">
                                                    <div className="flex justify-end">
                                                        <RowActions
                                                            onEdit={canEdit ? () => handleOpenEditModal(tarif) : undefined}
                                                            onDelete={canDelete ? () => handleOpenDeleteModal(tarif) : undefined}
                                                        />
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        <div className="md:hidden divide-y divide-slate-200">
                            {intervilleTarifs.map((tarif) => {
                                const mb = parseFloat(tarif.montant_base) || 0;
                                const total = parseFloat(tarif.montant_expedition) || mb;

                                return (
                                    <div key={tarif.id} className="p-3 space-y-2.5 active:bg-slate-50 transition-colors">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex items-center gap-2.5 min-w-0">
                                                <div className="px-2 py-1 rounded bg-blue-100 text-slate-700 font-bold text-xs border border-slate-200 shrink-0">
                                                    {tarif.indice}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-semibold text-slate-900 text-sm truncate flex items-center gap-1">
                                                        {tarif.commune_a?.nom} <ArrowLeftRight size={10} className="text-slate-400 shrink-0" /> {tarif.commune_b?.nom}
                                                    </p>
                                                    <p className="text-xs text-slate-500 font-bold uppercase">
                                                        {total.toLocaleString()} FCFA
                                                    </p>
                                                </div>
                                            </div>
                                            {canToggleStatus ? (
                                                <button
                                                    onClick={() => handleStatusChange(tarif)}
                                                    disabled={updatingStatus[tarif.id]}
                                                    className="flex items-center gap-2 active:scale-95 transition-all disabled:opacity-50"
                                                >
                                                    <div className={`relative w-8 h-4 rounded-full transition-colors duration-200 ${tarif.actif ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                                                        <div className={`absolute top-0.5 left-0.5 bg-white w-3 h-3 rounded-full shadow-sm transform transition-transform duration-200 ${tarif.actif ? 'translate-x-4' : 'translate-x-0'}`} />
                                                    </div>
                                                </button>
                                            ) : (
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${tarif.actif ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                                                    {tarif.actif ? 'Actif' : 'Inactif'}
                                                </span>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-2 gap-2">
                                            <div className="bg-slate-50 rounded-lg p-2 flex flex-col items-center justify-center border border-slate-100">
                                                <span className="text-xs text-slate-500 font-bold">Commission départ</span>
                                                <span className="text-xs font-semibold text-orange-600">{tarif.pourcentage_commission_depart}%</span>
                                            </div>
                                            <div className="bg-slate-50 rounded-lg p-2 flex flex-col items-center justify-center border border-slate-100">
                                                <span className="text-xs text-slate-500 font-bold">Commission arrivée</span>
                                                <span className="text-xs font-semibold text-orange-600">{tarif.pourcentage_commission_arrivee}%</span>
                                            </div>
                                        </div>

                                        {(canEdit || canDelete) && (
                                            <div className="flex gap-2">
                                                {canEdit && (
                                                    <button
                                                        onClick={() => handleOpenEditModal(tarif)}
                                                        className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-50 active:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-medium transition-all active:scale-95"
                                                    >
                                                        <Edit3 size={13} />
                                                        Modifier
                                                    </button>
                                                )}
                                                {canDelete && (
                                                    <button
                                                        onClick={() => handleOpenDeleteModal(tarif)}
                                                        className="inline-flex items-center justify-center p-2 text-red-500 active:bg-red-50 border border-red-100 rounded-lg transition-all active:scale-95"
                                                    >
                                                        <Trash2 size={15} />
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </>
                )}
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Nouveau Tarif Interville"
                subtitle="Définissez l'indice, le trajet et les commissions"
                size="xl"
                confirmFormId="add-interville-form"
                isLoading={isSubmitting}
                confirmLabel="Enregistrer"
            >
                <IntervilleTarifForm
                    id="add-interville-form"
                    onSubmit={handleAddTarif}
                    communes={communes || []}
                />
            </Modal>

            <Modal
                isOpen={isEditingModalOpen}
                onClose={() => setIsEditingModalOpen(false)}
                title="Modifier Tarif Interville"
                subtitle={`Mise à jour de la grille pour l'indice #${selectedTarif?.indice}`}
                size="xl"
                confirmFormId="edit-interville-form"
                isLoading={isSubmitting}
                confirmLabel="Mettre à jour"
            >
                {selectedTarif && (
                    <IntervilleTarifForm
                        id="edit-interville-form"
                        initialData={selectedTarif}
                        onSubmit={handleEditTarif}
                        communes={communes || []}
                    />
                )}
            </Modal>

            <DeleteModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDeleteTarif}
                itemName={`${tarifToDelete?.indice} - ${tarifToDelete?.commune_a?.nom || '?'} / ${tarifToDelete?.commune_b?.nom || '?'}`}
                isLoading={isDeleting}
            />
        </div>
    );
};

export default IntervilleRates;
