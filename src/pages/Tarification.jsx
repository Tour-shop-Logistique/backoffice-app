import React, { useState } from "react";
import { Globe, Layers, ArrowLeftRight, PackageCheck } from "lucide-react";
import SimpleRates from "./SimpleRates";
import GroupedRates from "./GroupedRates";
import IntervilleRates from "./IntervilleRates";
import TarifsEnlevementRates from "./TarifsEnlevementRates";
import Tabs from "../components/common/Tabs";

// La grille de tranches km sert à la fois l'enlèvement ET la livraison à
// domicile (grille partagée, voir MissionService côté backend).
const TABS = [
  { id: "simple", label: "Internationale (LD)", shortLabel: "LD", icon: Globe },
  { id: "groupee", label: "Internationale (Groupage)", shortLabel: "Groupage", icon: Layers },
  { id: "interville", label: "Interville (National)", shortLabel: "Interville", icon: ArrowLeftRight },
  { id: "enlevement", label: "Enlèvement & Livraison à domicile", shortLabel: "Enlèvement & Livraison", icon: PackageCheck },
];

const Tarification = () => {
  const [activeTab, setActiveTab] = useState("simple");

  return (
    <div className="space-y-4 pb-6 md:space-y-6 md:pb-12">
      <div className="sticky top-[-24px] md:top-[-32px] z-40 bg-[#f1f5f9] -mx-6 px-6 md:-mx-8 md:px-8 pt-4 lg:pt-2 space-y-3">
        <header>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">Tarification</h1>
          <p className="text-sm md:text-base text-slate-500 mt-0.5 font-medium">
            Grilles de prix par type d'expédition et par service à domicile
          </p>
        </header>
        <Tabs tabs={TABS} active={activeTab} onChange={setActiveTab} />
      </div>

      {activeTab === "simple" && <SimpleRates />}
      {activeTab === "groupee" && <GroupedRates />}
      {activeTab === "interville" && <IntervilleRates />}
      {activeTab === "enlevement" && <TarifsEnlevementRates />}
    </div>
  );
};

export default Tarification;
