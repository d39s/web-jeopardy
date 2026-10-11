import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { afterAll, beforeAll, beforeEach, expect, it } from 'vitest';
import pg from 'pg';
import { samplePool, validateQuestionPool } from '@jeopardy/game-core';
import type { QuestionPool } from '@jeopardy/game-core';
import { migrate } from '../database';
import { postgresRepository } from '../repository';
import { postgresAdminRepository } from './admin-repository';
import { SqlScriptError } from './sql-script';

if (!process.env.DATABASE_URL)
  throw new Error('Admin-Integrationstest benötigt DATABASE_URL einer Test-DB.');
const schema = `admin_test_${randomUUID().replaceAll('-', '')}`;
const owner = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const db = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  options: `-c search_path=${schema}`,
});
const template = await readFile(
  new URL(
    '../../../../.github/skills/create-jeopardy-questions/assets/add-content.sql',
    import.meta.url,
  ),
  'utf8',
);
const admin = postgresAdminRepository(db);
const library = postgresRepository(db);

/** Pool, dessen erste Rubrik genau die Mindestzahl an Fragen hat. */
const tightPool: QuestionPool = {
  ...samplePool,
  rubrics: samplePool.rubrics.map((rubric, index) =>
    index === 0 ? { ...rubric, clues: rubric.clues.slice(0, 5) } : rubric,
  ),
};

beforeAll(async () => {
  await owner.query(`CREATE SCHEMA ${schema}`);
  await migrate(db);
});
beforeEach(async () => {
  await db.query('TRUNCATE topics, difficulty_votes, admin_log CASCADE');
  await library.save(tightPool);
});
afterAll(async () => {
  await db.end();
  try {
    await owner.query(`DROP SCHEMA IF EXISTS ${schema} CASCADE`);
  } finally {
    await owner.end();
  }
});

async function logActions() {
  return (await admin.log(50)).map((entry) => [entry.actor, entry.action, entry.target]);
}

it('listet Themen und Fragen mit Filtern, Suche und Seiten', async () => {
  const [topic] = await admin.topics();
  expect(topic).toMatchObject({ id: 'testpool', questionCount: 5 + 5 * 18 });
  expect(topic!.rubrics[0]).toEqual({ id: 'rubrik-a', name: 'Rubrik A', questionCount: 5 });
  const all = await admin.questions({ topicId: 'testpool', limit: 10, offset: 0 });
  expect(all.total).toBe(95);
  expect(all.questions).toHaveLength(10);
  expect(all.questions[0]).toMatchObject({ rubricId: 'rubrik-a', rubricName: 'Rubrik A' });
  const page = await admin.questions({ topicId: 'testpool', limit: 10, offset: 90 });
  expect(page).toMatchObject({ total: 95 });
  expect(page.questions).toHaveLength(5);
  const found = await admin.questions({ search: 'B 4.2', limit: 50, offset: 0 });
  expect(found.questions.map((question) => question.id)).toEqual(['rubrik-b-4-2']);
  expect((await admin.questions({ search: '%', limit: 50, offset: 0 })).total).toBe(0);
  const level = await admin.questions({ rubricId: 'rubrik-c', level: 9, limit: 50, offset: 0 });
  expect(level.questions.map((question) => question.id)).toEqual(['rubrik-c-9-1', 'rubrik-c-9-2']);
});

it('legt Fragen an, ändert sie mit Versionsprüfung und protokolliert jeden Schritt', async () => {
  const created = await admin.createQuestion('anna', 'testpool', {
    rubricId: 'rubrik-a',
    level: 4,
    question: 'Neue Frage?',
    answer: 'Neue Antwort',
  });
  expect(created).toMatchObject({ status: 'ok', question: { score: 4, sourceLevel: 4 } });
  const question = created.status === 'ok' ? created.question! : null!;
  expect(question.id).toMatch(/^rubrik-a-[a-f0-9]{8}$/);
  expect(
    await admin.createQuestion('anna', 'testpool', { ...question, id: 'rubrik-b' }),
  ).toMatchObject({ status: 'conflict' });
  expect(
    await admin.createQuestion('anna', 'testpool', { ...question, rubricId: 'fehlt' }),
  ).toEqual({ status: 'missing' });

  // Bewertete Frage: Textkorrektur behält den Score, Stufenänderung setzt ihn zurück.
  await db.query(
    `UPDATE questions SET difficulty_score = 5.4, level = 5, too_hard_votes = 7
     WHERE topic_id = 'testpool' AND id = $1`,
    [question.id],
  );
  const [rated] = (await admin.questions({ search: 'Neue Frage', limit: 1, offset: 0 })).questions;
  const edit = {
    version: rated!.version,
    rubricId: 'rubrik-a',
    level: 4,
    question: 'Korrigierte Frage?',
    answer: 'Neue Antwort',
    note: 'Hinweis',
    resetRating: false,
  };
  const fixed = await admin.updateQuestion('bert', 'testpool', question.id, edit);
  expect(fixed).toMatchObject({
    status: 'ok',
    question: { question: 'Korrigierte Frage?', note: 'Hinweis', score: 5.4, level: 5 },
  });
  expect(await admin.updateQuestion('bert', 'testpool', question.id, edit)).toEqual({
    status: 'stale',
  });
  const current = fixed.status === 'ok' ? fixed.question! : null!;
  const moved = await admin.updateQuestion('bert', 'testpool', question.id, {
    ...edit,
    version: current.version,
    rubricId: 'rubrik-b',
    level: 6,
    note: '',
  });
  expect(moved).toMatchObject({
    status: 'ok',
    question: { rubricId: 'rubrik-b', score: 6, level: 6, votes: { tooHard: 0 } },
  });
  expect(moved.status === 'ok' && moved.question!.note).toBeUndefined();
  const pool = (await library.pool('testpool'))!;
  expect(pool.rubrics[1]!.clues.at(-1)!.id).toBe(question.id);
  expect(validateQuestionPool(pool).ok).toBe(true);

  const final = moved.status === 'ok' ? moved.question! : null!;
  expect(await admin.deleteQuestion('carla', 'testpool', question.id, 'f'.repeat(64))).toEqual({
    status: 'stale',
  });
  expect(await admin.deleteQuestion('carla', 'testpool', question.id, final.version)).toEqual({
    status: 'ok',
  });
  expect(await admin.deleteQuestion('carla', 'testpool', question.id, final.version)).toEqual({
    status: 'missing',
  });
  expect(await logActions()).toEqual([
    ['carla', 'question.delete', `testpool/${question.id}`],
    ['bert', 'question.update', `testpool/${question.id}`],
    ['bert', 'question.update', `testpool/${question.id}`],
    ['anna', 'question.create', `testpool/${question.id}`],
  ]);
  const [deleted] = await admin.log(1);
  expect(deleted!.detail).toMatchObject({ before: { question: 'Korrigierte Frage?' } });
});

it('verhindert Änderungen, die den Pool unspielbar machen, und rollt sie zurück', async () => {
  const [first] = (await admin.questions({ rubricId: 'rubrik-a', limit: 1, offset: 0 })).questions;
  const result = await admin.deleteQuestion('anna', 'testpool', first!.id, first!.version);
  expect(result).toMatchObject({ status: 'invalid' });
  expect(result.status === 'invalid' && result.issues[0]).toContain('mindestens 5 Fragen');
  const moved = await admin.updateQuestion('anna', 'testpool', first!.id, {
    version: first!.version,
    rubricId: 'rubrik-b',
    level: first!.sourceLevel,
    question: first!.question,
    answer: first!.answer,
    note: '',
    resetRating: false,
  });
  expect(moved).toMatchObject({ status: 'invalid' });
  expect((await library.pool('testpool'))!.rubrics[0]!.clues).toHaveLength(5);
  expect(await logActions()).toEqual([]);
});

function delivery(id: string, rubrics: number): string {
  const values = (rows: string[]) => rows.join(',\n');
  return template
    .replace(
      '-- INPUT_TOPICS:',
      `INSERT INTO input_topics (id, title, description, author, locale) VALUES ('${id}', 'Neues Thema', NULL, NULL, 'de-DE');\n-- INPUT_TOPICS:`,
    )
    .replace(
      '-- INPUT_RUBRICS:',
      `INSERT INTO input_rubrics (topic_id, id, name, color) VALUES ${values(
        Array.from({ length: rubrics }, (_, r) => `('${id}', 'r${r}', 'Rubrik ${r}', NULL)`),
      )};\n-- INPUT_RUBRICS:`,
    )
    .replace(
      '-- INPUT_QUESTIONS:',
      `INSERT INTO input_questions (topic_id, rubric_id, id, source_level, question, answer, note) VALUES ${values(
        Array.from({ length: rubrics * 5 }, (_, q) => {
          const r = Math.floor(q / 5);
          return `('${id}', 'r${r}', 'q${q}', ${(q % 5) + 1}, 'Frage ${q}; mit ''Zitat''?', 'Antwort ${q}', NULL)`;
        }),
      )};\n-- INPUT_QUESTIONS:`,
    );
}

it('Testlauf zeigt Änderungen ohne sie festzuschreiben, Ausführung schreibt sie mit Protokoll', async () => {
  const sql = delivery('neu', 5);
  const dry = await admin.runSql('anna', { sql, filename: 'neu.sql' }, false);
  expect(dry).toMatchObject({
    ok: true,
    committed: false,
    counts: {
      before: { topics: 1, questions: 95 },
      after: { topics: 2, rubrics: 11, questions: 120 },
    },
    topics: [
      { id: 'neu', title: 'Neues Thema', before: { questions: 0 }, after: { questions: 25 } },
    ],
    issues: [],
  });
  expect(dry.statements.map((statement) => statement.command)).toContain('INSERT');
  expect(dry.sha256).toMatch(/^[a-f0-9]{64}$/);
  expect(await library.pool('neu')).toBeNull();
  expect(await logActions()).toEqual([]);

  const run = await admin.runSql('anna', { sql, filename: 'neu.sql' }, true);
  expect(run).toMatchObject({ ok: true, committed: true });
  expect(validateQuestionPool(await library.pool('neu')).ok).toBe(true);
  const [entry] = await admin.log(1);
  expect(entry).toMatchObject({ actor: 'anna', action: 'sql.execute', target: 'neu.sql' });
  expect(entry!.detail).not.toHaveProperty('sql');
  expect((await admin.logEntry(entry!.id))!.detail).toMatchObject({ sql, sha256: run.sha256 });

  // Wiederholung der Lieferung ändert nichts.
  const again = await admin.runSql('anna', { sql }, false);
  expect(again).toMatchObject({ ok: true, topics: [] });
});

it('zeigt Abfrageergebnisse und Hinweise, ohne Sitzungszustand weiterzugeben', async () => {
  const result = await admin.runSql(
    'anna',
    {
      sql: `SET application_name = 'admin-skript';
        DO $$ BEGIN RAISE NOTICE 'Hallo %', 'Welt'; END $$;
        SELECT id, level, note FROM questions WHERE rubric_id = 'rubrik-a' ORDER BY position;`,
    },
    true,
  );
  expect(result).toMatchObject({ ok: true, committed: true, notices: ['NOTICE: Hallo Welt'] });
  expect(result.statements.at(-1)).toMatchObject({
    command: 'SELECT',
    rowCount: 5,
    columns: ['id', 'level', 'note'],
  });
  expect(result.statements.at(-1)!.rows![0]).toEqual(['rubrik-a-1-1', '1', null]);
  const sessions = await Promise.all(
    Array.from({ length: 5 }, () =>
      db.query<{ name: string }>('SELECT current_setting($1) AS name', ['application_name']),
    ),
  );
  expect(sessions.map((session) => session.rows[0]!.name)).not.toContain('admin-skript');
});

it('rollt fehlerhafte Skripte vollständig zurück und nennt die Zeile', async () => {
  const syntax = await admin.runSql(
    'anna',
    { sql: "BEGIN;\nDELETE FROM questions WHERE rubric_id = 'rubrik-f';\nSELEKT 1;\nCOMMIT;" },
    true,
  );
  expect(syntax).toMatchObject({
    ok: false,
    committed: false,
    error: { line: 3, column: 1 },
    counts: { after: { questions: 95 } },
  });
  expect(syntax.error!.message).toContain('SELEKT');

  const failing = await admin.runSql(
    'anna',
    { sql: "DELETE FROM questions WHERE rubric_id = 'rubrik-f';\nSELECT 1 / 0;" },
    true,
  );
  expect(failing).toMatchObject({ ok: false, error: { message: 'division by zero' } });

  // Template-eigene Prüfung schlägt mit RAISE EXCEPTION fehl.
  const incomplete = await admin.runSql('anna', { sql: delivery('halb', 2) }, true);
  expect(incomplete.error!.message).toContain('Pool unvollstaendig');

  // Neue Pool-Probleme blockieren die Ausführung, auch wenn das SQL selbst gelingt.
  const broken = await admin.runSql(
    'anna',
    { sql: "DELETE FROM questions WHERE rubric_id = 'rubrik-a' AND position = 0;" },
    true,
  );
  expect(broken).toMatchObject({ ok: false, committed: false, issues: [{ topicId: 'testpool' }] });
  expect(broken.error).toBeUndefined();
  await expect(admin.runSql('anna', { sql: 'SELECT 1; COMMIT; SELECT 2;' }, true)).rejects.toThrow(
    SqlScriptError,
  );
  expect((await library.pool('testpool'))!.rubrics).toHaveLength(6);
  expect((await library.pool('testpool'))!.rubrics[0]!.clues).toHaveLength(5);
  expect(await logActions()).toEqual([]);
});
