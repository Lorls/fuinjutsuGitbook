# --- Étape 1 : build du site Astro Starlight ---
FROM node:20-slim AS build

WORKDIR /app

# Installer les dépendances (cache Docker sur package.json)
COPY package.json ./
RUN npm install

# Copier le projet et générer le site statique dans /app/dist
COPY . .
RUN npm run build

# --- Étape 2 : servir le statique avec nginx ---
FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
