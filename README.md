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
