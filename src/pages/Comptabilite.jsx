import React, { useState, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAccountingData, setAccountingFilters } from '../redux/slices/parcelSlice';
import {
  DollarSign,
  TrendingUp,
  CreditCard,
  Calendar,
  Search,
  RefreshCw,
  Loader2,
  ChevronDown,
  ArrowRight,
  Filter,
  Package,
  ArrowUpRight,
  Briefcase,
  PieChart,
  History,
  Info,
  Eye,
  CheckCircle2,
  Clock,
  ArrowLeft,
  ChevronRight,
  MapPin,
  Smartphone,
  Box,
  AlertCircle,
  Truck,
  Wallet
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import Modal from '../components/common/Modal';
import ExpeditionDetailModal from '../components/expedition/ExpeditionDetailModal';

const Comptabilite = () => {
  const dispatch = useDispatch();
  const { items, summary, filters, hasLoaded, isLoading, lastUpdated } = useSelector(state => state.parcels.accounting);
  const { pays: paysBackoffice } = useSelector(state => state.backoffice);
  const [dateDebut, setDateDebut] = useState(filters.date_debut);
  const [dateFin, setDateFin] = useState(filters.date_fin);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedExpedition, setSelectedExpedition] = useState(null);
  const [filterMode, setFilterMode] = useState(filters.mode); // null, 'depart', 'reception'

  useEffect(() => {
    if (!hasLoaded) {
      handleLoadData();
    }
  }, [hasLoaded]);

  const handleLoadData = async () => {
    setIsRefreshing(true);
    dispatch(setAccountingFilters({ date_debut: dateDebut, date_fin: dateFin }));
    await dispatch(fetchAccountingData({ date_debut: dateDebut, date_fin: dateFin }));
    setIsRefreshing(false);
  };

  const updateMode = (newMode) => {
    setFilterMode(newMode);
    // On ne recharge pas l'API puisque le filtre est désormais local
  };

  const filteredItems = useMemo(() => {
    let result = items;
    const country = paysBackoffice;

    if (filterMode === 'depart') {
      result = result.filter(exp => exp.pays_depart === country);
    } else if (filterMode === 'reception') {
      result = result.filter(exp => exp.pays_destination === country);
    }

    if (!searchTerm) return result;
    const s = searchTerm.toLowerCase();
    return result.filter(exp =>
      exp.reference?.toLowerCase().includes(s) ||
      exp.code_suivi_expedition?.toLowerCase().includes(s) ||
      exp.pays_destination?.toLowerCase().includes(s) ||
      exp.agence?.nom_agence?.toLowerCase().includes(s)
    );
  }, [items, searchTerm, filterMode]);

  const totals = useMemo(() => {
    // Si aucun mode de filtrage local n'est actif, on utilise le summary global de l'API
    if (!filterMode && summary) {
      const result = {
        today: 0,
        todayBackoffice: 0,
        total: summary.total_client_due || 0,
        backoffice: summary.total_backoffice || 0,
        agences: summary.total_agence || 0,
        livreurs: summary.total_livreur || 0,
        tourshop: 0
      };

      const todayStr = format(new Date(), 'yyyy-MM-dd');
      items.forEach(exp => {
        const dateSource = exp.date_expedition_depart || exp.created_at;
        if (dateSource && format(new Date(dateSource), 'yyyy-MM-dd') === todayStr) {
          result.today += (exp.accounting_details?.total_client_due || 0);
          result.todayBackoffice += (exp.accounting_details?.backoffice || 0);
        }
      });

      return result;
    }

    // Si on a un filtre local (Depart/Reception), on doit recalculer les totaux à partir de la liste filtrée
    const result = {
      today: 0,
      todayBackoffice: 0,
      total: 0,
      backoffice: 0,
      agences: 0,
      livreurs: 0,
      tourshop: 0
    };

    const todayStr = format(new Date(), 'yyyy-MM-dd');
    filteredItems.forEach(exp => {
      const dateSource = exp.date_expedition_depart || exp.created_at;
      const acct = exp.accounting_details || {};

      result.total += (acct.total_client_due || 0);
      result.backoffice += (acct.backoffice || 0);
      result.agences += (acct.agence || 0);
      result.livreurs += (acct.livreur || 0);

      if (dateSource && format(new Date(dateSource), 'yyyy-MM-dd') === todayStr) {
        result.today += (acct.total_client_due || 0);
        result.todayBackoffice += (acct.backoffice || 0);
      }
    });

    return result;
  }, [items, summary, filteredItems, filterMode]);

  const dailyBreakdown = useMemo(() => {
    const groups = {};
    items.forEach(exp => {
      const dateSource = exp.date_expedition_depart || exp.created_at;
      if (!dateSource) return;

      const dateObj = new Date(dateSource);
      if (isNaN(dateObj.getTime())) return;

      const date = format(dateObj, 'yyyy-MM-dd');
      if (!groups[date]) groups[date] = 0;
      groups[date] += (exp.accounting_details?.backoffice || 0);
    });
    return groups;
  }, [items]);

  return (
    <div className="space-y-6 pb-12 font-sans overflow-x-hidden">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            Gestion Comptable
          </h1>
          <p className="text-sm text-slate-500 font-medium mt-1">
            Suivi des revenus, commissions et répartition des gains
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-white rounded-lg border border-slate-200 p-1 shadow-sm shrink-0">
            <div className="flex items-center px-3 gap-2">
              <Calendar size={16} className="text-slate-400" />
              <input
                type="date"
                value={dateDebut}
                onChange={(e) => setDateDebut(e.target.value)}
                className="text-xs font-bold text-slate-700 outline-none border-none bg-transparent"
              />
              <ArrowRight size={14} className="text-slate-300" />
              <input
                type="date"
                value={dateFin}
                onChange={(e) => setDateFin(e.target.value)}
                className="text-xs font-bold text-slate-700 outline-none border-none bg-transparent"
              />
            </div>
            <button
              onClick={handleLoadData}
              disabled={isLoading || isRefreshing}
              className="p-2 bg-slate-900 text-white rounded-md hover:bg-slate-800 transition-all active:scale-95 disabled:opacity-50"
            >
              {isLoading || isRefreshing ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
            </button>
          </div>
        </div>
      </header>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">

          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Volume Total à Percevoir</p>
          <h3 className="text-2xl font-bold text-slate-900">{(totals.total || 0).toLocaleString()} <span className="text-xs font-bold text-slate-400">CFA</span></h3>

        </div>

        <div className="bg-slate-900 rounded-xl border border-slate-800 p-5 shadow-lg relative overflow-hidden group">

          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Revenu Backoffice (Net)</p>
          <h3 className="text-2xl font-bold text-white">{(totals.backoffice || 0).toLocaleString()} <span className="text-xs font-bold text-slate-500">CFA</span></h3>

        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Part Agences</p>
          <h3 className="text-2xl font-bold text-slate-900">{(totals.agences || 0).toLocaleString()} <span className="text-xs font-bold text-slate-400">CFA</span></h3>

        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Part Livreurs</p>
          <h3 className="text-2xl font-bold text-slate-900">{(totals.livreurs).toLocaleString()} <span className="text-xs font-bold text-slate-400">CFA</span></h3>

        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Rechercher par référence, agence ou pays..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 text-sm font-medium transition-all shadow-sm"
          />
        </div>

        <div className="flex items-center gap-2 bg-white p-1 rounded-lg border border-slate-200 shadow-sm shrink-0">
          <button
            onClick={() => updateMode(null)}
            className={`flex-1 md:flex-none px-4 py-2 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all ${filterMode === null ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400 hover:text-slate-900'}`}
          >
            Tout
          </button>
          <button
            onClick={() => updateMode('depart')}
            className={`flex-1 md:flex-none px-4 py-2 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all ${filterMode === 'depart' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400 hover:text-slate-900'}`}
          >
            Départs
          </button>
          <button
            onClick={() => updateMode('reception')}
            className={`flex-1 md:flex-none px-4 py-2 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all ${filterMode === 'reception' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400 hover:text-slate-900'}`}
          >
            Arrivées
          </button>
        </div>


      </div>

      {/* Main Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-200">
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Expédition</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap">Date / Agence</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">À Percevoir</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-900 uppercase tracking-widest text-right bg-slate-100/30">Revenu BO</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">Part Agence</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">Part Comms</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">Statut</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading && items.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <Loader2 size={40} className="animate-spin text-slate-300" />
                      <p className="text-sm font-bold text-slate-300 uppercase tracking-widest">Calcul des bilans...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-20 text-center">
                    <div className="flex flex-col items-center gap-3 opacity-30">
                      <History size={48} />
                      <p className="text-sm font-bold uppercase tracking-widest">Aucune donnée trouvée</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredItems.map((exp) => {
                  const acc = exp.accounting_details || { backoffice: 0, agence: 0, livreur: 0, total_client_due: 0 };
                  const clientTotal = acc.total_client_due;
                  const boNet = acc.backoffice;
                  const agencyPart = acc.agence;
                  const livreurPart = acc.livreur;

                  return (
                    <tr key={exp.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-900 text-sm group-hover:text-slate-950 transition-colors">{exp.reference}</span>
                          <span className="text-[10px] font-bold text-slate-400 font-mono tracking-tighter">{exp.code_suivi_expedition || 'PENDING'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-slate-700">
                            {(exp.date_expedition_depart || exp.created_at)
                              ? format(new Date(exp.date_expedition_depart || exp.created_at), 'dd MMM yyyy', { locale: fr })
                              : 'Date inconnue'
                            }
                          </span>
                          <span className="text-[10px] font-bold text-slate-400 uppercase truncate max-w-[150px]">{exp.agence?.nom_agence || 'N/A'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="font-bold text-slate-900 text-sm">{clientTotal.toLocaleString()}</span>
                      </td>
                      <td className="px-6 py-4 text-right bg-slate-50/50 group-hover:bg-slate-100/50 transition-colors">
                        <span className="font-bold text-slate-900 text-sm">{boNet.toLocaleString()}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="font-bold text-blue-600 text-sm">{agencyPart.toLocaleString()}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex flex-col items-end">
                          <span className="font-bold text-slate-600 text-sm">{livreurPart.toLocaleString()}</span>
                          <span className="text-[9px] font-bold text-slate-400 uppercase">Part Livreurs</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest ${exp.statut_paiement === 'paye' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                          {exp.statut_paiement === 'paye' ? 'Réglé' : 'En attente'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => setSelectedExpedition(exp)}
                          className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all"
                          title="Voir détails"
                        >
                          <Eye size={18} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination/Summary line */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            <span>{filteredItems.length} EXPÉDITIONS</span>
            <span className="h-4 w-px bg-slate-200"></span>
            <span>Dernière mise à jour: {lastUpdated ? format(new Date(lastUpdated), 'HH:mm:ss') : 'N/A'}</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Grand Total (Net BO)</span>
              <span className="text-lg font-bold text-slate-900">{(totals.backoffice || 0).toLocaleString()} <span className="text-xs">CFA</span></span>
            </div>
          </div>
        </div>
      </div>

      {/* Commission Structure Info */}
      <div className="bg-blue-50/50 rounded-xl border border-blue-100 p-6 flex flex-col md:flex-row gap-6 items-start">
        <div className="p-3 bg-blue-100 rounded-xl text-blue-600">
          <Info size={24} />
        </div>
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div>
            <h4 className="text-xs font-bold text-blue-900 uppercase tracking-widest mb-2">Enlèvement</h4>
            <p className="text-xs text-blue-800/70 font-medium">Livreur: <span className="font-bold text-blue-900">85%</span></p>
            <p className="text-xs text-blue-800/70 font-medium">Agence: <span className="font-bold text-blue-900">15%</span></p>
          </div>
          <div>
            <h4 className="text-xs font-bold text-blue-900 uppercase tracking-widest mb-2">Livraison</h4>
            <p className="text-xs text-blue-800/70 font-medium">Livreur: <span className="font-bold text-blue-900">90%</span></p>
            <p className="text-xs text-blue-800/70 font-medium">Agence: <span className="font-bold text-blue-900">10%</span></p>
          </div>
          <div>
            <h4 className="text-xs font-bold text-blue-900 uppercase tracking-widest mb-2">Emballage</h4>
            <p className="text-xs text-blue-800/70 font-medium">BO: <span className="font-bold text-blue-900">85%</span></p>
            <p className="text-xs text-blue-800/70 font-medium">Agence: <span className="font-bold text-blue-900">15%</span></p>
          </div>
          <div>
            <h4 className="text-xs font-bold text-blue-900 uppercase tracking-widest mb-2">Retard</h4>
            <p className="text-xs text-blue-800/70 font-medium">BO: <span className="font-bold text-blue-900">60%</span></p>
            <p className="text-xs text-blue-800/70 font-medium">Agence: <span className="font-bold text-blue-900">40%</span></p>
          </div>
        </div>
      </div>

      {/* Modal Détails Expédition */}
      <ExpeditionDetailModal
        isOpen={!!selectedExpedition}
        onClose={() => setSelectedExpedition(null)}
        selectedExpedition={selectedExpedition}
      />
    </div>
  );
};

export default Comptabilite;
