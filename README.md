# NFC Avis — MVP

Application permettant à un commerçant de collecter des avis Google via une carte NFC :
le client scanne la carte, note son expérience, et selon la note est soit redirigé vers
Google Avis (4-5★), soit invité à laisser un message privé (1-3★).

Stack : **Next.js 14 (App Router) + TypeScript + Prisma (SQLite) + Tailwind CSS**.
Authentification maison (JWT en cookie httpOnly), pas de dépendance externe complexe.

## Installation (dans VS Code)

1. Ouvrez ce dossier dans VS Code.
2. Installez les dépendances :
   ```bash
   npm install
   ```
3. Copiez le fichier d'environnement :
   ```bash
   cp .env.example .env
   ```
   Remplissez `DATABASE_URL` avec votre chaîne de connexion Neon (celle avec `-pooler`
   dans le nom d'hôte). Choisissez un `JWT_SECRET`, un `ADMIN_EMAIL`/`ADMIN_PASSWORD`
   (vos identifiants de connexion), et un `SETUP_SECRET` (n'importe quelle longue
   chaîne aléatoire).
4. Créez les tables dans la base de données et générez le client Prisma :
   ```bash
   npx prisma db push
   ```
5. Lancez le serveur de développement :
   ```bash
   npm run dev
   ```
6. Ouvrez [http://localhost:3000](http://localhost:3000).

## Accès admin (inscription publique désactivée)

Ce système n'a **pas d'inscription publique** — un seul compte admin (vous) gère toutes les
entreprises clientes. Pour créer ce compte, une seule fois :

1. Visitez `https://votre-site.vercel.app/api/setup-admin?secret=VOTRE_SETUP_SECRET`
   (remplacez par la vraie valeur de `SETUP_SECRET` que vous avez mise dans les variables
   d'environnement). Vous devez voir un message confirmant la création du compte.
2. Connectez-vous ensuite sur `/login` avec `ADMIN_EMAIL` / `ADMIN_PASSWORD`.
3. Cette route ne recrée pas le compte si vous la visitez deux fois — sans danger.

## Workflow pour chaque nouveau client (sans écrire de code)

1. Connectez-vous sur `/login`.
2. Onglet **Entreprises** → ajoutez le nom du client + son lien Google Avis.
3. Onglet **Cartes NFC** → créez une carte pour ce client, copiez le lien généré
   (ex: `https://votre-site.vercel.app/r/AB3C7XZ9`).
4. Écrivez ce lien sur le tag NFC physique avec l'app "NFC Tools" (Android/iOS), remettez
   la carte au client. C'est tout — plus besoin de code supplémentaire par client.

## Parcours à tester

1. **Se connecter** en tant qu'admin → `/login`
2. **Ajouter une entreprise** → onglet "Entreprises" du dashboard, avec le lien Google Avis
   (Google Business Profile → Demander des avis → copier le lien court).
3. **Créer une carte NFC** → onglet "Cartes NFC", donnez-lui un nom (ex: "Comptoir").
   Un lien unique est généré, ex: `http://localhost:3000/r/AB3C7XZ9`.
4. **Écrire ce lien sur votre carte NFC** (avec une app comme "NFC Tools" sur mobile),
   ou testez simplement en ouvrant le lien dans un navigateur.
5. Notez l'expérience :
   - **4 ou 5 étoiles** → confettis + animation de remerciement + bouton "Laisser un avis Google"
     qui ouvre le lien Google Avis renseigné.
   - **1 à 3 étoiles** → formulaire de message privé, enregistré en base et visible
     dans le dashboard ("Retours privés").
6. Retournez sur `/dashboard` pour voir : scans, avis Google, taux de conversion,
   retours privés, note moyenne.

## Structure du projet

```
app/
  page.tsx                  # Landing page
  login/ register/          # Authentification
  dashboard/                # Espace commerçant (protégé par middleware.ts)
    page.tsx                 # Vue d'ensemble + statistiques
    businesses/page.tsx      # Gestion des entreprises
    cards/page.tsx           # Gestion des cartes NFC
  r/[cardId]/page.tsx        # Page publique de notation (scannée via NFC)
  api/
    auth/{register,login,logout}/route.ts
    business/route.ts
    cards/route.ts
    rate/route.ts             # Soumission de la note par le client
    dashboard/stats/route.ts
components/
  RatingForm.tsx             # Étoiles + logique 4-5★ vs 1-3★
  LogoutButton.tsx
lib/
  db.ts                      # Client Prisma
  auth.ts                    # JWT + cookies de session
prisma/
  schema.prisma              # User, Business, NfcCard, Scan, Review
```

## Prochaines étapes (voir les phases du projet)

- **Phase 5** : notifications en temps réel au commerçant (email/push) quand un retour
  privé arrive, génération de QR code image pour chaque carte, IA pour résumer les
  retours privés, paiement par abonnement (Stripe).
- Passer de SQLite à PostgreSQL en production (changez juste `provider` et `DATABASE_URL`
  dans `prisma/schema.prisma`).
- Héberger sur Vercel + une base Postgres (Neon, Supabase, etc.).

## Notes

- Le champ `code` de `NfcCard` est l'identifiant public utilisé dans l'URL `/r/[code]`.
  Il est volontairement court et lisible pour être gravé/imprimé si besoin (QR code de secours).
- Les commentaires ne sont enregistrés que pour les notes de 1 à 3 étoiles, comme prévu
  dans le cahier des charges.
