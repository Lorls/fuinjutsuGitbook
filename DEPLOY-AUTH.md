# Déploiement avec authentification (Coolify + SQLite sur volume persistant)

Même principe que tes autres projets (Diplomatie, Koeki) : **SQLite** dans un **fichier sur un volume persistant** `/data`. Pas de service de base séparé. Le contrôle d'accès est appliqué **côté serveur** (SSR Node) : un joueur ne reçoit jamais le HTML d'un cercle au-dessus de son rang.

## Réglages Coolify

1. **Build Pack** : reste sur **Dockerfile** (rien à changer).
2. **Persistent Storage** : ajoute un stockage persistant monté sur **`/data`** (comme sur tes autres projets). C'est là que vit la base `fuinjutsu.db`.
3. **Ports Exposes** : **`4321`** (l'app est un serveur Node, plus nginx).
4. **Environment Variables** :

   | Variable | Valeur |
   |---|---|
   | `SESSION_SECRET` | longue chaîne aléatoire (`openssl rand -hex 32`) |
   | `ADMIN_USER` | nom du 1er compte staff |
   | `ADMIN_PASSWORD` | mot de passe du 1er compte staff |

   `DATABASE_URL` est déjà fixé dans le Dockerfile (`file:/data/fuinjutsu.db`), inutile de le mettre (sauf si tu veux un autre chemin).

5. **Redeploy**.

Au premier démarrage : le dossier `/data` est créé, la base `fuinjutsu.db` et la table `users` sont initialisées, et le compte `ADMIN_USER` (rang 5, staff) est créé automatiquement.

## Après le déploiement

- Va sur **`/login`** → connecte-toi avec `ADMIN_USER` / `ADMIN_PASSWORD`.
- Puis **`/admin`** pour créer les comptes joueurs et fixer leur rang.

## Modèle d'accès (modifiable dans `src/lib/access.ts`)

| Section | Rang requis |
|---|---|
| Fondations + 1er cercle | Cercle 1 |
| 2ème → 5ème cercle | Cercle 2 → 5 |
| Sceaux de clan · À valider | Staff |

- Un joueur voit **son cercle et les inférieurs** ; le **staff voit tout** (dont `/llms.txt` et `/llms-full.txt`).
- La **page d'accueil** reste publique.
- Pour changer qui voit quoi, édite `circleMinRank` puis redéploie.

## Sauvegarde

La base est le fichier `/data/fuinjutsu.db` sur le volume. Pour sauvegarder, copie ce fichier (ou active les backups de volume de Coolify). Ne supprime pas le volume : c'est la seule chose à préserver.
