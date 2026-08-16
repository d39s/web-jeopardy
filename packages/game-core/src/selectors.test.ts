import { describe, expect, it } from 'vitest';
import { sampleDefinition } from './fixtures';
import { gameReducer, initialGameState } from './reducer';
import {
  resolveCategoryColor,
  selectActiveTeam,
  selectClueResult,
  selectIsTimerRunning,
  selectStartingTeam,
  selectClueCount,
  selectClueEvent,
  selectIsFinished,
  selectIsPracticeMode,
  selectOpenClue,
  selectRanking,
  selectScore,
  selectTeamStats,
} from './selectors';
import { createDefaultTeams } from './teams';
import type { GameState } from './types';

function startedGame(teamCount = 2, timerSeconds: number | null = null): GameState {
  return gameReducer(initialGameState, {
    type: 'game/start',
    definition: sampleDefinition,
    teams: createDefaultTeams(teamCount),
    timerSeconds,
  });
}

function award(state: GameState, clueId: string, teamId: string, correct: boolean): GameState {
  return gameReducer(state, { type: 'score/award', clueId, teamId, correct, at: 0 });
}

describe('punktestand', () => {
  it('addiert richtige antworten', () => {
    let state = startedGame();
    state = award(state, 'wissenschaft-100', 'team-a', true);
    state = award(state, 'geografie-300', 'team-a', true);

    expect(selectScore(state, 'team-a')).toBe(400);
  });

  it('zieht falsche antworten ab', () => {
    let state = startedGame();
    state = award(state, 'wissenschaft-500', 'team-a', true);
    state = award(state, 'geografie-200', 'team-a', false);

    expect(selectScore(state, 'team-a')).toBe(300);
  });

  it('fällt nie unter null und klammert dabei jede einzelne wertung', () => {
    let state = startedGame();
    state = award(state, 'wissenschaft-100', 'team-a', true); // 100
    state = award(state, 'geografie-200', 'team-a', false); // 100 - 200 -> 0, nicht -100
    expect(selectScore(state, 'team-a')).toBe(0);

    state = award(state, 'musik-300', 'team-a', true); // 0 + 300 -> 300
    expect(selectScore(state, 'team-a')).toBe(300);
  });

  it('bleibt bei mehreren falschen antworten in folge bei null', () => {
    let state = startedGame();
    state = award(state, 'wissenschaft-500', 'team-b', false);
    state = award(state, 'geografie-400', 'team-b', false);

    expect(selectScore(state, 'team-b')).toBe(0);
  });

  it('zählt richtige und falsche antworten je team', () => {
    let state = startedGame();
    state = award(state, 'wissenschaft-100', 'team-a', true);
    state = award(state, 'geografie-100', 'team-a', false);
    state = award(state, 'musik-100', 'team-b', true);

    expect(selectTeamStats(state, 'team-a')).toEqual({ correct: 1, wrong: 1 });
    expect(selectTeamStats(state, 'team-b')).toEqual({ correct: 1, wrong: 0 });
  });
});

describe('ranking', () => {
  it('sortiert absteigend nach punkten', () => {
    let state = startedGame(3);
    state = award(state, 'wissenschaft-100', 'team-a', true);
    state = award(state, 'geografie-500', 'team-b', true);
    state = award(state, 'musik-300', 'team-c', true);

    expect(selectRanking(state).map((entry) => entry.team.id)).toEqual([
      'team-b',
      'team-c',
      'team-a',
    ]);
  });

  it('vergibt bei gleichstand denselben rang', () => {
    let state = startedGame(3);
    state = award(state, 'wissenschaft-300', 'team-a', true);
    state = award(state, 'geografie-300', 'team-b', true);
    state = award(state, 'musik-100', 'team-c', true);

    const ranking = selectRanking(state);
    expect(ranking[0]?.rank).toBe(1);
    expect(ranking[1]?.rank).toBe(1);
    expect(ranking[2]?.rank).toBe(3);
  });

  it('funktioniert auch mit einem einzigen team', () => {
    const ranking = selectRanking(startedGame(1));
    expect(ranking).toHaveLength(1);
    expect(ranking[0]?.rank).toBe(1);
  });
});

describe('spielzustand', () => {
  it('erkennt den übungsmodus nur bei genau einem team', () => {
    expect(selectIsPracticeMode(startedGame(1))).toBe(true);
    expect(selectIsPracticeMode(startedGame(2))).toBe(false);
    expect(selectIsPracticeMode(startedGame(5))).toBe(false);
  });

  it('kennt die anzahl der fragen und das spielende', () => {
    const state = startedGame();
    expect(selectClueCount(state)).toBe(25);
    expect(selectIsFinished(state)).toBe(false);
    expect(selectIsFinished(initialGameState)).toBe(false);
  });

  it('liefert die geöffnete frage samt kategorie', () => {
    const state = gameReducer(startedGame(), { type: 'clue/open', clueId: 'musik-400', at: 0 });
    const open = selectOpenClue(state);

    expect(open?.category.name).toBe('Musik');
    expect(open?.clue.points).toBe(400);
    expect(selectOpenClue(initialGameState)).toBeNull();
  });

  it('liefert die wertung einer karte', () => {
    const state = award(startedGame(), 'film-200', 'team-b', false);

    expect(selectClueEvent(state, 'film-200')?.teamId).toBe('team-b');
    expect(selectClueEvent(state, 'film-300')).toBeNull();
  });
});

describe('kategoriefarben', () => {
  it('nutzt die position im spielfeld, wenn das fragenset keine farbe vorgibt', () => {
    const category = sampleDefinition.categories[0];
    if (!category) throw new Error('Fixture unvollständig.');
    expect(resolveCategoryColor(category, 1)).toBe('#FF7F50');
  });

  it('bevorzugt die farbe aus dem fragenset', () => {
    const category = sampleDefinition.categories[0];
    if (!category) throw new Error('Fixture unvollständig.');
    expect(resolveCategoryColor({ ...category, color: '#FFD166' }, 0)).toBe('#FFD166');
  });
});

describe('ausgang einer gespielten frage', () => {
  it('meldet eine richtige antwort mit team und punkten', () => {
    const state = award(startedGame(), 'wissenschaft-100', 'team-a', true);
    const result = selectClueResult(state, 'wissenschaft-100');

    expect(result).toEqual({
      outcome: 'correct',
      team: { id: 'team-a', name: 'Team A' },
      delta: 100,
    });
  });

  it('meldet eine falsche antwort mit negativem delta', () => {
    const state = award(startedGame(), 'geografie-200', 'team-b', false);

    expect(selectClueResult(state, 'geografie-200')).toMatchObject({
      outcome: 'wrong',
      delta: -200,
    });
  });

  it('meldet eine nicht beantwortete frage ohne team', () => {
    let state = gameReducer(startedGame(2, 30), { type: 'clue/open', clueId: 'musik-300', at: 0 });
    // Der Ablauf zählt erst zum Fristende: 30 Sekunden je Team.
    state = gameReducer(state, { type: 'clue/timerExpired', at: 30_000 });
    state = gameReducer(state, { type: 'clue/timerExpired', at: 60_000 });

    expect(selectClueResult(state, 'musik-300')).toEqual({
      outcome: 'unanswered',
      team: null,
      delta: 0,
    });
  });

  it('meldet nichts für eine ungespielte frage', () => {
    expect(selectClueResult(startedGame(), 'film-400')).toBeNull();
  });

  it('zählt nicht beantwortete fragen bei keinem team als fehler', () => {
    let state = gameReducer(startedGame(2, 30), { type: 'clue/open', clueId: 'musik-300', at: 0 });
    // Der Ablauf zählt erst zum Fristende: 30 Sekunden je Team.
    state = gameReducer(state, { type: 'clue/timerExpired', at: 30_000 });
    state = gameReducer(state, { type: 'clue/timerExpired', at: 60_000 });

    expect(selectTeamStats(state, 'team-a')).toEqual({ correct: 0, wrong: 0 });
  });
});

describe('zugriff', () => {
  it('nennt das team am zug und das startteam der nächsten frage', () => {
    const state = gameReducer(startedGame(3, 30), {
      type: 'clue/open',
      clueId: 'wissenschaft-100',
      at: 0,
    });

    expect(selectActiveTeam(state)?.id).toBe('team-a');
    expect(selectStartingTeam(state)?.id).toBe('team-a');
    expect(selectIsTimerRunning(state)).toBe(true);
  });

  it('folgt dem ablauf der bedenkzeit', () => {
    let state = gameReducer(startedGame(3, 30), {
      type: 'clue/open',
      clueId: 'wissenschaft-100',
      at: 0,
    });
    state = gameReducer(state, { type: 'clue/timerExpired', at: 30_000 });

    expect(selectActiveTeam(state)?.id).toBe('team-b');
  });

  it('liefert ohne teams keinen zugriff', () => {
    expect(selectActiveTeam(initialGameState)).toBeNull();
    expect(selectStartingTeam(initialGameState)).toBeNull();
    expect(selectIsTimerRunning(initialGameState)).toBe(false);
  });
});
