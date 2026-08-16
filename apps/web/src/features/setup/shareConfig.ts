import { MAX_TEAMS_UI, MAX_TEAM_NAME_LENGTH, TIMER_OPTIONS } from '@jeopardy/game-core';

/**
 * Spielkonfiguration als lesbarer Link.
 *
 * Format: `?thema=<themen-id>&teams=<Name1,Name2>&timer=<sekunden>&vetozeit=<sekunden>&abzug=<0|1>`
 *
 * Bewusst kein Base64: Der Link bleibt lesbar und lässt sich notfalls von Hand
 * tippen. Die Teamnamen werden einzeln URL-kodiert und mit einem echten Komma
 * verbunden – ein Komma im Namen wird dabei zu `%2C` und kollidiert daher nicht
 * mit dem Trennzeichen. `timer` entfällt, wenn ohne Zeitbegrenzung gespielt wird,
 * `vetozeit` entfällt, solange die Veto-Zeit an die Bedenkzeit gekoppelt ist.
 *
 * Ein eigenes, hochgeladenes Fragenset lässt sich nicht abbilden (zu groß für
 * eine Adresszeile) – dafür gibt es nur die Themen aus dem Index.
 */

export const SHARE_PARAM_TOPIC = 'thema';
export const SHARE_PARAM_TEAMS = 'teams';
export const SHARE_PARAM_TIMER = 'timer';
export const SHARE_PARAM_VETO = 'vetozeit';
export const SHARE_PARAM_DEDUCT = 'abzug';

/** Trennt die Teamnamen im Link – im Namen selbst erscheint es nur kodiert. */
const TEAM_SEPARATOR = ',';

/** Themen-IDs stammen aus Dateinamen; alles andere ist kein gültiger Verweis. */
const TOPIC_ID_PATTERN = /^[a-z0-9][a-z0-9._-]{0,63}$/i;

/** Steuerzeichen aus einem Link haben in Teamnamen nichts zu suchen. */
function stripControlChars(value: string): string {
  return Array.from(value)
    .filter((char) => {
      const code = char.codePointAt(0) ?? 0;
      return code > 31 && code !== 127;
    })
    .join('');
}

export interface SharedConfig {
  /** Themen-ID aus dem Index; null, wenn der Link keine brauchbare Angabe hatte. */
  topicId: string | null;
  /** Bereinigte Teamnamen, höchstens `MAX_TEAMS_UI` Einträge. */
  teamNames: string[];
  /** Bedenkzeit je Frage in Sekunden; null bedeutet ohne Zeitbegrenzung. */
  timerSeconds: number | null;
  /** Veto-Zeit in Sekunden; null koppelt sie an die Bedenkzeit. */
  vetoSeconds: number | null;
  /** Ob eine falsche Antwort Punkte kostet. */
  deductOnWrong: boolean;
}

export type ShareParseResult =
  /** Keine Teilen-Parameter in der Adresse – ganz normaler Aufruf der Startseite. */
  | { status: 'none' }
  /** Parameter vorhanden, aber nichts davon war verwertbar. */
  | { status: 'invalid' }
  | { status: 'ok'; config: SharedConfig };

export function isTimerOption(seconds: number): boolean {
  return (TIMER_OPTIONS as readonly number[]).includes(seconds);
}

function sanitizeTopicId(value: string | null): string | null {
  if (value === null) return null;
  const trimmed = value.trim();
  return TOPIC_ID_PATTERN.test(trimmed) ? trimmed : null;
}

function sanitizeName(value: string): string {
  return stripControlChars(value).trim().slice(0, MAX_TEAM_NAME_LENGTH).trim();
}

/** `null` bei kaputten Prozentfolgen (`%E0%A4`), damit nichts die App kippt. */
function decodeComponent(value: string): string | null {
  try {
    return decodeURIComponent(value.replace(/\+/g, ' '));
  } catch {
    return null;
  }
}

/**
 * Liest einen Parameter **unkodiert** aus dem Query-String. `URLSearchParams`
 * kommt hier nicht in Frage: Es dekodiert den Wert, wodurch ein kodiertes Komma
 * im Teamnamen nicht mehr vom Trennzeichen zu unterscheiden wäre.
 */
function readRawParam(search: string, name: string): string | null {
  const query = search.startsWith('?') ? search.slice(1) : search;
  if (query === '') return null;

  for (const pair of query.split('&')) {
    if (pair === '') continue;
    const separator = pair.indexOf('=');
    const rawKey = separator === -1 ? pair : pair.slice(0, separator);
    if (decodeComponent(rawKey) !== name) continue;
    return separator === -1 ? '' : pair.slice(separator + 1);
  }
  return null;
}

function parseTeamNames(raw: string | null): string[] {
  if (raw === null) return [];

  return raw
    .split(TEAM_SEPARATOR)
    .map((part) => {
      const decoded = decodeComponent(part);
      return decoded === null ? '' : sanitizeName(decoded);
    })
    .filter((name) => name !== '')
    .slice(0, MAX_TEAMS_UI);
}

/** Fehlt der Parameter oder ist er unlesbar, gilt der Standard: Abzug an. */
function parseDeduct(raw: string | null): boolean {
  if (raw === null) return true;
  const decoded = decodeComponent(raw)?.trim().toLowerCase() ?? '';
  return !['0', 'false', 'nein', 'aus'].includes(decoded);
}

/**
 * Sekunden aus dem Link – für `timer` wie für `vetozeit`. Nur die Stufen aus
 * `TIMER_OPTIONS` sind zulässig; alles andere fällt auf null zurück und damit
 * auf den jeweiligen Standard (ohne Zeitbegrenzung bzw. gekoppelt).
 */
function parseTimerOption(raw: string | null): number | null {
  if (raw === null) return null;
  const decoded = decodeComponent(raw)?.trim() ?? '';
  if (decoded === '') return null;

  const seconds = Number(decoded);
  return Number.isFinite(seconds) && isTimerOption(seconds) ? seconds : null;
}

/** Query-String zur Konfiguration – ohne führendes `?`. */
export function buildShareQuery(config: SharedConfig): string {
  const parts: string[] = [];

  const topicId = sanitizeTopicId(config.topicId);
  if (topicId !== null) {
    parts.push(`${SHARE_PARAM_TOPIC}=${encodeURIComponent(topicId)}`);
  }

  const names = config.teamNames
    .map(sanitizeName)
    .filter((name) => name !== '')
    .slice(0, MAX_TEAMS_UI);
  if (names.length > 0) {
    parts.push(`${SHARE_PARAM_TEAMS}=${names.map(encodeURIComponent).join(TEAM_SEPARATOR)}`);
  }

  if (config.timerSeconds !== null && isTimerOption(config.timerSeconds)) {
    parts.push(`${SHARE_PARAM_TIMER}=${config.timerSeconds}`);
  }

  // Die Kopplung an die Bedenkzeit ist der Standard und steht daher nicht im Link.
  if (config.vetoSeconds !== null && isTimerOption(config.vetoSeconds)) {
    parts.push(`${SHARE_PARAM_VETO}=${config.vetoSeconds}`);
  }

  // Nur die abweichende Regel steht im Link; Abzug ist der Standard.
  if (!config.deductOnWrong) {
    parts.push(`${SHARE_PARAM_DEDUCT}=0`);
  }

  return parts.join('&');
}

/** Vollständiger Link; vorhandene Query- und Fragment-Anteile der Basis entfallen. */
export function buildShareLink(config: SharedConfig, baseUrl: string): string {
  const base = baseUrl.split(/[?#]/)[0] ?? baseUrl;
  const query = buildShareQuery(config);
  return query === '' ? base : `${base}?${query}`;
}

/**
 * Liest die Konfiguration aus einem Query-String. Alles Unbrauchbare wird
 * verworfen oder begrenzt; nur wenn weder Thema noch Teams übrig bleiben, gilt
 * der Link als fehlerhaft.
 */
export function parseShareParams(search: string): ShareParseResult {
  const rawTopic = readRawParam(search, SHARE_PARAM_TOPIC);
  const rawTeams = readRawParam(search, SHARE_PARAM_TEAMS);
  const rawTimer = readRawParam(search, SHARE_PARAM_TIMER);
  const rawVeto = readRawParam(search, SHARE_PARAM_VETO);
  const rawDeduct = readRawParam(search, SHARE_PARAM_DEDUCT);

  if (
    rawTopic === null &&
    rawTeams === null &&
    rawTimer === null &&
    rawVeto === null &&
    rawDeduct === null
  ) {
    return { status: 'none' };
  }

  const config: SharedConfig = {
    topicId: sanitizeTopicId(rawTopic === null ? null : decodeComponent(rawTopic)),
    teamNames: parseTeamNames(rawTeams),
    timerSeconds: parseTimerOption(rawTimer),
    vetoSeconds: parseTimerOption(rawVeto),
    deductOnWrong: parseDeduct(rawDeduct),
  };

  if (config.topicId === null && config.teamNames.length === 0) {
    return { status: 'invalid' };
  }
  return { status: 'ok', config };
}

/** Entfernt die Teilen-Parameter aus der Adresszeile, ohne die Seite neu zu laden. */
export function clearShareParams(): void {
  const history = globalThis.history as History | undefined;
  const location = globalThis.location as Location | undefined;
  if (!history || typeof history.replaceState !== 'function' || !location) return;

  try {
    history.replaceState(history.state, '', `${location.pathname}${location.hash}`);
  } catch {
    // Manche Umgebungen (z. B. sandboxed iframes) verbieten das – ohne Folgen.
  }
}
