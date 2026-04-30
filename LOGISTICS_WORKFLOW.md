# Documentation : Workflow Logistique & Comptable (Tour Shop)

## 1. Vue d'ensemble
Le nouveau workflow sépare le flux **logistique** (mouvement des colis) du flux **financier** (encaissements réels). Il introduit un mécanisme de blocage sécurisé : une expédition peut être stoppée si des frais annexes ne sont pas payés.

---

## 2. Cycle de Vie d'une Expédition

### Phase A : Initialisation (Agence de Départ)
*   **Action** : Enregistrement du colis et calcul du `montant_expedition`.
*   **Paiement** : Le client peut payer immédiatement (Encaissement `montant_expedition`) ou choisir le crédit (`is_paiement_credit`).
*   **Statut** : `statut_paiement_expedition` devient **paye** si réglé.

### Phase B : Contrôle & HUB (Backoffice)
*   **Contrôle** : Le Backoffice vérifie le poids/nature et ajoute des `frais_annexes` (Douane, Assurance, Emballage suppl.).
*   **Blocage** : Si `frais_annexes > 0` et `statut_paiement_frais` est **en_attente**, l'expédition est bloquée.
*   **Notification** : Le client reçoit le montant total à régler.

### Phase C : Régularisation des Frais
*   **Action Agence** : Le client règle les frais annexes dans son agence locale.
*   **Enregistrement** : L'agence utilise `record-transaction` avec l'objet `frais_annexes`.
*   **Déblocage** : Le `statut_paiement_frais` passe à **paye**. Le Backoffice est notifié et l'expédition reprend son cours (Embarquement).

### Phase D : Livraison Finale (Agence de Destination)
*   **Paiement à l'arrivée** : Si `is_paiement_credit = true`, l'agence perçoit la totalité (Objet `tout_compris`).
*   **Remise** : Le colis est remis au client une fois que tous les statuts sont au vert (**paye**).

---

## 3. Répartition des Revenus (Règles Métier)

### Cycle de Vie d'une Expédition - Qui gagne quoi ?

| Acteur | Ce qu'il gagne | Quand il le gagne |
|--------|----------------|-------------------|
| **Agence de Départ** | Frais d'enlèvement + Frais d'emballage + Montant d'expédition | À l'enregistrement du colis |
| **Agence d'Arrivée** | Frais de livraison à domicile | À la livraison finale |
| **Backoffice de Départ** | Frais d'emballage + Montant d'expédition + Frais annexes | Après contrôle et validation |
| **Backoffice d'Arrivé** | **Frais de retard uniquement** | Uniquement si des frais de retard sont appliqués |
| **Livreur de Départ** | Frais d'enlèvement | À la collecte du colis |
| **Livreur d'Arrivé** | Frais de livraison à domicile | À la remise au client |

### Points Clés :
- Le **backoffice d'arrivé** ne génère aucun revenu direct sauf frais de retard
- Les **agences** gagnent sur leurs services respectifs (enlèvement vs livraison)
- Les **backoffices** sont rémunérés principalement par le backoffice de départ
- Les **livreurs** sont payés pour leurs services de transport
- Les **frais de retard** sont une source de revenu supplémentaire pour le backoffice d'arrivé

---

## 4. Lexique Comptable

| Terme | Définition |
| :--- | :--- |
| **CA Potentiel** | CA théorique basé sur toutes les factures émises (ce qui est dû). |
| **CA Réel** | CA total réellement encaissé physiquement (Journal de caisse). |
| **Encaissement** | Toute entrée d'argent (Cash In). |
| **Décaissement** | Toute sortie d'argent / Remboursement (Cash Out). |
| **Paiement Transport** | Règlement uniquement du prix de base de l'envoi. |
| **Paiement Frais Annexes** | Règlement de la douane, taxes et autres suppléments. |

---

## 5. Guide des APIs

### 📥 Enregistrer un Paiement
`POST /api/agence/record-transaction`
*   Permet de valider financièrement une étape.
*   Types : `encaissement`, `decaissement`.
*   Objets : `montant_expedition`, `frais_annexes`, `tout_compris`.

### 📊 Rapports de Cabinet
`GET /api/agence/accounting` OU `GET /api/backoffice/accounting`
*   Renvoie la synthèse `potential` vs `real`.
*   Filtres recommandés : `date_debut`, `date_fin`, `agence_id`.

### 📝 Liste des Transactions
`GET /api/agence/list-transactions`
*   Affichage du journal de caisse journalier de l'agence.
