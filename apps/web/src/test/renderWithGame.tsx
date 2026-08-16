import {
  createDefaultTeams,
  gameReducer,
  initialGameState,
  sampleDefinition,
} from '@jeopardy/game-core';
import type { GameDefinition, GameState, GameTransport } from '@jeopardy/game-core';
import { render } from '@testing-library/react';
import type { ReactElement } from 'react';
import { GameProvider } from '../state/GameProvider';
import { createLocalTransport } from '../state/transport';

/** Laufendes Spiel als Ausgangslage für Komponententests. */
export function startedState(
  teamCount = 2,
  definition: GameDefinition = sampleDefinition,
): GameState {
  return gameReducer(initialGameState, {
    type: 'game/start',
    definition,
    teams: createDefaultTeams(teamCount),
  });
}

export function awardClue(
  state: GameState,
  clueId: string,
  teamId: string,
  correct: boolean,
): GameState {
  return gameReducer(state, { type: 'score/award', clueId, teamId, correct, at: 0 });
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
