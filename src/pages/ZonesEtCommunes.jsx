import React, { useState } from "react";
import { Globe, MapPin } from "lucide-react";
import ZoneConfiguration from "./ZoneConfiguration";
import CommuneConfiguration from "./CommuneConfiguration";

const ZonesEtCommunes = () => {
  const [activeTab, setActiveTab] = useState("zones");

  return (
    <div className="space-y-4 pb-6 md:space-y-6 md:pb-12">
      <div className="sticky top-[-24px] md:top-[-32px] z-40 bg-[#f1f5f9] -mx-6 px-6 md:-mx-8 md:px-8 pt-4 lg:pt-2 pb-3">
        <div className="flex bg-white rounded-lg border border-slate-200 p-1 shadow-sm w-fit">
          <button
            onClick={() => setActiveTab("zones")}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === "zones"
                ? "bg-slate-900 text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Globe size={16} />
            Zones d'expéditions
          </button>
          <button
            onClick={() => setActiveTab("communes")}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === "communes"
                ? "bg-slate-900 text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <MapPin size={16} />
            Communes
          </button>
        </div>
      </div>

      {activeTab === "zones" && <ZoneConfiguration />}
      {activeTab === "communes" && <CommuneConfiguration />}
    </div>
  );
};

export default ZonesEtCommunes;
