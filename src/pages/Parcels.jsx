import React, { useState, useMemo, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchParcels, clearParcels } from '../redux/slices/parcelSlice';
import Modal from '../components/common/Modal';
import {
  Package,
  Search,
  Plus,
  RefreshCw,
  Loader2,
  ChevronRight,
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
  Blocks
} from "lucide-react";

/**
 * Parcels (Gestion Colis) - Real data integration
 */
const Parcels = () => {
  const dispatch = useDispatch();
  const { items, isLoading, error, hasLoaded } = useSelector(state => state.parcels);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedParcel, setSelectedParcel] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

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
    setSelectedParcel(parcel);
    setIsModalOpen(true);
  };

  const getStatusInfo = (status) => {
    // Mapping des statuts API vers les labels/styles UI
    switch (status) {
      case 'accepted':
        return { label: 'À contrôler', styles: 'bg-amber-50 text-amber-600 border-amber-100', icon: ClipboardCheck };
      case 'ready_boarding':
        return { label: 'Prêt embarquement', styles: 'bg-blue-50 text-blue-600 border-blue-100', icon: MoveUpRight };
      case 'in_transit':
        return { label: 'En expedition', styles: 'bg-indigo-50 text-indigo-600 border-indigo-100', icon: Truck };
      case 'delivered':
        return { label: 'Livré', styles: 'bg-emerald-50 text-emerald-600 border-emerald-100', icon: ShieldCheck };
      default:
        return { label: status || 'En attente', styles: 'bg-slate-50 text-slate-600 border-slate-100', icon: Package };
    }
  };

  const getTypeIcon = (reference = '') => {
    if (reference.includes('AERIEN')) return Plane;
    if (reference.includes('MARITIME')) return Ship;
    return Package;
  };

  // Filter logic
  const filteredParcels = useMemo(() => {
    return items.filter(parcel => {
      const searchStr = searchTerm.toLowerCase();
      const matchesSearch =
        parcel.code_colis?.toLowerCase().includes(searchStr) ||
        parcel.expedition?.reference?.toLowerCase().includes(searchStr) ||
        parcel.designation?.toLowerCase().includes(searchStr) ||
        parcel.expedition?.pays_destination?.toLowerCase().includes(searchStr);

      const status = parcel.expedition?.statut_expedition;
      const matchesStatus = filterStatus === 'all' ||
        (filterStatus === 'pending' && status === 'accepted') ||
        (filterStatus === 'boarding' && status === 'ready_boarding') ||
        (filterStatus === 'transit' && status === 'in_transit');

      return matchesSearch && matchesStatus;
    });
  }, [items, searchTerm, filterStatus]);

  const counts = {
    all: items.length,
    pending: items.filter(p => p.expedition?.statut_expedition === 'accepted').length,
    boarding: items.filter(p => p.expedition?.statut_expedition === 'ready_boarding').length,
    transit: items.filter(p => p.expedition?.statut_expedition === 'in_transit').length,
  };

  return (
    <div className="space-y-4 pb-6 md:space-y-6 md:pb-12 font-sans">

      {/* HEADER SECTION */}
      <header className="space-y-3 md:space-y-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
              Gestion des Colis
            </h1>
            <p className="text-xs md:text-sm text-slate-500 mt-0.5 font-medium">
              Hub de contrôle : réception, vérification et mise en expédition
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
          placeholder="Rechercher par code colis, référence expédition, destination..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 md:pl-12 pr-3 md:pr-4 py-2.5 md:py-3  bg-white border border-slate-200 rounded-lg shadow-sm focus:outline-none focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900 transition-all text-sm placeholder:text-slate-400"
        />
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden text-black transition-all">
        {/* Tabs */}
        <div className="border-b border-slate-200 bg-slate-50/30">
          <div className="flex overflow-x-auto no-scrollbar">
            {[
              { id: 'all', label: 'Tous les colis', count: counts.all, color: 'slate' },
              { id: 'pending', label: 'À contrôler', count: counts.pending, color: 'amber' },
              { id: 'boarding', label: 'À embarquer', count: counts.boarding, color: 'blue' },
              { id: 'transit', label: 'En route', count: counts.transit, color: 'indigo' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setFilterStatus(tab.id)}
                className={`px-6 py-4 text-[10px] font-bold uppercase tracking-widest border-b-2 flex items-center gap-2 transition-all shrink-0 ${filterStatus === tab.id
                  ? `text-${tab.color}-600 border-${tab.color}-600 bg-white`
                  : 'text-slate-400 border-transparent hover:text-slate-600 hover:bg-slate-50/50'
                  }`}
              >
                {tab.label}
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${filterStatus === tab.id ? `bg-${tab.color}-100 text-${tab.color}-600` : 'bg-slate-100 text-slate-500'
                  }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Table/List Content */}
        {isLoading && !isRefreshing ? (
          <div className="flex flex-col items-center justify-center py-24 px-6">
            <Loader2 className="animate-spin text-slate-900 mb-4" size={40} strokeWidth={1.5} />
            <p className="text-slate-500 font-bold text-[10px] uppercase tracking-widest">Synchronisation des colis...</p>
          </div>
        ) : filteredParcels.length === 0 ? (
          <div className="py-24 text-center px-6">
            <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100 shadow-inner">
              <Package className="text-slate-300" size={40} />
            </div>
            <h3 className="font-bold text-slate-900 text-lg tracking-tight">Aucun colis trouvé</h3>
            <p className="text-slate-500 text-sm mt-1 font-medium max-w-xs mx-auto">Nous n'avons trouvé aucune expédition correspondant à vos filtres.</p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50/50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-widest">Colis / Désignation</th>
                    <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-widest">Destination</th>
                    <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-widest">Statut</th>
                    <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-widest">Détails Physiques</th>
                    <th className="px-6 py-4 text-right text-[10px] font-bold text-slate-500 uppercase tracking-widest">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredParcels.map((parcel) => {
                    const status = getStatusInfo(parcel.expedition?.statut_expedition);
                    const TypeIcon = getTypeIcon(parcel.code_colis);
                    return (
                      <tr key={parcel.id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 bg-slate-100 text-slate-500 rounded-xl flex items-center justify-center border border-slate-200 group-hover:bg-white group-hover:scale-110 transition-all duration-300">
                              <TypeIcon size={18} />
                            </div>
                            <div>
                              <span className="block font-bold text-slate-900 text-sm mb-0.5">{parcel.code_colis}</span>
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{parcel.designation || 'Sans désignation'}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex flex-col">
                            <div className="flex items-center gap-1.5 text-slate-700 text-sm font-semibold">
                              <MapPin size={14} className="text-slate-400" />
                              {parcel.expedition?.pays_destination}
                            </div>
                            <span className="text-[10px] text-slate-400 font-bold uppercase mt-0.5 ml-5">{parcel.expedition?.reference}</span>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[10px] font-bold uppercase tracking-tight ${status.styles}`}>
                            <status.icon size={12} strokeWidth={2.5} />
                            {status.label}
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex flex-col">
                            <span className="text-sm font-semibold text-slate-700">{parcel.poids} kg</span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                              {parcel.longueur && `${Math.round(parcel.longueur)}x${Math.round(parcel.largeur)}x${Math.round(parcel.hauteur)} cm`}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex items-center justify-end gap-2 text-black">
                            <button
                              onClick={() => handleViewParcel(parcel)}
                              className="p-2 text-slate-400 hover:text-slate-900 bg-white border border-slate-200 hover:border-slate-400 rounded-lg transition-all shadow-sm active:scale-95"
                            >
                              <Eye size={16} />
                            </button>
                            <button className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${parcel.expedition?.statut_expedition === 'accepted' ? 'bg-slate-900 text-white hover:bg-slate-800 shadow-md shadow-slate-900/10' : 'bg-slate-50 text-slate-400 cursor-default'
                              }`}>
                              {parcel.expedition?.statut_expedition === 'accepted' ? 'Contrôler' : 'Détails'}
                            </button>
                          </div>
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
                  <div key={parcel.id} className="p-5 space-y-4 active:bg-slate-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex gap-4">
                        <div className="h-12 w-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-500 border border-slate-100 shadow-sm">
                          <TypeIcon size={20} />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-sm">{parcel.code_colis}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{parcel.expedition?.pays_destination}</p>
                        </div>
                      </div>
                      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[9px] font-bold uppercase ${status.styles}`}>
                        {status.label}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                      <div className="flex items-center gap-2 text-slate-600">
                        <Calendar size={14} className="text-slate-400" />
                        <span className="text-xs font-bold">{new Date(parcel.created_at).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-600 justify-end">
                        <Truck size={14} className="text-slate-400" />
                        <span className="text-xs font-bold">{parcel.poids} kg</span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button className="flex-1 px-4 py-3.5 bg-slate-900 text-white rounded-xl text-[10px] font-bold uppercase tracking-[0.2em] shadow-lg shadow-slate-900/10 active:scale-95 transition-transform">
                        {parcel.expedition?.statut_expedition === 'accepted' ? 'Vérifier Colis' : 'Détails Complet'}
                      </button>
                      <button
                        onClick={() => handleViewParcel(parcel)}
                        className="p-3.5 text-slate-500 bg-white border border-slate-200 rounded-xl shadow-sm active:bg-slate-50"
                      >
                        <Eye size={18} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* FOOTER INFO */}
      <footer className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 bg-slate-50/50 rounded-2xl border-2 border-slate-200 border-dotted">
        <div className="flex items-center gap-4">
          <div className="p-2.5 bg-emerald-100 text-emerald-600 rounded-xl shadow-sm">
            <ShieldCheck size={20} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1.5">Conformité Hub</p>
            <p className="text-xs font-bold text-slate-900">Synchronisation avec l'agence centrale : OK</p>
          </div>
        </div>
        <button className="text-[10px] font-bold text-blue-600 uppercase tracking-widest hover:text-blue-800 transition-colors bg-blue-50 px-4 py-2 rounded-full border border-blue-100">
          Générer Manifeste d'Arrivée
        </button>
      </footer>

      {/* DETAIL MODAL */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Détails du Colis"
        subtitle={`Référence: ${selectedParcel?.code_colis}`}
        size="2xl"
      >
        {selectedParcel && (
          <div className="space-y-8">
            {/* Main Header in Modal */}
            <div className="flex items-start gap-6 bg-slate-50 p-6 rounded-2xl border border-slate-100">
              <div className="w-20 h-20 bg-white rounded-2xl border border-slate-200 flex items-center justify-center shadow-sm">
                {selectedParcel.code_colis?.includes('AERIEN') ? <Plane size={32} className="text-blue-500" /> : <Ship size={32} className="text-indigo-500" />}
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-slate-900">{selectedParcel.designation || 'Colis Sans Nom'}</h3>
                <p className="text-slate-500 font-medium text-sm mt-1 flex items-center gap-2">
                  <Tag size={14} /> {selectedParcel.category?.nom || 'Non catégorisé'}
                </p>
                <div className="mt-3 flex gap-2">
                  <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-tight ${getStatusInfo(selectedParcel.expedition?.statut_expedition).styles}`}>
                    {getStatusInfo(selectedParcel.expedition?.statut_expedition).label}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Informations Physiques */}
              <div className="space-y-4">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Scale size={14} /> Caractéristiques Physiques
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Poids</p>
                    <p className="text-lg font-bold text-slate-900">{selectedParcel.poids} kg</p>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Volume</p>
                    <p className="text-lg font-bold text-slate-900">{Math.round(selectedParcel.volume || 0)} cm³</p>
                  </div>
                  <div className="md:col-span-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Dimensions (LxPxH)</p>
                    <p className="text-base font-bold text-slate-900">
                      {Math.round(selectedParcel.longueur)} x {Math.round(selectedParcel.largeur)} x {Math.round(selectedParcel.hauteur)} cm
                    </p>
                  </div>
                </div>
              </div>

              {/* Expédition & Destination */}
              <div className="space-y-4">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <MapPin size={14} /> Destination & Transit
                </h4>
                <div className="space-y-3">
                  <div className="flex items-start gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <div className="p-2 bg-white rounded-lg border border-slate-200 text-slate-400">
                      <MapPin size={16} />
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase leading-none mb-1">Livraison vers</p>
                      <p className="text-sm font-bold text-slate-900">{selectedParcel.expedition?.pays_destination}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <div className="p-2 bg-white rounded-lg border border-slate-200 text-slate-400">
                      <Hash size={16} />
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase leading-none mb-1">Réf. Expédition</p>
                      <p className="text-sm font-bold text-slate-900">{selectedParcel.expedition?.reference}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tarification */}
              <div className="md:col-span-2 space-y-4">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Euro size={14} /> Détails de Tarification
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-center">
                    <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Base</p>
                    <p className="font-bold text-slate-900">{Number(selectedParcel.montant_colis_base).toLocaleString()} FCFA</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-center">
                    <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Prestation</p>
                    <p className="font-bold text-blue-600">+{Number(selectedParcel.montant_colis_prestation).toLocaleString()} FCFA</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-center">
                    <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Emballage</p>
                    <p className="font-bold text-slate-900">+{Number(selectedParcel.prix_emballage).toLocaleString()} FCFA</p>
                  </div>
                  <div className="p-4 bg-blue-900 rounded-xl text-center border border-blue-800 shadow-lg shadow-blue-900/20">
                    <p className="text-[10px] text-blue-300 font-bold uppercase mb-1">Total Colis</p>
                    <p className="font-bold text-white text-lg">{Number(selectedParcel.montant_colis_total).toLocaleString()} FCFA</p>
                  </div>
                </div>
              </div>

              {/* Articles (si présents) */}
              {selectedParcel.articles && selectedParcel.articles.length > 0 && (
                <div className="md:col-span-2 space-y-3">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Blocks size={14} /> Contenu Déclaré
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedParcel.articles.map((article, idx) => (
                      <span key={idx} className="bg-white border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-700 shadow-sm">
                        {article}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

    </div>
  );
};

export default Parcels;

