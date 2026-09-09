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
  it('liefert einen gültigen vorrat', async () => {
    mockFetch({ json: () => Promise.resolve(samplePool) });

    const result = await fetchPool('pool-testkategorie.json', 'Testkategorie');
    expect(result.ok && result.data.rubrics).toHaveLength(samplePool.rubrics.length);
  });

  it('meldet einen http-fehler mit statuscode', async () => {
    mockFetch({ ok: false, status: 404, json: () => Promise.resolve({}) });

    const result = await fetchPool('fehlt.json', 'Fehlt');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.message).toContain('Fehlt');
  });

  it('meldet einen vorrat, der dem schema nicht entspricht', async () => {
    mockFetch({ json: () => Promise.resolve({ ...samplePool, rubrics: [] }) });

    const result = await fetchPool('kaputt.json', 'Kaputt');
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
