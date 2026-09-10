# --- Étape 1 : build de l'app Astro (SSR) ---
FROM node:20-slim AS build

WORKDIR /app

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

COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json

EXPOSE 4321
CMD ["node", "./dist/server/entry.mjs"]
