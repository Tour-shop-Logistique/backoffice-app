import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
    fetchAgences,
    fetchAgenceTarifsGroupage,
    fetchAgenceTarifsSimple,
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
    Tag
} from "lucide-react";

const AgenceDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const {
        agences,
        currentAgence,
        isLoading,
        isLoadingTarifs,
        currentAgencyTarifsGroupage,
        currentAgencyTarifsSimple,
        hasLoaded,
        error
    } = useSelector((state) => state.agences);

    const [activeTab, setActiveTab] = useState("details");

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

    // Cleanup au démontage
    useEffect(() => {
        return () => {
            dispatch(clearCurrentAgency());
        };
    }, [dispatch]);

    const getTypeLabel = (type) => {
        if (!type) return 'N/A';
        switch (type.toUpperCase()) {
            case 'GROUPAGE_DHD_AERIEN': return 'DHD Aérien';
            case 'GROUPAGE_DHD_MARITIME': return 'DHD Maritime';
            case 'GROUPAGE_AFRIQUE': return 'Afrique';
            case 'GROUPAGE_CA': return 'Colis Accompagnés';
            default: return type.replace('groupage_', '').replace('_', ' ');
        }
    };

    const handleBack = (e) => {
        if (e) e.preventDefault();
        // Si on a un historique (longueur > 2 car l'entrée actuelle + la précédente)
        if (window.history.length > 2) {
            navigate(-1);
        } else {
            // Fallback sécurisé vers la liste des agences
            navigate(`${ROUTES.APP}/agence-partenaire`);
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

                    {/* Manual Refresh Button for Tariffs */}
                    {(activeTab === 'tarifs_groupage' || activeTab === 'tarifs_simple') && (
                        <button
                            onClick={() => {
                                if (activeTab === 'tarifs_groupage') dispatch(fetchAgenceTarifsGroupage(id));
                                else dispatch(fetchAgenceTarifsSimple(id));
                            }}
                            disabled={isLoadingTarifs}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-slate-900 hover:border-slate-300 transition-all shadow-sm active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed group"
                            title="Rafraîchir les données"
                        >
                            <RefreshCw size={14} className={`${isLoadingTarifs ? 'animate-spin text-slate-900' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
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
                                                <div className="h-20 w-20 mx-auto rounded-lg border border-slate-100 p-2 bg-white shadow-sm flex items-center justify-center mb-4">
                                                    <img src={currentAgence.logo} alt="Logo" className="max-h-full max-w-full object-contain" />
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
                                    {((activeTab === "tarifs_groupage" ? currentAgencyTarifsGroupage : currentAgencyTarifsSimple) || []).length === 0 ? (
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
                                                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Type / Catégorie</th>
                                                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Itinéraire / Pays</th>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Indice</th>
                                                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Destination</th>
                                                                </>
                                                            )}
                                                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Montant Base</th>
                                                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Prestation</th>
                                                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Total</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-100">
                                                        {((activeTab === "tarifs_groupage" ? currentAgencyTarifsGroupage : currentAgencyTarifsSimple) || []).map((tarif) => (
                                                            <tr key={tarif.id} className="hover:bg-slate-50/30 transition-colors">
                                                                <td className="px-6 py-4">
                                                                    {activeTab === 'tarifs_groupage' ? (
                                                                        <div className="flex flex-col">
                                                                            <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase w-fit ${tarif.type_expedition?.includes('aerien') ? 'bg-blue-100 text-blue-700' :
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
                                                {((activeTab === "tarifs_groupage" ? currentAgencyTarifsGroupage : currentAgencyTarifsSimple) || []).map((tarif) => (
                                                    <div key={tarif.id} className="p-4 space-y-3">
                                                        <div className="flex justify-between items-start">
                                                            <div className="space-y-1">
                                                                {activeTab === 'tarifs_groupage' ? (
                                                                    <>
                                                                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase ${tarif.type_expedition?.includes('aerien') ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'
                                                                            }`}>
                                                                            {getTypeLabel(tarif.type_expedition)}
                                                                        </span>
                                                                        <h4 className="font-bold text-slate-900 text-sm">{tarif.category?.nom || 'Standard'}</h4>
                                                                    </>
                                                                ) : (
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-bold rounded border border-blue-100">Indice {tarif.indice}</span>
                                                                        <h4 className="font-bold text-slate-900 text-sm truncate">{tarif.zone?.nom || tarif.pays}</h4>
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className="text-right">
                                                                <div className="text-base font-bold text-slate-900 leading-none">
                                                                    {Number(tarif.montant_expedition).toLocaleString()} <span className="text-[10px] text-slate-400">CFA</span>
                                                                </div>
                                                                <span className="text-[9px] font-bold text-emerald-500 uppercase">Tarif Total</span>
                                                            </div>
                                                        </div>

                                                        <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2 rounded-xl">
                                                            <div>
                                                                <p className="text-[9px] font-bold text-slate-400 uppercase">Base</p>
                                                                <p className="text-xs font-bold text-slate-700">{Number(tarif.montant_base).toLocaleString()}</p>
                                                            </div>
                                                            <div className="text-right">
                                                                <p className="text-[9px] font-bold text-slate-400 uppercase">Frais ({tarif.pourcentage_prestation}%)</p>
                                                                <p className="text-xs font-bold text-slate-700">{Number(tarif.montant_prestation).toLocaleString()}</p>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center gap-2 text-slate-400">
                                                            <MapPinIcon size={12} />
                                                            <span className="text-[10px] font-bold uppercase tracking-tight">
                                                                {activeTab === 'tarifs_groupage' && tarif.ligne ? tarif.ligne.replace('-', ' → ') : (tarif.zone?.nom || tarif.pays)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === "expeditions" && (
                        <div className="py-20 text-center bg-slate-50/50 rounded-3xl border border-dashed border-slate-200 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <div className="h-16 w-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 grayscale opacity-40 shadow-sm">
                                <RefreshCw size={32} className="text-slate-400" strokeWidth={1.5} />
                            </div>
                            <h3 className="text-slate-900 font-bold text-lg">Historique des Expéditions</h3>
                            <p className="text-slate-500 text-sm max-w-sm mx-auto mt-2 italic">
                                Cette section est en cours de développement. Vous pourrez bientôt consulter toutes les expéditions enregistrées par cette agence.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AgenceDetail;
