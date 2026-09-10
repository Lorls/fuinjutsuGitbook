# --- Étape 1 : build de l'app Astro (SSR) ---
FROM node:20-slim AS build

WORKDIR /app

# Outils pour compiler better-sqlite3 si aucun binaire pré-compilé n'est dispo
RUN apt-get update -y && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

COPY package.json ./
RUN npm install

COPY . .
RUN npm run build

# --- Étape 2 : serveur Node ---
FROM node:20-slim

WORKDIR /app
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=4321
ENV DATABASE_URL=file:/data/fuinjutsu.db

COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json

EXPOSE 4321
# /data est monté comme volume persistant sur Coolify
CMD ["sh", "-c", "mkdir -p /data && node ./dist/server/entry.mjs"]
