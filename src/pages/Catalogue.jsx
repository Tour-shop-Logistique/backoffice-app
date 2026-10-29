import React, { useState } from 'react';
import { Tag, Package } from 'lucide-react';
import Produits from './produits';
import FormatsColisConfig from './FormatsColisConfig';
import Tabs from '../components/common/Tabs';

const TABS = [
  { id: 'produits', label: 'Produits & catégories', shortLabel: 'Produits', icon: Tag },
  { id: 'formats', label: 'Formats de colis', shortLabel: 'Formats', icon: Package },
];

/**
 * Ce qui est expédié : nature des produits (catégories, éligibilité par
 * type d'expédition) et gabarits de colis (seuils poids/volume qui
 * déterminent le tarif interville). Sous-pages montées en permanence pour
 * ne pas recharger à chaque changement d'onglet, comme Marketplace.jsx.
 */
const Catalogue = () => {
  const [activeTab, setActiveTab] = useState('produits');

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="space-y-3">
        <header>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">Produits & Colis</h1>
          <p className="text-sm md:text-base text-slate-500 mt-0.5 font-medium">
            Produits acceptés à l'expédition et formats de colis
          </p>
        </header>
        <Tabs tabs={TABS} active={activeTab} onChange={setActiveTab} />
      </div>

      <div className={activeTab === 'produits' ? '' : 'hidden'}>
        <Produits />
      </div>
      <div className={activeTab === 'formats' ? '' : 'hidden'}>
        <FormatsColisConfig />
      </div>
    </div>
  );
};

export default Catalogue;
