import { MAX_TEAM_NAME_LENGTH, MIN_TEAMS } from './teams';
import type { Category, Clue, GameAction, GameDefinition, GameState, ScoreEvent } from './types';

export const initialGameState: GameState = {
  phase: 'setup',
  definition: null,
  teams: [],
  events: [],
  openClueId: null,
  answerRevealed: false,
  timerSeconds: null,
  vetoSeconds: null,
  startingTeamIndex: 0,
  activeTeamId: null,
  answeringTeamIds: [],
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

function countScoredClues(events: ScoreEvent[]): number {
  return new Set(events.map((event) => event.clueId)).size;
}

/**
 * Zeit für ein per Veto übernehmendes Team. Ohne eigenen Wert gilt die
 * Bedenkzeit – die Kopplung ist der Standard, kein Sonderfall.
 */
export function effectiveVetoSeconds(state: GameState): number | null {
  return state.vetoSeconds ?? state.timerSeconds;
}

function deadline(seconds: number | null, at: number): number | null {
  return seconds === null ? null : at + seconds * 1000;
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
        vetoSeconds: action.vetoSeconds ?? null,
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

    // Öffnen ist folgenlos für die Punkte: Die Karte wird erst grau, wenn
    // gewertet wurde. Das Team am Zug gilt ab hier als beteiligt – es
    // antwortet zwingend, einen Zustand „hat nichts gesagt" gibt es nicht.
    case 'clue/open': {
      if (!state.definition) return state;
      if (!findClue(state.definition, action.clueId)) return state;
      if (isClueScored(state.events, action.clueId)) return state;

      const starting = state.teams[state.startingTeamIndex % Math.max(1, state.teams.length)];
      if (!starting) return state;

      return {
        ...state,
        openClueId: action.clueId,
        answerRevealed: false,
        activeTeamId: starting.id,
        answeringTeamIds: [starting.id],
        timerEndsAt: deadline(state.timerSeconds, action.at),
      };
    }

    // Ein anderes Team übernimmt. Jedes Team darf das höchstens einmal je
    // Frage; die Frist beginnt mit der Veto-Zeit neu.
    case 'clue/veto': {
      if (!state.openClueId || state.answerRevealed) return state;
      if (!state.teams.some((team) => team.id === action.teamId)) return state;
      if (state.answeringTeamIds.includes(action.teamId)) return state;

      return {
        ...state,
        activeTeamId: action.teamId,
        answeringTeamIds: [...state.answeringTeamIds, action.teamId],
        timerEndsAt: deadline(effectiveVetoSeconds(state), action.at),
      };
    }

    // Mit der Antwort endet die Frist und damit die Veto-Auswahl.
    case 'clue/revealAnswer': {
      if (!state.openClueId || state.answerRevealed) return state;
      return { ...state, answerRevealed: true, timerEndsAt: null };
    }

    case 'clue/close': {
      if (!state.openClueId) return state;
      // Die Runde wird verworfen: Beteiligte werden vergessen, die Karte
      // bleibt spielbar.
      return {
        ...state,
        openClueId: null,
        answerRevealed: false,
        activeTeamId: null,
        answeringTeamIds: [],
        timerEndsAt: null,
      };
    }

    // Fristablauf beendet allein die Frist. Wie es weitergeht, entscheidet die
    // Moderation über die Veto-Auswahl.
    case 'clue/timerExpired': {
      if (!state.openClueId || state.timerEndsAt === null) return state;
      // Nur eine tatsächlich verstrichene Frist zählt – das schützt vor doppelt
      // oder verspätet gemeldeten Abläufen, in Phase 2 auch von anderen Clients.
      if (action.at < state.timerEndsAt) return state;

      return { ...state, timerEndsAt: null };
    }

    case 'score/settle': {
      if (!state.definition) return state;
      const found = findClue(state.definition, action.clueId);
      if (!found) return state;
      if (action.clueId !== state.openClueId) return state;
      // Schutz gegen Doppelklick und konkurrierende Wertungen in Phase 2.
      if (isClueScored(state.events, action.clueId)) return state;
      if (state.answeringTeamIds.length === 0) return state;
      // Nur ein beteiligtes Team kann gewinnen; Unbeteiligte bleiben außen vor.
      if (action.winnerTeamId !== null && !state.answeringTeamIds.includes(action.winnerTeamId)) {
        return state;
      }

      const points = found.clue.points;
      const events = [
        ...state.events,
        ...state.answeringTeamIds.map((teamId, index): ScoreEvent => {
          const correct = teamId === action.winnerTeamId;
          return {
            id: `${action.clueId}:${teamId}:${state.events.length + index}`,
            clueId: action.clueId,
            teamId,
            outcome: correct ? 'correct' : 'wrong',
            delta: correct ? points : state.deductOnWrong ? -points : 0,
            at: action.at,
          };
        }),
      ];

      const allScored = countScoredClues(events) >= countClues(state.definition);

      return {
        ...state,
        events,
        openClueId: null,
        answerRevealed: false,
        activeTeamId: null,
        answeringTeamIds: [],
        timerEndsAt: null,
        // Reihum: die nächste Frage beginnt beim nächsten Team.
        startingTeamIndex: (state.startingTeamIndex + 1) % Math.max(1, state.teams.length),
        phase: allScored ? 'finished' : state.phase,
      };
    }

    case 'game/reset':
      return initialGameState;

    default:
      return state;
  }
}
