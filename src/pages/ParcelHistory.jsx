import React, { useState, useMemo, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchParcels, updateExpedition } from '../redux/slices/parcelSlice';
import { ROUTES } from '../routes';
import Modal from '../components/common/Modal';
import {
    Package,
    Search,
    RefreshCw,
    Loader2,
    Calendar,
    Truck,
    Ship,
    Plane,
    ClipboardCheck,
    Building2,
    MapPin,
    Archive,
    ArrowRight,
    Edit2,
    Euro,
    Info
} from "lucide-react";

/**
 * ParcelHistory (Historique des Colis)
 */
const ParcelHistory = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { items, isLoading, hasLoaded } = useSelector(state => state.parcels.historyList);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const isUpdatingExpedition = useSelector(state => state.parcels.isUpdatingExpedition);

    // Expedition Edit State
    const [isExpeditionModalOpen, setIsExpeditionModalOpen] = useState(false);
    const [selectedExpedition, setSelectedExpedition] = useState(null);
    const [fraisExpedition, setFraisExpedition] = useState('');
    const [lienTracking, setLienTracking] = useState('');

    // Date filtering state
    const [dateDebut, setDateDebut] = useState('');
    const [dateFin, setDateFin] = useState('');

    useEffect(() => {
        if (!hasLoaded && !isLoading) {
            dispatch(fetchParcels({
                listType: 'history'
            }));
        }
    }, [dispatch, hasLoaded, isLoading]);

    const fetchData = async () => {
        setIsRefreshing(true);
        await dispatch(fetchParcels({
            listType: 'history',
            date_debut: dateDebut || null,
            date_fin: dateFin || null
        }));
        setIsRefreshing(false);
    };

    const handleRefresh = () => {
        fetchData();
    };

    const handleSearch = () => {
        fetchData();
    };



    const handleViewParcel = (parcel) => {
        if (!parcel?.code_colis) return;
        navigate(ROUTES.PARCEL_CONTROL.replace(':code', parcel.code_colis), { state: { from: 'history' } });
    };

    const handleEditExpedition = (expedition) => {
        setSelectedExpedition(expedition);
        setFraisExpedition(expedition.frais_annexes || '');
        setLienTracking(expedition.code_suivi_expedition || '');
        setIsExpeditionModalOpen(true);
    };

    const handleSaveExpedition = async () => {
        if (!selectedExpedition) return;

        await dispatch(updateExpedition({
            id: selectedExpedition.id,
            frais_expedition: fraisExpedition,
            lien_tracking: lienTracking
        }));

        setIsExpeditionModalOpen(false);
    };

    const getStatusInfo = (status) => {
        switch (status) {
            case 'en_transit_entrepot':
                return { label: 'À contrôler', styles: 'bg-amber-50 text-amber-600 border-amber-100', icon: ClipboardCheck };
            case 'depart_expedition_succes':
                return { label: 'Contrôlé / Validé', styles: 'bg-emerald-50 text-emerald-600 border-emerald-100', icon: ShieldCheck };
            default:
                return { label: status || 'En attente', styles: 'bg-slate-50 text-slate-600 border-slate-100', icon: Package };
        }
    };

    const getTypeIcon = (reference = '') => {
        if (reference.includes('AERIEN')) return Plane;
        if (reference.includes('MARITIME')) return Ship;
        return Package;
    };

    // Filter logic: Search ONLY (Date is handled by API)
    const filteredParcels = useMemo(() => {
        return items.filter(parcel => {
            const searchStr = searchTerm.toLowerCase();
            return (
                parcel.code_colis?.toLowerCase().includes(searchStr) ||
                parcel.expedition?.reference?.toLowerCase().includes(searchStr) ||
                parcel.designation?.toLowerCase().includes(searchStr) ||
                parcel.expedition?.pays_destination?.toLowerCase().includes(searchStr)
            );
        });
    }, [items, searchTerm]);

    // Grouping logic
    const groupedParcels = useMemo(() => {
        const groups = {};
        filteredParcels.forEach(parcel => {
            const key = parcel.expedition?.id || 'other';
            if (!groups[key]) {
                groups[key] = {
                    id: key,
                    expedition: parcel.expedition,
                    parcels: []
                };
            }
            groups[key].parcels.push(parcel);
        });
        return Object.values(groups).sort((a, b) => {
            // Sort by most recent expedition departure or creation
            const dateA = new Date(a.expedition?.date_expedition_depart || a.expedition?.created_at || 0);
            const dateB = new Date(b.expedition?.date_expedition_depart || b.expedition?.created_at || 0);
            return dateB - dateA;
        });
    }, [filteredParcels]);

    return (
        <div className="space-y-4 pb-6 md:space-y-6 md:pb-12 font-sans">

            {/* HEADER SECTION */}
            <header className="space-y-3 md:space-y-0">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                            Historique des Contrôles
                        </h1>
                        <p className="text-xs md:text-sm text-slate-500 mt-0.5 font-medium">
                            Consultez la liste des colis déjà contrôlés et validés
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

            {/* FILTERS BAR */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-4 md:space-y-0 md:flex md:items-center md:gap-4">

                {/* Search */}
                <div className="relative group flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-slate-900 transition-colors" />
                    <input
                        type="text"
                        placeholder="Rechercher (Code, Expédition, Pays...)"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 transition-all text-sm placeholder:text-slate-400"
                    />
                </div>

                {/* Date Filter */}
                <div className="flex items-center gap-2 w-full md:w-auto">
                    <div className="relative flex-1 md:flex-none">
                        <input
                            type="date"
                            value={dateDebut}
                            onChange={(e) => setDateDebut(e.target.value)}
                            className="w-full md:w-40 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-600 focus:outline-none focus:border-slate-900"
                        />
                        <span className="absolute top-0 right-0 -mt-2 -mr-1 text-[10px] bg-white px-1 text-slate-400 font-bold uppercase tracking-wider">Du</span>
                    </div>
                    <div className="relative flex-1 md:flex-none">
                        <input
                            type="date"
                            value={dateFin}
                            onChange={(e) => setDateFin(e.target.value)}
                            className="w-full md:w-40 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-600 focus:outline-none focus:border-slate-900"
                        />
                        <span className="absolute top-0 right-0 -mt-2 -mr-1 text-[10px] bg-white px-1 text-slate-400 font-bold uppercase tracking-wider">Au</span>
                    </div>
                    <button
                        onClick={handleSearch}
                        className="p-2.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors shadow-sm active:scale-95"
                        title="Rechercher"
                    >
                        <Search size={16} />
                    </button>
                    {(dateDebut || dateFin) && (
                        <button
                            onClick={() => { setDateDebut(''); setDateFin(''); }}
                            className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                        >
                            <RefreshCw size={16} className="rotate-45" />
                        </button>
                    )}
                </div>
            </div>

            {/* MAIN CONTENT AREA */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden text-black transition-all">
                {/* Header Summary */}
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/10 flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        {filteredParcels.length} colis trouvés
                    </span>
                </div>

                {/* Content */}
                {isLoading && !isRefreshing ? (
                    <div className="flex flex-col items-center justify-center py-24 px-6">
                        <Loader2 className="animate-spin text-slate-900 mb-4" size={40} strokeWidth={1.5} />
                        <p className="text-slate-500 font-bold text-[10px] uppercase tracking-widest">Chargement de l'historique...</p>
                    </div>
                ) : filteredParcels.length === 0 ? (
                    <div className="py-24 text-center px-6">
                        <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100 shadow-inner">
                            <Archive className="text-slate-300" size={40} />
                        </div>
                        <h3 className="font-bold text-slate-900 text-lg tracking-tight">Aucun résultat</h3>
                        <p className="text-slate-500 text-sm mt-1 font-medium max-w-xs mx-auto">
                            Aucun colis ne correspond à vos critères de recherche dans l'historique.
                        </p>
                    </div>
                ) : (
                    <>
                        {/* Desktop Table */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-slate-50/50 border-b border-slate-200">
                                    <tr>
                                        <th className="px-6 py-3 text-left font-bold text-slate-500 uppercase tracking-wider text-xs">Colis / Désignation</th>
                                        <th className="px-6 py-3 text-left font-bold text-slate-500 uppercase tracking-wider text-xs">Date</th>
                                        <th className="px-6 py-3 text-left font-bold text-slate-500 uppercase tracking-wider text-xs">Provenance</th>
                                        <th className="px-6 py-3 text-left font-bold text-slate-500 uppercase tracking-wider text-xs">Destination</th>
                                        <th className="px-6 py-3 text-right font-bold text-slate-500 uppercase tracking-wider text-xs">Action</th>
                                    </tr>
                                </thead>
                                {groupedParcels.map(group => (
                                    <tbody key={group.id} className="divide-y divide-slate-200 border-b-4 border-slate-50">
                                        <tr className="bg-slate-50/80">
                                            <td colSpan="5" className="px-6 py-2">
                                                <div className="flex items-center w-full gap-8">
                                                    {/* Left: Reference Container */}
                                                    <div className="flex items-center gap-2 px-2.5 py-1 bg-white border border-slate-200/60 rounded-lg shadow-sm">
                                                        <Truck size={13} className="text-blue-500/80" />
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

                                                    {/* Right: Total & Status & Actions */}
                                                    <div className="ml-auto flex items-center gap-6">
                                                        {/* Financial Total Section */}
                                                        <div className="flex items-center gap-4 pr-6 border-r border-slate-200">
                                                            <div className="flex flex-col items-end leading-none">
                                                                <span className="text-[8px] font-semibold text-slate-400 uppercase tracking-[0.15em] mb-1">Total Expédition</span>
                                                                <div className="flex items-baseline gap-1">
                                                                    <span className="text-[14px] font-semibold text-slate-900">
                                                                        {Number(group.expedition?.montant_expedition || 0).toLocaleString()}
                                                                    </span>
                                                                    <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-widest">CFA</span>
                                                                </div>
                                                            </div>

                                                            <div className={`px-2 py-1 rounded text-[10px] font-semibold uppercase tracking-wider border shadow-sm transition-all
                                                                ${group.expedition?.statut_paiement === 'paye'
                                                                    ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                                                    : 'bg-amber-50 text-amber-600 border-amber-100'
                                                                }`}>
                                                                {group.expedition?.statut_paiement === 'paye' ? 'Payé' : 'Impayé'}
                                                            </div>
                                                        </div>

                                                        {/* Group stats & Actions */}
                                                        <div className="flex items-center gap-4">
                                                            <div className="flex flex-col items-end">
                                                                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">
                                                                    {group.parcels.length} Colis
                                                                </span>
                                                            </div>
                                                            <button
                                                                onClick={() => handleEditExpedition(group.expedition)}
                                                                className="p-1.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-slate-400 hover:text-blue-600 transition-all shadow-sm group"
                                                                title="Modifier l'expédition"
                                                            >
                                                                <Edit2 size={13} className="group-hover:scale-110 transition-transform" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                        {
                                            group.parcels.map((parcel) => {
                                                const TypeIcon = getTypeIcon(parcel.code_colis);
                                                return (
                                                    <tr key={parcel.id} className="hover:bg-slate-50/50 transition-colors group">
                                                        <td className="px-6 py-3 pl-10">
                                                            <div className="flex items-center gap-3">
                                                                <div className="h-10 w-10 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-lg flex items-center justify-center group-hover:scale-110 transition-all duration-300">
                                                                    <TypeIcon size={18} />
                                                                </div>
                                                                <div>
                                                                    <span className="block font-semibold text-slate-900 text-sm">{parcel.code_colis}</span>
                                                                    <span className="text-xs font-bold text-slate-400 uppercase">{parcel.designation || 'Sans désignation'}</span>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-3">
                                                            <span className="text-sm font-bold text-slate-500">
                                                                {new Date(parcel.expedition?.date_expedition_depart || parcel.expedition?.created_at || parcel.expedition?.updated_at).toLocaleDateString('fr-FR')}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-3">
                                                            <div className="flex items-center gap-1.5 text-slate-800 text-sm font-semibold ">
                                                                <Building2 size={16} className="text-slate-400" />
                                                                {parcel.expedition?.agence?.nom_agence}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-3">
                                                            <div className="flex items-center gap-1.5 text-slate-800 text-sm font-semibold uppercase">
                                                                <MapPin size={16} className="text-slate-400" />
                                                                {parcel.expedition?.pays_destination}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-3 text-right">
                                                            <button
                                                                onClick={() => handleViewParcel(parcel)}
                                                                className="px-4 py-2 bg-white border border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-50 rounded-lg text-xs font-bold uppercase tracking-widest transition-all shadow-sm active:scale-95"
                                                            >
                                                                Voir détails
                                                            </button>
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        }
                                    </tbody>
                                ))}
                            </table>
                        </div>

                        {/* Mobile Cards */}
                        <div className="md:hidden space-y-4">
                            {groupedParcels.map(group => (
                                <div key={group.id} className="bg-slate-50/50 rounded-xl border border-slate-200 overflow-hidden">
                                    <div className="px-4 py-3 bg-slate-100/50 border-b border-slate-200 flex items-center justify-between">
                                        <div className="flex flex-col">
                                            <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
                                                <Truck size={12} /> {group.expedition?.reference || 'N/A'}
                                            </span>
                                            <span className="text-[10px] text-slate-500 uppercase font-bold mt-0.5 flex items-center gap-2">
                                                {Number(group.expedition?.montant_expedition || 0).toLocaleString()} CFA
                                                <span className={`px-1 rounded ${group.expedition?.statut_paiement === 'paye' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                                    {group.expedition?.statut_paiement === 'paye' ? 'PAYÉ' : 'NON PAYÉ'}
                                                </span>
                                            </span>
                                        </div>
                                        <div className="flex items-center">
                                            <span className="text-[10px] font-bold bg-white px-2 py-1 rounded border border-slate-200 text-slate-500">
                                                {group.parcels.length}
                                            </span>
                                            <button
                                                onClick={() => handleEditExpedition(group.expedition)}
                                                className="ml-2 p-1.5 bg-white border border-slate-200 rounded-md text-slate-400 hover:text-blue-600 active:bg-slate-50"
                                            >
                                                <Edit2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="divide-y divide-slate-100">
                                        {group.parcels.map((parcel) => {
                                            const TypeIcon = getTypeIcon(parcel.code_colis);
                                            return (
                                                <div key={parcel.id} className="p-4 bg-white space-y-4 active:bg-slate-50 transition-colors">
                                                    <div className="flex items-start justify-between">
                                                        <div className="flex gap-3">
                                                            <div className="h-10 w-10 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-lg flex items-center justify-center shadow-sm">
                                                                <TypeIcon size={20} />
                                                            </div>
                                                            <div>
                                                                <p className="font-bold text-slate-800 text-sm">{parcel.code_colis}</p>
                                                                <div className="flex items-center gap-1 mt-1">
                                                                    <Calendar size={10} className="text-slate-400" />
                                                                    <span className="text-xs font-bold text-slate-500">
                                                                        {new Date(parcel.expedition?.date_expedition_depart || parcel.expedition?.created_at || parcel.expedition?.updated_at).toLocaleDateString('fr-FR')}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => handleViewParcel(parcel)}
                                                        className="w-full px-4 py-3 bg-white border border-slate-200 text-slate-700 rounded-lg text-xs font-bold uppercase shadow-sm active:scale-95 transition-transform hover:bg-slate-50"
                                                    >
                                                        Voir détails
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>

            {/* EXPEDITION EDIT MODAL */}
            <Modal
                isOpen={isExpeditionModalOpen}
                onClose={() => setIsExpeditionModalOpen(false)}
                title="Modifier l'expédition"
                subtitle={`Expédition ${selectedExpedition?.reference || ''}`}
                size="sm"
                onConfirm={handleSaveExpedition}
                isLoading={isUpdatingExpedition}
                confirmLabel="Enregistrer"
            >
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Frais Annexes</label>
                        <div className="relative">
                            <Euro className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <input
                                type="number"
                                value={fraisExpedition}
                                onChange={(e) => setFraisExpedition(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-slate-900 text-sm font-medium"
                                placeholder="0.00"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Lien de Tracking</label>
                        <div className="relative">
                            <Info className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <input
                                type="text"
                                value={lienTracking}
                                onChange={(e) => setLienTracking(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-slate-900 text-sm font-medium"
                                placeholder="https://..."
                            />
                        </div>
                    </div>
                </div>
            </Modal>
        </div >
    );
};

export default ParcelHistory;
