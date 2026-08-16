import { describe, expect, it } from 'vitest';
import { invalidDefinitionSamples, sampleDefinition } from './fixtures';
import { formatIssues, validateGameDefinition, validateTopicIndex } from './schema';

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

  it('akzeptiert einen gültigen themenindex', () => {
    const result = validateTopicIndex({
      schemaVersion: 1,
      topics: [{ id: 'testthema', title: 'Testthema', file: 'testthema.json' }],
    });
    expect(result.ok).toBe(true);
  });

  it('lehnt einen themenindex mit falscher dateiendung ab', () => {
    const result = validateTopicIndex({
      schemaVersion: 1,
      topics: [{ id: 'testthema', title: 'Testthema', file: 'testthema.txt' }],
    });
    expect(result.ok).toBe(false);
  });
});
