import React, { useState, useMemo } from 'react';
import {
  Package,
  Search,
  Filter,
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
  MoreVertical
} from "lucide-react";

/**
 * Parcels (Gestion Colis) - Redesigned to match ZoneConfiguration aesthetic
 */
const Parcels = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // Dummy data for demonstration based on the Hub/Backoffice role described
  const dummyParcels = [
    { id: 1, reference: 'TS-8402', agence: 'Dakar Plateau', type: 'DHD Aérien', status: 'pending_check', date: '2026-02-06T10:30:00', weight: '12.5 kg' },
    { id: 2, reference: 'TS-8395', agence: 'Thiès Gare', type: 'DHD Maritime', status: 'in_transit', date: '2026-02-06T09:15:00', weight: '45.0 kg' },
    { id: 3, reference: 'TS-8392', agence: 'Saint-Louis', type: 'DHD Aérien', status: 'ready_boarding', date: '2026-02-05T16:45:00', weight: '5.2 kg' },
    { id: 4, reference: 'TS-8388', agence: 'Dakar Médina', type: 'Afrique', status: 'delivered', date: '2026-02-05T14:20:00', weight: '22.1 kg' },
    { id: 5, reference: 'TS-8385', agence: 'Mbour Centre', type: 'Simple', status: 'pending_check', date: '2026-02-05T11:10:00', weight: '2.5 kg' },
    { id: 6, reference: 'TS-8380', agence: 'Dakar Plateau', type: 'DHD Aérien', status: 'ready_boarding', date: '2026-02-04T15:30:00', weight: '8.0 kg' },
  ];

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsRefreshing(false);
  };

  const getStatusInfo = (status) => {
    switch (status) {
      case 'pending_check': return { label: 'À contrôler', styles: 'bg-amber-50 text-amber-600 border-amber-100', icon: ClipboardCheck };
      case 'ready_boarding': return { label: 'Prêt embarquement', styles: 'bg-blue-50 text-blue-600 border-blue-100', icon: MoveUpRight };
      case 'in_transit': return { label: 'En expédition', styles: 'bg-indigo-50 text-indigo-600 border-indigo-100', icon: Truck };
      case 'delivered': return { label: 'Livré', styles: 'bg-emerald-50 text-emerald-600 border-emerald-100', icon: ShieldCheck };
      default: return { label: status, styles: 'bg-slate-50 text-slate-600 border-slate-100', icon: Package };
    }
  };

  const getTypeIcon = (type) => {
    if (type.includes('Aérien')) return Plane;
    if (type.includes('Maritime')) return Ship;
    return Package;
  };

  // Filter logic
  const filteredParcels = useMemo(() => {
    return dummyParcels.filter(parcel => {
      const matchesSearch = parcel.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
        parcel.agence.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = filterStatus === 'all' ||
        (filterStatus === 'pending' && parcel.status === 'pending_check') ||
        (filterStatus === 'boarding' && parcel.status === 'ready_boarding') ||
        (filterStatus === 'transit' && parcel.status === 'in_transit');
      return matchesSearch && matchesStatus;
    });
  }, [searchTerm, filterStatus]);

  const counts = {
    all: dummyParcels.length,
    pending: dummyParcels.filter(p => p.status === 'pending_check').length,
    boarding: dummyParcels.filter(p => p.status === 'ready_boarding').length,
    transit: dummyParcels.filter(p => p.status === 'in_transit').length,
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
            <p className="text-xs md:text-sm text-slate-500 mt-0.5">
              Hub de contrôle : réception, vérification et mise en expédition
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="inline-flex items-center justify-center p-3 text-sm font-medium rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-all disabled:opacity-50 shadow-sm"
              title="Rafraîchir"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="hidden md:inline md:ml-2">Rafraîchir</span>
            </button>

            <button
              className="flex items-center p-3 text-white text-sm font-medium bg-slate-900 hover:bg-slate-800 rounded-lg hover:shadow-lg transition-colors border border-slate-900 shadow-sm"
              title="Nouvel Arrivage"
            >
              <PackageCheck className="h-4 w-4" />
              <span className="hidden md:inline md:ml-2">Réception Hub</span>
            </button>
          </div>
        </div>
      </header>

      {/* SEARCH BAR */}
      <div className="relative">
        <Search className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 h-4 w-4 md:h-5 md:w-5 text-slate-400" />
        <input
          type="text"
          placeholder="Rechercher par référence, agence, ou numéro de suivi..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 md:pl-12 pr-3 md:pr-4 py-2.5 md:py-3 bg-white border border-slate-200 rounded-lg shadow-sm focus:outline-none focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900 transition-all text-sm placeholder:text-slate-400"
        />
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden text-black transition-all">
        {/* Tabs */}
        <div className="border-b border-slate-200 bg-slate-50/50">
          <div className="flex overflow-x-auto no-scrollbar">
            {[
              { id: 'all', label: 'Toutes', count: counts.all, color: 'slate' },
              { id: 'pending', label: 'À contrôler', count: counts.pending, color: 'amber' },
              { id: 'boarding', label: 'À embarquer', count: counts.boarding, color: 'blue' },
              { id: 'transit', label: 'En route', count: counts.transit, color: 'indigo' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setFilterStatus(tab.id)}
                className={`px-4 md:px-6 py-3.5 text-xs md:text-sm font-semibold uppercase border-b-2 flex items-center gap-2 ${filterStatus === tab.id
                    ? `text-${tab.color}-600 border-${tab.color}-600 bg-white`
                    : 'text-slate-400 border-transparent hover:text-slate-600'
                  }`}
              >
                {tab.label}
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${filterStatus === tab.id ? `bg-${tab.color}-100 text-${tab.color}-600` : 'bg-slate-100 text-slate-500'
                  }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Table/List Content */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 px-6">
            <Loader2 className="animate-spin text-slate-900 mb-4" size={40} strokeWidth={1.5} />
            <p className="text-slate-500 font-bold text-[10px] uppercase tracking-widest">Chargement des colis...</p>
          </div>
        ) : filteredParcels.length === 0 ? (
          <div className="py-20 text-center px-6">
            <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
              <Package className="text-slate-300" size={32} />
            </div>
            <h3 className="font-bold text-slate-900 text-lg tracking-tight">Aucun colis trouvé</h3>
            <p className="text-slate-500 text-sm mt-1">Aucune expédition ne correspond à vos critères actuels.</p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50/50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-widest">Référence / Type</th>
                    <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-widest">Agence d'origine</th>
                    <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-widest">Statut Hub</th>
                    <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-widest">Date / Poids</th>
                    <th className="px-6 py-4 text-right text-[10px] font-bold text-slate-500 uppercase tracking-widest">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredParcels.map((parcel) => {
                    const status = getStatusInfo(parcel.status);
                    const TypeIcon = getTypeIcon(parcel.type);
                    return (
                      <tr key={parcel.id} className="hover:bg-slate-50/30 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400 border border-slate-100 group-hover:bg-white group-hover:shadow-sm transition-all">
                              <TypeIcon size={16} />
                            </div>
                            <div>
                              <span className="block font-bold text-slate-900 text-sm leading-none mb-1">{parcel.reference}</span>
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{parcel.type}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-700 text-sm">{parcel.agence}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-bold uppercase tracking-tight ${status.styles}`}>
                            <status.icon size={12} />
                            {status.label}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="text-sm font-semibold text-slate-700">{new Date(parcel.date).toLocaleDateString()}</span>
                            <span className="text-[10px] font-medium text-slate-400">{parcel.weight}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <button className="p-2 text-slate-400 hover:text-slate-900 bg-white border border-slate-100 hover:border-slate-300 rounded-lg transition-all shadow-sm">
                              <Eye size={16} />
                            </button>
                            <button className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${parcel.status === 'pending_check' ? 'bg-slate-900 text-white hover:bg-slate-800' : 'bg-slate-50 text-slate-400 cursor-default'
                              }`}>
                              {parcel.status === 'pending_check' ? 'Contrôler' : 'Détails'}
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
                const status = getStatusInfo(parcel.status);
                const TypeIcon = getTypeIcon(parcel.type);
                return (
                  <div key={parcel.id} className="p-4 space-y-3 active:bg-slate-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex gap-3">
                        <div className="h-10 w-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 border border-slate-100">
                          <TypeIcon size={18} />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-sm mb-0.5">{parcel.reference}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{parcel.agence}</p>
                        </div>
                      </div>
                      <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[9px] font-bold uppercase ${status.styles}`}>
                        {status.label}
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-slate-500">
                      <div className="flex items-center gap-2 text-[11px] font-medium">
                        <Calendar size={12} />
                        {new Date(parcel.date).toLocaleDateString()}
                      </div>
                      <div className="bg-slate-100 px-2 py-0.5 rounded text-[10px] font-bold text-slate-600">
                        {parcel.weight}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button className="flex-1 px-4 py-2.5 bg-slate-900 text-white rounded-xl text-[10px] font-bold uppercase tracking-[0.2em] shadow-lg shadow-slate-100">
                        {parcel.status === 'pending_check' ? 'Vérifier Colis' : 'Voir Détails'}
                      </button>
                      <button className="p-2.5 text-slate-400 bg-white border border-slate-200 rounded-xl">
                        <MoreVertical size={16} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* FOOTER INFO - Optional summary like in some control apps */}
      <footer className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-200 border-dashed">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
            <ShieldCheck size={18} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none mb-1">Qualité de Contrôle</p>
            <p className="text-xs font-bold text-slate-900">100% des colis vérifiés ce jour</p>
          </div>
        </div>
        <button className="text-[10px] font-bold text-slate-400 uppercase tracking-widest hover:text-slate-900 transition-colors">
          Accéder au manifeste d'exportation
        </button>
      </footer>

    </div>
  );
};

export default Parcels;
