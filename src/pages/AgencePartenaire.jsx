import React, { useState, useEffect } from "react";
import api from "../services/api";
import {
  MapPin,
  Phone,
  Clock,
  Building2,
  X,
  CheckCircle2,
  XCircle,
  Search,
  Filter,
  Loader2
} from "lucide-react";

const AgencePartenaire = () => {
  const [agences, setAgences] = useState([]);
  const [filteredAgences, setFilteredAgences] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedAgence, setSelectedAgence] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  useEffect(() => {
    const saved = sessionStorage.getItem("agences");

    if (saved) {
      setAgences(JSON.parse(saved));
      setFilteredAgences(JSON.parse(saved));
      setIsLoading(false);
      return; // ⛔ pas de fetch
    }

    const fetchAgences = async () => {
      try {
        const response = await api.get("/agence/list");
        if (response.data?.success) {
          setAgences(response.data.agences);
          setFilteredAgences(response.data.agences);
          sessionStorage.setItem("agences", JSON.stringify(response.data.agences)); // ✅ sauvegarde
        } else {
          throw new Error("Impossible de charger les agences");
        }
      } catch (error) {
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAgences();
  }, []);


  useEffect(() => {
    let result = agences;

    // Filtrer par recherche
    if (searchTerm) {
      result = result.filter(
        (agence) =>
          agence.nom_agence.toLowerCase().includes(searchTerm.toLowerCase()) ||
          agence.ville.toLowerCase().includes(searchTerm.toLowerCase()) ||
          agence.adresse.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtrer par statut
    if (filterStatus !== "all") {
      result = result.filter((agence) =>
        filterStatus === "active" ? agence.actif : !agence.actif
      );
    }

    setFilteredAgences(result);
  }, [searchTerm, filterStatus, agences]);

  return (
    <div className="animate-fade-in space-y-6 pb-20 md:pb-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div className="max-w-2xl">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Agences Partenaires
          </h1>
          <p className="text-slate-500 text-sm mt-1 leading-relaxed italic">
            Consultez le réseau d'agences physiques et gérez les points de présence opérationnels du service.
          </p>
        </div>
      </div>

      {/* Stats Table - Minimalist Style */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Total Agences", value: agences.length, icon: Building2, color: "slate" },
          { label: "Opérationnelles", value: agences.filter(a => a.actif).length, icon: CheckCircle2, color: "green" },
          { label: "En pause", value: agences.filter(a => !a.actif).length, icon: XCircle, color: "red" },
        ].map((stat, i) => (
          <div key={i} className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex items-center gap-4">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${stat.color === 'green' ? 'bg-green-50 text-green-600' :
              stat.color === 'red' ? 'bg-red-50 text-red-600' : 'bg-slate-50 text-slate-600'
              }`}>
              <stat.icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">{stat.label}</p>
              <p className="text-xl font-bold text-slate-900">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filter Bar - Professional Slate Design */}
      <div className="flex flex-col md:flex-row gap-3 items-center bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Filtrer par nom, ville ou adresse..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-1 focus:ring-slate-900 focus:border-slate-900 outline-none transition-all placeholder:text-slate-400"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="flex-1 md:flex-none py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-1 focus:ring-slate-900 outline-none transition-all font-medium text-slate-700"
          >
            <option value="all">Tous les états</option>
            <option value="active">Actives uniquement</option>
            <option value="inactive">Suspendues</option>
          </select>
        </div>
      </div>

      {/* Agency Grid */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 grayscale opacity-50">
          <Loader2 className="h-10 w-10 text-slate-900 animate-spin mb-4" />
          <p className="text-slate-500 font-medium text-xs uppercase tracking-widest">Récupération des données réseau...</p>
        </div>
      ) : error ? (
        <div className="p-4 bg-red-50 border border-red-100 rounded-lg flex items-center gap-3 text-red-700 font-bold text-xs uppercase tracking-wide">
          <XCircle size={16} />
          {error}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredAgences.map((agence) => (
            <div
              key={agence.id}
              className="group bg-white rounded-xl border border-slate-200 shadow-sm hover:border-slate-900/20 hover:shadow-lg hover:shadow-slate-900/5 transition-all duration-300 overflow-hidden cursor-pointer relative"
              onClick={() => setSelectedAgence(agence)}
            >
              <div className="p-5 space-y-4">
                {/* Badge de statut minimaliste */}
                <div className="flex justify-between items-start">
                  <div className={`w-2 h-2 rounded-full ${agence.actif ? 'bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.4)]' : 'bg-slate-300'}`} />
                  <span className={`text-[9px] font-bold uppercase tracking-tight px-2 py-0.5 rounded-full border ${agence.actif ? 'bg-green-50 border-green-100 text-green-600' : 'bg-slate-50 border-slate-200 text-slate-400'
                    }`}>
                    {agence.actif ? 'Opérationnelle' : 'En pause'}
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                    {agence.nom_agence}
                  </h3>
                  <p className="text-[11px] text-slate-400 font-medium uppercase tracking-tight mt-0.5">
                    {agence.commune}, {agence.ville}
                  </p>
                </div>

                <div className="space-y-2 pt-2">
                  <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                    <MapPin size={14} className="text-slate-400" />
                    <span className="truncate">{agence.adresse}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                    <Phone size={14} className="text-slate-400" />
                    <span>{agence.telephone}</span>
                  </div>
                </div>
              </div>

              {/* Overlay Hover Effect */}
              <div className="opacity-0 group-hover:opacity-100 absolute bottom-3 right-5 transition-opacity flex items-center gap-1.5 text-[10px] font-bold text-slate-900 uppercase tracking-widest">
                Plus de détails <span className="text-lg leading-none mt-[-2px]">→</span>
              </div>
            </div>
          ))}

          {filteredAgences.length === 0 && (
            <div className="col-span-full py-16 text-center bg-white rounded-xl border border-dashed border-slate-200">
              <Building2 className="h-10 w-10 text-slate-200 mx-auto mb-4" />
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest">Aucune agence trouvée</h3>
              <p className="text-xs text-slate-400 mt-1">Élargissez vos critères de recherche pour voir plus de points.</p>
            </div>
          )}
        </div>
      )}

      {/* DETAIL MODAL - Refined Structure */}
      {selectedAgence && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col border border-slate-200 animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-100 rounded text-slate-600">
                  <Building2 size={18} />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900 uppercase tracking-widest">Fiche Établissement</h2>
                  <p className="text-[10px] font-medium text-slate-400 uppercase tracking-tighter">ID Réseau: {selectedAgence.id ? String(selectedAgence.id).substring(0, 8) : '...'}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedAgence(null)}
                className="p-2 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-slate-900 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="overflow-y-auto custom-scrollbar p-6 space-y-8">
              {/* Identity & Status */}
              <section className="flex flex-col md:flex-row justify-between items-start gap-6">
                <div className="space-y-1">
                  <h3 className="text-2xl font-bold text-slate-900 tracking-tight">{selectedAgence.nom_agence}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">{selectedAgence.description || "Aucune description fournie pour cette agence partenaire."}</p>
                </div>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-lg shrink-0">
                  <div className={`w-2 h-2 rounded-full ${selectedAgence.actif ? 'bg-green-500' : 'bg-slate-300'}`} />
                  <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">
                    {selectedAgence.actif ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </section>

              {/* Geographic Info Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-5 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                    <MapPin size={10} /> Localisation
                  </p>
                  <p className="text-sm font-bold text-slate-900">{selectedAgence.adresse}</p>
                  <p className="text-xs text-slate-600 mt-1">{selectedAgence.commune}, {selectedAgence.ville}</p>
                  <p className="text-[10px] text-slate-400 uppercase font-bold mt-2 tracking-tighter">{selectedAgence.pays}</p>
                </div>
                <div className="p-5 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                    <Phone size={10} /> Contact Direct
                  </p>
                  <p className="text-sm font-bold text-slate-900">{selectedAgence.telephone}</p>
                  <p className="text-xs text-slate-500 mt-1">Ligne disponible aux heures d'ouverture indiquées.</p>
                </div>
              </div>

              {/* Business Hours - Technical Table Design */}
              <section className="space-y-4">
                <div className="flex items-center gap-4">
                  <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap flex items-center gap-2">
                    <Clock size={12} /> Horaires de Service
                  </h3>
                  <div className="h-px bg-slate-100 w-full" />
                </div>

                <div className="bg-white border border-slate-100 rounded-lg divide-y divide-slate-50 overflow-hidden">
                  {selectedAgence.horaires.map((h, index) => (
                    <div key={index} className="flex items-center justify-between p-3 px-4 hover:bg-slate-50/50 transition-colors">
                      <span className="text-[11px] font-bold text-slate-700 capitalize w-24">
                        {h.jour}
                      </span>
                      {h.ferme ? (
                        <span className="text-[10px] font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded uppercase tracking-tighter">Fermé</span>
                      ) : (
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-bold text-slate-900">{h.ouverture}</span>
                          <span className="text-[10px] text-slate-300 font-bold uppercase tracking-widest">à</span>
                          <span className="text-xs font-bold text-slate-900">{h.fermeture}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3 z-10 sticky bottom-0">
              <button
                onClick={() => setSelectedAgence(null)}
                className="px-6 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/10"
              >
                Fermer la fiche
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgencePartenaire;