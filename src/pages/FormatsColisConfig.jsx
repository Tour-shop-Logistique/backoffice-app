import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
    fetchFormatsColis,
    addFormatColis,
    editFormatColis,
    deleteFormatColis,
} from "../redux/slices/tarificationSlice";

import Modal from "../components/common/Modal";
import DeleteModal from "../components/common/DeleteModal";
import FormatColisForm from "../components/common/FormatColisForm";
import RowActions from "../components/common/RowActions";
import useHasPermission from "../hooks/useHasPermission";
import {
    Package,
    RefreshCw,
    PlusCircle,
    Edit3,
    Trash2,
    Loader2,
    Star,
} from "lucide-react";
import { showNotification } from '../redux/slices/uiSlice';

/**
 * Configuration des formats de colis (Petit/Moyen/Grand par défaut,
 * extensible) et de leurs seuils poids/volume, qui servent à déduire
 * automatiquement le format d'un colis - voir ExpeditionTarificationService::
 * determinerFormatColis(). Contrairement aux autres grilles tarifaires, il
 * n'y a pas de vue liste/détail à deux niveaux : les formats d'un backoffice
 * sont toujours peu nombreux (3 par défaut), affichés à plat.
 */
const FormatsColisConfig = () => {
    const dispatch = useDispatch();
    const canCreate = useHasPermission('formats_colis.create');
    const canEdit = useHasPermission('formats_colis.edit');
    const canDelete = useHasPermission('formats_colis.delete');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const { formatsColis, isLoadingFormatsColis: isLoading, formatsColisHasLoaded: hasLoaded } = useSelector((state) => state.tarification);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedFormat, setSelectedFormat] = useState(null);
    const [isEditingModalOpen, setIsEditingModalOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [formatToDelete, setFormatToDelete] = useState(null);

    useEffect(() => {
        if (!hasLoaded && !isLoading) {
            dispatch(fetchFormatsColis());
        }
    }, [dispatch, hasLoaded, isLoading]);

    const handleRefresh = async () => {
        setIsRefreshing(true);
        try {
            await dispatch(fetchFormatsColis({ silent: true })).unwrap();
            dispatch(showNotification({ type: 'success', message: 'Formats mis à jour.' }));
        } catch (error) {
            dispatch(showNotification({ type: 'error', message: 'Erreur lors du rafraîchissement.' }));
        } finally {
            setIsRefreshing(false);
        }
    };

    const handleAddFormat = async (formatData) => {
        setIsSubmitting(true);
        try {
            await dispatch(addFormatColis(formatData)).unwrap();
            setIsModalOpen(false);
            dispatch(showNotification({ type: 'success', message: 'Format ajouté avec succès.' }));
        } catch (error) {
            dispatch(showNotification({ type: 'error', message: error.message || "Erreur lors de l'ajout du format." }));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEditFormat = async (formatData) => {
        setIsSubmitting(true);
        try {
            const { id, ...rest } = formatData;
            if (id) {
                await dispatch(editFormatColis({ formatId: id, formatData: rest })).unwrap();
            }
            setIsEditingModalOpen(false);
            setSelectedFormat(null);
            dispatch(showNotification({ type: 'success', message: 'Format mis à jour.' }));
        } catch (error) {
            dispatch(showNotification({ type: 'error', message: error.message || 'Erreur lors de la modification.' }));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteFormat = async () => {
        if (!formatToDelete) return;
        setIsDeleting(true);
        try {
            await dispatch(deleteFormatColis(formatToDelete.id)).unwrap();
            setFormatToDelete(null);
            dispatch(showNotification({ type: 'success', message: 'Format supprimé avec succès.' }));
        } catch (error) {
            dispatch(showNotification({ type: 'error', message: error.response?.data?.message || 'Erreur lors de la suppression.' }));
        } finally {
            setIsDeleting(false);
        }
    };

    const formatsTries = [...(formatsColis || [])].sort((a, b) => a.ordre - b.ordre);
    const formatSeuil = (valeur, unite) => valeur == null ? 'Illimité' : `${Number(valeur).toLocaleString()} ${unite}`;
    const formatDimensions = (format) => {
        if (format.longueur_max == null && format.largeur_max == null && format.hauteur_max == null) return 'Illimité';
        const dim = (v) => v == null ? '—' : Number(v).toLocaleString();
        return `${dim(format.longueur_max)} x ${dim(format.largeur_max)} x ${dim(format.hauteur_max)} cm`;
    };

    return (
        <div className="space-y-4 pb-6 md:space-y-6 md:pb-12">
            <div className="flex items-center justify-between gap-3">
                <div>
                    <h2 className="text-lg font-bold text-slate-900">Formats de colis</h2>
                    <p className="text-sm text-slate-500 mt-0.5">
                        Seuils de poids et volume qui déterminent automatiquement le format d'un colis
                    </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
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
                            onClick={() => { setSelectedFormat(null); setIsModalOpen(true); }}
                            className="flex items-center p-3 text-white text-sm font-medium bg-slate-900 hover:bg-slate-800 rounded-lg shadow-sm hover:shadow-lg transition-all"
                            title="Ajouter un format"
                        >
                            <PlusCircle className="h-4 w-4" />
                            <span className="hidden md:inline md:ml-2">Ajouter un format</span>
                        </button>
                    )}
                </div>
            </div>

            <div className="bg-white rounded-lg md:rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                {isLoading && formatsTries.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 px-6">
                        <Loader2 className="h-10 w-10 text-slate-900 animate-spin mb-3" />
                        <p className="text-slate-500 text-sm font-medium">Chargement...</p>
                    </div>
                ) : formatsTries.length === 0 ? (
                    <div className="py-20 text-center px-6">
                        <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
                            <Package className="text-slate-400" size={32} />
                        </div>
                        <h3 className="font-bold text-slate-900 text-lg">Aucun format défini</h3>
                        <p className="text-slate-500 text-sm mt-2">Ajoutez un premier format pour votre backoffice.</p>
                    </div>
                ) : (
                    <>
                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-slate-50/50 border-b border-slate-200">
                                    <tr>
                                        <th className="px-6 py-3 text-left font-bold text-slate-500 uppercase tracking-wider text-xs">Ordre</th>
                                        <th className="px-6 py-3 text-left font-bold text-slate-500 uppercase tracking-wider text-xs">Nom</th>
                                        <th className="px-6 py-3 text-left font-bold text-slate-500 uppercase tracking-wider text-xs">Poids max</th>
                                        <th className="px-6 py-3 text-left font-bold text-slate-500 uppercase tracking-wider text-xs">Dimensions max (L x l x H)</th>
                                        <th className="px-6 py-3 text-center font-bold text-slate-500 uppercase tracking-wider text-xs">Par défaut</th>
                                        <th className="px-6 py-3 text-right font-bold text-slate-500 uppercase tracking-wider text-xs">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200">
                                    {formatsTries.map((format) => (
                                        <tr key={format.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 py-3">
                                                <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-slate-100 text-slate-700 font-bold text-xs">
                                                    {format.ordre}
                                                </span>
                                            </td>
                                            <td className="px-6 py-3">
                                                <p className="font-semibold text-slate-900">{format.nom}</p>
                                            </td>
                                            <td className="px-6 py-3 text-slate-700">{formatSeuil(format.poids_max, 'kg')}</td>
                                            <td className="px-6 py-3 text-slate-700">{formatDimensions(format)}</td>
                                            <td className="px-6 py-3 text-center">
                                                {format.is_default && (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-100">
                                                        <Star size={12} className="fill-amber-500 text-amber-500" />
                                                        Défaut
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-3">
                                                <div className="flex justify-end">
                                                    <RowActions
                                                        onEdit={canEdit ? () => { setSelectedFormat(format); setIsEditingModalOpen(true); } : undefined}
                                                        onDelete={canDelete ? () => setFormatToDelete(format) : undefined}
                                                    />
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="md:hidden divide-y divide-slate-200">
                            {formatsTries.map((format) => (
                                <div key={format.id} className="p-3 space-y-2.5 active:bg-slate-50 transition-colors">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex items-center gap-2.5 min-w-0">
                                            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-slate-100 text-slate-700 font-bold text-xs shrink-0">
                                                {format.ordre}
                                            </span>
                                            <div className="min-w-0">
                                                <p className="font-semibold text-slate-900 text-sm truncate flex items-center gap-1.5">
                                                    {format.nom}
                                                    {format.is_default && <Star size={13} className="fill-amber-500 text-amber-500 shrink-0" />}
                                                </p>
                                                <p className="text-xs text-slate-500">
                                                    {formatSeuil(format.poids_max, 'kg')} · {formatDimensions(format)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {(canEdit || canDelete) && (
                                        <div className="flex gap-2">
                                            {canEdit && (
                                                <button
                                                    onClick={() => { setSelectedFormat(format); setIsEditingModalOpen(true); }}
                                                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-50 active:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-medium transition-all active:scale-95"
                                                >
                                                    <Edit3 size={13} />
                                                    Modifier
                                                </button>
                                            )}
                                            {canDelete && (
                                                <button
                                                    onClick={() => setFormatToDelete(format)}
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
                title="Nouveau Format de Colis"
                subtitle="Définissez ses seuils de poids et de volume"
                size="lg"
                confirmFormId="add-format-colis-form"
                isLoading={isSubmitting}
                confirmLabel="Enregistrer"
            >
                <FormatColisForm id="add-format-colis-form" onSubmit={handleAddFormat} />
            </Modal>

            <Modal
                isOpen={isEditingModalOpen}
                onClose={() => setIsEditingModalOpen(false)}
                title="Modifier le Format"
                subtitle={selectedFormat?.nom}
                size="lg"
                confirmFormId="edit-format-colis-form"
                isLoading={isSubmitting}
                confirmLabel="Mettre à jour"
            >
                {selectedFormat && (
                    <FormatColisForm id="edit-format-colis-form" initialData={selectedFormat} onSubmit={handleEditFormat} />
                )}
            </Modal>

            <DeleteModal
                isOpen={!!formatToDelete}
                onClose={() => setFormatToDelete(null)}
                onConfirm={handleDeleteFormat}
                itemName={formatToDelete?.nom || ''}
                isLoading={isDeleting}
            />
        </div>
    );
};

export default FormatsColisConfig;
