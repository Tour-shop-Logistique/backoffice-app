import React, { useState, useMemo, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchParcels, updateExpedition } from '../redux/slices/parcelSlice';
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

  useEffect(() => {
    // Only fetch if not already loaded (persist data)
    if (!hasLoaded) {
      dispatch(fetchParcels({ listType: 'todo', isControlled: false }));
    }
  }, [dispatch, hasLoaded]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await dispatch(fetchParcels({ listType: 'todo', isControlled: false }));
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
      case 'accepted':
        return { label: 'À contrôler', styles: 'bg-amber-50 text-amber-600 border-amber-100', icon: ClipboardCheck };
      case 'ready_boarding':
        return { label: 'Prêt embarquement', styles: 'bg-blue-50 text-blue-600 border-blue-100', icon: MoveUpRight };
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
      // Sort by most recent parcel update
      const dateA = new Date(a.parcels[0]?.updated_at || a.parcels[0]?.created_at || 0);
      const dateB = new Date(b.parcels[0]?.updated_at || b.parcels[0]?.created_at || 0);
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
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/10 flex items-center justify-between">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            {groupedParcels.length} expéditions ({filteredParcels.length} colis)
          </span>
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
                      <td colSpan="5" className="px-6 py-3">
                        <div className="flex items-center gap-4">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white border border-slate-200 text-xs font-bold text-slate-700 shadow-sm">
                            <Truck size={14} className="text-blue-500" />
                            {group.expedition?.reference || 'Sans référence'}
                          </span>
                          <div className="h-4 w-px bg-slate-300"></div>
                          <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                            <User size={14} className="text-slate-400" />
                            <span className="uppercase">{group.expedition?.expediteur?.nom_prenom || 'Expéditeur inconnu'}</span>
                          </div>
                          <ChevronRight size={14} className="text-slate-300" />
                          <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                            <User size={14} className="text-slate-400" />
                            <span className="uppercase">{group.expedition?.destinataire?.nom_prenom || 'Destinataire inconnu'}</span>
                          </div>
                          <div className="ml-auto flex items-center gap-3">
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-2">
                              {group.parcels.length} Colis
                            </div>
                            <button
                              onClick={() => handleEditExpedition(group.expedition)}
                              className="p-1.5 hover:bg-slate-100 rounded-md text-slate-400 hover:text-blue-600 transition-colors"
                              title="Modifier l'expédition"
                            >
                              <Edit2 size={14} />
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                    {group.parcels.map((parcel) => {
                      const status = getStatusInfo(parcel.expedition?.statut_expedition);
                      const TypeIcon = getTypeIcon(parcel.code_colis);
                      return (
                        <tr key={parcel.id} className="hover:bg-slate-50 transition-colors group">
                          <td className="px-6 py-3 pl-10">
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
                              <span className="text-xs font-bold text-slate-400 mt-1">
                                {parcel.longueur && `${Math.round(parcel.longueur)} x ${Math.round(parcel.largeur)} x ${Math.round(parcel.hauteur)} cm`}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-3 text-right">
                            <button
                              onClick={() => handleViewParcel(parcel)}
                              className="px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all bg-slate-900 text-white hover:bg-slate-800 shadow-md shadow-slate-900/10 active:scale-95"
                            >
                              Contrôler
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                ))}
              </table>
            </div>

            {/* Mobile Cards View */}
            <div className="md:hidden space-y-4 p-2">
              {groupedParcels.map(group => (
                <div key={group.id} className="bg-slate-50/50 rounded-xl border border-slate-200 overflow-hidden">
                  <div className="px-4 py-3 bg-slate-100/50 border-b border-slate-200 flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
                        <Truck size={12} /> {group.expedition?.reference || 'N/A'}
                      </span>
                      <span className="text-[10px] text-slate-500 uppercase font-medium mt-0.5">
                        {group.expedition?.expediteur?.nom_prenom} <ChevronRight size={10} className="inline" /> {group.expedition?.destinataire?.nom_prenom}
                      </span>
                    </div>
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

                  <div className="divide-y divide-slate-200">
                    {group.parcels.map((parcel) => {
                      const TypeIcon = getTypeIcon(parcel.code_colis);
                      return (
                        <div key={parcel.id} className="p-4 bg-white space-y-4 active:bg-slate-50 transition-colors">
                          <div className="flex items-start justify-between">
                            <div className="flex gap-3">
                              <div className="h-10 w-10 bg-slate-50 rounded-lg flex items-center justify-center text-slate-500 border border-slate-100 shadow-sm">
                                <TypeIcon size={20} />
                              </div>
                              <div>
                                <p className="font-bold text-slate-800 text-sm">{parcel.code_colis}</p>
                                <p className="text-xs font-bold text-slate-400 uppercase mt-1">{parcel.expedition?.pays_destination}</p>
                              </div>
                            </div>
                          </div>

                          <button
                            onClick={() => handleViewParcel(parcel)}
                            className="w-full px-4 py-3 bg-slate-900 text-white rounded-lg text-xs font-bold uppercase shadow-lg shadow-slate-900/10 active:scale-95 transition-transform"
                          >
                            Contrôler
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

    </div >
  );
};

export default Parcels;
