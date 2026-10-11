import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, beforeEach, expect, it } from 'vitest';
import pg from 'pg';
import { samplePool } from '@jeopardy/game-core';
import type { QuestionPool } from '@jeopardy/game-core';
import { migrate } from './database';
import { postgresRepository, readPool } from './repository';
import { postgresReportRepository } from './report-repository';
import { postgresReviewRepository } from './review-repository';
import { postgresAdminRepository } from './admin/admin-repository';

if (!process.env.DATABASE_URL)
  throw new Error('test:db benötigt DATABASE_URL einer Testdatenbank.');
const connectionString = process.env.DATABASE_URL;
const schema = `report_test_${randomUUID().replaceAll('-', '')}`;
const owner = new pg.Pool({ connectionString });
const db = new pg.Pool({ connectionString, options: `-c search_path=${schema}` });
const library = postgresRepository(db);
const reports = postgresReportRepository(db);
const admin = postgresAdminRepository(db);

/** Erste Rubrik mit genau der Mindestzahl an Fragen, die übrigen voll. */
const tightPool: QuestionPool = {
  ...samplePool,
  rubrics: samplePool.rubrics.map((rubric, index) =>
    index === 0 ? { ...rubric, clues: rubric.clues.slice(0, 5) } : rubric,
  ),
};
const tight = tightPool.rubrics[0]!;
const full = tightPool.rubrics[1]!;

beforeAll(async () => {
  await owner.query(`CREATE SCHEMA ${schema}`);
  await migrate(db);
});
beforeEach(async () => {
  await db.query('TRUNCATE topics, question_reports, admin_log CASCADE');
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

function report(id: string, comment?: string) {
  return reports.report(tightPool.id, id, {
    requestId: randomUUID(),
    source: 'game',
    ...(comment ? { comment } : {}),
  });
}

it('nimmt gemeldete Fragen aus neuen Spielen, bis die Meldung aufgehoben ist', async () => {
  const clue = full.clues[0]!;
  const requestId = randomUUID();
  const request = { requestId, source: 'review' as const, comment: 'Antwort veraltet' };
  expect(await reports.report(tightPool.id, clue.id, request)).toEqual({ status: 'ok' });
  // Dieselbe Anfrage erneut: keine zweite Meldung.
  expect(await reports.report(tightPool.id, clue.id, request)).toEqual({ status: 'ok' });
  expect(
    await reports.report(tightPool.id, 'gibt-es-nicht', { ...request, requestId: randomUUID() }),
  ).toEqual({
    status: 'missing',
  });
  await report(clue.id);

  const playable = (await library.pool(tightPool.id))!;
  const ids = playable.rubrics.flatMap((rubric) => rubric.clues.map((entry) => entry.id));
  expect(ids).not.toContain(clue.id);
  expect(ids).toHaveLength(tightPool.rubrics.flatMap((rubric) => rubric.clues).length - 1);
  // Redaktionelle Sicht und Admin-Prüfungen sehen weiterhin alles.
  expect(await readPool(db, tightPool.id)).toEqual(tightPool);

  const [entry, ...rest] = await admin.reports();
  expect(rest).toEqual([]);
  expect(entry).toMatchObject({
    topicId: tightPool.id,
    questionId: clue.id,
    topicTitle: tightPool.title,
    question: { id: clue.id, openReports: 2 },
  });
  expect(entry!.reports.map((item) => [item.source, item.comment, item.question])).toEqual([
    ['game', undefined, clue.question],
    ['review', 'Antwort veraltet', clue.question],
  ]);

  // Eine später eingegangene Meldung bleibt offen.
  const [newest, older] = entry!.reports;
  await report(clue.id, 'noch eine');
  expect(await admin.resolveReports('dominic', tightPool.id, clue.id, newest!.id)).toMatchObject({
    status: 'ok',
    question: { openReports: 1 },
  });
  expect((await admin.reports())[0]!.reports.map((item) => item.comment)).toEqual(['noch eine']);
  const latest = (await admin.reports())[0]!.reports[0]!.id;
  await admin.resolveReports('dominic', tightPool.id, clue.id, latest);
  expect(await admin.reports()).toEqual([]);
  expect(
    (await library.pool(tightPool.id))!.rubrics.flatMap((rubric) => rubric.clues.map((e) => e.id)),
  ).toContain(clue.id);
  expect(await admin.resolveReports('dominic', tightPool.id, clue.id, latest)).toMatchObject({
    status: 'conflict',
  });
  const log = await admin.log(10);
  expect(log.map((item) => [item.action, item.target, item.detail])).toEqual([
    ['question.unflag', `${tightPool.id}/${clue.id}`, { reports: [latest] }],
    ['question.unflag', `${tightPool.id}/${clue.id}`, { reports: [older!.id, newest!.id] }],
  ]);
});

it('lässt Rubriken aus, die ohne gemeldete Fragen keine volle Spalte mehr füllen', async () => {
  await report(tight.clues[0]!.id);
  const playable = (await library.pool(tightPool.id))!;
  expect(playable.rubrics.map((rubric) => rubric.id)).toEqual(
    tightPool.rubrics.slice(1).map((rubric) => rubric.id),
  );
});

it('übergeht gemeldete Fragen im Bewertungsmodus', async () => {
  const reviews = postgresReviewRepository(db);
  const keep = full.clues[0]!;
  for (const rubric of tightPool.rubrics)
    for (const clue of rubric.clues) if (clue.id !== keep.id) await report(clue.id);
  for (let i = 0; i < 5; i++) expect((await reviews.random())?.id).toBe(keep.id);
  await report(keep.id);
  expect(await reviews.random()).toBeNull();
});

it('erhält Meldungen beim Poolimport und erledigt sie beim Löschen der Frage', async () => {
  const clue = full.clues[0]!;
  await report(clue.id);
  await library.save(tightPool);
  const [entry] = await admin.reports();
  expect(entry?.question?.openReports).toBe(1);

  expect(
    await admin.deleteQuestion('dominic', tightPool.id, clue.id, entry!.question!.version),
  ).toEqual({ status: 'ok' });
  expect(await admin.reports()).toEqual([]);
  const [log] = await admin.log(1);
  expect(log).toMatchObject({
    action: 'question.delete',
    detail: { resolvedReports: [entry!.reports[0]!.id] },
  });
});

it('zeigt Meldungen zu Fragen, die es nicht mehr gibt', async () => {
  const clue = full.clues[0]!;
  await report(clue.id);
  await db.query('DELETE FROM questions WHERE topic_id = $1 AND id = $2', [tightPool.id, clue.id]);
  const [entry] = await admin.reports();
  expect(entry).toMatchObject({ questionId: clue.id, reports: [{ question: clue.question }] });
  expect(entry!.question).toBeUndefined();
  expect(
    await admin.resolveReports('dominic', tightPool.id, clue.id, entry!.reports[0]!.id),
  ).toEqual({ status: 'ok' });
});
