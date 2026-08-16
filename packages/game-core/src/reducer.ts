import { MAX_TEAM_NAME_LENGTH, MIN_TEAMS } from './teams';
import type { Category, Clue, GameAction, GameDefinition, GameState, ScoreEvent } from './types';

export const initialGameState: GameState = {
  phase: 'setup',
  definition: null,
  teams: [],
  events: [],
  openClueId: null,
  answerRevealed: false,
};

export function findClue(
  definition: GameDefinition,
  clueId: string,
): { clue: Clue; category: Category } | null {
  for (const category of definition.categories) {
    const clue = category.clues.find((candidate) => candidate.id === clueId);
    if (clue) return { clue, category };
  }
  return null;
}

function isClueScored(events: ScoreEvent[], clueId: string): boolean {
  return events.some((event) => event.clueId === clueId);
}

function countClues(definition: GameDefinition): number {
  return definition.categories.reduce((total, category) => total + category.clues.length, 0);
}

/**
 * Zentrale Spielregel. Rein und deterministisch: keine Zeit-, Zufalls- oder
 * Browser-Quellen – Zeitstempel und IDs kommen über die Action bzw. ergeben
 * sich aus dem Zustand. Dadurch kann derselbe Reducer in Phase 2
 * serverautoritativ laufen.
 */
export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'game/start': {
      if (action.teams.length < MIN_TEAMS) return state;
      return {
        phase: 'playing',
        definition: action.definition,
        teams: action.teams,
        events: [],
        openClueId: null,
        answerRevealed: false,
      };
    }

    case 'team/rename': {
      const name = action.name.trim().slice(0, MAX_TEAM_NAME_LENGTH);
      if (!name) return state;
      if (!state.teams.some((team) => team.id === action.teamId)) return state;
      return {
        ...state,
        teams: state.teams.map((team) => (team.id === action.teamId ? { ...team, name } : team)),
      };
    }

    // Öffnen ist bewusst folgenlos für die Punkte: Die Karte wird erst grau,
    // wenn gewertet wurde.
    case 'clue/open': {
      if (!state.definition) return state;
      if (!findClue(state.definition, action.clueId)) return state;
      if (isClueScored(state.events, action.clueId)) return state;
      return { ...state, openClueId: action.clueId, answerRevealed: false };
    }

    case 'clue/revealAnswer': {
      if (!state.openClueId || state.answerRevealed) return state;
      return { ...state, answerRevealed: true };
    }

    case 'clue/close': {
      if (!state.openClueId) return state;
      return { ...state, openClueId: null, answerRevealed: false };
    }

    case 'score/award': {
      if (!state.definition) return state;
      const found = findClue(state.definition, action.clueId);
      if (!found) return state;
      if (!state.teams.some((team) => team.id === action.teamId)) return state;
      // Schutz gegen Doppelklick und gegen konkurrierende Wertungen in Phase 2.
      if (isClueScored(state.events, action.clueId)) return state;

      const event: ScoreEvent = {
        id: `${action.clueId}:${action.teamId}:${state.events.length}`,
        clueId: action.clueId,
        teamId: action.teamId,
        correct: action.correct,
        delta: action.correct ? found.clue.points : -found.clue.points,
        at: action.at,
      };
      const events = [...state.events, event];
      const allScored = events.length >= countClues(state.definition);

      return {
        ...state,
        events,
        openClueId: null,
        answerRevealed: false,
        phase: allScored ? 'finished' : state.phase,
      };
    }

    case 'game/reset':
      return initialGameState;

    default:
      return state;
  }
}
