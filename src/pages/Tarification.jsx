import React, { useState } from "react";
import SimpleRates from "./SimpleRates";
import GroupedRates from "./GroupedRates";
import IntervilleConfig from "./IntervilleConfig";

const TABS = [
  { id: "simple", label: "Internationale (LD)", fullLabel: "Tarification Internationale (LD)" },
  { id: "groupee", label: "Internationale (Groupage)", fullLabel: "Tarification Internationale (Groupage)" },
  { id: "interville", label: "Interville (National)", fullLabel: "Tarification Interville (National)" },
];

const Tarification = () => {
  const [activeTab, setActiveTab] = useState("simple");

  return (
    <div className="space-y-4 pb-6 md:space-y-6 md:pb-12">
      <div className="sticky top-[-24px] md:top-[-32px] z-40 bg-[#f1f5f9] -mx-6 px-6 md:-mx-8 md:px-8 pt-4 lg:pt-2 pb-3">
        {/* Onglets pleine largeur en 3 colonnes égales sur mobile (labels
            raccourcis, pas d'icônes) ; largeur naturelle avec libellé complet
            à partir de md. */}
        <div className="grid grid-cols-3 md:inline-flex md:w-fit bg-white rounded-lg border border-slate-200 p-1 shadow-sm gap-1 md:gap-0">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-2 md:px-4 py-2 rounded-md text-xs md:text-sm font-medium text-center transition-all ${
                activeTab === tab.id
                  ? "bg-slate-900 text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <span className="md:hidden">{tab.label}</span>
              <span className="hidden md:inline">{tab.fullLabel}</span>
            </button>
          ))}
        </div>
      </div>

      {activeTab === "simple" && <SimpleRates />}
      {activeTab === "groupee" && <GroupedRates />}
      {activeTab === "interville" && <IntervilleConfig />}
    </div>
  );
};

export default Tarification;
