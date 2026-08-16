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

export function selectClueEvent(state: GameState, clueId: string): ScoreEvent | null {
  return state.events.find((event) => event.clueId === clueId) ?? null;
}

export function selectOpenClue(state: GameState): { clue: Clue; category: Category } | null {
  if (!state.definition || !state.openClueId) return null;
  return findClue(state.definition, state.openClueId);
}

export function selectClueCount(state: GameState): number {
  if (!state.definition) return 0;
  return state.definition.categories.reduce((total, cat) => total + cat.clues.length, 0);
}

export function selectScoredCount(state: GameState): number {
  return state.events.length;
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

export interface ClueResult {
  outcome: ClueOutcome;
  /** Null, wenn die Zeit bei allen Teams abgelaufen ist. */
  team: Team | null;
  delta: number;
}

/** Ausgang einer gespielten Frage – Grundlage für die Markierung im Spielfeld. */
export function selectClueResult(state: GameState, clueId: string): ClueResult | null {
  const event = state.events.find((entry) => entry.clueId === clueId);
  if (!event) return null;

  return {
    outcome: event.outcome,
    team: state.teams.find((team) => team.id === event.teamId) ?? null,
    delta: event.delta,
  };
}

/** Team, das bei der geöffneten Frage gerade den Zugriff hat. */
export function selectActiveTeam(state: GameState): Team | null {
  if (state.teams.length === 0) return null;
  return state.teams[state.activeTeamIndex % state.teams.length] ?? null;
}

/** Team mit dem ersten Zugriff auf die nächste Frage. */
export function selectStartingTeam(state: GameState): Team | null {
  if (state.teams.length === 0) return null;
  return state.teams[state.startingTeamIndex % state.teams.length] ?? null;
}

export function selectIsTimerRunning(state: GameState): boolean {
  return state.timerEndsAt !== null;
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
