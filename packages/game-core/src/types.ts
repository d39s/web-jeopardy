import type { CategoryColor } from './colors';

/** Anzahl Kategorien und Fragen je Kategorie – das Spielfeld ist per Anforderung 5x5. */
export const CATEGORY_COUNT = 5;
export const CLUES_PER_CATEGORY = 5;
export const CLUE_COUNT = CATEGORY_COUNT * CLUES_PER_CATEGORY;

// ---------------------------------------------------------------------------
// Inhalte (aus JSON geladen)
// ---------------------------------------------------------------------------

export interface Clue {
  id: string;
  points: number;
  question: string;
  answer: string;
  /** Optionaler Moderatorenhinweis, wird nie auf dem Spielfeld angezeigt. */
  note?: string;
}

export interface Category {
  id: string;
  name: string;
  /** Ohne Angabe ergibt sich die Farbe aus der Position der Kategorie. */
  color?: CategoryColor;
  clues: Clue[];
}

export interface GameDefinition {
  schemaVersion: 1;
  id: string;
  title: string;
  description?: string;
  author?: string;
  locale?: string;
  pointSteps: number[];
  categories: Category[];
}

export interface TopicIndexEntry {
  id: string;
  title: string;
  description?: string;
  /** Dateiname relativ zum Themenverzeichnis. */
  file: string;
}

export interface TopicIndex {
  schemaVersion: 1;
  topics: TopicIndexEntry[];
}

// ---------------------------------------------------------------------------
// Laufender Spielstand
// ---------------------------------------------------------------------------

/**
 * Teams sind eine Liste beliebiger Länge (mindestens eins). Ein einzelnes Team
 * ist der Übungsmodus; es gibt dafür keinen Sondertyp, nur einen Selektor.
 */
export interface Team {
  id: string;
  name: string;
}

/**
 * Ausgang einer gespielten Frage. `unanswered` entsteht, wenn die Zeit bei
 * allen Teams abgelaufen ist – die Frage gilt dann als gespielt, ohne Punkte.
 */
export type ClueOutcome = 'correct' | 'wrong' | 'unanswered';

export interface ScoreEvent {
  id: string;
  clueId: string;
  /** Null, wenn niemand geantwortet hat. */
  teamId: string | null;
  outcome: ClueOutcome;
  /** Positiv bei richtiger, negativ bei falscher Antwort, 0 ohne Antwort. */
  delta: number;
  at: number;
}

export type GamePhase = 'setup' | 'playing' | 'finished';

/** Auswählbare Bedenkzeiten je Frage; `null` bedeutet „ohne Timer". */
export const TIMER_OPTIONS = [10, 15, 20, 30, 45, 60, 90, 120, 180, 240, 300] as const;

export interface GameState {
  phase: GamePhase;
  definition: GameDefinition | null;
  teams: Team[];
  /** Einzige Quelle für alle Punktestände. */
  events: ScoreEvent[];
  openClueId: string | null;
  answerRevealed: boolean;
  /** Bedenkzeit je Team und Frage in Sekunden; null bedeutet ohne Timer. */
  timerSeconds: number | null;
  /** Team mit dem ersten Zugriff auf die nächste Frage – wechselt reihum. */
  startingTeamIndex: number;
  /** Team, das bei der geöffneten Frage gerade am Zug ist. */
  activeTeamIndex: number;
  /** Zeitpunkt (epoch ms), zu dem die laufende Bedenkzeit endet. */
  timerEndsAt: number | null;
}

// ---------------------------------------------------------------------------
// Actions – serialisierbar, damit sie in Phase 2 über das Netz laufen können
// ---------------------------------------------------------------------------

export type GameAction =
  | {
      type: 'game/start';
      definition: GameDefinition;
      teams: Team[];
      /** Ohne Angabe wird ohne Timer gespielt. */
      timerSeconds?: number | null;
    }
  | { type: 'team/rename'; teamId: string; name: string }
  | { type: 'clue/open'; clueId: string; at: number }
  | { type: 'clue/revealAnswer' }
  | { type: 'clue/close' }
  /** Die Bedenkzeit des Teams am Zug ist abgelaufen. */
  | { type: 'clue/timerExpired'; at: number }
  | { type: 'score/award'; clueId: string; teamId: string; correct: boolean; at: number }
  | { type: 'game/reset' };

/**
 * Einzige Schnittstelle der Oberfläche zum Spielstand. Phase 1 liefert eine
 * lokale Implementierung, Phase 2 eine über WebSocket – ohne Änderung an der UI.
 */
export interface GameTransport {
  getState(): GameState;
  dispatch(action: GameAction): void;
  subscribe(listener: (state: GameState) => void): () => void;
}
