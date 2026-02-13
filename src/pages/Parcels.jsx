import React, { useState, useMemo, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchParcels, clearParcels } from '../redux/slices/parcelSlice';
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
  Building2
} from "lucide-react";

/**
 * Parcels (Gestion Colis) - Real data integration
 */
const Parcels = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { items, isLoading, error, hasLoaded } = useSelector(state => state.parcels);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isQRScannerOpen, setIsQRScannerOpen] = useState(false);

  useEffect(() => {
    if (!hasLoaded) {
      dispatch(fetchParcels());
    }
  }, [dispatch, hasLoaded]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await dispatch(fetchParcels());
    setIsRefreshing(false);
  };

  const handleViewParcel = (parcel) => {
    if (!parcel?.code_colis) return;
    navigate(ROUTES.PARCEL_CONTROL.replace(':code', parcel.code_colis));
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
        {/* Simplified Header instead of tabs */}
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/10 flex items-center justify-between">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            {filteredParcels.length} colis en attente
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
                <tbody className="divide-y divide-slate-200 font-medium">
                  {filteredParcels.map((parcel) => {
                    const status = getStatusInfo(parcel.expedition?.statut_expedition);
                    const TypeIcon = getTypeIcon(parcel.code_colis);
                    return (
                      <tr key={parcel.id} className="hover:bg-slate-50/50 transition-colors group">
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
              </table>
            </div>

            {/* Mobile Cards View */}
            <div className="md:hidden divide-y divide-slate-100">
              {filteredParcels.map((parcel) => {
                const status = getStatusInfo(parcel.expedition?.statut_expedition);
                const TypeIcon = getTypeIcon(parcel.code_colis);
                return (
                  <div key={parcel.id} className="p-4 space-y-4 active:bg-slate-50 transition-colors">
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

                    <div className="grid grid-cols-2 gap-4 bg-slate-50/50 p-3 rounded-lg border border-slate-100">
                      <div className="flex items-center gap-2 text-slate-600">
                        <Building2 size={14} className="text-slate-400" />
                        <span className="text-xs font-bold truncate">{parcel.expedition?.agence?.nom_agence}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-600 justify-end">
                        <Truck size={14} className="text-slate-400" />
                        <span className="text-xs font-bold">{parcel.poids} kg</span>
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

    </div>
  );
};

export default Parcels;

