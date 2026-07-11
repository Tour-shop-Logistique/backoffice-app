import React, { useState, useEffect } from 'react';
import { motion as Motion } from 'framer-motion';
import { useDispatch, useSelector } from 'react-redux';
import { fetchDashboardStats, fetchDashboardRecap } from '../redux/slices/parcelSlice';
import {
  Loader2,
  RefreshCw,
  Download,
  ClipboardCheck,
  Truck,
  PackageCheck,
  TrendingUp,
  Activity,
  Wallet,
  Package,
  Building2,
} from "lucide-react";

const Dashboard = () => {
  const dispatch = useDispatch();
  const { dashboard } = useSelector(state => state.parcels);
  const { data, loading } = dashboard;
  const [activeTab, setActiveTab] = useState('Opérations');

  // State pour le filtre de date du recap (Mois/Année)
  const [selectedDate, setSelectedDate] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear()
  });

  // Utilisation des données réelles de l'API (Daily maintenant)
  const dailyOps = data?.daily_operations;
  const dailyFin = data?.daily_finance;

  // Données pour le graphique (Axe X = Jours du mois)
  const chartData = dailyOps ?
    dailyOps.days.map((day, i) => ({
      day: day,
      exp: dailyOps.datasets[0]?.data[i] || 0,
      rec: dailyOps.datasets[1]?.data[i] || 0,
      ca: dailyFin?.datasets[0]?.data[i] || 0
    })) : [];

  // Échelles différentes selon le type
  const maxExp = 50;  // Opérations : 0-50 par pas de 10
  const maxRec = 50;
  const maxCA = 500000;  // Finance : 0-500k par pas de 100k

  // Lancement initial des stats du dashboard
  useEffect(() => {
    dispatch(fetchDashboardStats());
  }, [dispatch]);

  // Chargement du récapitulatif au montage et quand le mois/année change
  useEffect(() => {
    dispatch(fetchDashboardRecap({
      month: selectedDate.month,
      year: selectedDate.year
    }));
  }, [dispatch, selectedDate.month, selectedDate.year]);

  if (loading && !data?.operational) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="animate-spin text-slate-600" size={40} strokeWidth={1.5} />
        <p className="text-base font-medium text-slate-500">Chargement de votre plateforme...</p>
      </div>
    );
  }

  const op = data?.operational || {};
  const log = data?.logistics || {};

  const kpiCards = [
    { icon: ClipboardCheck, label: 'Colis à contrôler', value: op.colis_a_controler || 0, bg: 'bg-blue-50', color: 'text-blue-600' },
    { icon: Truck, label: 'Arrivages prévus', value: op.arrivages_prevus || 0, bg: 'bg-emerald-50', color: 'text-emerald-600' },
    { icon: PackageCheck, label: 'Réceptions du jour', value: op.receptions_du_jour || 0, bg: 'bg-purple-50', color: 'text-purple-600' },
    { icon: TrendingUp, label: 'Expéditions du jour', value: op.colis_expedies_du_jour || 0, bg: 'bg-amber-50', color: 'text-amber-600' },
  ];

  return (
    <div className="space-y-5 pb-6 md:space-y-7 md:pb-12">

      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">Tableau de bord</h1>
          <p className="text-base text-slate-500 font-medium mt-1">Vue d'ensemble de votre activité logistique</p>
        </div>
        <button onClick={() => dispatch(fetchDashboardStats())} disabled={loading} className="p-3 bg-white border border-slate-200 rounded-xl shadow-sm hover:bg-slate-50 text-slate-500 transition-all self-start md:self-auto">
          <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* KPI CARDS — design simple et doux, sans dégradés ni ombres lourdes */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((kpi, i) => (
          <div key={i} className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center gap-4">
            <div className={`w-14 h-14 rounded-2xl ${kpi.bg} flex items-center justify-center shrink-0`}>
              <kpi.icon size={26} className={kpi.color} />
            </div>
            <div className="min-w-0">
              <p className="text-3xl font-bold text-slate-900 leading-tight">{kpi.value}</p>
              <p className="text-sm font-semibold text-slate-500 leading-snug">{kpi.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* CHART + SIDEBAR */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Chart */}
        <section className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100">
            <div>
              <h3 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <Activity size={18} className="text-slate-400" /> {activeTab === 'Opérations' ? (dailyOps?.title || 'Aperçu des Flux') : (dailyFin?.title || 'Récapitulatif Financier')}
              </h3>
              <p className="text-sm text-slate-500 font-medium mt-0.5">{activeTab === 'Opérations' ? 'Expéditions et Réceptions' : 'Chiffre d\'affaires quotidien'}</p>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-lg border border-slate-200">
                <select
                  value={selectedDate.month}
                  onChange={(e) => setSelectedDate(prev => ({ ...prev, month: parseInt(e.target.value) }))}
                  className="bg-transparent text-sm font-semibold text-slate-600 focus:outline-none px-2 py-1 cursor-pointer"
                >
                  {['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'].map((m, i) => (
                    <option key={i + 1} value={i + 1}>{m}</option>
                  ))}
                </select>
                <select
                  value={selectedDate.year}
                  onChange={(e) => setSelectedDate(prev => ({ ...prev, year: parseInt(e.target.value) }))}
                  className="bg-transparent text-sm font-semibold text-slate-600 focus:outline-none px-2 py-1 cursor-pointer border-l border-slate-200"
                >
                  {[2024, 2025, 2026].map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
              <button className="flex items-center gap-2 px-3 py-2 bg-slate-50 text-slate-600 border border-slate-200 rounded-xl text-sm font-semibold hover:bg-slate-100 transition-all">
                <Download size={16} /> Exporter
              </button>
            </div>
          </div>

          <div className="px-5 pt-4 flex gap-2">
            {[
              { id: 'Opérations', icon: ClipboardCheck, label: 'Opérations', activeClass: 'bg-orange-100 text-orange-700' },
              { id: 'Finance', icon: Wallet, label: 'Finance', activeClass: 'bg-blue-100 text-blue-700' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-bold rounded-xl transition-all ${activeTab === tab.id
                  ? tab.activeClass
                  : 'text-slate-500 hover:text-slate-600 hover:bg-slate-50'
                  }`}
              >
                <tab.icon size={16} /> {tab.label}
              </button>
            ))}
          </div>

          <div className="p-5 pt-4">
            <div className="flex h-48 gap-4 pt-4">
              <div className="flex flex-col justify-between text-sm font-semibold text-slate-500 h-full pb-6 w-12 text-right">
                {activeTab === 'Opérations'
                  ? [50, 40, 30, 20, 10, 0].map((v, i) => <span key={i}>{v}</span>)
                  : ['500k', '400k', '300k', '200k', '100k', '0'].map((v, i) => <span key={i}>{v}</span>)
                }
              </div>

              <div className="flex-1 overflow-x-auto relative h-full scrollbar-hide">
                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-6">
                  {[0, 1, 2, 3, 4].map(i => <div key={i} className="w-full border-t border-dashed border-slate-100 h-0" />)}
                </div>

                <div className="flex h-full gap-4 min-w-max">
                  {chartData.map((d, i) => {
                    const maxVal = maxExp > maxRec ? maxExp : maxRec;
                    return (
                      <div key={i} className="w-12 flex flex-col items-center gap-3 h-full group relative z-10">
                        <div className="w-full flex-1 flex items-end gap-1 px-0.5">
                          {activeTab === 'Opérations' ? (
                            <>
                              <div className="flex-1 relative group/bar h-full">
                                <Motion.div initial={{ height: 0 }} animate={{ height: maxVal > 0 ? `${(d.exp / maxVal) * 100}%` : '0%' }} className="w-full bg-orange-400 rounded-t-md absolute bottom-0 opacity-90 group-hover/bar:opacity-100 transition-opacity" />
                              </div>
                              <div className="flex-1 relative group/bar h-full">
                                <Motion.div initial={{ height: 0 }} animate={{ height: maxVal > 0 ? `${(d.rec / maxVal) * 100}%` : '0%' }} className="w-full bg-blue-400 rounded-t-md absolute bottom-0 opacity-90 group-hover/bar:opacity-100 transition-opacity" />
                              </div>
                            </>
                          ) : (
                            <div className="w-full relative group/bar h-full">
                              <Motion.div initial={{ height: 0 }} animate={{ height: maxCA > 0 ? `${(d.ca / maxCA) * 100}%` : '0%' }} className="w-full bg-blue-400 rounded-t-md absolute bottom-0 opacity-90 group-hover/bar:opacity-100 transition-opacity" />
                            </div>
                          )}
                        </div>
                        <div className="relative">
                          <span className={`text-sm font-semibold transition-colors ${i === new Date().getDate() - 1 ? 'text-slate-900 font-bold' : 'text-slate-500'}`}>{d.day}</span>
                          {activeTab === 'Opérations' ? (
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-all bg-slate-800 text-white px-2.5 py-1.5 rounded-lg text-sm font-semibold z-20 pointer-events-none whitespace-nowrap shadow-lg">
                              {d.exp} Exp. / {d.rec} Rec.
                            </div>
                          ) : (
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-all bg-slate-800 text-white px-2.5 py-1.5 rounded-lg text-sm font-semibold z-20 pointer-events-none whitespace-nowrap shadow-lg">
                              {d.ca.toLocaleString()} CFA
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex gap-6 pt-5 border-t border-slate-100 mt-5">
              {activeTab === 'Opérations' ? (
                <>
                  <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm bg-orange-400" /><span className="text-sm font-semibold text-slate-600">Expéditions</span></div>
                  <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm bg-blue-400" /><span className="text-sm font-semibold text-slate-600">Réceptions</span></div>
                </>
              ) : (
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm bg-blue-400" /><span className="text-sm font-semibold text-slate-600">Chiffre d'Affaires</span></div>
              )}
            </div>
          </div>
        </section>

        {/* Sidebar - Volumes par Type */}
        <section className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 space-y-4 h-fit">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
              <Package size={20} className="text-indigo-600" />
            </div>
            <div>
              <h4 className="text-base font-bold text-slate-900 tracking-tight">Volumes par type</h4>
              <p className="text-sm text-slate-500 font-medium">Répartition des expéditions</p>
            </div>
          </div>

          <div className="space-y-3 pt-1">
            {(log.volume_par_type || []).map((vol, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className={`w-2.5 h-2.5 rounded-full ${vol.total > 0 ? 'bg-indigo-500' : 'bg-slate-300'}`} />
                  <span className={`text-sm font-medium ${vol.total > 0 ? 'text-slate-700' : 'text-slate-500'}`}>{vol.type.replace('Type ', '')}</span>
                </div>
                <span className={`text-sm font-bold ${vol.total > 0 ? 'text-slate-900' : 'text-slate-500'}`}>{vol.total}</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* BOTTOM GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Agences Actives */}
        <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Building2 size={18} className="text-indigo-500" /> Agences actives
            </h3>
            <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 text-sm font-bold rounded-full">{(log.activite_agences || []).length} agences</span>
          </div>

          <div className="divide-y divide-slate-100">
            {(log.activite_agences || []).slice(0, 5).map((ag, i) => (
              <div key={i} className="p-4 flex items-center gap-3 hover:bg-slate-50 transition-colors">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-white text-sm shrink-0 ${i === 0 ? 'bg-indigo-400' : i === 1 ? 'bg-purple-400' : i === 2 ? 'bg-pink-400' : i === 3 ? 'bg-emerald-400' : 'bg-amber-400'}`}>
                  {ag.nom_agence.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <h5 className="text-base font-bold text-slate-900 truncate">{ag.nom_agence}</h5>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span className="text-sm text-slate-500">{ag.ville}</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-base font-bold text-slate-900">{ag.total || 0}</p>
                  <p className="text-xs text-slate-500">expéditions</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Top Destinations */}
        <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-11 h-11 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
              <TrendingUp size={20} className="text-amber-600" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Top destinations</h3>
              <p className="text-sm text-slate-500 font-medium">Les pays les plus actifs</p>
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
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${i === 0 ? 'bg-amber-400' : i === 1 ? 'bg-slate-400' : i === 2 ? 'bg-slate-300' : 'bg-slate-200'}`}>
                        {i + 1}
                      </span>
                      <span className="text-sm font-semibold text-slate-700">{dest.pays}</span>
                    </div>
                    <span className="text-sm font-bold text-slate-900">{dest.total}</span>
                  </div>
                  <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${i === 0 ? 'bg-amber-400' : i === 1 ? 'bg-slate-400' : i === 2 ? 'bg-slate-300' : 'bg-slate-200'}`}
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
