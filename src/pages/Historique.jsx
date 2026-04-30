import React, { useState, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchBackofficeExpeditions } from "../redux/slices/backofficeSlice";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Search,
  Filter,
  Calendar,
  ArrowLeft,
  RefreshCw,
  Package,
  MapPin,
  Clock,
  Building2,
  TrendingUp,
  Eye,
  Loader2,
  ChevronDown,
  FileDown
} from "lucide-react";
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { getExpeditionStatusLabel, getStatusStyles } from "../utils/statusTranslations";
import Modal from "../components/common/Modal";
import ExpeditionDetailModal from "../components/expedition/ExpeditionDetailModal";
import StatCard from "../components/agence/StatCard";

const Historique = () => {
  const dispatch = useDispatch();
  const { expeditions, isLoadingExpeditions, expeditionsError, hasLoadedExpeditions } = useSelector((state) => state.backoffice);
  
  console.log('Expeditions from Redux:', expeditions);
  console.log('isLoadingExpeditions:', isLoadingExpeditions);
  console.log('expeditionsError:', expeditionsError);
  console.log('hasLoadedExpeditions:', hasLoadedExpeditions);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [filterMode, setFilterMode] = useState("all"); // all, depart, arrivee
  const [selectedExpedition, setSelectedExpedition] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Charger les expéditions uniquement si pas déjà chargé
  useEffect(() => {
    if (!hasLoadedExpeditions && !isLoadingExpeditions) {
      loadExpeditions();
    }
  }, [hasLoadedExpeditions, isLoadingExpeditions]);

  const loadExpeditions = async () => {
    if (isRefreshing || isLoadingExpeditions) return;
    
    setIsRefreshing(true);
    try {
      const params = {};
      if (filterMode === "depart") {
        params.mode = "depart";
      } else if (filterMode === "arrivee") {
        params.mode = "arrivee";
      }
      
      const result = await dispatch(fetchBackofficeExpeditions(params)).unwrap();
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Erreur lors du chargement des expéditions:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Filtrer les expéditions selon le terme de recherche
  const filteredExpeditions = useMemo(() => {
    if (!expeditions || !Array.isArray(expeditions)) return [];
    
    return expeditions.filter((exp) => {
      const searchLower = searchTerm.toLowerCase();
      return (
        exp.reference?.toLowerCase().includes(searchLower) ||
        exp.agence?.nom_agence?.toLowerCase().includes(searchLower) ||
        exp.pays_destination?.toLowerCase().includes(searchLower) ||
        exp.expediteur?.nom_prenom?.toLowerCase().includes(searchLower)
      );
    });
  }, [expeditions, searchTerm]);

  // Calculer les totaux
  const totals = useMemo(() => {
    if (!filteredExpeditions || !Array.isArray(filteredExpeditions)) {
      return {
        totalGain: 0,
        count: 0,
        departCount: 0,
        arriveeCount: 0
      };
    }
    
    return filteredExpeditions.reduce((acc, exp) => {
      const gain = exp.backoffice_gain || 0;
      acc.totalGain += gain;
      acc.count += 1;
      
      // Compter par rôle
      if (exp.backoffice_role && Array.isArray(exp.backoffice_role)) {
        if (exp.backoffice_role.includes('depart')) acc.departCount += 1;
        if (exp.backoffice_role.includes('arrivee')) acc.arriveeCount += 1;
      }
      
      return acc;
    }, {
      totalGain: 0,
      count: 0,
      departCount: 0,
      arriveeCount: 0
    });
  }, [filteredExpeditions]);

  // Export PDF
  const exportToPDF = () => {
    const doc = new jsPDF();
    
    // En-tête
    doc.setFontSize(20);
    doc.text('Historique des Expéditions - Backoffice', 14, 15);
    doc.setFontSize(10);
    doc.text(`Filtre: ${filterMode === 'all' ? 'Toutes' : filterMode === 'depart' ? 'Départs' : 'Arrivées'} - ${filteredExpeditions.length} expéditions`, 14, 25);
    doc.text(`Gagné total: ${totals.totalGain.toLocaleString()} CFA`, 14, 32);
    
    // Tableau
    const tableData = filteredExpeditions.map(exp => [
      exp.reference,
      format(new Date(exp.date_expedition_depart || exp.created_at), 'dd/MM/yyyy'),
      exp.agence?.nom_agence || 'N/A',
      exp.destination_pays || 'N/A',
      exp.backoffice_role ? exp.backoffice_role.join(', ') : 'N/A',
      `${(exp.backoffice_gain || 0).toLocaleString()} CFA`,
      getExpeditionStatusLabel(exp.statut_expedition)
    ]);
    
    autoTable(doc, {
      head: [['Réf', 'Date', 'Agence', 'Destination', 'Rôle BO', 'Gain', 'Statut']],
      body: tableData,
      startY: 40,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [59, 130, 246] }
    });
    
    doc.save(`historique-backoffice-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
  };

  return (
    <div className="space-y-4 pb-6 md:space-y-6 md:pb-12 font-sans">

      {/* STICKY HEADER & SEARCH */}
      <div className="sticky top-[-16px] md:top-[-24px] lg:top-[-32px] z-30 bg-[#f1f5f9] -mx-4 px-4 py-3 md:-mx-8 md:px-8 space-y-4 pt-4 lg:pt-2 pb-3">
        {/* HEADER SECTION */}
        <header className="space-y-3 md:space-y-0 text-black">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
                Historique des Expéditions
              </h1>
              <p className="text-xs md:text-sm text-slate-500 mt-0.5 font-medium">
                Toutes les expéditions où votre backoffice a intervenu
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex bg-white rounded-lg border border-slate-200 p-1 shadow-sm shrink-0">
                <div className="flex items-center px-3 gap-2">
                  <button
                    onClick={() => setFilterMode("all")}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                      filterMode === "all"
                        ? "bg-slate-900 text-white"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Toutes
                  </button>
                  <button
                    onClick={() => setFilterMode("depart")}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                      filterMode === "depart"
                        ? "bg-orange-600 text-white"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Départs
                  </button>
                  <button
                    onClick={() => setFilterMode("arrivee")}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                      filterMode === "arrivee"
                        ? "bg-purple-600 text-white"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Arrivées
                  </button>
                </div>
                <button
                  onClick={() => loadExpeditions()}
                  disabled={isLoadingExpeditions || isRefreshing}
                  className="p-2 bg-white text-slate-600 border-l border-slate-200 hover:bg-slate-50 transition-all active:scale-95 disabled:opacity-50"
                >
                  {isLoadingExpeditions || isRefreshing ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
                </button>
              </div>

              <button
                onClick={exportToPDF}
                disabled={filteredExpeditions.length === 0}
                className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-slate-800 transition-all active:scale-95 shadow-md shadow-slate-900/10 disabled:opacity-50"
              >
                <FileDown size={14} />
                Exporter PDF
              </button>
            </div>
          </div>
        </header>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard 
          label="Total expéditions"
          value={totals.count}
          icon={Package}
          colorClass="text-slate-900"
        />
        
        <StatCard 
          label="Total gagné"
          value={totals.totalGain}
          unit="CFA"
          icon={TrendingUp}
          colorClass="text-emerald-600"
        />
        
        <StatCard 
          label="En départ"
          value={totals.departCount}
          icon={MapPin}
          colorClass="text-orange-600"
        />
        
        <StatCard 
          label="En arrivée"
          value={totals.arriveeCount}
          icon={MapPin}
          colorClass="text-purple-600"
        />
      </div>

        {/* Tableau des expéditions */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden text-black transition-all">
        {/* Table Header Summary */}
        <div className="px-4 py-3 md:px-6 md:py-4 border-b border-slate-100 bg-slate-50/10">
          <div className="flex flex-col md:flex-row md:items-center gap-3 md:items-center justify-between">
            <div className="flex items-center justify-between md:justify-start gap-4">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">
                {filteredExpeditions.length} expéditions trouvées
              </span>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="text"
                  placeholder="Rechercher..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-64"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Table/List Content */}
        {isLoadingExpeditions ? (
          <div className="flex flex-col items-center justify-center py-24 px-6">
            <Loader2 className="animate-spin text-slate-900 mb-4" size={40} strokeWidth={1.5} />
            <p className="text-sm text-slate-600 font-medium">Chargement des expéditions...</p>
          </div>
        ) : filteredExpeditions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 px-6">
            <Package className="text-slate-300 mb-4" size={48} strokeWidth={1.5} />
            <p className="text-sm text-slate-600 font-medium">Aucune expédition trouvée</p>
            <p className="text-xs text-slate-400 mt-2">Essayez de modifier vos filtres ou votre recherche</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Expédition
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Agence
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Destination
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Rôle BO
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Gain
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredExpeditions.map((exp, index) => (
                  <tr key={exp.id} className={`hover:bg-slate-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-900 text-sm">{exp.reference}</span>
                        <span className="text-xs text-slate-500">{exp.expediteur?.nom_prenom || 'N/A'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-700">
                        {exp.date_expedition_depart
                          ? format(new Date(exp.date_expedition_depart), 'dd MMM yyyy', { locale: fr })
                          : format(new Date(exp.created_at), 'dd MMM yyyy', { locale: fr })
                        }
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Building2 size={14} className="text-slate-400" />
                        <span className="text-sm text-slate-700">{exp.agence?.nom_agence || 'N/A'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <MapPin size={14} className="text-slate-400" />
                        <span className="text-sm text-slate-700">{exp.pays_destination || 'N/A'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-1">
                        {(exp.backoffice_role || []).map((role, i) => (
                          <span
                            key={i}
                            className={`inline-flex items-center px-2 py-1 rounded text-[10px] font-medium ${
                              role === 'depart'
                                ? 'bg-orange-100 text-orange-700'
                                : 'bg-purple-100 text-purple-700'
                            }`}
                          >
                            {role === 'depart' ? 'Départ' : 'Arrivée'}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-bold text-emerald-600 text-sm">
                        {(exp.backoffice_gain || 0).toLocaleString()} CFA
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded text-[10px] font-medium ${getStatusStyles(exp.statut_expedition)}`}>
                        {getExpeditionStatusLabel(exp.statut_expedition)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => setSelectedExpedition(exp)}
                        className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all"
                        title="Voir détails"
                      >
                        <Eye size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Footer avec dernières infos */}
      {lastUpdated && (
        <div className="text-center text-xs text-slate-500">
          Dernière mise à jour: {format(lastUpdated, 'HH:mm:ss')}
        </div>
      )}

      {/* Modal détails */}
      <ExpeditionDetailModal
        isOpen={!!selectedExpedition}
        onClose={() => setSelectedExpedition(null)}
        selectedExpedition={selectedExpedition}
      />
    </div>
  );
};

export default Historique;
