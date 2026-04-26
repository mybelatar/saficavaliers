# Restaurant Dashboard

Application Next.js + TypeScript + Prisma + Tailwind + Capacitor pour gerer:
- tablette serveur (prise de commande)
- tablette cuisine (traitement commandes)
- tablette manager (stats, ventes, stock)
- gestion manager (restaurant, categories, menu, stock, photos)
- reservations clients et suivi des statuts
- alertes de niveau de stock (faible/critique) en temps reel
- gestion des tables (creation, modification, suppression)

## Fonctionnement

- Profil selectionne au demarrage (`Serveur`, `Cuisinier`, `Manager`) sans authentification.
- Donnees chargees depuis la base de donnees (plus de mock front).
- Notifications en temps reel entre tablettes via SSE:
  - nouvelle commande -> cuisine
  - changement statut commande -> serveur
- Gestion manager:
  - CRUD categories menu
  - CRUD articles menu
  - upload photo article vers `public/uploads/menu`
  - CRUD stock avec seuil minimum (`minQuantity`)
  - alertes stock faible/critique via notifications temps reel
  - CRUD reservations (creation, edition, statut, suppression)
  - CRUD tables (numero, places)
  - mise a jour informations restaurant

## Demarrage

1. Utiliser `.env` avec `DATABASE_URL="file:./dev.db"` (SQLite fichier local).
2. Installer les dependances: `npm install`
3. Generer Prisma: `npm run db:generate`
4. Appliquer schema DB: `npm run db:push` (ou `npm run db:migrate`)
5. Lancer en dev: `npm run dev`

## Scripts utiles

- `npm run dev`: developpement avec Webpack
- `npm run build`: construction de l application
- `npm run start`: demarrage production
- `npm run db:push`: deployer le schema vers la base
- `npm run db:migrate`: executer les migrations
- `npm run db:studio`: ouvrir Prisma Studio
- `npm run db:seed`: initialiser des donnees de base
- `npm run cap:sync`: synchroniser Capacitor
- `npm run cap:add:android`: generer le projet Android natif
- `npm run cap:sync:android`: build Next.js + sync Android (requiert `CAP_SERVER_URL`)
- `npm run cap:open:android`: ouvrir le projet Android Studio

## Installation Android et Windows

L application est installable en PWA sur Android et Windows.

### Windows (Edge/Chrome)

1. Deployer l application en HTTPS.
2. Ouvrir l URL depuis Edge ou Chrome.
3. Cliquer sur `Installer l'application` (barre d adresse ou menu navigateur).

### Android (PWA)

1. Ouvrir l URL HTTPS de l application dans Chrome Android.
2. Choisir `Ajouter a l ecran d accueil` ou `Installer l'application`.

### Android (APK natif Capacitor)

Le projet Android est configure pour charger l URL de votre serveur Next.js.

1. Definir l URL serveur:
   - PowerShell: `$env:CAP_SERVER_URL="https://votre-domaine.com"`
2. Synchroniser Android: `npm run cap:sync:android`
3. Ouvrir Android Studio: `npm run cap:open:android`
4. Depuis Android Studio, generer un APK/AAB signe (`Build > Generate Signed Bundle / APK`).
