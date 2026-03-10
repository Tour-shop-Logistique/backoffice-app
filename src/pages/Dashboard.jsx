import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { fetchDashboardStats } from '../redux/slices/parcelSlice';
import {
  TrendingUp,
  DollarSign,
  Truck,
  ClipboardCheck,
  Loader2,
  RefreshCw,
  PackageCheck,
  Download,
  Building2,
  Wallet,
  Activity,
  ArrowUpRight,
  ChevronDown,
  Calendar,
  MoreHorizontal,
  ChevronRight,
  Circle
} from "lucide-react";

const Dashboard = () => {
  const dispatch = useDispatch();
  const { dashboard } = useSelector(state => state.parcels);
  const { data, loading } = dashboard;
  const [activeTab, setActiveTab] = useState('Opérations');
  const [chartPage, setChartPage] = useState(new Date().getMonth() > 5 ? 1 : 0);

  const monthLabels = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jui', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
  const currentMonthName = monthLabels[new Date().getMonth()];

  const monthlyData = [
    { m: 'Jan', exp: 30, rec: 45, ca: 1250000 }, { m: 'Fév', exp: 20, rec: 55, ca: 980000 }, { m: 'Mar', exp: 50, rec: 70, ca: 2100000 },
    { m: 'Avr', exp: 25, rec: 85, ca: 1560000 }, { m: 'Mai', exp: 45, rec: 60, ca: 1890000 }, { m: 'Jui', exp: 65, rec: 80, ca: 2450000 },
    { m: 'Juil', exp: 55, rec: 95, ca: 2200000 }, { m: 'Août', exp: 40, rec: 75, ca: 1750000 }, { m: 'Sep', exp: 60, rec: 90, ca: 2600000 },
    { m: 'Oct', exp: 35, rec: 65, ca: 1950000 }, { m: 'Nov', exp: 50, rec: 80, ca: 2300000 }, { m: 'Déc', exp: 70, rec: 100, ca: 3100000 }
  ];

  const displayedMonths = chartPage === 0 ? monthlyData.slice(0, 6) : monthlyData.slice(6, 12);

  const handleRefresh = () => {
    dispatch(fetchDashboardStats());
  };

  useEffect(() => {
    if (!data && !loading) {
      dispatch(fetchDashboardStats());
    }
  }, [dispatch, data, loading]);

  if (loading && !data) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center">
        <Loader2 className="animate-spin text-blue-600" size={40} strokeWidth={1.5} />
        <p className="text-sm font-medium text-slate-500">Chargement de votre plateforme...</p>
      </div>
    );
  }

  const op = data?.operational || {};
  const fin = data?.financial || {};
  const log = data?.logistics || {};

  const totalPayment = (fin.statut_paiements?.paye || 0) + (fin.statut_paiements?.impaye || 0);
  const paymentHealth = totalPayment > 0
    ? Math.round((fin.statut_paiements.paye / totalPayment) * 100)
    : 100;

  return (
    <div className="space-y-4 pb-6 md:space-y-6 md:pb-12 font-sans">

      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1E263E] tracking-tight">Dashboard</h1>
          <p className="text-sm text-slate-500 font-medium">Bienvenue sur votre plateforme de gestion logistique #1</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-sm text-xs font-semibold text-slate-600 border border-slate-100 hover:bg-slate-50 cursor-pointer">
            <Calendar size={14} className="text-blue-600" />
            {new Date().toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })} - Présent
            <ChevronDown size={14} className="ml-1 opacity-50" />
          </div>
          <button onClick={handleRefresh} disabled={loading} className="p-2 bg-white border border-slate-200 rounded-lg shadow-sm hover:bg-slate-50 text-slate-500 transition-all">
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* TOP STATS ROW: ETAT GLOBAL */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#6366F1] p-4 rounded-2xl flex items-center gap-4 shadow-lg shadow-indigo-100/50 transition-transform hover:scale-[1.02]">
          <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-[#6366F1] shadow-sm">
            <ClipboardCheck size={24} />
          </div>
          <div className="text-white">
            <p className="text-[10px] font-bold opacity-80 uppercase tracking-wider">Colis à contrôler</p>
            <p className="text-2xl font-bold leading-none mt-1">{op.colis_a_controler || 0}</p>
          </div>
        </div>
        <div className="bg-[#F43F5E] p-4 rounded-2xl flex items-center gap-4 shadow-lg shadow-rose-100/50 transition-transform hover:scale-[1.02]">
          <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-[#F43F5E] shadow-sm">
            <Truck size={24} />
          </div>
          <div className="text-white">
            <p className="text-[10px] font-bold opacity-80 uppercase tracking-wider">Arrivages prévus</p>
            <p className="text-2xl font-bold leading-none mt-1">{op.arrivages_prevus || 0}</p>
          </div>
        </div>
        <div className="bg-[#0EA5E9] p-4 rounded-2xl flex items-center gap-4 shadow-lg shadow-blue-100/50 transition-transform hover:scale-[1.02]">
          <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-[#0EA5E9] shadow-sm">
            <PackageCheck size={24} />
          </div>
          <div className="text-white">
            <p className="text-[10px] font-bold opacity-80 uppercase tracking-wider">Réceptions du Jour</p>
            <p className="text-2xl font-bold leading-none mt-1">{op.receptions_du_jour || 0}</p>
          </div>
        </div>
        <div className="bg-[#F59E0B] p-4 rounded-2xl flex items-center gap-4 shadow-lg shadow-amber-100/50 transition-transform hover:scale-[1.02]">
          <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-[#F59E0B] shadow-sm">
            <TrendingUp size={24} />
          </div>
          <div className="text-white">
            <p className="text-[10px] font-bold opacity-80 uppercase tracking-wider">Expéditions du Jour</p>
            <p className="text-2xl font-bold leading-none mt-1">{op.colis_expedies_du_jour || 0}</p>
          </div>
        </div>
      </div>

      {/* TOP ROW: MAIN CHART & SUMMARY */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* LEFT: REVENUE OVERVIEW (2/3) */}
        <section className="lg:col-span-2 bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-50">
          <div className="p-6 pb-2 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-[#1E263E]">Aperçu des Flux Logistiques</h3>
              <p className="text-xs text-slate-400 font-semibold mt-1 uppercase tracking-wider">Récapitulatif annuel de l'activité</p>
            </div>
            <button className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-xs font-bold hover:bg-blue-100 transition-all shadow-sm">
              <Download size={14} /> Rapport
            </button>
          </div>

          <div className="px-6 flex border-b border-slate-100">
            {['Opérations', 'Finance'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-4 text-xs font-bold transition-all relative ${activeTab === tab ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
              >
                {tab}
                {activeTab === tab && <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />}
              </button>
            ))}
          </div>

          <div className="p-6 relative">
            <div className="space-y-8 relative">
              <div className="flex h-48 gap-4 pt-4 relative">
                {/* Y-AXIS LABELS */}
                <div className="flex flex-col justify-between text-[10px] font-bold text-slate-300 h-full pb-6 w-8 text-right">
                  {activeTab === 'Opérations' ? (
                    ['100', '75', '50', '25', '0'].map(val => <span key={val}>{val}</span>)
                  ) : (
                    ['4M', '3M', '2M', '1M', '0'].map(val => <span key={val}>{val}</span>)
                  )}
                </div>

                {/* CHART AREA WITH GRID LINES */}
                <div className="flex-1 flex justify-between gap-2 relative h-full">
                  {/* GRID LINES BACKGROUND */}
                  <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-6">
                    {[0, 1, 2, 3, 4].map(i => (
                      <div key={i} className="w-full border-t border-dashed border-slate-100 h-0" />
                    ))}
                  </div>

                  {/* BARS */}
                  {monthlyData.map((d, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-3 h-full group relative z-10">
                      <div className="w-full flex-1 flex items-end gap-1 px-0.5">
                        {activeTab === 'Opérations' ? (
                          <>
                            <div className="flex-1 relative group/bar h-full">
                              <motion.div initial={{ height: 0 }} animate={{ height: `${d.exp}%` }} className="w-full bg-orange-400 rounded-sm opacity-90 shadow-sm transition-all group-hover/bar:bg-orange-500 absolute bottom-0" />
                              <div className="absolute -top-10 left-1/2 -translate-x-1/2 opacity-0 group-hover/bar:opacity-100 transition-all bg-[#1E263E] text-white px-2 py-1 rounded text-[9px] font-bold z-20 pointer-events-none whitespace-nowrap shadow-xl">
                                {d.exp} Exp.
                              </div>
                            </div>
                            <div className="flex-1 relative group/bar h-full">
                              <motion.div initial={{ height: 0 }} animate={{ height: `${d.rec}%` }} className="w-full bg-blue-600 rounded-sm shadow-sm transition-all group-hover/bar:bg-blue-700 absolute bottom-0" />
                              <div className="absolute -top-10 left-1/2 -translate-x-1/2 opacity-0 group-hover/bar:opacity-100 transition-all bg-[#1E263E] text-white px-2 py-1 rounded text-[9px] font-bold z-20 pointer-events-none whitespace-nowrap shadow-xl">
                                {d.rec} Rec.
                              </div>
                            </div>
                          </>
                        ) : (
                          <div className="w-full relative group/bar h-full">
                            <motion.div initial={{ height: 0 }} animate={{ height: `${(d.ca / 3500000) * 100}%` }} className="w-full bg-gradient-to-t from-blue-600 to-blue-400 rounded-sm shadow-sm transition-all group-hover/bar:from-blue-700 group-hover/bar:to-blue-500 absolute bottom-0" />
                            <div className="absolute -top-10 left-1/2 -translate-x-1/2 opacity-0 group-hover/bar:opacity-100 transition-all bg-[#1E263E] text-white px-2 py-1 rounded text-[9px] font-bold z-20 pointer-events-none whitespace-nowrap shadow-xl">
                              {d.ca.toLocaleString()} FCFA
                            </div>
                          </div>
                        )}
                      </div>
                      <span className={`text-[10px] font-bold uppercase transition-colors ${d.m === currentMonthName ? 'text-[#1E263E] border-b-2 border-[#1E263E] pb-0.5' : 'text-slate-300'}`}>{d.m}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-6 pt-4">
                {activeTab === 'Opérations' ? (
                  <>
                    <div className="flex items-center gap-2">
                      <Circle size={8} className="fill-orange-400 text-orange-400" />
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Expéditions</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Circle size={8} className="fill-blue-600 text-blue-600" />
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Réceptions</span>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center gap-2">
                    <Circle size={8} className="fill-blue-600 text-blue-600" />
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Chiffre d'Affaires</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* RIGHT SIDEBAR (1/3) */}
        <div className="space-y-8">
          <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-50 space-y-6 relative overflow-hidden">
            <div className="flex items-center justify-between relative z-10">
              <h4 className="text-sm font-bold text-[#1E263E]">Taux de Recouvrement</h4>
              <MoreHorizontal size={16} className="text-slate-300 cursor-pointer" />
            </div>
            <div className="flex gap-6 relative z-10">
              <div className="flex-1 space-y-1"><p className="text-emerald-500 text-lg font-bold">{(fin.statut_paiements?.paye || 0).toLocaleString()}</p><p className="text-[10px] font-bold text-slate-400 uppercase">Payé</p></div>
              <div className="w-px bg-slate-100"></div>
              <div className="flex-1 space-y-1"><p className="text-rose-500 text-lg font-bold">{(fin.statut_paiements?.impaye || 0).toLocaleString()}</p><p className="text-[10px] font-bold text-slate-400 uppercase">Impayés</p></div>
            </div>
            <div className="relative z-10 pt-4 flex items-center justify-between">
              <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 shadow-lg shadow-blue-100 transition-all"><Wallet size={14} /> Percevoir</button>
              <button className="text-blue-600 text-xs font-bold">Détails &gt;</button>
            </div>
          </section>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <section className="bg-white rounded-2xl shadow-sm border border-slate-50 flex flex-col items-stretch overflow-hidden">
          <div className="p-6 flex justify-between items-center border-b border-slate-50 bg-slate-50/20">
            <h3 className="text-base font-bold text-[#1E263E]">Agences Actives</h3>
          </div>
          <div className="divide-y divide-slate-50 flex-1 overflow-y-auto">
            {(log.activite_agences || []).slice(0, 3).map((ag, i) => (
              <div key={i} className="p-5 flex items-start gap-4 hover:bg-slate-50 transition-colors group cursor-pointer">
                <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center font-bold text-slate-500 shadow-sm border border-white group-hover:bg-blue-600 group-hover:text-white transition-all text-xs">
                  {ag.nom_agence.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-1"><h5 className="text-sm font-bold truncate pr-2">{ag.nom_agence}</h5></div>
                  <div className="flex items-center gap-2"><span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 text-[9px] font-bold rounded uppercase">Active</span><span className="text-[10px] text-slate-400 font-medium">{ag.ville}</span></div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-50 flex flex-col justify-between overflow-hidden">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-base font-bold text-[#1E263E]">Top Destinations</h3>
          </div>
          <div className="relative flex flex-col items-center">
            <div className="relative w-48 h-28 overflow-hidden">
              <div className="absolute inset-x-0 top-0 h-48 border-[14px] border-slate-100 rounded-full"></div>
              <div className="absolute inset-x-0 top-0 h-48 border-[14px] border-transparent border-t-orange-500 border-r-blue-600 rounded-full rotate-[-45deg]"></div>
              <div className="absolute inset-0 flex flex-col items-center justify-end pb-2">
                <p className="text-3xl font-bold text-[#1E263E] tracking-tight">{log.top_destinations?.length || 0}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Pays Actifs</p>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 mt-8 pt-4 border-t border-slate-50">
            {(log.top_destinations || []).slice(0, 3).map((dest, i) => (
              <div key={i} className="text-center">
                <div className="flex items-center justify-center gap-1.5 mb-1"><Circle size={6} className={`fill-${i === 0 ? 'orange-500 text-orange-500' : (i === 1 ? 'amber-500 text-amber-500' : 'blue-500 text-blue-500')}`} /><span className="text-sm font-bold">{dest.total}</span></div>
                <p className="text-[9px] font-bold text-slate-400 uppercase truncate px-1">{dest.pays.split(' ')[0]}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-50 flex flex-col justify-between">
          <div className="flex justify-between items-center mb-6 relative">
            <h3 className="text-3xl font-bold text-[#1E263E]">{(fin.encours_a_recouvrer || 0).toLocaleString()}</h3>
          </div>
          <div className="space-y-6">
            <div className="flex flex-col gap-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Encours à Recouvrer</p>
              <div className="flex items-center gap-1 text-blue-600 text-[10px] font-bold cursor-pointer">Global</div>
            </div>
            <div className="flex items-center gap-4 bg-slate-50/50 p-4 rounded-xl border border-slate-100">
              <div className="w-12 h-12 bg-blue-100 rounded-lg overflow-hidden flex items-center justify-center text-blue-600">
                <Activity size={24} />
              </div>
              <div className="flex-1 min-w-0">
                <h6 className="text-xs font-bold text-slate-900 truncate">Extraction financière</h6>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Santé Globale : {paymentHealth}%</span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-end justify-between h-12 gap-1 mt-6">
            {[4, 7, 3, 8, 5, 9, 6].map((h, i) => <div key={i} className="flex-1 bg-emerald-500/20 rounded-t-sm group relative"><div className="absolute bottom-0 inset-x-0 bg-emerald-500 rounded-t-sm transition-all" style={{ height: `${h * 10}%` }}></div></div>)}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Dashboard;
