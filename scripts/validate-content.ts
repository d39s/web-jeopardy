#!/usr/bin/env tsx
/**
 * Prüft alle Fragensets in content/topics gegen die Schemas aus @jeopardy/game-core
 * und stellt sicher, dass Index und Dateien zusammenpassen.
 * Beendet sich mit Exit-Code 1, sobald ein Problem gefunden wurde.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { formatIssues, validateGameDefinition, validateTopicIndex } from '@jeopardy/game-core';

const topicsDir = fileURLToPath(new URL('../content/topics', import.meta.url));
const indexFile = 'index.json';

const problems: string[] = [];

function report(file: string, messages: string[]): void {
  for (const message of messages) problems.push(`${file}: ${message}`);
}

function readJson(file: string): unknown {
  return JSON.parse(readFileSync(join(topicsDir, file), 'utf8'));
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
  console.error(problems.join('\n'));
  process.exit(1);
}

const index = indexResult.data;
const listedFiles = new Set(index.topics.map((topic) => topic.file));

const jsonFiles = readdirSync(topicsDir).filter(
  (file) => file.endsWith('.json') && file !== indexFile,
);

for (const file of jsonFiles) {
  if (!listedFiles.has(file)) {
    report(indexFile, [`Die Datei ${file} ist in der Themenliste nicht eingetragen.`]);
  }
}

for (const topic of index.topics) {
  let data: unknown;
  try {
    data = readJson(topic.file);
  } catch (error) {
    report(topic.file, [`Datei konnte nicht gelesen werden: ${(error as Error).message}`]);
    continue;
  }

  const result = validateGameDefinition(data);
  if (!result.ok) {
    report(topic.file, formatIssues(result.issues));
    continue;
  }

  if (result.data.id !== topic.id) {
    report(topic.file, [`ID "${result.data.id}" weicht vom Index-Eintrag "${topic.id}" ab.`]);
  }
  if (result.data.title !== topic.title) {
    report(topic.file, [`Titel weicht vom Index-Eintrag "${topic.title}" ab.`]);
  }
}

if (problems.length > 0) {
  console.error(`${problems.length} Problem(e) in den Fragensets gefunden:\n`);
  console.error(problems.map((problem) => `  - ${problem}`).join('\n'));
  process.exit(1);
}

const clueCount = index.topics.length * 25;
console.log(`${index.topics.length} Fragenset(s) mit insgesamt ${clueCount} Fragen sind gültig.`);
