# syntax=docker/dockerfile:1

# --- Build ------------------------------------------------------------------
FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
COPY packages/game-core/package.json packages/game-core/
COPY apps/web/package.json apps/web/
COPY apps/api/package.json apps/api/
RUN npm ci

COPY tsconfig.base.json ./
COPY packages ./packages
COPY apps ./apps
RUN npm run build

# --- Auslieferung -----------------------------------------------------------
FROM nginx:alpine AS runtime

# Das nginx-Image ersetzt beim Start Umgebungsvariablen in templates/*.template.
ENV JEOPARDY_API_URL=http://api:3001
COPY docker/nginx.conf /etc/nginx/templates/default.conf.template
COPY docker/entrypoint.sh /docker-entrypoint.d/40-jeopardy-config.sh
COPY --from=build /app/apps/web/dist /usr/share/nginx/html

RUN chmod +x /docker-entrypoint.d/40-jeopardy-config.sh

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s \
  CMD wget -q --spider http://127.0.0.1/ || exit 1
