import { categoryColorAt } from './colors';
import type { CategoryColor } from './colors';
import { findClue } from './reducer';
import type { Category, Clue, ClueOutcome, GameState, ScoreEvent, Team } from './types';

/**
 * Punktestand eines Teams. Die Klammerung auf null erfolgt **schrittweise** je
 * Wertung: Stand 100 und eine falsche Antwort auf eine 200er-Frage ergibt 0,
 * nicht -100.
 */
export function selectScore(state: GameState, teamId: string): number {
  return state.events
    .filter((event) => event.teamId === teamId)
    .reduce((score, event) => Math.max(0, score + event.delta), 0);
}

export function selectIsClueScored(state: GameState, clueId: string): boolean {
  return state.events.some((event) => event.clueId === clueId);
}

export function selectClueEvents(state: GameState, clueId: string): ScoreEvent[] {
  return state.events.filter((event) => event.clueId === clueId);
}

export function selectOpenClue(state: GameState): { clue: Clue; category: Category } | null {
  if (!state.definition || !state.openClueId) return null;
  return findClue(state.definition, state.openClueId);
}

export function selectClueCount(state: GameState): number {
  if (!state.definition) return 0;
  return state.definition.categories.reduce((total, cat) => total + cat.clues.length, 0);
}

/** Anzahl gespielter Karten – nicht Anzahl Wertungen, denn eine Frage erzeugt mehrere. */
export function selectScoredCount(state: GameState): number {
  return new Set(state.events.map((event) => event.clueId)).size;
}

/** Noch nicht gewertete Karten – Grundlage für das Funkeln am Spielende. */
export function selectOpenClueCount(state: GameState): number {
  return Math.max(0, selectClueCount(state) - selectScoredCount(state));
}

export function selectIsFinished(state: GameState): boolean {
  const total = selectClueCount(state);
  return total > 0 && selectScoredCount(state) >= total;
}

/** Ein einzelnes Team bedeutet Übungsmodus: gleiche Regeln, aber kein Ranking. */
export function selectIsPracticeMode(state: GameState): boolean {
  return state.teams.length === 1;
}

export function selectTeamStats(
  state: GameState,
  teamId: string,
): { correct: number; wrong: number } {
  const events = state.events.filter((event) => event.teamId === teamId);
  return {
    correct: events.filter((event) => event.outcome === 'correct').length,
    wrong: events.filter((event) => event.outcome === 'wrong').length,
  };
}

/** Ab so vielen gleichen Ausgängen in Folge gilt eine Serie als Serie. */
export const STREAK_MIN = 3;

export interface TeamStreak {
  /** Richtige oder falsche Antworten – gemischt gibt es keine Serie. */
  kind: ClueOutcome;
  /** Länge der Serie, mindestens `STREAK_MIN`. */
  length: number;
}

/**
 * Laufende Serie eines Teams, sonst null. Gezählt werden **nur eigene
 * Beteiligungen**: Fragen, die andere Teams unter sich ausmachen, unterbrechen
 * die Serie nicht – sonst käme bei vielen Teams kaum jemand auf drei in Folge.
 */
export function selectStreak(state: GameState, teamId: string): TeamStreak | null {
  const own = state.events.filter((event) => event.teamId === teamId);
  const last = own.at(-1);
  if (!last) return null;

  let length = 0;
  for (let index = own.length - 1; index >= 0; index -= 1) {
    if (own[index]?.outcome !== last.outcome) break;
    length += 1;
  }

  return length >= STREAK_MIN ? { kind: last.outcome, length } : null;
}

export interface RankedTeam {
  team: Team;
  score: number;
  rank: number;
}

/** Absteigend nach Punkten; gleiche Punktzahl ergibt denselben Rang. */
export function selectRanking(state: GameState): RankedTeam[] {
  const scored = state.teams
    .map((team) => ({ team, score: selectScore(state, team.id) }))
    .sort((a, b) => b.score - a.score);

  let previousScore: number | null = null;
  let previousRank = 0;

  return scored.map((entry, index) => {
    const rank = previousScore === entry.score ? previousRank : index + 1;
    previousScore = entry.score;
    previousRank = rank;
    return { ...entry, rank };
  });
}

/** Farbe einer Kategorie: Angabe aus dem Fragenset, sonst Position im Spielfeld. */
export function resolveCategoryColor(category: Category, index: number): CategoryColor {
  return category.color ?? categoryColorAt(index);
}

// ---------------------------------------------------------------------------
// Veto-Runde
// ---------------------------------------------------------------------------

/** Team, das bei der offenen Frage gerade antwortet. */
export function selectActiveTeam(state: GameState): Team | null {
  if (state.activeTeamId === null) return null;
  return state.teams.find((team) => team.id === state.activeTeamId) ?? null;
}

/** Team mit dem ersten Zugriff auf die nächste Frage. */
export function selectStartingTeam(state: GameState): Team | null {
  if (state.teams.length === 0) return null;
  return state.teams[state.startingTeamIndex % state.teams.length] ?? null;
}

export function selectIsTimerRunning(state: GameState): boolean {
  return state.timerEndsAt !== null;
}

/** Teams, die sich an der offenen Frage beteiligt haben – in Reihenfolge. */
export function selectAnsweringTeams(state: GameState): Team[] {
  return state.answeringTeamIds
    .map((id) => state.teams.find((team) => team.id === id))
    .filter((team): team is Team => team !== undefined);
}

/** Teams, die bei der offenen Frage noch ein Veto einlegen dürfen. */
export function selectVetoCandidates(state: GameState): Team[] {
  if (!state.openClueId || state.answerRevealed) return [];
  return state.teams.filter((team) => !state.answeringTeamIds.includes(team.id));
}

/** Ob das Team am Zug seine Frist bereits ausgeschöpft hat. */
export function selectIsTimeUp(state: GameState): boolean {
  return state.openClueId !== null && !state.answerRevealed && state.timerEndsAt === null;
}

export interface ClueSummary {
  /** Team mit der richtigen Antwort; null, wenn niemand richtig lag. */
  winner: Team | null;
  /** Beteiligte Teams ohne den Gewinner. */
  losers: Team[];
  /** Punktzahl der Frage. */
  points: number;
}

/** Ausgang einer gespielten Frage – Grundlage für die Markierung im Spielfeld. */
export function selectClueSummary(state: GameState, clueId: string): ClueSummary | null {
  const events = selectClueEvents(state, clueId);
  if (events.length === 0 || !state.definition) return null;

  const found = findClue(state.definition, clueId);
  if (!found) return null;

  const teamOf = (id: string): Team | null => state.teams.find((team) => team.id === id) ?? null;
  const winnerEvent = events.find((event) => event.outcome === 'correct');

  return {
    winner: winnerEvent ? teamOf(winnerEvent.teamId) : null,
    losers: events
      .filter((event) => event.outcome === 'wrong')
      .map((event) => teamOf(event.teamId))
      .filter((team): team is Team => team !== null),
    points: found.clue.points,
  };
}
