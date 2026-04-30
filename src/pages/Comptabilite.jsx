import React, { useState, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAccountingData, setAccountingFilters } from '../redux/slices/parcelSlice';
import {
  DollarSign,
  TrendingUp,
  CreditCard,
  Calendar,
  Search,
  RefreshCw,
  Loader2,
  ChevronDown,
  ArrowRight,
  Filter,
  Package,
  ArrowUpRight,
  Briefcase,
  PieChart,
  History,
  Eye,
  CheckCircle2,
  Clock,
  ArrowLeft,
  ChevronRight,
  MapPin,
  Smartphone,
  Box,
  AlertCircle,
  Wallet,
  FileDown,
  Building2
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import Modal from '../components/common/Modal';
import ExpeditionDetailModal from '../components/expedition/ExpeditionDetailModal';
import StatCard from '../components/agence/StatCard';
import { getExpeditionStatusLabel, getStatusStyles } from '../utils/statusTranslations';
import { createPDFHeader, createPDFFooter, createSummaryCards, formatPDFNumber, cleanPDFText } from '../utils/pdfHelper';

const Comptabilite = () => {
  const dispatch = useDispatch();
  const { items, summary, filters, hasLoaded, isLoading, lastUpdated } = useSelector(state => state.parcels.accounting);
  const { pays: paysBackoffice } = useSelector(state => state.backoffice);
  const [dateDebut, setDateDebut] = useState(filters.date_debut);
  const [dateFin, setDateFin] = useState(filters.date_fin);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedExpedition, setSelectedExpedition] = useState(null);

  // Plus besoin de modal pour les dates - utilisation de champs directs
  const [filterMode, setFilterMode] = useState(filters.mode); // null, 'depart', 'reception'

  useEffect(() => {
    if (!hasLoaded) {
      handleLoadData();
    }
  }, [hasLoaded]);

  const handleLoadData = async () => {
    setIsRefreshing(true);
    dispatch(setAccountingFilters({ date_debut: dateDebut, date_fin: dateFin }));
    await dispatch(fetchAccountingData({ date_debut: dateDebut, date_fin: dateFin }));
    setIsRefreshing(false);
  };

  const updateMode = (newMode) => {
    setFilterMode(newMode);
    // On ne recharge pas l'API puisque le filtre est désormais local
  };

  const filteredItems = useMemo(() => {
    let result = items;
    const country = paysBackoffice;

    if (filterMode === 'depart') {
      result = result.filter(exp => exp.pays_depart === country);
    } else if (filterMode === 'reception') {
      result = result.filter(exp => exp.pays_destination === country);
    }

    if (!searchTerm) return result;
    const s = searchTerm.toLowerCase();
    return result.filter(exp =>
      exp.reference?.toLowerCase().includes(s) ||
      exp.code_suivi_expedition?.toLowerCase().includes(s) ||
      exp.pays_destination?.toLowerCase().includes(s) ||
      exp.agence?.nom_agence?.toLowerCase().includes(s)
    );
  }, [items, searchTerm, filterMode]);

  const totals = useMemo(() => {
    // Si aucun mode de filtrage local n'est actif, on utilise le summary global de l'API
    if (!filterMode && summary) {
      const result = {
        today: 0,
        todayBackoffice: 0,
        total: summary.potential?.total_client_due || 0,
        backoffice: summary.potential?.total_backoffice || 0,
        agence_depart: summary.potential?.total_agence_depart || 0,
        agence_arrivee: summary.potential?.total_agence_arrivee || 0,
        livreur_depart: summary.potential?.total_livreur_depart || 0,
        livreur_arrivee: summary.potential?.total_livreur_arrivee || 0,
        realTotal: summary.real?.total_cash_received || 0,
        realCount: summary.real?.count_transactions || 0,
        tourshop: 0
      };

      const todayStr = format(new Date(), 'yyyy-MM-dd');
      items.forEach(exp => {
        const dateSource = exp.date_expedition_depart || exp.created_at;
        if (dateSource && format(new Date(dateSource), 'yyyy-MM-dd') === todayStr) {
          result.today += (exp.accounting_details?.total_client_due || 0);
          result.todayBackoffice += (exp.accounting_details?.backoffice_depart || 0) + (exp.accounting_details?.backoffice_arrivee || 0);
        }
      });

      return result;
    }

    // Si on a un filtre local (Depart/Reception), on doit recalculer les totaux à partir de la liste filtrée
    const result = {
      today: 0,
      todayBackoffice: 0,
      total: 0,
      backoffice: 0,
      agence_depart: 0,
      agence_arrivee: 0,
      livreur_depart: 0,
      livreur_arrivee: 0,
      realTotal: 0, 
      realCount: 0,
      tourshop: 0
    };

    const todayStr = format(new Date(), 'yyyy-MM-dd');
    filteredItems.forEach(exp => {
      const dateSource = exp.date_expedition_depart || exp.created_at;
      const acct = exp.accounting_details || {};

      result.total += (acct.total_client_due || 0);
      
      // Logique de filtrage selon les règles métier
      if (filterMode === 'reception') {
        // Pour le filtre arrivés :
        // - Backoffice d'arrivé : ne gagne RIEN sauf frais de retard
        // - Agence d'arrivée : gagne sur les frais de livraison à domicile
        // - Livreur d'arrivé : gagne sur les frais de livraison à domicile
        result.backoffice += (acct.frais_retard || 0); // Le backoffice d'arrivé gagne uniquement sur les frais de retard
        result.agence_arrivee += (acct.agence_arrivee || 0); // Frais de livraison
        result.livreur_arrivee += (acct.livreur_arrivee || 0); // Frais de livraison
      } else if (filterMode === 'departure') {
        // Pour le filtre départs :
        // - Backoffice de départ : gagne sur frais d'emballage + montant d'expédition + frais annexes
        // - Agence de départ : gagne sur frais d'enlèvement + frais d'emballage + montant d'expédition
        // - Livreur de départ : gagne sur frais d'enlèvement
        result.backoffice += (acct.backoffice_depart || 0);
        result.agence_depart += (acct.agence_depart || 0);
        result.livreur_depart += (acct.livreur_depart || 0);
      } else {
        // Sans filtre ou autre, on compte tout
        result.backoffice += (acct.backoffice_depart || 0) + (acct.backoffice_arrivee || 0);
        result.agence_depart += (acct.agence_depart || 0);
        result.agence_arrivee += (acct.agence_arrivee || 0);
        result.livreur_depart += (acct.livreur_depart || 0);
        result.livreur_arrivee += (acct.livreur_arrivee || 0);
      }

      if (dateSource && format(new Date(dateSource), 'yyyy-MM-dd') === todayStr) {
        result.today += (acct.total_client_due || 0);
        if (filterMode === 'reception') {
          result.todayBackoffice += (acct.frais_retard || 0); // Le backoffice d'arrivé gagne uniquement sur les frais de retard aujourd'hui
        } else if (filterMode === 'departure') {
          result.todayBackoffice += (acct.backoffice_depart || 0);
        } else {
          result.todayBackoffice += (acct.backoffice_depart || 0) + (acct.backoffice_arrivee || 0);
        }
      }
    });

    return result;
  }, [items, summary, filteredItems, filterMode]);

  const dailyBreakdown = useMemo(() => {
    const groups = {};
    items.forEach(exp => {
      const dateSource = exp.date_expedition_depart || exp.created_at;
      if (!dateSource) return;

      const dateObj = new Date(dateSource);
      if (isNaN(dateObj.getTime())) return;

      const date = format(dateObj, 'yyyy-MM-dd');
      if (!groups[date]) groups[date] = 0;
      groups[date] += (exp.accounting_details?.backoffice_depart || 0) + (exp.accounting_details?.backoffice_arrivee || 0);
    });
    return groups;
  }, [items]);

  // Plus besoin de fonctions pour le modal - les dates sont gérées directement

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    const modeLabel = filterMode === 'depart' ? 'DEPARTS' : filterMode === 'reception' ? 'ARRIVEES' : 'TOUTES AGENCES';
    const period = `du ${format(new Date(dateDebut), 'dd/MM/yyyy')} au ${format(new Date(dateFin), 'dd/MM/yyyy')}`;

    // En-tête uniformisé
    createPDFHeader(doc, {
      title: "RAPPORT COMPTABILITE",
      subtitle: modeLabel,
      period: period,
      country: paysBackoffice || 'N/A',
      metadata1: `VOLUME: ${filteredItems.length} EXPEDITIONS`
    });

    // Cartes de synthèse inspirées du design Historique
    createSummaryCards(doc, [
      { title: "CA ATTENDU (DÛ)", value: `${formatPDFNumber(totals.total)} CFA`, colorClass: "text-slate-900" },
      { title: "PART BACKOFFICE", value: `${formatPDFNumber(totals.backoffice)} CFA`, colorClass: "text-emerald-600" },
      { title: "PART AGENCES", value: `${formatPDFNumber(totals.agence_depart + totals.agence_arrivee)} CFA`, colorClass: "text-orange-600" },
      { title: "VOL. EXPEDITIONS", value: filteredItems.length.toString(), colorClass: "text-purple-600" }
    ]);

    // Table (Parfaite symétrie avec le tableau de l'application)
    const tableColumn = [
        "Expédition", 
        "Date / Agence", 
        "À Percevoir", 
        "Part Backoffice", 
        "Part Agence", 
        "État Règlements"
    ];

    const tableRows = filteredItems.map(item => {
        const acc = item.accounting_details || { backoffice_depart: 0, backoffice_arrivee: 0, agence_depart: 0, agence_arrivee: 0, total_client_due: 0 };
        const statusExp = item.statut_paiement_expedition === 'paye' ? '[PAYE] Expedition' : '[NON PAYE] Expedition';
        const statusFrais = item.statut_paiement_frais === 'paye' ? '[PAYE] Frais' : '[NON PAYE] Frais';
        
        return [
            `${item.reference}\n${cleanPDFText(getExpeditionStatusLabel(item.statut_expedition))}`,
            `${format(new Date(item.date_expedition_depart || item.created_at), 'dd/MM/yyyy')}\n${item.agence?.nom_agence || 'N/A'}`,
            `${formatPDFNumber(acc.total_client_due)}`,
            `${formatPDFNumber((acc.backoffice_depart || 0) + (acc.backoffice_arrivee || 0))}`,
            `${formatPDFNumber((acc.agence_depart || 0) + (acc.agence_arrivee || 0))}`,
            `${statusExp}\n${statusFrais}`
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
          2: { halign: 'right' },
          3: { halign: 'right', fontStyle: 'bold' },
          4: { halign: 'right' },
          5: { halign: 'center', fontSize: 6 }
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

    doc.save(`Rapport_Comptabilite_${modeLabel}_${dateDebut}.pdf`);
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
                Gestion Comptable
              </h1>
              <p className="text-xs md:text-sm text-slate-500 mt-0.5 font-medium">
                Suivi des revenus, commissions et répartition des gains
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex bg-white rounded-lg border border-slate-200 p-1 shadow-sm shrink-0">
                <div className="flex items-center px-3 gap-2">
                  {/* Date de début - champ direct */}
                  <input
                    type="date"
                    value={dateDebut}
                    onChange={(e) => setDateDebut(e.target.value)}
                    className="text-xs font-bold text-slate-700 bg-transparent border-none focus:outline-none cursor-pointer"
                  />
                  <ArrowRight size={14} className="text-slate-300" />
                  {/* Date de fin - champ direct */}
                  <input
                    type="date"
                    value={dateFin}
                    onChange={(e) => setDateFin(e.target.value)}
                    className="text-xs font-bold text-slate-700 bg-transparent border-none focus:outline-none cursor-pointer"
                  />
                </div>
                <button
                  onClick={handleLoadData}
                  disabled={isLoading || isRefreshing}
                  className="p-2 bg-white text-slate-600 border-l border-slate-200 hover:bg-slate-50 transition-all active:scale-95 disabled:opacity-50"
                >
                  {isLoading || isRefreshing ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
                </button>
              </div>

              <button
                onClick={handleDownloadPDF}
                disabled={filteredItems.length === 0}
                className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-slate-800 transition-all active:scale-95 shadow-md shadow-slate-900/10 disabled:opacity-50"
              >
                <FileDown size={14} />
                Exporter PDF
              </button>
            </div>
          </div>
        </header>

        {/* SEARCH & FILTERS ROW */}
        <div className="flex flex-col md:flex-row gap-3 items-stretch">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Rechercher par référence, agence ou pays..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 text-sm font-medium transition-all shadow-sm"
            />
          </div>

          <div className="flex items-center gap-2 bg-white p-1 rounded-lg border border-slate-200 shadow-sm shrink-0">
            <button
              onClick={() => updateMode(null)}
              className={`flex-1 md:flex-none px-4 py-2 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all ${filterMode === null ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400 hover:text-slate-900'}`}
            >
              Tout
            </button>
            <button
              onClick={() => updateMode('depart')}
              className={`flex-1 md:flex-none px-4 py-2 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all ${filterMode === 'depart' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400 hover:text-slate-900'}`}
            >
              Départs
            </button>
            <button
              onClick={() => updateMode('reception')}
              className={`flex-1 md:flex-none px-4 py-2 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all ${filterMode === 'reception' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400 hover:text-slate-900'}`}
            >
              Arrivées
            </button>
          </div>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          label="CA Attendu"
          value={totals.total}
          icon={Wallet}
          unit="CFA"
          colorClass="text-slate-900"
        />

        <StatCard 
          label="Part Backoffice"
          value={totals.backoffice}
          icon={DollarSign}
          unit="CFA"
          colorClass="text-emerald-600"
        />

        <StatCard 
          label="Part Agences"
          value={totals.agence_depart + totals.agence_arrivee}
          icon={Building2}
          unit="CFA"
          colorClass="text-orange-600"
        />

        <StatCard 
          label="Expéditions"
          value={filteredItems.length}
          icon={Package}
          unit=""
          colorClass="text-purple-600"
        />
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden text-black transition-all">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                <th className="px-6 py-4">Expédition</th>
                <th className="px-6 py-4 whitespace-nowrap">Date / Agence</th>
                <th className="px-6 py-4 text-right">À Percevoir</th>
                <th className="px-6 py-4 text-right bg-slate-100/30 text-slate-900">Part Backoffice</th>
                <th className="px-6 py-4 text-right">Part Agence</th>
                <th className="px-6 py-4 text-center">État Règlements</th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {isLoading && items.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <Loader2 size={40} className="animate-spin text-slate-300" />
                      <p className="text-sm font-bold text-slate-300 uppercase tracking-widest">Calcul des bilans...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-20 text-center">
                    <div className="flex flex-col items-center gap-3 opacity-30">
                      <History size={48} />
                      <p className="text-sm font-bold uppercase tracking-widest">Aucune donnée trouvée</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredItems.map((exp, index) => {
                  const acc = exp.accounting_details || { backoffice_depart: 0, backoffice_arrivee: 0, agence_depart: 0, agence_arrivee: 0, total_client_due: 0, frais_retard: 0 };
                  const clientTotal = acc.total_client_due;
                  
                  // Calcul du backoffice selon le filtre
                  let boNet;
                  if (filterMode === 'reception') {
                    // Pour les arrivés, le backoffice d'arrivé perçoit uniquement les frais de retard
                    boNet = acc.frais_retard || 0;
                  } else if (filterMode === 'departure') {
                    // Pour les départs, le backoffice de départ perçoit sa part
                    boNet = acc.backoffice_depart || 0;
                  } else {
                    // Sans filtre, on affiche la somme des deux backoffices
                    boNet = (acc.backoffice_depart || 0) + (acc.backoffice_arrivee || 0);
                  }
                  
                  // Calcul de la part agence selon le filtre
                  let agencyPart;
                  if (filterMode === 'reception') {
                    agencyPart = acc.agence_arrivee || 0;
                  } else if (filterMode === 'departure') {
                    agencyPart = acc.agence_depart || 0;
                  } else {
                    agencyPart = (acc.agence_depart || 0) + (acc.agence_arrivee || 0);
                  }

                  return (
                    <tr key={exp.id} className={`transition-colors group ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'} hover:bg-slate-100`}>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-900 text-sm group-hover:text-slate-950 transition-colors">{exp.reference}</span>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium mt-1 w-fit ${getStatusStyles(exp.statut_expedition)}`}>
                            {getExpeditionStatusLabel(exp.statut_expedition)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-slate-700">
                            {exp.created_at
                              ? format(new Date(exp.created_at), 'dd MMM yyyy', { locale: fr })
                              : 'Date inconnue'
                            }
                          </span>
                          <span className="text-[10px] font-bold text-slate-400 uppercase truncate max-w-[200px] flex items-center gap-1.5 mt-0.5">
                            <Building2 size={10} className="text-slate-300" />
                            {exp.agence?.nom_agence || 'N/A'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="font-bold text-slate-900 text-sm">{clientTotal.toLocaleString()}</span>
                      </td>
                      <td className="px-6 py-4 text-right bg-slate-50/50 group-hover:bg-slate-100/50 transition-colors">
                        <span className="font-bold text-slate-900 text-sm">{boNet.toLocaleString()}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="font-bold text-blue-600 text-sm">{agencyPart.toLocaleString()}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex flex-col gap-1.5 items-center">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold ${exp.statut_paiement_expedition === 'paye' ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-red-100 text-red-700 border border-red-200'}`}>
                            {exp.statut_paiement_expedition === 'paye' ? 'Expédition réglée' : 'Expédition non réglée'}
                          </span>
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold ${exp.statut_paiement_frais === 'paye' ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-red-100 text-red-700 border border-red-200'}`}>
                            {exp.statut_paiement_frais === 'paye' ? 'Frais réglés' : 'Frais non réglés'}
                          </span>
                        </div>
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
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination/Summary line */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            <span>{filteredItems.length} EXPÉDITIONS</span>
            <span className="h-4 w-px bg-slate-200"></span>
            <span>Dernière mise à jour: {lastUpdated ? format(new Date(lastUpdated), 'HH:mm:ss') : 'N/A'}</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Grand Total (Net BO)</span>
              <span className="text-lg font-bold text-slate-900">{(totals.backoffice || 0).toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Détails Expédition */}
      <ExpeditionDetailModal
        isOpen={!!selectedExpedition}
        onClose={() => setSelectedExpedition(null)}
        selectedExpedition={selectedExpedition}
      />
    </div>
  );
};

export default Comptabilite;
