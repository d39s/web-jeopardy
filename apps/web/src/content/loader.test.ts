import { sampleDefinition } from '@jeopardy/game-core';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchTopic, fetchTopicIndex, parseUploadedFile } from './loader';

function mockFetch(response: Partial<Response> & { json?: () => Promise<unknown> }): void {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({ ok: true, status: 200, ...response } as Response),
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('themenindex laden', () => {
  it('liefert die themenliste', async () => {
    mockFetch({
      json: () =>
        Promise.resolve({
          schemaVersion: 1,
          topics: [{ id: 'testthema', title: 'Testthema', file: 'testthema.json' }],
        }),
    });

    const result = await fetchTopicIndex();
    expect(result.ok && result.data.topics).toHaveLength(1);
  });

  it('meldet einen netzwerkfehler', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));

    const result = await fetchTopicIndex();
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.kind).toBe('network');
  });

  it('meldet einen ungültigen index', async () => {
    mockFetch({ json: () => Promise.resolve({ schemaVersion: 1, topics: [{ id: 'x' }] }) });

    const result = await fetchTopicIndex();
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.kind).toBe('invalid');
      expect(result.error.issues.length).toBeGreaterThan(0);
    }
  });
});

describe('fragenset laden', () => {
  it('liefert ein gültiges fragenset', async () => {
    mockFetch({ json: () => Promise.resolve(sampleDefinition) });

    const result = await fetchTopic('testthema.json', 'Testthema');
    expect(result.ok && result.data.categories).toHaveLength(5);
  });

  it('meldet einen http-fehler mit statuscode', async () => {
    mockFetch({ ok: false, status: 404, json: () => Promise.resolve({}) });

    const result = await fetchTopic('fehlt.json', 'Fehlt');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.message).toContain('Fehlt');
  });

  it('meldet ein fragenset, das dem schema nicht entspricht', async () => {
    mockFetch({
      json: () => Promise.resolve({ ...sampleDefinition, categories: [] }),
    });

    const result = await fetchTopic('kaputt.json', 'Kaputt');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.kind).toBe('invalid');
  });
});

describe('eigenes fragenset einlesen', () => {
  it('akzeptiert eine gültige datei', async () => {
    const file = new File([JSON.stringify(sampleDefinition)], 'thema.json');

    const result = await parseUploadedFile(file);
    expect(result.ok && result.data.id).toBe('testthema');
  });

  it('meldet ungültiges json', async () => {
    const result = await parseUploadedFile(new File(['{kein json'], 'thema.json'));

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.kind).toBe('parse');
  });

  it('meldet schemafehler feldgenau', async () => {
    const broken = JSON.parse(JSON.stringify(sampleDefinition)) as {
      categories: { clues: { answer: string }[] }[];
    };
    broken.categories[1]!.clues[2]!.answer = '';

    const result = await parseUploadedFile(new File([JSON.stringify(broken)], 'thema.json'));
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.issues[0]).toMatch(/^categories\.1\.clues\.2\.answer:/);
    }
  });
});
