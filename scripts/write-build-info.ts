#!/usr/bin/env tsx
/**
 * Schreibt Commit und Baudatum nach apps/web/.env.production, von wo Vite sie
 * in die Fußzeile der Startseite übernimmt.
 *
 * Nötig ist das nur dort, wo beim Bauen kein Git zur Hand ist – vor allem im
 * Container: .git gehört nicht zum Build-Kontext (siehe .dockerignore). Ohne
 * die Datei zeigt die Fußzeile den Commit als unbekannt an.
 */
import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const target = fileURLToPath(new URL('../apps/web/.env.production', import.meta.url));

let commit: string;
try {
  commit = execFileSync('git', ['rev-parse', '--short', 'HEAD'], { encoding: 'utf8' }).trim();
} catch (error) {
  console.error(`Commit-Hash nicht ermittelbar: ${(error as Error).message}`);
  process.exit(1);
}

const builtAt = new Date().toISOString();
writeFileSync(target, `VITE_COMMIT=${commit}\nVITE_BUILD_DATE=${builtAt}\n`, 'utf8');

console.log(`Build-Angaben geschrieben: Commit ${commit}, Stand ${builtAt}`);
