import { afterEach, describe, expect, it, vi } from 'vitest';
import { buildApp } from '../app';
import type { ContentRepository } from '../repository';
import type { AdminRepository } from './admin-repository';
import { adminAccess, adminAuthFromEnv } from './auth';
import type { AdminAuth } from './auth';
import { SqlScriptError } from './sql-script';

const question = {
  topicId: 'it',
  rubricId: 'netze',
  rubricName: 'Netze',
  id: 'dns',
  question: 'Was ist DNS?',
  answer: 'Domain Name System',
  sourceLevel: 3,
  level: 3,
  score: 3,
  votes: { fits: 0, tooHard: 0, tooEasy: 0, unsure: 0 },
  version: 'a'.repeat(64),
};

function mockAdmin(): AdminRepository {
  return {
    topics: vi.fn().mockResolvedValue([]),
    questions: vi.fn().mockResolvedValue({ total: 1, questions: [question] }),
    createQuestion: vi.fn().mockResolvedValue({ status: 'ok', question }),
    updateQuestion: vi.fn().mockResolvedValue({ status: 'stale' }),
    deleteQuestion: vi.fn().mockResolvedValue({ status: 'ok' }),
    runSql: vi.fn().mockResolvedValue({ ok: true }),
    log: vi.fn().mockResolvedValue([]),
    logEntry: vi.fn().mockResolvedValue(null),
  };
}

const apps: ReturnType<typeof buildApp>[] = [];
function setup(auth: AdminAuth = { mode: 'forward-auth', groups: [] }) {
  const repository = mockAdmin();
  const app = buildApp({} as ContentRepository, { admin: { auth, repository } });
  apps.push(app);
  return { app, repository };
}
afterEach(async () => {
  await Promise.all(apps.splice(0).map((app) => app.close()));
});
const user = { 'x-authentik-username': 'dominic', 'x-authentik-groups': 'jeopardy-admins|alle' };

describe('Admin-Anmeldung', () => {
  it('liest die Betriebsart aus der Umgebung', () => {
    expect(adminAuthFromEnv({})).toEqual({ mode: 'off' });
    expect(adminAuthFromEnv({ ADMIN_AUTH: 'dev' })).toEqual({ mode: 'dev', user: 'dev' });
    expect(adminAuthFromEnv({ ADMIN_AUTH: 'forward-auth', ADMIN_GROUPS: ' a, b ,' })).toEqual({
      mode: 'forward-auth',
      groups: ['a', 'b'],
    });
    expect(() => adminAuthFromEnv({ ADMIN_AUTH: 'basic' })).toThrow('ADMIN_AUTH');
  });

  it('verlangt Authentik-Benutzer und optional eine passende Gruppe', () => {
    const auth = { mode: 'forward-auth' as const, groups: ['jeopardy-admins'] };
    expect(adminAccess(auth, {})).toEqual({ status: 'unauthenticated' });
    expect(adminAccess(auth, { 'x-authentik-username': ' ' })).toEqual({
      status: 'unauthenticated',
    });
    expect(adminAccess(auth, { 'x-authentik-username': 'gast' })).toEqual({
      status: 'forbidden',
    });
    expect(adminAccess(auth, user)).toEqual({
      status: 'ok',
      identity: { user: 'dominic', groups: ['jeopardy-admins', 'alle'] },
    });
    expect(adminAccess({ mode: 'dev', user: 'lokal' }, {})).toMatchObject({
      identity: { user: 'lokal' },
    });
  });

  it('registriert den Admin-Bereich nur bei eingeschalteter Anmeldung', async () => {
    const { app } = setup({ mode: 'off' });
    expect((await app.inject('/api/v1/admin/me')).statusCode).toBe(404);
    const secured = setup({ mode: 'forward-auth', groups: ['jeopardy-admins'] }).app;
    expect((await secured.inject('/api/v1/admin/me')).statusCode).toBe(401);
    expect(
      (await secured.inject({ url: '/api/v1/admin/me', headers: { 'x-authentik-username': 'x' } }))
        .statusCode,
    ).toBe(403);
    expect((await secured.inject({ url: '/api/v1/admin/me', headers: user })).json()).toEqual({
      user: 'dominic',
      groups: ['jeopardy-admins', 'alle'],
    });
  });
});

describe('Admin-API', () => {
  it('filtert Fragen und prüft Parameter', async () => {
    const { app, repository } = setup();
    const response = await app.inject({
      url: '/api/v1/admin/questions?topicId=it&q=%20dns%20&level=3&limit=10',
      headers: user,
    });
    expect(response.json()).toEqual({ total: 1, questions: [question] });
    expect(repository.questions).toHaveBeenCalledWith({
      topicId: 'it',
      level: 3,
      limit: 10,
      offset: 0,
      search: 'dns',
    });
    for (const query of ['level=10', 'limit=0', 'topicId=ung%C3%BCltig']) {
      const invalid = await app.inject({ url: `/api/v1/admin/questions?${query}`, headers: user });
      expect(invalid.statusCode).toBe(400);
    }
  });

  it('legt an, ändert und löscht mit Benutzer und passenden Statuscodes', async () => {
    const { app, repository } = setup();
    const base = '/api/v1/admin/topics/it/questions';
    const created = await app.inject({
      method: 'POST',
      url: base,
      headers: user,
      payload: { rubricId: 'netze', level: 3, question: ' Was ist DNS? ', answer: 'DNS' },
    });
    expect(created.statusCode).toBe(201);
    expect(repository.createQuestion).toHaveBeenCalledWith('dominic', 'it', {
      rubricId: 'netze',
      level: 3,
      question: 'Was ist DNS?',
      answer: 'DNS',
    });
    const update = {
      version: 'b'.repeat(64),
      rubricId: 'netze',
      level: 4,
      question: 'Frage',
      answer: 'Antwort',
      note: '',
      resetRating: false,
    };
    const stale = await app.inject({
      method: 'PUT',
      url: `${base}/dns`,
      headers: user,
      payload: update,
    });
    expect(stale.statusCode).toBe(409);
    vi.mocked(repository.updateQuestion).mockResolvedValueOnce({
      status: 'invalid',
      issues: ['rubrics.0.clues: zu wenige'],
    });
    const invalid = await app.inject({
      method: 'PUT',
      url: `${base}/dns`,
      headers: user,
      payload: update,
    });
    expect(invalid.statusCode).toBe(422);
    expect(invalid.json().issues).toEqual(['rubrics.0.clues: zu wenige']);
    const unknown = await app.inject({
      method: 'PUT',
      url: `${base}/dns`,
      headers: user,
      payload: { ...update, extra: true },
    });
    expect(unknown.statusCode).toBe(400);
    const removed = await app.inject({
      method: 'DELETE',
      url: `${base}/dns?version=${'c'.repeat(64)}`,
      headers: user,
    });
    expect(removed.statusCode).toBe(204);
    expect(repository.deleteQuestion).toHaveBeenCalledWith('dominic', 'it', 'dns', 'c'.repeat(64));
    expect(
      (await app.inject({ method: 'DELETE', url: `${base}/dns`, headers: user })).statusCode,
    ).toBe(400);
  });

  it('unterscheidet Testlauf und Ausführung und meldet Skriptfehler mit Zeile', async () => {
    const { app, repository } = setup();
    const payload = { sql: 'SELECT 1;', filename: 'test.sql' };
    await app.inject({ method: 'POST', url: '/api/v1/admin/sql/dry-run', headers: user, payload });
    await app.inject({ method: 'POST', url: '/api/v1/admin/sql/execute', headers: user, payload });
    expect(vi.mocked(repository.runSql).mock.calls).toEqual([
      ['dominic', payload, false],
      ['dominic', payload, true],
    ]);
    vi.mocked(repository.runSql).mockRejectedValueOnce(new SqlScriptError('kaputt', 3, 2));
    const failed = await app.inject({
      method: 'POST',
      url: '/api/v1/admin/sql/dry-run',
      headers: user,
      payload,
    });
    expect(failed.statusCode).toBe(400);
    expect(failed.json()).toEqual({ error: 'kaputt', line: 3, column: 2 });
    const empty = await app.inject({
      method: 'POST',
      url: '/api/v1/admin/sql/dry-run',
      headers: user,
      payload: { sql: '' },
    });
    expect(empty.statusCode).toBe(400);
  });

  it('liefert das Protokoll seitenweise und einzelne Einträge', async () => {
    const { app, repository } = setup();
    const list = await app.inject({ url: '/api/v1/admin/log?limit=5&before=10', headers: user });
    expect(list.json()).toEqual({ entries: [] });
    expect(repository.log).toHaveBeenCalledWith(5, 10);
    expect((await app.inject({ url: '/api/v1/admin/log/7', headers: user })).statusCode).toBe(404);
    expect((await app.inject({ url: '/api/v1/admin/log/x', headers: user })).statusCode).toBe(400);
  });

  it('meldet Datenbankfehler weiterhin als Dienstfehler', async () => {
    const { app, repository } = setup();
    vi.mocked(repository.topics).mockRejectedValueOnce(new Error('DB weg'));
    const response = await app.inject({ url: '/api/v1/admin/topics', headers: user });
    expect(response.statusCode).toBe(503);
    expect(response.json()).toEqual({ error: 'Fragen-Dienst nicht verfügbar.' });
  });
});
