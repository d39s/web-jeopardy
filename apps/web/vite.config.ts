/// <reference types="vitest/config" />
import { existsSync, readFileSync } from 'node:fs';
import { cp } from 'node:fs/promises';
import { basename, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import type { Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const gameCoreSrc = fileURLToPath(new URL('../../packages/game-core/src', import.meta.url));
const topicsDir = fileURLToPath(new URL('../../content/topics', import.meta.url));
const distDir = fileURLToPath(new URL('./dist', import.meta.url));

/**
 * Die Fragensets sind Inhalte, kein Quellcode: Sie liegen in content/topics und
 * werden im Entwicklungsserver unter /topics ausgeliefert bzw. beim Build in
 * dist/topics kopiert. Im Container ersetzt ein Volume dieses Verzeichnis, sodass
 * neue Fragensets ohne neues Image möglich sind.
 */
function topicsPlugin(): Plugin {
  return {
    name: 'jeopardy-topics',

    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const path = req.url?.split('?')[0] ?? '';
        if (!path.startsWith('/topics/')) return next();

        const name = basename(path);
        if (!/^[a-z0-9-]+\.json$/i.test(name)) return next();

        const file = join(topicsDir, name);
        if (!existsSync(file)) {
          res.statusCode = 404;
          res.end('Fragenset nicht gefunden');
          return;
        }

        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.setHeader('Cache-Control', 'no-cache');
        res.end(readFileSync(file));
      });
    },

    async closeBundle() {
      await cp(topicsDir, join(distDir, 'topics'), { recursive: true });
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), topicsPlugin()],
  resolve: {
    alias: { '@jeopardy/game-core': gameCoreSrc },
  },
  server: { port: 5173 },
  test: {
    name: 'web',
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
  },
});
