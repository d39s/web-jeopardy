import {
  adminIdentitySchema,
  adminLogEntrySchema,
  adminLogSchema,
  adminQuestionListSchema,
  adminQuestionSchema,
  adminReportListSchema,
  adminTopicSchema,
  sqlRunResultSchema,
} from '@jeopardy/game-core';
import type {
  AdminQuestion,
  AdminQuestionCreate,
  AdminQuestionUpdate,
  SqlRunRequest,
} from '@jeopardy/game-core';
import { de } from '../../i18n/de';

const base = `${import.meta.env.BASE_URL}api/v1/admin/`;

export class AdminApiError extends Error {
  constructor(
    /** 0 bei Netzwerkfehlern oder unerwarteten Antworten. */
    readonly status: number,
    message: string,
    readonly issues: string[] = [],
    readonly line?: number,
    readonly column?: number,
  ) {
    super(message);
  }
}

interface ErrorBody {
  error?: string;
  issues?: string[];
  line?: number;
  column?: number;
}

async function request<T>(
  path: string,
  schema: { parse(data: unknown): T } | null,
  init: RequestInit = {},
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${base}${path}`, {
      ...init,
      credentials: 'same-origin',
      headers: init.body ? { 'Content-Type': 'application/json' } : undefined,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error;
    // Abgelaufene Authentik-Sitzungen leiten auf eine fremde Origin um; fetch scheitert dann.
    throw new AdminApiError(0, de.admin.errors.network);
  }
  if (!response.ok) {
    // Fehlerseiten von Proxys liefern kein JSON; dann bleibt der HTTP-Status die Meldung.
    const parsed: unknown = await response.json().catch(() => null);
    const body = (parsed && typeof parsed === 'object' ? parsed : {}) as ErrorBody;
    throw new AdminApiError(
      response.status,
      body.error ?? de.admin.errors.http(response.status),
      body.issues ?? [],
      body.line,
      body.column,
    );
  }
  if (response.status === 204 || !schema) return undefined as T;
  let data: unknown;
  try {
    data = await response.json();
  } catch {
    throw new AdminApiError(0, de.admin.errors.session);
  }
  return schema.parse(data);
}

const json = (method: string, body: unknown): RequestInit => ({
  method,
  body: JSON.stringify(body),
});

export const adminApi = {
  me: (signal?: AbortSignal) => request('me', adminIdentitySchema, { signal }),
  topics: (signal?: AbortSignal) => request('topics', adminTopicSchema.array(), { signal }),
  questions(
    filter: {
      topicId?: string;
      rubricId?: string;
      q?: string;
      level?: number;
      offset: number;
      limit: number;
    },
    signal?: AbortSignal,
  ) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(filter))
      if (value !== undefined && value !== '') params.set(key, String(value));
    return request(`questions?${params}`, adminQuestionListSchema, { signal });
  },
  createQuestion: (topicId: string, input: AdminQuestionCreate) =>
    request(
      `topics/${encodeURIComponent(topicId)}/questions`,
      adminQuestionSchema,
      json('POST', input),
    ),
  updateQuestion: (question: AdminQuestion, input: Omit<AdminQuestionUpdate, 'version'>) =>
    request(
      `topics/${encodeURIComponent(question.topicId)}/questions/${encodeURIComponent(question.id)}`,
      adminQuestionSchema,
      json('PUT', { ...input, version: question.version }),
    ),
  deleteQuestion: (question: AdminQuestion) =>
    request(
      `topics/${encodeURIComponent(question.topicId)}/questions/${encodeURIComponent(question.id)}?version=${question.version}`,
      null,
      { method: 'DELETE' },
    ),
  reports: (signal?: AbortSignal) => request('reports', adminReportListSchema, { signal }),
  resolveReports: (topicId: string, questionId: string, throughId: number) =>
    request(
      `reports/${encodeURIComponent(topicId)}/${encodeURIComponent(questionId)}/resolve`,
      null,
      json('POST', { throughId }),
    ),
  runSql: (input: SqlRunRequest, commit: boolean) =>
    request(commit ? 'sql/execute' : 'sql/dry-run', sqlRunResultSchema, json('POST', input)),
  log: (before?: number, signal?: AbortSignal) =>
    request(`log?limit=50${before ? `&before=${before}` : ''}`, adminLogSchema, { signal }),
  logEntry: (id: number) => request(`log/${id}`, adminLogEntrySchema),
};
