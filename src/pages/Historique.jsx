import React, { useState, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../routes';
import { fetchBackofficeExpeditions } from '../redux/slices/backofficeSlice';
import { format, subDays, isWithinInterval, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  Search,
  MapPin ,
  Filter,
  RefreshCw,
  Download,
  ChevronDown,
  ChevronRight,
  Package,
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  FileDown
} from 'lucide-react';
import Modal from '../components/common/Modal';
import ViewDetailsButton from '../components/common/ViewDetailsButton';
import ExpeditionDetailModal from '../components/expedition/ExpeditionDetailModal';
import StatCard from '../components/agence/StatCard';
import { getExpeditionStatusLabel, getStatusStyles } from '../utils/statusTranslations';
import { createPDFHeader, createPDFFooter, createSummaryCards, formatPDFNumber, cleanPDFText } from '../utils/pdfHelper';

const Historique = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
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

  // Charger toutes les expéditions au premier rendu si pas déjà fait.
  // Le filtrage Toutes/Départs/Arrivées se fait ensuite en local sur la liste déjà chargée.
  useEffect(() => {
    if (!hasLoadedExpeditions && !isLoadingExpeditions) {
      loadExpeditions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadExpeditions = async () => {
    if (isRefreshing || isLoadingExpeditions) return;
    
    setIsRefreshing(true);
    try {
      // Pas de params : on récupère tout, le filtrage se fait en local ensuite
      const result = await dispatch(fetchBackofficeExpeditions({})).unwrap();
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Erreur lors du chargement des expéditions:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Filtrer les expéditions selon le terme de recherche ET le mode (Toutes / Départs / Arrivées)
  const filteredExpeditions = useMemo(() => {
    if (!expeditions || !Array.isArray(expeditions)) return [];
    
    return expeditions.filter((exp) => {
      // Filtre par mode (toutes / depart / arrivee) basé sur backoffice_role
      if (filterMode !== "all") {
        const roles = Array.isArray(exp.backoffice_role) ? exp.backoffice_role : [];
        if (!roles.includes(filterMode)) return false;
      }

      // Filtre par recherche texte
      if (!searchTerm) return true;
      const searchLower = searchTerm.toLowerCase();
      const colisList = Array.isArray(exp.colis) ? exp.colis : [];
      return (
        exp.reference?.toLowerCase().includes(searchLower) ||
        exp.agence?.nom_agence?.toLowerCase().includes(searchLower) ||
        exp.pays_destination?.toLowerCase().includes(searchLower) ||
        exp.expediteur?.nom_prenom?.toLowerCase().includes(searchLower) ||
        colisList.some((c) => c.code_colis?.toLowerCase().includes(searchLower))
      );
    });
  }, [expeditions, searchTerm, filterMode]);

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
  const exportToPDF = async () => {
    const { jsPDF } = await import('jspdf');
    const { default: autoTable } = await import('jspdf-autotable');
    const doc = new jsPDF();
    const modeLabel = filterMode === 'depart' ? 'DEPARTS' : filterMode === 'arrivee' ? 'ARRIVEES' : 'TOUTES EXPEDITIONS';
    const period = `Filtre: ${modeLabel} - ${filteredExpeditions.length} expéditions`;

    // En-tête uniformisé
    createPDFHeader(doc, {
      title: "HISTORIQUE EXPEDITIONS",
      subtitle: modeLabel,
      period: period,
      metadata1: `GAIN TOTAL: ${formatPDFNumber(totals.totalGain)} CFA`
    });

    // Cartes de synthèse inspirées du design Historique
    createSummaryCards(doc, [
      { title: "Total Expéditions", value: filteredExpeditions.length.toString(), colorClass: "text-slate-900" },
      { title: "Gain Total", value: `${formatPDFNumber(totals.totalGain)} CFA`, colorClass: "text-emerald-600" },
      { title: "En départ", value: totals.departCount.toString(), colorClass: "text-orange-600" },
      { title: "En arrivée", value: totals.arriveeCount.toString(), colorClass: "text-purple-600" }
    ]);

    // Table (Parfaite symétrie avec le tableau de l'application)
    const tableColumn = [
        "Expédition", 
        "Date / Agence", 
        "Destination", 
        "Rôle Backoffice", 
        "Gain", 
        "Statut"
    ];

    const tableRows = filteredExpeditions.map(exp => {
        const roles = exp.backoffice_role && Array.isArray(exp.backoffice_role) 
            ? exp.backoffice_role.map(r => r === 'depart' ? 'Départ' : 'Arrivée').join(', ')
            : 'N/A';
        
        return [
            `${exp.reference}\n${cleanPDFText(getExpeditionStatusLabel(exp.statut_expedition))}`,
            `${format(new Date(exp.date_expedition_depart || exp.created_at), 'dd/MM/yyyy')}\n${cleanPDFText(exp.agence?.nom_agence || 'N/A')}`,
            cleanPDFText(exp.pays_destination || 'N/A'),
            roles,
            `${formatPDFNumber(exp.backoffice_gain || 0)} CFA`,
            cleanPDFText(getExpeditionStatusLabel(exp.statut_expedition))
        ];
    });

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 95,
      theme: 'grid',
      headStyles: { 
          fillColor: [15, 23, 42], 
          fontSize: 7, 
          fontStyle: 'bold', 
          halign: 'center' 
      },
      bodyStyles: { 
          fontSize: 6.5, 
          valign: 'middle' 
      },
      columnStyles: {
          0: { cellWidth: 35 },
          1: { cellWidth: 35 },
          2: { cellWidth: 30 },
          3: { cellWidth: 35 },
          4: { halign: 'right', fontStyle: 'bold', cellWidth: 25 },
          5: { halign: 'center', cellWidth: 25 }
      },
      alternateRowStyles: { fillColor: [249, 250, 251] },
      margin: { top: 80, left: 14, right: 14 },
      styles: { cellPadding: 2 }
    });

    // Pied de page uniformisé
    createPDFFooter(doc, {
      company: 'Tour Shop',
      pageNumber: '1',
      totalPages: '1'
    });

    doc.save(`historique-backoffice-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
  };

  return (
    <div className="space-y-4 pb-6 md:space-y-6 md:pb-12 font-sans">

      {/* STICKY HEADER & SEARCH */}
      <div className="sticky top-[-24px] md:top-[-32px] z-30 bg-[#f1f5f9] -mx-6 px-6 py-3 md:-mx-8 md:px-8 space-y-4 pt-4 lg:pt-2 pb-3">
        {/* HEADER SECTION */}
        <header className="space-y-3 md:space-y-0 text-black">
          <div className="md:flex md:items-center md:justify-between">
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
                Historique des Expéditions
              </h1>
              <p className="text-sm md:text-base text-slate-500 mt-0.5 font-medium">
                Toutes les expéditions où votre backoffice a intervenu
              </p>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-2 mt-3 md:mt-0">
              <div className="flex bg-white rounded-lg border border-slate-200 p-1 shadow-sm">
                <div className="flex items-center flex-1 px-1 sm:px-3 gap-1 sm:gap-2">
                  <button
                    onClick={() => setFilterMode("all")}
                    className={`flex-1 sm:flex-none px-2 sm:px-3 py-1.5 rounded-md text-xs font-medium transition-all whitespace-nowrap ${
                      filterMode === "all"
                        ? "bg-slate-900 text-white"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Toutes
                  </button>
                  <button
                    onClick={() => setFilterMode("depart")}
                    className={`flex-1 sm:flex-none px-2 sm:px-3 py-1.5 rounded-md text-xs font-medium transition-all whitespace-nowrap ${
                      filterMode === "depart"
                        ? "bg-orange-600 text-white"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Départs
                  </button>
                  <button
                    onClick={() => setFilterMode("arrivee")}
                    className={`flex-1 sm:flex-none px-2 sm:px-3 py-1.5 rounded-md text-xs font-medium transition-all whitespace-nowrap ${
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
                  className="p-2 bg-white text-slate-600 border-l border-slate-200 hover:bg-slate-50 transition-all active:scale-95 disabled:opacity-50 shrink-0"
                >
                  {isLoadingExpeditions || isRefreshing ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
                </button>
              </div>

              <button
                onClick={exportToPDF}
                disabled={filteredExpeditions.length === 0}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-slate-800 transition-all active:scale-95 shadow-md shadow-slate-900/10 disabled:opacity-50 shrink-0"
              >
                <FileDown size={14} />
                Exporter PDF
              </button>
            </div>
          </div>
        </header>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <StatCard 
          label="Total expéditions"
          value={totals.count}
          icon={Package}
          colorClass="text-slate-900"
          unit=""
        />
        
        <StatCard 
          label="Total gagné"
          value={totals.totalGain}
          unit="CFA"
          icon={DollarSign}
          colorClass="text-emerald-600"
        />
        
        <StatCard 
          label="En départ"
          value={totals.departCount}
          icon={MapPin}
          colorClass="text-orange-600"
          unit=""
        />
        
        <StatCard 
          label="En arrivée"
          value={totals.arriveeCount}
          icon={MapPin}
          colorClass="text-purple-600"
          unit=""
        />
      </div>

        {/* Tableau des expéditions */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden text-black transition-all">
        {/* Table Header Summary */}
        <div className="px-4 py-3 md:px-6 md:py-4 border-b border-slate-100 bg-slate-50/10">
          <div className="flex flex-col md:flex-row md:items-center gap-3 md:items-center justify-between">
            <div className="flex items-center justify-between md:justify-start gap-4">
              <span className="text-sm font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap">
                {filteredExpeditions.length} expéditions trouvées
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="text"
                  placeholder="Réf. expédition ou code colis..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-11 pr-4 py-2.5 border border-slate-200 rounded-lg text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-64"
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
            <p className="text-xs text-slate-500 mt-2">Essayez de modifier vos filtres ou votre recherche</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3.5 text-left text-sm font-bold text-slate-500 uppercase tracking-wider">
                    Expédition
                  </th>
                  <th className="px-6 py-3.5 text-left text-sm font-bold text-slate-500 uppercase tracking-wider">
                    Destination
                  </th>
                  <th className="px-6 py-3.5 text-left text-sm font-bold text-slate-500 uppercase tracking-wider">
                    Rôle
                  </th>
                  <th className="px-6 py-3.5 text-right text-sm font-bold text-slate-500 uppercase tracking-wider">
                    Gain
                  </th>
                  <th className="px-6 py-3.5 text-left text-sm font-bold text-slate-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-3.5 text-center text-sm font-bold text-slate-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredExpeditions.map((exp) => {
                  const searchLower = searchTerm.toLowerCase();
                  const colisList = Array.isArray(exp.colis) ? exp.colis : [];

                  return (
                  <React.Fragment key={exp.id}>
                  <tr className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <span className="font-bold text-slate-900 text-base">📦 {exp.reference}</span>
                        <span className="text-sm text-slate-500">
                          {exp.agence?.nom_agence || 'N/A'} · {
                            format(
                              new Date(exp.date_expedition_depart || exp.created_at),
                              'dd MMM yyyy',
                              { locale: fr }
                            )
                          }
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-base text-slate-700">
                        <MapPin size={16} className="text-slate-400 shrink-0" />
                        {exp.pays_destination || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-1.5">
                        {(exp.backoffice_role || []).map((role, i) => (
                          <span
                            key={i}
                            className={`inline-flex items-center px-2.5 py-1 rounded-md text-sm font-semibold ${
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
                    <td className="px-6 py-4 text-right">
                      <span className="font-bold text-emerald-600 text-base">
                        {(exp.backoffice_gain || 0).toLocaleString()} CFA
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-sm font-semibold ${getStatusStyles(exp.statut_expedition)}`}>
                        {getExpeditionStatusLabel(exp.statut_expedition)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <ViewDetailsButton onClick={() => setSelectedExpedition(exp)} />
                    </td>
                  </tr>
                  {colisList.map((c) => {
                    const isMatch = !!searchTerm && c.code_colis?.toLowerCase().includes(searchLower);
                    const goToColis = () =>
                      navigate(ROUTES.PARCEL_CONTROL.replace(':code', c.code_colis), { state: { from: 'history' } });
                    return (
                    <tr
                      key={c.id}
                      onClick={goToColis}
                      className={`group cursor-pointer border-l-4 transition-colors ${
                        isMatch
                          ? 'border-l-blue-500 bg-blue-100/80 hover:bg-blue-200/60'
                          : 'border-l-slate-400 bg-slate-200/70 hover:bg-slate-300/60'
                      }`}
                    >
                      <td className="pl-10 pr-6 py-2" colSpan={4}>
                        <div
                          className={`flex items-center gap-2 text-xs group-hover:underline underline-offset-2 ${
                            isMatch ? 'text-blue-700' : 'text-slate-600'
                          }`}
                        >
                          <span className={isMatch ? 'text-blue-300' : 'text-slate-400'}>↳</span>
                          <Package size={12} className="shrink-0" />
                          <span className="font-semibold">{c.code_colis}</span>
                          {c.designation && <span className="font-normal">· {c.designation}</span>}
                        </div>
                      </td>
                      <td className="px-6 py-2" colSpan={1}>
                        {c.is_blocked ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-red-100 text-red-700">
                            Bloqué
                          </span>
                        ) : c.is_received_by_backoffice ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-100 text-emerald-700">
                            Reçu backoffice
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-200 text-slate-600">
                            En attente
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-2 text-right" colSpan={1}>
                        <ChevronRight size={14} className={`inline-block ${isMatch ? 'text-blue-400' : 'text-slate-400'} group-hover:translate-x-0.5 transition-transform`} />
                      </td>
                    </tr>
                    );
                  })}
                  </React.Fragment>
                  );
                })}
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
