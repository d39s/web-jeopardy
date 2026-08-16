import { MAX_TEAM_NAME_LENGTH, MIN_TEAMS } from './teams';
import type {
  Category,
  Clue,
  ClueOutcome,
  GameAction,
  GameDefinition,
  GameState,
  ScoreEvent,
} from './types';

export const initialGameState: GameState = {
  phase: 'setup',
  definition: null,
  teams: [],
  events: [],
  openClueId: null,
  answerRevealed: false,
  timerSeconds: null,
  startingTeamIndex: 0,
  activeTeamIndex: 0,
  timerEndsAt: null,
  deductOnWrong: true,
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

function deadlineFrom(state: GameState, at: number): number | null {
  return state.timerSeconds === null ? null : at + state.timerSeconds * 1000;
}

/**
 * Schließt die geöffnete Frage mit einem Ergebnis ab: Wertung eintragen, Popup
 * schließen, Timer stoppen und den ersten Zugriff an das nächste Team weitergeben.
 */
function finishClue(
  state: GameState,
  clueId: string,
  teamId: string | null,
  outcome: ClueOutcome,
  delta: number,
  at: number,
): GameState {
  const event: ScoreEvent = {
    id: `${clueId}:${teamId ?? 'niemand'}:${state.events.length}`,
    clueId,
    teamId,
    outcome,
    delta,
    at,
  };
  const events = [...state.events, event];
  const allScored = state.definition !== null && events.length >= countClues(state.definition);

  return {
    ...state,
    events,
    openClueId: null,
    answerRevealed: false,
    timerEndsAt: null,
    // Reihum: die nächste Frage beginnt beim nächsten Team.
    startingTeamIndex: (state.startingTeamIndex + 1) % Math.max(1, state.teams.length),
    phase: allScored ? 'finished' : state.phase,
  };
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
        ...initialGameState,
        phase: 'playing',
        definition: action.definition,
        teams: action.teams,
        timerSeconds: action.timerSeconds ?? null,
        deductOnWrong: action.deductOnWrong ?? true,
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
      return {
        ...state,
        openClueId: action.clueId,
        answerRevealed: false,
        activeTeamIndex: state.startingTeamIndex % Math.max(1, state.teams.length),
        timerEndsAt: deadlineFrom(state, action.at),
      };
    }

    // Mit der Antwort endet die Bedenkzeit.
    case 'clue/revealAnswer': {
      if (!state.openClueId || state.answerRevealed) return state;
      return { ...state, answerRevealed: true, timerEndsAt: null };
    }

    case 'clue/close': {
      if (!state.openClueId) return state;
      return { ...state, openClueId: null, answerRevealed: false, timerEndsAt: null };
    }

    case 'clue/timerExpired': {
      if (!state.openClueId || state.timerEndsAt === null) return state;
      // Nur eine tatsächlich verstrichene Frist zählt. Das schützt vor doppelt
      // gemeldeten Abläufen und, in Phase 2, vor verspäteten Meldungen anderer
      // Clients – sonst würde ein Team seinen Zugriff verlieren.
      if (action.at < state.timerEndsAt) return state;

      const teamCount = Math.max(1, state.teams.length);
      const nextTeamIndex = (state.activeTeamIndex + 1) % teamCount;

      // Sind alle Teams durch, gilt die Frage als gespielt – ohne Punkte.
      if (nextTeamIndex === state.startingTeamIndex % teamCount) {
        return finishClue(state, state.openClueId, null, 'unanswered', 0, action.at);
      }

      return {
        ...state,
        activeTeamIndex: nextTeamIndex,
        timerEndsAt: deadlineFrom(state, action.at),
      };
    }

    case 'score/award': {
      if (!state.definition) return state;
      const found = findClue(state.definition, action.clueId);
      if (!found) return state;
      if (!state.teams.some((team) => team.id === action.teamId)) return state;
      // Schutz gegen Doppelklick und gegen konkurrierende Wertungen in Phase 2.
      if (isClueScored(state.events, action.clueId)) return state;

      // Falsche Antworten kosten nur Punkte, wenn die Regel eingeschaltet ist.
      const delta = action.correct
        ? found.clue.points
        : state.deductOnWrong
          ? -found.clue.points
          : 0;

      return finishClue(
        state,
        action.clueId,
        action.teamId,
        action.correct ? 'correct' : 'wrong',
        delta,
        action.at,
      );
    }

    case 'game/reset':
      return initialGameState;

    default:
      return state;
  }
}
