import { sampleDefinition, samplePool } from '@jeopardy/game-core';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchPool, fetchTopicIndex, parseUploadedFile } from './loader';

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
  it('liefert die kategorien mit ihrem vorrat', async () => {
    mockFetch({
      json: () =>
        Promise.resolve({
          schemaVersion: 2,
          categories: [
            { id: 'testkategorie', title: 'Testkategorie', file: 'pool-testkategorie.json' },
          ],
        }),
    });

    const result = await fetchTopicIndex();
    expect(result.ok && result.data.categories).toHaveLength(1);
    expect(result.ok && result.data.categories[0]?.file).toBe('pool-testkategorie.json');
    expect(fetch).toHaveBeenCalledWith('/api/v1/topics/index.json', { signal: undefined });
  });

  it('meldet einen netzwerkfehler', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));

    const result = await fetchTopicIndex();
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.kind).toBe('network');
  });

  it('meldet einen ungültigen index', async () => {
    mockFetch({
      json: () => Promise.resolve({ schemaVersion: 2, categories: [{ id: 'x' }] }),
    });

    const result = await fetchTopicIndex();
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.kind).toBe('invalid');
      expect(result.error.issues.length).toBeGreaterThan(0);
    }
  });
});

describe('fragenvorrat laden', () => {
  it('lädt einen pool mit gleichen fragen und antworten unter verschiedenen ids', async () => {
    const original = samplePool.rubrics[0]!.clues[0]!;
    const pool = {
      ...samplePool,
      rubrics: samplePool.rubrics.map((rubric, index) =>
        index === 1
          ? {
              ...rubric,
              clues: rubric.clues.map((clue, clueIndex) =>
                clueIndex === 0
                  ? {
                      ...clue,
                      question: original.question,
                      answer: original.answer,
                    }
                  : clue,
              ),
            }
          : rubric,
      ),
    };
    mockFetch({ json: async () => pool });
    expect((await fetchPool(pool.id, pool.title)).ok).toBe(true);
  });

  it('liefert einen gültigen vorrat', async () => {
    mockFetch({ json: () => Promise.resolve(samplePool) });

    const result = await fetchPool('testkategorie', 'Testkategorie');
    expect(result.ok && result.data.rubrics).toHaveLength(samplePool.rubrics.length);
    expect(fetch).toHaveBeenCalledWith('/api/v1/pools/testkategorie.json', { signal: undefined });
  });

  it('meldet einen http-fehler mit statuscode', async () => {
    mockFetch({ ok: false, status: 404, json: () => Promise.resolve({}) });

    const result = await fetchPool('fehlt', 'Fehlt');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.message).toContain('Fehlt');
  });

  it('meldet einen vorrat, der dem schema nicht entspricht', async () => {
    mockFetch({ json: () => Promise.resolve({ ...samplePool, rubrics: [] }) });

    const result = await fetchPool('kaputt', 'Kaputt');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.kind).toBe('invalid');
  });
});

describe('eigenes fragenset einlesen', () => {
  it('funktioniert ohne erreichbare API und ohne HTTP-Aufruf', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    const result = await parseUploadedFile(
      new File([JSON.stringify(sampleDefinition)], 'spiel.json'),
    );
    expect(result.ok).toBe(true);
    expect(fetch).not.toHaveBeenCalled();
  });

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
