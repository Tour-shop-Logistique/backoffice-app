import React, { useState } from "react";
import { ArrowLeftRight, PackageCheck } from "lucide-react";
import IntervilleRates from "./IntervilleRates";
import TarifsEnlevementRates from "./TarifsEnlevementRates";

/**
 * Regroupe les briques de configuration Interville (tarifs de transport,
 * grille d'enlèvement/livraison à domicile) sous des sous-onglets. Les
 * communes ont leur propre menu dédié (src/pages/CommuneConfiguration.jsx)
 * car elles sont désormais partagées avec la configuration DHD, pas
 * seulement Interville. La grille de tranches km (TarifsEnlevementRates)
 * sert à la fois l'enlèvement ET la livraison à domicile (grille partagée,
 * voir MissionService côté backend) - un seul onglet suffit donc.
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
                    Tarifs d'expédition
                </button>
                <button
                    onClick={() => setActiveSubTab("enlevement")}
                    className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${activeSubTab === "enlevement" ? "bg-slate-900 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"}`}
                >
                    <PackageCheck size={16} />
                    Enlèvement & Livraison à domicile
                </button>
            </div>

            {activeSubTab === "tarifs" && <IntervilleRates />}
            {activeSubTab === "enlevement" && <TarifsEnlevementRates />}
        </div>
    );
};

export default IntervilleConfig;
