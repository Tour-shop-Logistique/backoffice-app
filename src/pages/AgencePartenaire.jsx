import React, { useState, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { fetchAgences, toggleAgenceStatus } from "../redux/slices/agenceSlice";
import { showNotification } from "../redux/slices/uiSlice";
import { ROUTES } from "../routes";
import {
  Phone,
  Building2,
  XCircle,
  Search,
  Loader2,
  RefreshCw,
  Eye,
  MapPinned,
  ChevronRight
} from "lucide-react";

const AgencePartenaire = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { agences, isLoading, error, hasLoaded } = useSelector((state) => state.agences);
  const { user } = useSelector((state) => state.auth);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [updatingStatus, setUpdatingStatus] = useState({});
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (!hasLoaded) {
      dispatch(fetchAgences());
    }
  }, [dispatch, hasLoaded]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await dispatch(fetchAgences()).unwrap();
      dispatch(showNotification({ type: 'success', message: 'Liste des agences mise à jour.' }));
    } catch (error) {
      dispatch(showNotification({ type: 'error', message: 'Erreur lors du rafraîchissement.' }));
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleToggleStatus = async (e, agenceId, currentStatus) => {
    e.stopPropagation(); // Prevent navigation to detail page
    const newStatus = currentStatus ? 0 : 1;
    setUpdatingStatus(prev => ({ ...prev, [agenceId]: true }));

    try {
      await dispatch(toggleAgenceStatus({ agenceId, status: newStatus })).unwrap();
    } catch (error) {
      dispatch(showNotification({ type: 'error', message: "Erreur lors de la mise à jour du statut." }));
    } finally {
      setUpdatingStatus(prev => ({ ...prev, [agenceId]: false }));
    }
  };

  const filteredBySearch = useMemo(() => {
    return (agences || []).filter(agence => {
      const search = searchTerm.toLowerCase();
      return (
        agence.nom_agence?.toLowerCase().includes(search) ||
        agence.ville?.toLowerCase().includes(search) ||
        agence.adresse?.toLowerCase().includes(search) ||
        agence.code_agence?.toLowerCase().includes(search) ||
        agence.telephone?.toLowerCase().includes(search)
      );
    });
  }, [agences, searchTerm]);

  const filteredAgences = useMemo(() => {
    return filteredBySearch.filter(agence => {
      if (filterStatus === "active") return agence.actif;
      if (filterStatus === "inactive") return !agence.actif;
      return true;
    });
  }, [filteredBySearch, filterStatus]);

  const counts = useMemo(() => ({
    all: filteredBySearch.length,
    active: filteredBySearch.filter(a => a.actif).length,
    inactive: filteredBySearch.filter(a => !a.actif).length
  }), [filteredBySearch]);

  const goToDetail = (e, agenceId) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    navigate(`/agence-partenaire/${agenceId}`);
  };

  return (
    <div className="space-y-4 pb-6 md:space-y-6 md:pb-12 font-sans">
      <header className="space-y-3 md:space-y-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">Agences Partenaires</h1>
            <p className="text-xs md:text-sm text-slate-500 mt-0.5 font-medium">Consultez et gérez le réseau d'agences physiques</p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing || isLoading}
            className="inline-flex items-center justify-center p-3 text-sm font-medium rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="hidden md:inline md:ml-2">Rafraîchir</span>
          </button>
        </div>
      </header>

      <div className="relative group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-slate-900 transition-colors" />
        <input
          type="text"
          placeholder="Rechercher par nom, ville, code ou téléphone..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 md:pl-12 pr-3 md:pr-4 py-2.5 md:py-3  bg-white border border-slate-200 rounded-lg shadow-sm focus:outline-none focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900 transition-all text-sm placeholder:text-slate-400"
        />
      </div>

      <div className="bg-white rounded-lg md:rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="border-b border-slate-100 bg-slate-50/50">
          <div className="flex overflow-x-auto no-scrollbar">
            {[
              { id: 'all', label: 'Toutes', count: counts.all, activeColor: 'text-slate-900 border-slate-900' },
              { id: 'active', label: 'Actives', count: counts.active, activeColor: 'text-emerald-600 border-emerald-600' },
              { id: 'inactive', label: 'Inactives', count: counts.inactive, activeColor: 'text-rose-600 border-rose-600' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilterStatus(tab.id)}
                className={`px-4 md:px-6 py-2 md:py-3 text-xs md:text-sm font-medium whitespace-nowrap transition-all ${filterStatus === tab.id
                  ? `${tab.activeColor} bg-white border-b-2`
                  : 'text-slate-500 hover:text-slate-700'
                  }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>
        </div>

        {isLoading && !hasLoaded ? (
          <div className="flex flex-col items-center justify-center py-24 grayscale opacity-50">
            <Loader2 className="h-10 w-10 text-slate-900 animate-spin mb-4" />
            <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.2em]">Initialisation du réseau...</p>
          </div>
        ) : error ? (
          <div className="m-6 p-4 bg-rose-50 border border-rose-100 rounded-xl flex items-center gap-3 text-rose-700 font-bold text-xs uppercase tracking-wide">
            <XCircle size={18} />
            {error}
          </div>
        ) : filteredAgences.length === 0 ? (
          <div className="py-20 text-center">
            <div className="bg-slate-50 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-inner">
              <Building2 className="text-slate-300" size={40} />
            </div>
            <h3 className="font-bold text-slate-900 text-lg">Aucune agence trouvée</h3>
            <p className="text-slate-500 text-sm mt-2">Ajustez vos filtres ou effectuez une nouvelle recherche.</p>
          </div>
        ) : (
          <>
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-200">
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Code</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Agence</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Localisation</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Contact</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Statut</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredAgences.map((agence) => (
                    <tr
                      key={agence.id}
                      className="hover:bg-slate-50/50 transition-colors group cursor-pointer"
                      onClick={(e) => goToDetail(e, agence.id)}
                    >
                      <td className="px-6 py-3">
                        <span className="px-2 py-1 bg-slate-100 text-xs font-semibold text-slate-600 rounded uppercase border border-slate-200">
                          {agence.code_agence || 'AGN'}
                        </span>
                      </td>
                      <td className="px-6 py-3">
                        <span className="font-semibold text-slate-900">{agence.nom_agence}</span>
                      </td>
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-1.5 text-slate-700 font-semibold text-sm">
                          <MapPinned className="h-4 w-4 text-slate-400" />
                          {agence.adresse}
                        </div>
                      </td>
                      <td className="px-6 py-3 font-semibold text-sm">{agence.telephone}</td>
                      <td className="px-6 py-3">
                        <button
                          onClick={(e) => handleToggleStatus(e, agence.id, agence.actif)}
                          disabled={updatingStatus[agence.id]}
                          className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${agence.actif ? 'bg-emerald-500' : 'bg-slate-200'} ${updatingStatus[agence.id] ? 'opacity-50' : ''}`}
                        >
                          <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${agence.actif ? 'translate-x-5' : 'translate-x-0'} ${updatingStatus[agence.id] ? 'animate-pulse scale-75' : ''}`} />
                        </button>
                      </td>
                      <td className="px-6 py-3 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            goToDetail(e, agence.id);
                          }}
                          className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all"
                        >
                          <Eye size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="md:hidden divide-y divide-slate-200">
              {filteredAgences.map((agence) => (
                <div
                  key={agence.id}
                  className="p-5 active:bg-slate-50 transition-all duration-200 cursor-pointer select-none"
                  onClick={(e) => goToDetail(e, agence.id)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex items-center gap-2.5">
                        <span className="px-1.5 py-0.5 bg-slate-100 text-[10px] font-bold text-slate-500 rounded uppercase border border-slate-200/60 shadow-sm leading-none">{agence.code_agence || 'AGN'}</span>
                        <h3 className="font-semibold text-slate-900 text-[15px] leading-tight truncate">{agence.nom_agence}</h3>
                      </div>
                      <div className="space-y-1.5 pl-1">
                        <div className="flex items-center gap-2 text-slate-400">
                          <MapPinned size={14} strokeWidth={1.5} className="shrink-0" />
                          <span className="text-xs font-medium text-slate-500 truncate tracking-tight">{agence.adresse}</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-400">
                          <Phone size={14} strokeWidth={1.5} className="shrink-0" />
                          <span className="text-xs font-medium text-slate-500 truncate tracking-tight">{agence.telephone}</span>
                        </div>
                      </div>
                    </div>
                    <div onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={(e) => handleToggleStatus(e, agence.id, agence.actif)}
                        disabled={updatingStatus[agence.id]}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-all duration-200 ease-in-out focus:outline-none ${agence.actif ? 'bg-emerald-500' : 'bg-slate-200'} ${updatingStatus[agence.id] ? 'opacity-50' : ''}`}
                      >
                        <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${agence.actif ? 'translate-x-5' : 'translate-x-0'} ${updatingStatus[agence.id] ? 'animate-pulse scale-75' : ''}`} />
                      </button>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-end gap-1 text-xs font-semibold text-slate-400 uppercase">
                    <span>Détails & Tarifs</span>
                    <ChevronRight size={10} strokeWidth={3} />
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AgencePartenaire;
