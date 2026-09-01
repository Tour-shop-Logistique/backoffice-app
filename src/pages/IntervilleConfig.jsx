import React, { useState } from "react";
import { MapPin, ArrowLeftRight, Truck } from "lucide-react";
import CommuneConfiguration from "./CommuneConfiguration";
import IntervilleRates from "./IntervilleRates";
import LivraisonCommuneRates from "./LivraisonCommuneRates";

/**
 * Regroupe les 3 briques de configuration Interville (communes, tarifs de
 * transport, tarifs de livraison à domicile) sous des sous-onglets, pour ne
 * pas surcharger Tarification.jsx d'un 5e onglet top-level.
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
                    onClick={() => setActiveSubTab("communes")}
                    className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${activeSubTab === "communes" ? "bg-slate-900 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"}`}
                >
                    <MapPin size={16} />
                    Communes
                </button>
                <button
                    onClick={() => setActiveSubTab("livraison")}
                    className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${activeSubTab === "livraison" ? "bg-slate-900 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"}`}
                >
                    <Truck size={16} />
                    Livraison à domicile
                </button>
            </div>

            {activeSubTab === "tarifs" && <IntervilleRates />}
            {activeSubTab === "communes" && <CommuneConfiguration />}
            {activeSubTab === "livraison" && <LivraisonCommuneRates />}
        </div>
    );
};

export default IntervilleConfig;
