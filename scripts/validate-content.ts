#!/usr/bin/env tsx
/**
 * Prüft den Themenindex und alle Fragenpools in content/topics gegen die
 * Schemas aus @jeopardy/game-core. Zusätzlich wird für jede Kategorie und jede
 * Reglerstellung ein Brett gezogen: Ein Pool, aus dem sich kein gültiges
 * Spielfeld ziehen lässt, wäre erst in der Oberfläche aufgefallen.
 *
 * Beendet sich mit Exit-Code 1, sobald ein Problem gefunden wurde.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  CATEGORY_COUNT,
  DIFFICULTIES,
  drawBoard,
  fittingRubrics,
  formatIssues,
  validateGameDefinition,
  validateQuestionPool,
  validateTopicIndex,
} from '@jeopardy/game-core';
import type { QuestionPool } from '@jeopardy/game-core';

const topicsDir = fileURLToPath(new URL('../content/topics', import.meta.url));
const indexFile = 'index.json';

/** Wie viele Ziehungen je Stufe geprüft werden – deckt auch seltene Wege ab. */
const DRAWS_PER_LEVEL = 25;

const problems: string[] = [];
const warnings: string[] = [];

function report(file: string, messages: string[]): void {
  for (const message of messages) problems.push(`${file}: ${message}`);
}

function readJson(file: string): unknown {
  return JSON.parse(readFileSync(join(topicsDir, file), 'utf8'));
}

function fail(): never {
  console.error(problems.map((problem) => `  - ${problem}`).join('\n'));
  process.exit(1);
}

let indexData: unknown;
try {
  indexData = readJson(indexFile);
} catch (error) {
  console.error(`${indexFile} konnte nicht gelesen werden: ${(error as Error).message}`);
  process.exit(1);
}

const indexResult = validateTopicIndex(indexData);
if (!indexResult.ok) {
  report(indexFile, formatIssues(indexResult.issues));
  fail();
}

const index = indexResult.data;
const pools: QuestionPool[] = [];

for (const category of index.categories) {
  let raw: unknown;
  try {
    raw = readJson(category.file);
  } catch (error) {
    report(category.file, [`Datei nicht lesbar: ${(error as Error).message}`]);
    continue;
  }

  const result = validateQuestionPool(raw);
  if (!result.ok) {
    report(category.file, formatIssues(result.issues));
    continue;
  }

  const pool = result.data;
  pools.push(pool);

  // Index und Pool müssen dasselbe meinen – sonst zeigt die Startseite einen
  // anderen Titel als das Spielfeld.
  if (pool.id !== category.id) {
    report(category.file, [`id "${pool.id}" passt nicht zur Kategorie "${category.id}".`]);
  }
  if (pool.title !== category.title) {
    report(category.file, [`title "${pool.title}" weicht vom Index ab ("${category.title}").`]);
  }

  for (const level of DIFFICULTIES) {
    for (let seed = 0; seed < DRAWS_PER_LEVEL; seed++) {
      const drawn = drawBoard({ pool, level, seed });
      if (!drawn.ok) {
        report(category.file, [
          `Stufe ${level} lässt sich nicht ziehen: nur ${drawn.problem.usable} von ` +
            `${drawn.problem.required} Spalten kamen zustande.`,
        ]);
        break;
      }

      const check = validateGameDefinition(drawn.definition);
      if (!check.ok) {
        report(category.file, [
          `Stufe ${level}, Ziehung ${seed} ergibt ein ungültiges Brett: ` +
            formatIssues(check.issues).join('; '),
        ]);
        break;
      }
    }

    // Genau fünf passende Rubriken heißt: immer dieselben fünf Spalten.
    const fitting = fittingRubrics(pool, level).length;
    if (fitting <= CATEGORY_COUNT) {
      warnings.push(
        `${category.file}: Stufe ${level} hat nur ${fitting} passende Rubriken – ` +
          'die Spaltenauswahl wiederholt sich.',
      );
    }
  }
}

// Eine Datei, die niemand lädt, ist entweder vergessen oder Altlast.
const referenced = new Set([indexFile, ...index.categories.map((category) => category.file)]);
for (const file of readdirSync(topicsDir)) {
  if (file.endsWith('.json') && !referenced.has(file)) {
    report(file, ['Die Datei steht in keinem Index-Eintrag.']);
  }
}

if (problems.length > 0) {
  console.error(`${problems.length} Problem(e) in den Fragenpools gefunden:\n`);
  fail();
}

const clueCount = pools.reduce(
  (sum, pool) => sum + pool.rubrics.reduce((inner, rubric) => inner + rubric.clues.length, 0),
  0,
);
const rubricCount = pools.reduce((sum, pool) => sum + pool.rubrics.length, 0);

console.log(
  `${pools.length} Kategorie(n) mit ${rubricCount} Rubriken und insgesamt ` +
    `${clueCount} Fragen sind gültig; jede Stufe lässt sich ziehen.`,
);

if (warnings.length > 0) {
  console.log(`\n${warnings.length} Hinweis(e) zur Abwechslung:`);
  console.log(warnings.map((warning) => `  - ${warning}`).join('\n'));
}
