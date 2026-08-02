# --- Étape 1 : build du GitBook avec HonKit ---
FROM node:20-alpine AS build

WORKDIR /book

# Installer les dépendances (cache Docker sur package.json)
COPY package.json ./
RUN npm install

# Copier le contenu du livre et générer le HTML statique dans /book/_book
COPY . .
RUN npx honkit build . _book

# --- Étape 2 : servir le statique avec nginx ---
FROM nginx:alpine

COPY --from=build /book/_book /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
