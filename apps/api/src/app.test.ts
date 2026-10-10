import { afterEach, describe, expect, it, vi } from 'vitest';
import { samplePool } from '@jeopardy/game-core';
import { buildApp } from './app';
import type { ContentRepository } from './repository';
import type { ReviewRepository } from './review-repository';

function mockRepository(): ContentRepository {
  return {
    health: vi.fn().mockResolvedValue(undefined),
    index: vi.fn().mockResolvedValue({
      schemaVersion: 2,
      categories: [{ id: samplePool.id, title: samplePool.title, file: `${samplePool.id}.json` }],
    }),
    pool: vi.fn().mockResolvedValue(samplePool),
    save: vi.fn().mockResolvedValue(undefined),
  };
}
const apps: ReturnType<typeof buildApp>[] = [];
function setup(options: Parameters<typeof buildApp>[1] = {}) {
  const repository = mockRepository();
  const app = buildApp(repository, options);
  apps.push(app);
  return { app, repository };
}
afterEach(async () => {
  await Promise.all(apps.splice(0).map((app) => app.close()));
});

describe('Fragen-API', () => {
  it('liefert Zufallsfragen und speichert nur gültige Bewertungen', async () => {
    const reviews: ReviewRepository = {
      random: vi.fn().mockResolvedValue({ id: 'frage' }),
      vote: vi.fn().mockResolvedValue({ status: 'ok', rating: { score: 3.2, level: 3, votes: 1 } }),
    };
    const { app } = setup({ reviews });
    const random = await app.inject('/api/v1/review/random?excludeTopic=it&excludeId=frage');
    expect(random.statusCode).toBe(200);
    expect(reviews.random).toHaveBeenCalledWith('it', 'frage', undefined);
    expect((await app.inject('/api/v1/review/random?topicId=it')).statusCode).toBe(200);
    expect(reviews.random).toHaveBeenLastCalledWith(undefined, undefined, 'it');
    expect((await app.inject('/api/v1/review/random?topicId=invalid_')).statusCode).toBe(400);
    const request = { method: 'POST' as const, url: '/api/v1/review/it/frage/votes' };
    const payload = {
      requestId: '00000000-0000-4000-8000-000000000001',
      version: 'a'.repeat(64),
      verdict: 'too-hard',
    };
    expect((await app.inject({ ...request, payload })).json()).toEqual({
      score: 3.2,
      level: 3,
      votes: 1,
    });
    expect(reviews.vote).toHaveBeenCalledWith('it', 'frage', payload);
    for (const invalid of [
      { ...payload, verdict: 'falsch' },
      { ...payload, requestId: 'x' },
      { ...payload, extra: true },
    ]) {
      expect((await app.inject({ ...request, payload: invalid })).statusCode).toBe(400);
    }
    expect(reviews.vote).toHaveBeenCalledTimes(1);
    vi.mocked(reviews.vote).mockResolvedValue({ status: 'missing' });
    expect((await app.inject({ ...request, payload })).statusCode).toBe(404);
    vi.mocked(reviews.vote).mockResolvedValue({ status: 'stale' });
    expect((await app.inject({ ...request, payload })).statusCode).toBe(409);
    vi.mocked(reviews.random).mockResolvedValue(null);
    expect((await app.inject('/api/v1/review/random')).statusCode).toBe(404);
  });

  it('liefert Index und Pool im bestehenden Datenformat', async () => {
    const { app, repository } = setup();
    const index = await app.inject('/api/v1/topics/index.json');
    expect(index.statusCode).toBe(200);
    expect(index.json().schemaVersion).toBe(2);
    const pool = await app.inject(`/api/v1/pools/${samplePool.id}.json`);
    expect(pool.statusCode).toBe(200);
    expect(pool.json()).toEqual(samplePool);
    expect(pool.headers['cache-control']).toBe('no-store');
    expect(repository.pool).toHaveBeenCalledWith(samplePool.id);
  });
  it('meldet fehlende Pools und ungültige IDs', async () => {
    const { app, repository } = setup();
    vi.mocked(repository.pool).mockResolvedValue(null);
    expect((await app.inject('/api/v1/pools/unbekannt.json')).statusCode).toBe(404);
    expect((await app.inject('/api/v1/pools/ungueltig_.json')).statusCode).toBe(400);
  });
  it('prüft DB-Erreichbarkeit und verrät keine internen Fehler', async () => {
    const { app, repository } = setup();
    expect((await app.inject('/api/v1/health')).statusCode).toBe(200);
    vi.mocked(repository.health).mockRejectedValue(new Error('geheimes-db-passwort'));
    const response = await app.inject('/api/v1/health');
    expect(response.statusCode).toBe(503);
    expect(response.body).not.toContain('geheimes-db-passwort');
  });
  it('deaktiviert Schreiben ohne Token', async () => {
    const { app, repository } = setup();
    const response = await app.inject({
      method: 'PUT',
      url: `/api/v1/pools/${samplePool.id}.json`,
      payload: samplePool,
    });
    expect(response.statusCode).toBe(403);
    expect(repository.save).not.toHaveBeenCalled();
  });
  it('fordert für Schreiben ein korrektes Bearer-Token', async () => {
    const { app, repository } = setup({ writeToken: 'test-token' });
    for (const authorization of ['', 'Bearer falsch', 'Bearer test-tokeX']) {
      expect(
        (
          await app.inject({
            method: 'PUT',
            url: `/api/v1/pools/${samplePool.id}.json`,
            payload: samplePool,
            headers: { authorization },
          })
        ).statusCode,
      ).toBe(401);
    }
    expect(repository.save).not.toHaveBeenCalled();
  });
  it('validiert Pool und passende ID vor dem atomaren Speichern', async () => {
    const { app, repository } = setup({ writeToken: 'test-token' });
    const request = {
      method: 'PUT' as const,
      url: `/api/v1/pools/${samplePool.id}.json`,
      headers: { authorization: 'Bearer test-token' },
    };
    const invalid = await app.inject({ ...request, payload: { ...samplePool, rubrics: [] } });
    expect(invalid.statusCode).toBe(400);
    expect(invalid.json().issues).toEqual(
      expect.arrayContaining([expect.stringMatching(/^rubrics:/)]),
    );
    expect(
      (await app.inject({ ...request, url: '/api/v1/pools/andere-id.json', payload: samplePool }))
        .statusCode,
    ).toBe(400);
    expect(repository.save).not.toHaveBeenCalled();
    expect((await app.inject({ ...request, payload: samplePool })).statusCode).toBe(204);
    expect(repository.save).toHaveBeenCalledWith(samplePool);
  });
  it('erlaubt CORS nur für konfigurierte Browser-Origins', async () => {
    const { app } = setup({ corsOrigins: ['http://localhost:3000'] });
    const allowed = await app.inject({
      url: '/api/v1/health',
      headers: { origin: 'http://localhost:3000' },
    });
    expect(allowed.headers['access-control-allow-origin']).toBe('http://localhost:3000');
    const denied = await app.inject({
      url: '/api/v1/health',
      headers: { origin: 'http://fremd.invalid' },
    });
    expect(denied.headers['access-control-allow-origin']).toBeUndefined();
  });
});
