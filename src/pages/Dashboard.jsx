import React from 'react';
import {
  Package,
  Users,
  TrendingUp,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  ChevronRight,
  Activity,
  LayoutDashboard,
  Calendar,
  Truck,
  ShieldCheck,
  Ship,
  Plane,
  ClipboardCheck,
  PackageCheck,
  MoveUpRight
} from "lucide-react";

/**
 * StatCard: Coherent with the AgenceDetail cards
 */
const StatCard = ({ title, value, icon: Icon, trend, trendValue, color }) => {
  const colorMap = {
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
    purple: 'bg-purple-50 text-purple-600 border-purple-100',
    rose: 'bg-rose-50 text-rose-600 border-rose-100',
  };

  const trendColor = trend === 'up' ? 'text-emerald-600' : 'text-rose-600';

  return (
    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all group">
      <div className="flex justify-between items-start mb-4">
        <div className={`p-2.5 rounded-xl border ${colorMap[color] || colorMap.blue}`}>
          <Icon size={20} />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-[10px] font-bold uppercase ${trendColor}`}>
            {trendValue}
            {trend === 'up' ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
          </div>
        )}
      </div>
      <div>
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">{title}</p>
        <div className="flex items-baseline gap-1.5">
          <span className="text-xl font-bold text-slate-900">{value}</span>
        </div>
      </div>
    </div>
  );
};

const Dashboard = () => {
  return (
    <div className="space-y-6 pb-12 max-w-7xl mx-auto font-sans">
      {/* Header - Refocused on Control & Logistics role */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">Tableau de Bord</h1>
            <p className="text-xs md:text-sm text-slate-500 mt-0.5 flex items-center gap-1.5">
              <span className="text-slate-400">Vue d'ensemble de l'activité logistique • {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-xl text-[10px] font-semibold uppercase tracking-widest">
            <ShieldCheck size={14} />
            Système Opérationnel
          </div>
        </div>
      </div>

      {/* Grid Statistique - Metrics for the Backoffice Role */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Colis Reçus (Hub)"
          value="452"
          icon={PackageCheck}
          trend="up"
          trendValue="+12.5%"
          color="blue"
        />
        <StatCard
          title="En attente de Contrôle"
          value="86"
          icon={ClipboardCheck}
          trend="down"
          trendValue="-5%"
          color="amber"
        />
        <StatCard
          title="Prêts pour Embarquement"
          value="124"
          icon={MoveUpRight}
          trend="up"
          trendValue="+3.2%"
          color="purple"
        />
        <StatCard
          title="En Route / Expédiés"
          value="1,284"
          icon={Truck}
          trend="up"
          trendValue="+1.1%"
          color="emerald"
        />
      </div>

      {/* Main Content Areas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* Verification & Control Stream */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden text-black">
            <div className="border-b border-slate-100 bg-slate-50/50 px-6 py-4 flex items-center justify-between">
              <h3 className="text-[10px] font-bold text-slate-900 uppercase tracking-widest flex items-center gap-2">
                <Package size={14} className="text-slate-400" />
                Flux de Colis à Contrôler
              </h3>
              <div className="flex gap-2">
                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-bold rounded-full uppercase">86 Colis</span>
              </div>
            </div>

            <div className="divide-y divide-slate-100">
              {[
                { ref: 'TS-8402', agence: 'Dakar Plateau', type: 'DHD Aérien', icon: Plane },
                { ref: 'TS-8395', agence: 'Thiès Gare', type: 'DHD Maritime', icon: Ship },
                { ref: 'TS-8392', agence: 'Saint-Louis', type: 'DHD Aérien', icon: Plane },
                { ref: 'TS-8388', agence: 'Dakar Médina', type: 'Afrique', icon: Truck },
                { ref: 'TS-8385', agence: 'Mbour Centre', type: 'Simple', icon: Package },
              ].map((item, i) => (
                <div key={i} className="px-5 md:px-6 py-5 hover:bg-slate-50/30 transition-colors group">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start sm:items-center gap-4">
                      {/* Icon */}
                      <div className="h-12 w-12 flex-shrink-0 bg-white rounded-xl flex items-center justify-center text-slate-400 border border-slate-100 group-hover:border-blue-200 group-hover:text-blue-600 transition-all shadow-sm">
                        <item.icon size={20} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center flex-wrap gap-2 mb-1.5">
                          <p className="text-sm font-bold text-slate-900 tracking-tight">Expédition {item.ref}</p>
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md border uppercase tracking-wider ${item.type.includes('Aérien') ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                            {item.type}
                          </span>
                        </div>

                        <p className="text-[11px] text-slate-500 leading-none">
                          Provenance : <span className="text-slate-900 font-semibold">{item.agence}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button className="flex-1 sm:flex-none px-5 py-2.5 bg-slate-50 hover:bg-slate-900 text-slate-500 hover:text-white rounded-lg text-[10px] font-bold uppercase tracking-widest border border-slate-200 hover:border-slate-900 transition-all active:scale-95 shadow-sm">
                        Contrôler
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 bg-slate-50/50 border-t border-slate-100 text-center">
              <button className="text-[10px] font-bold text-slate-400 hover:text-slate-600 uppercase tracking-[0.2em] transition-colors">
                Gérer tous les arrivages agence
              </button>
            </div>
          </div>
        </div>

        {/* Boarding & Validation Sidebar */}
        <div className="lg:col-span-4 space-y-6">
          {/* Ongoing Shipments (Boarding Status) */}
          <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-xl shadow-slate-200 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 text-white/5 opacity-20 transform group-hover:rotate-12 transition-transform">
              <Ship size={100} strokeWidth={4} />
            </div>
            <div className="flex items-center justify-between mb-6 relative z-10">
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Opérations de Départ</h3>
              <Activity size={16} className="text-emerald-400" />
            </div>

            <div className="space-y-5 relative z-10">
              <div className="p-3 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-colors cursor-pointer group/item">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-bold text-blue-400">Embarquement Maritime</span>
                  <span className="text-[10px] text-slate-400">EN COURS</span>
                </div>
                <div className="h-1.5 bg-white/10 rounded-full mb-2">
                  <div className="h-full bg-blue-500 rounded-full w-[65%]" />
                </div>
                <p className="text-[10px] text-slate-500 font-medium">Conteneur #MC-2038 • 32/50 Colis chargés</p>
              </div>

              <div className="p-3 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-colors cursor-pointer">
                <div className="flex justify-between items-start mb-2 text-white">
                  <span className="text-xs font-bold text-amber-400">Embarquement Aérien</span>
                  <span className="text-[10px] text-slate-400">PRÊT</span>
                </div>
                <div className="h-1.5 bg-white/10 rounded-full mb-2">
                  <div className="h-full bg-amber-500 rounded-full w-[100%]" />
                </div>
                <p className="text-[10px] text-slate-500 font-medium">Vol #AF-104 • 18 Colis vérifiés</p>
              </div>
            </div>
          </div>

          {/* Logistics Control Actions */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Actions Logistiques</h3>
            <div className="grid grid-cols-1 gap-3 text-white">
              <button className="p-4 rounded-xl bg-slate-900 hover:bg-slate-800 flex items-center gap-4 transition-all group">
                <div className="p-2 bg-white/10 rounded-lg group-hover:bg-blue-500 transition-colors">
                  <ShieldCheck size={18} />
                </div>
                <div className="text-left">
                  <p className="text-[10px] text-slate-400 uppercase font-bold leading-none mb-1">Contrôle Qualité</p>
                  <p className="text-xs font-bold">Valider les colis reçus</p>
                </div>
              </button>
              <button className="p-4 rounded-xl bg-slate-50 border border-slate-200 hover:border-slate-300 flex items-center gap-4 transition-all group">
                <div className="p-2 bg-slate-100 rounded-lg group-hover:bg-slate-200 transition-colors text-black">
                  <Ship size={18} />
                </div>
                <div className="text-left">
                  <p className="text-[10px] text-slate-500 uppercase font-bold leading-none mb-1">Manifeste de Bord</p>
                  <p className="text-xs font-bold text-slate-900">Préparer l'expédition</p>
                </div>
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
