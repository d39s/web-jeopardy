import { formatIssues, validateGameDefinition, validateTopicIndex } from '@jeopardy/game-core';
import type { GameDefinition, TopicIndex } from '@jeopardy/game-core';
import { de } from '../i18n/de';

export type LoadErrorKind = 'network' | 'parse' | 'invalid';

export interface LoadError {
  kind: LoadErrorKind;
  message: string;
  /** Feldgenaue Meldungen aus der Schemaprüfung, z. B. "categories.2.clues.4.answer: …". */
  issues: string[];
}

export type LoadResult<T> = { ok: true; data: T } | { ok: false; error: LoadError };

const topicsBase = `${import.meta.env.BASE_URL}topics/`;

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
  const raw = await fetchJson(`${topicsBase}index.json`, signal);
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

/** Lädt ein Fragenset erst beim Spielstart – die Startseite braucht nur den Index. */
export async function fetchTopic(
  file: string,
  title: string,
  signal?: AbortSignal,
): Promise<LoadResult<GameDefinition>> {
  const raw = await fetchJson(`${topicsBase}${file}`, signal);
  if (!raw.ok) {
    return { ok: false, error: { ...raw.error, message: de.errors.topicLoad(title) } };
  }

  const result = validateGameDefinition(raw.data);
  if (!result.ok) {
    return {
      ok: false,
      error: {
        kind: 'invalid',
        message: de.errors.topicLoad(title),
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
