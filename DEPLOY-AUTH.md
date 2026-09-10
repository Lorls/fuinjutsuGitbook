# Déploiement avec authentification (Coolify + MySQL)

Le site est passé d'un rendu **statique** à une app **SSR Node** + **MySQL**. Le contrôle d'accès est appliqué **côté serveur** : un joueur ne reçoit jamais le HTML d'un cercle au-dessus de son rang.

## 1. Créer la base MySQL sur Coolify

1. Dans ton projet Coolify → **+ New** → **Database** → **MySQL** (ou MariaDB).
2. Note les identifiants générés : host interne, port, user, password, database.
   - Le *host* est le nom interne du service (souvent quelque chose comme `mysql` ou l'UUID du service), accessible depuis l'app sur le réseau interne de Coolify.

## 2. Variables d'environnement de l'application

Dans l'app (le site) → onglet **Environment Variables**, ajoute :

| Variable | Valeur |
|---|---|
| `DB_HOST` | host interne du service MySQL |
| `DB_PORT` | `3306` |
| `DB_USER` | user MySQL |
| `DB_PASSWORD` | mot de passe MySQL |
| `DB_NAME` | nom de la base |
| `SESSION_SECRET` | une longue chaîne aléatoire (ex. `openssl rand -hex 32`) |
| `ADMIN_USER` | nom du 1er compte staff |
| `ADMIN_PASSWORD` | mot de passe du 1er compte staff |

Au **premier démarrage**, si le compte `ADMIN_USER` n'existe pas, il est créé automatiquement (rang 5, staff). La table `users` est créée toute seule.

## 3. Port de l'application

L'app n'est plus servie par nginx mais par un **serveur Node** qui écoute sur **`4321`**.

- Dans l'app → **Ports Exposes** = **`4321`** (au lieu de 80).
- Le `Dockerfile` gère déjà le reste (`node ./dist/server/entry.mjs`).

## 4. Déployer

**Redeploy**. Puis va sur `https://fuinjutsu.builtbyloris.dev/login`, connecte-toi avec `ADMIN_USER` / `ADMIN_PASSWORD`, et ouvre **/admin** pour créer les comptes des joueurs et fixer leur rang.

## Modèle d'accès (modifiable)

Défini dans `src/lib/access.ts` (`circleMinRank`) :

| Section | Rang requis |
|---|---|
| Fondations (règles, slots) | Cercle 1+ |
| 1er cercle | Cercle 1+ |
| 2ème cercle | Cercle 2+ |
| 3ème cercle | Cercle 3+ |
| 4ème cercle | Cercle 4+ |
| 5ème cercle | Cercle 5+ |
| Sceaux de clan | Staff uniquement |
| À valider | Staff uniquement |

- Le **staff** voit tout (y compris `/llms.txt` et `/llms-full.txt`, réservés au staff).
- La **page d'accueil** reste publique (aucun contenu de sceau).
- Pour changer qui voit quoi, édite `circleMinRank` puis redéploie.

## Gestion des comptes

- **/admin** (staff) : créer un compte, changer le rang / le statut staff, réinitialiser un mot de passe, supprimer.
- Le rang = le cercle atteint par le joueur ; augmente-le quand il progresse en RP.
