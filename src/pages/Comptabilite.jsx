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
  Info,
  Eye,
  CheckCircle2,
  Clock,
  ArrowLeft,
  ChevronRight,
  MapPin,
  Smartphone,
  Box,
  AlertCircle,
  Truck,
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
        agences: summary.potential?.total_agence || 0,
        livreurs: summary.potential?.total_livreur || 0,
        realTotal: summary.real?.total_cash_received || 0,
        realCount: summary.real?.count_transactions || 0,
        tourshop: 0
      };

      const todayStr = format(new Date(), 'yyyy-MM-dd');
      items.forEach(exp => {
        const dateSource = exp.date_expedition_depart || exp.created_at;
        if (dateSource && format(new Date(dateSource), 'yyyy-MM-dd') === todayStr) {
          result.today += (exp.accounting_details?.total_client_due || 0);
          result.todayBackoffice += (exp.accounting_details?.backoffice || 0);
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
      agences: 0,
      livreurs: 0,
      realTotal: 0, // Ne peut pas être recalculé localement de façon fiable sans toutes les transactions
      realCount: 0,
      tourshop: 0
    };

    const todayStr = format(new Date(), 'yyyy-MM-dd');
    filteredItems.forEach(exp => {
      const dateSource = exp.date_expedition_depart || exp.created_at;
      const acct = exp.accounting_details || {};

      result.total += (acct.total_client_due || 0);
      result.backoffice += (acct.backoffice || 0);
      result.agences += (acct.agence || 0);
      result.livreurs += (acct.livreur || 0);

      if (dateSource && format(new Date(dateSource), 'yyyy-MM-dd') === todayStr) {
        result.today += (acct.total_client_due || 0);
        result.todayBackoffice += (acct.backoffice || 0);
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
      groups[date] += (exp.accounting_details?.backoffice || 0);
    });
    return groups;
  }, [items]);

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    const modeLabel = filterMode === 'depart' ? 'DEPARTS' : filterMode === 'reception' ? 'ARRIVEES' : 'TOUTES AGENCES';
    const period = `du ${format(new Date(dateDebut), 'dd/MM/yyyy')} au ${format(new Date(dateFin), 'dd/MM/yyyy')}`;

    // Helper pour formater les nombres sans caractères spéciaux (éviter les symboles bizarres dans le PDF)
    const fmt = (v) => String(v || 0).replace(/\B(?=(\d{3})+(?!\d))/g, " ");

    // DESIGN PREMIUM : Bandeau de tête
    doc.setFillColor(15, 23, 42); // slate-900 
    doc.rect(0, 0, 210, 45, 'F'); 
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text("RAPPORT COMPTABILITE", 14, 25);
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(148, 163, 184); // slate-400
    doc.text(modeLabel.toUpperCase(), 14, 32);
    
    // Bloc de métadonnées en haut à droite
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.text(`PERIODE : ${period.toUpperCase()}`, 140, 18);
    doc.text(`PAYS : ${paysBackoffice?.toUpperCase() || 'N/A'}`, 140, 24);
    doc.text(`EDITE LE : ${format(new Date(), 'dd/MM/yyyy')}`, 140, 30);

    // CARTES DE SYNTHESE (Summary Cards)
    const cardsY = 55;
    const cardW = 43;
    const cardH = 20;
    const spacing = 3.5;

    const drawCard = (x, title, value, isDark = false) => {
        if (isDark) doc.setFillColor(30, 41, 59);
        else doc.setFillColor(248, 250, 252);
        
        doc.roundedRect(x, cardsY, cardW, cardH, 1, 1, 'F');
        doc.setFontSize(6);
        doc.setFont("helvetica", "bold");
        if (isDark) doc.setTextColor(148, 163, 184);
        else doc.setTextColor(100, 116, 139);
        
        doc.text(title, x + 4, cardsY + 6);
        
        doc.setFontSize(10);
        if (isDark) doc.setTextColor(255, 255, 255);
        else doc.setTextColor(15, 23, 42);
        
        doc.text(`${fmt(value)} CFA`, x + 4, cardsY + 14);
    };

    drawCard(14, "CA ATTENDU (DÛ)", totals.total);
    drawCard(14 + (cardW + spacing), "PART BACKOFFICE", totals.backoffice, true);
    drawCard(14 + (cardW + spacing) * 2, "PART AGENCES", totals.agences);
    drawCard(14 + (cardW + spacing) * 3, "PART LIVREURS", totals.livreurs);

    // Table (Parfaite symétrie avec le tableau de l'application)
    const tableColumn = [
        "Expédition", 
        "Date / Agence", 
        "À Percevoir", 
        "Part Backoffice", 
        "Part Agence", 
        "Part Livreurs", 
        "État Règlements"
    ];
    
    const tableRows = filteredItems.map(item => {
        const acc = item.accounting_details || { backoffice: 0, agence: 0, total_client_due: 0, livreur: 0 };
        const statusExp = item.statut_paiement_expedition === 'paye' ? 'Exp: RÉGLÉ' : 'Exp: NON RÉGLÉ';
        const statusFrais = item.statut_paiement_frais === 'paye' ? 'Frais: RÉGLÉ' : 'Frais: NON RÉGLÉ';
        
        return [
            `${item.reference}\n${item.statut_expedition}`,
            `${format(new Date(item.date_expedition_depart || item.created_at), 'dd/MM/yyyy')}\n${item.agence?.nom_agence || 'N/A'}`,
            `${fmt(acc.total_client_due)}`,
            `${fmt(acc.backoffice)}`,
            `${fmt(acc.agence)}`,
            `${fmt(acc.livreur)}`,
            `${statusExp}\n${statusFrais}`
        ];
    });

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 80,
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
          5: { halign: 'right' },
          6: { halign: 'center', fontSize: 6 }
      },
      alternateRowStyles: { fillColor: [249, 250, 251] },
      margin: { top: 80, left: 14, right: 14 },
      styles: { cellPadding: 2 }
    });

    doc.save(`Rapport_Comptabilite_${modeLabel}_${dateDebut}.pdf`);
  };

  return (
    <div className="space-y-6 pb-12 font-sans overflow-x-hidden">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            Gestion Comptable
          </h1>
          <p className="text-sm text-slate-500 font-medium mt-1">
            Suivi des revenus, commissions et répartition des gains
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-white rounded-lg border border-slate-200 p-1 shadow-sm shrink-0">
            <div className="flex items-center px-3 gap-2">
              <Calendar size={16} className="text-slate-400" />
              <input
                type="date"
                value={dateDebut}
                onChange={(e) => setDateDebut(e.target.value)}
                className="text-xs font-bold text-slate-700 outline-none border-none bg-transparent"
              />
              <ArrowRight size={14} className="text-slate-300" />
              <input
                type="date"
                value={dateFin}
                onChange={(e) => setDateFin(e.target.value)}
                className="text-xs font-bold text-slate-700 outline-none border-none bg-transparent"
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
            PDF
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard 
          label="Potentiel (Attendu)"
          value={totals.total}
          icon={Wallet}
          colorClass="text-slate-500"
          subtitle="CA Théorique facturé"
        />

        <StatCard 
          label="CA Réel Encaissé"
          value={totals.realTotal}
          icon={TrendingUp}
          colorClass="text-emerald-600"
          subtitle={`${totals.realCount} paiements validés`}
        />

        <StatCard 
          label="Part Backoffice"
          value={totals.backoffice}
          icon={Briefcase}
          variant="dark"
          subtitle="Marges hub central"
        />

        <StatCard 
          label="Part Agences"
          value={totals.agences}
          icon={Building2}
          colorClass="text-blue-600"
          subtitle="Commissions agences"
        />

        <StatCard 
          label="Part Livreurs"
          value={totals.livreurs}
          icon={Truck}
          colorClass="text-slate-400"
          subtitle="Commissions logistique"
        />
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col lg:flex-row gap-4">
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

      {/* Main Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                <th className="px-6 py-4">Expédition</th>
                <th className="px-6 py-4 whitespace-nowrap">Date / Agence</th>
                <th className="px-6 py-4 text-right">À Percevoir</th>
                <th className="px-6 py-4 text-right bg-slate-100/30 text-slate-900">Part Backoffice</th>
                <th className="px-6 py-4 text-right">Part Agence</th>
                <th className="px-6 py-4 text-right">Part Livreurs</th>
                <th className="px-6 py-4 text-center">État Règlements</th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
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
                filteredItems.map((exp) => {
                  const acc = exp.accounting_details || { backoffice: 0, agence: 0, livreur: 0, total_client_due: 0 };
                  const clientTotal = acc.total_client_due;
                  const boNet = acc.backoffice;
                  const agencyPart = acc.agence;
                  const livreurPart = acc.livreur;

                  return (
                    <tr key={exp.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-900 text-sm group-hover:text-slate-950 transition-colors">{exp.reference}</span>
                          <span className="text-xs font-bold text-slate-400  tracking-tighter">{exp.statut_expedition || 'PENDING'}</span>
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
                      <td className="px-6 py-4 text-right">
                        <div className="flex flex-col items-end">
                          <span className="font-bold text-slate-600 text-sm">{livreurPart.toLocaleString()}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex flex-col gap-1.5 items-center">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wider ${exp.statut_paiement_expedition === 'paye' ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' : 'bg-rose-50 text-rose-600 border border-rose-100'}`}>
                            Expédition: {exp.statut_paiement_expedition === 'paye' ? 'RÉGLÉ' : 'NON RÉGLÉ'}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wider ${exp.statut_paiement_frais === 'paye' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-amber-50 text-amber-600 border border-amber-100'}`}>
                            Frais Annexes: {exp.statut_paiement_frais === 'paye' ? 'RÉGLÉ' : 'NON RÉGLÉ'}
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
              <span className="text-lg font-bold text-slate-900">{(totals.backoffice || 0).toLocaleString()} <span className="text-xs">CFA</span></span>
            </div>
          </div>
        </div>
      </div>

      {/* Commission Structure Info */}
      <div className="bg-blue-50/50 rounded-xl border border-blue-100 p-6 flex flex-col md:flex-row gap-6 items-start">
        <div className="p-3 bg-blue-100 rounded-xl text-blue-600">
          <Info size={24} />
        </div>
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div>
            <h4 className="text-xs font-bold text-blue-900 uppercase tracking-widest mb-2">Enlèvement</h4>
            <p className="text-xs text-blue-800/70 font-medium">Livreur: <span className="font-bold text-blue-900">85%</span></p>
            <p className="text-xs text-blue-800/70 font-medium">Agence: <span className="font-bold text-blue-900">15%</span></p>
          </div>
          <div>
            <h4 className="text-xs font-bold text-blue-900 uppercase tracking-widest mb-2">Livraison</h4>
            <p className="text-xs text-blue-800/70 font-medium">Livreur: <span className="font-bold text-blue-900">90%</span></p>
            <p className="text-xs text-blue-800/70 font-medium">Agence: <span className="font-bold text-blue-900">10%</span></p>
          </div>
          <div>
            <h4 className="text-xs font-bold text-blue-900 uppercase tracking-widest mb-2">Emballage</h4>
            <p className="text-xs text-blue-800/70 font-medium">BO: <span className="font-bold text-blue-900">85%</span></p>
            <p className="text-xs text-blue-800/70 font-medium">Agence: <span className="font-bold text-blue-900">15%</span></p>
          </div>
          <div>
            <h4 className="text-xs font-bold text-blue-900 uppercase tracking-widest mb-2">Retard</h4>
            <p className="text-xs text-blue-800/70 font-medium">BO: <span className="font-bold text-blue-900">60%</span></p>
            <p className="text-xs text-blue-800/70 font-medium">Agence: <span className="font-bold text-blue-900">40%</span></p>
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
