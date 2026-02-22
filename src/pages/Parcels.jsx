import React, { useState, useMemo, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchParcels, updateExpedition, controlParcels } from '../redux/slices/parcelSlice';
import { showNotification } from "../redux/slices/uiSlice";
import { ROUTES } from '../routes';
import Modal from '../components/common/Modal';
import QRScanner from '../components/common/QRScanner';
import {
  Package,
  Search,
  Plus,
  RefreshCw,
  Loader2,
  ChevronRight,
  ChevronLeft,
  Calendar,
  Truck,
  Ship,
  Plane,
  ClipboardCheck,
  PackageCheck,
  ShieldCheck,
  MoveUpRight,
  Eye,
  MoreVertical,
  MapPin,
  Scale,
  Maximize2,
  Euro,
  Tag,
  Hash,
  Info,
  Blocks,
  User,
  Building2,
  Edit2
} from "lucide-react";

/**
 * Parcels (Gestion Colis) - Real data integration
 */
const Parcels = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  // Use todoList state
  const { items, isLoading, error, hasLoaded } = useSelector(state => state.parcels.todoList);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isQRScannerOpen, setIsQRScannerOpen] = useState(false);

  // Expedition Edit State
  const [isExpeditionModalOpen, setIsExpeditionModalOpen] = useState(false);
  const [selectedExpedition, setSelectedExpedition] = useState(null);
  const [fraisExpedition, setFraisExpedition] = useState('');
  const [lienTracking, setLienTracking] = useState('');
  const isUpdatingExpedition = useSelector(state => state.parcels.isUpdatingExpedition);
  const isBulkControlling = useSelector(state => state.parcels.isBulkControlling);

  // Selection state
  const [selectedCodes, setSelectedCodes] = useState([]);
  const [validatingCode, setValidatingCode] = useState(null);

  const toggleSelect = (code) => {
    setSelectedCodes(prev =>
      prev.includes(code)
        ? prev.filter(c => c !== code)
        : [...prev, code]
    );
  };

  const toggleSelectAll = () => {
    // Only select parcels that are NOT already controlled
    const selectableParcels = filteredParcels.filter(p => !p.is_controlled);

    if (selectedCodes.length === selectableParcels.length && selectableParcels.length > 0) {
      setSelectedCodes([]);
    } else {
      setSelectedCodes(selectableParcels.map(p => p.code_colis));
    }
  };

  const handleBulkControl = async () => {
    if (selectedCodes.length === 0) return;

    try {
      const resultAction = await dispatch(controlParcels(selectedCodes)).unwrap();
      dispatch(showNotification({
        type: 'success',
        message: `${selectedCodes.length} colis contrôlés avec succès.`
      }));
      setSelectedCodes([]);
    } catch (error) {
      dispatch(showNotification({
        type: 'error',
        message: error.message || "Erreur lors du contrôle des colis."
      }));
    }
  };

  const handleSingleValidate = async (code) => {
    setValidatingCode(code);
    try {
      await dispatch(controlParcels([code])).unwrap();
      dispatch(showNotification({
        type: 'success',
        message: `Le colis ${code} a été validé.`
      }));
    } catch (error) {
      dispatch(showNotification({
        type: 'error',
        message: error.message || "Erreur lors de la validation du colis."
      }));
    } finally {
      setValidatingCode(null);
    }
  };

  useEffect(() => {
    // Only fetch if not already loaded (persist data)
    if (!hasLoaded) {
      dispatch(fetchParcels({ listType: 'todo' }));
    }
  }, [dispatch, hasLoaded]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await dispatch(fetchParcels({ listType: 'todo' }));
    setIsRefreshing(false);
  };

  const handleViewParcel = (parcel) => {
    if (!parcel?.code_colis) return;
    navigate(ROUTES.PARCEL_CONTROL.replace(':code', parcel.code_colis), { state: { from: 'todo' } });
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
      navigate(ROUTES.PARCEL_CONTROL.replace(':code', decodedText));
    }
  };

  const getStatusInfo = (status) => {
    switch (status) {
      case 'en_transit_entrepot':
        return { label: 'À contrôler', styles: 'bg-amber-50 text-amber-600 border-amber-100', icon: ClipboardCheck };
      case 'depart_expedition_succes':
        return { label: 'Validé / Expédié', styles: 'bg-emerald-50 text-emerald-600 border-emerald-100', icon: ShieldCheck };
      default:
        return { label: status || 'En attente', styles: 'bg-slate-50 text-slate-600 border-slate-100', icon: Package };
    }
  };

  const getTypeIcon = (reference = '') => {
    if (reference.includes('AERIEN')) return Plane;
    if (reference.includes('MARITIME')) return Ship;
    return Package;
  };

  // Filter logic - simple search only
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
            <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
              Colis à Contrôler
            </h1>
            <p className="text-xs md:text-sm text-slate-500 mt-0.5 font-medium">
              Liste des colis en attente de vérification logistique
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

            <button
              onClick={() => setIsQRScannerOpen(true)}
              className="flex items-center p-3 text-white text-sm font-bold bg-slate-900 hover:bg-slate-800 rounded-lg shadow-sm transition-all border border-slate-900"
            >
              <PackageCheck className="h-4 w-4" />
              <span className="hidden md:inline md:ml-2 uppercase tracking-widest text-[10px]">Scan QR Code</span>
            </button>
          </div>
        </div>
      </header>

      {/* SEARCH BAR */}
      <div className="relative group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-slate-900 transition-colors" />
        <input
          type="text"
          placeholder="Rechercher un colis à contrôler..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 md:pl-12 pr-3 md:pr-4 py-2.5 md:py-3  bg-white border border-slate-200 rounded-lg shadow-sm focus:outline-none focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900 transition-all text-sm placeholder:text-slate-400"
        />
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden text-black transition-all">
        {/* Table Header Summary */}
        <div className="px-4 py-3 md:px-6 md:py-4 border-b border-slate-100 bg-slate-50/10">
          <div className="flex flex-col md:flex-row md:items-center gap-3 md:items-center justify-between">
            <div className="flex items-center justify-between md:justify-start gap-4">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">
                {groupedParcels.length} expéditions ({filteredParcels.length} colis)
              </span>

            </div>

            {selectedCodes.length > 0 && (
              <div className="flex items-center hidden md:flex gap-2 md:gap-3 md:pl-4 md:border-l md:border-slate-200 animate-in fade-in slide-in-from-top-2 md:slide-in-from-left-2 transition-all">
                <span className="hidden md:inline text-[10px] font-bold text-indigo-600 uppercase tracking-widest whitespace-nowrap">
                  {selectedCodes.length} sélectionné(s)
                </span>
                <button
                  onClick={handleBulkControl}
                  disabled={isBulkControlling}
                  className="flex-1 md:flex-none flex items-center justify-center gap-2 px-3 py-2 md:py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg md:rounded-md text-[10px] font-bold uppercase tracking-wider transition-all shadow-sm shadow-indigo-200 active:scale-95 disabled:opacity-50"
                >
                  {isBulkControlling ? <Loader2 size={12} className="animate-spin" /> : <PackageCheck size={12} />}
                  Valider la sélection
                </button>
                <button
                  onClick={() => setSelectedCodes([])}
                  className="px-2 py-2 md:py-1 text-[10px] font-bold text-slate-400 hover:text-slate-600 uppercase tracking-widest transition-colors flex items-center justify-center"
                >
                  Annuler
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Table/List Content */}
        {isLoading && !isRefreshing ? (
          <div className="flex flex-col items-center justify-center py-24 px-6">
            <Loader2 className="animate-spin text-slate-900 mb-4" size={40} strokeWidth={1.5} />
            <p className="text-slate-500 font-bold text-[10px] uppercase tracking-widest">Chargement des colis...</p>
          </div>
        ) : filteredParcels.length === 0 ? (
          <div className="py-24 text-center px-6">
            <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100 shadow-inner">
              <Package className="text-slate-300" size={40} />
            </div>
            <h3 className="font-bold text-slate-900 text-lg tracking-tight">Tout est à jour</h3>
            <p className="text-slate-500 text-sm mt-1 font-medium max-w-xs mx-auto">Aucun colis en attente de contrôle pour le moment.</p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
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
                    <th className="px-6 py-3 text-left font-bold text-slate-500 uppercase tracking-wider text-xs">Poids / Dimensions</th>
                    <th className="px-6 py-3 text-right font-bold text-slate-500 uppercase tracking-wider text-xs">Action</th>
                  </tr>
                </thead>
                {groupedParcels.map(group => (
                  <tbody key={group.id} className="divide-y divide-slate-200 border-b-4 border-slate-50">
                    <tr className="bg-slate-50/80">
                      <td colSpan="6" className="px-6 py-2">
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
                        const status = getStatusInfo(parcel.expedition?.statut_expedition);
                        const TypeIcon = getTypeIcon(parcel.code_colis);
                        return (
                          <tr key={parcel.id} className={`hover:bg-slate-50 transition-colors group ${selectedCodes.includes(parcel.code_colis) ? 'bg-indigo-50/30' : ''} ${parcel.is_controlled ? 'opacity-80' : ''}`}>
                            <td className="px-6 py-3">
                              <div className="flex items-center">
                                <input
                                  type="checkbox"
                                  checked={selectedCodes.includes(parcel.code_colis)}
                                  onChange={() => toggleSelect(parcel.code_colis)}
                                  disabled={parcel.is_controlled}
                                  className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                                />
                              </div>
                            </td>
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
                              <div className="flex flex-col">
                                <div className="flex items-center gap-1.5 text-slate-800 text-sm font-semibold ">
                                  <Building2 size={18} className="text-slate-400" />
                                  {parcel.expedition?.agence?.nom_agence}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-3">
                              <div className="flex flex-col">
                                <div className="flex items-center gap-1.5 text-slate-800 text-sm font-semibold uppercase">
                                  <MapPin size={14} className="text-slate-400" />
                                  {parcel.expedition?.pays_destination}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-3">
                              <div className="flex flex-col">
                                <span className="text-sm font-semibold text-slate-800">{parcel.poids} kg</span>
                              </div>
                            </td>
                            <td className="px-6 py-3 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => handleViewParcel(parcel)}
                                  className="px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all border border-slate-200 text-slate-600 hover:bg-slate-50 active:scale-95"
                                >
                                  Détails
                                </button>
                                {parcel.is_controlled ? (
                                  <div className="px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest border border-emerald-200 bg-emerald-50 text-emerald-600 flex items-center gap-2">
                                    <ShieldCheck size={12} />
                                    Contrôlé
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => handleSingleValidate(parcel.code_colis)}
                                    disabled={isBulkControlling || validatingCode === parcel.code_colis}
                                    className="px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all bg-slate-900 text-white hover:bg-slate-800 shadow-md shadow-slate-900/10 active:scale-95 flex items-center gap-2 disabled:opacity-50"
                                  >
                                    {validatingCode === parcel.code_colis ? <Loader2 size={12} className="animate-spin" /> : <PackageCheck size={12} />}
                                    Valider
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    }
                  </tbody>
                ))}
              </table>
            </div>

            {/* Mobile Cards View */}
            <div className="md:hidden space-y-4 p-2">
              {groupedParcels.map(group => (
                <div key={group.id} className="bg-slate-50/50 rounded-xl border border-slate-200 overflow-hidden">
                  <div className="px-3 py-3 bg-slate-100/50 border-b border-slate-200 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <span className="text-xs font-bold text-slate-700 flex items-center gap-1 truncate">
                        <Truck size={12} className="shrink-0" /> {group.expedition?.reference || 'N/A'}
                      </span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[9px] text-slate-500 font-bold">
                          {Number(group.expedition?.montant_expedition || 0).toLocaleString()} CFA
                        </span>
                        <span className={`px-1 rounded text-[8px] font-bold ${group.expedition?.statut_paiement === 'paye' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                          {group.expedition?.statut_paiement === 'paye' ? 'PAYÉ' : 'NON PAYÉ'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-[9px] font-bold bg-white px-1.5 py-0.5 rounded border border-slate-200 text-slate-500">
                        {group.parcels.length}
                      </span>
                      <button
                        onClick={() => handleEditExpedition(group.expedition)}
                        className="p-1.5 bg-white border border-slate-200 rounded-md text-slate-400 hover:text-blue-600 active:bg-slate-50"
                      >
                        <Edit2 size={12} />
                      </button>
                    </div>
                  </div>

                  <div className="divide-y divide-slate-200">
                    {group.parcels.map((parcel) => {
                      const isSelected = selectedCodes.includes(parcel.code_colis);
                      return (
                        <div
                          key={parcel.id}
                          className={`p-4 space-y-4 transition-colors ${isSelected ? 'bg-indigo-50/50' : 'bg-white'} active:bg-slate-50 ${parcel.is_controlled ? 'opacity-70' : ''}`}
                          onClick={() => !parcel.is_controlled && toggleSelect(parcel.code_colis)}
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
                                  disabled={parcel.is_controlled}
                                  className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600 cursor-pointer disabled:opacity-30"
                                />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="font-bold text-slate-800 text-sm truncate">{parcel.code_colis}</p>
                                <p className="text-[10px] font-bold text-slate-400 uppercase mt-0.5 truncate">{parcel.expedition?.pays_destination}</p>
                              </div>
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleViewParcel(parcel);
                              }}
                              className="flex-1 px-4 py-2 bg-gray-200 text-slate-900 rounded-lg text-xs font-bold uppercase active:scale-95 transition-transform"
                            >
                              Détails
                            </button>
                            {parcel.is_controlled ? (
                              <div className="flex-1 px-4 py-2 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-lg text-xs font-bold uppercase flex items-center justify-center gap-2">
                                <ShieldCheck size={14} />
                                Contrôlé
                              </div>
                            ) : (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSingleValidate(parcel.code_colis);
                                }}
                                disabled={isBulkControlling || validatingCode === parcel.code_colis}
                                className="flex-1 px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold uppercase shadow-lg shadow-slate-900/10 active:scale-95 transition-transform flex items-center justify-center gap-2 disabled:opacity-50"
                              >
                                {validatingCode === parcel.code_colis ? <Loader2 size={14} className="animate-spin" /> : <PackageCheck size={14} />}
                                Valider
                              </button>
                            )}
                          </div>
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

      {/* EXPEDITION EDIT MODAL */}
      <Modal
        isOpen={isExpeditionModalOpen}
        onClose={() => setIsExpeditionModalOpen(false)}
        title="Modifier l'expédition"
        subtitle={`Expédition ${selectedExpedition?.reference || ''}`}
        size="sm"
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
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-900 text-sm font-medium"
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
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-900 text-sm font-medium"
                placeholder="https://..."
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <button
              onClick={() => setIsExpeditionModalOpen(false)}
              className="px-4 py-2 text-sm font-bold text-slate-500 hover:text-slate-700"
            >
              Annuler
            </button>
            <button
              onClick={handleSaveExpedition}
              disabled={isUpdatingExpedition}
              className="px-6 py-2 bg-slate-900 text-white rounded-lg text-sm font-bold shadow-md hover:bg-slate-800 disabled:opacity-50 flex items-center gap-2"
            >
              {isUpdatingExpedition && <Loader2 className="animate-spin" size={14} />}
              Enregistrer
            </button>
          </div>
        </div>
      </Modal>

      {/* MOBILE FLOATING ACTION BAR */}
      {selectedCodes.length > 0 && (
        <div className="md:hidden fixed bottom-4 left-4 right-4 z-50 animate-in slide-in-from-bottom-10 duration-300">
          <div className="bg-slate-900 text-white rounded-lg shadow-2xl shadow-slate-900/40 p-2 flex items-center justify-between border border-white/10 backdrop-blur-lg">
            <div className="flex flex-col min-w-0 pr-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Sélection</span>
              <span className="text-xs font-bold truncate">{selectedCodes.length} colis</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelectedCodes([])}
                className="px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-white transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleBulkControl}
                disabled={isBulkControlling}
                className="bg-white text-slate-900 px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 active:scale-95 transition-all disabled:opacity-50"
              >
                {isBulkControlling ? <Loader2 size={12} className="animate-spin" /> : <PackageCheck size={12} />}
                Valider
              </button>
            </div>
          </div>
        </div>
      )}

    </div >
  );
};

export default Parcels;
