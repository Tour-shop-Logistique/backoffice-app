import React, { useState } from "react";
import { ArrowLeftRight, Truck, PackageCheck } from "lucide-react";
import IntervilleRates from "./IntervilleRates";
import LivraisonCommuneRates from "./LivraisonCommuneRates";
import TarifsEnlevementRates from "./TarifsEnlevementRates";

/**
 * Regroupe les briques de configuration Interville (tarifs de transport,
 * tarifs de livraison à domicile) sous des sous-onglets. Les communes ont
 * leur propre menu dédié (src/pages/CommuneConfiguration.jsx) car elles
 * sont désormais partagées avec la configuration DHD, pas seulement Interville.
 */
const IntervilleConfig = () => {
    const [activeSubTab, setActiveSubTab] = useState("tarifs");

    return (
        <div className="space-y-4">
            <div className="flex bg-white rounded-lg border border-slate-200 p-1 shadow-sm w-fit">
                <button
                    onClick={() => setActiveSubTab("tarifs")}
                    className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${activeSubTab === "tarifs" ? "bg-slate-900 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"}`}
                >
                    <ArrowLeftRight size={16} />
                    Tarifs de transport
                </button>
                <button
                    onClick={() => setActiveSubTab("livraison")}
                    className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${activeSubTab === "livraison" ? "bg-slate-900 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"}`}
                >
                    <Truck size={16} />
                    Livraison à domicile
                </button>
                <button
                    onClick={() => setActiveSubTab("enlevement")}
                    className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${activeSubTab === "enlevement" ? "bg-slate-900 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"}`}
                >
                    <PackageCheck size={16} />
                    Enlèvement à domicile
                </button>
            </div>

            {activeSubTab === "tarifs" && <IntervilleRates />}
            {activeSubTab === "livraison" && <LivraisonCommuneRates />}
            {activeSubTab === "enlevement" && <TarifsEnlevementRates />}
        </div>
    );
};

export default IntervilleConfig;
