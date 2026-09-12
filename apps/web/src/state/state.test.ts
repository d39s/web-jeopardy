import { initialGameState, sampleDefinition, createDefaultTeams } from '@jeopardy/game-core';
import type { GameState } from '@jeopardy/game-core';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  clearPersistedState,
  loadLastSetup,
  loadPersistedState,
  persistState,
  saveLastSetup,
} from './persistence';
import type { LastSetup } from './persistence';
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

  it('merkt sich die einstellungen der letzten partie', () => {
    const setup: LastSetup = {
      teams: createDefaultTeams(3),
      categoryId: 'wissenschaft',
      level: 4,
      timerSeconds: 30,
      vetoSeconds: 15,
      wrongPenalty: 'half',
    };
    saveLastSetup(setup, storage);

    expect(loadLastSetup(storage)).toEqual(setup);
    expect(loadLastSetup(createMemoryStorage())).toBeNull();
  });

  it('ersetzt unbrauchbare einstellungen durch die standards', () => {
    storage.setItem(
      'jeopardy:v1:lastSetup',
      JSON.stringify({
        teams: [{ id: 'team-a', name: 'Team A' }, 'kein team'],
        categoryId: 42,
        level: 9,
        timerSeconds: 7,
        vetoSeconds: 'gleich',
        wrongPenalty: 'doppelt',
      }),
    );

    expect(loadLastSetup(storage)).toEqual({
      teams: [{ id: 'team-a', name: 'Team A' }],
      categoryId: null,
      level: null,
      timerSeconds: null,
      vetoSeconds: null,
      wrongPenalty: 'full',
    });
  });

  it('übernimmt die teams aus dem vorgängerformat', () => {
    const teams = createDefaultTeams(3);
    storage.setItem('jeopardy:v1:lastTeams', JSON.stringify(teams));

    expect(loadLastSetup(storage)).toEqual({
      teams,
      categoryId: null,
      level: null,
      timerSeconds: null,
      vetoSeconds: null,
      wrongPenalty: 'full',
    });
  });

  it('verwirft einen beschädigten eintrag der einstellungen', () => {
    storage.setItem('jeopardy:v1:lastSetup', '{kein json');

    expect(loadLastSetup(storage)).toBeNull();
    expect(() => saveLastSetup({} as LastSetup, null)).not.toThrow();
  });
});
