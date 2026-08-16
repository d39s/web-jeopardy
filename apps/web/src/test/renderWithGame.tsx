import {
  createDefaultTeams,
  gameReducer,
  initialGameState,
  sampleDefinition,
} from '@jeopardy/game-core';
import type { GameDefinition, GameState, GameTransport, WrongPenalty } from '@jeopardy/game-core';
import { render } from '@testing-library/react';
import type { ReactElement } from 'react';
import { GameProvider } from '../state/GameProvider';
import { createLocalTransport } from '../state/transport';

/** Laufendes Spiel als Ausgangslage für Komponententests. */
export function startedState(
  teamCount = 2,
  definition: GameDefinition = sampleDefinition,
  options: {
    timerSeconds?: number | null;
    vetoSeconds?: number | null;
    wrongPenalty?: WrongPenalty;
  } = {},
): GameState {
  return gameReducer(initialGameState, {
    type: 'game/start',
    definition,
    teams: createDefaultTeams(teamCount),
    timerSeconds: options.timerSeconds ?? null,
    vetoSeconds: options.vetoSeconds ?? null,
    wrongPenalty: options.wrongPenalty ?? 'full',
  });
}

/**
 * Spielt eine Frage komplett durch: öffnen, optionale Vetos, aufdecken, werten.
 * `winnerTeamId: null` bedeutet „keine richtige Antwort gegeben".
 */
export function playClue(
  state: GameState,
  clueId: string,
  winnerTeamId: string | null,
  vetoTeamIds: string[] = [],
): GameState {
  let next = gameReducer(state, { type: 'clue/open', clueId, at: 0 });
  for (const teamId of vetoTeamIds) {
    next = gameReducer(next, { type: 'clue/veto', teamId, at: 0 });
  }
  next = gameReducer(next, { type: 'clue/revealAnswer' });
  return gameReducer(next, { type: 'score/settle', clueId, winnerTeamId, at: 0 });
}

/** Öffnet eine Frage und lässt optional Teams per Veto übernehmen. */
export function openClue(state: GameState, clueId: string, vetoTeamIds: string[] = []): GameState {
  let next = gameReducer(state, { type: 'clue/open', clueId, at: 0 });
  for (const teamId of vetoTeamIds) {
    next = gameReducer(next, { type: 'clue/veto', teamId, at: 0 });
  }
  return next;
}

export function renderWithGame(
  ui: ReactElement,
  state: GameState = startedState(),
): { transport: GameTransport } & ReturnType<typeof render> {
  const transport = createLocalTransport(state);
  const result = render(
    <GameProvider transport={transport} persist={false}>
      {ui}
    </GameProvider>,
  );
  return { transport, ...result };
}
