import React, { useState, useMemo, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchIncomingParcels, blockParcels, assignParcels, receiveParcels } from '../redux/slices/parcelSlice';
import { fetchAgences } from '../redux/slices/agenceSlice';
import { showNotification } from '../redux/slices/uiSlice';
import { ROUTES } from '../routes';
import Modal from '../components/common/Modal';
import QRScanner from '../components/common/QRScanner';
import {
    Package,
    Search,
    RefreshCw,
    Loader2,
    Ship,
    Plane,
    ShieldCheck,
    MapPin,
    Building2,
    ArrowDownToLine,
    Truck,
    Eye,
    PackageCheck,
    AlertCircle,
    Check,
} from 'lucide-react';

/**
 * IncomingParcels - Réception internationale (mode=arrivee)
 */
const IncomingParcels = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const { items, isLoading, hasLoaded } = useSelector(
        (state) => state.parcels.incomingList
    );
    const isBulkControlling = useSelector((state) => state.parcels.isBulkControlling);
    const isBulkBlocking = useSelector((state) => state.parcels.isBulkBlocking);
    const isBulkReceiving = useSelector((state) => state.parcels.isBulkReceiving);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [isQRScannerOpen, setIsQRScannerOpen] = useState(false);

    // Agency selection state
    const { agences, isLoading: isLoadingAgences, hasLoaded: agencesLoaded } = useSelector(state => state.agences);
    const [isAgencyModalOpen, setIsAgencyModalOpen] = useState(false);
    const [pendingAction, setPendingAction] = useState(null); // { type: 'single'|'bulk', codes: [] }

    // Selection state
    const [selectedCodes, setSelectedCodes] = useState([]);
    const [validatingCode, setValidatingCode] = useState(null);
    
    // Agency assignment state - maps code_colis to agence_id
    const [agencyAssignments, setAgencyAssignments] = useState({}); // { code_colis: agence_id, ... }
    
    const [assigningCodes, setAssigningCodes] = useState({});

    const setAgencyForColis = async (code, agenceId) => {
        // Optimistic UI update
        setAgencyAssignments(prev => ({
            ...prev,
            [code]: agenceId
        }));

        if (!agenceId) return;

        // mark as assigning
        setAssigningCodes(prev => ({ ...prev, [code]: true }));

        try {
            const payload = { colis_assignments: { [code]: agenceId } };
            await dispatch(assignParcels(payload)).unwrap();
            dispatch(showNotification({ type: 'success', message: `Colis ${code} assigné à l'agence.` }));
        } catch (err) {
            // revert optimistic update on error
            setAgencyAssignments(prev => {
                const copy = { ...prev };
                delete copy[code];
                return copy;
            });
            dispatch(showNotification({ type: 'error', message: err?.message || 'Erreur lors de l\'assignation.' }));
        } finally {
            setAssigningCodes(prev => {
                const copy = { ...prev };
                delete copy[code];
                return copy;
            });
        }
    };

    const getAgencyForColis = (code) => {
        return agencyAssignments[code] || '';
    };

    const areAllSelectedColisAssigned = () => {
        return selectedCodes.every(code => agencyAssignments[code]);
    };

    // Block State
    const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);
    const [blockReason, setBlockReason] = useState('');

    const toggleSelect = (code) => {
        setSelectedCodes(prev =>
            prev.includes(code)
                ? prev.filter(c => c !== code)
                : [...prev, code]
        );
    };

    const toggleSelectAll = () => {
        if (selectedCodes.length === filteredParcels.length && filteredParcels.length > 0) {
            setSelectedCodes([]);
        } else {
            setSelectedCodes(filteredParcels.map(p => p.code_colis));
        }
    };

    const handleBulkReceive = () => {
        if (selectedCodes.length === 0) return;
        
        // Check if all selected parcels have an agency assigned
        if (!areAllSelectedColisAssigned()) {
            dispatch(showNotification({
                type: 'error',
                message: 'Veuillez assigner une agence à tous les colis sélectionnés.'
            }));
            return;
        }
        
        setPendingAction({ type: 'bulk', codes: selectedCodes });
        setIsAgencyModalOpen(true);
    };

    // New: mark selected parcels as arrived (backoffice) and optionally set agence_id per parcel
    const handleMarkArrived = async () => {
        if (selectedCodes.length === 0) return;

        // Build assignments map using selected agencyAssignments or existing agence_destination_id
        const colisAssignments = {};
        selectedCodes.forEach(code => {
            colisAssignments[code] = agencyAssignments[code] || null;
        });

        try {
            await dispatch(receiveParcels({ colis_assignments: colisAssignments })).unwrap();
            dispatch(showNotification({ type: 'success', message: `${selectedCodes.length} colis marqués comme arrivés.` }));
            setSelectedCodes([]);
        } catch (error) {
            dispatch(showNotification({ type: 'error', message: error.message || 'Erreur lors du marquage.' }));
        }
    }

    const handleSingleReceive = (code) => {
        // Open agency modal to select for this single parcel
        setPendingAction({ type: 'single', codes: [code] });
        setIsAgencyModalOpen(true);
    };

    const handleBulkBlock = () => {
        if (selectedCodes.length === 0) return;
        setBlockReason('');
        setIsBlockModalOpen(true);
    };

    const confirmBlockParcels = async () => {
        if (!blockReason.trim() || selectedCodes.length === 0) return;

        try {
            await dispatch(blockParcels({
                codes: selectedCodes,
                motif_blocage: blockReason
            })).unwrap();

            dispatch(showNotification({
                type: 'success',
                message: `${selectedCodes.length} colis ont été écartés avec succès.`
            }));

            setSelectedCodes([]);
            setIsBlockModalOpen(false);
            setBlockReason('');
        } catch (error) {
            dispatch(showNotification({
                type: 'error',
                message: error.message || "Erreur lors du blocage des colis."
            }));
        }
    };

    const confirmReceive = async () => {
        if (!pendingAction) return;

        const { type, codes } = pendingAction;
        
        // Build the colis_assignments mapping
        const colisAssignments = {};
        codes.forEach(code => {
            colisAssignments[code] = agencyAssignments[code];
        });

        // For single receive, we need to validate that an agency was selected
        if (type === 'single' && !colisAssignments[codes[0]]) {
            dispatch(showNotification({
                type: 'error',
                message: 'Veuillez sélectionner une agence pour ce colis.'
            }));
            return;
        }

        if (type === 'single') setValidatingCode(codes[0]);

        try {
            // First assign agencies in DB without marking as received
            await dispatch(assignParcels({ colis_assignments: colisAssignments })).unwrap();

            dispatch(showNotification({
                type: 'success',
                message: codes.length > 1
                    ? `${codes.length} colis assignés aux agences avec succès.`
                    : `Le colis ${codes[0]} a été assigné à l'agence.`
            }));

            if (type === 'bulk') setSelectedCodes([]);
            setIsAgencyModalOpen(false);
            setPendingAction(null);
            // Reset agency assignments for received parcels
            const newAssignments = { ...agencyAssignments };
            codes.forEach(code => {
                delete newAssignments[code];
            });
            setAgencyAssignments(newAssignments);
        } catch (error) {
            dispatch(showNotification({
                type: 'error',
                message: error.message || "Erreur lors de la réception."
            }));
        } finally {
            setValidatingCode(null);
        }
    };

    const handleScanSuccess = (decodedText) => {
        setIsQRScannerOpen(false);

        // 1. Recherche locale
        const localMatch = items.find(p =>
            p.code_colis?.toLowerCase() === decodedText.toLowerCase() ||
            p.expedition?.reference?.toLowerCase() === decodedText.toLowerCase()
        );

        if (localMatch) {
            handleViewParcel(localMatch);
            setSearchTerm(decodedText);
        } else {
            // 2. Sinon, redirection vers la page dédiée qui lancera l'API
            navigate(ROUTES.PARCEL_CONTROL.replace(':code', decodedText), {
                state: { from: 'incoming' }
            });
        }
    };

    // Chargement initial
    useEffect(() => {
        if (!hasLoaded) {
            dispatch(fetchIncomingParcels());
        }
        if (!agencesLoaded && !isLoadingAgences) {
            dispatch(fetchAgences());
        }
    }, [dispatch, hasLoaded, agencesLoaded, isLoadingAgences]);

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await dispatch(fetchIncomingParcels());
        setIsRefreshing(false);
    };

    const handleViewParcel = (parcel) => {
        if (!parcel?.code_colis) return;
        navigate(ROUTES.PARCEL_CONTROL.replace(':code', parcel.code_colis), {
            state: { from: 'incoming' }
        });
    };

    const getTypeIcon = (typeExpedition = '') => {
        const t = typeExpedition.toLowerCase();
        if (t.includes('aerien') || t.includes('air')) return Plane;
        if (t.includes('maritime') || t.includes('mer')) return Ship;
        return Package;
    };

    // Filtre texte et statut de réception
    const filteredParcels = useMemo(() => {
        return items.filter((parcel) => {
            // Uniquement les colis NON réceptionnés par le backoffice
            if (parcel.is_received_by_backoffice) return false;

            const s = searchTerm.toLowerCase();
            return (
                parcel.code_colis?.toLowerCase().includes(s) ||
                parcel.designation?.toLowerCase().includes(s) ||
                parcel.expedition?.code_expedition?.toLowerCase().includes(s) ||
                parcel.expedition?.pays_depart?.toLowerCase().includes(s) ||
                parcel.expedition?.expediteur?.nom_prenom?.toLowerCase().includes(s)
            );
        });
    }, [items, searchTerm]);

    // Regroupement par expédition
    const groupedParcels = useMemo(() => {
        const groups = {};
        filteredParcels.forEach((parcel) => {
            const key = parcel.expedition?.id || 'other';
            if (!groups[key]) {
                groups[key] = {
                    id: key,
                    expedition: parcel.expedition,
                    parcels: [],
                };
            }
            groups[key].parcels.push(parcel);
        });
        return Object.values(groups).sort((a, b) => {
            const dateA = new Date(a.expedition?.created_at || 0);
            const dateB = new Date(b.expedition?.created_at || 0);
            return dateB - dateA;
        });
    }, [filteredParcels]);

    return (
        <div className="space-y-4 pb-6 md:space-y-6 md:pb-12 font-sans">

            {/* STICKY HEADER & SEARCH */}
            <div className="sticky top-[-24px] md:top-[-32px] z-30 bg-[#f1f5f9] -mx-6 px-6 py-3 md:-mx-8 md:px-8 space-y-4 pt-4 lg:pt-2 pb-3">
                {/* ── HEADER ── */}
                <header className="space-y-3 md:space-y-0 text-black">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
                                Arrivages prévus
                            </h1>
                            <p className="text-xs md:text-sm text-slate-500 mt-0.5 font-medium">
                                Expéditions en transit entrant dans votre pays
                            </p>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleRefresh}
                                disabled={isRefreshing || isLoading}
                                className="inline-flex items-center justify-center p-3 text-sm font-bold rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-all disabled:opacity-50 shadow-sm"
                            >
                                <RefreshCw className={`h-4 w-4 ${(isRefreshing || isLoading) ? 'animate-spin' : ''}`} />
                                <span className="hidden md:inline md:ml-2 uppercase tracking-widest text-xs">Actualiser</span>
                            </button>

                            <button
                                onClick={() => setIsQRScannerOpen(true)}
                                className="flex items-center p-3 text-white text-sm font-bold bg-slate-900 hover:bg-slate-800 rounded-lg shadow-sm transition-all border border-slate-900"
                            >
                                <PackageCheck className="h-4 w-4" />
                                <span className="hidden md:inline md:ml-2 uppercase tracking-widest text-xs">Scan QR Code</span>
                            </button>
                        </div>
                    </div>
                </header>

                {/* ── SEARCH BAR ── */}
                <div className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-slate-900 transition-colors" />
                    <input
                        type="text"
                        placeholder="Rechercher un colis à réceptionner..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 md:pl-12 pr-3 md:pr-4 py-2.5 md:py-3 bg-white border border-slate-200 rounded-lg shadow-sm focus:outline-none focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900 transition-all text-sm placeholder:text-slate-400 text-black font-medium"
                    />
                </div>
            </div>

            {/* ── MAIN CONTENT ── */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden text-black transition-all">

                {/* Summary bar */}
                <div className="px-4 py-3 md:px-6 md:py-4 border-b border-slate-100 bg-slate-50/10">
                    <div className="flex flex-col md:flex-row md:items-center gap-3 justify-between">
                        <div className="flex items-center gap-4">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">
                                {groupedParcels.length} expédition{groupedParcels.length !== 1 ? 's' : ''} ({filteredParcels.length} colis)
                            </span>
                            {(isLoading || isRefreshing) && (
                                <Loader2 className="h-3.5 w-3.5 text-slate-400 animate-spin" />
                            )}
                        </div>

                        {selectedCodes.length > 0 && (
                            <div className="flex items-center hidden md:flex gap-2 md:gap-3 md:pl-4 md:border-l md:border-slate-200 animate-in fade-in slide-in-from-top-2 md:slide-in-from-left-2 transition-all">
                                <span className="hidden md:inline text-xs font-bold text-indigo-600 uppercase tracking-widest whitespace-nowrap">
                                    {selectedCodes.length} sélectionné(s)
                                </span>
                                <button
                                    onClick={handleBulkReceive}
                                    disabled={isBulkReceiving || isBulkBlocking}
                                    className="flex-1 md:flex-none flex items-center justify-center gap-2 px-3 py-2 md:py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg md:rounded-md text-xs font-bold uppercase tracking-wider transition-all shadow-sm shadow-indigo-200 active:scale-95 disabled:opacity-50"
                                >
                                    {isBulkReceiving ? <Loader2 size={12} className="animate-spin" /> : <PackageCheck size={12} />}
                                    Assigner la sélection
                                </button>
                                <button
                                    onClick={handleMarkArrived}
                                    disabled={isBulkReceiving || isBulkBlocking}
                                    className="flex-1 md:flex-none flex items-center justify-center gap-2 px-3 py-2 md:py-1 bg-slate-700 hover:bg-slate-800 text-white rounded-lg md:rounded-md text-xs font-bold uppercase tracking-wider transition-all shadow-sm active:scale-95 disabled:opacity-50"
                                >
                                    <PackageCheck size={12} />
                                    Marquer arrivés
                                </button>
                                <button
                                    onClick={handleBulkBlock}
                                    disabled={isBulkReceiving || isBulkBlocking}
                                    className="flex-1 md:flex-none flex items-center justify-center gap-2 px-3 py-2 md:py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg md:rounded-md text-xs font-bold uppercase tracking-wider transition-all shadow-sm shadow-rose-200 active:scale-95 disabled:opacity-50"
                                >
                                    {isBulkBlocking ? <Loader2 size={12} className="animate-spin" /> : <AlertCircle size={12} />}
                                    Bloquer la sélection
                                </button>
                                <button
                                    onClick={() => setSelectedCodes([])}
                                    className="px-2 py-2 md:py-1 text-xs font-bold text-slate-400 hover:text-slate-600 uppercase tracking-widest transition-colors flex items-center justify-center"
                                >
                                    Annuler
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Content */}
                {isLoading && !isRefreshing ? (
                    <div className="flex flex-col items-center justify-center py-24 px-6">
                        <Loader2 className="animate-spin text-slate-900 mb-4" size={40} strokeWidth={1.5} />
                        <p className="text-slate-500 font-bold text-xs uppercase tracking-widest">Chargement des réceptions...</p>
                    </div>
                ) : filteredParcels.length === 0 ? (
                    <div className="py-24 text-center px-6">
                        <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100 shadow-inner">
                            <ArrowDownToLine className="text-slate-300" size={40} />
                        </div>
                        <h3 className="font-bold text-slate-900 text-lg tracking-tight">Aucune réception en attente</h3>
                        <p className="text-slate-500 text-sm mt-1 font-medium max-w-xs mx-auto">
                            {searchTerm ? 'Aucun résultat pour cette recherche.' : 'Aucune expédition internationale à réceptionner pour le moment.'}
                        </p>
                    </div>
                ) : (
                    <div>
                        {/* ── Desktop Table View ── */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-slate-50/50 border-b border-slate-200">
                                    <tr>
                                        <th className="px-6 py-3 text-left w-10">
                                            <div className="flex items-center">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedCodes.length === filteredParcels.length && filteredParcels.length > 0}
                                                    onChange={toggleSelectAll}
                                                    className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600 cursor-pointer"
                                                />
                                            </div>
                                        </th>
                                        <th className="px-6 py-3 text-left font-bold text-slate-500 uppercase tracking-wider text-xs">Colis / Désignation</th>
                                        <th className="px-6 py-3 text-left font-bold text-slate-500 uppercase tracking-wider text-xs">Provenance</th>
                                        <th className="px-6 py-3 text-left font-bold text-slate-500 uppercase tracking-wider text-xs">Destination</th>
                                        <th className="px-6 py-3 text-left font-bold text-slate-500 uppercase tracking-wider text-xs">Poids</th>
                                        <th className="px-6 py-3 text-left font-bold text-slate-500 uppercase tracking-wider text-xs">Agence de Réception</th>
                                        <th className="px-6 py-3 text-right font-bold text-slate-500 uppercase tracking-wider text-xs">Action</th>
                                    </tr>
                                </thead>

                                {groupedParcels.map((group) => {
                                    const TypeIcon = getTypeIcon(group.expedition?.type_expedition);
                                    return (
                                        <tbody key={group.id} className="divide-y divide-slate-200 border-b-4 border-slate-50">
                                            {/* ── Groupe header ── */}
                                            <tr className="bg-slate-50 border-l-2 border-indigo-200">
                                                <td colSpan="7" className="px-6 py-3">
                                                    <div className="flex items-center w-full">
                                                        {/* Référence expédition - colorée */}
                                                        <div className="flex items-center gap-2 px-3 py-1 bg-indigo-600 text-white rounded-md shadow-sm">
                                                            <Truck size={14} className="text-white" />
                                                            <span className="text-sm font-semibold text-white uppercase tracking-tight">
                                                                {group.expedition?.reference || 'Sans ref'}
                                                            </span>
                                                        </div>

                                                        <div className="ml-auto">
                                                            <span className="text-xs font-semibold bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full">
                                                                {group.parcels.length} colis
                                                            </span>
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>

                                            {/* ── Lignes colis ── */}
                                            {group.parcels.map((parcel) => (
                                                <tr
                                                    key={parcel.id}
                                                    className={`hover:bg-slate-50 transition-colors group ${selectedCodes.includes(parcel.code_colis) ? 'bg-indigo-50/30' : ''}`}
                                                >
                                                    <td className="px-6 py-3">
                                                        <div className="flex items-center">
                                                            <input
                                                                type="checkbox"
                                                                checked={selectedCodes.includes(parcel.code_colis)}
                                                                onChange={() => toggleSelect(parcel.code_colis)}
                                                                className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600 cursor-pointer"
                                                            />
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-3">
                                                        <div className="flex items-center gap-3">
                                                            <div className="h-10 w-10 bg-slate-100 text-slate-500 rounded-lg flex items-center justify-center border border-slate-200 group-hover:bg-white group-hover:scale-110 transition-all duration-300">
                                                                <TypeIcon size={18} />
                                                            </div>
                                                            <div className="min-w-0">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="block font-semibold text-slate-900 text-sm">{parcel.code_colis}</span>
                                                                    {parcel.is_blocked && (
                                                                        <span className="px-1.5 py-0.5 rounded-full bg-rose-50 text-rose-600 text-xs border border-rose-100 uppercase font-bold">Bloqué</span>
                                                                    )}
                                                                </div>
                                                                <span className="text-xs font-bold text-slate-400 uppercase">{parcel.designation || 'Sans désignation'}</span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-3">
                                                        <div className="flex items-center gap-1.5 text-slate-800 text-sm font-semibold uppercase">
                                                            <Building2 size={14} className="text-slate-400" />
                                                            {parcel.expedition?.pays_depart}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-3">
                                                        <div className="flex items-center gap-1.5 text-slate-800 text-sm font-semibold uppercase">
                                                            <Building2 size={14} className="text-slate-400" />
                                                            {parcel.expedition?.destinataire?.ville}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-3">
                                                        <span className="text-sm font-semibold text-slate-800">{parcel.poids} kg</span>
                                                    </td>
                                                    <td className="px-6 py-3">
                                                        <select
                                                            value={getAgencyForColis(parcel.code_colis)}
                                                            onChange={(e) => setAgencyForColis(parcel.code_colis, e.target.value)}
                                                            disabled={!!assigningCodes[parcel.code_colis]}
                                                            className={`text-xs font-bold px-3 py-2 rounded-lg border transition-all focus:outline-none focus:ring-4 focus:ring-slate-900/5 ${
                                                                getAgencyForColis(parcel.code_colis)
                                                                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900 focus:border-emerald-900'
                                                                    : 'bg-white border-slate-200 text-slate-600 focus:border-slate-900'
                                                            }`}
                                                        >
                                                            {assigningCodes[parcel.code_colis] ? (
                                                                <option value="" disabled>Assignation...</option>
                                                            ) : agences.length === 0 ? (
                                                                <option value="" disabled>Chargement des agences...</option>
                                                            ) : (
                                                                <option value="">Sélectionner...</option>
                                                            )}
                                                            {agences.map(agency => (
                                                                <option key={agency.id} value={agency.id}>
                                                                    {agency.nom_agence} ({agency.ville})
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </td>
                                                    <td className="px-6 py-3 text-right">
                                                        <div className="flex items-center justify-end gap-2">
                                                            <button
                                                                onClick={() => handleViewParcel(parcel)}
                                                                className="px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all border border-slate-200 text-slate-600 hover:bg-slate-50 active:scale-95"
                                                            >
                                                                Détails
                                                            </button>
                                                            <button
                                                                onClick={() => handleSingleReceive(parcel.code_colis)}
                                                                disabled={isBulkControlling || validatingCode === parcel.code_colis || !getAgencyForColis(parcel.code_colis)}
                                                                title={!getAgencyForColis(parcel.code_colis) ? "Veuillez sélectionner une agence d'abord" : ""}
                                                                className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all shadow-md active:scale-95 flex items-center gap-2 disabled:opacity-50 ${parcel.is_blocked ? 'bg-amber-500 text-white hover:bg-amber-600 shadow-amber-500/10' : 'bg-slate-900 text-white hover:bg-slate-800 shadow-slate-900/10'}`}
                                                            >
                                                                {validatingCode === parcel.code_colis ? <Loader2 size={12} className="animate-spin" /> : (parcel.is_blocked ? <ShieldCheck size={12} /> : <PackageCheck size={12} />)}
                                                                {parcel.is_blocked ? 'Débloquer & Réceptionner' : 'Réceptionner'}
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                            {/* Separator after the expedition block (after its parcels) */}
                                            <tr>
                                                <td colSpan="7" className="px-0">
                                                    <div className="h-px bg-slate-200 w-full" />
                                                </td>
                                            </tr>
                                        </tbody>
                                    );
                                })}
                            </table>
                        </div>

                        {/* ── Mobile Cards View ── */}
                        <div className="md:hidden space-y-4 p-2">
                            {groupedParcels.map((group) => {
                                const TypeIcon = getTypeIcon(group.expedition?.type_expedition);
                                return (
                                    <div key={group.id} className="bg-slate-50/50 rounded-xl border border-slate-200 overflow-hidden">
                                        {/* Groupe header mobile */}
                                        <div className="px-3 py-3 bg-slate-100/50 border-b border-slate-200 flex items-center gap-3">
                                            <div className="flex-1 min-w-0">
                                                <span className="text-xs font-bold text-slate-700 flex items-center gap-1 truncate">
                                                    <Truck size={12} className="shrink-0" />
                                                    {group.expedition?.reference || 'Sans ref'}
                                                </span>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-xs text-slate-500 font-bold uppercase">
                                                        {group.expedition?.pays_depart} → {group.expedition?.destinataire?.ville}
                                                    </span>
                                                </div>
                                            </div>
                                            <span className="text-xs font-bold bg-white px-1.5 py-0.5 rounded border border-slate-200 text-slate-500 shrink-0">
                                                {group.parcels.length} colis
                                            </span>
                                        </div>

                                        {/* Liste colis mobile */}
                                        <div className="divide-y divide-slate-200">
                                            {group.parcels.map((parcel) => {
                                                const isSelected = selectedCodes.includes(parcel.code_colis);
                                                return (
                                                    <div
                                                        key={parcel.id}
                                                        className={`p-4 space-y-4 transition-colors ${isSelected ? 'bg-indigo-50/50' : 'bg-white'} active:bg-slate-50`}
                                                        onClick={() => toggleSelect(parcel.code_colis)}
                                                    >
                                                        <div className="flex items-start">
                                                            <div className="flex gap-3 w-full min-w-0">
                                                                <div className="flex items-center shrink-0">
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={isSelected}
                                                                        onChange={(e) => {
                                                                            e.stopPropagation();
                                                                            toggleSelect(parcel.code_colis);
                                                                        }}
                                                                        className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600 cursor-pointer"
                                                                    />
                                                                </div>
                                                                <div className="min-w-0 flex-1">
                                                                    <div className="flex items-center gap-2">
                                                                        <p className="font-bold text-slate-800 text-sm truncate">{parcel.code_colis}</p>
                                                                        {parcel.is_blocked && (
                                                                            <span className="px-1.5 py-0.5 rounded-full bg-rose-50 text-rose-600 text-xs border border-rose-100 uppercase font-bold shrink-0">Bloqué</span>
                                                                        )}
                                                                    </div>
                                                                    <p className="text-xs font-bold text-slate-400 uppercase mt-0.5 truncate">
                                                                        {parcel.designation || 'Sans désignation'}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="flex gap-2">
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleViewParcel(parcel);
                                                                }}
                                                                className="flex-1 px-4 py-2 bg-slate-100 text-slate-900 rounded-lg text-xs font-bold uppercase active:scale-95 transition-transform flex items-center justify-center gap-2"
                                                            >
                                                                <Eye size={13} />
                                                                Détails
                                                            </button>

                                                            {!parcel.is_received_by_backoffice ? (
                                                                <div className="flex items-center gap-2">
                                                                    {parcel.agence_destination_id && (
                                                                        <span
                                                                            title="Assigné — en attente d'arrivée au backoffice"
                                                                            className="px-3 py-1 text-xs font-semibold bg-amber-100 text-amber-700 rounded-full uppercase"
                                                                        >
                                                                            Assigné
                                                                        </span>
                                                                    )}

                                                                    <button
                                                                        onClick={() => handleSingleReceive(parcel.code_colis)}
                                                                        className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center gap-2"
                                                                    >
                                                                        <PackageCheck className="h-4 w-4" />
                                                                        RÉCEPTIONNER
                                                                    </button>
                                                                </div>
                                                            ) : (
                                                                <span className="px-4 py-2 bg-emerald-100 text-emerald-700 rounded-lg text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                                                                    <Check className="h-4 w-4" />
                                                                    REÇU
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            {/* MOBILE FLOATING ACTION BAR */}
            {selectedCodes.length > 0 && (
                <div className="md:hidden fixed bottom-4 left-4 right-4 z-50 animate-in slide-in-from-bottom-10 duration-300">
                    <div className="bg-slate-900 text-white rounded-lg shadow-2xl shadow-slate-900/40 p-2 flex items-center justify-between border border-white/10 backdrop-blur-lg">
                        <div className="flex flex-col min-w-0 pr-2">
                            <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Sélection</span>
                            <span className="text-xs font-bold truncate">{selectedCodes.length} colis</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => setSelectedCodes([])}
                                className="px-2 py-2 text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-white transition-colors"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={handleBulkBlock}
                                disabled={isBulkReceiving || isBulkBlocking}
                                className="px-3 py-2 border border-rose-500/30 text-rose-500 rounded-lg text-xs font-bold uppercase tracking-widest active:scale-95 transition-all disabled:opacity-50"
                            >
                                {isBulkBlocking ? <Loader2 size={12} className="animate-spin" /> : <AlertCircle size={12} />}
                                Écarter
                            </button>
                            <button
                                onClick={handleBulkReceive}
                                disabled={isBulkReceiving || isBulkBlocking}
                                className="bg-emerald-600 text-white px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-widest flex items-center gap-2 active:scale-95 transition-all disabled:opacity-50 shadow-lg shadow-emerald-900/40"
                            >
                                {isBulkReceiving ? <Loader2 size={12} className="animate-spin" /> : <PackageCheck size={12} />}
                                Réceptionner
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* QR SCANNER MODAL */}
            <Modal
                isOpen={isQRScannerOpen}
                onClose={() => setIsQRScannerOpen(false)}
                title="Scanner un Colis"
                subtitle="Utilisez votre caméra pour scanner le QR Code du colis"
                size="md"
            >
                <QRScanner
                    onScanSuccess={handleScanSuccess}
                    onScanError={(err) => console.log(err)}
                />
            </Modal>

            {/* AGENCY SELECTION MODAL */}
            <Modal
                isOpen={isAgencyModalOpen}
                onClose={() => {
                    setIsAgencyModalOpen(false);
                    setPendingAction(null);
                }}
                title="Assignation de l'Agence de Réception"
                subtitle={pendingAction?.codes.length === 1 
                    ? "Sélectionnez l'agence qui recevra ce colis"
                    : `Sélectionnez les agences pour ces ${pendingAction?.codes.length} colis`
                }
                size={pendingAction?.codes.length === 1 ? "sm" : "lg"}
                onConfirm={confirmReceive}
                confirmDisabled={!areAllSelectedColisAssigned()}
                isLoading={isBulkReceiving}
                confirmLabel="Confirmer"
            >
                <div className="space-y-4">
                    {pendingAction?.codes.length === 1 ? (
                        // Single colis - simple dropdown
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                                Agence de destination
                            </label>
                            <select
                                value={getAgencyForColis(pendingAction?.codes?.[0])}
                                onChange={(e) => setAgencyForColis(pendingAction?.codes?.[0], e.target.value)}
                                className="w-full bg-white border border-slate-200 rounded-lg px-4 py-3 text-sm font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900 transition-all"
                            >
                                <option value="">Sélectionner une agence...</option>
                                {agences.map(agency => (
                                    <option key={agency.id} value={agency.id}>
                                        {agency.nom_agence} ({agency.ville}, {agency.adresse})
                                    </option>
                                ))}
                            </select>
                        </div>
                    ) : (
                        // Multiple colis - list with dropdown for each
                        <div className="space-y-3 max-h-[50vh] overflow-y-auto">
                            <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg flex items-start gap-3">
                                <AlertCircle className="text-blue-500 shrink-0 mt-0.5" size={16} />
                                <div className="text-xs text-blue-700 font-medium">
                                    Assignez une agence à chaque colis pour procéder à la réception.
                                </div>
                            </div>
                            
                            {pendingAction?.codes?.map((code) => {
                                const parcel = filteredParcels.find(p => p.code_colis === code);
                                
                                return (
                                    <div key={code} className="p-3 border border-slate-200 rounded-lg space-y-2">
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-bold text-slate-900">{code}</p>
                                                <p className="text-xs text-slate-500 font-medium truncate">
                                                    {parcel?.designation || 'Sans désignation'}
                                                </p>
                                            </div>
                                        </div>
                                        <select
                                            value={getAgencyForColis(code)}
                                            onChange={(e) => setAgencyForColis(code, e.target.value)}
                                            className={`w-full bg-white border rounded-lg px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900 transition-all ${
                                                getAgencyForColis(code) ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200'
                                            }`}
                                        >
                                            {agences.length === 0 ? (
                                                <option value="" disabled>Chargement des agences...</option>
                                            ) : (
                                                <option value="">Sélectionner...</option>
                                            )}
                                            {agences.map(agency => (
                                                <option key={agency.id} value={agency.id}>
                                                    {agency.nom_agence} ({agency.ville})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </Modal>

            {/* BLOCK MODAL */}
            <Modal
                isOpen={isBlockModalOpen}
                onClose={() => setIsBlockModalOpen(false)}
                title="Écarter / Bloquer les colis"
                subtitle={`${selectedCodes.length} colis sélectionnés`}
                size="sm"
                onConfirm={confirmBlockParcels}
                confirmDisabled={!blockReason.trim()}
                isLoading={isBulkBlocking}
                confirmVariant="danger"
                confirmLabel="Confirmer le blocage"
            >
                <div className="space-y-4">
                    <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl flex items-start gap-3">
                        <AlertCircle className="text-rose-500 shrink-0 mt-0.5" size={18} />
                        <p className="text-xs font-medium text-rose-800 leading-relaxed">
                            Vous allez bloquer <strong>{selectedCodes.length} colis</strong>. Veuillez préciser le motif qui sera appliqué à l'ensemble de la sélection.
                        </p>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">Motif du blocage</label>
                        <textarea
                            value={blockReason}
                            onChange={(e) => setBlockReason(e.target.value)}
                            placeholder="Précisez la raison de l'écartement..."
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-700 focus:outline-none focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900 transition-all min-h-[120px] resize-none"
                        />
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default IncomingParcels;
