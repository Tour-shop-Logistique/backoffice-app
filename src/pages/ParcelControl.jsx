import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchParcelByCode, clearCurrentParcel, setCurrentParcel, controlParcels, receiveParcels, blockParcels } from '../redux/slices/parcelSlice';
import { fetchAgences } from '../redux/slices/agenceSlice';
import { showNotification } from '../redux/slices/uiSlice';
import Modal from '../components/common/Modal';
import {
    ArrowLeft,
    Loader2,
    Building2,
    Truck,
    Plane,
    Ship,
    MapPin,
    Scale,
    Euro,
    Tag,
    Hash,
    Blocks,
    ChevronRight,
    ShieldCheck,
    Phone,
    Calendar,
    User,
    AlertCircle,
    CreditCard,
    Gauge,
    Zap,
    BadgeCheck,
    CheckCircle,
    Info,
    Clock,
    PackageCheck,
    History,
    Layers
} from 'lucide-react';

const ParcelControl = () => {
    const { code } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const dispatch = useDispatch();
    const {
        todoList, historyList, incomingList, currentParcel,
        isLoadingDetail, detailError,
        isBulkControlling, isBulkBlocking, isBulkReceiving
    } = useSelector(state => state.parcels);
    const { agences, hasLoaded: agencesLoaded, isLoading: isLoadingAgences } = useSelector(state => state.agences);
    const [isValidating, setIsValidating] = useState(false);
    const [isAgencyModalOpen, setIsAgencyModalOpen] = useState(false);
    const [selectedAgencyId, setSelectedAgencyId] = useState('');

    // Block State
    const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);
    const [blockReason, setBlockReason] = useState('');

    const isFromIncoming = location.state?.from === 'incoming';

    const handleValidate = async () => {
        if (!currentParcel?.code_colis) return;

        if (isFromIncoming) {
            setIsAgencyModalOpen(true);
            return;
        }

        // Sécurité Financière : Le Backoffice ne valide que si les frais annexes sont payés
        const feesNotPaid = currentParcel.expedition?.statut_paiement_frais !== 'paye';
        if (feesNotPaid) {
            dispatch(showNotification({
                type: 'error',
                message: "Blocage de sécurité : Les frais annexes (Douane/Assurance) n'ont pas encore été encaissés par l'agence de départ. Expédition suspendue."
            }));
            return;
        }

        setIsValidating(true);
        try {
            await dispatch(controlParcels([currentParcel.code_colis])).unwrap();

            dispatch(showNotification({
                type: 'success',
                message: `Le colis ${currentParcel.code_colis} a été validé avec succès.`
            }));
        } catch (err) {
            dispatch(showNotification({
                type: 'error',
                message: err.message || 'Erreur lors de la validation du colis.'
            }));
        } finally {
            setIsValidating(false);
        }
    };

    const confirmReceive = async () => {
        if (!selectedAgencyId || !currentParcel?.code_colis) return;

        setIsValidating(true);
        try {
            await dispatch(receiveParcels({
                codes: [currentParcel.code_colis],
                agence_id: selectedAgencyId
            })).unwrap();

            dispatch(showNotification({
                type: 'success',
                message: `Le colis ${currentParcel.code_colis} a été réceptionné avec succès.`
            }));

            setIsAgencyModalOpen(false);
            setSelectedAgencyId('');
        } catch (err) {
            dispatch(showNotification({
                type: 'error',
                message: err.message || 'Erreur lors de la réception du colis.'
            }));
        } finally {
            setIsValidating(false);
        }
    };

    const handleConfirmBlock = async () => {
        if (!blockReason.trim() || !currentParcel?.code_colis) {
            dispatch(showNotification({
                type: 'error',
                message: "Veuillez renseigner un motif pour bloquer ce colis."
            }));
            return;
        }

        try {
            await dispatch(blockParcels({
                codes: [currentParcel.code_colis],
                motif_blocage: blockReason
            })).unwrap();

            dispatch(showNotification({
                type: 'warning',
                message: `Le colis ${currentParcel.code_colis} a été écarté avec succès.`
            }));

            setIsBlockModalOpen(false);
            setBlockReason('');
        } catch (err) {
            dispatch(showNotification({
                type: 'error',
                message: err.message || 'Erreur lors du blocage du colis.'
            }));
        }
    };

    useEffect(() => {
        if (!code) return;

        // 1. Si on a déjà le bon colis dans currentParcel, on ne bouge pas
        if (currentParcel && currentParcel.code_colis === code) return;

        // 2. On regarde si le colis est présent dans l'une des listes cachées
        const parcelFromTodo = todoList.items?.find(p => p.code_colis === code);
        const parcelFromHistory = historyList.items?.find(p => p.code_colis === code);
        const parcelFromIncoming = incomingList.items?.find(p => p.code_colis === code);
        const parcelFromList = parcelFromTodo || parcelFromHistory || parcelFromIncoming;

        if (parcelFromList) {
            // On utilise les données déjà présentes (pas d'API call)
            dispatch(setCurrentParcel(parcelFromList));
        } else {
            // 3. Sinon (scan nouveau, refresh, ou lien direct), on appelle l'API
            dispatch(fetchParcelByCode(code));
        }

        // Toujours charger les agences pour la sélection si besoin (avec garde)
        if (!agencesLoaded && !isLoadingAgences) {
            dispatch(fetchAgences());
        }

        return () => {
            // On ne clear pas forcément ici pour permettre la navigation fluide, 
            // mais l'initialState de currentParcel est null au départ.
        };
    }, [dispatch, code, agencesLoaded, isLoadingAgences]);

    const getStatusInfo = (status) => {
        switch (status) {
            case 'en_transit_entrepot':
                return { label: 'À contrôler', styles: 'bg-amber-100 text-amber-700 border-amber-200', icon: ShieldCheck };
            case 'depart_expedition_succes':
                return { label: 'Validé / Expédié', styles: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: BadgeCheck };
            case 'recu_agence_depart':
                return { label: 'Reçu Agence', styles: 'bg-blue-100 text-blue-700 border-blue-200', icon: Building2 };
            default:
                return { label: status?.replace(/_/g, ' ') || 'Inconnu', styles: 'bg-slate-100 text-slate-700 border-slate-200', icon: Info };
        }
    };

    const getPaymentStatus = (status) => {
        switch (status) {
            case 'paye':
                return { label: 'Payé', styles: 'bg-emerald-500 text-white' };
            case 'en_attente':
                return { label: 'En attente', styles: 'bg-amber-500 text-white' };
            default:
                return { label: status || 'Non défini', styles: 'bg-slate-400 text-white' };
        }
    };

    if (isLoadingDetail) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <Loader2 className="h-12 w-12 text-slate-900 animate-spin mb-4" strokeWidth={1.5} />
                <p className="text-slate-500 font-bold text-xs uppercase tracking-widest">Recherche du colis {code}...</p>
            </div>
        );
    }

    if (detailError) {
        const isNotFound = detailError === 'Colis introuvable.' || (typeof detailError === 'object' && detailError.message === 'Colis introuvable.');
        const errorMessage = typeof detailError === 'string' ? detailError : (detailError.message || detailError.error || 'Une erreur est survenue');

        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center animate-in fade-in duration-500">
                <div className={`p-5 rounded-3xl mb-6 shadow-xl border ${isNotFound ? 'bg-amber-50 text-amber-500 border-amber-100' : 'bg-rose-50 text-rose-500 border-rose-100'}`}>
                    {isNotFound ? <Info size={48} strokeWidth={1.5} /> : <AlertCircle size={48} strokeWidth={1.5} />}
                </div>
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                    {isNotFound ? 'Colis non répertorié' : 'Accès Restreint'}
                </h2>
                <p className="text-slate-500 mt-3 max-w-md text-sm font-medium leading-relaxed">
                    {isNotFound
                        ? `Le code ${code} n'a pas été trouvé dans notre système ou n'est pas encore synchronisé.`
                        : `Impossible d'accéder aux détails du colis ${code}. Raison : ${errorMessage}`
                    }
                </p>
                <button
                    onClick={() => navigate(-1)}
                    className="mt-6 inline-flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg active:scale-95"
                >
                    <ArrowLeft size={22} /> Retour à la liste
                </button>
            </div>
        );
    }

    if (!currentParcel) return null;

    const status = getStatusInfo(currentParcel.expedition?.statut_expedition);
    const isAir = currentParcel.code_colis?.includes('AERIEN');

    return (
        <div className="w-full space-y-6 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">

            {/* --- HEADER SECTION --- */}
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 pt-4 pb-6 border-b border-slate-100">
                <div className="flex items-center gap-5">
                    <button
                        onClick={() => navigate(-1)}
                        className="group p-2.5 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-slate-900 hover:border-slate-300 transition-all active:scale-95"
                    >
                        <ArrowLeft size={20} className="group-hover:-translate-x-0.5 transition-transform" />
                    </button>
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">Contrôle Logistique</h1>
                        <div className="flex items-center gap-3 mt-1.5">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Référence Colis</span>
                            <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded border border-indigo-100 tracking-wider uppercase">{currentParcel.code_colis}</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {!currentParcel.is_controlled && !currentParcel.is_blocked && (
                        <button
                            onClick={() => setIsBlockModalOpen(true)}
                            disabled={isValidating || isBulkBlocking || isBulkReceiving || isBulkControlling}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-widest text-rose-500 bg-white border border-rose-100 hover:bg-rose-50 transition-all active:scale-95 shadow-sm"
                        >
                            {isBulkBlocking ? <Loader2 size={14} className="animate-spin" /> : <AlertCircle size={14} />}
                            Écarter
                        </button>
                    )}

                    {!(currentParcel.is_controlled && !isFromIncoming && !currentParcel.is_blocked) && (
                        <button
                            onClick={handleValidate}
                            disabled={isValidating || isBulkBlocking || isBulkReceiving || isBulkControlling}
                            className={`flex items-center gap-2 px-7 py-2.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-all shadow-sm active:scale-95 ${currentParcel.is_blocked ? 'bg-amber-500 text-white hover:bg-amber-600 shadow-amber-200' :
                                    currentParcel.is_controlled ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-200' :
                                        'bg-slate-900 text-white hover:bg-slate-800 shadow-slate-200'
                                }`}
                        >
                            {isValidating || isBulkReceiving || isBulkControlling ? <Loader2 size={16} className="animate-spin" /> :
                                currentParcel.is_blocked ? <ShieldCheck size={16} /> : <PackageCheck size={16} />}
                            {currentParcel.is_blocked ? 'Débloquer et Valider' :
                                (isFromIncoming ? 'Réceptionner' : 'Valider')}
                        </button>
                    )}
                </div>
            </header>

            {/* --- BLOCK NOTIFICATION --- */}
            {currentParcel.is_blocked && (
                <div className="bg-rose-50 border border-rose-100 p-5 rounded-lg flex items-start gap-5 shadow-sm animate-in zoom-in-95 duration-300">
                    <div className="w-12 h-12 rounded-lg bg-rose-100 flex items-center justify-center text-rose-600 shrink-0 border border-rose-200">
                        <AlertCircle size={24} />
                    </div>
                    <div className="pt-1">
                        <h3 className="text-xs font-bold text-rose-900 uppercase tracking-widest">Colis en Opposition</h3>
                        <p className="text-sm font-semibold text-rose-700 italic mt-1 leading-relaxed">
                            "{currentParcel.motif_blocage || 'Aucune raison spécifiée par l\'agent.'}"
                        </p>
                    </div>
                </div>
            )}

            {/* --- PRIMARY INFO SECTION --- */}
            <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
                <div className="grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-slate-100">
                    <div className="md:col-span-7 p-6 flex items-center gap-5">
                        <div className="w-12 h-12 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 border border-indigo-100 shrink-0">
                            <Tag size={24} />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Désignation du Colis</p>
                            <h2 className="text-xl md:text-2xl font-bold text-slate-900 uppercase leading-tight">{currentParcel.designation || 'Non spécifié'}</h2>
                        </div>
                    </div>
                    
                    <div className="md:col-span-5 p-6 bg-slate-50/50 flex items-center justify-between">
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">État du Contrôle</p>
                            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded text-xs font-bold uppercase border ${status.styles}`}>
                                <status.icon size={14} />
                                {status.label}
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Transport</p>
                            <div className="flex items-center gap-2 justify-end text-slate-700">
                                {isAir ? <Plane size={18} className="text-blue-500" /> : <Ship size={18} className="text-slate-500" />}
                                <span className="text-sm font-bold uppercase">{isAir ? 'Aérien' : 'Maritime'}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- LOGISTICS & ARTICLES --- */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                        { label: 'Poids', value: `${currentParcel.poids || '0.00'}`, unit: 'KG', icon: Scale, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                        { label: 'Dimensions', value: `${currentParcel.longueur}x${currentParcel.largeur}x${currentParcel.hauteur}`, unit: 'CM', icon: Gauge, color: 'text-amber-600', bg: 'bg-amber-50' },
                        { label: 'Service', value: currentParcel.expedition?.type_expedition?.replace(/groupage_|dhd_/gi, '') || 'Standard', unit: '', icon: Layers, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                    ].map((item, i) => (
                        <div key={i} className="bg-white border border-slate-200 p-5 rounded-lg shadow-sm">
                            <div className="flex items-center gap-3 mb-4">
                                <div className={`p-2 rounded ${item.bg} ${item.color}`}>
                                    <item.icon size={18} />
                                </div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{item.label}</p>
                            </div>
                            <div className="flex items-baseline gap-1.5">
                                <span className="text-xl font-bold text-slate-900 uppercase tracking-tight">{item.value}</span>
                                {item.unit && <span className="text-xs font-bold text-slate-400">{item.unit}</span>}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="lg:col-span-1 bg-white border border-slate-200 rounded-lg p-5 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                        <Blocks size={18} className="text-slate-400" />
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Articles ({ (currentParcel.articles || []).length })</p>
                    </div>
                    <div className="flex flex-wrap gap-1.5 max-h-[100px] overflow-y-auto pr-2 custom-scrollbar">
                        {(currentParcel.articles || []).length > 0 ? (
                            currentParcel.articles.map((article, idx) => (
                                <span key={idx} className="px-2 py-1 bg-slate-100 border border-slate-200 text-slate-600 rounded text-[10px] font-bold uppercase whitespace-nowrap">
                                    {article}
                                </span>
                            ))
                        ) : (
                            <p className="text-xs font-medium text-slate-400 italic">Aucun article</p>
                        )}
                    </div>
                </div>
            </div>

            {/* --- CONTACTS & ORIGIN --- */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Contacts */}
                <div className="lg:col-span-8 bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
                    <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-100">
                        <div className="p-6">
                            <div className="flex items-center gap-3 mb-5">
                                <div className="w-9 h-9 rounded bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                                    <User size={18} />
                                </div>
                                <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Expéditeur</h4>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase mb-0.5">Nom complet</p>
                                    <p className="text-base font-bold text-slate-800">{currentParcel.expedition?.expediteur?.nom_prenom}</p>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs font-bold text-slate-400 uppercase mb-0.5">Téléphone</p>
                                        <p className="text-sm font-bold text-slate-700">{currentParcel.expedition?.expediteur?.telephone}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-slate-400 uppercase mb-0.5">Ville/Pays</p>
                                        <p className="text-sm font-bold text-slate-700">{currentParcel.expedition?.expediteur?.ville}, {currentParcel.expedition?.pays_depart}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 bg-slate-50/30">
                            <div className="flex items-center gap-3 mb-5">
                                <div className="w-9 h-9 rounded bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                                    <MapPin size={18} />
                                </div>
                                <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Destinataire</h4>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase mb-0.5">Nom complet</p>
                                    <p className="text-base font-bold text-slate-800">{currentParcel.expedition?.destinataire?.nom_prenom}</p>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs font-bold text-slate-400 uppercase mb-0.5">Téléphone</p>
                                        <p className="text-sm font-bold text-slate-700">{currentParcel.expedition?.destinataire?.telephone}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-slate-400 uppercase mb-0.5">Ville/Pays</p>
                                        <p className="text-sm font-bold text-slate-700">{currentParcel.expedition?.destinataire?.ville}, {currentParcel.expedition?.pays_destination}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Agency Origin */}
                <div className="lg:col-span-4 bg-white border border-slate-200 rounded-lg shadow-sm p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-9 h-9 rounded bg-slate-100 text-slate-500 flex items-center justify-center">
                            <Building2 size={18} />
                        </div>
                        <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Provenance Agence</h4>
                    </div>
                    <div className="space-y-5">
                        <div className="p-4 bg-slate-50 rounded border border-slate-100">
                            <p className="text-xs font-bold text-slate-400 uppercase mb-1">Agence de départ</p>
                            <p className="text-sm font-bold text-slate-900">{currentParcel.expedition?.agence?.nom_agence}</p>
                        </div>
                        <div className="flex items-center justify-between px-1">
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase mb-1">Contact Agence</p>
                                <p className="text-sm font-bold text-slate-800">{currentParcel.expedition?.agence?.telephone || '-'}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-xs font-bold text-slate-400 uppercase mb-1">Date d'Envoi</p>
                                <p className="text-sm font-bold text-slate-800">
                                    {currentParcel.expedition?.created_at ? new Date(currentParcel.expedition.created_at).toLocaleDateString('fr-FR', {
                                        day: '2-digit', month: '2-digit'
                                    }) : '-'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- PAYMENT SECTION --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                    { 
                        label: 'Règlement Expédition', 
                        value: currentParcel.expedition?.statut_paiement_expedition === 'paye' ? 'Entièrement Réglé' : 'À régler à l\'arrivée',
                        isPaid: currentParcel.expedition?.statut_paiement_expedition === 'paye',
                        icon: Truck,
                        accent: currentParcel.expedition?.statut_paiement_expedition === 'paye' ? 'text-emerald-600 bg-emerald-50 border-emerald-100' : 'text-amber-600 bg-amber-50 border-amber-100'
                    },
                    { 
                        label: 'Frais Annexes (Douane)', 
                        value: currentParcel.expedition?.statut_paiement_frais === 'paye' ? 'Règlements Encaissés' : 'En attente de paiement',
                        isPaid: currentParcel.expedition?.statut_paiement_frais === 'paye',
                        icon: ShieldCheck,
                        accent: currentParcel.expedition?.statut_paiement_frais === 'paye' ? 'text-emerald-600 bg-emerald-50 border-emerald-100' : 'text-amber-600 bg-amber-50 border-amber-100'
                    }
                ].map((pay, i) => (
                    <div key={i} className={`p-5 rounded-lg border flex items-center justify-between ${pay.isPaid ? 'bg-white border-emerald-100 shadow-sm shadow-emerald-50' : 'bg-white border-amber-100 shadow-sm shadow-amber-50'}`}>
                        <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded flex items-center justify-center border ${pay.accent}`}>
                                <pay.icon size={20} />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">{pay.label}</p>
                                <p className="text-sm md:text-base font-bold text-slate-900">{pay.value}</p>
                            </div>
                        </div>
                        {pay.isPaid ? <CheckCircle size={22} className="text-emerald-500" /> : <Info size={22} className="text-amber-500" />}
                    </div>
                ))}
            </div>

            {/* --- MODALS --- */}
            <Modal
                isOpen={isAgencyModalOpen}
                onClose={() => setIsAgencyModalOpen(false)}
                title="Agence de Réception"
                subtitle="Confirmation de l'entrée en entrepôt central"
                size="md"
                onConfirm={confirmReceive}
                isLoading={isBulkReceiving || isValidating}
                confirmLabel="Confirmer la Réception"
            >
                <div className="space-y-6">
                    <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl text-xs font-medium text-blue-700 leading-relaxed">
                        Veuillez confirmer l'agence qui réceptionne physiquement ce colis pour valider son statut.
                    </div>
                    <select
                        value={selectedAgencyId}
                        onChange={(e) => setSelectedAgencyId(e.target.value)}
                        className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 transition-all outline-none"
                    >
                        <option value="">Sélectionner une agence...</option>
                        {agences.map(agency => (
                            <option key={agency.id} value={agency.id}>
                                {agency.nom_agence} ({agency.ville})
                            </option>
                        ))}
                    </select>
                </div>
            </Modal>

            <Modal
                isOpen={isBlockModalOpen}
                onClose={() => setIsBlockModalOpen(false)}
                title="Signaler une Anomalie"
                subtitle={`Colis ID: ${currentParcel.code_colis}`}
                size="sm"
                onConfirm={handleConfirmBlock}
                isLoading={isBulkBlocking}
                confirmLabel="Mettre en Opposition"
                confirmVariant="danger"
            >
                <textarea
                    value={blockReason}
                    onChange={(e) => setBlockReason(e.target.value)}
                    placeholder="Précisez le motif du blocage (poids, non-conformité...)"
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-rose-500/5 focus:border-rose-500 transition-all outline-none min-h-[150px] resize-none"
                />
            </Modal>
        </div>
    );
};

export default ParcelControl;
