# syntax=docker/dockerfile:1
FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production

COPY package.json package-lock.json ./
COPY packages/game-core/package.json packages/game-core/
COPY apps/web/package.json apps/web/
COPY apps/api/package.json apps/api/
# tsx ist der TypeScript-Laufzeitstarter; keine Build-Werkzeuge zur Laufzeit nötig.
RUN npm ci --omit=dev --ignore-scripts

COPY tsconfig.base.json ./
COPY packages/game-core ./packages/game-core
COPY apps/api ./apps/api
COPY content ./content

USER node
EXPOSE 3001
HEALTHCHECK --interval=10s --timeout=3s --start-period=60s --retries=5 \
  CMD node -e "fetch('http://127.0.0.1:3001/api/v1/health').then(r => { if (!r.ok) process.exit(1); }).catch(() => process.exit(1))"
CMD ["node", "--import", "tsx", "apps/api/src/server.ts"]