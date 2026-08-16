import { initialGameState, sampleDefinition, createDefaultTeams } from '@jeopardy/game-core';
import type { GameState } from '@jeopardy/game-core';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  clearPersistedState,
  loadLastTeams,
  loadPersistedState,
  persistState,
  saveLastTeams,
} from './persistence';
import { createLocalTransport } from './transport';

function startedState(): GameState {
  const transport = createLocalTransport();
  transport.dispatch({
    type: 'game/start',
    definition: sampleDefinition,
    teams: createDefaultTeams(2),
  });
  return transport.getState();
}

describe('lokaler transport', () => {
  it('wendet actions auf den reducer an', () => {
    const transport = createLocalTransport();
    transport.dispatch({
      type: 'game/start',
      definition: sampleDefinition,
      teams: createDefaultTeams(1),
    });

    expect(transport.getState().phase).toBe('playing');
  });

  it('benachrichtigt angemeldete zuhörer', () => {
    const transport = createLocalTransport();
    const listener = vi.fn();
    const unsubscribe = transport.subscribe(listener);

    transport.dispatch({
      type: 'game/start',
      definition: sampleDefinition,
      teams: createDefaultTeams(2),
    });
    expect(listener).toHaveBeenCalledOnce();

    unsubscribe();
    transport.dispatch({ type: 'clue/open', clueId: 'wissenschaft-100', at: 0 });
    expect(listener).toHaveBeenCalledOnce();
  });

  it('meldet nichts bei wirkungslosen actions', () => {
    const transport = createLocalTransport();
    const listener = vi.fn();
    transport.subscribe(listener);

    transport.dispatch({ type: 'clue/open', clueId: 'gibt-es-nicht', at: 0 });
    expect(listener).not.toHaveBeenCalled();
  });
});

/** Speicher-Stub statt localStorage: unabhängig von der Testumgebung. */
function createMemoryStorage(): Storage {
  const entries = new Map<string, string>();
  return {
    get length() {
      return entries.size;
    },
    clear: () => entries.clear(),
    getItem: (key) => entries.get(key) ?? null,
    key: (index) => [...entries.keys()][index] ?? null,
    removeItem: (key) => void entries.delete(key),
    setItem: (key, value) => void entries.set(key, value),
  };
}

describe('persistenz', () => {
  let storage: Storage;

  beforeEach(() => {
    storage = createMemoryStorage();
  });

  it('speichert und lädt einen laufenden spielstand', () => {
    const state = startedState();
    persistState(state, storage);

    expect(loadPersistedState(storage)).toEqual(state);
  });

  it('verwirft einen beschädigten eintrag', () => {
    storage.setItem('jeopardy:v1:state', '{kein json');

    expect(loadPersistedState(storage)).toBeNull();
    expect(storage.getItem('jeopardy:v1:state')).toBeNull();
  });

  it('verwirft einen eintrag mit veraltetem format', () => {
    storage.setItem('jeopardy:v1:state', JSON.stringify({ phase: 'playing' }));
    expect(loadPersistedState(storage)).toBeNull();
  });

  it('löscht den gespeicherten spielstand', () => {
    persistState(initialGameState, storage);
    clearPersistedState(storage);

    expect(loadPersistedState(storage)).toBeNull();
  });

  it('kommt ohne verfügbaren speicher aus', () => {
    expect(loadPersistedState(null)).toBeNull();
    expect(() => persistState(initialGameState, null)).not.toThrow();
  });

  it('merkt sich die zuletzt genutzten teams', () => {
    const teams = createDefaultTeams(3);
    saveLastTeams(teams, storage);

    expect(loadLastTeams(storage)).toEqual(teams);
    expect(loadLastTeams(createMemoryStorage())).toBeNull();
  });
});
