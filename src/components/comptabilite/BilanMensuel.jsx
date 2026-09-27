import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchBilanMensuel } from '../../redux/slices/parcelSlice';
import { getCurrencyLabel } from '../../utils/format';
import { createPDFHeader, createPDFFooter, createSummaryCards, formatPDFNumber } from '../../utils/pdfHelper';
import StatCard from '../agence/StatCard';
import {
  Wallet,
  DollarSign,
  Building2,
  Truck,
  Package,
  Loader2,
  RefreshCw,
  FileDown,
  ShoppingBag,
  TrendingUp,
} from 'lucide-react';

const MOIS = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
const ANNEE_COURANTE = new Date().getFullYear();
const ANNEES = [ANNEE_COURANTE - 1, ANNEE_COURANTE, ANNEE_COURANTE + 1];

/**
 * Bilan mensuel du backoffice : bénéfice réel = part backoffice déjà
 * calculée sur les expéditions + abonnements marketplace validés dans le
 * mois (le backoffice ne prélève aucune commission sur les ventes
 * marketplace elles-mêmes - voir BackofficeBilanController côté backend).
 */
const BilanMensuel = () => {
  const dispatch = useDispatch();
  const { data, filters, isLoading, loadedFor } = useSelector((state) => state.parcels.bilan);

  const month = filters.month;
  const year = filters.year;

  useEffect(() => {
    if (!loadedFor || loadedFor.month !== month || loadedFor.year !== year) {
      dispatch(fetchBilanMensuel({ month, year }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const changePeriode = (nextMonth, nextYear) => {
    dispatch(fetchBilanMensuel({ month: nextMonth, year: nextYear }));
  };

  const refresh = () => dispatch(fetchBilanMensuel({ month, year }));

  const expeditions = data?.expeditions || { count: 0, chiffre_affaires_client: 0, part_agences_depart: 0, part_agences_arrivee: 0, part_livreurs_depart: 0, part_livreurs_arrivee: 0, benefice_backoffice: 0 };
  const abonnement = data?.marketplace_abonnement || { count_paiements_valides: 0, benefice_backoffice: 0 };
  const beneficeTotal = data?.benefice_total || 0;

  const handleDownloadPDF = async () => {
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF();
    const periodeLabel = `${MOIS[month - 1]} ${year}`;

    createPDFHeader(doc, {
      title: 'BILAN COMPTABLE MENSUEL',
      subtitle: periodeLabel,
      period: periodeLabel,
      metadata1: `${expeditions.count} EXPEDITIONS`,
    });

    createSummaryCards(doc, [
      { title: 'CA CLIENT (EXPEDITIONS)', value: `${formatPDFNumber(expeditions.chiffre_affaires_client)} ${getCurrencyLabel()}`, colorClass: 'text-slate-900' },
      { title: 'BENEFICE EXPEDITIONS', value: `${formatPDFNumber(expeditions.benefice_backoffice)} ${getCurrencyLabel()}`, colorClass: 'text-emerald-600' },
      { title: 'BENEFICE ABONNEMENT', value: `${formatPDFNumber(abonnement.benefice_backoffice)} ${getCurrencyLabel()}`, colorClass: 'text-orange-600' },
      { title: 'BENEFICE TOTAL', value: `${formatPDFNumber(beneficeTotal)} ${getCurrencyLabel()}`, colorClass: 'text-purple-600' },
    ]);

    createPDFFooter(doc, { company: 'Tour Shop', pageNumber: '1', totalPages: '1' });

    doc.save(`Bilan_${MOIS[month - 1]}_${year}.pdf`);
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <select
            value={month}
            onChange={(e) => changePeriode(Number(e.target.value), year)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 focus:outline-none focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900"
          >
            {MOIS.map((nom, i) => (
              <option key={i + 1} value={i + 1}>{nom}</option>
            ))}
          </select>
          <select
            value={year}
            onChange={(e) => changePeriode(month, Number(e.target.value))}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 focus:outline-none focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900"
          >
            {ANNEES.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <button
            onClick={refresh}
            disabled={isLoading}
            className="p-2.5 bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-all active:scale-95 disabled:opacity-50"
            title="Actualiser"
          >
            {isLoading ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
          </button>
        </div>

        <button
          onClick={handleDownloadPDF}
          disabled={isLoading || !data}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-slate-800 transition-all active:scale-95 shadow-md shadow-slate-900/10 disabled:opacity-50"
        >
          <FileDown size={14} />
          Exporter PDF
        </button>
      </div>

      {isLoading && !data ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm py-24 flex flex-col items-center justify-center gap-3">
          <Loader2 size={40} className="animate-spin text-slate-300" />
          <p className="text-sm font-bold text-slate-300 uppercase tracking-widest">Calcul du bilan...</p>
        </div>
      ) : (
        <>
          <div className="rounded-2xl bg-gradient-to-br from-slate-900 to-slate-700 p-6 shadow-lg shadow-slate-900/10 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-300 uppercase tracking-widest mb-1">Bénéfice total du mois</p>
              <p className="text-3xl md:text-4xl font-black text-white tracking-tight">
                {beneficeTotal.toLocaleString()} <span className="text-lg font-bold text-slate-300">{getCurrencyLabel()}</span>
              </p>
              <p className="text-xs text-slate-400 mt-1.5">{MOIS[month - 1]} {year} · Expéditions + Abonnement marketplace</p>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur flex items-center justify-center ring-1 ring-white/10 shrink-0">
              <TrendingUp className="text-white" size={26} />
            </div>
          </div>

          <div>
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Expéditions</h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
              <StatCard label="CA Client" value={expeditions.chiffre_affaires_client} icon={Wallet} unit={getCurrencyLabel()} colorClass="text-slate-900" />
              <StatCard label="Bénéfice Backoffice" value={expeditions.benefice_backoffice} icon={DollarSign} unit={getCurrencyLabel()} colorClass="text-emerald-600" />
              <StatCard label="Part Agences" value={expeditions.part_agences_depart + expeditions.part_agences_arrivee} icon={Building2} unit={getCurrencyLabel()} colorClass="text-blue-600" />
              <StatCard label="Part Livreurs" value={expeditions.part_livreurs_depart + expeditions.part_livreurs_arrivee} icon={Truck} unit={getCurrencyLabel()} colorClass="text-orange-600" />
            </div>
          </div>

          <div>
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Marketplace — Abonnement</h3>
            <div className="grid grid-cols-2 gap-3 md:gap-4">
              <StatCard label="Bénéfice Abonnement" value={abonnement.benefice_backoffice} icon={ShoppingBag} unit={getCurrencyLabel()} colorClass="text-purple-600" />
              <StatCard label="Paiements Validés" value={abonnement.count_paiements_valides} icon={Package} unit="" colorClass="text-slate-900" />
            </div>
            <p className="text-xs text-slate-400 mt-2">
              Le backoffice ne perçoit aucune commission sur les ventes marketplace elles-mêmes — seul l'abonnement périodique payé par les vendeurs et livreurs constitue un revenu.
            </p>
          </div>
        </>
      )}
    </div>
  );
};

export default BilanMensuel;
