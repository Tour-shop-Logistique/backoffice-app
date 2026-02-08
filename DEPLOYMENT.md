# Déploiement sur Vercel

## Prérequis
1. Un compte Vercel (gratuit)
2. Votre API Laravel déployée en production (pas ngrok)
3. CORS configuré sur votre backend Laravel pour accepter les requêtes depuis Vercel

## Configuration Backend Laravel (IMPORTANT)

Dans votre fichier `config/cors.php` sur le serveur de production :

```php
'allowed_origins' => [
    'https://votre-app.vercel.app',
    'http://localhost:5173', // Pour le dev local
],
'allowed_headers' => ['*'],
'exposed_headers' => [],
'max_age' => 0,
'supports_credentials' => true,
```

## Étapes de déploiement

### 1. Préparer le projet

Mettez à jour `.env.production` avec l'URL de votre API de production :
```
VITE_API_URL=https://votre-api-production.com/api
```

### 2. Déployer sur Vercel

**Option A : Via l'interface web**
1. Allez sur [vercel.com](https://vercel.com)
2. Connectez-vous avec GitHub/GitLab/Bitbucket
3. Importez votre repository
4. Vercel détectera automatiquement Vite
5. Ajoutez la variable d'environnement :
   - Nom : `VITE_API_URL`
   - Valeur : `https://votre-api-production.com/api`
6. Cliquez sur "Deploy"

**Option B : Via CLI**
```bash
# Installer Vercel CLI
npm i -g vercel

# Se connecter
vercel login

# Déployer
vercel

# Pour la production
vercel --prod
```

### 3. Configuration des variables d'environnement sur Vercel

Dans le dashboard Vercel :
1. Allez dans Settings → Environment Variables
2. Ajoutez :
   - `VITE_API_URL` = URL de votre API de production

### 4. Tester

Une fois déployé, testez :
1. La connexion fonctionne
2. Les appels API passent
3. Le backoffice se charge correctement

## Différences Dev vs Production

- **Développement** : Utilise le proxy Vite (`/api` → ngrok)
- **Production** : Utilise l'URL directe (`VITE_API_URL`)

Le code s'adapte automatiquement grâce à `import.meta.env.DEV`.

## Dépannage

### Erreur CORS en production
→ Vérifiez que votre backend autorise l'origine Vercel dans `config/cors.php`

### API non accessible
→ Vérifiez que `VITE_API_URL` est correctement configuré dans Vercel

### Build échoue
→ Vérifiez les logs dans Vercel Dashboard → Deployments
