import type { QuestionPool, TopicIndex } from '@jeopardy/game-core';
import type { Pool, PoolClient } from 'pg';
import { transaction } from './database';

export interface ContentRepository {
  health(): Promise<void>;
  index(): Promise<TopicIndex>;
  pool(id: string): Promise<QuestionPool | null>;
  save(pool: QuestionPool): Promise<void>;
}

/** Wird nur mit einem schemageprüften Pool innerhalb einer Transaktion aufgerufen. */
export async function writePool(client: PoolClient, pool: QuestionPool): Promise<void> {
  const previous = await client.query<{
    id: string;
    question: string;
    answer: string;
    source_level: number;
    difficulty_score: string;
    level: number;
    fits_votes: number;
    too_hard_votes: number;
    too_easy_votes: number;
    unsure_votes: number;
  }>('SELECT * FROM questions WHERE topic_id = $1', [pool.id]);
  const ratings = new Map(previous.rows.map((row) => [row.id, row]));
  await client.query(
    `INSERT INTO topics(id, title, description, author, locale, position)
     VALUES ($1, $2, $3, $4, $5, (SELECT COALESCE(MAX(position) + 1, 0) FROM topics))
     ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title,
       description = EXCLUDED.description, author = EXCLUDED.author, locale = EXCLUDED.locale`,
    [pool.id, pool.title, pool.description ?? null, pool.author ?? null, pool.locale ?? null],
  );
  await client.query('DELETE FROM rubrics WHERE topic_id = $1', [pool.id]);
  for (const [position, rubric] of pool.rubrics.entries()) {
    await client.query(
      'INSERT INTO rubrics(topic_id, id, name, color, position) VALUES ($1, $2, $3, $4, $5)',
      [pool.id, rubric.id, rubric.name, rubric.color ?? null, position],
    );
    for (const [cluePosition, clue] of rubric.clues.entries()) {
      const old = ratings.get(clue.id);
      // Unveränderte Fragen behalten ihre Bewertungen auch bei erneutem JSON-Import.
      const keep =
        old?.question === clue.question &&
        old.answer === clue.answer &&
        old.source_level === clue.level;
      await client.query(
        `INSERT INTO questions(topic_id, rubric_id, id, level, question, answer, note, position,
           source_level, difficulty_score, fits_votes, too_hard_votes, too_easy_votes, unsure_votes)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
        [
          pool.id,
          rubric.id,
          clue.id,
          keep ? old.level : clue.level,
          clue.question,
          clue.answer,
          clue.note ?? null,
          cluePosition,
          clue.level,
          keep ? old.difficulty_score : clue.level,
          keep ? old.fits_votes : 0,
          keep ? old.too_hard_votes : 0,
          keep ? old.too_easy_votes : 0,
          keep ? old.unsure_votes : 0,
        ],
      );
    }
  }
}

export function postgresRepository(db: Pool): ContentRepository {
  return {
    async health() {
      await db.query('SELECT 1 FROM schema_migrations WHERE version = 1');
    },
    async index() {
      const { rows } = await db.query<{
        id: string;
        title: string;
        description: string | null;
      }>('SELECT id, title, description FROM topics ORDER BY position, id');
      return {
        schemaVersion: 2,
        categories: rows.map(({ id, title, description }) => ({
          id,
          title,
          ...(description === null ? {} : { description }),
          file: `${id}.json`,
        })),
      };
    },
    async pool(id) {
      // Eine SQL-Anweisung liefert einen konsistenten Snapshot, auch während eines Imports.
      const { rows } = await db.query<{ pool: QuestionPool }>(
        `SELECT jsonb_strip_nulls(jsonb_build_object(
          'schemaVersion', 1, 'id', t.id, 'title', t.title,
          'description', t.description, 'author', t.author, 'locale', t.locale,
          'rubrics', (SELECT jsonb_agg(jsonb_build_object(
            'id', r.id, 'name', r.name, 'color', r.color,
            'clues', (SELECT jsonb_agg(jsonb_build_object(
              'id', q.id, 'level', q.level, 'question', q.question,
              'answer', q.answer, 'note', q.note
            ) ORDER BY q.position) FROM questions q
            WHERE q.topic_id = r.topic_id AND q.rubric_id = r.id)
          ) ORDER BY r.position) FROM rubrics r WHERE r.topic_id = t.id)
        )) AS pool FROM topics t WHERE t.id = $1`,
        [id],
      );
      return rows[0]?.pool ?? null;
    },
    async save(pool) {
      await transaction(db, async (client) => {
        await client.query('SELECT pg_advisory_xact_lock(391002)');
        await writePool(client, pool);
      });
    },
  };
}
