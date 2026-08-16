import { gameReducer, initialGameState } from '@jeopardy/game-core';
import type { GameState, GameTransport } from '@jeopardy/game-core';

/**
 * Lokale Umsetzung der Transport-Schnittstelle: Actions werden direkt auf den
 * Reducer angewendet. In Phase 2 tritt an dieser Stelle ein WebSocket-Transport
 * an – die Oberfläche bleibt unverändert, weil sie nur diese Schnittstelle kennt.
 */
export function createLocalTransport(initial: GameState = initialGameState): GameTransport {
  let state = initial;
  const listeners = new Set<(next: GameState) => void>();

  return {
    getState: () => state,

    dispatch(action) {
      const next = gameReducer(state, action);
      // Der Reducer gibt bei wirkungslosen Actions denselben Zustand zurück.
      if (next === state) return;
      state = next;
      for (const listener of listeners) listener(state);
    },

    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}
