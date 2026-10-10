import { describe, expect, it } from 'vitest';
import { invalidDefinitionSamples, sampleDefinition, samplePool } from './fixtures';
import {
  formatIssues,
  validateGameDefinition,
  validateQuestionPool,
  validateTopicIndex,
} from './schema';
import { CLUE_LEVELS } from './types';
import type { QuestionPool } from './types';

interface TestIndex {
  schemaVersion: 2;
  categories: { id: string; title: string; description?: string; file: string }[];
}

/** Gültiger Themenindex als Ausgangspunkt für die Negativfälle. */
function sampleIndex(): TestIndex {
  return {
    schemaVersion: 2,
    categories: [
      {
        id: 'testkategorie',
        title: 'Testkategorie',
        description: 'Zum Prüfen.',
        file: 'pool-testkategorie.json',
      },
    ],
  };
}

/** Tiefe Kopie des Beispielpools, damit Negativfälle sich nicht gegenseitig stören. */
function poolCopy(): QuestionPool {
  return JSON.parse(JSON.stringify(samplePool)) as QuestionPool;
}

describe('validierung der fragensets', () => {
  it('akzeptiert das beispielset', () => {
    const result = validateGameDefinition(sampleDefinition);
    expect(result.ok).toBe(true);
  });

  it.each(invalidDefinitionSamples)('lehnt ungültiges fragenset ab: $name', ({ value }) => {
    const result = validateGameDefinition(value);
    expect(result.ok).toBe(false);
  });

  it('meldet den fehlerhaften pfad feldgenau', () => {
    const broken = JSON.parse(JSON.stringify(sampleDefinition)) as Record<string, unknown>;
    const categories = broken.categories as { clues: { answer: string }[] }[];
    categories[2]!.clues[4]!.answer = '';

    const result = validateGameDefinition(broken);
    if (result.ok) throw new Error('Fragenset hätte abgelehnt werden müssen.');

    expect(formatIssues(result.issues)[0]).toMatch(/^categories\.2\.clues\.4\.answer:/);
  });

  it('lehnt nicht aufsteigende punktestufen ab', () => {
    const result = validateGameDefinition({
      ...sampleDefinition,
      pointSteps: [100, 100, 300, 400, 500],
    });
    expect(result.ok).toBe(false);
  });

  it('akzeptiert einen gültigen themenindex', () => {
    expect(validateTopicIndex(sampleIndex()).ok).toBe(true);
  });

  it('lehnt einen themenindex mit falscher dateiendung ab', () => {
    const index = sampleIndex();
    const category = index.categories[0];
    if (!category) throw new Error('Testindex unvollständig.');
    category.file = 'pool-testkategorie.txt';

    expect(validateTopicIndex(index).ok).toBe(false);
  });

  it('verlangt zu jeder kategorie einen fragenpool', () => {
    const index = sampleIndex() as { categories: { file?: string }[] };
    delete index.categories[0]?.file;

    expect(validateTopicIndex(index).ok).toBe(false);
  });

  it('lehnt doppelte themenkategorien ab', () => {
    const index = sampleIndex();
    index.categories.push({
      id: 'testkategorie',
      title: 'Noch einmal',
      file: 'pool-zweimal.json',
    });

    expect(validateTopicIndex(index).ok).toBe(false);
  });

  it('lehnt die alte indexfassung ab', () => {
    // Version 1 führte fertige Fragensets; die Oberfläche kann damit nichts
    // mehr anfangen und soll das früh melden statt leer zu bleiben.
    expect(validateTopicIndex({ ...sampleIndex(), schemaVersion: 1 }).ok).toBe(false);
  });

  it('verlangt mindestens eine themenkategorie', () => {
    const index = sampleIndex();
    index.categories = [];

    expect(validateTopicIndex(index).ok).toBe(false);
  });
});

describe('validierung der fragenpools', () => {
  it('akzeptiert den beispielpool', () => {
    expect(validateQuestionPool(samplePool).ok).toBe(true);
  });

  it('verlangt genug rubriken für ein spielfeld', () => {
    const pool = poolCopy();
    pool.rubrics = pool.rubrics.slice(0, 4);

    expect(validateQuestionPool(pool).ok).toBe(false);
  });

  it('verlangt genug fragen je rubrik für eine volle spalte', () => {
    const pool = poolCopy();
    pool.rubrics[0]!.clues = pool.rubrics[0]!.clues.slice(0, 4);

    expect(validateQuestionPool(pool).ok).toBe(false);
  });

  it.each([0, 10, 2.5])('lehnt die stufe %s ab', (level) => {
    const pool = poolCopy();
    (pool.rubrics[0]!.clues[0] as { level: number }).level = level;

    const result = validateQuestionPool(pool);
    if (result.ok) throw new Error('Der Pool hätte abgelehnt werden müssen.');
    expect(formatIssues(result.issues)[0]).toMatch(/^rubrics\.0\.clues\.0\.level:/);
  });

  it('nimmt die stufen der ganzen skala an', () => {
    // Die Fragenskala reicht weiter als der Regler – bis 9.
    for (const level of CLUE_LEVELS) {
      const pool = poolCopy();
      (pool.rubrics[0]!.clues[0] as { level: number }).level = level;
      expect(validateQuestionPool(pool).ok).toBe(true);
    }
  });

  it('lehnt doppelte ids ab, auch über rubriken hinweg', () => {
    const pool = poolCopy();
    pool.rubrics[1]!.clues[0]!.id = pool.rubrics[0]!.clues[0]!.id;

    expect(validateQuestionPool(pool).ok).toBe(false);
  });

  it('lehnt eine id ab, die schon eine rubrik trägt', () => {
    const pool = poolCopy();
    pool.rubrics[1]!.clues[0]!.id = pool.rubrics[0]!.id;

    expect(validateQuestionPool(pool).ok).toBe(false);
  });

  it('akzeptiert dieselbe frage und lösung mit verschiedenen ids in zwei rubriken', () => {
    const pool = poolCopy();
    pool.rubrics[1]!.clues[0]!.question = pool.rubrics[0]!.clues[0]!.question;
    pool.rubrics[1]!.clues[0]!.answer = pool.rubrics[0]!.clues[0]!.answer;
    expect(validateQuestionPool(pool).ok).toBe(true);
  });

  it('akzeptiert ähnliche texte mit abweichender zeichensetzung', () => {
    const pool = poolCopy();
    const original = pool.rubrics[0]!.clues[0]!.question;
    pool.rubrics[1]!.clues[0]!.question = `  ${original.toUpperCase().replace('?', '!')} `;

    expect(validateQuestionPool(pool).ok).toBe(true);
  });

  it('akzeptiert wiederholte lösungen innerhalb derselben rubrik', () => {
    const pool = poolCopy();
    pool.rubrics[0]!.clues[1]!.answer = pool.rubrics[0]!.clues[0]!.answer;
    expect(validateQuestionPool(pool).ok).toBe(true);
  });

  it('lehnt unbekannte felder ab', () => {
    expect(validateQuestionPool({ ...samplePool, unbekanntesFeld: true }).ok).toBe(false);
  });

  it('lehnt punkte in einer pool-frage ab', () => {
    // Punkte entstehen erst beim Ziehen aus der Zeile.
    const pool = poolCopy();
    (pool.rubrics[0]!.clues[0] as unknown as { points: number }).points = 100;

    expect(validateQuestionPool(pool).ok).toBe(false);
  });
});
