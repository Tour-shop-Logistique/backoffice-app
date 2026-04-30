import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
    fetchAgences,
    fetchAgenceTarifsGroupage,
    fetchAgenceTarifsSimple,
    clearCurrentAgency,
    setCurrentAgence,
    fetchAgenceAccounting
} from "../redux/slices/agenceSlice";
import { format, startOfMonth, endOfMonth } from "date-fns";
import {
    MapPin,
    Phone,
    Briefcase,
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
    CreditCard as PaymentIcon,
    PieChart,
    Wallet,
    ArrowUpRight,
    ArrowDownLeft,
    TrendingUp,
    BarChart3,
    FileDown
} from "lucide-react";
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import Modal from "../components/common/Modal";
import StatCard from "../components/agence/StatCard";
import ExpeditionDetailModal from "../components/expedition/ExpeditionDetailModal";
import { getExpeditionStatusLabel, getStatusStyles } from "../utils/statusTranslations";

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
        currentAgencyAccounting,
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

    const [dateRange, setDateRange] = useState({
        startDate: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
        endDate: format(endOfMonth(new Date()), 'yyyy-MM-dd')
    });

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

    // 5. Charger la comptabilité quand on active l'onglet
    useEffect(() => {
        if (id && activeTab === "comptabilite") {
            // On ne recharge que si les dates ont changé ou si pas de données
            const shouldFetch = !currentAgencyAccounting.lastUpdated ||
                currentAgencyAccounting.error;

            if (shouldFetch) {
                dispatch(fetchAgenceAccounting({
                    agenceId: id,
                    dateDebut: dateRange.startDate + " 00:00:00",
                    dateFin: dateRange.endDate + " 23:59:59"
                }));
            }
        }
    }, [dispatch, id, activeTab]);

    const handleLoadAccounting = () => {
        dispatch(fetchAgenceAccounting({
            agenceId: id,
            dateDebut: dateRange.startDate + " 00:00:00",
            dateFin: dateRange.endDate + " 23:59:59"
        }));
    };

    const handleDownloadPDF = () => {
        if (!currentAgencyAccounting.summary) return;
        const doc = new jsPDF();
        const summary = currentAgencyAccounting.summary;
        const period = `du ${format(new Date(dateRange.startDate), 'dd/MM/yyyy')} au ${format(new Date(dateRange.endDate), 'dd/MM/yyyy')}`;
        const fmt = (v) => String(v || 0).replace(/\B(?=(\d{3})+(?!\d))/g, " ");

        // DESIGN PREMIUM : Bandeau de tête
        doc.setFillColor(15, 23, 42); // slate-900 
        doc.rect(0, 0, 210, 45, 'F'); 
        
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(20);
        doc.setFont("helvetica", "bold");
        doc.text("RAPPORT COMPTABLE AGENCE", 14, 25);
        
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(148, 163, 184); // slate-400
        doc.text(currentAgence?.nom_agence?.toUpperCase() || 'AGENCE LOCALE', 14, 32);
        
        // Bloc de métadonnées en haut à droite
        doc.setFontSize(8);
        doc.setTextColor(255, 255, 255);
        doc.text(`PERIODE : ${period.toUpperCase()}`, 140, 18);
        doc.text(`PAYS : ${currentAgence?.pays?.toUpperCase() || 'N/A'}`, 140, 24);
        doc.text(`EDITE LE : ${format(new Date(), 'dd/MM/yyyy')}`, 140, 30);

        // CARTES DE SYNTHESE (Summary Cards)
        const cardsY = 55;
        const cardW = 43;
        const cardH = 20;
        const spacing = 3.5;

        const drawCard = (x, title, value, isDark = false) => {
            if (isDark) doc.setFillColor(30, 41, 59);
            else doc.setFillColor(248, 250, 252);
            
            doc.roundedRect(x, cardsY, cardW, cardH, 1, 1, 'F');
            doc.setFontSize(6);
            doc.setFont("helvetica", "bold");
            if (isDark) doc.setTextColor(148, 163, 184);
            else doc.setTextColor(100, 116, 139);
            doc.text(title, x + 4, cardsY + 6);
            
            doc.setFontSize(10);
            if (isDark) doc.setTextColor(255, 255, 255);
            else doc.setTextColor(15, 23, 42);
            doc.text(`${fmt(value)} CFA`, x + 4, cardsY + 14);
        };

        drawCard(14, "POTENTIEL (DÛ)", summary.potential?.total_client_due || 0);
        drawCard(14 + (cardW + spacing), "PART BACKOFFICE", summary.potential?.total_backoffice || 0, true);
        drawCard(14 + (cardW + spacing) * 2, "PART AGENCE", (summary.potential?.total_agence_depart || 0) + (summary.potential?.total_agence_arrivee || 0));
        drawCard(14 + (cardW + spacing) * 3, "VOL. EXPEDITIONS", summary.count || 0);

        // Table (Parfaite symétrie avec le tableau de l'application)
        const tableColumn = [
            "Expédition", 
            "Date / Agence", 
            "À Percevoir", 
            "Part Backoffice", 
            "Part Agence", 
            "Part Livreurs", 
            "État Règlements"
        ];
        
        const tableRows = currentAgencyAccounting.items.map(item => {
            const acc = item.accounting_details || { backoffice_depart: 0, backoffice_arrivee: 0, agence_depart: 0, agence_arrivee: 0, total_client_due: 0, livreur_depart: 0, livreur_arrivee: 0 };
            const statusExp = item.statut_paiement_expedition === 'paye' ? 'Exp: RÉGLÉ' : 'Exp: NON RÉGLÉ';
            const statusFrais = item.statut_paiement_frais === 'paye' ? 'Frais: RÉGLÉ' : 'Frais: NON RÉGLÉ';
            
            return [
                `${item.reference}\n${getExpeditionStatusLabel(item.statut_expedition)}`,
                `${format(new Date(item.created_at), 'dd/MM/yyyy')}\n${item.agence?.nom_agence || 'Agence Locale'}`,
                `${fmt(acc.total_client_due)}`,
                `${fmt((acc.backoffice_depart || 0) + (acc.backoffice_arrivee || 0))}`,
                `${fmt((acc.agence_depart || 0) + (acc.agence_arrivee || 0))}`,
                `${fmt((acc.livreur_depart || 0) + (acc.livreur_arrivee || 0))}`,
                `${statusExp}\n${statusFrais}`
            ];
        });

        autoTable(doc, {
          head: [tableColumn],
          body: tableRows,
          startY: 85,
          theme: 'grid',
          headStyles: { 
              fillColor: [15, 23, 42], 
              fontSize: 7, 
              fontStyle: 'bold', 
              halign: 'center' 
          },
          bodyStyles: { 
              fontSize: 6.5, 
              valign: 'middle' 
          },
          columnStyles: {
              2: { halign: 'right' },
              3: { halign: 'right', fontStyle: 'bold' },
              4: { halign: 'right' },
              5: { halign: 'right' },
              6: { halign: 'center', fontSize: 6 }
          },
          alternateRowStyles: { fillColor: [249, 250, 251] },
          margin: { top: 85, left: 14, right: 14 },
          styles: { cellPadding: 2 }
        });

        doc.save(`Rapport_Comptable_${currentAgence.nom_agence}_${dateRange.startDate}.pdf`);
    };

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
                            { id: 'comptabilite', label: 'Comptabilité', icon: PieChart },
                            // { id: 'expeditions', label: 'Expéditions', icon: Truck }
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
                    {(activeTab === 'tarifs_groupage' || activeTab === 'tarifs_simple') && (
                        <button
                            onClick={() => {
                                if (activeTab === 'tarifs_groupage') dispatch(fetchAgenceTarifsGroupage(id));
                                else if (activeTab === 'tarifs_simple') dispatch(fetchAgenceTarifsSimple(id));
                                // else dispatch(fetchAgenceExpeditions({ agenceId: id, page: currentPage }));
                            }}
                            disabled={isLoadingTarifs}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-slate-900 hover:border-slate-300 transition-all shadow-sm active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed group"
                            title="Rafraîchir les données"
                        >
                            <RefreshCw size={14} className={`${(isLoadingTarifs) ? 'animate-spin text-slate-900' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
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
                                                        className="max-h-full max-w-full object-contain"
                                                        loading="lazy"
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
                                        <AgencyTariffTable
                                            tariffs={activeTab === "tarifs_groupage" ? filteredGroupageTariffs : filteredSimpleTariffs}
                                            type={activeTab}
                                            getTypeLabel={getTypeLabel}
                                        />
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
                                                            <span className={`text-[9px] font-bold px-2 py-1 rounded-full border uppercase tracking-wider ${expo.statut_expedition === 'accepted' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-amber-100 text-amber-700 border-amber-200'}`}>
                                                                {expo.statut_expedition === 'accepted' ? 'Acceptée' : 'En attente'}
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

                    {activeTab === "comptabilite" && (
                        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-6">
                            {/* Bar de filtres */}
                            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                                        <Calendar size={16} className="text-slate-400" />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="date"
                                            value={dateRange.startDate}
                                            onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                                            className="text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-400 transition-all"
                                        />
                                        <span className="text-slate-300 font-bold">→</span>
                                        <input
                                            type="date"
                                            value={dateRange.endDate}
                                            onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                                            className="text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-400 transition-all"
                                        />
                                    </div>
                                    <button
                                        onClick={handleLoadAccounting}
                                        disabled={currentAgencyAccounting.isLoading}
                                        className="px-6 py-2 bg-white text-slate-600 border border-slate-200 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-slate-50 disabled:opacity-50 transition-all flex items-center gap-2 shadow-sm active:scale-95"
                                    >
                                        {currentAgencyAccounting.isLoading ? <RefreshCw size={14} className="animate-spin" /> : <Search size={14} />}
                                        Actualiser
                                    </button>

                                    <button
                                        onClick={handleDownloadPDF}
                                        disabled={currentAgencyAccounting.isLoading || currentAgencyAccounting.items.length === 0}
                                        className="px-6 py-2 bg-slate-900 text-white rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-slate-800 disabled:opacity-50 transition-all flex items-center gap-2 shadow-sm active:scale-95"
                                    >
                                        <FileDown size={14} />
                                        PDF
                                    </button>
                                </div>

                                {currentAgencyAccounting.lastUpdated && (
                                    <p className="text-[10px] font-bold text-slate-400 uppercase">
                                        Dernière mise à jour : {new Date(currentAgencyAccounting.lastUpdated).toLocaleTimeString()}
                                    </p>
                                )}
                            </div>

                            {/* Cartes de synthèse */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                <StatCard
                                    label="Potentiel (Total Dû)"
                                    value={currentAgencyAccounting.summary?.potential?.total_client_due}
                                    icon={Wallet}
                                    variant="dark"
                                    // subtitle="Chiffre d'affaires attendu"
                                />
                                <StatCard
                                    label="Part Backoffice"
                                    value={currentAgencyAccounting.summary?.potential?.total_backoffice}
                                    icon={Briefcase}
                                    variant="dark"
                                    // subtitle="Reliquat Hub Central"
                                />
                                 <StatCard
                                    label="Part Agence (Net)"
                                    value={currentAgencyAccounting.summary?.potential?.total_agence}
                                    icon={BadgeCheck}
                                    variant="dark"
                                    // subtitle="Bénéfice net agence"
                                />
                                <StatCard
                                    label="Vol. Expéditions"
                                    value={currentAgencyAccounting.summary?.count}
                                    icon={ListOrdered}
                                    unit="COLIS"
                                    variant="dark"
                                    // subtitle="Volume d'activité"
                                />
                            </div>

                            {/* Tableau de détail */}
                            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse min-w-[1000px]">
                                        <thead>
                                            <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                                <th className="px-6 py-4">Expédition</th>
                                                <th className="px-6 py-4 text-right">À Percevoir</th>
                                                <th className="px-6 py-4 text-right bg-slate-100/30 text-slate-900">Part Backoffice</th>
                                                <th className="px-6 py-4 text-right">Part Agence</th>
                                                <th className="px-6 py-4 text-center">État Règlements</th>
                                                <th className="px-6 py-4 text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {currentAgencyAccounting.isLoading ? (
                                                <tr>
                                                    <td colSpan={7} className="px-6 py-20 text-center">
                                                        <Loader2 size={32} className="animate-spin text-slate-200 mx-auto mb-4" />
                                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Calcul du bilan comptable...</p>
                                                    </td>
                                                </tr>
                                            ) : currentAgencyAccounting.items.length === 0 ? (
                                                <tr>
                                                    <td colSpan={7} className="px-6 py-24 text-center bg-slate-50/20">
                                                        <div className="h-16 w-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100 shadow-sm text-slate-200">
                                                            <PieChart size={28} />
                                                        </div>
                                                        <h4 className="text-slate-900 font-bold text-sm">Aucun mouvement</h4>
                                                        <p className="text-slate-400 text-xs mt-1 italic">Aucune donnée comptable n'a été trouvée pour cette période.</p>
                                                    </td>
                                                </tr>
                                            ) : (
                                                currentAgencyAccounting.items.map((item) => {
                                                    const acct = item.accounting_details || {};
                                                    const boNet = (acct.backoffice_depart || 0) + (acct.backoffice_arrivee || 0);
                                                    const agencyPart = (acct.agence_depart || 0) + (acct.agence_arrivee || 0);

                                                    return (
                                                        <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                                                            <td className="px-6 py-4">
                                                                <div className="flex flex-col">
                                                                    <span className="font-bold text-slate-900 text-xs tracking-tight">{item.reference}</span>
                                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium mt-1 w-fit ${getStatusStyles(item.statut_expedition)}`}>
                                                                        {getExpeditionStatusLabel(item.statut_expedition)}
                                                                    </span>
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4 text-right">
                                                                <span className="font-bold text-slate-900 text-xs">{(acct.total_client_due || 0).toLocaleString()}</span>
                                                            </td>
                                                            <td className="px-6 py-4 text-right bg-slate-50/50 group-hover:bg-slate-100/50 transition-colors">
                                                                <span className="font-bold text-slate-900 text-xs">{boNet.toLocaleString()}</span>
                                                            </td>
                                                            <td className="px-6 py-4 text-right">
                                                                <span className="font-bold text-blue-600 text-xs">{agencyPart.toLocaleString()}</span>
                                                            </td>
                                                            <td className="px-6 py-4 text-center">
                                                                <div className="flex flex-col gap-1.5 items-center">
                                                                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold ${item.statut_paiement_expedition === 'paye' ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-red-100 text-red-700 border border-red-200'}`}>
                                                                        {item.statut_paiement_expedition === 'paye' ? '✓ Expédition réglée' : '✗ Expédition non réglée'}
                                                                    </span>
                                                                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold ${item.statut_paiement_frais === 'paye' ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-red-100 text-red-700 border border-red-200'}`}>
                                                                        {item.statut_paiement_frais === 'paye' ? '✓ Frais réglés' : '✗ Frais non réglés'}
                                                                    </span>
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4 text-right">
                                                                <button 
                                                                    onClick={() => setSelectedExpedition(item)}
                                                                    className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all"
                                                                >
                                                                    <Eye size={16} />
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    );
                                                })
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal de Détails Expedition */}
            <ExpeditionDetailModal
                isOpen={!!selectedExpedition}
                onClose={() => setSelectedExpedition(null)}
                selectedExpedition={selectedExpedition}
                getTypeLabel={getTypeLabel}
            />
        </div>
    );
};

export default AgenceDetail;
