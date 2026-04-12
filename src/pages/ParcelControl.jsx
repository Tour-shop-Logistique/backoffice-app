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
    PackageCheck
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
                <p className="text-slate-500 font-bold text-[10px] uppercase tracking-widest">Recherche du colis {code}...</p>
            </div>
        );
    }

    if (detailError) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
                <div className="p-4 bg-rose-50 rounded-2xl mb-4 text-rose-500 border border-rose-100">
                    <AlertCircle size={40} />
                </div>
                <h2 className="text-xl font-bold text-slate-900">Colis introuvable</h2>
                <p className="text-slate-500 mt-2 max-w-sm">Désolé, nous n'avons trouvé aucun colis correspondant au code <span className="font-bold text-slate-900">{code}</span>.</p>
                <button
                    onClick={() => navigate(-1)}
                    className="mt-6 inline-flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg active:scale-95"
                >
                    <ArrowLeft size={16} /> Retour à la liste
                </button>
            </div>
        );
    }

    if (!currentParcel) return null;

    const status = getStatusInfo(currentParcel.expedition?.statut_expedition);
    const isAir = currentParcel.code_colis?.includes('AERIEN');

    return (
        <div className="max-w-7xl mx-auto space-y-4 pb-12 px-2 animate-in fade-in duration-300">
            {/* HEADER PREMIUM AVEC STATUT DE BLOCAGE */}
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-1">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition-all active:scale-95 shadow-sm"
                    >
                        <ArrowLeft size={20} className="text-slate-600" />
                    </button>
                    <div>
                        <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                             Contrôle Logistique
                        </h1>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Colis {currentParcel.code_colis}</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setIsBlockModalOpen(true)}
                        disabled={currentParcel.is_blocked || isValidating || isBulkBlocking || isBulkReceiving || isBulkControlling}
                        className={`px-6 py-2.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all active:scale-95 flex items-center gap-2 shadow-sm border ${currentParcel.is_blocked ? 'bg-slate-50 text-slate-400 border-slate-200' : 'bg-white text-rose-600 border-rose-100 hover:bg-rose-50'}`}
                    >
                        {isBulkBlocking ? <Loader2 size={14} className="animate-spin" /> : <AlertCircle size={14} />}
                        {currentParcel.is_blocked ? "Colis Écarté" : "Écarter"}
                    </button>

                    <button
                        onClick={handleValidate}
                        disabled={isValidating || isBulkBlocking || isBulkReceiving || isBulkControlling || (currentParcel.is_controlled && !isFromIncoming && !currentParcel.is_blocked)}
                        className={`px-8 py-2.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all active:scale-95 flex items-center gap-2 shadow-lg ${
                            currentParcel.is_blocked ? 'bg-amber-500 text-white shadow-amber-500/20 hover:bg-amber-600' :
                            currentParcel.is_controlled 
                                ? 'bg-emerald-500 text-white shadow-emerald-500/20 hover:bg-emerald-600' 
                                : 'bg-slate-900 text-white shadow-slate-900/20 hover:bg-slate-800'
                        }`}
                    >
                        {isValidating || isBulkReceiving || isBulkControlling ? <Loader2 size={14} className="animate-spin" /> : 
                         currentParcel.is_blocked ? <ShieldCheck size={14} /> : <PackageCheck size={14} />}
                        {currentParcel.is_blocked ? 'Débloquer & Valider' : 
                         (isFromIncoming ? 'Réceptionner' : (currentParcel.is_controlled ? 'Déjà Contrôlé' : 'Valider & Libérer'))}
                    </button>
                </div>
            </header>


            <div className={`border rounded-lg p-4 flex flex-wrap items-center gap-6 shadow-sm transition-all duration-300 ${currentParcel.is_blocked ? 'bg-rose-50/40 border-rose-200' : 'bg-white border-slate-200'}`}>
                <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center border transition-colors ${currentParcel.is_blocked ? 'bg-rose-100/50 border-rose-200 text-rose-600' : 'bg-slate-50 border-slate-100 text-slate-600'}`}>
                        {currentParcel.is_blocked ? <AlertCircle size={24} className="animate-pulse" /> : (isAir ? <Plane size={24} /> : <Ship size={24} />)}
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase leading-none mb-2">Désignation</p>
                        <p className={`text-sm font-bold leading-tight uppercase py-0.5 tracking-tight ${currentParcel.is_blocked ? 'text-rose-900' : 'text-slate-900'}`}>{currentParcel.designation || 'Non spécifié'}</p>
                    </div>
                </div>

                <div className={`h-8 border-l hidden sm:block ${currentParcel.is_blocked ? 'border-rose-200' : 'border-slate-200'}`}></div>

                <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase leading-none mb-2">Code Colis</p>
                    <p className={`text-sm font-mono font-bold px-2 py-0.5 rounded border ${currentParcel.is_blocked ? 'bg-white border-rose-200 text-rose-700' : 'bg-slate-50 border-slate-100 text-slate-900'}`}>
                        {currentParcel.code_colis}
                    </p>
                </div>

                {currentParcel.is_blocked && (
                    <>
                        <div className="h-8 border-l border-rose-200 hidden lg:block"></div>
                        <div className="flex-1 min-w-[200px]">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                                <p className="text-[10px] font-bold text-rose-500 uppercase leading-none">Anomalie / Motif</p>
                            </div>
                            <p className="text-xs font-bold text-rose-800 italic leading-tight">
                                {currentParcel.motif_blocage || 'Motif non précisé'}
                            </p>
                        </div>
                    </>
                )}

                <div className="md:ml-auto flex items-center gap-2">
                    {currentParcel.is_received_by_backoffice ? (
                        <div className="flex flex-col items-end gap-1">
                            <div className="px-4 py-2 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                                <CheckCircle size={14} />
                                Colis Réceptionné
                            </div>
                            {currentParcel.received_at_backoffice && (
                                <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                                    <Clock size={10} />
                                    {new Date(currentParcel.received_at_backoffice).toLocaleString('fr-FR', {
                                        day: '2-digit',
                                        month: '2-digit',
                                        year: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}
                                </div>
                            )}
                        </div>
                    ) : (currentParcel.is_controlled && !currentParcel.is_blocked && !isFromIncoming) ? (
                        <div className="px-4 py-2 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                            <ShieldCheck size={14} />
                            Colis Validé
                        </div>
                    ) : null}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

                {/* LIGNE 1 : Informations Logistiques (pleine largeur) */}
                <div className="lg:col-span-3 bg-slate-50 border border-slate-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-200/60">
                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                            <Scale size={14} /> Informations Logistiques
                        </h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-6 gap-3 items-stretch">
                        {/* Poids */}
                        <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                            <p className="text-xs font-semibold text-slate-400 uppercase mb-1">Poids</p>
                            <p className="text-md font-semibold text-slate-800 tracking-tight">{currentParcel.poids || 0} <span className="text-[10px] font-medium text-slate-400 uppercase">kg</span></p>
                        </div>
                        {/* Dimensions */}
                        <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                            <p className="text-xs font-semibold text-slate-400 uppercase mb-1">Dimensions (Lxlxh)</p>
                            <p className="text-md font-semibold text-slate-800 tracking-tight">
                                {currentParcel.longueur || 0}x{currentParcel.largeur || 0}x{currentParcel.hauteur || 0}
                                <span className="text-[10px] font-medium text-slate-400 uppercase ml-1">cm</span>
                            </p>
                        </div>
                        {/* Type d'expédition */}
                        <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                            <p className="text-xs font-semibold text-slate-400 uppercase mb-1">Type d'expédition</p>
                            <p className="text-md font-bold text-slate-800 uppercase tracking-tight">
                                {currentParcel.expedition?.type_expedition?.replace(/_/g, ' ') || 'Standard'}
                            </p>
                        </div>
                        {/* Articles */}
                        <div className="bg-white p-3 rounded-lg md:col-span-3 border border-slate-200 shadow-sm flex flex-col h-full">

                            <p className="text-xs font-semibold text-slate-400 uppercase mb-1">Articles</p>
                            {currentParcel.articles && currentParcel.articles.length > 0 ? (
                                <div className="flex flex-wrap gap-1.5 flex-1 content-start">
                                    {currentParcel.articles.map((article, idx) => (
                                        <div key={idx} className="bg-slate-50 text-slate-700 px-2.5 py-1 rounded-md text-xs font-bold border border-slate-100 flex items-center gap-1.5">
                                            <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full shrink-0"></div>
                                            {article}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex-1 flex items-center justify-center border-2 border-dashed border-slate-100 rounded-lg">
                                    <p className="text-xs text-slate-400 font-medium italic">Aucun article</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* LIGNE 2 : Expéditeur | Destinataire | Provenance */}

                {/* Expéditeur */}
                <div className="bg-white border border-slate-200 rounded-lg p-4">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
                        Expéditeur
                    </h3>
                    <div className="space-y-3">
                        <p className="text-base font-bold text-slate-900 leading-tight">
                            {currentParcel.expedition?.expediteur?.nom_prenom}
                        </p>
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-slate-600 text-sm font-semibold tracking-wide">
                                <Phone size={14} className="text-slate-400" />
                                {currentParcel.expedition?.expediteur?.telephone}
                            </div>
                            <div className="flex items-start gap-2 text-slate-600 text-xs font-semibold tracking-wide">
                                <MapPin size={14} className="text-slate-400 mt-0.5 shrink-0" />
                                <div className="flex flex-col">
                                    <span className="text-slate-400 font-bold uppercase mb-1">{currentParcel.expedition?.pays_depart}</span>
                                    {currentParcel.expedition?.expediteur?.adresse}, {currentParcel.expedition?.expediteur?.ville}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Destinataire */}
                <div className="bg-white border border-slate-200 rounded-lg p-4">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-green-600 rounded-full"></div>
                        Destinataire
                    </h3>
                    <div className="space-y-3">
                        <p className="text-base font-bold text-slate-900 leading-tight">
                            {currentParcel.expedition?.destinataire?.nom_prenom}
                        </p>
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-slate-600 text-sm font-semibold tracking-wide">
                                <Phone size={14} className="text-slate-400" />
                                {currentParcel.expedition?.destinataire?.telephone}
                            </div>
                            <div className="flex items-start gap-2 text-slate-600 text-xs font-semibold tracking-wide">
                                <MapPin size={14} className="text-slate-400 mt-0.5 shrink-0" />
                                <div className="flex flex-col">
                                    <span className="text-slate-400 font-bold uppercase mb-1">{currentParcel.expedition?.pays_destination}</span>
                                    {currentParcel.expedition?.destinataire?.adresse}, {currentParcel.expedition?.destinataire?.ville}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Provenance */}
                <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-4 shadow-sm">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                        <Truck size={14} /> Provenance
                    </h3>
                    <div className="space-y-2">
                        <div className="flex items-start gap-3">
                            <div className="h-8 w-8 bg-slate-50 rounded flex items-center justify-center shrink-0 border border-slate-100">
                                <Building2 size={14} className="text-slate-400" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-[9px] font-bold text-slate-400 uppercase">Agence</p>
                                <p className="text-xs font-bold text-slate-900 truncate tracking-tight">{currentParcel.expedition?.agence?.code_agence} | {currentParcel.expedition?.agence?.nom_agence}</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3 pt-3 border-t border-slate-50">
                            <div className="h-8 w-8 bg-slate-50 rounded flex items-center justify-center shrink-0 border border-slate-100">
                                <Phone size={14} className="text-slate-400" />
                            </div>
                            <div>
                                <p className="text-[9px] font-bold text-slate-400 uppercase">Téléphone</p>
                                <p className="text-xs font-bold text-slate-900">{currentParcel.expedition?.agence?.telephone}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* LIGNE 4 : État des Règlements (Important pour la sécurité) */}
                <div className="lg:col-span-3 bg-white border border-slate-200 rounded-lg p-4 shadow-sm border-l-4 border-l-slate-900">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                             <CreditCard size={14} /> État des Règlements
                        </h3>
                        <div className="flex items-center gap-1 text-[9px] font-bold text-slate-400 uppercase">
                            <Clock size={10} /> Mis à jour en temps réel
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className={`p-4 rounded-lg border flex items-center justify-between ${currentParcel.expedition?.statut_paiement_expedition === 'paye' ? 'bg-emerald-50/50 border-emerald-100' : 'bg-rose-50/50 border-rose-100'}`}>
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${currentParcel.expedition?.statut_paiement_expedition === 'paye' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                                    <Truck size={20} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase leading-none mb-1">Frais d'Expédition</p>
                                    <p className={`text-sm font-bold uppercase ${currentParcel.expedition?.statut_paiement_expedition === 'paye' ? 'text-emerald-700' : 'text-rose-700'}`}>
                                        {currentParcel.expedition?.statut_paiement_expedition === 'paye' ? 'RÉGLÉ AU DÉPART' : 'NON RÉGLÉ (À L\'ARRIVÉE)'}
                                    </p>
                                </div>
                            </div>
                            {currentParcel.expedition?.statut_paiement_expedition === 'paye' && <BadgeCheck size={20} className="text-emerald-500" />}
                        </div>

                        <div className={`p-4 rounded-lg border flex items-center justify-between ${currentParcel.expedition?.statut_paiement_frais === 'paye' ? 'bg-emerald-50/50 border-emerald-100' : 'bg-amber-50/50 border-amber-100'}`}>
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${currentParcel.expedition?.statut_paiement_frais === 'paye' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                                    <ShieldCheck size={20} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase leading-none mb-1">Frais Annexes (Douance/Assurance)</p>
                                    <p className={`text-sm font-bold uppercase ${currentParcel.expedition?.statut_paiement_frais === 'paye' ? 'text-emerald-700' : 'text-amber-700'}`}>
                                        {currentParcel.expedition?.statut_paiement_frais === 'paye' ? 'CAISSE VALIDE (OK)' : 'EN ATTENTE DE PAIEMENT'}
                                    </p>
                                </div>
                            </div>
                            {currentParcel.expedition?.statut_paiement_frais === 'paye' ? <BadgeCheck size={20} className="text-emerald-500" /> : <AlertCircle size={20} className="text-amber-500 animate-pulse" />}
                        </div>
                    </div>

                </div>

            </div>

            {/* AGENCY SELECTION MODAL */}
            <Modal
                isOpen={isAgencyModalOpen}
                onClose={() => {
                    setIsAgencyModalOpen(false);
                }}
                title="Agence de Réception"
                subtitle="Sélectionnez l'agence de destination pour ce colis"
                size="xs"
                onConfirm={confirmReceive}
                isLoading={isBulkReceiving || isValidating}
                confirmLabel="Confirmer"
                confirmDisabled={!selectedAgencyId}
            >
                <div className="space-y-4">
                    <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                            Agence de destination
                        </label>
                        <select
                            value={selectedAgencyId}
                            onChange={(e) => setSelectedAgencyId(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-sm font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900 transition-all font-sans"
                        >
                            <option value="">Choisir une agence...</option>
                            {agences.map(agency => (
                                <option key={agency.id} value={agency.id}>
                                    {agency.nom_agence} ({agency.ville}, {agency.adresse})
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </Modal>

            {/* BLOCK MODAL */}
            <Modal
                isOpen={isBlockModalOpen}
                onClose={() => setIsBlockModalOpen(false)}
                title="Écarter / Bloquer le colis"
                subtitle={`Colis ${currentParcel.code_colis}`}
                size="sm"
                onConfirm={handleConfirmBlock}
                isLoading={isBulkBlocking}
                confirmLabel="Écarter le colis"
                confirmVariant="danger"
                confirmDisabled={!blockReason.trim()}
            >
                <div className="space-y-4">
                    <div className="p-4 bg-amber-50 border border-amber-100 rounded-lg flex items-start gap-3">
                        <AlertCircle className="text-amber-500 shrink-0 mt-0.5" size={18} />
                        <p className="text-xs font-medium text-amber-800 leading-relaxed">
                            En écartant ce colis, vous signalez une anomalie qui empêche sa validation immédiate. Veuillez préciser la raison ci-dessous.
                        </p>
                    </div>

                    <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">Motif du blocage</label>
                        <textarea
                            value={blockReason}
                            onChange={(e) => setBlockReason(e.target.value)}
                            placeholder="Ex: Poids non conforme, article interdit, emballage endommagé..."
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-sm font-medium text-slate-700 focus:outline-none focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900 transition-all min-h-[120px] resize-none"
                        />
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default ParcelControl;
