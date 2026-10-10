import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { afterAll, beforeAll, beforeEach, expect, it } from 'vitest';
import pg from 'pg';
import { DIFFICULTIES, drawBoard, samplePool, validateQuestionPool } from '@jeopardy/game-core';
import type { QuestionPool } from '@jeopardy/game-core';
import { migrate } from './database';
import { postgresRepository } from './repository';
import { postgresReviewRepository, questionVersion } from './review-repository';

if (!process.env.DATABASE_URL)
  throw new Error('SQL-Vorlagentest benötigt DATABASE_URL einer Test-DB.');
const schema = `sql_test_${randomUUID().replaceAll('-', '')}`;
const admin = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const db = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  options: `-c search_path=${schema}`,
});
const template = await readFile(
  new URL(
    '../../../.github/skills/create-jeopardy-questions/assets/add-content.sql',
    import.meta.url,
  ),
  'utf8',
);

// Kein Produktionsimport: Jeder Test arbeitet nur in einem eigenen temporären Schema.
beforeAll(async () => {
  await admin.query(`CREATE SCHEMA ${schema}`);
  await migrate(db);
});
beforeEach(async () => {
  await db.query('TRUNCATE topics, difficulty_votes CASCADE');
});
afterAll(async () => {
  await db.end();
  try {
    await admin.query(`DROP SCHEMA IF EXISTS ${schema} CASCADE`);
  } finally {
    await admin.end();
  }
});

function literal(value: string | number | undefined): string {
  return value === undefined
    ? 'NULL'
    : typeof value === 'number'
      ? String(value)
      : `'${value.replaceAll("'", "''")}'`;
}
function delivery(pool: QuestionPool, extra = ''): string {
  const topics = `INSERT INTO input_topics (id, title, description, author, locale) VALUES (${[pool.id, pool.title, pool.description, pool.author, pool.locale].map(literal).join(',')});`;
  const rubrics = pool.rubrics
    .map(
      (rubric) =>
        `INSERT INTO input_rubrics (topic_id, id, name, color) VALUES (${[pool.id, rubric.id, rubric.name, rubric.color].map(literal).join(',')});`,
    )
    .join('\n');
  const questions = pool.rubrics
    .flatMap((rubric) =>
      rubric.clues.map(
        (clue) =>
          `INSERT INTO input_questions (topic_id, rubric_id, id, source_level, question, answer, note) VALUES (${[pool.id, rubric.id, clue.id, clue.level, clue.question, clue.answer, clue.note].map(literal).join(',')});`,
      ),
    )
    .join('\n');
  return template
    .replace('-- INPUT_TOPICS:', `${topics}\n-- INPUT_TOPICS:`)
    .replace('-- INPUT_RUBRICS:', `${rubrics}\n-- INPUT_RUBRICS:`)
    .replace('-- INPUT_QUESTIONS:', `${questions}\n${extra}\n-- INPUT_QUESTIONS:`);
}
async function execute(sql: string) {
  const client = await db.connect();
  try {
    await client.query(sql);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
async function snapshot() {
  return (
    await db.query(
      `SELECT jsonb_agg(to_jsonb(q) ORDER BY q.topic_id, q.rubric_id, q.position) AS data FROM questions q`,
    )
  ).rows[0]?.data;
}

it('SQL-Vorlage erzeugt spielbare Pools und bleibt wiederholbar mit unveränderten Bewertungen', async () => {
  const sql = delivery(samplePool);
  await execute(sql);
  const library = postgresRepository(db);
  expect(await library.pool(samplePool.id)).toEqual(samplePool);
  const result = validateQuestionPool(await library.pool(samplePool.id));
  expect(result.ok).toBe(true);
  for (const level of DIFFICULTIES)
    expect(drawBoard({ pool: samplePool, level, seed: 123 }).ok).toBe(true);
  const clue = samplePool.rubrics[0]!.clues[0]!;
  await postgresReviewRepository(db).vote(samplePool.id, clue.id, {
    requestId: randomUUID(),
    verdict: 'too-hard',
    version: questionVersion({
      question: clue.question,
      answer: clue.answer,
      source_level: clue.level,
    }),
  });
  const before = await snapshot();
  await execute(sql);
  expect(await snapshot()).toEqual(before);

  // Append nach vorhandenen Positionen; kein vollständiger Pool nötig für die Lieferung.
  const rubric = samplePool.rubrics[0]!;
  const addition = template.replace(
    '-- INPUT_QUESTIONS:',
    `INSERT INTO input_questions (topic_id,rubric_id,id,source_level,question,answer,note)
    VALUES ('${samplePool.id}','${rubric.id}','sql-new-question',3,'Wie lautet O''Briens Testfrage?','SQL-Testantwort',NULL);\n-- INPUT_QUESTIONS:`,
  );
  await execute(addition);
  const appended = await db.query(
    'SELECT position, source_level, difficulty_score, fits_votes FROM questions WHERE topic_id = $1 AND id = $2',
    [samplePool.id, 'sql-new-question'],
  );
  expect(appended.rows[0]).toEqual({
    position: rubric.clues.length,
    source_level: 3,
    difficulty_score: '3.0',
    fits_votes: 0,
  });
  const after = await snapshot();
  await execute(addition);
  expect(await snapshot()).toEqual(after);
});

it('identische Texte dürfen unabhängig mit neuen IDs ergänzt werden und bleiben spielbar', async () => {
  await execute(delivery(samplePool));
  const rubric = samplePool.rubrics[0]!;
  const clue = rubric.clues[0]!;
  const sql = template.replace(
    '-- INPUT_QUESTIONS:',
    `INSERT INTO input_questions (topic_id,rubric_id,id,source_level,question,answer)
    VALUES (${[samplePool.id, rubric.id, 'independent-delivery-001', clue.level, clue.question, clue.answer].map(literal).join(',')});\n-- INPUT_QUESTIONS:`,
  );
  await execute(sql);
  const pool = await postgresRepository(db).pool(samplePool.id);
  expect(validateQuestionPool(pool).ok).toBe(true);
  expect(
    pool!.rubrics[0]!.clues.filter(
      (entry) => entry.question === clue.question && entry.answer === clue.answer,
    ),
  ).toHaveLength(2);
  for (const level of DIFFICULTIES) {
    const drawn = drawBoard({ pool: pool!, level, seed: 321 });
    expect(drawn.ok).toBe(true);
    if (drawn.ok) {
      const ids = drawn.definition.categories.flatMap((category) =>
        category.clues.map((entry) => entry.id),
      );
      expect(new Set(ids).size).toBe(25);
    }
  }
  const before = await snapshot();
  await execute(sql);
  expect(await snapshot()).toEqual(before);
});

it('leere, unvollständige und kollidierende SQL-Lieferungen rollen vollständig zurück', async () => {
  await expect(execute(template)).rejects.toThrow('Keine Fragen geliefert');
  await expect(
    execute(delivery({ ...samplePool, rubrics: samplePool.rubrics.slice(0, 1) })),
  ).rejects.toThrow('Pool unvollstaendig');
  expect((await db.query('SELECT COUNT(*) FROM topics')).rows[0].count).toBe('0');
  await execute(delivery(samplePool));
  const before = await snapshot();
  await expect(execute(delivery({ ...samplePool, title: 'Anderer Inhalt' }))).rejects.toThrow(
    'ID-Konflikt',
  );
  await expect(
    execute(
      delivery(
        samplePool,
        `INSERT INTO input_questions (topic_id,rubric_id,id,source_level,question,answer) VALUES ('${samplePool.id}','${samplePool.rubrics[0]!.id}','${samplePool.rubrics[0]!.id}',1,'Neue Frage','Neue Antwort');`,
      ),
    ),
  ).rejects.toThrow('ueberschneiden');
  expect(await snapshot()).toEqual(before);
});
