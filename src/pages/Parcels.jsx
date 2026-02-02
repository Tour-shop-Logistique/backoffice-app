import React from 'react';
import { Package, Search, Filter, Plus } from "lucide-react";

const Parcels = () => {
  return (
    <div className="animate-fade-in space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-surface-900 tracking-tight">
            Gestion des Colis
          </h1>
          <p className="text-surface-500 mt-1">Suivez et gérez l'ensemble des expéditions en cours.</p>
        </div>
        <button className="btn-primary">
          <Plus className="h-5 w-5 mr-2" />
          <span>Nouveau Colis</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-surface-200 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-surface-400" />
            <input type="text" placeholder="Rechercher par numéro de suivi, client..." className="input-field pl-10" />
          </div>
          <button className="btn-secondary">
            <Filter className="h-5 w-5 mr-2" />
            Filtres
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-surface-200 overflow-hidden min-h-[400px] flex flex-col items-center justify-center p-12">
        <div className="w-20 h-20 rounded-full bg-surface-50 flex items-center justify-center mb-4">
          <Package className="h-10 w-10 text-surface-300" />
        </div>
        <h3 className="text-lg font-bold text-surface-900">Aucun colis trouvé</h3>
        <p className="text-surface-500 text-center max-w-sm mt-2">
          Il n'y a actuellement aucun colis enregistré dans le système correspondant à vos critères.
        </p>
        <button className="mt-6 text-primary-600 font-bold hover:underline">
          Importer des colis via Excel
        </button>
      </div>
    </div>
  );
};

export default Parcels;
