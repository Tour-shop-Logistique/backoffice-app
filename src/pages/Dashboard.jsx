import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
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
  Circle
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
  const currentMonthName = monthlyOps?.months?.[currentMonthIndex]?.substring(0, 3) || '';
  
  // Max pour le scaling
  const maxExp = Math.max(...monthlyData.map(d => d.exp), 1);
  const maxRec = Math.max(...monthlyData.map(d => d.rec), 1);
  const maxCA = Math.max(...monthlyData.map(d => d.ca), 1);

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
  const fin = data?.financial || {};
  const log = data?.logistics || {};

  const totalPayment = (fin.statut_paiements?.paye || 0) + (fin.statut_paiements?.impaye || 0);
  const paymentHealth = totalPayment > 0 ? Math.round((fin.statut_paiements.paye / totalPayment) * 100) : 100;

  return (
    <div className="space-y-4 pb-6 md:space-y-6 md:pb-12">

      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Tableau de bord</h1>
          <p className="text-sm text-slate-500 font-medium mt-1">Vue d'ensemble de votre activité logistique</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg text-xs font-semibold text-slate-600 border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors shadow-sm">
            <Calendar size={14} className="text-slate-500" />
            {new Date().toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })} - Présent
            <ChevronDown size={14} className="ml-1 opacity-50" />
          </div>
          <button onClick={() => dispatch(fetchDashboardStats())} disabled={loading} className="p-2 bg-white border border-slate-200 rounded-lg shadow-sm hover:bg-slate-50 text-slate-500 transition-all">
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* KPI CARDS - Style sombre premium */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="relative overflow-hidden bg-slate-900 rounded-2xl p-5 shadow-lg group hover:shadow-xl transition-all">
          <div className="absolute top-0 left-0 w-full h-1 bg-indigo-500 opacity-60" />
          <div className="absolute -right-4 -bottom-4 w-20 h-20 rounded-full bg-white/5" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">À contrôler</p>
              <div className="p-1.5 rounded-lg bg-white/10 text-indigo-400">
                <ClipboardCheck size={14} />
              </div>
            </div>
            <p className="text-2xl font-bold text-white">{op.colis_a_controler || 0}</p>
          </div>
        </div>

        <div className="relative overflow-hidden bg-slate-900 rounded-2xl p-5 shadow-lg group hover:shadow-xl transition-all">
          <div className="absolute top-0 left-0 w-full h-1 bg-rose-500 opacity-60" />
          <div className="absolute -right-4 -bottom-4 w-20 h-20 rounded-full bg-white/5" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Arrivages prévus</p>
              <div className="p-1.5 rounded-lg bg-white/10 text-rose-400">
                <Truck size={14} />
              </div>
            </div>
            <p className="text-2xl font-bold text-white">{op.arrivages_prevus || 0}</p>
          </div>
        </div>

        <div className="relative overflow-hidden bg-slate-900 rounded-2xl p-5 shadow-lg group hover:shadow-xl transition-all">
          <div className="absolute top-0 left-0 w-full h-1 bg-blue-500 opacity-60" />
          <div className="absolute -right-4 -bottom-4 w-20 h-20 rounded-full bg-white/5" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Réceptions jour</p>
              <div className="p-1.5 rounded-lg bg-white/10 text-blue-400">
                <PackageCheck size={14} />
              </div>
            </div>
            <p className="text-2xl font-bold text-white">{op.receptions_du_jour || 0}</p>
          </div>
        </div>

        <div className="relative overflow-hidden bg-slate-900 rounded-2xl p-5 shadow-lg group hover:shadow-xl transition-all">
          <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500 opacity-60" />
          <div className="absolute -right-4 -bottom-4 w-20 h-20 rounded-full bg-white/5" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Expéditions jour</p>
              <div className="p-1.5 rounded-lg bg-white/10 text-emerald-400">
                <TrendingUp size={14} />
              </div>
            </div>
            <p className="text-2xl font-bold text-white">{op.colis_expedies_du_jour || 0}</p>
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
              <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-wider">{activeTab === 'Opérations' ? 'Expéditions et Réceptions' : 'Chiffre d\'affaires mensuel'}</p>
            </div>
            <div className="flex items-center gap-2">
              <button className="flex items-center gap-2 px-4 py-2 bg-slate-50 text-slate-600 border border-slate-200 rounded-xl text-xs font-bold hover:bg-slate-100 hover:border-slate-300 transition-all">
                <Download size={14} /> Exporter
              </button>
            </div>
          </div>

          <div className="px-6 pt-4 flex gap-1">
            {['Opérations', 'Finance'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2.5 text-xs font-bold rounded-lg transition-all ${activeTab === tab ? 'bg-slate-900 text-white' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="p-6 pt-4">
            <div className="flex h-48 gap-4 pt-4">
              <div className="flex flex-col justify-between text-[10px] font-bold text-slate-300 h-full pb-6 w-10 text-right">
                {activeTab === 'Opérations'
                  ? [maxExp > maxRec ? maxExp : maxRec, Math.round((maxExp > maxRec ? maxExp : maxRec) * 0.75), Math.round((maxExp > maxRec ? maxExp : maxRec) * 0.5), Math.round((maxExp > maxRec ? maxExp : maxRec) * 0.25), 0].map((v, i) => <span key={i}>{v}</span>)
                  : [maxCA, Math.round(maxCA * 0.75), Math.round(maxCA * 0.5), Math.round(maxCA * 0.25), 0].map((v, i) => <span key={i}>{v >= 1000000 ? (v/1000000).toFixed(1) + 'M' : v >= 1000 ? (v/1000).toFixed(0) + 'k' : v}</span>)
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
                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover/bar:opacity-100 transition-all bg-slate-900 text-white px-2 py-1 rounded-lg text-[9px] font-bold z-20 pointer-events-none whitespace-nowrap shadow-xl">{d.exp} Exp.</div>
                          </div>
                          <div className="flex-1 relative group/bar h-full">
                            <motion.div initial={{ height: 0 }} animate={{ height: maxVal > 0 ? `${(d.rec / maxVal) * 100}%` : '0%' }} className="w-full bg-blue-600 rounded-t-sm absolute bottom-0 opacity-90 group-hover/bar:opacity-100 transition-opacity" />
                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover/bar:opacity-100 transition-all bg-slate-900 text-white px-2 py-1 rounded-lg text-[9px] font-bold z-20 pointer-events-none whitespace-nowrap shadow-xl">{d.rec} Rec.</div>
                          </div>
                        </>
                      ) : (
                        <div className="w-full relative group/bar h-full">
                          <motion.div initial={{ height: 0 }} animate={{ height: maxCA > 0 ? `${(d.ca / maxCA) * 100}%` : '0%' }} className="w-full bg-gradient-to-t from-blue-700 to-blue-500 rounded-t-sm absolute bottom-0 opacity-90 group-hover/bar:opacity-100 transition-opacity" />
                          <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover/bar:opacity-100 transition-all bg-slate-900 text-white px-2 py-1 rounded-lg text-[9px] font-bold z-20 pointer-events-none whitespace-nowrap shadow-xl">{d.ca.toLocaleString()} CFA</div>
                        </div>
                      )}
                    </div>
                    <span className={`text-[10px] font-bold uppercase transition-colors ${i === currentMonthIndex ? 'text-slate-900 font-black' : 'text-slate-400'}`}>{d.m}</span>
                  </div>
                );
                })}
              </div>
            </div>

            <div className="flex gap-6 pt-6 border-t border-slate-100 mt-6">
              {activeTab === 'Opérations' ? (
                <>
                  <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-sm bg-orange-500" /><span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Expéditions</span></div>
                  <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-sm bg-blue-600" /><span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Réceptions</span></div>
                </>
              ) : (
                <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-sm bg-blue-600" /><span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Chiffre d'Affaires</span></div>
              )}
            </div>
          </div>
        </section>

        {/* Sidebar - Recouvrement */}
        <div className="space-y-6">
          <section className="relative overflow-hidden bg-slate-900 p-6 rounded-2xl shadow-lg space-y-5">
            <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500 opacity-60" />
            <div className="absolute -right-4 -bottom-4 w-20 h-20 rounded-full bg-white/5" />
            
            <div className="relative z-10 flex items-center justify-between">
              <h4 className="text-sm font-bold text-white tracking-tight">Taux de Recouvrement</h4>
              <div className="p-1.5 rounded-lg bg-white/10 text-emerald-400">
                <Wallet size={14} />
              </div>
            </div>
            
            <div className="relative z-10 flex gap-6">
              <div className="flex-1 space-y-1">
                <p className="text-emerald-400 text-xl font-bold">{(fin.statut_paiements?.paye || 0).toLocaleString()}</p>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Payé</p>
              </div>
              <div className="w-px bg-slate-700"></div>
              <div className="flex-1 space-y-1">
                <p className="text-rose-400 text-xl font-bold">{(fin.statut_paiements?.impaye || 0).toLocaleString()}</p>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Impayés</p>
              </div>
            </div>
            
            <div className="relative z-10 pt-4 border-t border-slate-700 flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Santé: {paymentHealth}%</span>
              <button className="text-xs font-bold text-white hover:text-emerald-400 transition-colors">Voir détails →</button>
            </div>
          </section>
        </div>
      </div>

      {/* BOTTOM GRID - Designs variés */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

        {/* Agences Actives - Style liste avec avatars */}
        <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 bg-gradient-to-r from-indigo-50 to-white flex justify-between items-center">
            <h3 className="text-sm font-bold text-slate-900">Agences Actives</h3>
            <span className="px-2 py-1 bg-indigo-100 text-indigo-700 text-[10px] font-bold rounded-full">{(log.activite_agences || []).length} agences</span>
          </div>
          
          <div className="divide-y divide-slate-100">
            {(log.activite_agences || []).slice(0, 3).map((ag, i) => (
              <div key={i} className="p-4 flex items-center gap-3 hover:bg-slate-50 transition-colors group cursor-pointer">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-xs shrink-0 ${i === 0 ? 'bg-indigo-500' : i === 1 ? 'bg-purple-500' : 'bg-pink-500'}`}>
                  {ag.nom_agence.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <h5 className="text-sm font-bold text-slate-900 truncate">{ag.nom_agence}</h5>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span className="text-[10px] text-slate-500">{ag.ville}</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-slate-900">{ag.total || 0}</p>
                  <p className="text-[9px] text-slate-400 uppercase">expéditions</p>
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
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Les pays les plus actifs</p>
            </div>
            <div className="p-2 bg-amber-50 rounded-lg text-amber-600">
              <TrendingUp size={16} />
            </div>
          </div>
          
          <div className="space-y-4">
            {(log.top_destinations || []).slice(0, 3).map((dest, i) => {
              const maxVal = Math.max(...(log.top_destinations || []).map(d => d.total));
              const percentage = maxVal > 0 ? (dest.total / maxVal) * 100 : 0;
              return (
                <div key={i}>
                  <div className="flex justify-between items-center mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white ${i === 0 ? 'bg-amber-500' : i === 1 ? 'bg-slate-400' : 'bg-slate-300'}`}>
                        {i + 1}
                      </span>
                      <span className="text-xs font-bold text-slate-700">{dest.pays.split(' ')[0]}</span>
                    </div>
                    <span className="text-xs font-bold text-slate-900">{dest.total}</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${i === 0 ? 'bg-amber-500' : i === 1 ? 'bg-slate-400' : 'bg-slate-300'}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          
          <div className="mt-5 pt-4 border-t border-slate-100 flex justify-between items-center">
            <span className="text-[10px] text-slate-400 font-bold uppercase">{log.top_destinations?.length || 0} pays actifs</span>
            <button className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors">Voir tout →</button>
          </div>
        </section>

        {/* Encours à Recouvrer - Style jauge circulaire */}
        <section className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl shadow-lg p-6 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          
          <div className="relative z-10 flex justify-between items-start mb-6">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Encours à Recouvrer</p>
              <h3 className="text-2xl font-bold text-white mt-1">{(fin.encours_a_recouvrer || 0).toLocaleString()} <span className="text-sm font-medium text-slate-500">CFA</span></h3>
            </div>
            <div className="p-2 bg-rose-500/20 rounded-lg text-rose-400">
              <Wallet size={16} />
            </div>
          </div>
          
          {/* Jauge circulaire simplifiée */}
          <div className="relative z-10 flex items-center justify-center py-4">
            <div className="relative w-32 h-32">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="64" cy="64" r="56" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-slate-700" />
                <circle 
                  cx="64" 
                  cy="64" 
                  r="56" 
                  stroke="currentColor" 
                  strokeWidth="12" 
                  fill="transparent"
                  strokeDasharray={`${paymentHealth * 3.52} 351.86`}
                  className="text-emerald-500"
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-white">{paymentHealth}%</span>
                <span className="text-[9px] text-slate-400 font-bold uppercase">Recouvré</span>
              </div>
            </div>
          </div>
          
          <div className="relative z-10 mt-4 grid grid-cols-2 gap-3">
            <div className="bg-white/10 rounded-xl p-3">
              <p className="text-emerald-400 text-lg font-bold">{(fin.statut_paiements?.paye || 0).toLocaleString()}</p>
              <p className="text-[9px] text-slate-400 font-bold uppercase">Payé</p>
            </div>
            <div className="bg-white/10 rounded-xl p-3">
              <p className="text-rose-400 text-lg font-bold">{(fin.statut_paiements?.impaye || 0).toLocaleString()}</p>
              <p className="text-[9px] text-slate-400 font-bold uppercase">Impayé</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Dashboard;
