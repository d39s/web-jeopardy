# syntax=docker/dockerfile:1

# --- Build ------------------------------------------------------------------
FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
COPY packages/game-core/package.json packages/game-core/
COPY apps/web/package.json apps/web/
RUN npm ci

COPY tsconfig.base.json ./
COPY packages ./packages
COPY apps ./apps
COPY content ./content
RUN npm run build

# --- Auslieferung -----------------------------------------------------------
FROM nginx:alpine AS runtime

COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY docker/entrypoint.sh /docker-entrypoint.d/40-jeopardy-config.sh
COPY --from=build /app/apps/web/dist /usr/share/nginx/html

RUN chmod +x /docker-entrypoint.d/40-jeopardy-config.sh

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s \
  CMD wget -q --spider http://localhost/ || exit 1
