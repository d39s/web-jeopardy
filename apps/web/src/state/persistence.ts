import {
  DIFFICULTIES,
  TIMER_OPTIONS,
  WRONG_PENALTIES,
  validateGameState,
} from '@jeopardy/game-core';
import type { Difficulty, GameState, Team, WrongPenalty } from '@jeopardy/game-core';

const STATE_KEY = 'jeopardy:v1:state';
const SETUP_KEY = 'jeopardy:v1:lastSetup';
/** Vorgänger von `SETUP_KEY`: kannte nur die Teams. Wird nur noch gelesen. */
const LEGACY_TEAMS_KEY = 'jeopardy:v1:lastTeams';

/**
 * localStorage kann fehlen, gesperrt sein (privater Modus, Kiosk) oder – etwa in
 * Testumgebungen – nur unvollständig existieren. Daher wird die Schnittstelle
 * geprüft, bevor sie genutzt wird.
 */
function getStorage(): Storage | null {
  try {
    const candidate: Storage | undefined = globalThis.localStorage;
    if (!candidate || typeof candidate.getItem !== 'function') return null;
    return candidate;
  } catch {
    return null;
  }
}

export function loadPersistedState(storage: Storage | null = getStorage()): GameState | null {
  const raw = storage?.getItem(STATE_KEY);
  if (!raw) return null;

  try {
    const result = validateGameState(JSON.parse(raw));
    if (!result.ok) {
      // Alter oder beschädigter Eintrag: verwerfen statt die App scheitern zu lassen.
      storage?.removeItem(STATE_KEY);
      return null;
    }
    return result.data;
  } catch {
    storage?.removeItem(STATE_KEY);
    return null;
  }
}

export function persistState(state: GameState, storage: Storage | null = getStorage()): void {
  try {
    storage?.setItem(STATE_KEY, JSON.stringify(state));
  } catch {
    // Speicher voll oder gesperrt – das Spiel läuft ohne Persistenz weiter.
  }
}

export function clearPersistedState(storage: Storage | null = getStorage()): void {
  try {
    storage?.removeItem(STATE_KEY);
  } catch {
    // bewusst ignoriert
  }
}

/**
 * Einstellungen der zuletzt gestarteten Partie. Sie füllen die Startseite
 * vor, damit eine weitere Runde nicht alles von Hand verlangt. Das Spielfeld
 * gehört bewusst nicht dazu: Es wird für jede Partie neu gezogen.
 */
export interface LastSetup {
  teams: Team[];
  /** Zuletzt gewähltes Thema; null nach einem hochgeladenen Fragenset. */
  categoryId: string | null;
  /** Reglerstellung; null, wenn nichts Gültiges gespeichert war. */
  level: Difficulty | null;
  /** Bedenkzeit je Frage in Sekunden; null bedeutet ohne Zeitbegrenzung. */
  timerSeconds: number | null;
  /** Veto-Zeit in Sekunden; null koppelt sie an die Bedenkzeit. */
  vetoSeconds: number | null;
  wrongPenalty: WrongPenalty;
}

export function saveLastSetup(setup: LastSetup, storage: Storage | null = getStorage()): void {
  try {
    storage?.setItem(SETUP_KEY, JSON.stringify(setup));
  } catch {
    // bewusst ignoriert
  }
}

function readTeams(value: unknown): Team[] {
  if (!Array.isArray(value)) return [];

  return value.filter(
    (entry): entry is Team =>
      typeof entry === 'object' &&
      entry !== null &&
      typeof (entry as Team).id === 'string' &&
      typeof (entry as Team).name === 'string',
  );
}

function readLevel(value: unknown): Difficulty | null {
  return (DIFFICULTIES as readonly unknown[]).includes(value) ? (value as Difficulty) : null;
}

/** Nur die angebotenen Stufen sind zulässig; alles andere gilt als „nicht gesetzt". */
function readTimerOption(value: unknown): number | null {
  return (TIMER_OPTIONS as readonly unknown[]).includes(value) ? (value as number) : null;
}

function readPenalty(value: unknown): WrongPenalty {
  return (WRONG_PENALTIES as readonly unknown[]).includes(value) ? (value as WrongPenalty) : 'full';
}

/**
 * Liest die gemerkten Einstellungen. Jeder Wert wird einzeln geprüft: Ein alter
 * oder beschädigter Eintrag darf die Startseite nicht kippen, sondern fällt auf
 * den jeweiligen Standard zurück. Fehlt der Eintrag ganz, kommen wenigstens die
 * Teams aus dem Vorgängerformat zum Zug.
 */
export function loadLastSetup(storage: Storage | null = getStorage()): LastSetup | null {
  const raw = storage?.getItem(SETUP_KEY);
  if (!raw) return loadLegacySetup(storage);

  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return loadLegacySetup(storage);

    const entry = parsed as Record<string, unknown>;
    const teams = readTeams(entry.teams);

    return {
      teams,
      categoryId: typeof entry.categoryId === 'string' ? entry.categoryId : null,
      level: readLevel(entry.level),
      timerSeconds: readTimerOption(entry.timerSeconds),
      vetoSeconds: readTimerOption(entry.vetoSeconds),
      wrongPenalty: readPenalty(entry.wrongPenalty),
    };
  } catch {
    return loadLegacySetup(storage);
  }
}

/** Teams aus dem Vorgängerformat – alles Übrige bleibt auf Standard. */
function loadLegacySetup(storage: Storage | null): LastSetup | null {
  const raw = storage?.getItem(LEGACY_TEAMS_KEY);
  if (!raw) return null;

  try {
    const teams = readTeams(JSON.parse(raw));
    if (teams.length === 0) return null;

    return {
      teams,
      categoryId: null,
      level: null,
      timerSeconds: null,
      vetoSeconds: null,
      wrongPenalty: 'full',
    };
  } catch {
    return null;
  }
}
