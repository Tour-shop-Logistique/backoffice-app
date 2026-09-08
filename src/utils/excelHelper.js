import * as XLSX from 'xlsx';
import { format } from 'date-fns';

/**
 * Helpers d'export Excel génériques, miroir de pdfHelper.js mais pour le
 * format .xlsx (bibliothèque xlsx/SheetJS). Utilisés par ExportButton.jsx
 * (export page par page) et ExportConfiguration.jsx (export global
 * multi-onglets) - filet de sécurité pour reconstituer manuellement la
 * configuration en cas d'incident (voir contexte : incident du 2026-09-08).
 *
 * `columns` : tableau de { header, key } - header = libellé de colonne,
 * key = clé lue dans chaque ligne de `rows`. `rows` doit être un tableau
 * d'objets déjà aplatis (valeurs primitives uniquement, pas d'objets
 * imbriqués) - chaque page appelante résout ses champs relationnels
 * (ex: tarif.commune_a?.nom) avant de construire `rows`.
 */

const rowsToAoa = (columns, rows) => {
  const header = columns.map((c) => c.header);
  const body = rows.map((row) => columns.map((c) => row[c.key] ?? ''));
  return [header, ...body];
};

/**
 * Génère et télécharge un classeur Excel à un seul onglet.
 */
export const exportToExcel = (columns, rows, filename, sheetName = 'Données') => {
  const worksheet = XLSX.utils.aoa_to_sheet(rowsToAoa(columns, rows));
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName.substring(0, 31)); // Excel limite les noms d'onglet à 31 caractères
  XLSX.writeFile(workbook, `${filename}-${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
};

/**
 * Génère et télécharge un classeur Excel multi-onglets, un onglet par
 * config - c'est le vrai filet de sécurité anti-incident (voir
 * ExportConfiguration.jsx) : un seul fichier réimportable/consultable qui
 * couvre toute la configuration du backoffice.
 *
 * sheets = [{ name, columns, rows }, ...]
 */
export const exportMultiSheetExcel = (sheets, filename) => {
  const workbook = XLSX.utils.book_new();
  const usedNames = new Set();

  sheets.forEach(({ name, columns, rows }) => {
    // Unicité + longueur max 31 caractères imposées par le format Excel.
    let sheetName = name.substring(0, 31);
    let suffix = 2;
    while (usedNames.has(sheetName)) {
      sheetName = `${name.substring(0, 28)}_${suffix}`;
      suffix += 1;
    }
    usedNames.add(sheetName);

    const worksheet = XLSX.utils.aoa_to_sheet(rowsToAoa(columns, rows));
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  });

  XLSX.writeFile(workbook, `${filename}-${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
};
