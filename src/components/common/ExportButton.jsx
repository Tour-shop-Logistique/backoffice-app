import React, { useState, useRef, useEffect } from 'react';
import { Download, FileSpreadsheet, FileText, ChevronDown } from 'lucide-react';
import { exportToExcel } from '../../utils/excelHelper';
import { exportTableToPDF } from '../../utils/pdfHelper';

/**
 * Bouton d'export Excel/PDF réutilisable, sur le modèle des boutons de
 * header existants (Rafraîchir/Ajouter). Ne connaît aucun slice Redux : la
 * page appelante fournit columns/rows déjà résolus (valeurs aplaties, pas
 * d'objets imbriqués) - voir excelHelper.js/pdfHelper.js pour le format
 * attendu.
 *
 * Filet de sécurité anti-incident (voir ExportConfiguration.jsx pour le
 * pendant "tout exporter en un clic") : permet à tout backoffice admin de
 * garder une copie de sa configuration hors de la base de données.
 */
const ExportButton = ({ columns, rows, filename, title, subtitle = '', disabled = false, compact = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (ref.current && !ref.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isDisabled = disabled || !rows || rows.length === 0;

  const handleExportExcel = () => {
    setIsOpen(false);
    exportToExcel(columns, rows, filename, title);
  };

  const handleExportPDF = async () => {
    setIsOpen(false);
    setIsExporting(true);
    try {
      await exportTableToPDF(columns, rows, { title, subtitle, filename });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        disabled={isDisabled || isExporting}
        className={compact
          ? "p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          : "inline-flex items-center justify-center p-3 text-sm font-medium rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"}
        title="Exporter"
      >
        <Download className={compact ? 'h-[18px] w-[18px]' : 'h-4 w-4'} />
        {!compact && <span className="hidden md:inline md:ml-2">Exporter</span>}
        {!compact && <ChevronDown className={`hidden md:inline h-3.5 w-3.5 ml-1.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 py-1.5 bg-white border border-slate-200 rounded-lg shadow-xl shadow-slate-200/50 z-[100] overflow-hidden min-w-[180px]">
          <button
            type="button"
            onClick={handleExportExcel}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <FileSpreadsheet size={16} className="text-emerald-600 shrink-0" />
            Exporter en Excel
          </button>
          <button
            type="button"
            onClick={handleExportPDF}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <FileText size={16} className="text-rose-600 shrink-0" />
            Exporter en PDF
          </button>
        </div>
      )}
    </div>
  );
};

export default ExportButton;
