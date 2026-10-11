import { createHash, randomBytes } from 'node:crypto';
import { performance } from 'node:perf_hooks';
import { formatIssues, validateQuestionPool } from '@jeopardy/game-core';
import type {
  AdminLogEntry,
  AdminQuestion,
  AdminQuestionCreate,
  AdminQuestionList,
  AdminQuestionUpdate,
  AdminReportedQuestion,
  AdminTopic,
  SqlRunRequest,
  SqlRunResult,
} from '@jeopardy/game-core';
import pg from 'pg';
import type { Pool, PoolClient } from 'pg';
import { transaction } from '../database';
import { readPool } from '../repository';
import { position, prepareScript } from './sql-script';

/** Derselbe Lock wie Poolimport und Bewertungen: Inhaltsänderungen laufen nacheinander. */
const CONTENT_LOCK = 'SELECT pg_advisory_xact_lock(391002)';

interface QuestionRow {
  topic_id: string;
  rubric_id: string;
  rubric_name: string;
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
  open_reports: number;
}

export interface QuestionFilter {
  topicId?: string;
  rubricId?: string;
  search?: string;
  level?: number;
  limit: number;
  offset: number;
}

export type MutationResult =
  | { status: 'ok'; question?: AdminQuestion }
  | { status: 'missing' | 'stale' }
  | { status: 'conflict'; message: string }
  | { status: 'invalid'; issues: string[] };

export interface AdminRepository {
  topics(): Promise<AdminTopic[]>;
  questions(filter: QuestionFilter): Promise<AdminQuestionList>;
  createQuestion(
    actor: string,
    topicId: string,
    input: AdminQuestionCreate,
  ): Promise<MutationResult>;
  updateQuestion(
    actor: string,
    topicId: string,
    id: string,
    input: AdminQuestionUpdate,
  ): Promise<MutationResult>;
  deleteQuestion(
    actor: string,
    topicId: string,
    id: string,
    version: string,
  ): Promise<MutationResult>;
  runSql(actor: string, request: SqlRunRequest, commit: boolean): Promise<SqlRunResult>;
  reports(): Promise<AdminReportedQuestion[]>;
  resolveReports(
    actor: string,
    topicId: string,
    id: string,
    throughId: number,
  ): Promise<MutationResult>;
  log(limit: number, beforeId?: number): Promise<AdminLogEntry[]>;
  logEntry(id: number): Promise<AdminLogEntry | null>;
}

export function editVersion(
  row: Pick<QuestionRow, 'rubric_id' | 'question' | 'answer' | 'note' | 'source_level'>,
): string {
  return createHash('sha256')
    .update(JSON.stringify([row.rubric_id, row.question, row.answer, row.note, row.source_level]))
    .digest('hex');
}

function toQuestion(row: QuestionRow): AdminQuestion {
  return {
    topicId: row.topic_id,
    rubricId: row.rubric_id,
    rubricName: row.rubric_name,
    id: row.id,
    question: row.question,
    answer: row.answer,
    ...(row.note === null ? {} : { note: row.note }),
    sourceLevel: row.source_level,
    level: row.level,
    score: Number(row.difficulty_score),
    votes: {
      fits: row.fits_votes,
      tooHard: row.too_hard_votes,
      tooEasy: row.too_easy_votes,
      unsure: row.unsure_votes,
    },
    openReports: row.open_reports,
    version: editVersion(row),
  };
}

const QUESTION_SELECT = `SELECT q.*, r.name AS rubric_name,
    (SELECT COUNT(*) FROM question_reports qr WHERE qr.topic_id = q.topic_id
      AND qr.question_id = q.id AND qr.resolved_at IS NULL)::int AS open_reports
  FROM questions q JOIN rubrics r ON r.topic_id = q.topic_id AND r.id = q.rubric_id`;

async function findQuestion(
  client: PoolClient,
  topicId: string,
  id: string,
  lock = false,
): Promise<QuestionRow | undefined> {
  const { rows } = await client.query<QuestionRow>(
    `${QUESTION_SELECT} WHERE q.topic_id = $1 AND q.id = $2${lock ? ' FOR UPDATE OF q' : ''}`,
    [topicId, id],
  );
  return rows[0];
}

async function poolIssues(client: PoolClient, topicId: string): Promise<string[]> {
  const pool = await readPool(client, topicId);
  if (!pool) return [];
  const result = validateQuestionPool(pool);
  return result.ok ? [] : formatIssues(result.issues);
}

async function writeLog(
  client: PoolClient,
  actor: string,
  action: string,
  target: string | null,
  detail: Record<string, unknown>,
): Promise<void> {
  await client.query(
    'INSERT INTO admin_log(actor, action, target, detail) VALUES ($1, $2, $3, $4)',
    [actor, action, target, JSON.stringify(detail)],
  );
}

/** Bricht die Transaktion ab, wenn eine Änderung den Pool unspielbar machen würde. */
class PoolInvalid extends Error {
  constructor(readonly issues: string[]) {
    super('Pool ungültig');
  }
}

async function mutate(
  db: Pool,
  topicId: string,
  operation: (client: PoolClient) => Promise<MutationResult>,
): Promise<MutationResult> {
  try {
    return await transaction(db, async (client) => {
      await client.query(CONTENT_LOCK);
      // Nur neu entstehende Probleme blockieren; ein schon fehlerhafter Pool bleibt reparierbar.
      const before = new Set(await poolIssues(client, topicId));
      const result = await operation(client);
      if (result.status !== 'ok') return result;
      const issues = (await poolIssues(client, topicId)).filter((issue) => !before.has(issue));
      if (issues.length > 0) throw new PoolInvalid(issues);
      return result;
    });
  } catch (error) {
    if (error instanceof PoolInvalid) return { status: 'invalid', issues: error.issues };
    throw error;
  }
}

/** Datensatz fürs Protokoll, ohne die nur angezeigten Zusatzspalten. */
function snapshotValue(row: QuestionRow) {
  return Object.fromEntries(
    Object.entries(row).filter(([key]) => key !== 'rubric_name' && key !== 'open_reports'),
  );
}

/** Hebt offene Meldungen bis einschließlich `throughId` auf und liefert deren IDs. */
async function resolveOpenReports(
  client: PoolClient,
  actor: string,
  topicId: string,
  id: string,
  throughId?: number,
): Promise<number[]> {
  const { rows } = await client.query<{ id: string }>(
    `UPDATE question_reports SET resolved_at = now(), resolved_by = $3
     WHERE topic_id = $1 AND question_id = $2 AND resolved_at IS NULL
       AND ($4::bigint IS NULL OR id <= $4)
     RETURNING id`,
    [topicId, id, actor, throughId ?? null],
  );
  return rows.map((row) => Number(row.id)).sort((a, b) => a - b);
}

function cell(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const text =
    typeof value === 'object' && !(value instanceof Date) ? JSON.stringify(value) : String(value);
  return text.length > 200 ? `${text.slice(0, 200)}…` : text;
}

interface TopicCounts {
  id: string;
  title: string;
  rubrics: number;
  questions: number;
}

async function contentSnapshot(client: PoolClient) {
  const { rows } = await client.query<TopicCounts>(
    `SELECT t.id, t.title,
       (SELECT COUNT(*) FROM rubrics r WHERE r.topic_id = t.id)::int AS rubrics,
       (SELECT COUNT(*) FROM questions q WHERE q.topic_id = t.id)::int AS questions
     FROM topics t ORDER BY t.position, t.id`,
  );
  const issues = new Map<string, string[]>();
  for (const topic of rows) issues.set(topic.id, await poolIssues(client, topic.id));
  return {
    topics: new Map(rows.map((row) => [row.id, row])),
    issues,
    counts: {
      topics: rows.length,
      rubrics: rows.reduce((sum, row) => sum + row.rubrics, 0),
      questions: rows.reduce((sum, row) => sum + row.questions, 0),
    },
  };
}

const MAX_RESULT_STATEMENTS = 200;
/** Obergrenze der Übersicht; ältere offene Meldungen erscheinen nach dem Aufheben neuerer. */
const MAX_OPEN_REPORTS = 1000;
const MAX_RESULT_ROWS = 20;

export function postgresAdminRepository(db: Pool): AdminRepository {
  return {
    async topics() {
      const { rows } = await db.query<{
        id: string;
        title: string;
        description: string | null;
        question_count: number;
        rubrics: { id: string; name: string; color: string | null; questionCount: number }[];
      }>(
        `SELECT t.id, t.title, t.description,
           (SELECT COUNT(*) FROM questions q WHERE q.topic_id = t.id)::int AS question_count,
           COALESCE((SELECT jsonb_agg(jsonb_build_object(
             'id', r.id, 'name', r.name, 'color', r.color,
             'questionCount', (SELECT COUNT(*) FROM questions q
               WHERE q.topic_id = r.topic_id AND q.rubric_id = r.id)
           ) ORDER BY r.position) FROM rubrics r WHERE r.topic_id = t.id), '[]') AS rubrics
         FROM topics t ORDER BY t.position, t.id`,
      );
      return rows.map((row) => ({
        id: row.id,
        title: row.title,
        ...(row.description === null ? {} : { description: row.description }),
        questionCount: row.question_count,
        rubrics: row.rubrics.map(({ color, ...rubric }) => ({
          ...rubric,
          ...(color === null ? {} : { color }),
        })),
      }));
    },

    async questions({ topicId, rubricId, search, level, limit, offset }) {
      const pattern = search ? `%${search.replace(/[\\%_]/g, '\\$&')}%` : null;
      const where = `WHERE ($1::text IS NULL OR q.topic_id = $1)
        AND ($2::text IS NULL OR q.rubric_id = $2)
        AND ($3::text IS NULL OR q.id ILIKE $3 OR q.question ILIKE $3
          OR q.answer ILIKE $3 OR q.note ILIKE $3)
        AND ($4::int IS NULL OR q.level = $4)`;
      const params = [topicId ?? null, rubricId ?? null, pattern, level ?? null];
      const [total, page] = await Promise.all([
        db.query<{ count: number }>(
          `SELECT COUNT(*)::int AS count FROM questions q ${where}`,
          params,
        ),
        db.query<QuestionRow>(
          `${QUESTION_SELECT} JOIN topics t ON t.id = q.topic_id ${where}
           ORDER BY t.position, t.id, r.position, q.position LIMIT $5 OFFSET $6`,
          [...params, limit, offset],
        ),
      ]);
      return { total: total.rows[0]?.count ?? 0, questions: page.rows.map(toQuestion) };
    },

    async createQuestion(actor, topicId, input) {
      return mutate(db, topicId, async (client) => {
        const rubric = await client.query('SELECT 1 FROM rubrics WHERE topic_id = $1 AND id = $2', [
          topicId,
          input.rubricId,
        ]);
        if (rubric.rowCount === 0) return { status: 'missing' };
        const id = input.id ?? `${input.rubricId.slice(0, 55)}-${randomBytes(4).toString('hex')}`;
        // Rubriken und Fragen teilen sich im gezogenen Spielfeld einen Namensraum.
        const taken = await client.query(
          `SELECT 1 FROM questions WHERE topic_id = $1 AND id = $2
           UNION ALL SELECT 1 FROM rubrics WHERE topic_id = $1 AND id = $2`,
          [topicId, id],
        );
        if (taken.rowCount !== 0)
          return { status: 'conflict', message: `Die ID "${id}" ist in diesem Thema vergeben.` };
        await client.query(
          `INSERT INTO questions(topic_id, rubric_id, id, level, source_level, difficulty_score,
             question, answer, note, position)
           VALUES ($1::varchar, $2::varchar, $3, $4::smallint, $4, $4, $5, $6, $7,
             (SELECT COALESCE(MAX(position), -1) + 1 FROM questions
              WHERE topic_id = $1 AND rubric_id = $2))`,
          [
            topicId,
            input.rubricId,
            id,
            input.level,
            input.question,
            input.answer,
            input.note || null,
          ],
        );
        const created = (await findQuestion(client, topicId, id))!;
        await writeLog(client, actor, 'question.create', `${topicId}/${id}`, {
          after: snapshotValue(created),
        });
        return { status: 'ok', question: toQuestion(created) };
      });
    },

    async updateQuestion(actor, topicId, id, input) {
      return mutate(db, topicId, async (client) => {
        const row = await findQuestion(client, topicId, id, true);
        if (!row) return { status: 'missing' };
        if (editVersion(row) !== input.version) return { status: 'stale' };
        const note = input.note || null;
        const reset = input.resetRating || input.level !== row.source_level;
        const moved = input.rubricId !== row.rubric_id;
        if (
          !reset &&
          !moved &&
          input.question === row.question &&
          input.answer === row.answer &&
          note === row.note
        ) {
          return { status: 'ok', question: toQuestion(row) };
        }
        if (moved) {
          const rubric = await client.query(
            'SELECT 1 FROM rubrics WHERE topic_id = $1 AND id = $2',
            [topicId, input.rubricId],
          );
          if (rubric.rowCount === 0) return { status: 'missing' };
        }
        await client.query(
          `UPDATE questions SET rubric_id = $3::varchar, question = $4, answer = $5, note = $6,
             source_level = $7::smallint,
             position = CASE WHEN $9::boolean THEN (SELECT COALESCE(MAX(position), -1) + 1 FROM questions
               WHERE topic_id = $1 AND rubric_id = $3) ELSE position END,
             level = CASE WHEN $8::boolean THEN $7 ELSE level END,
             difficulty_score = CASE WHEN $8 THEN $7 ELSE difficulty_score END,
             fits_votes = CASE WHEN $8 THEN 0 ELSE fits_votes END,
             too_hard_votes = CASE WHEN $8 THEN 0 ELSE too_hard_votes END,
             too_easy_votes = CASE WHEN $8 THEN 0 ELSE too_easy_votes END,
             unsure_votes = CASE WHEN $8 THEN 0 ELSE unsure_votes END
           WHERE topic_id = $1 AND id = $2`,
          [
            topicId,
            id,
            input.rubricId,
            input.question,
            input.answer,
            note,
            input.level,
            reset,
            moved,
          ],
        );
        const updated = (await findQuestion(client, topicId, id))!;
        await writeLog(client, actor, 'question.update', `${topicId}/${id}`, {
          before: snapshotValue(row),
          after: snapshotValue(updated),
          resetRating: reset,
        });
        return { status: 'ok', question: toQuestion(updated) };
      });
    },

    async deleteQuestion(actor, topicId, id, version) {
      return mutate(db, topicId, async (client) => {
        const row = await findQuestion(client, topicId, id, true);
        if (!row) return { status: 'missing' };
        if (editVersion(row) !== version) return { status: 'stale' };
        await client.query('DELETE FROM questions WHERE topic_id = $1 AND id = $2', [topicId, id]);
        // Eine gelöschte Frage braucht keine Prüfung mehr; die Meldungen gelten als erledigt.
        const reports = await resolveOpenReports(client, actor, topicId, id);
        await writeLog(client, actor, 'question.delete', `${topicId}/${id}`, {
          before: snapshotValue(row),
          ...(reports.length > 0 ? { resolvedReports: reports } : {}),
        });
        return { status: 'ok' };
      });
    },

    async runSql(actor, request, commit) {
      // Wirft SqlScriptError, bevor eine Verbindung genutzt wird.
      const script = prepareScript(request.sql);
      const sha256 = createHash('sha256').update(request.sql).digest('hex');
      const started = performance.now();
      const client = await db.connect();
      const notices: string[] = [];
      client.on('notice', (notice) =>
        notices.push(`${notice.severity ?? 'NOTICE'}: ${notice.message}`),
      );
      try {
        await client.query('BEGIN');
        await client.query("SET LOCAL statement_timeout = '120s'");
        await client.query("SET LOCAL lock_timeout = '15s'");
        await client.query(CONTENT_LOCK);
        const before = await contentSnapshot(client);
        let error: SqlRunResult['error'];
        let statements: SqlRunResult['statements'] = [];
        try {
          const raw = await client.query({ text: script.body, rowMode: 'array' });
          const results: pg.QueryResult<unknown[]>[] = Array.isArray(raw) ? raw : [raw];
          statements = results
            .filter((result) => result.command !== null)
            .slice(0, MAX_RESULT_STATEMENTS)
            .map((result) => ({
              command: result.command,
              rowCount: result.rowCount,
              ...(result.fields.length > 0
                ? {
                    columns: result.fields.map((field) => field.name),
                    rows: result.rows.slice(0, MAX_RESULT_ROWS).map((row) => row.map(cell)),
                  }
                : {}),
            }));
        } catch (cause) {
          if (!(cause instanceof pg.DatabaseError)) throw cause;
          const at = cause.position ? position(request.sql, Number(cause.position) - 1) : {};
          error = {
            message: cause.message,
            ...at,
            ...(cause.detail ? { detail: cause.detail } : {}),
            ...(cause.hint ? { hint: cause.hint } : {}),
            ...(cause.where ? { where: cause.where } : {}),
          };
          await client.query('ROLLBACK');
        }
        const after = error ? before : await contentSnapshot(client);
        const topics = [...after.topics.values(), ...before.topics.values()]
          .filter((topic, index, all) => all.findIndex((other) => other.id === topic.id) === index)
          .map((topic) => {
            const old = before.topics.get(topic.id);
            const next = after.topics.get(topic.id);
            return {
              id: topic.id,
              title: next?.title ?? topic.title,
              before: { rubrics: old?.rubrics ?? 0, questions: old?.questions ?? 0 },
              after: { rubrics: next?.rubrics ?? 0, questions: next?.questions ?? 0 },
            };
          })
          .filter(
            (topic) =>
              topic.before.rubrics !== topic.after.rubrics ||
              topic.before.questions !== topic.after.questions,
          );
        const issues = [...after.issues.entries()]
          .map(([topicId, list]) => {
            const known = new Set(before.issues.get(topicId) ?? []);
            return { topicId, issues: list.filter((issue) => !known.has(issue)) };
          })
          .filter((entry) => entry.issues.length > 0);
        const ok = !error && issues.length === 0;
        const result: SqlRunResult = {
          ok,
          committed: false,
          sha256,
          durationMs: 0,
          statements,
          notices,
          counts: { before: before.counts, after: after.counts },
          topics,
          issues,
          ...(error ? { error } : {}),
        };
        if (!error) {
          if (commit && ok) {
            await writeLog(client, actor, 'sql.execute', request.filename || null, {
              filename: request.filename ?? null,
              sha256,
              bytes: Buffer.byteLength(request.sql),
              statements: script.statements,
              counts: result.counts,
              topics,
              notices,
              sql: request.sql,
            });
            await client.query('COMMIT');
            result.committed = true;
          } else {
            await client.query('ROLLBACK');
          }
        }
        result.durationMs = Math.round(performance.now() - started);
        return result;
      } catch (error) {
        await client.query('ROLLBACK').catch(() => undefined);
        throw error;
      } finally {
        // Verbindung verwerfen: SET, temporäre Objekte oder Rollenwechsel des Skripts
        // dürfen nicht in andere Anfragen gelangen.
        client.release(true);
      }
    },

    async reports() {
      const { rows } = await db.query<ReportRow>(
        `SELECT qr.id, qr.topic_id, qr.question_id, qr.source, qr.comment, qr.question,
           qr.answer, qr.created_at, t.title AS topic_title
         FROM question_reports qr LEFT JOIN topics t ON t.id = qr.topic_id
         WHERE qr.resolved_at IS NULL ORDER BY qr.id DESC LIMIT $1`,
        [MAX_OPEN_REPORTS],
      );
      const questions = await db.query<QuestionRow>(
        `${QUESTION_SELECT} WHERE (q.topic_id, q.id) IN
           (SELECT topic_id, question_id FROM question_reports WHERE resolved_at IS NULL)`,
      );
      const current = new Map(questions.rows.map((row) => [`${row.topic_id}/${row.id}`, row]));
      // Gruppiert je Frage; die Reihenfolge folgt der neuesten Meldung.
      const grouped = new Map<string, AdminReportedQuestion>();
      for (const row of rows) {
        const key = `${row.topic_id}/${row.question_id}`;
        let entry = grouped.get(key);
        if (!entry) {
          const question = current.get(key);
          entry = {
            topicId: row.topic_id,
            questionId: row.question_id,
            ...(row.topic_title === null ? {} : { topicTitle: row.topic_title }),
            ...(question ? { question: toQuestion(question) } : {}),
            reports: [],
          };
          grouped.set(key, entry);
        }
        entry.reports.push({
          id: Number(row.id),
          createdAt: row.created_at.toISOString(),
          source: row.source,
          ...(row.comment === null ? {} : { comment: row.comment }),
          question: row.question,
          answer: row.answer,
        });
      }
      return [...grouped.values()];
    },

    async resolveReports(actor, topicId, id, throughId) {
      return transaction(db, async (client): Promise<MutationResult> => {
        const reports = await resolveOpenReports(client, actor, topicId, id, throughId);
        if (reports.length === 0)
          return {
            status: 'conflict',
            message: 'Für diese Frage gibt es keine offenen Meldungen.',
          };
        await writeLog(client, actor, 'question.unflag', `${topicId}/${id}`, { reports });
        const question = await findQuestion(client, topicId, id);
        return { status: 'ok', ...(question ? { question: toQuestion(question) } : {}) };
      });
    },

    async log(limit, beforeId) {
      const { rows } = await db.query<LogRow>(
        `SELECT id, created_at, actor, action, target, detail - 'sql' AS detail FROM admin_log
         WHERE ($2::bigint IS NULL OR id < $2) ORDER BY id DESC LIMIT $1`,
        [limit, beforeId ?? null],
      );
      return rows.map(toLogEntry);
    },

    async logEntry(id) {
      const { rows } = await db.query<LogRow>('SELECT * FROM admin_log WHERE id = $1', [id]);
      return rows[0] ? toLogEntry(rows[0]) : null;
    },
  };
}

interface ReportRow {
  id: string;
  topic_id: string;
  question_id: string;
  source: 'game' | 'review';
  comment: string | null;
  question: string;
  answer: string;
  created_at: Date;
  topic_title: string | null;
}

interface LogRow {
  id: string;
  created_at: Date;
  actor: string;
  action: string;
  target: string | null;
  detail: Record<string, unknown>;
}

function toLogEntry(row: LogRow): AdminLogEntry {
  return {
    id: Number(row.id),
    createdAt: row.created_at.toISOString(),
    actor: row.actor,
    action: row.action,
    ...(row.target === null ? {} : { target: row.target }),
    detail: row.detail,
  };
}
