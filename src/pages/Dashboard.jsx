import React from 'react';
import { Package, Users, TrendingUp, DollarSign, ArrowUpRight, ArrowDownRight, Clock } from "lucide-react";

const StatCard = ({ title, value, icon: Icon, trend, trendValue, color }) => (
  <div className="bg-white p-6 rounded-2xl shadow-sm border border-surface-200 hover:shadow-md transition-shadow duration-300">
    <div className="flex justify-between items-start">
      <div className={`p-3 rounded-xl bg-${color}-50 text-${color}-600`}>
        <Icon className="h-6 w-6" />
      </div>
      {trend && (
        <div className={`flex items-center space-x-1 text-sm font-medium ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
          <span>{trendValue}</span>
          {trend === 'up' ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
        </div>
      )}
    </div>
    <div className="mt-4">
      <h3 className="text-surface-500 text-sm font-medium uppercase tracking-wider">{title}</h3>
      <p className="text-2xl font-bold text-surface-900 mt-1">{value}</p>
    </div>
  </div>
);

const Dashboard = () => {
  return (
    <div className="animate-fade-in space-y-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-surface-900 tracking-tight">Tableau de Bord</h1>
          <p className="text-surface-500 mt-1">Bienvenue , voici le résumé de vos activités aujourd'hui.</p>
        </div>
        <div className="flex items-center space-x-2 bg-white px-4 py-2 rounded-xl border border-surface-200 shadow-sm text-surface-600">
          <Clock className="h-4 w-4" />
          <span className="text-sm font-medium">{new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Colis Envoyés"
          value="1,284"
          icon={Package}
          trend="up"
          trendValue="+12.5%"
          color="primary"
        />
        <StatCard
          title="Nouveaux Clients"
          value="48"
          icon={Users}
          trend="up"
          trendValue="+5.2%"
          color="accent"
        />
        <StatCard
          title="Chiffre d'Affaire"
          value="4.2M FCFA"
          icon={DollarSign}
          trend="down"
          trendValue="-2.4%"
          color="green"
        />
        <StatCard
          title="Taux de Livraison"
          value="98.2%"
          icon={TrendingUp}
          trend="up"
          trendValue="+1.1%"
          color="orange"
        />
      </div>

      {/* Main Content Area (Placeholders) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 text-white">
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-surface-200 shadow-sm min-h-[400px]">
          <h3 className="text-lg font-bold text-surface-900 mb-6 flex items-center">
            <TrendingUp className="h-5 w-5 mr-2 text-primary-500" />
            Évolution des Expéditions
          </h3>
          <div className="flex items-center justify-center h-64 bg-surface-50 rounded-xl border-2 border-dashed border-surface-200">
            <p className="text-surface-400 font-medium italic">Graphique d'activité bientôt disponible</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-surface-200 shadow-sm">
          <h3 className="text-lg font-bold text-surface-900 mb-6">Activités Récentes</h3>
          <div className="space-y-6 text-black">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-start space-x-3">
                <div className="w-2 h-2 rounded-full bg-primary-500 mt-2" />
                <div>
                  <p className="text-sm font-semibold text-surface-800">Nouveau colis enregistré #TS-2849</p>
                  <p className="text-xs text-surface-500">Il y a {i * 10} minutes</p>
                </div>
              </div>
            ))}
          </div>
          <button className="w-full mt-8 py-2.5 text-sm font-bold text-primary-600 hover:bg-primary-50 rounded-xl transition-colors border border-primary-100">
            Voir tout l'historique
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
