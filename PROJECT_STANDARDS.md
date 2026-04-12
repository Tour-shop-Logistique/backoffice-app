# 📋 Standards de Design et Développement - Tour Shop Backoffice

Ce document regroupe les règles de design et de code à respecter pour garantir l'homogénéité de l'application.

## 🔠 Typographie

- **Police** : `DM Sans` (via Google Fonts).
- **Poids autorisés** :
  - `font-normal` (400)
  - `font-medium` (500)
  - `font-semibold` (600)
  - `font-bold` (700)
- **🛑 INTERDIT** : Ne jamais utiliser `font-black` (900) ou `font-extrabold` (800).

## 🎨 Système de Design (Option A)

- **Bords arrondis** :
  - Éléments interactifs (boutons, inputs, sélecteurs) : `rounded-lg`.
  - Conteneurs (cartes, panneaux, sections) : `rounded-xl`.
  - Modaux : `rounded-xl`.
- **Bordures** : Utiliser `border-slate-200` ou `border-slate-300` pour une interface propre et aérée.
- **Ombres** : `shadow-sm` pour les cartes, `shadow-md` pour les éléments flottants.

## 🌈 Palette de Couleurs

- **Titres / Texte Principal** : `text-slate-900`.
- **Texte Secondaire** : `text-slate-500` ou `text-slate-400`.
- **Actions Primaires** : `bg-slate-900` ou Indigo/Blue selon le contexte.
- **Succès** : `emerald-600` ou `emerald-500`.
- **Alerte / Erreur** : `rose-600` ou `rose-500`.

## 📦 Composants Standards

- **Modaux** : Toujours utiliser le composant `src/components/common/Modal.jsx`.
- **Action Buttons** : Utiliser les classes standards (ex: `ts-btn-primary`) ou les utilitaires Tailwind `rounded-lg`.
- **Icônes** : Utiliser exclusivement `lucide-react`.

## ⚙️ Logique Logicielle

- **État Global** : Redux Toolkit (`parcelSlice.js`).
- **Mises à jour UI** : Toujours retourner les données de l'API dans les thunks pour permettre une mise à jour instantanée de l'état local (optimistic UI).
- **Formatage** : Utiliser `toLocaleString()` pour les montants et `date-fns` pour les dates.
