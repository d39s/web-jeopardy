import {
  formatIssues,
  validateGameDefinition,
  validateQuestionPool,
  validateTopicIndex,
} from '@jeopardy/game-core';
import type { GameDefinition, QuestionPool, TopicIndex } from '@jeopardy/game-core';
import { de } from '../i18n/de';

export type LoadErrorKind = 'network' | 'parse' | 'invalid';

export interface LoadError {
  kind: LoadErrorKind;
  message: string;
  /** Feldgenaue Meldungen aus der Schemaprüfung, z. B. "categories.2.clues.4.answer: …". */
  issues: string[];
}

export type LoadResult<T> = { ok: true; data: T } | { ok: false; error: LoadError };

const apiBase = `${import.meta.env.BASE_URL}api/v1/`;

async function fetchJson(url: string, signal?: AbortSignal): Promise<LoadResult<unknown>> {
  let response: Response;
  try {
    response = await fetch(url, { signal });
  } catch {
    return { ok: false, error: { kind: 'network', message: de.setup.topicsError, issues: [] } };
  }

  if (!response.ok) {
    return {
      ok: false,
      error: {
        kind: 'network',
        message: `${de.setup.topicsError} (HTTP ${response.status})`,
        issues: [],
      },
    };
  }

  try {
    return { ok: true, data: (await response.json()) as unknown };
  } catch {
    return { ok: false, error: { kind: 'parse', message: de.errors.notJson, issues: [] } };
  }
}

export async function fetchTopicIndex(signal?: AbortSignal): Promise<LoadResult<TopicIndex>> {
  const raw = await fetchJson(`${apiBase}topics/index.json`, signal);
  if (!raw.ok) return raw;

  const result = validateTopicIndex(raw.data);
  if (!result.ok) {
    return {
      ok: false,
      error: {
        kind: 'invalid',
        message: de.setup.topicsError,
        issues: formatIssues(result.issues),
      },
    };
  }
  return { ok: true, data: result.data };
}

/**
 * Lädt den Fragenvorrat einer Kategorie. Erst nach ihrer Auswahl nötig – der
 * Index allein reicht für die erste Stufe der Startseite, und ein Pool ist um
 * ein Vielfaches größer als seine Beschreibung.
 */
export async function fetchPool(
  id: string,
  title: string,
  signal?: AbortSignal,
): Promise<LoadResult<QuestionPool>> {
  const raw = await fetchJson(`${apiBase}pools/${encodeURIComponent(id)}.json`, signal);
  if (!raw.ok) {
    return { ok: false, error: { ...raw.error, message: de.errors.poolLoad(title) } };
  }

  const result = validateQuestionPool(raw.data);
  if (!result.ok) {
    return {
      ok: false,
      error: {
        kind: 'invalid',
        message: de.errors.poolLoad(title),
        issues: formatIssues(result.issues),
      },
    };
  }
  return { ok: true, data: result.data };
}

/** Prüft ein selbst mitgebrachtes Fragenset – gleiche Regeln wie bei mitgelieferten Themen. */
export async function parseUploadedFile(file: File): Promise<LoadResult<GameDefinition>> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(await file.text()) as unknown;
  } catch {
    return { ok: false, error: { kind: 'parse', message: de.errors.notJson, issues: [] } };
  }

  const result = validateGameDefinition(parsed);
  if (!result.ok) {
    return {
      ok: false,
      error: {
        kind: 'invalid',
        message: de.errors.invalidFile,
        issues: formatIssues(result.issues),
      },
    };
  }
  return { ok: true, data: result.data };
}
