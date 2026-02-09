# Déploiement sur Firebase Hosting

Ce guide explique comment déployer l'application React/Vite sur Firebase Hosting.

## Prérequis
1.  Un compte Google.
2.  Node.js installé sur votre machine.
3.  Un projet créé sur la [Console Firebase](https://console.firebase.google.com/).

## Initialisation (Première fois seulement)

1.  **Installez les outils Firebase CLI** (si ce n'est pas déjà fait) :
    ```bash
    npm install -g firebase-tools
    ```

2.  **Connectez-vous à votre compte Google** :
    ```bash
    firebase login
    ```

3.  **Initialisez le projet** (dans le dossier `backoffice-app`) :
    ```bash
    firebase init hosting
    ```
    *   **Sélectionnez** : `Hosting: Configure files for Firebase Hosting...` (Espace pour cocher, Entrée pour valider).
    *   **Project Setup** : `Use an existing project` (Choisissez votre projet créé sur la console).
    *   **Public directory** : Tapez `dist` (c'est là que Vite construit l'app).
    *   **Configure as a single-page app** : Répondez `Yes` (y).
    *   **Set up automatic builds and deploys with GitHub?** : `No` (n) pour l'instant.
    *   **File dist/index.html already exists. Overwrite?** : `No` (n) (NE PAS ÉCRASER !).

## Déploiement

1.  **Construisez l'application** pour la production :
    ```bash
    npm run build
    ```
    *(Cela va créer/mettre à jour le dossier `dist`)*

2.  **Déployez sur Firebase** :
    ```bash
    firebase deploy
    ```

Une fois terminé, Firebase vous donnera l'URL de votre site (ex: `https://votre-projet.web.app`).

## Configuration IMPORTANT (Environnement)

Comme pour Vercel, Firebase n'utilise pas le fichier `.env` local une fois déployé.
Cependant, avec Vite, les variables `VITE_` sont "inlinées" (remplacées par leur valeur) **au moment du build**.

**Donc :**
1.  Assurez-vous que votre fichier `.env.production` contient la bonne URL de l'API :
    ```env
    VITE_API_URL=https://votre-api-production.com/api
    ```
2.  Quand vous lancez `npm run build`, Vite va lire cette variable et l'inscrire "en dur" dans les fichiers JavaScript du dossier `dist`.
3.  C'est ce dossier `dist` (avec l'URL de prod) qui est envoyé à Firebase.

**Si vous changez l'URL de l'API, vous devez refaire `npm run build` puis `firebase deploy`.**

## Problèmes fréquents

### Page blanche (404) sur les rafraîchissements
Si vous rechargez une page (ex: `/dashboard`) et obtenez une 404 de Firebase :
*   Vérifiez que `firebase.json` contient bien la section `rewrites` :
    ```json
    "rewrites": [ { "source": "**", "destination": "/index.html" } ]
    ```
*   Cela redirige toutes les routes inconnues vers votre application React, qui gère elle-même le routing.

### Erreur CORS
Si l'application se charge mais les requêtes API échouent :
*   Configurez CORS sur votre **Backend Laravel** pour autoriser le domaine Firebase (`https://votre-projet.web.app`).
