# Système de Cache LocalStorage

## Vue d'ensemble

L'application utilise un système de cache localStorage pour optimiser les performances et réduire les appels API inutiles.

## Données mises en cache

### Configuration Backoffice
- **Clé** : `backoffice_config`
- **Durée de validité** : 24 heures
- **Contenu** : Configuration complète du backoffice (ID, pays, etc.)

## Fonctionnement

### 1. Chargement initial
Au démarrage de l'application :
1. Le Redux store vérifie si un cache valide existe dans localStorage
2. Si oui, les données sont chargées immédiatement (pas d'appel API)
3. Si non ou si le cache a expiré (>24h), un appel API est effectué

### 2. Sauvegarde
Lorsque les données du backoffice sont récupérées avec succès :
- Les données sont automatiquement sauvegardées dans localStorage
- Un timestamp est ajouté pour gérer l'expiration

### 3. Invalidation
Le cache est automatiquement vidé lors de :
- La déconnexion de l'utilisateur
- L'appel à l'action `resetBackoffice()`

## Avantages

✅ **Performance** : Chargement instantané au démarrage  
✅ **Économie de bande passante** : Moins d'appels API  
✅ **Expérience utilisateur** : Pas de délai d'attente au rechargement de page  
✅ **Résilience** : L'app fonctionne même si l'API est temporairement indisponible

## Fichiers modifiés

- `src/redux/slices/backofficeSlice.js` : Logique de cache
- `src/redux/slices/authSlice.js` : Nettoyage du cache à la déconnexion
- `src/components/layout/Layout.jsx` : Vérification du cache avant appel API

## Notes techniques

- Le cache utilise `JSON.stringify/parse` pour la sérialisation
- Les erreurs de lecture/écriture sont capturées et loggées
- Le cache expire automatiquement après 24h
- La validation du cache se fait via un timestamp
