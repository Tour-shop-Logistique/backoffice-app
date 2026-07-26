# 📋 Standards de Design et Développement - Tour Shop Backoffice

Ce document regroupe les règles de design et de code à respecter pour garantir l'homogénéité de l'application.

---

## 🏗️ Architecture & Flux
- **Flux Logistique** : Séparation stricte entre mouvement de colis et encaissement financier (voir `LOGISTICS_WORKFLOW.md`).
- **Blocage Métier** : Une expédition est bloquée si les frais annexes ne sont pas payés.
- **État Global** : Redux Toolkit (`parcelSlice.js`).
- **Mises à jour UI** : Toujours retourner les données de l'API dans les thunks pour permettre une mise à jour instantanée de l'état local.

---

## 🎨 Système de Design

### 📦 Composants de Statistiques (`StatCard`)
Toutes les cartes de synthèse (Comptabilité, Historique, Détails Agence) doivent suivre ce standard :
- **Thème** : Mode clair par défaut (`bg-white`), bordure fine (`border-slate-200`).
- **Couleurs Sémantiques** :
  - **Neutre (CA Attendu)** : `text-slate-900`.
  - **Gain / Succès (Backoffice)** : `text-emerald-600`.
  - **Mouvement / Warning (Agences)** : `text-orange-600`.
  - **Volume / Info (Expéditions)** : `text-purple-600`.
- **Icônes** : Utiliser un fond coloré très clair (ex: `bg-emerald-50`) correspondant à la couleur du texte.
- **Unités** : Le symbole `CFA` doit être en `text-slate-500` et plus petit que la valeur principale.

### 📄 Rapports PDF (`pdfHelper.js`)
Les exports PDF doivent impérativement respecter ces règles pour conserver un look "Dashboard" pro :
- **En-tête** : Fond `slate-600` avec texte blanc.
- **Synthèse** : 
  - **Centrage horizontal** total sur la page.
  - **ZÉRO CADRE** : Pas de boîtes ou de bordures autour des chiffres.
  - **Grands Caractères** : Valeurs en `20pt` (Gras), labels en `7pt` (Normal).
  - **Gestion CFA** : Le texte "CFA" doit être réduit à `9pt` dans les statistiques de synthèse.
  - **Séparateurs** : Lignes verticales `slate-200` très fines (`0.2mm`) entre les blocs.
- **Tableaux** : Alternance de lignes (`bg-slate-50`) et thèmes de grille (`theme: 'grid'`).

---

## � Typographie & Style
- **Police** : `DM Sans` (Interface) / `Helvetica` (PDF).
- **Poids autorisés** : `normal` (400), `medium` (500), `semibold` (600), `bold` (700).
- **Bords arrondis** : `rounded-lg` (boutons/inputs), `rounded-xl` (cartes/panneaux/modaux).
- **Icônes** : Exclusivement `lucide-react`.

---

## ⚙️ Développement & Formatage
- **Montants** : Toujours utiliser `toLocaleString()` ou le helper `formatPDFNumber`.
- **Dates** : Utiliser `date-fns` (ex: `format(new Date(), 'dd/MM/yyyy')`).
- **Nettoyage PDF** : Toujours passer les textes par `cleanPDFText` pour supprimer les accents problématiques dans jsPDF.
