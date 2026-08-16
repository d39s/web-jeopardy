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

/** Ausgang für ein einzelnes beteiligtes Team. */
export type ClueOutcome = 'correct' | 'wrong';

/**
 * Wertung eines Teams zu einer Frage. Eine Frage erzeugt eine Wertung je
 * beteiligtem Team: höchstens eine richtige, dazu je eine für die Unterlegenen.
 */
export interface ScoreEvent {
  id: string;
  clueId: string;
  teamId: string;
  outcome: ClueOutcome;
  /**
   * Positiv bei richtiger Antwort, negativ bei falscher – oder 0, wenn die
   * Abzugsregel ausgeschaltet ist.
   */
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
  /** Bedenkzeit für das Team, das die Frage beginnt; null bedeutet ohne Timer. */
  timerSeconds: number | null;
  /**
   * Zeit für ein per Veto übernehmendes Team. `null` koppelt sie an die
   * Bedenkzeit – ohne eigene Angabe gilt also derselbe Wert.
   */
  vetoSeconds: number | null;
  /** Team mit dem ersten Zugriff auf die nächste Frage – wechselt reihum. */
  startingTeamIndex: number;
  /** Team, das bei der geöffneten Frage gerade antwortet. */
  activeTeamId: string | null;
  /**
   * Teams, die bei der offenen Frage schon am Zug waren, in dieser Reihenfolge.
   * Das erste hat die Frage begonnen, das letzte antwortet gerade. Nur diese
   * Teams werden am Ende gewertet.
   */
  answeringTeamIds: string[];
  /** Zeitpunkt (epoch ms), zu dem die laufende Frist endet. */
  timerEndsAt: number | null;
  /**
   * Ob eine falsche Antwort Punkte kostet. Ist die Regel aus, bleibt der
   * Punktestand bei einer falschen Antwort unverändert.
   */
  deductOnWrong: boolean;
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
      /** Ohne Angabe gilt für Übernahmen dieselbe Zeit wie für den Anfang. */
      vetoSeconds?: number | null;
      /** Ohne Angabe kosten falsche Antworten Punkte. */
      deductOnWrong?: boolean;
    }
  | { type: 'team/rename'; teamId: string; name: string }
  | { type: 'clue/open'; clueId: string; at: number }
  | { type: 'clue/revealAnswer' }
  | { type: 'clue/close' }
  /** Die Frist des Teams am Zug ist abgelaufen. Sonst passiert nichts. */
  | { type: 'clue/timerExpired'; at: number }
  /** Ein anderes Team legt Veto ein und übernimmt den Zugriff. */
  | { type: 'clue/veto'; teamId: string; at: number }
  /**
   * Schließt die Frage ab: Der Gewinner erhält die Punkte, die übrigen
   * Beteiligten werden als falsch gewertet. `null` heißt „keine richtige
   * Antwort gegeben".
   */
  | { type: 'score/settle'; clueId: string; winnerTeamId: string | null; at: number }
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
