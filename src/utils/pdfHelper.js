import { format } from 'date-fns';
import { getCurrencyLabel } from './format';

/**
 * Crée un en-tête PDF moderne et professionnel pour tous les rapports
 * @param {Object} doc - Instance jsPDF
 * @param {Object} options - Options de l'en-tête
 * @param {string} options.title - Titre du rapport
 * @param {string} options.subtitle - Sous-titre (optionnel)
 * @param {string} options.period - Période ou filtre
 * @param {string} options.country - Pays (optionnel)
 * @param {string} options.agency - Agence (optionnel)
 * @param {string} options.metadata1 - Métadonnée supplémentaire 1 (optionnel)
 * @param {string} options.metadata2 - Métadonnée supplémentaire 2 (optionnel)
 */
export const createPDFHeader = (doc, options) => {
  const {
    title,
    subtitle = '',
    period,
    country = '',
    agency = '',
    metadata1 = '',
    metadata2 = ''
  } = options;

  // DESIGN ÉQUILIBRÉ : Fond neutre avec accents subtils
  const gradientHeight = 50;
  
  // Fond principal - gris neutre professionnel
  doc.setFillColor(71, 85, 105); // slate-600
  doc.rect(0, 0, 210, gradientHeight, 'F');
  
  // Ligne de séparation subtile
  doc.setFillColor(226, 232, 240); // slate-200
  doc.rect(0, gradientHeight - 2, 210, 2, 'F');
  
  // Titre principal
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text(title, 14, 22);
  
  // Sous-titre
  if (subtitle) {
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(203, 213, 225); // slate-300
    doc.text(subtitle, 14, 32);
  }
  
  // Bloc de métadonnées en haut à droite avec design moderne
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  
  const metadataLines = [];
  if (period) metadataLines.push(`Période: ${period}`);
  if (country) metadataLines.push(`Pays: ${country.toUpperCase()}`);
  if (agency) metadataLines.push(`Agence: ${agency.toUpperCase()}`);
  if (metadata1) metadataLines.push(metadata1);
  if (metadata2) metadataLines.push(metadata2);
  metadataLines.push(`Édité le: ${format(new Date(), 'dd/MM/yyyy')}`);
  
  // Affichage des métadonnées avec espacement optimal
  metadataLines.slice(0, 4).forEach((line, index) => {
    doc.text(line, 196, 18 + (index * 7), { align: 'right' });
  });
};

/**
 * Crée un pied de page PDF uniformisé pour tous les rapports
 * @param {Object} doc - Instance jsPDF
 * @param {Object} options - Options du pied de page
 * @param {string} options.company - Nom de l'entreprise
 * @param {string} options.pageNumber - Numéro de page (optionnel)
 * @param {string} options.totalPages - Nombre total de pages (optionnel)
 */
export const createPDFFooter = (doc, options = {}) => {
  const {
    company = 'Tour Shop',
    pageNumber = '',
    totalPages = ''
  } = options;

  const pageHeight = doc.internal.pageSize.height;
  
  // Ligne de séparation
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.setLineWidth(0.5);
  doc.line(14, pageHeight - 15, 196, pageHeight - 15);
  
  // Texte du pied de page
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139); // slate-500
  doc.setFont("helvetica", "normal");
  
  // Nom de l'entreprise à gauche
  doc.text(company, 14, pageHeight - 10);
  
  // Numéros de page à droite
  if (pageNumber && totalPages) {
    doc.text(`Page ${pageNumber} / ${totalPages}`, 196, pageHeight - 10, { align: 'right' });
  } else if (pageNumber) {
    doc.text(`Page ${pageNumber}`, 196, pageHeight - 10, { align: 'right' });
  }
};

/**
 * Crée des statistiques PDF centrées et sans cadres avec de grands caractères
 * @param {Object} doc - Instance jsPDF
 * @param {Array} cards - Tableau de statistiques { title, value, colorClass }
 */
export const createSummaryCards = (doc, cards) => {
  const statsY = 65;
  const pageWidth = doc.internal.pageSize.width;
  const totalStats = cards.length;
  const sectionWidth = (pageWidth - 28) / totalStats; // 14mm de marge de chaque côté

  cards.forEach((card, index) => {
    const centerX = 14 + (sectionWidth * index) + (sectionWidth / 2);
    
    // Couleurs basées sur le type
    let valueColor;
    switch(card.colorClass) {
      case 'text-emerald-600': valueColor = [16, 185, 129]; break;
      case 'text-orange-600': valueColor = [251, 146, 60]; break;
      case 'text-purple-600': valueColor = [147, 51, 234]; break;
      default: valueColor = [30, 41, 59]; break;
    }

    // Valeur principale (GRANDS CARACTÈRES)
    doc.setFontSize(20); // Un peu réduit pour plus d'élégance
    doc.setFont("helvetica", "bold");
    doc.setTextColor(valueColor[0], valueColor[1], valueColor[2]);
    
    // Gestion spécifique de la devise pour qu'elle soit plus petite
    const fullValue = String(card.value);
    const currencySuffix = ` ${getCurrencyLabel()}`;
    if (fullValue.includes(currencySuffix)) {
        const numberPart = fullValue.replace(currencySuffix, '');
        const numberWidth = doc.getTextWidth(numberPart);
        doc.setFontSize(9); // Devise beaucoup plus petite
        const currencyWidth = doc.getTextWidth(currencySuffix);
        const totalW = numberWidth + currencyWidth;
        const startX = centerX - (totalW / 2);

        doc.setFontSize(20);
        doc.text(numberPart, startX, statsY + 8);
        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        doc.text(currencySuffix, startX + numberWidth, statsY + 8);
    } else {
        doc.text(fullValue, centerX, statsY + 8, { align: 'center' });
    }

    // Titre de la statistique (plus discret)
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 116, 139); // slate-500
    doc.text(card.title.toUpperCase(), centerX, statsY + 15, { align: 'center' });
    
    // Barre d'accentuation plus fine
    doc.setDrawColor(valueColor[0], valueColor[1], valueColor[2]);
    doc.setLineWidth(0.8);
    doc.line(centerX - 4, statsY + 18, centerX + 4, statsY + 18);

    // Ligne de séparation verticale entre les éléments (sauf pour le dernier)
    if (index < totalStats - 1) {
      const separatorX = 14 + (sectionWidth * (index + 1));
      doc.setDrawColor(226, 232, 240); // slate-200 (très subtil)
      doc.setLineWidth(0.2);
      doc.line(separatorX, statsY + 2, separatorX, statsY + 18);
    }
  });
};

/**
 * Formateur de nombres pour les PDF
 * @param {number} value - Valeur à formater
 * @returns {string} Nombre formaté
 */
export const formatPDFNumber = (value) => {
  return String(value || 0).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
};

/**
 * Export PDF générique d'un tableau de données (sans cartes résumé,
 * contrairement aux rapports transactionnels comme Historique/Comptabilité)
 * - utilisé pour l'export brut des pages de configuration (ExportButton.jsx,
 * ExportConfiguration.jsx), où le but est de pouvoir reconstituer
 * manuellement la config en cas d'incident, pas de produire un rapport.
 *
 * `columns` : tableau de { header, key } (même format que excelHelper.js).
 * `rows` : tableau d'objets déjà aplatis (valeurs primitives uniquement).
 * Charge jsPDF/autoTable en import dynamique (comme les usages existants),
 * pour ne pas alourdir le bundle initial d'un module rarement utilisé.
 */
export const exportTableToPDF = async (columns, rows, { title, subtitle = '', filename }) => {
  const { jsPDF } = await import('jspdf');
  const { default: autoTable } = await import('jspdf-autotable');

  const doc = new jsPDF();
  createPDFHeader(doc, {
    title: cleanPDFText(title),
    subtitle: cleanPDFText(subtitle),
    metadata1: `${rows.length} ligne${rows.length > 1 ? 's' : ''}`,
  });

  autoTable(doc, {
    head: [columns.map((c) => cleanPDFText(c.header))],
    body: rows.map((row) => columns.map((c) => cleanPDFText(String(row[c.key] ?? '')))),
    startY: 58,
    theme: 'grid',
    headStyles: { fillColor: [71, 85, 105], textColor: 255, fontStyle: 'bold', fontSize: 8 },
    bodyStyles: { fontSize: 8 },
    margin: { left: 14, right: 14 },
    didDrawPage: () => {
      createPDFFooter(doc, { company: 'Tour Shop' });
    },
  });

  doc.save(`${filename}-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
};

/**
 * Nettoie les caractères spéciaux pour le PDF
 * @param {string} text - Texte à nettoyer
 * @returns {string} Texte nettoyé
 */
export const cleanPDFText = (text) => {
  if (!text) return '';
  return text
    .replace(/[éèêë]/g, 'e')
    .replace(/[àâä]/g, 'a')
    .replace(/[ùûü]/g, 'u')
    .replace(/[ôö]/g, 'o')
    .replace(/[îï]/g, 'i')
    .replace(/[ç]/g, 'c')
    .replace(/[ÉÈÊË]/g, 'E')
    .replace(/[ÀÂÄ]/g, 'A')
    .replace(/[ÙÛÜ]/g, 'U')
    .replace(/[ÔÖ]/g, 'O')
    .replace(/[ÎÏ]/g, 'I')
    .replace(/[Ç]/g, 'C')
    .replace(/[']/g, '');
};
