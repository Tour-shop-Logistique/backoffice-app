import React, { useState } from 'react';
import { Megaphone, ShoppingBag, CreditCard } from 'lucide-react';
import AnnoncesMarketplaceTab from '../components/marketplace/AnnoncesMarketplaceTab';
import CommandesMarketplaceTab from '../components/marketplace/CommandesMarketplaceTab';
import AbonnementMarketplaceTab from '../components/marketplace/AbonnementMarketplaceTab';
import Tabs from '../components/common/Tabs';

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

      <Tabs tabs={TABS} active={activeTab} onChange={setActiveTab} />

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
