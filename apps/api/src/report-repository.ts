import type { QuestionReportRequest } from '@jeopardy/game-core';
import type { Pool } from 'pg';

/**
 * SQL-Bedingung für Fragen ohne offene Meldung; erwartet die Fragentabelle als `q`.
 * Gemeldete Fragen kommen weder in neue Spiele noch in den Bewertungsmodus.
 */
export const NOT_REPORTED = `NOT EXISTS (SELECT 1 FROM question_reports qr
  WHERE qr.topic_id = q.topic_id AND qr.question_id = q.id AND qr.resolved_at IS NULL)`;

export type ReportResult = { status: 'ok' | 'missing' };

export interface ReportRepository {
  report(topicId: string, id: string, report: QuestionReportRequest): Promise<ReportResult>;
}

export function postgresReportRepository(db: Pool): ReportRepository {
  return {
    async report(topicId, id, report) {
      // Wiederholte Anfragen mit derselben ID bleiben eine Meldung.
      const { rowCount } = await db.query(
        `INSERT INTO question_reports(request_id, topic_id, question_id, source, comment,
           question, answer)
         SELECT $1, q.topic_id, q.id, $4, $5, q.question, q.answer FROM questions q
         WHERE q.topic_id = $2 AND q.id = $3
         ON CONFLICT (request_id) DO NOTHING`,
        [report.requestId, topicId, id, report.source, report.comment || null],
      );
      if (rowCount !== 0) return { status: 'ok' };
      // Nichts eingefügt: entweder schon gemeldet oder die Frage gibt es nicht.
      const existing = await db.query('SELECT 1 FROM question_reports WHERE request_id = $1', [
        report.requestId,
      ]);
      return { status: existing.rowCount === 0 ? 'missing' : 'ok' };
    },
  };
}
