import React, { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
    fetchEnlevementCommuneTarifs,
    addEnlevementCommuneTarif,
    editEnlevementCommuneTarif,
    deleteEnlevementCommuneTarif,
    updateEnlevementCommuneTarifStatus,
} from "../redux/slices/tarificationSlice";
import { fetchCommunes } from "../redux/slices/communeSlice";

import Modal from "../components/common/Modal";
import DeleteModal from "../components/common/DeleteModal";
import TarifEnlevementCommuneForm from "../components/common/TarifEnlevementCommuneForm";
import RowActions from "../components/common/RowActions";
import useHasPermission from "../hooks/useHasPermission";
import {
    MapPin,
    PackageCheck,
    Search,
    RefreshCw,
    PlusCircle,
    ListOrdered,
    Edit3,
    Trash2,
    Loader2,
} from "lucide-react";
import { showNotification } from '../redux/slices/uiSlice';

const TarifsEnlevementRates = () => {
    const dispatch = useDispatch();
    const canCreate = useHasPermission('tarification_enlevement_commune.create');
    const canEdit = useHasPermission('tarification_enlevement_commune.edit');
    const canDelete = useHasPermission('tarification_enlevement_commune.delete');
    const canToggleStatus = useHasPermission('tarification_enlevement_commune.toggle_status');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const { enlevementCommuneTarifs: tarifs, isLoadingEnlevementCommune: isLoading, enlevementCommuneHasLoaded: hasLoadedTarifs } = useSelector((state) => state.tarification);
    const { communes, hasLoaded: hasLoadedCommunes, isLoading: isLoadingCommunes } = useSelector((state) => state.communes);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedTarif, setSelectedTarif] = useState(null);
    const [isEditingModalOpen, setIsEditingModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);
    const [tarifToDelete, setTarifToDelete] = useState(null);
    const [updatingStatus, setUpdatingStatus] = useState({});

    useEffect(() => {
        if (!hasLoadedTarifs && !isLoading) {
            dispatch(fetchEnlevementCommuneTarifs());
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
            await dispatch(fetchEnlevementCommuneTarifs({ silent: true })).unwrap();
            dispatch(showNotification({ type: 'success', message: 'Tarifs mis à jour.' }));
        } catch (error) {
            dispatch(showNotification({ type: 'error', message: 'Erreur lors du rafraîchissement.' }));
        } finally {
            setIsRefreshing(false);
        }
    };

    const handleAddTarif = async (tarifData) => {
        setIsSubmitting(true);
        try {
            await dispatch(addEnlevementCommuneTarif(tarifData)).unwrap();
            setIsModalOpen(false);
            dispatch(showNotification({ type: 'success', message: 'Tarif d\'enlèvement ajouté avec succès.' }));
            dispatch(fetchEnlevementCommuneTarifs({ silent: true }));
        } catch (error) {
            dispatch(showNotification({ type: 'error', message: error.message || "Erreur lors de l'ajout du tarif." }));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEditTarif = async (tarifData) => {
        setIsSubmitting(true);
        try {
            const { id, montant } = tarifData;
            if (id) {
                await dispatch(editEnlevementCommuneTarif({ tarifId: id, tarifData: { montant } })).unwrap();
            }
            setIsEditingModalOpen(false);
            setSelectedTarif(null);
            dispatch(showNotification({ type: 'success', message: 'Tarif mis à jour.' }));
            dispatch(fetchEnlevementCommuneTarifs({ silent: true }));
        } catch (error) {
            dispatch(showNotification({ type: 'error', message: error.message || 'Erreur lors de la modification.' }));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteTarif = async () => {
        if (!tarifToDelete) return;
        setIsDeleting(true);
        try {
            await dispatch(deleteEnlevementCommuneTarif(tarifToDelete.id)).unwrap();
            setIsDeleteModalOpen(false);
            setTarifToDelete(null);
            dispatch(showNotification({ type: 'success', message: 'Tarif supprimé avec succès.' }));
            dispatch(fetchEnlevementCommuneTarifs({ silent: true }));
        } catch (error) {
            dispatch(showNotification({ type: 'error', message: 'Erreur lors de la suppression.' }));
        } finally {
            setIsDeleting(false);
        }
    };

    const handleStatusChange = async (tarif) => {
        try {
            setUpdatingStatus(prev => ({ ...prev, [tarif.id]: true }));
            await dispatch(updateEnlevementCommuneTarifStatus(tarif.id)).unwrap();
        } catch (error) {
            dispatch(showNotification({ type: 'error', message: 'Erreur lors du changement de statut.' }));
        } finally {
            setUpdatingStatus(prev => ({ ...prev, [tarif.id]: false }));
        }
    };

    const filteredTarifs = useMemo(() => {
        if (!Array.isArray(tarifs)) return [];
        return tarifs.filter(tarif => (tarif.commune?.nom || '').toLowerCase().includes(searchTerm.toLowerCase()));
    }, [tarifs, searchTerm]);

    return (
        <div className="space-y-4 pb-6 md:space-y-6 md:pb-12">
            <div className="sticky top-[-24px] md:top-[-32px] z-30 bg-[#f1f5f9] -mx-6 px-6 py-3 md:-mx-8 md:px-8 space-y-4 pt-4 lg:pt-2 pb-3">
                <header className="space-y-3 md:space-y-0 text-black">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">Enlèvement à domicile</h1>
                            <p className="text-sm md:text-base text-slate-500 mt-0.5 font-medium">
                                Tarif fixe par commune pour l'enlèvement chez l'expéditeur
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
                                    onClick={() => { setSelectedTarif(null); setIsModalOpen(true); }}
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
                        placeholder="Rechercher une commune..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 md:pl-12 pr-3 md:pr-4 py-2.5 md:py-3 bg-white border border-slate-200 rounded-lg shadow-sm focus:outline-none focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900 transition-all text-sm placeholder:text-slate-400 text-black font-medium"
                    />
                </div>
            </div>

            <div className="bg-white rounded-lg md:rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                {isLoading && filteredTarifs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 px-6">
                        <Loader2 className="h-10 w-10 text-slate-900 animate-spin mb-3" />
                        <p className="text-slate-500 text-sm font-medium">Chargement des tarifs...</p>
                    </div>
                ) : filteredTarifs.length === 0 ? (
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
                                        <th className="px-6 py-3 text-left font-bold text-slate-500 uppercase tracking-wider text-xs">Commune</th>
                                        <th className="px-6 py-3 text-left font-bold text-slate-500 uppercase tracking-wider text-xs">Montant</th>
                                        <th className="px-6 py-3 text-center font-bold text-slate-500 uppercase tracking-wider text-xs">Statut</th>
                                        <th className="px-6 py-3 text-right font-bold text-slate-500 uppercase tracking-wider text-xs">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200">
                                    {filteredTarifs.map((tarif) => (
                                        <tr key={tarif.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 py-3">
                                                <div className="flex items-center gap-2">
                                                    <MapPin size={14} className="text-slate-400" />
                                                    <p className="font-semibold text-slate-900">{tarif.commune?.nom || '?'}</p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-3">
                                                <p className="font-bold text-slate-900">{(parseFloat(tarif.montant) || 0).toLocaleString()} <span className="text-xs">FCFA</span></p>
                                            </td>
                                            <td className="px-6 py-3 text-center">
                                                {canToggleStatus ? (
                                                    <button
                                                        onClick={() => handleStatusChange(tarif)}
                                                        disabled={updatingStatus[tarif.id]}
                                                        className="group relative flex items-center gap-3 transition-all active:scale-95 mx-auto disabled:opacity-50"
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
                                                        onEdit={canEdit ? () => { setSelectedTarif(tarif); setIsEditingModalOpen(true); } : undefined}
                                                        onDelete={canDelete ? () => { setTarifToDelete(tarif); setIsDeleteModalOpen(true); } : undefined}
                                                    />
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="md:hidden divide-y divide-slate-200">
                            {filteredTarifs.map((tarif) => (
                                <div key={tarif.id} className="p-3 space-y-2.5 active:bg-slate-50 transition-colors">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex items-center gap-2.5 min-w-0">
                                            <PackageCheck size={16} className="text-slate-400 shrink-0" />
                                            <div className="min-w-0">
                                                <p className="font-semibold text-slate-900 text-sm truncate">{tarif.commune?.nom || '?'}</p>
                                                <p className="text-xs text-slate-500 font-bold uppercase">
                                                    {(parseFloat(tarif.montant) || 0).toLocaleString()} FCFA
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

                                    {(canEdit || canDelete) && (
                                        <div className="flex gap-2">
                                            {canEdit && (
                                                <button
                                                    onClick={() => { setSelectedTarif(tarif); setIsEditingModalOpen(true); }}
                                                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-50 active:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-medium transition-all active:scale-95"
                                                >
                                                    <Edit3 size={13} />
                                                    Modifier
                                                </button>
                                            )}
                                            {canDelete && (
                                                <button
                                                    onClick={() => { setTarifToDelete(tarif); setIsDeleteModalOpen(true); }}
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
                title="Nouveau Tarif d'Enlèvement"
                subtitle="Montant fixe pour l'enlèvement à domicile dans cette commune"
                size="lg"
                confirmFormId="add-enlevement-commune-form"
                isLoading={isSubmitting}
                confirmLabel="Enregistrer"
            >
                <TarifEnlevementCommuneForm id="add-enlevement-commune-form" onSubmit={handleAddTarif} communes={communes || []} />
            </Modal>

            <Modal
                isOpen={isEditingModalOpen}
                onClose={() => setIsEditingModalOpen(false)}
                title="Modifier le Tarif d'Enlèvement"
                subtitle={`Commune : ${selectedTarif?.commune?.nom || '?'}`}
                size="lg"
                confirmFormId="edit-enlevement-commune-form"
                isLoading={isSubmitting}
                confirmLabel="Mettre à jour"
            >
                {selectedTarif && (
                    <TarifEnlevementCommuneForm id="edit-enlevement-commune-form" initialData={selectedTarif} onSubmit={handleEditTarif} communes={communes || []} />
                )}
            </Modal>

            <DeleteModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDeleteTarif}
                itemName={tarifToDelete?.commune?.nom}
                isLoading={isDeleting}
            />
        </div>
    );
};

export default TarifsEnlevementRates;
