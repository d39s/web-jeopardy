import { validateGameState } from '@jeopardy/game-core';
import type { GameState, Team } from '@jeopardy/game-core';

const STATE_KEY = 'jeopardy:v1:state';
const TEAMS_KEY = 'jeopardy:v1:lastTeams';

/** localStorage kann fehlen oder gesperrt sein (privater Modus, Kiosk). */
function getStorage(): Storage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
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

export function saveLastTeams(teams: Team[], storage: Storage | null = getStorage()): void {
  try {
    storage?.setItem(TEAMS_KEY, JSON.stringify(teams));
  } catch {
    // bewusst ignoriert
  }
}

export function loadLastTeams(storage: Storage | null = getStorage()): Team[] | null {
  const raw = storage?.getItem(TEAMS_KEY);
  if (!raw) return null;

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;

    const teams = parsed.filter(
      (entry): entry is Team =>
        typeof entry === 'object' &&
        entry !== null &&
        typeof (entry as Team).id === 'string' &&
        typeof (entry as Team).name === 'string',
    );
    return teams.length > 0 ? teams : null;
  } catch {
    return null;
  }
}
