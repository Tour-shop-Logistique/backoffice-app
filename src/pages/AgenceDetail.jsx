import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
    fetchAgences,
    fetchAgenceTarifsGroupage,
    fetchAgenceTarifsSimple,
    fetchAgenceExpeditions,
    clearCurrentAgency,
    setCurrentAgence
} from "../redux/slices/agenceSlice";
import {
    MapPin,
    Phone,
    Globe,
    Building2,
    ArrowLeft,
    RefreshCw,
    MapPinned,
    Clock,
    Info,
    ChevronRight,
    Loader2,
    PackageCheck,
    ListOrdered,
    Package,
    Layers,
    Truck,
    MapPin as MapPinIcon,
    Tag,
    Calendar,
    User,
    CreditCard,
    ChevronLeft,
    Search,
    Eye,
    AlertCircle,
    CheckCircle2,
    Mail,
    Smartphone,
    Box,
    FileText,
    BadgeCheck,
    CreditCard as PaymentIcon
} from "lucide-react";
import Modal from "../components/common/Modal";

const AgenceDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();

    // Helper functions moved up to avoid ReferenceError
    const getTypeLabel = (type) => {
        if (!type) return 'N/A';
        switch (type.toUpperCase()) {
            case 'SIMPLE': return 'Simple';
            case 'GROUPAGE_DHD_AERIEN': return 'DHD Aérien';
            case 'GROUPAGE_DHD_MARITIME': return 'DHD Maritime';
            case 'GROUPAGE_AFRIQUE': return 'Afrique';
            case 'GROUPAGE_CA': return 'Colis Accompagné';
            default: return type.replace('groupage_', '').replace('_', ' ');
        }
    };

    const getStatusStyles = (status) => {
        switch (status?.toLowerCase()) {
            case 'accepted': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
            case 'pending':
            case 'en_attente': return 'bg-amber-50 text-amber-700 border-amber-100';
            case 'rejected':
            case 'cancelled': return 'bg-rose-50 text-rose-700 border-rose-100';
            default: return 'bg-slate-50 text-slate-700 border-slate-100';
        }
    };

    const getStatusLabel = (status) => {
        switch (status?.toLowerCase()) {
            case 'accepted': return 'Acceptée';
            case 'pending':
            case 'en_attente': return 'En attente';
            case 'rejected': return 'Rejetée';
            case 'cancelled': return 'Annulée';
            default: return status || 'N/A';
        }
    };

    const {
        agences,
        currentAgence: storedAgence,
        isLoading,
        isLoadingTarifs,
        currentAgencyTarifsGroupage,
        currentAgencyTarifsSimple,
        currentAgencyExpeditions,
        expeditionsMeta,
        isLoadingExpeditions,
        hasLoaded,
        error
    } = useSelector((state) => state.agences);

    // Optimisation : Récupération immédiate (Cache)
    const currentAgence = React.useMemo(() => {
        const found = agences?.find(a => String(a.id) === String(id));
        return found || storedAgence;
    }, [agences, id, storedAgence]);

    const [activeTab, setActiveTab] = useState("details");
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedExpedition, setSelectedExpedition] = useState(null);
    const [isLogoLoading, setIsLogoLoading] = useState(true);

    // États pour la recherche locale
    const [simpleSearch, setSimpleSearch] = useState("");
    const [groupageSearch, setGroupageSearch] = useState("");
    const [expeditionSearch, setExpeditionSearch] = useState("");

    // Filtrage local des tarifs simples
    const filteredSimpleTariffs = React.useMemo(() => {
        if (!currentAgencyTarifsSimple) return [];
        const term = simpleSearch.toLowerCase().trim();
        if (!term) return currentAgencyTarifsSimple;
        return currentAgencyTarifsSimple.filter(t =>
            t.indice?.toLowerCase().includes(term) ||
            t.zone?.nom?.toLowerCase().includes(term) ||
            t.pays?.toLowerCase().includes(term)
        );
    }, [currentAgencyTarifsSimple, simpleSearch]);

    // Filtrage local des tarifs groupages
    const filteredGroupageTariffs = React.useMemo(() => {
        if (!currentAgencyTarifsGroupage) return [];
        const term = groupageSearch.toLowerCase().trim();
        if (!term) return currentAgencyTarifsGroupage;
        return currentAgencyTarifsGroupage.filter(t =>
            getTypeLabel(t.type_expedition).toLowerCase().includes(term) ||
            t.ligne?.toLowerCase().includes(term) ||
            t.pays?.toLowerCase().includes(term) ||
            t.category?.nom?.toLowerCase().includes(term)
        );
    }, [currentAgencyTarifsGroupage, groupageSearch]);

    // Filtrage local des expéditions
    const filteredExpeditions = React.useMemo(() => {
        if (!currentAgencyExpeditions) return [];
        const term = expeditionSearch.toLowerCase().trim();
        if (!term) return currentAgencyExpeditions;
        return currentAgencyExpeditions.filter(e =>
            e.reference?.toLowerCase().includes(term) ||
            e.expediteur?.nom_prenom?.toLowerCase().includes(term) ||
            e.destinataire?.nom_prenom?.toLowerCase().includes(term) ||
            e.pays_depart?.toLowerCase().includes(term) ||
            e.pays_destination?.toLowerCase().includes(term)
        );
    }, [currentAgencyExpeditions, expeditionSearch]);

    useEffect(() => {
        if (currentAgence?.logo) {
            setIsLogoLoading(true);
        }
    }, [currentAgence?.logo]);

    // 1. Charger la liste globale si non présente
    useEffect(() => {
        if (!hasLoaded) {
            dispatch(fetchAgences());
        }
    }, [dispatch, hasLoaded]);

    // 2. Extraire l'agence spécifique de la liste existante
    useEffect(() => {
        if (hasLoaded && id && agences.length > 0) {
            const agence = agences.find(a => String(a.id) === String(id));
            if (agence) {
                dispatch(setCurrentAgence(agence));
            }
        }
    }, [dispatch, id, agences, hasLoaded]);

    // 3. Charger TOUS les tarifs simultanément dès l'arrivée
    useEffect(() => {
        if (id) {
            // On lance les deux en même temps
            if (currentAgencyTarifsGroupage.length === 0) {
                dispatch(fetchAgenceTarifsGroupage(id));
            }
            if (currentAgencyTarifsSimple.length === 0) {
                dispatch(fetchAgenceTarifsSimple(id));
            }
        }
    }, [dispatch, id]);

    // 4. Charger les expéditions quand on change d'onglet ou de page (seulement si nécessaire)
    useEffect(() => {
        if (id && activeTab === "expeditions") {
            const hasData = currentAgencyExpeditions.length > 0;
            const isSamePage = expeditionsMeta?.current_page === currentPage;

            if (!hasData || !isSamePage) {
                dispatch(fetchAgenceExpeditions({ agenceId: id, page: currentPage }));
            }
        }
    }, [dispatch, id, activeTab, currentPage, currentAgencyExpeditions.length, expeditionsMeta?.current_page]);

    // Cleanup au démontage
    useEffect(() => {
        return () => {
            dispatch(clearCurrentAgency());
        };
    }, [dispatch]);



    const handleBack = (e) => {
        if (e) e.preventDefault();
        // Si on a un historique (longueur > 2 car l'entrée actuelle + la précédente)
        if (window.history.length > 2) {
            navigate(-1);
        } else {
            // Fallback sécurisé vers la liste des agences
            navigate('/agence-partenaire');
        }
    };

    if (isLoading && !currentAgence) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <Loader2 className="h-10 w-10 text-slate-900 animate-spin mb-4" />
                <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.2em]">Chargement des données...</p>
            </div>
        );
    }

    if (error && !currentAgence) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
                <div className="bg-rose-50 p-4 rounded-full mb-4">
                    <Building2 className="text-rose-500" size={32} />
                </div>
                <h2 className="text-xl font-bold text-slate-900 mb-2">Impossible de charger l'agence</h2>
                <p className="text-slate-500 max-w-md mx-auto mb-6">{error}</p>
                <button
                    onClick={() => navigate(-1)}
                    className="inline-flex items-center gap-2 px-6 py-2 bg-slate-900 text-white rounded-xl text-sm font-semibold transition-all hover:bg-slate-800"
                >
                    <ArrowLeft size={16} /> Retour
                </button>
            </div>
        );
    }

    if (!currentAgence) return null;

    return (
        <div className="space-y-6 pb-20 font-sans max-w-7xl mx-auto">
            {/* Header / Nav */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <button
                        onClick={handleBack}
                        className="relative z-10 p-2 bg-white border border-slate-200 text-slate-400 hover:text-slate-900 hover:border-slate-300 rounded-lg transition-all shadow-sm active:scale-95"
                        aria-label="Retour"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
                                {currentAgence.nom_agence}
                            </h1>
                        </div>
                        <p className="text-xs md:text-sm text-slate-500 mt-0.5 flex items-center gap-1.5">
                            <span className="text-slate-400 ml-1">Inscrit depuis le {new Date(currentAgence.created_at).toLocaleDateString()}</span>
                        </p>
                    </div>
                </div>
            </div>

            {/* Main Tabs */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="border-b border-slate-100 bg-slate-50/50 px-4 md:px-8 flex items-center justify-between">
                    <div className="flex gap-8 overflow-x-auto no-scrollbar">
                        {[
                            { id: 'details', label: 'Détails & Infos', icon: Info },
                            { id: 'tarifs_simple', label: 'Tarifs Simple', icon: Package },
                            { id: 'tarifs_groupage', label: 'Tarifs Groupage', icon: Layers },
                            { id: 'expeditions', label: 'Expéditions', icon: Truck }
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`py-4 md:py-5 text-[10px] md:text-xs font-bold uppercase tracking-[0.1em] border-b-2 transition-all whitespace-nowrap flex items-center gap-2 ${activeTab === tab.id
                                    ? 'border-slate-900 text-slate-900'
                                    : 'border-transparent text-slate-400 hover:text-slate-600'
                                    }`}
                            >
                                <tab.icon size={14} />
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Manual Refresh Button for Tariffs & Expeditions */}
                    {(activeTab === 'tarifs_groupage' || activeTab === 'tarifs_simple' || activeTab === 'expeditions') && (
                        <button
                            onClick={() => {
                                if (activeTab === 'tarifs_groupage') dispatch(fetchAgenceTarifsGroupage(id));
                                else if (activeTab === 'tarifs_simple') dispatch(fetchAgenceTarifsSimple(id));
                                else dispatch(fetchAgenceExpeditions({ agenceId: id, page: currentPage }));
                            }}
                            disabled={isLoadingTarifs || isLoadingExpeditions}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-slate-900 hover:border-slate-300 transition-all shadow-sm active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed group"
                            title="Rafraîchir les données"
                        >
                            <RefreshCw size={14} className={`${(isLoadingTarifs || isLoadingExpeditions) ? 'animate-spin text-slate-900' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
                            <span className="text-[10px] font-bold uppercase tracking-wider hidden md:inline">Rafraîchir</span>
                        </button>
                    )}
                </div>

                {/* Content Area */}
                <div className="p-4 md:p-8">
                    {activeTab === "details" && (
                        <div className="flex flex-col lg:flex-row gap-4 md:gap-6">
                            {/* Left Pane: Summary Card */}
                            <div className="md:w-80 shrink-0 space-y-6">
                                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                                    <div className="bg-slate-50 border-b border-slate-100 p-4">
                                        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Identité Partenaire</h3>
                                    </div>
                                    <div className="p-4">
                                        <div className="flex flex-row justify-start items-center">
                                            {currentAgence.logo ? (
                                                <div className="h-20 w-20 rounded-lg border border-slate-100 bg-white shadow-sm flex items-center justify-center relative overflow-hidden">
                                                    {isLogoLoading && (
                                                        <div className="absolute inset-0 flex items-center justify-center bg-slate-50 z-10">
                                                            <Loader2 size={20} className="animate-spin text-slate-300" />
                                                        </div>
                                                    )}
                                                    <img
                                                        src={currentAgence.logo?.startsWith('http')
                                                            ? currentAgence.logo
                                                            : `${import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '')}/storage/${currentAgence.logo}`}
                                                        alt="Logo"
                                                        onLoad={() => setIsLogoLoading(false)}
                                                        onError={() => setIsLogoLoading(false)}
                                                        className={`max-h-full max-w-full object-contain transition-opacity duration-300 ${isLogoLoading ? 'opacity-0' : 'opacity-100'}`}
                                                    />
                                                </div>
                                            ) : (
                                                <div className="h-20 w-20 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-300">
                                                    <Building2 size={32} />
                                                </div>
                                            )}
                                            <div className="flex flex-col items-start ml-4">
                                                <h4 className="font-bold text-slate-900 text-lg">{currentAgence.nom_agence}</h4>
                                                <p className="text-xs font-bold text-slate-500 mt-1">Code Agence : {currentAgence.code_agence || 'AGN-001'}</p>
                                            </div>
                                        </div>

                                        <div className="space-y-4 mt-4 border-t border-slate-200 pt-4">
                                            <div className="space-y-1">
                                                <p className="text-[10px] font-bold text-slate-400 uppercase">Téléphone</p>
                                                <p className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                                                    <Phone size={14} className="text-slate-400" /> {currentAgence.telephone}
                                                </p>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-[10px] font-bold text-slate-400 uppercase">Localisation</p>
                                                <p className="text-sm font-semibold text-slate-900 flex items-start gap-2 leading-snug">
                                                    <MapPin size={14} className="text-slate-400 mt-0.5" />
                                                    <span>{currentAgence.ville}, {currentAgence.commune}</span>
                                                </p>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-[10px] font-bold text-slate-400 uppercase">Bureau physique</p>
                                                <p className="text-sm font-semibold text-slate-900 flex items-start gap-2 leading-snug">
                                                    <MapPinned size={14} className="text-slate-400 mt-0.5" />
                                                    <span>{currentAgence.adresse}</span>
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Right Pane: Content Workspace */}
                            <div className="flex-1 space-y-6">
                                {/* Section: Profil & Message */}
                                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden divide-y divide-slate-100">
                                    <div className="p-4">
                                        <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-3">
                                            <Info size={16} className="text-slate-400" />
                                            <h3 className="text-sm font-bold text-slate-900">Description détaillée</h3>
                                        </div>
                                        <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                                            {currentAgence.description || "Aucune description enregistrée pour ce partenaire logistique."}
                                        </p>
                                    </div>

                                    {currentAgence.message_accueil && (
                                        <div className="p-6 bg-slate-50/30">
                                            <div className="border-l-4 border-slate-900 pl-4 py-1">
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Message client</p>
                                                <p className="text-sm font-semibold text-slate-700 italic">
                                                    "{currentAgence.message_accueil}"
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    <div className="p-4">
                                        <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-3">
                                            <Clock size={16} className="text-slate-400" />
                                            <h3 className="text-sm font-bold text-slate-900">Horaires de fonctionnement</h3>
                                        </div>
                                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                            {currentAgence.horaires?.map((h, idx) => (
                                                <div key={idx} className="p-3 bg-white border border-slate-100 rounded-lg shadow-sm flex flex-col items-center justify-center gap-1">
                                                    <span className="text-xs font-bold text-slate-400 uppercase">{h.jour}</span>
                                                    {h.ferme ? (
                                                        <span className="text-xs font-bold text-rose-500 uppercase tracking-tighter">Fermé</span>
                                                    ) : (
                                                        <div className="flex items-center gap-1 text-xs font-bold text-slate-800">
                                                            <span>{h.ouverture}</span>
                                                            <span>-</span>
                                                            <span>{h.fermeture}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {(activeTab === "tarifs_groupage" || activeTab === "tarifs_simple") && (
                        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                            {isLoadingTarifs ? (
                                <div className="flex flex-col items-center justify-center py-32 opacity-50">
                                    <RefreshCw size={32} className="animate-spin text-slate-400 mb-4" />
                                    <span className="text-xs font-semibold text-center text-slate-400">Actualisation de la grille tarifaire...</span>
                                </div>
                            ) : (
                                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                                    {/* Barre de recherche locale pour les tarifs */}
                                    <div className="p-4 border-b border-slate-100 bg-slate-50/10">
                                        <div className="relative group max-w-md">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-slate-900 transition-colors" />
                                            <input
                                                type="text"
                                                placeholder={activeTab === 'tarifs_simple' ? "Rechercher par indice ou zone..." : "Rechercher par type, ligne ou pays..."}
                                                value={activeTab === 'tarifs_simple' ? simpleSearch : groupageSearch}
                                                onChange={(e) => activeTab === 'tarifs_simple' ? setSimpleSearch(e.target.value) : setGroupageSearch(e.target.value)}
                                                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900 transition-all placeholder:text-slate-400"
                                            />
                                        </div>
                                    </div>

                                    {(activeTab === "tarifs_groupage" ? filteredGroupageTariffs : filteredSimpleTariffs).length === 0 ? (
                                        <div className="py-24 text-center bg-slate-50/50">
                                            <div className="h-16 w-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100 shadow-sm text-slate-300">
                                                <Tag size={32} />
                                            </div>
                                            <p className="text-slate-400 text-sm font-semibold italic">Aucune donnée tarifaire spécifique ne correspond à cette agence.</p>
                                        </div>
                                    ) : (
                                        <>
                                            {/* Desktop Table */}
                                            <div className="hidden md:block overflow-x-auto">
                                                <table className="w-full text-left border-collapse">
                                                    <thead>
                                                        <tr className="bg-slate-50/50 border-b border-slate-200">
                                                            {activeTab === 'tarifs_groupage' ? (
                                                                <>
                                                                    <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Type / Catégorie</th>
                                                                    <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Itinéraire / Pays</th>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Indice</th>
                                                                    <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Destination</th>
                                                                </>
                                                            )}
                                                            <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Montant Base</th>
                                                            <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Prestation</th>
                                                            <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Total</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-100">
                                                        {(activeTab === "tarifs_groupage" ? filteredGroupageTariffs : filteredSimpleTariffs).map((tarif) => (
                                                            <tr key={tarif.id} className="hover:bg-slate-50/30 transition-colors">
                                                                <td className="px-6 py-4">
                                                                    {activeTab === 'tarifs_groupage' ? (
                                                                        <div className="flex flex-col">
                                                                            <span className={`text-xs font-bold px-2 py-1 rounded uppercase w-fit ${tarif.type_expedition?.includes('aerien') ? 'bg-blue-100 text-blue-700' :
                                                                                tarif.type_expedition?.includes('maritime') ? 'bg-indigo-100 text-indigo-700' :
                                                                                    tarif.type_expedition?.includes('afrique') ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                                                                                }`}>
                                                                                {getTypeLabel(tarif.type_expedition)}
                                                                            </span>
                                                                            {tarif.category && <span className="text-slate-900 font-semibold text-sm mt-1">
                                                                                →  {tarif.category?.nom}
                                                                            </span>}
                                                                        </div>
                                                                    ) : (
                                                                        <div className="inline-flex items-center justify-center px-3 py-1 rounded bg-blue-50 text-blue-700 font-bold text-xs border border-blue-100">
                                                                            {tarif.indice || 'N/A'}
                                                                        </div>
                                                                    )}
                                                                </td>
                                                                <td className="px-6 py-4">
                                                                    <div className="flex items-center gap-2">
                                                                        {activeTab === 'tarifs_groupage' && tarif.ligne ? (
                                                                            <Package size={14} className="text-slate-400" />
                                                                        ) : (
                                                                            <MapPinIcon size={14} className="text-slate-400" />
                                                                        )}
                                                                        <span className="font-semibold text-slate-700 uppercase text-xs">
                                                                            {activeTab === 'tarifs_groupage'
                                                                                ? (tarif.ligne ? tarif.ligne.replace('-', ' → ') : (tarif.pays || 'N/A'))
                                                                                : (tarif.zone?.nom || tarif.pays || 'Non définie')
                                                                            }
                                                                        </span>
                                                                    </div>
                                                                </td>
                                                                <td className="px-6 py-4">
                                                                    <span className="font-semibold text-slate-600 text-sm">
                                                                        {Number(tarif.montant_base).toLocaleString()} <span className="text-[10px] text-slate-400 uppercase">CFA</span>
                                                                    </span>
                                                                </td>
                                                                <td className="px-6 py-4">
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="inline-flex items-center px-2 py-0.5 rounded bg-orange-50 text-orange-700 border border-orange-100 font-bold text-xs">
                                                                            {tarif.pourcentage_prestation}%
                                                                        </span>
                                                                        <span className="text-slate-400 text-xs font-semibold">
                                                                            ({Number(tarif.montant_prestation).toLocaleString()} <span className="text-[10px]">CFA</span>)
                                                                        </span>
                                                                    </div>
                                                                </td>
                                                                <td className="px-6 py-4">
                                                                    <div className="flex flex-col">
                                                                        <span className="text-green-600 font-bold text-base tracking-tight">
                                                                            {Number(tarif.montant_expedition).toLocaleString()} <span className="text-[10px] text-slate-400 uppercase font-semibold">CFA</span>
                                                                        </span>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>

                                            {/* Mobile Cards */}
                                            <div className="md:hidden divide-y divide-slate-100">
                                                {(activeTab === "tarifs_groupage" ? filteredGroupageTariffs : filteredSimpleTariffs).map((tarif) => {
                                                    const mb = parseFloat(tarif.montant_base) || 0;
                                                    const pp = parseFloat(tarif.pourcentage_prestation) || 0;
                                                    const mp = mb * (pp / 100);
                                                    const total = mb + mp;

                                                    if (activeTab === 'tarifs_simple') {
                                                        return (
                                                            <div key={tarif.id} className="p-3 space-y-2.5 active:bg-slate-50 transition-colors">
                                                                <div className="flex items-start justify-between gap-2">
                                                                    <div className="flex items-center gap-2.5 min-w-0">
                                                                        <div className="px-2 py-1 rounded bg-blue-100 text-slate-700 font-bold text-xs border border-slate-200 shrink-0">
                                                                            {tarif.indice}
                                                                        </div>
                                                                        <div className="min-w-0">
                                                                            <p className="font-semibold text-slate-900 text-xs truncate uppercase  pb-1">
                                                                                {tarif.zone?.nom || tarif.pays || '?'}
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                <div className="grid grid-cols-2 gap-2">
                                                                    <div className="bg-slate-50 rounded-lg p-2.5 flex flex-col items-center justify-center border border-slate-100">
                                                                        <span className="text-[9px] text-slate-400 font-bold uppercase mb-0.5">Montant Base</span>
                                                                        <span className="text-xs font-semibold text-slate-700">{mb.toLocaleString()} CFA</span>
                                                                    </div>
                                                                    <div className="bg-slate-50 rounded-lg p-2.5 flex flex-col items-center justify-center border border-slate-100">
                                                                        <span className="text-[9px] text-slate-400 font-bold uppercase mb-0.5">Prestation ({pp}%)</span>
                                                                        <div className="flex flex-row items-center gap-2">
                                                                            <span className="text-xs font-semibold text-orange-600">{mp.toLocaleString()} CFA</span>
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold">
                                                                    TOTAL : <span className="text-green-600">
                                                                        {total.toLocaleString()} CFA
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        );
                                                    }

                                                    // Design Groupage
                                                    return (
                                                        <div key={tarif.id} className="p-3 space-y-2.5 active:bg-slate-50 transition-colors">
                                                            <div className="flex items-start justify-between gap-2">
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="flex items-center gap-2 mb-2">
                                                                        <span className={`text-xs font-bold px-2 py-0.5 rounded uppercase ${tarif.type_expedition?.includes('aerien') ? 'bg-blue-100 text-blue-700' :
                                                                            tarif.type_expedition?.includes('maritime') ? 'bg-indigo-100 text-indigo-700' :
                                                                                tarif.type_expedition?.includes('afrique') ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                                                                            }`}>
                                                                            {getTypeLabel(tarif.type_expedition)}
                                                                        </span>
                                                                        {tarif.category && (
                                                                            <span className="text-xs font-semibold text-blue-600">
                                                                                {tarif.category?.nom}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    <div className="flex items-center">
                                                                        <p className="text-xs text-slate-500 font-bold uppercase truncate">
                                                                            {tarif.ligne ? tarif.ligne.replace('-', ' → ') : (tarif.pays || 'Ligne ?')}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <div className="grid grid-cols-2 gap-2">
                                                                <div className="bg-slate-50 rounded-lg p-2.5 flex flex-col items-center justify-center border border-slate-100">
                                                                    <span className="text-[9px] text-slate-400 font-bold uppercase mb-0.5">Montant Base</span>
                                                                    <span className="text-xs font-semibold text-slate-700">{mb.toLocaleString()} CFA</span>
                                                                </div>
                                                                <div className="bg-slate-50 rounded-lg p-2.5 flex flex-col items-center justify-center border border-slate-100">
                                                                    <span className="text-[9px] text-slate-400 font-bold uppercase mb-0.5">Prestation ({pp}%)</span>
                                                                    <span className="text-xs font-semibold text-orange-600">
                                                                        {mp.toLocaleString()} CFA
                                                                    </span>
                                                                </div>
                                                            </div>

                                                            <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold">
                                                                TOTAL : <span className="text-green-600">
                                                                    {total.toLocaleString()} CFA
                                                                </span>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === "expeditions" && (
                        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-4">
                            {isLoadingExpeditions ? (
                                <div className="bg-white rounded-xl border border-slate-200 py-32 flex flex-col items-center justify-center">
                                    <Loader2 size={40} className="animate-spin text-slate-300 mb-4" />
                                    <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">Récupération des expéditions...</p>
                                </div>
                            ) : currentAgencyExpeditions.length === 0 ? (
                                <div className="bg-white rounded-xl border border-slate-200 py-24 text-center">
                                    <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100 shadow-sm text-slate-300">
                                        <Truck size={32} />
                                    </div>
                                    <h3 className="text-slate-900 font-bold text-lg">Aucune expédition</h3>
                                    <p className="text-slate-500 text-sm max-w-sm mx-auto mt-2 italic">
                                        Cette agence n'a pas encore enregistré d'expéditions.
                                    </p>
                                </div>
                            ) : (
                                <>
                                    {/* Barre de recherche locale pour les expéditions */}
                                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                                        <div className="relative group max-w-md">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-slate-900 transition-colors" />
                                            <input
                                                type="text"
                                                placeholder="Rechercher par référence, expéditeur ou destinataire..."
                                                value={expeditionSearch}
                                                onChange={(e) => setExpeditionSearch(e.target.value)}
                                                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900 transition-all placeholder:text-slate-400"
                                            />
                                        </div>
                                    </div>

                                    {filteredExpeditions.length === 0 ? (
                                        <div className="bg-white rounded-xl border border-slate-200 py-24 text-center">
                                            <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100 shadow-sm text-slate-300">
                                                <Search size={32} />
                                            </div>
                                            <h3 className="text-slate-900 font-bold text-lg">Aucun résultat</h3>
                                            <p className="text-slate-500 text-sm max-w-sm mx-auto mt-2 italic">
                                                Aucune expédition ne correspond à votre recherche locale.
                                            </p>
                                        </div>
                                    ) : (
                                        <>
                                            {/* Desktop View */}
                                            <div className="hidden md:block bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                                                <table className="w-full text-left border-collapse">
                                                    <thead>
                                                        <tr className="bg-slate-50/50 border-b border-slate-200">
                                                            <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-widest">Référence / Date</th>
                                                            <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-widest">Type</th>
                                                            <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-widest">Trajet</th>
                                                            <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-widest">Acteurs</th>
                                                            <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-widest text-right">Montant</th>
                                                            <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-widest text-center">Statuts</th>
                                                            <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-widest text-right">Action</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-200 text-sm">
                                                        {filteredExpeditions.map((expo) => (
                                                            <tr key={expo.id} className="hover:bg-slate-50/50 transition-colors group">
                                                                <td className="px-6 py-4">
                                                                    <div className="flex flex-col">
                                                                        <span className="font-semibold text-slate-900 flex items-center gap-1.5">
                                                                            {expo.reference}
                                                                        </span>
                                                                        <span className="text-xs text-slate-400 font-medium flex items-center gap-1 mt-1">
                                                                            <Calendar size={14} />
                                                                            {new Date(expo.created_at).toLocaleDateString()} à {new Date(expo.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                        </span>
                                                                    </div>
                                                                </td>
                                                                <td className="px-6 py-4">
                                                                    <span className={`text-xs font-semibold px-3 py-1 rounded border uppercase ${expo.type_expedition === 'simple' ? 'bg-pink-100 text-pink-700' : expo.type_expedition?.includes('aerien') ? 'bg-blue-100 text-blue-700' :
                                                                        expo.type_expedition?.includes('maritime') ? 'bg-indigo-100 text-indigo-700' :
                                                                            expo.type_expedition?.includes('afrique') ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                                                        {getTypeLabel(expo.type_expedition)}
                                                                    </span>
                                                                </td>
                                                                <td className="px-6 py-4">
                                                                    <div className="flex items-center gap-2">
                                                                        <div className="flex flex-col">
                                                                            <span className="text-xs font-semibold text-slate-900 uppercase">{expo.pays_depart}</span>
                                                                            <div className="h-px bg-slate-300 w-full my-1.5" />
                                                                            <span className="text-xs font-semibold text-slate-900 uppercase">{expo.pays_destination}</span>
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                                <td className="px-6 py-4">
                                                                    <div className="flex flex-col gap-2">
                                                                        <div className="flex items-center gap-2">
                                                                            <div className="h-6 w-6 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-red-600 shrink-0">E</div>
                                                                            <span className="text-xs font-semibold text-slate-700 truncate max-w-[120px]">{expo.expediteur?.nom_prenom}</span>
                                                                        </div>
                                                                        <div className="flex items-center gap-2">
                                                                            <div className="h-6 w-6 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-green-600 shrink-0">D</div>
                                                                            <span className="text-xs font-semibold text-slate-700 truncate max-w-[120px]">{expo.destinataire?.nom_prenom}</span>
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                                <td className="px-6 py-4 text-right">
                                                                    <div className="flex flex-col">
                                                                        <span className="font-semibold text-slate-900">
                                                                            {Number(expo.montant_expedition).toLocaleString()} <span className="text-[10px] font-medium text-slate-400">CFA</span>
                                                                        </span>
                                                                        <span className="text-xs text-slate-400 font-medium">
                                                                            {expo.colis?.length} colis
                                                                        </span>
                                                                    </div>
                                                                </td>
                                                                <td className="px-6 py-4">
                                                                    <div className="flex flex-col items-center gap-1.5">
                                                                        <span className={`text-xs font-semibold px-4 py-1 rounded-lg border  w-fit bg-slate-50 text-slate-500 border-slate-200`}>
                                                                            {getStatusLabel(expo.statut_expedition)}
                                                                        </span>
                                                                    </div>
                                                                </td>
                                                                <td className="px-6 py-4 text-right">
                                                                    <button
                                                                        onClick={() => setSelectedExpedition(expo)}
                                                                        className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all active:scale-90"
                                                                        title="Voir les détails"
                                                                    >
                                                                        <Eye size={18} />
                                                                    </button>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>

                                            {/* Mobile View */}
                                            <div className="md:hidden space-y-4">
                                                {filteredExpeditions.map((expo) => (
                                                    <div
                                                        key={expo.id}
                                                        onClick={() => setSelectedExpedition(expo)}
                                                        className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden active:scale-[0.98] transition-all"
                                                    >
                                                        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                                                            <div className="flex flex-col">
                                                                <span className="text-xs font-bold text-slate-900">{expo.reference}</span>
                                                                <span className="text-[10px] text-slate-400 font-medium">{new Date(expo.created_at).toLocaleDateString()}</span>
                                                            </div>
                                                            <span className={`text-[9px] font-bold px-2 py-1 rounded-full border uppercase tracking-wider ${getStatusStyles(expo.statut_expedition)}`}>
                                                                {getStatusLabel(expo.statut_expedition)}
                                                            </span>
                                                        </div>
                                                        <div className="p-4 space-y-4">
                                                            <div className="flex items-center justify-between">
                                                                <div className="flex flex-col">
                                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 text-left">Expéditeur</span>
                                                                    <span className="text-xs font-bold text-slate-900">{expo.expediteur?.nom_prenom}</span>
                                                                    <span className="text-[10px] text-slate-500">{expo.expediteur?.ville}, {expo.pays_depart}</span>
                                                                </div>
                                                                <ChevronRight size={16} className="text-slate-300" />
                                                                <div className="flex flex-col text-right">
                                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Destinataire</span>
                                                                    <span className="text-xs font-bold text-slate-900">{expo.destinataire?.nom_prenom}</span>
                                                                    <span className="text-[10px] text-slate-500">{expo.destinataire?.ville}, {expo.pays_destination}</span>
                                                                </div>
                                                            </div>

                                                            <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-100">
                                                                <div>
                                                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Montant Total</p>
                                                                    <p className="text-sm font-bold text-slate-900">{Number(expo.montant_expedition).toLocaleString()} CFA</p>
                                                                </div>
                                                                <div className="text-right">
                                                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Paiement</p>
                                                                    <span className={`text-[10px] font-bold ${expo.statut_paiement === 'paye' ? 'text-emerald-500' : 'text-amber-500'}`}>
                                                                        {expo.statut_paiement === 'paye' ? 'Payé' : 'À régler'}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Pagination */}
                                            {expeditionsMeta && expeditionsMeta.last_page > 1 && (
                                                <div className="flex items-center justify-between bg-white px-4 py-3 rounded-2xl border border-slate-200 mt-6 shadow-sm">
                                                    <div className="flex flex-1 justify-between sm:hidden">
                                                        <button
                                                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                                            disabled={currentPage === 1}
                                                            className="relative inline-flex items-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed group transition-all"
                                                        >
                                                            <ChevronLeft size={16} className="mr-1 group-active:-translate-x-1 transition-transform" /> Précédent
                                                        </button>
                                                        <button
                                                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, expeditionsMeta.last_page))}
                                                            disabled={currentPage === expeditionsMeta.last_page}
                                                            className="relative ml-3 inline-flex items-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed group transition-all"
                                                        >
                                                            Suivant <ChevronRight size={16} className="ml-1 group-active:translate-x-1 transition-transform" />
                                                        </button>
                                                    </div>
                                                    <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                                                        <div>
                                                            <p className="text-xs text-slate-500 font-medium">
                                                                Page <span className="font-bold text-slate-900">{currentPage}</span> sur <span className="font-bold text-slate-900">{expeditionsMeta.last_page}</span>
                                                                <span className="mx-2 text-slate-300">|</span>
                                                                Total : <span className="font-bold text-slate-900">{expeditionsMeta.total}</span> expéditions
                                                            </p>
                                                        </div>
                                                        <div>
                                                            <nav className="isolate inline-flex -space-x-px rounded-xl shadow-sm gap-1" aria-label="Pagination">
                                                                <button
                                                                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                                                    disabled={currentPage === 1}
                                                                    className="relative inline-flex items-center rounded-lg px-2 py-2 text-slate-400 hover:bg-slate-50 disabled:opacity-30 transition-all active:scale-90"
                                                                >
                                                                    <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                                                                </button>

                                                                {[...Array(expeditionsMeta.last_page)].map((_, i) => {
                                                                    const pg = i + 1;
                                                                    // Show only first, last, and pages around current
                                                                    if (
                                                                        pg === 1 ||
                                                                        pg === expeditionsMeta.last_page ||
                                                                        (pg >= currentPage - 1 && pg <= currentPage + 1)
                                                                    ) {
                                                                        return (
                                                                            <button
                                                                                key={pg}
                                                                                onClick={() => setCurrentPage(pg)}
                                                                                className={`relative inline-flex items-center px-4 py-2 text-xs font-bold rounded-lg transition-all active:scale-90 ${currentPage === pg
                                                                                    ? 'bg-slate-900 text-white shadow-lg shadow-slate-200'
                                                                                    : 'text-slate-600 hover:bg-slate-50'
                                                                                    }`}
                                                                            >
                                                                                {pg}
                                                                            </button>
                                                                        );
                                                                    } else if (pg === currentPage - 2 || pg === currentPage + 2) {
                                                                        return <span key={pg} className="px-2 py-2 text-slate-300 text-xs font-bold">...</span>;
                                                                    }
                                                                    return null;
                                                                })}

                                                                <button
                                                                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, expeditionsMeta.last_page))}
                                                                    disabled={currentPage === expeditionsMeta.last_page}
                                                                    className="relative inline-flex items-center rounded-lg px-2 py-2 text-slate-400 hover:bg-slate-50 disabled:opacity-30 transition-all active:scale-90"
                                                                >
                                                                    <ChevronRight className="h-5 w-5" aria-hidden="true" />
                                                                </button>
                                                            </nav>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>
            {/* Modal Détails Expédition */}
            <Modal
                isOpen={!!selectedExpedition}
                onClose={() => setSelectedExpedition(null)}
                title={`Expédition ${selectedExpedition?.reference}`}
                subtitle="Détails complets de l'expédition et des colis"
                size="3xl"
            >
                {selectedExpedition && (
                    <div className="space-y-8 pb-4">
                        {/* Status Bar */}
                        <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                            <div className="flex items-center gap-4">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-left">Statut Expédition</p>
                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase border ${getStatusStyles(selectedExpedition.statut_expedition)}`}>
                                        {selectedExpedition.statut_expedition === 'accepted' ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                                        {getStatusLabel(selectedExpedition.statut_expedition)}
                                    </span>
                                </div>
                                <div className="w-px h-10 bg-slate-200 mx-2 hidden sm:block" />
                            </div>
                            <div className="flex flex-col text-right">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Type d'expédition</p>
                                <span className="text-sm font-bold text-slate-900 uppercase">{getTypeLabel(selectedExpedition.type_expedition)}</span>
                            </div>
                        </div>

                        {/* Addresses Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Expéditeur */}
                            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-3 text-slate-50 group-hover:text-slate-100 transition-colors">
                                    <User size={48} strokeWidth={4} />
                                </div>
                                <div className="flex items-center gap-3 mb-4 relative z-10">
                                    <div className="h-10 w-10 bg-slate-900 rounded-xl flex items-center justify-center text-white shadow-lg">
                                        <ArrowLeft className="rotate-180" size={20} />
                                    </div>
                                    <div>
                                        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Expéditeur</h4>
                                        <p className="text-sm font-bold text-slate-900">{selectedExpedition.expediteur?.nom_prenom}</p>
                                    </div>
                                </div>
                                <div className="space-y-3 relative z-10">
                                    <div className="flex items-center gap-2.5 text-slate-600">
                                        <Smartphone size={14} className="text-slate-400" />
                                        <span className="text-xs font-semibold">{selectedExpedition.expediteur?.telephone}</span>
                                    </div>
                                    <div className="flex items-center gap-2.5 text-slate-600">
                                        <Mail size={14} className="text-slate-400" />
                                        <span className="text-xs font-semibold">{selectedExpedition.expediteur?.email || 'N/A'}</span>
                                    </div>
                                    <div className="flex items-start gap-2.5 text-slate-600">
                                        <MapPin size={14} className="text-slate-400 mt-0.5" />
                                        <span className="text-xs font-semibold leading-relaxed">
                                            {selectedExpedition.expediteur?.adresse}, {selectedExpedition.expediteur?.ville}<br />
                                            <span className="text-slate-400 uppercase text-[10px] font-bold">{selectedExpedition.pays_depart}</span>
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Destinataire */}
                            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-3 text-blue-50 group-hover:text-blue-100 transition-colors">
                                    <User size={48} strokeWidth={4} />
                                </div>
                                <div className="flex items-center gap-3 mb-4 relative z-10">
                                    <div className="h-10 w-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg">
                                        <ChevronRight size={20} />
                                    </div>
                                    <div>
                                        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right sm:text-left">Destinataire</h4>
                                        <p className="text-sm font-bold text-slate-900">{selectedExpedition.destinataire?.nom_prenom}</p>
                                    </div>
                                </div>
                                <div className="space-y-3 relative z-10">
                                    <div className="flex items-center gap-2.5 text-slate-600">
                                        <Smartphone size={14} className="text-slate-400" />
                                        <span className="text-xs font-semibold">{selectedExpedition.destinataire?.telephone}</span>
                                    </div>
                                    <div className="flex items-center gap-2.5 text-slate-600">
                                        <Mail size={14} className="text-slate-400" />
                                        <span className="text-xs font-semibold">{selectedExpedition.destinataire?.email || 'N/A'}</span>
                                    </div>
                                    <div className="flex items-start gap-2.5 text-slate-600">
                                        <MapPin size={14} className="text-slate-400 mt-0.5" />
                                        <span className="text-xs font-semibold leading-relaxed">
                                            {selectedExpedition.destinataire?.adresse}, {selectedExpedition.destinataire?.ville}<br />
                                            <span className="text-slate-400 uppercase text-[10px] font-bold">{selectedExpedition.pays_destination}</span>
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Financial Summary */}
                        <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-xl shadow-slate-200">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-white/10 rounded-lg">
                                    <PaymentIcon size={20} className="text-white" />
                                </div>
                                <h4 className="text-sm font-bold uppercase tracking-widest">Récapitulatif Financier</h4>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                                <div className="space-y-1">
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Montant de Base</p>
                                    <p className="text-lg font-bold">{Number(selectedExpedition.montant_base).toLocaleString()} <span className="text-xs font-normal text-slate-400">CFA</span></p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Prestation ({selectedExpedition.pourcentage_prestation}%)</p>
                                    <p className="text-lg font-bold text-orange-400">{Number(selectedExpedition.montant_prestation).toLocaleString()} <span className="text-xs font-normal text-slate-400">CFA</span></p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Frais Annexes</p>
                                    <p className="text-lg font-bold">{(Number(selectedExpedition.frais_emballage) + Number(selectedExpedition.frais_douane)).toLocaleString()} <span className="text-xs font-normal text-slate-400">CFA</span></p>
                                </div>
                                <div className="space-y-1 bg-white/5 p-3 rounded-xl border border-white/10">
                                    <p className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest">Total Payé</p>
                                    <p className="text-xl font-bold text-emerald-400">{Number(selectedExpedition.montant_expedition).toLocaleString()} <span className="text-xs font-normal text-white/50">CFA</span></p>
                                </div>
                            </div>
                        </div>

                        {/* Parcels List */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Box size={18} className="text-slate-400" />
                                    <h4 className="text-sm font-bold uppercase tracking-widest text-slate-900">Articles & Colis ({selectedExpedition.colis?.length})</h4>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 gap-4">
                                {selectedExpedition.colis?.map((colis, idx) => (
                                    <div key={colis.id} className="group bg-slate-50 hover:bg-white rounded-2xl p-4 border border-slate-100 hover:border-slate-200 hover:shadow-md transition-all">
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                            <div className="flex items-start gap-4">
                                                <div className="h-12 w-12 rounded-xl bg-white border border-slate-200 flex flex-col items-center justify-center text-slate-400 shadow-sm">
                                                    <span className="text-[10px] font-bold leading-none">{idx + 1}</span>
                                                    <Package size={20} mt-1 />
                                                </div>
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs font-bold text-slate-900 uppercase">{colis.designation}</span>
                                                        <span className="text-[10px] font-bold px-1.5 py-0.5 bg-slate-200 text-slate-600 rounded uppercase">{colis.code_colis}</span>
                                                    </div>
                                                    <p className="text-xs text-slate-500 font-medium italic">
                                                        Articles : {colis.articles?.join(', ') || 'Non spécifié'}
                                                    </p>
                                                    <div className="flex items-center gap-3 pt-1">
                                                        <span className="text-[10px] font-bold text-slate-400 bg-white px-2 py-0.5 rounded-full border border-slate-100">Poids: {colis.poids} KG</span>
                                                        <span className="text-[10px] font-bold text-slate-400 bg-white px-2 py-0.5 rounded-full border border-slate-100">Volume: {colis.volume} cm³</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between sm:flex-col sm:items-end gap-1 px-4 sm:px-0 py-2 sm:py-0 bg-white sm:bg-transparent rounded-xl">
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Prix Colis</span>
                                                <span className="text-sm font-bold text-slate-900">{Number(colis.montant_colis_total).toLocaleString()} CFA</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Extra Info */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                                <div className="flex items-center gap-2 mb-2">
                                    <FileText size={14} className="text-slate-400" />
                                    <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Informations Logistiques</h5>
                                </div>
                                <div className="grid grid-cols-2 gap-y-3">
                                    <div>
                                        <p className="text-[10px] text-slate-400 uppercase">Code de Validation</p>
                                        <p className="text-xs font-bold text-blue-600">{selectedExpedition.code_validation_reception || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-slate-400 uppercase">Enlèvement Domicile</p>
                                        <p className="text-xs font-bold text-slate-700">{selectedExpedition.is_enlevement_domicile ? 'OUI' : 'NON'}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-slate-400 uppercase">Livraison Domicile</p>
                                        <p className="text-xs font-bold text-slate-700">{selectedExpedition.is_livraison_domicile ? 'OUI' : 'NON'}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-slate-400 uppercase">Paiement Crédit</p>
                                        <p className="text-xs font-bold text-slate-700">{selectedExpedition.is_paiement_credit ? 'OUI' : 'NON'}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-100 space-y-2 text-amber-900">
                                <div className="flex items-center gap-2 mb-2">
                                    <Info size={14} className="text-amber-400" />
                                    <h5 className="text-[10px] font-bold text-amber-400 uppercase tracking-widest">Instructions Spécifiques</h5>
                                </div>
                                <p className="text-xs font-medium italic leading-relaxed">
                                    {selectedExpedition.instructions_livraison || selectedExpedition.instructions_enlevement || "Aucune instruction particulière n'a été fournie pour cette expédition."}
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default AgenceDetail;
