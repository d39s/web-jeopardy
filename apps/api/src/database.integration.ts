import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, beforeEach, expect, it } from 'vitest';
import pg from 'pg';
import { samplePool } from '@jeopardy/game-core';
import type { QuestionPool } from '@jeopardy/game-core';
import { migrate, transaction } from './database';
import { importContent, readPools } from './import';
import { postgresRepository, writePool } from './repository';
import { buildApp } from './app';
import { postgresReviewRepository, questionVersion } from './review-repository';

if (!process.env.DATABASE_URL)
  throw new Error('test:db benötigt DATABASE_URL einer Testdatenbank.');
const connectionString = process.env.DATABASE_URL;
const schema = `test_${randomUUID().replaceAll('-', '')}`;
const admin = new pg.Pool({ connectionString });
const db = new pg.Pool({ connectionString, options: `-c search_path=${schema}` });

beforeAll(async () => {
  await admin.query(`CREATE SCHEMA ${schema}`);
  await migrate(db);
});
beforeEach(async () => {
  await db.query('TRUNCATE topics, content_imports, difficulty_votes CASCADE');
});
it('rundet die Spielstufe nach mehreren Stimmen und begrenzt den Score auf 1 bis 9', async () => {
  const library = postgresRepository(db);
  await library.save(samplePool);
  const rubric = samplePool.rubrics[0]!;
  const clue = rubric.clues[0]!;
  const reviews = postgresReviewRepository(db);
  const version = questionVersion({
    question: clue.question,
    answer: clue.answer,
    source_level: clue.level,
  });
  await db.query(
    'UPDATE questions SET difficulty_score = 3, level = 3 WHERE topic_id = $1 AND id = $2',
    [samplePool.id, clue.id],
  );
  for (let i = 0; i < 3; i++) {
    await reviews.vote(samplePool.id, clue.id, {
      requestId: randomUUID(),
      version,
      verdict: 'too-hard',
    });
  }
  expect((await library.pool(samplePool.id))!.rubrics[0]!.clues[0]!.level).toBe(4);
  for (const [score, verdict] of [
    [9, 'too-hard'],
    [1, 'too-easy'],
  ] as const) {
    await db.query(
      'UPDATE questions SET difficulty_score = $3::numeric, level = $3::numeric::smallint WHERE topic_id = $1 AND id = $2',
      [samplePool.id, clue.id, score],
    );
    expect(
      await reviews.vote(samplePool.id, clue.id, { requestId: randomUUID(), version, verdict }),
    ).toMatchObject({ status: 'ok', rating: { score, level: score } });
  }
});

it('bewertet atomar, verhindert Doppelzählung und erhält Scores bei unverändertem Poolimport', async () => {
  const library = postgresRepository(db);
  const reviews = postgresReviewRepository(db);
  await library.save(samplePool);
  const initial = await reviews.random();
  expect(initial).not.toBeNull();
  expect((await reviews.random(undefined, undefined, samplePool.id))!.topicId).toBe(samplePool.id);
  expect(await reviews.random(undefined, undefined, 'missing')).toBeNull();
  const question = initial!;
  const excluded = await reviews.random(question.topicId, question.id);
  expect([excluded!.topicId, excluded!.id]).not.toEqual([question.topicId, question.id]);
  const vote = { requestId: randomUUID(), version: question.version, verdict: 'too-hard' as const };
  const first = await reviews.vote(question.topicId, question.id, vote);
  expect(first).toMatchObject({
    status: 'ok',
    rating: { score: Math.min(9, question.score + 0.2), votes: 1 },
  });
  expect(await reviews.vote(question.topicId, question.id, vote)).toEqual(first);
  expect(
    await reviews.vote(question.topicId, question.id, { ...vote, verdict: 'too-easy' }),
  ).toEqual({ status: 'conflict' });
  expect(
    await reviews.vote(question.topicId, question.id, {
      ...vote,
      requestId: randomUUID(),
      version: '0'.repeat(64),
    }),
  ).toEqual({ status: 'stale' });
  expect(await reviews.vote('missing', 'missing', vote)).toEqual({ status: 'missing' });

  await Promise.all(
    Array.from({ length: 3 }, () =>
      reviews.vote(question.topicId, question.id, {
        ...vote,
        requestId: randomUUID(),
        verdict: 'too-easy',
      }),
    ),
  );
  const unsure = await reviews.vote(question.topicId, question.id, {
    ...vote,
    requestId: randomUUID(),
    verdict: 'unsure',
  });
  const fits = await reviews.vote(question.topicId, question.id, {
    ...vote,
    requestId: randomUUID(),
    verdict: 'fits',
  });
  expect(unsure).toMatchObject({ status: 'ok', rating: { votes: 5 } });
  expect(fits).toMatchObject({ status: 'ok', rating: { votes: 6 } });

  const source = (await readPools()).find((pool) => pool.id === question.topicId) ?? samplePool;
  await library.save(source);
  const row = await db.query(
    'SELECT difficulty_score, fits_votes, too_hard_votes, too_easy_votes, unsure_votes FROM questions WHERE topic_id = $1 AND id = $2',
    [question.topicId, question.id],
  );
  expect(row.rows[0]).toMatchObject({
    fits_votes: 1,
    too_hard_votes: 1,
    too_easy_votes: 3,
    unsure_votes: 1,
  });
  if (fits.status === 'ok') expect(Number(row.rows[0].difficulty_score)).toBe(fits.rating.score);

  const changed: QuestionPool = {
    ...source,
    rubrics: source.rubrics.map((rubric) => ({
      ...rubric,
      clues: rubric.clues.map((clue) =>
        clue.id === question.id ? { ...clue, question: `${clue.question} (korrigiert)` } : clue,
      ),
    })),
  };
  await library.save(changed);
  expect(
    await reviews.vote(question.topicId, question.id, { ...vote, requestId: randomUUID() }),
  ).toEqual({ status: 'stale' });
  const reset = await db.query(
    'SELECT fits_votes, too_hard_votes FROM questions WHERE topic_id = $1 AND id = $2',
    [question.topicId, question.id],
  );
  expect(reset.rows[0]).toEqual({ fits_votes: 0, too_hard_votes: 0 });
});
afterAll(async () => {
  await db.end();
  try {
    await admin.query(`DROP SCHEMA IF EXISTS ${schema} CASCADE`);
  } finally {
    await admin.end();
  }
});

it('migriert idempotent, importiert verlustfrei und überschreibt beim Neustart nichts', async () => {
  await migrate(db);
  await importContent(db, true);
  const originals = await readPools();
  const repository = postgresRepository(db);
  const index = await repository.index();
  expect(index.categories.map((entry) => entry.id)).toEqual(originals.map((pool) => pool.id));
  for (const pool of originals) expect(await repository.pool(pool.id)).toEqual(pool);

  const changed = { ...originals[0]!, title: 'In der Datenbank gepflegt' };
  await repository.save(changed);
  await importContent(db, true);
  expect(await repository.pool(changed.id)).toEqual(changed);

  // Neue Verbindung simuliert einen API-Neustart; Sortierung und Inhalte bleiben stabil.
  const restarted = new pg.Pool({ connectionString, options: `-c search_path=${schema}` });
  try {
    expect(await postgresRepository(restarted).pool(changed.id)).toEqual(changed);
  } finally {
    await restarted.end();
  }

  // Constraintfehler müssen die gesamte Pool-Ersetzung zurückrollen.
  // Absichtlich an der API-Validierung vorbei, um den SQL-CHECK zu testen.
  const broken = {
    ...changed,
    rubrics: changed.rubrics.map((rubric, i) =>
      i === 0
        ? {
            ...rubric,
            clues: rubric.clues.map((clue, j) => (j === 0 ? { ...clue, level: 99 } : clue)),
          }
        : rubric,
    ),
  } as unknown as QuestionPool;
  await expect(transaction(db, (client) => writePool(client, broken))).rejects.toThrow();
  expect(await repository.pool(changed.id)).toEqual(changed);

  await repository.save(samplePool);
  expect(await repository.pool(samplePool.id)).toEqual(samplePool);
  expect(await repository.pool('fehlt')).toBeNull();
  await importContent(db);
  expect(await repository.pool(changed.id)).toEqual(originals[0]);
  expect(await repository.pool(samplePool.id)).toEqual(samplePool);

  const app = buildApp(repository);
  try {
    expect((await app.inject('/api/v1/health')).statusCode).toBe(200);
    const response = await app.inject(`/api/v1/pools/${originals[0]!.id}.json`);
    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual(originals[0]);
  } finally {
    await app.close();
  }
});
