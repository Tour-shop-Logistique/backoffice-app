import React, { useState } from "react";
import { DollarSign, BarChart3 } from "lucide-react";
import SimpleRates from "./SimpleRates";
import GroupedRates from "./GroupedRates";

const Tarification = () => {
  const [activeTab, setActiveTab] = useState("simple");

  return (
    <div className="space-y-4 pb-6 md:space-y-6 md:pb-12">
      <div className="sticky top-[-24px] md:top-[-32px] z-40 bg-[#f1f5f9] -mx-6 px-6 md:-mx-8 md:px-8 pt-4 lg:pt-2 pb-3">
        <div className="flex bg-white rounded-lg border border-slate-200 p-1 shadow-sm w-fit">
          <button
            onClick={() => setActiveTab("simple")}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === "simple"
                ? "bg-slate-900 text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <DollarSign size={16} />
            Tarification simple
          </button>
          <button
            onClick={() => setActiveTab("groupee")}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === "groupee"
                ? "bg-slate-900 text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <BarChart3 size={16} />
            Tarification groupée
          </button>
        </div>
      </div>

      {activeTab === "simple" ? <SimpleRates /> : <GroupedRates />}
    </div>
  );
};

export default Tarification;
