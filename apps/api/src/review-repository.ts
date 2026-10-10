import { createHash } from 'node:crypto';
import type { DifficultyRating, DifficultyVote, ReviewQuestion } from '@jeopardy/game-core';
import type { Pool } from 'pg';
import { transaction } from './database';

interface QuestionRow {
  topic_id: string;
  id: string;
  question: string;
  answer: string;
  note: string | null;
  source_level: number;
  level: number;
  difficulty_score: string;
  fits_votes: number;
  too_hard_votes: number;
  too_easy_votes: number;
  unsure_votes: number;
}

export function questionVersion(
  row: Pick<QuestionRow, 'question' | 'answer' | 'source_level'>,
): string {
  return createHash('sha256')
    .update(JSON.stringify([row.question, row.answer, row.source_level]))
    .digest('hex');
}

function rating(row: QuestionRow): DifficultyRating {
  return {
    score: Number(row.difficulty_score),
    level: row.level,
    votes: row.fits_votes + row.too_hard_votes + row.too_easy_votes + row.unsure_votes,
  };
}

export type VoteResult =
  { status: 'ok'; rating: DifficultyRating } | { status: 'missing' | 'stale' | 'conflict' };

export interface ReviewRepository {
  random(
    excludeTopic?: string,
    excludeId?: string,
    topicId?: string,
  ): Promise<ReviewQuestion | null>;
  vote(topicId: string, id: string, vote: DifficultyVote): Promise<VoteResult>;
}

export function postgresReviewRepository(db: Pool): ReviewRepository {
  return {
    async random(excludeTopic, excludeId, topicId) {
      // Gleichverteilte Ziehung über Fragen, nicht über unterschiedlich große Themen.
      // Wenn nur eine Frage vorhanden ist, darf sie erneut erscheinen.
      const { rows } = await db.query<QuestionRow & { topic_title: string; rubric_name: string }>(
        `SELECT q.*, t.title AS topic_title, r.name AS rubric_name
         FROM questions q JOIN topics t ON t.id = q.topic_id
         JOIN rubrics r ON r.topic_id = q.topic_id AND r.id = q.rubric_id
         WHERE ($3::text IS NULL OR q.topic_id = $3)
         ORDER BY CASE WHEN q.topic_id = $1 AND q.id = $2 THEN 1 ELSE 0 END, random()
         LIMIT 1`,
        [excludeTopic ?? null, excludeId ?? null, topicId ?? null],
      );
      const row = rows[0];
      if (!row) return null;
      return {
        topicId: row.topic_id,
        topicTitle: row.topic_title,
        rubricName: row.rubric_name,
        id: row.id,
        question: row.question,
        answer: row.answer,
        ...(row.note === null ? {} : { note: row.note }),
        ...rating(row),
        version: questionVersion(row),
      };
    },
    async vote(topicId, id, vote) {
      return transaction(db, async (client): Promise<VoteResult> => {
        // Derselbe Lock wie Pool-Import: Bewertungen und Ersetzungen können sich nicht verlieren.
        await client.query('SELECT pg_advisory_xact_lock(391002)');
        const { rows } = await client.query<QuestionRow>(
          'SELECT * FROM questions WHERE topic_id = $1 AND id = $2 FOR UPDATE',
          [topicId, id],
        );
        const row = rows[0];
        if (!row) return { status: 'missing' };
        if (questionVersion(row) !== vote.version) return { status: 'stale' };
        const inserted = await client.query(
          `INSERT INTO difficulty_votes(request_id, topic_id, question_id, question_version, verdict)
           VALUES ($1, $2, $3, $4, $5) ON CONFLICT DO NOTHING RETURNING request_id`,
          [vote.requestId, topicId, id, vote.version, vote.verdict],
        );
        if (inserted.rowCount === 0) {
          const previous = await client.query<{
            topic_id: string;
            question_id: string;
            question_version: string;
            verdict: string;
          }>('SELECT * FROM difficulty_votes WHERE request_id = $1', [vote.requestId]);
          const existing = previous.rows[0]!;
          if (
            existing.topic_id !== topicId ||
            existing.question_id !== id ||
            existing.question_version !== vote.version ||
            existing.verdict !== vote.verdict
          ) {
            return { status: 'conflict' };
          }
          return { status: 'ok', rating: rating(row) };
        }
        const delta = vote.verdict === 'too-hard' ? 0.2 : vote.verdict === 'too-easy' ? -0.2 : 0;
        const updated = await client.query<QuestionRow>(
          `UPDATE questions SET difficulty_score = LEAST(9, GREATEST(1, difficulty_score + $3)),
             level = ROUND(LEAST(9, GREATEST(1, difficulty_score + $3))),
             fits_votes = fits_votes + $4, too_hard_votes = too_hard_votes + $5,
             too_easy_votes = too_easy_votes + $6, unsure_votes = unsure_votes + $7
           WHERE topic_id = $1 AND id = $2 RETURNING *`,
          [
            topicId,
            id,
            delta,
            Number(vote.verdict === 'fits'),
            Number(vote.verdict === 'too-hard'),
            Number(vote.verdict === 'too-easy'),
            Number(vote.verdict === 'unsure'),
          ],
        );
        return { status: 'ok', rating: rating(updated.rows[0]!) };
      });
    },
  };
}
