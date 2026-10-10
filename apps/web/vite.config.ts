/// <reference types="vitest/config" />
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const gameCoreSrc = fileURLToPath(new URL('../../packages/game-core/src', import.meta.url));
const appDir = fileURLToPath(new URL('.', import.meta.url));
const rootDir = fileURLToPath(new URL('../..', import.meta.url));

/**
 * Kurzer Commit-Hash aus dem Arbeitsverzeichnis. Im Container-Build gibt es kein
 * .git-Verzeichnis (siehe .dockerignore) – dort liefert `npm run build:info` die
 * Angaben vorab als .env.production.
 */
function gitCommit(): string {
  try {
    return execFileSync('git', ['rev-parse', '--short', 'HEAD'], {
      cwd: rootDir,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    // Kein Git zur Hand – die Fußzeile zeigt den Commit dann als unbekannt an.
    return '';
  }
}

/**
 * Version, Commit und Baudatum stehen erst beim Bauen fest und landen über
 * `define` als Konstante im Bündel (siehe apps/web/src/build-info.d.ts). Die
 * Version führt die package.json im Wurzelverzeichnis nach SemVer; Commit und
 * Datum kommen bevorzugt aus der Umgebung, damit der Container-Build sie
 * durchreichen kann.
 */
function buildInfo(env: Record<string, string>): {
  version: string;
  commit: string;
  builtAt: string;
} {
  const { version } = JSON.parse(readFileSync(join(rootDir, 'package.json'), 'utf8')) as {
    version: string;
  };

  return {
    version,
    commit: env.VITE_COMMIT?.trim() || gitCommit(),
    builtAt: env.VITE_BUILD_DATE?.trim() || new Date().toISOString(),
  };
}

export default defineConfig(({ mode }) => ({
  plugins: [react(), tailwindcss()],
  define: {
    __BUILD_INFO__: JSON.stringify(buildInfo(loadEnv(mode, appDir, 'VITE_'))),
  },
  resolve: {
    alias: { '@jeopardy/game-core': gameCoreSrc },
  },
  server: {
    port: 5173,
    proxy: { '/api': process.env.API_PROXY_TARGET ?? 'http://127.0.0.1:3001' },
  },
  preview: {
    proxy: { '/api': process.env.API_PROXY_TARGET ?? 'http://127.0.0.1:3001' },
  },
  test: {
    name: 'web',
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
  },
}));
