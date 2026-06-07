import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchDashboardStats } from '../redux/slices/parcelSlice';
import {
  TrendingUp,
  Truck,
  ClipboardCheck,
  Loader2,
  RefreshCw,
  PackageCheck,
  Download,
  Wallet,
  Activity,
  ChevronDown,
  Calendar,
  MoreHorizontal,
  Package
} from "lucide-react";

const Dashboard = () => {
  const dispatch = useDispatch();
  const { dashboard } = useSelector(state => state.parcels);
  const { data, loading } = dashboard;
  const [activeTab, setActiveTab] = useState('Opérations');

  // Utilisation des données réelles de l'API
  const monthlyOps = data?.monthly_operations;
  const monthlyFin = data?.monthly_finance;
  
  // Données pour le graphique d'opérations
  const monthlyData = monthlyOps ? 
    monthlyOps.months.map((m, i) => ({
      m: m.substring(0, 3),
      exp: monthlyOps.datasets[0]?.data[i] || 0,
      rec: monthlyOps.datasets[1]?.data[i] || 0,
      ca: monthlyFin?.datasets[0]?.data[i] || 0
    })) : [];
  
  const currentMonthIndex = new Date().getMonth();
  
  // Échelles différentes selon le type
  const maxExp = 50;  // Opérations : 0-50 par pas de 10
  const maxRec = 50;
  const maxCA = 500000;  // Finance : 0-500k par pas de 100k

  useEffect(() => {
    if (!data && !loading) dispatch(fetchDashboardStats());
  }, [dispatch, data, loading]);

  if (loading && !data) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="animate-spin text-slate-600" size={40} strokeWidth={1.5} />
        <p className="text-sm font-medium text-slate-500">Chargement de votre plateforme...</p>
      </div>
    );
  }

  const op = data?.operational || {};
  const log = data?.logistics || {};

  

  return (
    <div className="space-y-4 pb-6 md:space-y-6 md:pb-12">

      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">Tableau de bord</h1>
          <p className="text-xs md:text-sm text-slate-500 font-medium mt-1">Vue d'ensemble de votre activité logistique</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg text-xs font-semibold text-slate-600 border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors shadow-sm">
            <Calendar size={18} className="text-slate-500" />
            {new Date().toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })} - Présent
            <ChevronDown size={20} className="ml-1 opacity-50" />
          </div>
          <button onClick={() => dispatch(fetchDashboardStats())} disabled={loading} className="p-2 bg-white border border-slate-200 rounded-lg shadow-sm hover:bg-slate-50 text-slate-500 transition-all">
            <RefreshCw size={22} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* KPI CARDS - Design moderne inspiré */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-700 rounded-3xl transform rotate-3 scale-105 opacity-20 group-hover:opacity-30 transition-all duration-300" />
          <div className="relative bg-white rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 p-6 border border-blue-100">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg">
                <ClipboardCheck className="text-white" size={26} />
              </div>
              <div className="flex items-center gap-1 text-blue-600 text-xs font-semibold">
                <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
                Actif
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-4xl font-bold text-slate-900 tracking-tighter">{op.colis_a_controler || 0}</p>
              <p className="text-base font-semibold text-slate-600 uppercase tracking-wide">Colis à contrôler</p>
            </div>
          </div>
        </div>

        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-emerald-700 rounded-3xl transform -rotate-3 scale-105 opacity-20 group-hover:opacity-30 transition-all duration-300" />
          <div className="relative bg-white rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 p-6 border border-emerald-100">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl shadow-lg">
                <Truck className="text-white" size={26} />
              </div>
              <div className="flex items-center gap-1 text-emerald-600 text-xs font-semibold">
                <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                En cours
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-4xl font-bold text-slate-900 tracking-tighter">{op.arrivages_prevus || 0}</p>
              <p className="text-base font-semibold text-slate-600 uppercase tracking-wide">Arrivages prévus</p>
            </div>
          </div>
        </div>

        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-purple-700 rounded-3xl transform rotate-3 scale-105 opacity-20 group-hover:opacity-30 transition-all duration-300" />
          <div className="relative bg-white rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 p-6 border border-purple-100">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl shadow-lg">
                <PackageCheck className="text-white" size={26} />
              </div>
              <div className="flex items-center gap-1 text-purple-600 text-xs font-semibold">
                <span className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" />
                Aujourd'hui
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-4xl font-bold text-slate-900 tracking-tighter">{op.receptions_du_jour || 0}</p>
              <p className="text-base font-semibold text-slate-600 uppercase tracking-wide">Réceptions</p>
            </div>
          </div>
        </div>

        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-orange-600 to-orange-700 rounded-3xl transform -rotate-3 scale-105 opacity-20 group-hover:opacity-30 transition-all duration-300" />
          <div className="relative bg-white rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 p-6 border border-orange-100">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl shadow-lg">
                <TrendingUp className="text-white" size={26} />
              </div>
              <div className="flex items-center gap-1 text-orange-600 text-xs font-semibold">
                <span className="w-2 h-2 bg-orange-400 rounded-full animate-pulse" />
                Aujourd'hui
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-4xl font-bold text-slate-900 tracking-tighter">{op.colis_expedies_du_jour || 0}</p>
              <p className="text-base font-semibold text-slate-600 uppercase tracking-wide">Expéditions</p>
            </div>
          </div>
        </div>
      </div>

      {/* CHART + SIDEBAR */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Chart */}
        <section className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight">{activeTab === 'Opérations' ? (monthlyOps?.title || 'Aperçu des Flux') : (monthlyFin?.title || 'Récapitulatif Financier')}</h3>
              <p className="text-xs text-slate-400 font-bold mt-1 uppercase tracking-wider">{activeTab === 'Opérations' ? 'Expéditions et Réceptions' : 'Chiffre d\'affaires mensuel'}</p>
            </div>
            <div className="flex items-center gap-2">
              <button className="flex items-center gap-2 px-4 py-2 bg-slate-50 text-slate-600 border border-slate-200 rounded-xl text-xs font-bold hover:bg-slate-100 hover:border-slate-300 transition-all">
                <Download size={20} /> Exporter
              </button>
            </div>
          </div>

          <div className="px-6 pt-4 flex gap-2">
            {[
              { id: 'Opérations', label: 'Opérations', icon: ClipboardCheck, activeClass: 'bg-orange-500 text-white shadow-md' },
              { id: 'Finance', label: 'Finance', icon: Wallet, activeClass: 'bg-blue-500 text-white shadow-md' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition-all ${
                  activeTab === tab.id 
                    ? tab.activeClass
                    : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                }`}
              >
                <tab.icon size={20} />
                {tab.label}
              </button>
            ))}
          </div>

          <div className="p-6 pt-4">
            <div className="flex h-48 gap-4 pt-4">
              <div className="flex flex-col justify-between text-xs font-bold text-slate-300 h-full pb-6 w-10 text-right">
                {activeTab === 'Opérations'
                  ? [50, 40, 30, 20, 10, 0].map((v, i) => <span key={i}>{v}</span>)
                  : ['500k', '400k', '300k', '200k', '100k', '0'].map((v, i) => <span key={i}>{v}</span>)
                }
              </div>

              <div className="flex-1 flex justify-between gap-2 relative h-full">
                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-6">
                  {[0,1,2,3,4].map(i => <div key={i} className="w-full border-t border-dashed border-slate-100 h-0" />)}
                </div>

                {monthlyData.map((d, i) => {
                  const maxVal = maxExp > maxRec ? maxExp : maxRec;
                  return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-3 h-full group relative z-10">
                    <div className="w-full flex-1 flex items-end gap-1 px-0.5">
                      {activeTab === 'Opérations' ? (
                        <>
                          <div className="flex-1 relative group/bar h-full">
                            <motion.div initial={{ height: 0 }} animate={{ height: maxVal > 0 ? `${(d.exp / maxVal) * 100}%` : '0%' }} className="w-full bg-orange-500 rounded-t-sm absolute bottom-0 opacity-90 group-hover/bar:opacity-100 transition-opacity" />
                          </div>
                          <div className="flex-1 relative group/bar h-full">
                            <motion.div initial={{ height: 0 }} animate={{ height: maxVal > 0 ? `${(d.rec / maxVal) * 100}%` : '0%' }} className="w-full bg-blue-600 rounded-t-sm absolute bottom-0 opacity-90 group-hover/bar:opacity-100 transition-opacity" />
                          </div>
                        </>
                      ) : (
                        <div className="w-full relative group/bar h-full">
                          <motion.div initial={{ height: 0 }} animate={{ height: maxCA > 0 ? `${(d.ca / maxCA) * 100}%` : '0%' }} className="w-full bg-gradient-to-t from-blue-700 to-blue-500 rounded-t-sm absolute bottom-0 opacity-90 group-hover/bar:opacity-100 transition-opacity" />
                        </div>
                      )}
                    </div>
                    <div className="relative">
                      <span className={`text-xs font-bold uppercase transition-colors ${i === currentMonthIndex ? 'text-slate-900 font-black' : 'text-slate-400'}`}>{d.m}</span>
                      {activeTab === 'Opérations' ? (
                        <>
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-all bg-slate-900 text-white px-2 py-1 rounded-lg text-xs font-bold z-20 pointer-events-none whitespace-nowrap shadow-xl">
                            {d.exp} Exp. / {d.rec} Rec.
                          </div>
                        </>
                      ) : (
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-all bg-slate-900 text-white px-2 py-1 rounded-lg text-xs font-bold z-20 pointer-events-none whitespace-nowrap shadow-xl">
                          {d.ca.toLocaleString()} CFA
                        </div>
                      )}
                    </div>
                  </div>
                );
                })}
              </div>
            </div>

            <div className="flex gap-6 pt-6 border-t border-slate-100 mt-6">
              {activeTab === 'Opérations' ? (
                <>
                  <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-sm bg-orange-500" /><span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Expéditions</span></div>
                  <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-sm bg-blue-600" /><span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Réceptions</span></div>
                </>
              ) : (
                <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-sm bg-blue-600" /><span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Chiffre d'Affaires</span></div>
              )}
            </div>
          </div>
        </section>

        {/* Sidebar - Volumes par Type */}
        <div className="space-y-6">
          <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-900 tracking-tight">Volumes par Type</h4>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-0.5">Répartition des expéditions</p>
              </div>
              <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                <Package size={22} />
              </div>
            </div>
            
            <div className="space-y-3">
              {(log.volume_par_type || []).map((vol, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${vol.total > 0 ? 'bg-indigo-500' : 'bg-slate-300'}`} />
                    <span className={`text-xs font-medium ${vol.total > 0 ? 'text-slate-700' : 'text-slate-400'}`}>{vol.type.replace('Type ', '')}</span>
                  </div>
                  <span className={`text-xs font-bold ${vol.total > 0 ? 'text-slate-900' : 'text-slate-400'}`}>{vol.total}</span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>

      {/* BOTTOM GRID - Designs variés */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Agences Actives - Style liste avec avatars */}
        <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 bg-gradient-to-r from-indigo-50 to-white flex justify-between items-center">
            <h3 className="text-sm font-bold text-slate-900">Agences Actives</h3>
            <span className="px-2 py-1 bg-indigo-100 text-indigo-700 text-xs font-bold rounded-full">{(log.activite_agences || []).length} agences</span>
          </div>
          
          <div className="divide-y divide-slate-100">
            {(log.activite_agences || []).slice(0, 5).map((ag, i) => (
              <div key={i} className="p-4 flex items-center gap-3 hover:bg-slate-50 transition-colors group cursor-pointer">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-xs shrink-0 ${i === 0 ? 'bg-indigo-500' : i === 1 ? 'bg-purple-500' : i === 2 ? 'bg-pink-500' : i === 3 ? 'bg-emerald-500' : 'bg-amber-500'}`}>
                  {ag.nom_agence.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <h5 className="text-sm font-bold text-slate-900 truncate">{ag.nom_agence}</h5>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span className="text-xs text-slate-500">{ag.ville}</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-slate-900">{ag.total || 0}</p>
                  <p className="text-xs text-slate-400 uppercase">expéditions</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Top Destinations - Style barres horizontales */}
        <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Top Destinations</h3>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-0.5">Les pays les plus actifs</p>
            </div>
            <div className="p-2 bg-amber-50 rounded-lg text-amber-600">
              <TrendingUp size={22} />
            </div>
          </div>
          
          <div className="space-y-4">
            {(log.top_destinations || []).slice(0, 6).map((dest, i) => {
              const maxVal = Math.max(...(log.top_destinations || []).map(d => d.total));
              const percentage = maxVal > 0 ? (dest.total / maxVal) * 100 : 0;
              return (
                <div key={i}>
                  <div className="flex justify-between items-center mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${i === 0 ? 'bg-amber-500' : i === 1 ? 'bg-slate-400' : i === 2 ? 'bg-slate-300' : i === 3 ? 'bg-slate-200' : i === 4 ? 'bg-slate-100' : 'bg-slate-50'}`}>
                        {i + 1}
                      </span>
                      <span className="text-xs font-bold text-slate-700">{dest.pays}</span>
                    </div>
                    <span className="text-xs font-bold text-slate-900">{dest.total}</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${i === 0 ? 'bg-amber-500' : i === 1 ? 'bg-slate-400' : i === 2 ? 'bg-slate-300' : i === 3 ? 'bg-slate-200' : i === 4 ? 'bg-slate-100' : 'bg-slate-50'}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Dashboard;
