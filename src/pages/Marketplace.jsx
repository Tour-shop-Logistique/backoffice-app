import React, { useState } from 'react';
import { Megaphone, ShoppingBag, CreditCard } from 'lucide-react';
import AnnoncesMarketplaceTab from '../components/marketplace/AnnoncesMarketplaceTab';
import CommandesMarketplaceTab from '../components/marketplace/CommandesMarketplaceTab';
import AbonnementMarketplaceTab from '../components/marketplace/AbonnementMarketplaceTab';

const TABS = [
  { id: 'annonces', label: 'Annonces', icon: Megaphone },
  { id: 'commandes', label: 'Commandes', icon: ShoppingBag },
  { id: 'abonnement', label: 'Abonnement', icon: CreditCard },
];

/**
 * Supervision du module Marketplace (vente entre clients) : modération des
 * annonces/commandes, configuration et suivi de l'abonnement périodique
 * (vendeurs et livreurs). Les 3 sous-pages restent montées en permanence
 * (juste masquées) pour éviter de recharger les données à chaque changement
 * d'onglet - même pattern que Communication.jsx (Annonces/Messages).
 */
const Marketplace = () => {
  const [activeTab, setActiveTab] = useState('annonces');

  return (
    <div className="space-y-4 pb-6 md:space-y-6 md:pb-12 font-sans">
      <header>
        <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">Marketplace</h1>
        <p className="text-sm md:text-base text-slate-500 mt-0.5 font-medium">
          Modération des annonces et commandes, suivi de l'abonnement périodique
        </p>
      </header>

      <div className="flex items-center gap-1 p-1 bg-white rounded-lg border border-slate-200 shadow-sm w-fit">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${
              activeTab === id ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      <div className={activeTab === 'annonces' ? '' : 'hidden'}>
        <AnnoncesMarketplaceTab />
      </div>
      <div className={activeTab === 'commandes' ? '' : 'hidden'}>
        <CommandesMarketplaceTab />
      </div>
      <div className={activeTab === 'abonnement' ? '' : 'hidden'}>
        <AbonnementMarketplaceTab />
      </div>
    </div>
  );
};

export default Marketplace;
