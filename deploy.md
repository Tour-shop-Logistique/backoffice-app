# Guide de Déploiement

Ce guide explique comment déployer l'application Agences Partenaires sur différentes plateformes.

## 🚀 Préparation

### 1. Build de production

```bash
# Installer les dépendances
npm install

# Créer le build de production
npm run build
```

Le build sera créé dans le dossier `dist/`.

### 2. Variables d'environnement

Créez un fichier `.env` à la racine du projet :

```env
VITE_APP_TITLE=Agences Partenaires
VITE_APP_VERSION=1.0.0
VITE_API_BASE_URL=https://your-api-domain.com/api
```

## 🌐 Déploiement sur Vercel

### 1. Installation de Vercel CLI

```bash
npm install -g vercel
```

### 2. Déploiement

```bash
# Se connecter à Vercel
vercel login

# Déployer
vercel

# Pour la production
vercel --prod
```

### 3. Configuration Vercel

Créez un fichier `vercel.json` :

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

## ☁️ Déploiement sur Netlify

### 1. Via l'interface web

1. Connectez-vous à [Netlify](https://netlify.com)
2. Glissez-déposez le dossier `dist/` dans l'interface
3. Configurez les redirections dans `_redirects` :

```
/*    /index.html   200
```

### 2. Via Git

1. Poussez votre code sur GitHub
2. Connectez votre repository à Netlify
3. Configurez le build :
   - Build command : `npm run build`
   - Publish directory : `dist`

## 🔥 Déploiement sur Firebase Hosting

### 1. Installation Firebase CLI

```bash
npm install -g firebase-tools
```

### 2. Initialisation

```bash
firebase login
firebase init hosting
```

### 3. Configuration

Dans `firebase.json` :

```json
{
  "hosting": {
    "public": "dist",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  }
}
```

### 4. Déploiement

```bash
firebase deploy
```

## 🐳 Déploiement avec Docker

### 1. Dockerfile

Créez un fichier `Dockerfile` :

```dockerfile
# Build stage
FROM node:18-alpine as build

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### 2. Configuration Nginx

Créez un fichier `nginx.conf` :

```nginx
events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    server {
        listen 80;
        server_name localhost;
        root /usr/share/nginx/html;
        index index.html;

        location / {
            try_files $uri $uri/ /index.html;
        }

        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
}
```

### 3. Build et déploiement

```bash
# Build de l'image
docker build -t backoffice-app .

# Exécution du conteneur
docker run -p 80:80 backoffice-app
```

## 📱 Déploiement sur GitHub Pages

### 1. Configuration Vite

Dans `vite.config.js` :

```javascript
export default defineConfig({
  base: '/backoffice-app/', // Nom du repository
  // ... autres configurations
})
```

### 2. Script de déploiement

Ajoutez dans `package.json` :

```json
{
  "scripts": {
    "deploy": "gh-pages -d dist"
  }
}
```

### 3. Installation et déploiement

```bash
npm install --save-dev gh-pages
npm run build
npm run deploy
```

## 🔧 Configuration pour le backend

### 1. Variables d'environnement de production

```env
VITE_API_BASE_URL=https://api.backoffice-app.com
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 2. CORS Configuration

Assurez-vous que votre backend autorise les requêtes depuis votre domaine de production.

### 3. HTTPS

Utilisez toujours HTTPS en production pour la sécurité.

## 📊 Monitoring et Analytics

### 1. Google Analytics

Ajoutez dans `index.html` :

```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_MEASUREMENT_ID');
</script>
```

### 2. Sentry pour le monitoring d'erreurs

```bash
npm install @sentry/react @sentry/tracing
```

Configuration dans `main.jsx` :

```javascript
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "your-sentry-dsn",
  integrations: [new Sentry.BrowserTracing()],
  tracesSampleRate: 1.0,
});
```

## 🔒 Sécurité

### 1. Headers de sécurité

Ajoutez dans votre serveur web :

```
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';
```

### 2. Variables d'environnement sensibles

Ne jamais commiter les fichiers `.env` contenant des clés secrètes.

## 📈 Performance

### 1. Optimisations de build

- Utilisez la compression gzip/brotli
- Optimisez les images
- Utilisez un CDN pour les assets statiques

### 2. Monitoring de performance

- Lighthouse CI
- Web Vitals
- Core Web Vitals

## 🆘 Support

En cas de problème lors du déploiement :

1. Vérifiez les logs de build
2. Testez en local avec `npm run build && npm run preview`
3. Vérifiez la configuration des variables d'environnement
4. Consultez la documentation de la plateforme de déploiement
