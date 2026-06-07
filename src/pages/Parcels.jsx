import React, { useState, useMemo, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchParcels, updateExpeditionInfo, confirmExpeditionDepart, controlParcels, blockParcels } from '../redux/slices/parcelSlice';
import { showNotification } from "../redux/slices/uiSlice";
import { ROUTES } from '../routes';
import Modal from '../components/common/Modal';
import QRScanner from '../components/common/QRScanner';
import {
  Package,
  Search,
  RefreshCw,
  Loader2,
  Truck,
  Ship,
  Plane,
  ClipboardCheck,
  PackageCheck,
  ShieldCheck,
  Eye,
  MapPin,
  AlertCircle,
  Wallet,
  Tag,
  Info,
  Building2,
  Edit2,
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

  // Expedition State
  const [isExpeditionModalOpen, setIsExpeditionModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [selectedExpedition, setSelectedExpedition] = useState(null);
  const [fraisExpedition, setFraisExpedition] = useState('');
  const [lienTracking, setLienTracking] = useState('');
  const isUpdatingExpedition = useSelector(state => state.parcels.isUpdatingExpedition);
  const isBulkControlling = useSelector(state => state.parcels.isBulkControlling);
  const isBulkBlocking = useSelector(state => state.parcels.isBulkBlocking);

  // Selection state
  const [selectedCodes, setSelectedCodes] = useState([]);
  const [validatingCode, setValidatingCode] = useState(null);

  // Block State
  const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);
  const [blockingCode, setBlockingCode] = useState(null);
  const [blockReason, setBlockReason] = useState('');

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

  const handleOpenBlockModal = (code) => {
    setBlockingCode(code);
    setBlockReason('');
    setIsBlockModalOpen(true);
  };

  const handleBulkBlock = () => {
    if (selectedCodes.length === 0) return;
    setBlockingCode(null); // Indicates batch mode
    setBlockReason('');
    setIsBlockModalOpen(true);
  };

  const handleConfirmBlock = async () => {
    if (!blockReason.trim()) {
      dispatch(showNotification({ type: 'error', message: "Veuillez renseigner un motif." }));
      return;
    }

    const codes = blockingCode ? [blockingCode] : selectedCodes;

    try {
      await dispatch(blockParcels({
        codes,
        motif_blocage: blockReason
      })).unwrap();

      dispatch(showNotification({
        type: 'success',
        message: codes.length > 1
          ? `${codes.length} colis ont été écartés avec succès.`
          : `Le colis ${codes[0]} a été écarté.`
      }));

      setIsBlockModalOpen(false);
      setBlockingCode(null);
      setBlockReason('');
      if (!blockingCode) setSelectedCodes([]); // Clear selection if batch
    } catch (error) {
      dispatch(showNotification({
        type: 'error',
        message: error.message || "Erreur lors du blocage."
      }));
    }
  };

  useEffect(() => {
    // Only fetch if not already loaded (persist data)
    if (!hasLoaded && !isLoading) {
      dispatch(fetchParcels({ listType: 'todo' }));
    }
  }, [dispatch, hasLoaded, isLoading]);

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

    try {
      await dispatch(updateExpeditionInfo({
        id: selectedExpedition.id,
        frais_annexes: fraisExpedition,
        code_suivi_expedition: lienTracking
      })).unwrap();

      dispatch(showNotification({
        type: 'success',
        message: `Informations de l'expédition ${selectedExpedition.reference} mises à jour.`
      }));
      setIsExpeditionModalOpen(false);
    } catch (error) {
      dispatch(showNotification({
        type: 'error',
        message: error.message || "Erreur lors de la mise à jour."
      }));
    }
  };

  const handleConfirmDepartAction = async () => {
    if (!selectedExpedition) return;

    try {
      await dispatch(confirmExpeditionDepart(selectedExpedition.id)).unwrap();

      dispatch(showNotification({
        type: 'success',
        message: `Départ de l'expédition ${selectedExpedition.reference} confirmé avec succès.`
      }));

      setIsConfirmModalOpen(false);
      setSelectedCodes([]);
    } catch (error) {
      dispatch(showNotification({
        type: 'error',
        message: error.message || "Erreur lors de la confirmation du départ."
      }));
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

      {/* STICKY HEADER & SEARCH */}
      <div className="sticky top-[-24px] md:top-[-32px] z-30 bg-[#f1f5f9] -mx-6 px-6 py-3 md:-mx-8 md:px-8 space-y-4 pt-4 lg:pt-2 pb-3">
        {/* HEADER SECTION */}
        <header className="space-y-3 md:space-y-0 text-black">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
                Colis à contrôler
              </h1>
              <p className="text-sm md:text-base text-slate-500 mt-0.5 font-medium">
                Liste des colis en attente de vérification
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

        {/* SEARCH BAR */}
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-slate-900 transition-colors" />
          <input
            type="text"
            placeholder="Rechercher un colis à contrôler..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 md:pl-12 pr-3 md:pr-4 py-2.5 md:py-3 bg-white border border-slate-200 rounded-lg shadow-sm focus:outline-none focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900 transition-all text-sm placeholder:text-slate-400 text-black"
          />
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden text-black transition-all">
        {/* Table Header Summary */}
        <div className="px-4 py-3 md:px-6 md:py-4 border-b border-slate-100 bg-slate-50/10">
          <div className="flex flex-col md:flex-row md:items-center gap-3 md:items-center justify-between">
            <div className="flex items-center justify-between md:justify-start gap-4">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">
                {groupedParcels.length} expéditions ({filteredParcels.length} colis)
              </span>

            </div>

            {selectedCodes.length > 0 && (
              <div className="flex items-center hidden md:flex gap-2 md:gap-3 md:pl-4 md:border-l md:border-slate-200 animate-in fade-in slide-in-from-top-2 md:slide-in-from-left-2 transition-all">
                <span className="hidden md:inline text-xs font-bold text-indigo-600 uppercase tracking-widest whitespace-nowrap">
                  {selectedCodes.length} sélectionné(s)
                </span>
                <button
                  onClick={handleBulkControl}
                  disabled={isBulkControlling}
                  className="flex-1 md:flex-none flex items-center justify-center gap-2 px-3 py-2 md:py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg md:rounded-md text-xs font-bold uppercase tracking-wider transition-all shadow-sm shadow-indigo-200 active:scale-95 disabled:opacity-50"
                >
                  {isBulkControlling ? <Loader2 size={16} className="animate-spin" /> : <PackageCheck size={16} />}
                  Valider la sélection
                </button>
                <button
                  onClick={handleBulkBlock}
                  disabled={isBulkBlocking || isBulkControlling}
                  className="flex-1 md:flex-none flex items-center justify-center gap-2 px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-md text-xs font-bold uppercase tracking-wider transition-all shadow-sm shadow-rose-200 active:scale-95 disabled:opacity-50"
                >
                  {isBulkBlocking ? <Loader2 size={16} className="animate-spin" /> : <AlertCircle size={16} />}
                  Bloquer la sélection
                </button>
                <button
                  onClick={() => setSelectedCodes([])}
                  className="px-2 py-1 text-xs font-bold text-slate-400 hover:text-slate-600 uppercase tracking-widest transition-colors flex items-center justify-center"
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
            <p className="text-slate-500 font-bold text-xs uppercase tracking-widest">Chargement des colis...</p>
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
                    <th className="px-6 py-4 text-left font-bold text-slate-500 uppercase tracking-wider text-sm">Colis / Désignation</th>
                    <th className="px-6 py-4 text-left font-bold text-slate-500 uppercase tracking-wider text-sm">Provenance</th>
                    <th className="px-6 py-4 text-left font-bold text-slate-500 uppercase tracking-wider text-sm">Destination</th>
                    <th className="px-6 py-4 text-left font-bold text-slate-500 uppercase tracking-wider text-sm">Poids</th>
                    <th className="px-6 py-4 text-right font-bold text-slate-500 uppercase tracking-wider text-sm">Action</th>
                  </tr>
                </thead>
                {groupedParcels.map((group, index) => (
                  <tbody key={group.id} className="divide-y divide-slate-100 border-b-8 border-slate-200 shadow-sm rounded-xl overflow-hidden">
                    {index > 0 && <tr className="h-6 bg-slate-50/30"><td colSpan="6"></td></tr>}
                    <tr className="bg-slate-50/50 border-t border-x border-slate-200">
                      <td colSpan="6" className="px-6 py-2">
                        <div className="flex items-center w-full gap-8">
                          {/* Left: Reference Container - Styled as a badge */}
                          <div className="flex items-center gap-3 px-3 py-1.5 bg-indigo-50 border border-indigo-100 rounded-full shadow-sm">
                            <Truck size={18} className="text-indigo-600" />
                            <span className="text-[11px] font-bold text-indigo-700 uppercase tracking-widest">
                              {group.expedition?.reference || 'Sans ref'}
                            </span>
                          </div>

                          {/* Right: Total & Status & Actions */}
                          <div className="ml-auto flex items-center gap-6">
                            {/* Financial Total Section */}
                            <div className="flex items-center gap-6 pr-6 border-r border-slate-200">
                              {/* Frais Expédition */}
                              <div className="flex flex-col gap-1">
                                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Frais Expédition</span>
                                <div className="flex items-center gap-2">
                                  <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded border leading-none
                                    ${group.expedition?.statut_paiement_expedition === 'paye'
                                      ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                      : 'bg-amber-50 text-amber-600 border-amber-100'
                                    }`}>
                                    {group.expedition?.statut_paiement_expedition === 'paye' ? 'Réglé' : 'Crédit'}
                                  </span>
                                  <div className="flex items-baseline gap-1">
                                    <span className="text-sm font-bold text-slate-800 tracking-tight">
                                      {Number(Number(group.expedition?.montant_expedition || 0) + Number(group.expedition?.frais_emballage || 0)).toLocaleString()}
                                    </span>
                                    <span className="text-[10px] font-medium text-slate-400 uppercase">CFA</span>
                                  </div>
                                </div>
                              </div>

                              {/* Frais Annexes */}
                              <div className="flex flex-col gap-1">
                                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Frais Annexes</span>
                                <div className="flex items-center gap-2">
                                  <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded border leading-none
                                    ${group.expedition?.statut_paiement_frais === 'paye'
                                      ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                      : 'bg-amber-50 text-amber-600 border-amber-100'
                                    }`}>
                                    {group.expedition?.statut_paiement_frais === 'paye' ? 'Réglé' : 'À payer'}
                                  </span>
                                  <div className="flex items-baseline gap-1">
                                    <span className="text-sm font-bold text-slate-800 tracking-tight">
                                      {Number(group.expedition?.frais_annexes || 0).toLocaleString()}
                                    </span>
                                    <span className="text-[10px] font-medium text-slate-400 uppercase">CFA</span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Group stats & Actions */}
                            <div className="flex items-center gap-4">
                              <div className="flex flex-col">
                                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{group.parcels.length} Colis</span>
                                <span className={`text-[11px] font-bold uppercase tracking-tight ${group.parcels.every(p => p.is_controlled && !p.is_blocked) ? 'text-emerald-500' : 'text-slate-400'}`}>
                                  {group.parcels.filter(p => p.is_controlled && !p.is_blocked).length} / {group.parcels.length} Contrôlés
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => {
                                    setSelectedExpedition({
                                      ...group.expedition,
                                      colis_count: group.parcels.length
                                    });
                                    setFraisExpedition(group.expedition.frais_annexes || '');
                                    setLienTracking(group.expedition.code_suivi_expedition || '');
                                    setIsExpeditionModalOpen(true);
                                  }}
                                  disabled={!group.parcels.every(p => p.is_controlled && !p.is_blocked)}
                                  className={`p-1.5 rounded-md transition-all group
                                    ${group.parcels.every(p => p.is_controlled && !p.is_blocked)
                                      ? 'bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-700'
                                      : 'bg-slate-50 text-slate-300 cursor-not-allowed'}`}
                                  title={group.parcels.every(p => p.is_controlled && !p.is_blocked) ? "Modifier les infos" : "Tout doit être contrôlé et non bloqué"}
                                >
                                  <Edit2 size={16} className={group.parcels.every(p => p.is_controlled && !p.is_blocked) ? "group-hover:scale-110 transition-transform" : ""} />
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedExpedition({
                                      ...group.expedition,
                                      colis_count: group.parcels.length
                                    });
                                    setIsConfirmModalOpen(true);
                                  }}
                                  disabled={!group.parcels.every(p => p.is_controlled && !p.is_blocked) || isUpdatingExpedition}
                                  className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-2
                                    ${group.parcels.every(p => p.is_controlled && !p.is_blocked)
                                      ? 'bg-slate-900 text-white hover:bg-slate-800 active:scale-[0.98] shadow-sm shadow-slate-900/10'
                                      : 'bg-slate-100 text-slate-300 cursor-not-allowed'}`}
                                  title={group.parcels.every(p => p.is_controlled && !p.is_blocked) ? "Confirmer le départ" : "Tout doit être contrôlé et non bloqué"}
                                >
                                  <Truck size={16} />
                                  <span className="text-[11px] font-bold uppercase tracking-tight">Départ</span>
                                </button>
                              </div>
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
                          <tr key={parcel.id} className={`bg-white border-x border-slate-200 transition-colors group ${selectedCodes.includes(parcel.code_colis) ? 'bg-indigo-50/30' : ''} ${parcel.is_controlled ? 'opacity-80' : ''}`}>
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
                                  <TypeIcon size={24} />
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="block font-bold text-slate-900 text-base">{parcel.code_colis}</span>
                                  </div>
                                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{parcel.designation || 'Sans désignation'}</span>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-3">
                              <div className="flex flex-col">
                                <div className="flex items-center gap-1.5 text-slate-800 text-sm font-semibold ">
                                  <Building2 size={24} className="text-slate-400" />
                                  {parcel.expedition?.agence?.nom_agence}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-3">
                              <div className="flex flex-col">
                                <div className="flex items-center gap-1.5 text-slate-800 text-sm font-semibold uppercase">
                                  <MapPin size={20} className="text-slate-400" />
                                  {parcel.expedition?.pays_destination}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-3 text-left">
                              <div className="flex flex-col">
                                <span className="text-sm font-semibold text-slate-800">{parcel.poids} kg</span>
                              </div>
                            </td>
                            <td className="px-6 py-3 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => handleViewParcel(parcel)}
                                  className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-all border border-transparent hover:border-slate-200"
                                  title="Détails"
                                >
                                  <Eye size={22} />
                                </button>
                                {parcel.is_blocked ? (
                                  <button
                                    onClick={() => handleSingleValidate(parcel.code_colis)}
                                    disabled={isBulkControlling || validatingCode === parcel.code_colis}
                                    className="px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all bg-amber-500 text-white hover:bg-amber-600 shadow-md shadow-amber-500/10 active:scale-95 flex items-center gap-2"
                                  >
                                    {validatingCode === parcel.code_colis ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} />}
                                    Débloquer
                                  </button>
                                ) : parcel.is_controlled ? (
                                  <div className="px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest border border-emerald-200 bg-emerald-50 text-emerald-600 flex items-center gap-2">
                                    <ShieldCheck size={16} />
                                    Contrôlé
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-2">
                                    <button
                                      onClick={() => handleOpenBlockModal(parcel.code_colis)}
                                      disabled={isBulkBlocking || isBulkControlling}
                                      className="px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all border border-rose-200 text-rose-600 hover:bg-rose-50 active:scale-95 flex items-center gap-2 disabled:opacity-50"
                                    >
                                      {isBulkBlocking && blockingCode === parcel.code_colis ? <Loader2 size={16} className="animate-spin" /> : "Écarter"}
                                    </button>
                                    <button
                                      onClick={() => handleSingleValidate(parcel.code_colis)}
                                      disabled={isBulkControlling || validatingCode === parcel.code_colis}
                                      className="px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all bg-emerald-600 text-white hover:bg-emerald-700 shadow-md shadow-emerald-600/10 active:scale-95 flex items-center gap-2 disabled:opacity-50"
                                    >
                                      {validatingCode === parcel.code_colis ? <Loader2 size={16} className="animate-spin" /> : <PackageCheck size={16} />}
                                      Valider
                                    </button>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    }
                    <tr className="bg-white border-b border-x border-slate-200"><td colSpan="6" className="h-1"></td></tr>
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
                        {group.expedition?.reference || 'N/A'}
                      </span>

                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-xs font-bold px-1.5 py-0.5 rounded border shadow-sm
                        ${group.parcels.every(p => p.is_controlled && !p.is_blocked)
                          ? 'bg-emerald-50 border-emerald-100 text-emerald-600'
                          : 'bg-white border-slate-200 text-slate-500'}`}>
                        {group.parcels.filter(p => p.is_controlled && !p.is_blocked).length} / {group.parcels.length}
                      </span>
                      <button
                        onClick={() => handleEditExpedition(group.expedition)}
                        disabled={!group.parcels.every(p => p.is_controlled && !p.is_blocked)}
                        className={`p-2 border rounded-md transition-all
                          ${group.parcels.every(p => p.is_controlled && !p.is_blocked)
                            ? 'bg-white border-slate-200 text-slate-400 active:bg-slate-50'
                            : 'bg-slate-50 border-slate-100 text-slate-300 opacity-50'}`}
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedExpedition({
                            ...group.expedition,
                            colis_count: group.parcels.length
                          });
                          setIsConfirmModalOpen(true);
                        }}
                        disabled={!group.parcels.every(p => p.is_controlled && !p.is_blocked) || isUpdatingExpedition}
                        className={`p-2 border rounded-md transition-all
                          ${group.parcels.every(p => p.is_controlled && !p.is_blocked)
                            ? 'bg-slate-900 border-slate-900 text-white active:bg-slate-800'
                            : 'bg-slate-100 border-slate-100 text-slate-300 opacity-50'}`}
                      >
                        <Truck size={16} />
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
                                <div className="flex items-center gap-2">
                                  <p className="font-bold text-slate-800 text-sm truncate">{parcel.code_colis}</p>
                                  {parcel.is_blocked && (
                                    <span className="px-1.5 py-0.5 rounded-full bg-rose-50 text-rose-600 text-xs border border-rose-100 uppercase font-bold shrink-0">Bloqué</span>
                                  )}
                                </div>
                                <p className="text-xs font-bold text-slate-400 uppercase mt-0.5 truncate">{parcel.expedition?.pays_destination}</p>
                              </div>
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleViewParcel(parcel);
                              }}
                              className="p-2 bg-slate-100 text-slate-600 rounded-lg active:scale-95 transition-transform border border-slate-200"
                            >
                              <Eye size={24} />
                            </button>
                            {parcel.is_controlled ? (
                              <div className="flex-1 px-4 py-2 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-lg text-xs font-bold uppercase flex items-center justify-center gap-2">
                                <ShieldCheck size={20} />
                                Contrôlé
                              </div>
                            ) : parcel.is_blocked ? (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSingleValidate(parcel.code_colis);
                                }}
                                disabled={isBulkControlling || validatingCode === parcel.code_colis}
                                className="flex-1 px-4 py-2 bg-amber-500 text-white rounded-lg text-xs font-bold uppercase shadow-lg shadow-amber-500/10 active:scale-95 transition-transform flex items-center justify-center gap-2"
                              >
                                {validatingCode === parcel.code_colis ? <Loader2 size={20} className="animate-spin" /> : <ShieldCheck size={20} />}
                                Débloquer
                              </button>
                            ) : (
                              <div className="flex-1 flex gap-2">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenBlockModal(parcel.code_colis);
                                  }}
                                  disabled={isBulkBlocking || isBulkControlling}
                                  className="flex-1 px-4 py-2 border border-rose-200 text-rose-600 rounded-lg text-xs font-bold uppercase active:scale-95 transition-transform disabled:opacity-50"
                                >
                                  {isBulkBlocking && blockingCode === parcel.code_colis ? <Loader2 size={20} className="animate-spin" /> : "Écarter"}
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleSingleValidate(parcel.code_colis);
                                  }}
                                  disabled={isBulkControlling || validatingCode === parcel.code_colis}
                                  className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold uppercase shadow-lg shadow-emerald-600/10 active:scale-95 transition-transform flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                  {validatingCode === parcel.code_colis ? <Loader2 size={20} className="animate-spin" /> : <PackageCheck size={20} />}
                                  Valider
                                </button>
                              </div>
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
        subtitle={`Réf: ${selectedExpedition?.reference || ''}`}
        size="sm"
        isLoading={isUpdatingExpedition}
        onConfirm={handleSaveExpedition}
        confirmLabel="Mettre à jour"
      >
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-5">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">Frais Annexes (Optionnel)</label>
              <div className="relative group">
                <Wallet className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-slate-900 transition-colors" size={22} />
                <input
                  type="number"
                  value={fraisExpedition}
                  onChange={(e) => setFraisExpedition(e.target.value)}
                  placeholder="0"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900 text-sm font-bold text-slate-900 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">Code de suivi / Tracking</label>
              <div className="relative group">
                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-slate-900 transition-colors" size={22} />
                <input
                  type="text"
                  value={lienTracking}
                  onChange={(e) => setLienTracking(e.target.value)}
                  placeholder="EX: TRACK-123456"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900 text-sm font-bold text-slate-900 transition-all placeholder:font-normal"
                />
              </div>
            </div>
          </div>
        </div>
      </Modal>

      {/* CONFIRM DEPART MODAL */}
      <Modal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        title="Confirmer le départ"
        subtitle={`Réf: ${selectedExpedition?.reference || ''}`}
        size="sm"
        onConfirm={handleConfirmDepartAction}
        isLoading={isUpdatingExpedition}
        confirmLabel="Confirmer"
        confirmVariant="primary"
      >
        <div className="space-y-4">
          <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl flex gap-3 text-amber-800">
            <Info className="text-amber-500 shrink-0 mt-0.5" size={24} />
            <div className="space-y-1">
              <p className="text-xs font-bold uppercase tracking-tight">Action Irréversible</p>
              <p className="text-xs leading-relaxed font-medium">
                Vérifiez les paiements avant de confirmer. Les colis quitteront votre liste de contrôle.
              </p>
            </div>
          </div>

          <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 space-y-4">
            {/* Infos de base */}
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400 font-bold uppercase">Nombre de colis</span>
              <span className="text-slate-900 font-bold bg-white px-2 py-1 rounded border border-slate-100 shadow-sm">
                {selectedExpedition?.colis_count || '-'} Colis
              </span>
            </div>

            <div className="h-px bg-slate-200/60" />

            {/* Frais Annexes */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-bold uppercase">Frais Annexes</span>
                <span className="text-slate-900 font-bold">
                  {Number(selectedExpedition?.frais_annexes || 0).toLocaleString()} <span className="text-xs text-slate-400">CFA</span>
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-400 uppercase">Paiement Frais</span>
                <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider border shadow-sm
                  ${selectedExpedition?.statut_paiement_frais === 'paye'
                    ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                    : 'bg-amber-50 text-amber-600 border-amber-100'
                  }`}>
                  {selectedExpedition?.statut_paiement_frais === 'paye' ? 'Réglé' : 'En attente'}
                </span>
              </div>
            </div>

            <div className="h-px bg-slate-200/60" />

            {/* Montant Expédition */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-bold uppercase">Montant Expédition</span>
                <span className="text-indigo-600 font-bold">
                  {Number(selectedExpedition?.montant_expedition || 0).toLocaleString()} <span className="text-xs text-slate-400">CFA</span>
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-400 uppercase">Paiement Expédition</span>
                <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider border shadow-sm
                  ${selectedExpedition?.statut_paiement_expedition === 'paye'
                    ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                    : 'bg-amber-50 text-amber-600 border-amber-100'
                  }`}>
                  {selectedExpedition?.statut_paiement_expedition === 'paye' ? 'Réglé' : 'Non Réglé'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </Modal>

      {/* BLOCK MODAL */}
      <Modal
        isOpen={isBlockModalOpen}
        onClose={() => {
          setIsBlockModalOpen(false);
          setBlockingCode(null);
        }}
        size="sm"
        title={blockingCode ? "Écarter un colis" : "Bloquer la sélection"}
        subtitle={blockingCode ? `Colis : ${blockingCode}` : `${selectedCodes.length} colis sélectionnés`}
        onConfirm={handleConfirmBlock}
        confirmDisabled={!blockReason.trim()}
        isLoading={isBulkBlocking}
        confirmVariant="danger"
        confirmLabel="Confirmer"
      >
        <div className="space-y-4">
          <div className="p-4 bg-rose-50 border border-rose-100 rounded-lg flex items-start gap-3">
            <AlertCircle className="text-rose-500 shrink-0 mt-0.5" size={24} />
            <p className="text-xs font-medium text-rose-800 leading-relaxed">
              L'écartement signale une anomalie bloquante. Le motif saisi sera appliqué à {blockingCode ? "ce colis" : "tous les colis sélectionnés"}.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">Motif du blocage</label>
            <textarea
              value={blockReason}
              onChange={(e) => setBlockReason(e.target.value)}
              placeholder="Précisez la raison de l'écartement..."
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-sm font-medium text-slate-700 focus:outline-none focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900 transition-all min-h-[120px] resize-none"
            />
          </div>
        </div>
      </Modal>

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
                onClick={() => handleOpenBlockModal(null)}
                className="px-3 py-2 border border-rose-500/30 text-rose-500 rounded-lg text-xs font-bold uppercase tracking-widest active:scale-95 transition-all"
              >
                Écarter
              </button>
              <button
                onClick={handleBulkControl}
                disabled={isBulkControlling}
                className="bg-emerald-600 text-white px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-widest flex items-center gap-2 active:scale-95 transition-all disabled:opacity-50 shadow-lg shadow-emerald-900/40"
              >
                {isBulkControlling ? <Loader2 size={16} className="animate-spin" /> : <PackageCheck size={16} />}
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
