import React, { useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchParcelByCode, clearCurrentParcel, setCurrentParcel } from '../redux/slices/parcelSlice';
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
    AlertCircle
} from 'lucide-react';

const ParcelControl = () => {
    const { code } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { items, currentParcel, isLoadingDetail, error } = useSelector(state => state.parcels);

    useEffect(() => {
        if (!code) return;

        // 1. Si on a déjà le bon colis dans currentParcel, on ne bouge pas
        if (currentParcel && currentParcel.code_colis === code) return;

        // 2. On regarde si le colis est présent dans la liste globale (items)
        const parcelFromList = items.find(p => p.code_colis === code);

        if (parcelFromList) {
            // On utilise les données déjà présentes (pas d'API call)
            dispatch(setCurrentParcel(parcelFromList));
        } else {
            // 3. Sinon (scan nouveau, refresh, ou lien direct), on appelle l'API
            dispatch(fetchParcelByCode(code));
        }

        return () => {
            // On ne clear pas forcément ici pour permettre la navigation fluide, 
            // mais l'initialState de currentParcel est null au départ.
        };
    }, [dispatch, code, items]); // Re-run si items change ou si le code change

    const getStatusInfo = (status) => {
        switch (status) {
            case 'accepted':
                return { label: 'À contrôler', styles: 'bg-amber-100 text-amber-700 border-amber-200' };
            case 'ready_boarding':
                return { label: 'Prêt embarquement', styles: 'bg-blue-100 text-blue-700 border-blue-200' };
            default:
                return { label: status || 'Inconnu', styles: 'bg-slate-100 text-slate-700 border-slate-200' };
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

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
                <div className="p-4 bg-rose-50 rounded-2xl mb-4 text-rose-500 border border-rose-100">
                    <AlertCircle size={40} />
                </div>
                <h2 className="text-xl font-bold text-slate-900">Colis introuvable</h2>
                <p className="text-slate-500 mt-2 max-w-sm">Désolé, nous n'avons trouvé aucun colis correspondant au code <span className="font-bold text-slate-900">{code}</span>.</p>
                <button
                    onClick={() => navigate('/parcels')}
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
                        onClick={() => navigate('/parcels')}
                        className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors"
                        title="Retour"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-lg font-bold text-slate-900 leading-none">Détails du Colis</h1>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <div className="h-8 w-8 bg-amber-100 text-amber-700 border-amber-200 rounded-lg flex items-center justify-center border border-slate-200">
                        <ShieldCheck size={18} />
                    </div>
                </div>
            </div>

            {/* Compact Top Bar */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-wrap items-center gap-6 shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-50 rounded-lg flex items-center justify-center border border-slate-100 text-slate-600">
                        {isAir ? <Plane size={20} /> : <Ship size={20} />}
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase leading-none mb-1">Désignation</p>
                        <p className="text-sm font-medium text-slate-è00">{currentParcel.designation || 'Non spécifié'}</p>
                    </div>
                </div>
                <div className="h-8 border-l border-slate-200 hidden sm:block"></div>
                <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase leading-none mb-1">Catégorie</p>
                    <p className="text-sm font-medium text-slate-700">{currentParcel.category?.nom || 'Logistique'}</p>
                </div>
                <div className="h-8 border-l border-slate-200 hidden sm:block"></div>
                <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase leading-none mb-1">Reference</p>
                    <p className="text-sm font-medium text-slate-700">{currentParcel.code_colis}</p>
                </div>
                <div className="ml-auto flex items-center gap-2">
                    <button className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-slate-800 transition-colors">
                        Valider
                    </button>
                    <button className="p-2 border border-slate-200 text-rose-500 rounded-lg hover:bg-rose-50 hover:border-rose-100 transition-colors">
                        <AlertCircle size={18} />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Main Logistics Content */}
                <div className="lg:col-span-2 space-y-4">
                    {/* Compact Exp/Dest Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-white border border-slate-200 rounded-xl p-4">
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
                                        <div className="space-y-3 flex flex-col">
                                            <span className="text-slate-400 font-bold uppercase mb-1">{currentParcel.expedition?.pays_depart}</span>
                                            {currentParcel.expedition?.expediteur?.adresse}, {currentParcel.expedition?.expediteur?.ville}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white border border-slate-200 rounded-xl p-4">
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
                                        <div className="space-y-3 flex flex-col">
                                            <span className="text-slate-400 font-bold uppercase mb-1">{currentParcel.expedition?.pays_destination}</span>
                                            {currentParcel.expedition?.destinataire?.adresse}, {currentParcel.expedition?.destinataire?.ville}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Compact Specs Grid */}
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-200/60">
                            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                                <Scale size={14} /> Caractéristiques Techniques
                            </h3>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                                <p className="text-xs font-semibold text-slate-400 uppercase mb-1">Poids</p>
                                <p className="text-lg font-semibold text-slate-800">{currentParcel.poids} <span className="text-[10px] font-medium text-slate-400 uppercase">kg</span></p>
                            </div>
                            <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                                <p className="text-xs font-semibold text-slate-400 uppercase mb-1">Volume</p>
                                <p className="text-lg font-semibold text-slate-800">{Math.round(currentParcel.volume || 0)} <span className="text-[10px] font-medium text-slate-400 uppercase">cm³</span></p>
                            </div>
                            <div className="col-span-2 bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                                <p className="text-xs font-semibold text-slate-400 uppercase mb-1">Dimensions (LxPxH)</p>
                                <p className="text-base font-semibold text-slate-800">
                                    {Math.round(currentParcel.longueur)}<span className="text-slate-300 mx-1">×</span>{Math.round(currentParcel.largeur)}<span className="text-slate-300 mx-1">×</span>{Math.round(currentParcel.hauteur)} <span className="text-[10px] font-medium text-slate-400 uppercase">cm</span>
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Compact Items List */}
                    <div className="bg-white border border-slate-200 rounded-xl p-4">
                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <Blocks size={14} /> Contenu du colis
                        </h3>
                        {currentParcel.articles && currentParcel.articles.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                                {currentParcel.articles.map((article, idx) => (
                                    <div key={idx} className="bg-slate-50 text-slate-600 px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-100">
                                        {article}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="py-6 text-center border-2 border-dashed border-slate-100 rounded-lg">
                                <p className="text-xs text-slate-400 font-medium italic">Aucun détail disponible</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Tracking & Financials (Right Side) */}
                <div className="space-y-4">
                    <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-4 shadow-sm">
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

                    <div className="bg-slate-900 rounded-xl p-5 text-white shadow-md relative overflow-hidden">
                        <h3 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-4 flex items-center gap-2">
                            Tarification
                        </h3>
                        <div className="space-y-3 relative z-10">
                            <div className="flex justify-between items-center text-xs">
                                <span className="text-white/50">Base</span>
                                <span className="font-bold">{Number(currentParcel.montant_colis_base).toLocaleString()} CFA</span>
                            </div>
                            <div className="flex justify-between items-center text-xs">
                                <span className="text-white/50">Prestation</span>
                                <span className="font-bold text-blue-400">+{Number(currentParcel.montant_colis_prestation).toLocaleString()} CFA</span>
                            </div>
                            <div className="flex justify-between items-center text-xs pb-3 border-b border-white/5">
                                <span className="text-white/50">Emballage</span>
                                <span className="font-bold">+{Number(currentParcel.prix_emballage).toLocaleString()} CFA</span>
                            </div>

                            <div className="pt-2">
                                <p className="text-[9px] font-bold text-white/30 uppercase tracking-[0.2em] mb-1">Net à Payer</p>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-2xl font-bold tracking-tighter">
                                        {Number(currentParcel.montant_colis_total).toLocaleString()}
                                    </span>
                                    <span className="text-[10px] font-bold text-white/40">CFA</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Integrated Actions Bottom */}
                    <div className="pt-2">
                        <button className="w-full py-3 bg-slate-100 text-slate-500 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-slate-200 transition-all border border-slate-200">
                            Signaler un défaut
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ParcelControl;
