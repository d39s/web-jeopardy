import { describe, expect, it } from 'vitest';
import { invalidDefinitionSamples, sampleDefinition } from './fixtures';
import { formatIssues, validateGameDefinition, validateTopicIndex } from './schema';

interface TestIndex {
  schemaVersion: 1;
  categories: { id: string; title: string; description?: string }[];
  topics: {
    id: string;
    title: string;
    category: string;
    difficulty: number;
    file: string;
  }[];
}

/** Gültiger Themenindex als Ausgangspunkt für die Negativfälle. */
function sampleIndex(): TestIndex {
  return {
    schemaVersion: 1,
    categories: [{ id: 'testkategorie', title: 'Testkategorie', description: 'Zum Prüfen.' }],
    topics: [
      {
        id: 'testthema',
        title: 'Testthema',
        category: 'testkategorie',
        difficulty: 1,
        file: 'testthema.json',
      },
    ],
  };
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
    const topic = index.topics[0];
    if (!topic) throw new Error('Testindex unvollständig.');
    topic.file = 'testthema.txt';
    expect(validateTopicIndex(index).ok).toBe(false);
  });

  it('lehnt einen verweis auf eine unbekannte themenkategorie ab', () => {
    const index = sampleIndex();
    const topic = index.topics[0];
    if (!topic) throw new Error('Testindex unvollständig.');
    topic.category = 'gibt-es-nicht';

    const result = validateTopicIndex(index);
    if (result.ok) throw new Error('Der Index hätte abgelehnt werden müssen.');
    expect(formatIssues(result.issues)[0]).toMatch(/^topics\.0\.category:/);
  });

  it('lehnt doppelte themenkategorien ab', () => {
    const index = sampleIndex();
    index.categories.push({ id: 'testkategorie', title: 'Noch einmal' });

    expect(validateTopicIndex(index).ok).toBe(false);
  });

  it.each([0, 4, 2.5])('lehnt die schwierigkeit %s ab', (difficulty) => {
    const index = sampleIndex();
    const topic = index.topics[0];
    if (!topic) throw new Error('Testindex unvollständig.');
    topic.difficulty = difficulty;

    expect(validateTopicIndex(index).ok).toBe(false);
  });

  it('verlangt mindestens eine themenkategorie', () => {
    const index = sampleIndex();
    index.categories = [];

    expect(validateTopicIndex(index).ok).toBe(false);
  });
});
