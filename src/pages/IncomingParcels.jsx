import React, { useState, useMemo, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchIncomingParcels } from '../redux/slices/parcelSlice';
import { showNotification } from '../redux/slices/uiSlice';
import { ROUTES } from '../routes';
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
} from 'lucide-react';

/**
 * IncomingParcels - Réception internationale (mode=arrivee)
 */
const IncomingParcels = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const { items, isLoading, error, hasLoaded } = useSelector(
        (state) => state.parcels.incomingList
    );
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // Chargement initial
    useEffect(() => {
        if (!hasLoaded) {
            dispatch(fetchIncomingParcels());
        }
    }, [dispatch, hasLoaded]);

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

    // Filtre texte
    const filteredParcels = useMemo(() => {
        return items.filter((parcel) => {
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

            {/* ── HEADER ── */}
            <header className="space-y-3 md:space-y-0">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
                            Colis à réceptionner
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
                            <span className="hidden md:inline md:ml-2 uppercase tracking-widest text-[10px]">Actualiser</span>
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
                    className="w-full pl-10 md:pl-12 pr-3 md:pr-4 py-2.5 md:py-3 bg-white border border-slate-200 rounded-lg shadow-sm focus:outline-none focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900 transition-all text-sm placeholder:text-slate-400"
                />
            </div>

            {/* ── MAIN CONTENT ── */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden text-black transition-all">

                {/* Summary bar */}
                <div className="px-4 py-3 md:px-6 md:py-4 border-b border-slate-100 bg-slate-50/10">
                    <div className="flex items-center gap-4">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">
                            {groupedParcels.length} expédition{groupedParcels.length !== 1 ? 's' : ''} ({filteredParcels.length} colis)
                        </span>
                        {(isLoading || isRefreshing) && (
                            <Loader2 className="h-3.5 w-3.5 text-slate-400 animate-spin" />
                        )}
                    </div>
                </div>

                {/* Content */}
                {isLoading && !isRefreshing ? (
                    <div className="flex flex-col items-center justify-center py-24 px-6">
                        <Loader2 className="animate-spin text-slate-900 mb-4" size={40} strokeWidth={1.5} />
                        <p className="text-slate-500 font-bold text-[10px] uppercase tracking-widest">Chargement des réceptions...</p>
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
                    <>
                        {/* ── Desktop Table View ── */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-slate-50/50 border-b border-slate-200">
                                    <tr>
                                        <th className="px-6 py-3 text-left font-bold text-slate-500 uppercase tracking-wider text-xs">Colis / Désignation</th>
                                        <th className="px-6 py-3 text-left font-bold text-slate-500 uppercase tracking-wider text-xs">Provenance</th>
                                        <th className="px-6 py-3 text-left font-bold text-slate-500 uppercase tracking-wider text-xs">Destination</th>
                                        <th className="px-6 py-3 text-left font-bold text-slate-500 uppercase tracking-wider text-xs">Poids</th>
                                        <th className="px-6 py-3 text-right font-bold text-slate-500 uppercase tracking-wider text-xs">Action</th>
                                    </tr>
                                </thead>

                                {groupedParcels.map((group) => {
                                    const TypeIcon = getTypeIcon(group.expedition?.type_expedition);
                                    return (
                                        <tbody key={group.id} className="divide-y divide-slate-200 border-b-4 border-slate-50">
                                            {/* ── Groupe header ── */}
                                            <tr className="bg-slate-50/80">
                                                <td colSpan="5" className="px-6 py-2">
                                                    <div className="flex items-center w-full gap-8">
                                                        {/* Référence expédition */}
                                                        <div className="flex items-center gap-2 px-2.5 py-1 bg-white border border-slate-200/60 rounded-lg shadow-sm">
                                                            <Truck size={13} className="text-indigo-500/80" />
                                                            <span className="text-[10px] font-semibold text-slate-700 uppercase tracking-tight">
                                                                {group.expedition?.reference || 'Sans ref'}
                                                            </span>
                                                        </div>

                                                        {/* Middle: Breakdown Flow */}
                                                        <div className="flex items-center gap-6">
                                                            <div className="flex items-baseline gap-1.5">
                                                                <span className="text-[9px] font-medium text-slate-400 uppercase tracking-wide">Base</span>
                                                                <span className="text-[11px] font-semibold text-slate-600 tabular-nums">
                                                                    {Number(group.expedition?.montant_base || 0).toLocaleString()}
                                                                </span>
                                                            </div>
                                                            <div className="flex items-baseline gap-1.5">
                                                                <span className="text-[9px] font-medium text-slate-400 uppercase tracking-wide">Prestation</span>
                                                                <span className="text-[11px] font-semibold text-blue-600 tabular-nums">
                                                                    +{Number(group.expedition?.montant_prestation || 0).toLocaleString()}
                                                                </span>
                                                            </div>
                                                            <div className="flex items-baseline gap-1.5">
                                                                <span className="text-[9px] font-medium text-slate-400 uppercase tracking-wide">Emballage</span>
                                                                <span className="text-[11px] font-semibold text-slate-600 tabular-nums">
                                                                    +{Number(group.expedition?.frais_emballage || 0).toLocaleString()}
                                                                </span>
                                                            </div>
                                                            {Number(group.expedition?.frais_annexes || 0) > 0 && (
                                                                <div className="flex items-baseline gap-1.5">
                                                                    <span className="text-[9px] font-medium text-slate-400 uppercase tracking-wide">Annexes</span>
                                                                    <span className="text-[11px] font-semibold text-amber-600 tabular-nums">
                                                                        +{Number(group.expedition?.frais_annexes || 0).toLocaleString()}
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Right: nb colis + paiement */}
                                                        <div className="ml-auto flex items-center gap-6">
                                                            <div className="flex flex-col items-end leading-none">
                                                                <span className="text-[8px] font-semibold text-slate-400 uppercase tracking-[0.15em] mb-1">Total Expédition</span>
                                                                <div className="flex items-baseline gap-1">
                                                                    <span className="text-[14px] font-semibold text-slate-900">
                                                                        {Number(group.expedition?.montant_expedition || 0).toLocaleString() }
                                                                    </span>
                                                                    <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-widest">CFA</span>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-4 pr-6 border-r border-slate-200">
                                                                <div className={`px-2 py-1 rounded text-[10px] font-semibold uppercase tracking-wider border shadow-sm
                                                                    ${group.expedition?.statut_paiement === 'paye'
                                                                        ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                                                        : 'bg-amber-50 text-amber-600 border-amber-100'
                                                                    }`}>
                                                                    {group.expedition?.statut_paiement === 'paye' ? 'Payé' : 'Impayé'}
                                                                </div>
                                                            </div>
                                                            <div className="flex flex-col items-end">
                                                                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">
                                                                    {group.parcels.length} Colis
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>

                                            {/* ── Lignes colis ── */}
                                            {group.parcels.map((parcel) => (
                                                <tr
                                                    key={parcel.id}
                                                    className="hover:bg-slate-50 transition-colors group"
                                                >
                                                    <td className="px-6 py-3">
                                                        <div className="flex items-center gap-3">
                                                            <div className="h-10 w-10 bg-slate-100 text-slate-500 rounded-lg flex items-center justify-center border border-slate-200 group-hover:bg-white group-hover:scale-110 transition-all duration-300">
                                                                <TypeIcon size={18} />
                                                            </div>
                                                            <div>
                                                                <span className="block font-semibold text-slate-900 text-sm">{parcel.code_colis}</span>
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
                                                    <td className="px-6 py-3 text-right">
                                                        <div className="flex items-center justify-end gap-2">
                                                            <button
                                                                onClick={() => handleViewParcel(parcel)}
                                                                className="px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all border border-slate-200 text-slate-600 hover:bg-slate-50 active:scale-95"
                                                            >
                                                                Détails
                                                            </button>
                                                            {/* {parcel.is_controlled ? (
                                                                <div className="px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest border border-emerald-200 bg-emerald-50 text-emerald-600 flex items-center gap-2">
                                                                    <ShieldCheck size={12} />
                                                                    Réceptionné
                                                                </div>
                                                            ) : (
                                                                <div className="px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest border border-amber-200 bg-amber-50 text-amber-600 flex items-center gap-2">
                                                                    <ArrowDownToLine size={12} />
                                                                    En attente
                                                                </div>
                                                            )} */}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
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
                                                    <span className="text-[9px] text-slate-500 font-bold uppercase">
                                                        {group.expedition?.pays_depart} → {group.expedition?.destinataire?.ville}
                                                    </span>
                                                </div>
                                            </div>
                                            <span className="text-[9px] font-bold bg-white px-1.5 py-0.5 rounded border border-slate-200 text-slate-500 shrink-0">
                                                {group.parcels.length} colis
                                            </span>
                                        </div>

                                        {/* Liste colis mobile */}
                                        <div className="divide-y divide-slate-200">
                                            {group.parcels.map((parcel) => (
                                                <div key={parcel.id} className="p-4 space-y-3 bg-white active:bg-slate-50">
                                                    <div className="flex items-start gap-3">
                                                        <div className="h-9 w-9 bg-slate-100 text-slate-500 rounded-lg flex items-center justify-center border border-slate-200 shrink-0">
                                                            <TypeIcon size={16} />
                                                        </div>
                                                        <div className="min-w-0 flex-1">
                                                            <p className="font-bold text-slate-800 text-sm truncate">{parcel.code_colis}</p>
                                                            <p className="text-[10px] font-bold text-slate-400 uppercase mt-0.5 truncate">
                                                                {parcel.designation || 'Sans désignation'}
                                                            </p>
                                                        </div>
                                                        {/* {parcel.is_controlled ? (
                                                            <span className="shrink-0 text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100">
                                                                Réceptionné
                                                            </span>
                                                        ) : (
                                                            <span className="shrink-0 text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-100">
                                                                En attente
                                                            </span>
                                                        )} */}
                                                    </div>

                                                    <button
                                                        onClick={() => handleViewParcel(parcel)}
                                                        className="w-full px-4 py-2 bg-slate-100 text-slate-900 rounded-lg text-xs font-bold uppercase active:scale-95 transition-transform flex items-center justify-center gap-2"
                                                    >
                                                        <Eye size={13} />
                                                        Voir les détails
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default IncomingParcels;
