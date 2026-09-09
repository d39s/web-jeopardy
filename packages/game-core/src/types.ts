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

/** Schwierigkeitsstufen – dieselbe Skala für einzelne Fragen und für den Regler. */
export const DIFFICULTIES = [1, 2, 3, 4, 5] as const;
export type Difficulty = (typeof DIFFICULTIES)[number];

/**
 * Welche Stufe jede der fünf Zeilen bekommt, abhängig vom Reglerwert.
 *
 * Der Regler verschiebt ein Fenster über die Skala, statt eine feste Stufe für
 * alle 25 Karten zu setzen: Innerhalb des Bretts soll die Härte weiter von der
 * 100er- zur 500er-Zeile steigen, sonst gäbe es keinen Grund, die teuren Karten
 * zu wagen. An den Enden staucht sich das Fenster, damit es die Skala nicht
 * verlässt – Stufe 1 bleibt also auch ganz links am leichten Rand.
 */
export const DIFFICULTY_BANDS: Record<Difficulty, readonly Difficulty[]> = {
  1: [1, 1, 2, 2, 3],
  2: [1, 2, 2, 3, 4],
  3: [1, 2, 3, 4, 5],
  4: [2, 3, 4, 4, 5],
  5: [3, 4, 4, 5, 5],
};

/**
 * Anschlag der Skala. Die Zusicherung ist nötig, weil der Index aus `length`
 * berechnet wird und TypeScript daraus nur `Difficulty | undefined` ableitet.
 */
export const MAX_DIFFICULTY = DIFFICULTIES[DIFFICULTIES.length - 1] as Difficulty;

/** Punktestufen der fünf Zeilen. Gezogene Bretter nutzen immer diese Werte. */
export const POINT_STEPS = [100, 200, 300, 400, 500] as const;

/**
 * Eine Frage im Vorrat. Anders als `Clue` trägt sie keine Punkte: Die ergeben
 * sich erst beim Ziehen aus der Zeile, in der die Frage landet.
 */
export interface PoolClue {
  id: string;
  /** Absolute Schwierigkeit 1 bis 5, unabhängig von der späteren Zeile. */
  level: Difficulty;
  question: string;
  answer: string;
  /** Optionaler Moderatorenhinweis, wird nie auf dem Spielfeld angezeigt. */
  note?: string;
}

/**
 * Rubrik eines Pools – beim Ziehen wird daraus eine Spalte des Spielfelds.
 * Eine Rubrik mit Fragen auf allen fünf Stufen steht für jede Reglerstellung
 * zur Verfügung; fehlen Stufen, kommt sie nur für einen Teil davon infrage.
 */
export interface PoolRubric {
  id: string;
  name: string;
  /** Ohne Angabe ergibt sich die Farbe aus der Position im gezogenen Brett. */
  color?: CategoryColor;
  clues: PoolClue[];
}

/**
 * Fragenvorrat einer Themenkategorie – eine Datei je Kategorie. Aus ihm zieht
 * jede Partie ein eigenes Spielfeld, siehe `drawBoard`.
 */
export interface QuestionPool {
  schemaVersion: 1;
  id: string;
  title: string;
  description?: string;
  author?: string;
  locale?: string;
  rubrics: PoolRubric[];
}

export interface GameDefinition {
  schemaVersion: 1;
  id: string;
  title: string;
  /** Themenkategorie, in der das Fragenset zur Auswahl steht. */
  category: string;
  /** 1 bis 5 – bei gezogenen Brettern die Reglerstellung. */
  difficulty: Difficulty;
  description?: string;
  author?: string;
  locale?: string;
  pointSteps: number[];
  categories: Category[];
}

/**
 * Themenkategorie der Startseite – nicht zu verwechseln mit `Category`, den
 * fünf Spalten des Spielfelds. Jede Themenkategorie hat genau einen Fragenpool;
 * die Schwierigkeit wählt der Regler, nicht die Auswahl.
 */
export interface TopicCategory {
  id: string;
  title: string;
  description?: string;
  /** Datei des Fragenpools, relativ zum Themenverzeichnis. */
  file: string;
}

export interface TopicIndex {
  schemaVersion: 2;
  categories: TopicCategory[];
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
 * Was eine falsche Antwort kostet: die volle Punktzahl der Frage, die halbe
 * als Zwischenstufe oder gar nichts.
 */
export const WRONG_PENALTIES = ['full', 'half', 'none'] as const;
export type WrongPenalty = (typeof WRONG_PENALTIES)[number];

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
   * Abzugsregel das vorsieht.
   */
  delta: number;
  /**
   * Ob das Team per Veto in die Frage eingestiegen ist. Das Team, das die Frage
   * begonnen hat, ist es nie. Wird für Rückblick und Statistik gebraucht.
   */
  viaVeto: boolean;
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
   * Was eine falsche Antwort kostet – volle, halbe oder keine Punktzahl der
   * Frage.
   */
  wrongPenalty: WrongPenalty;
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
      /** Ohne Angabe kostet eine falsche Antwort die volle Punktzahl. */
      wrongPenalty?: WrongPenalty;
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
