import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchParcelByCode, clearCurrentParcel, setCurrentParcel, controlParcels, receiveParcels } from '../redux/slices/parcelSlice';
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
    Clock,
    PackageCheck
} from 'lucide-react';

const ParcelControl = () => {
    const { code } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const dispatch = useDispatch();
    const { todoList, historyList, incomingList, currentParcel, isLoadingDetail, detailError, isBulkControlling } = useSelector(state => state.parcels);
    const { agences } = useSelector(state => state.agences);
    const [isValidating, setIsValidating] = useState(false);
    const [isAgencyModalOpen, setIsAgencyModalOpen] = useState(false);
    const [selectedAgencyId, setSelectedAgencyId] = useState('');

    const isFromIncoming = location.state?.from === 'incoming';

    const handleValidate = async () => {
        if (!currentParcel?.code_colis) return;

        if (isFromIncoming) {
            setIsAgencyModalOpen(true);
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

        // Toujours charger les agences pour la sélection si besoin
        dispatch(fetchAgences());

        return () => {
            // On ne clear pas forcément ici pour permettre la navigation fluide, 
            // mais l'initialState de currentParcel est null au départ.
        };
    }, [dispatch, code, todoList, historyList, incomingList, currentParcel]);

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
                    className="mt-6 inline-flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg active:scale-95"
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
            {/* Minimal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors"
                        title="Retour"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-lg font-bold text-slate-900 leading-none">Détails du Colis</h1>
                    </div>
                </div>
            </div>

            {/* Compact Top Bar */}
            <div className="bg-white border border-slate-200 rounded-lg p-4 flex flex-wrap items-center gap-6 shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-slate-50 rounded-lg flex items-center justify-center border border-slate-100 text-slate-600">
                        {isAir ? <Plane size={24} /> : <Ship size={24} />}
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase leading-none mb-2">Désignation</p>
                        <p className="text-sm font-bold text-slate-900 leading-tight uppercase py-0.5 tracking-tight">{currentParcel.designation || 'Non spécifié'}</p>
                    </div>
                </div>
                <div className="h-8 border-l border-slate-200 hidden sm:block"></div>
                <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase leading-none mb-2">Code Colis</p>
                    <p className="text-sm font-mono font-bold text-slate-900 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                        {currentParcel.code_colis}
                    </p>
                </div>
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
                    ) : currentParcel.is_controlled && !isFromIncoming ? (
                        <div className="px-4 py-2 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                            <ShieldCheck size={14} />
                            Colis Validé
                        </div>
                    ) : (
                        <button
                            onClick={handleValidate}
                            disabled={isValidating || isBulkControlling}
                            className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-slate-800 transition-colors flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            {isValidating
                                ? <><Loader2 size={14} className="animate-spin" /> {isFromIncoming ? 'Réception...' : 'Validation...'}</>
                                : <>{isFromIncoming ? 'Confirmer la réception' : 'Valider le contrôle'}</>
                            }
                        </button>
                    )}
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
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-stretch">
                        {/* Poids */}
                        <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                            <p className="text-xs font-semibold text-slate-400 uppercase mb-1">Poids</p>
                            <p className="text-lg font-semibold text-slate-800">{currentParcel.poids} <span className="text-[10px] font-medium text-slate-400 uppercase">kg</span></p>
                        </div>
                        {/* Type d'expédition */}
                        <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                            <p className="text-xs font-semibold text-slate-400 uppercase mb-1">Type d'expédition</p>
                            <p className="text-sm font-bold text-slate-800 uppercase tracking-tight">
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

                {/* LIGNE 3 : Suivi du Trajet (pleine largeur) */}
                <div className="lg:col-span-3 bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Gauge size={14} className="text-indigo-500" /> Suivi du Trajet
                    </h3>
                    <div className="flex items-center justify-between relative px-2 py-4">
                        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-slate-200 -translate-y-1/2 z-0 mx-8"></div>
                        <div className="relative z-10 flex flex-col items-center">
                            <div className="w-9 h-9 rounded-full bg-slate-900 text-white flex items-center justify-center border-4 border-white shadow-md">
                                <MapPin size={16} />
                            </div>
                            <span className="text-[10px] font-bold text-slate-900 mt-2 uppercase tracking-tighter">{currentParcel.expedition?.pays_depart}</span>
                        </div>
                        <div className="relative z-10 flex flex-col items-center">
                            <div className={`w-9 h-9 rounded-full flex items-center justify-center shadow-md ${currentParcel.is_controlled ? 'bg-emerald-500 text-white' : 'bg-white text-slate-300 border-2 border-slate-100'}`}>
                                {isAir ? <Plane size={16} /> : <Ship size={16} />}
                            </div>
                            <span className="text-[10px] font-bold text-slate-400 mt-2 uppercase italic tracking-tighter">En Transit</span>
                        </div>
                        <div className="relative z-10 flex flex-col items-center">
                            <div className="w-9 h-9 rounded-full bg-slate-50 text-slate-200 border-2 border-slate-100 flex items-center justify-center shadow-inner">
                                <MapPin size={16} />
                            </div>
                            <span className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-tighter">{currentParcel.expedition?.pays_destination}</span>
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

                    <div className="flex gap-3 pt-2">
                        <button
                            onClick={() => setIsAgencyModalOpen(false)}
                            className="flex-1 px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-widest text-slate-500 hover:bg-slate-50 transition-colors font-sans"
                        >
                            Annuler
                        </button>
                        <button
                            onClick={confirmReceive}
                            disabled={!selectedAgencyId || isValidating}
                            className="flex-[2] px-4 py-2.5 bg-slate-900 text-white rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-slate-800 disabled:opacity-50 transition-all flex items-center justify-center gap-2 font-sans"
                        >
                            {isValidating
                                ? <><Loader2 size={14} className="animate-spin" /> Traitement...</>
                                : <><PackageCheck size={14} /> Confirmer</>
                            }
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default ParcelControl;
