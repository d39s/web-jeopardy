import { describe, expect, it } from 'vitest';
import { sampleDefinition } from './fixtures';
import { gameReducer, initialGameState } from './reducer';
import {
  resolveCategoryColor,
  selectActiveTeam,
  selectAnsweringTeams,
  selectClueCount,
  selectClueSummary,
  selectIsFinished,
  selectIsPracticeMode,
  selectIsTimeUp,
  selectIsTimerRunning,
  selectOpenClue,
  selectRanking,
  selectScore,
  selectScoredCount,
  selectStartingTeam,
  selectStreak,
  selectTeamStats,
  selectVetoCandidates,
} from './selectors';
import { createDefaultTeams } from './teams';
import type { GameState } from './types';

function startedGame(teamCount = 3, timerSeconds: number | null = 30): GameState {
  return gameReducer(initialGameState, {
    type: 'game/start',
    definition: sampleDefinition,
    teams: createDefaultTeams(teamCount),
    timerSeconds,
  });
}

function openClue(state: GameState, clueId: string, at = 1_000): GameState {
  return gameReducer(state, { type: 'clue/open', clueId, at });
}

function veto(state: GameState, teamId: string): GameState {
  return gameReducer(state, { type: 'clue/veto', teamId, at: 2_000 });
}

/** Spielt eine Frage komplett durch: öffnen, optionale Vetos, aufdecken, werten. */
function play(
  state: GameState,
  clueId: string,
  winnerTeamId: string | null,
  vetoTeamIds: string[] = [],
): GameState {
  let next = openClue(state, clueId);
  for (const teamId of vetoTeamIds) next = veto(next, teamId);
  next = gameReducer(next, { type: 'clue/revealAnswer' });
  return gameReducer(next, { type: 'score/settle', clueId, winnerTeamId, at: 0 });
}

describe('punktestand', () => {
  it('addiert richtige und zieht falsche antworten ab', () => {
    let state = play(startedGame(), 'wissenschaft-500', 'team-a', ['team-b']);
    state = play(state, 'geografie-200', 'team-c', ['team-c']);

    expect(selectScore(state, 'team-a')).toBe(500);
    expect(selectScore(state, 'team-b')).toBe(0);
    expect(selectScore(state, 'team-c')).toBe(200);
  });

  it('fällt nie unter null und klammert jede wertung einzeln', () => {
    let state = play(startedGame(2), 'wissenschaft-100', 'team-a');
    state = play(state, 'geografie-200', 'team-b', ['team-a']);

    // 100 minus 200 ergibt 0, nicht -100.
    expect(selectScore(state, 'team-a')).toBe(0);
  });

  it('zählt richtige und falsche antworten je team', () => {
    // Erste Frage beginnt bei Team A, Team B legt Veto ein und verliert.
    let state = play(startedGame(), 'wissenschaft-100', 'team-a', ['team-b']);
    // Zweite Frage beginnt reihum bei Team B, Team C steigt ein, niemand richtig.
    state = play(state, 'geografie-100', null, ['team-c']);

    expect(selectTeamStats(state, 'team-a')).toEqual({ correct: 1, wrong: 0 });
    expect(selectTeamStats(state, 'team-b')).toEqual({ correct: 0, wrong: 2 });
    expect(selectTeamStats(state, 'team-c')).toEqual({ correct: 0, wrong: 1 });
  });
});

describe('ausgang einer gespielten frage', () => {
  it('nennt gewinner, unterlegene und punktzahl', () => {
    const state = play(startedGame(), 'wissenschaft-300', 'team-b', ['team-b', 'team-c']);
    const summary = selectClueSummary(state, 'wissenschaft-300');

    expect(summary?.winner?.id).toBe('team-b');
    expect(summary?.losers.map((team) => team.id)).toEqual(['team-a', 'team-c']);
    expect(summary?.points).toBe(300);
  });

  it('meldet ohne gewinner alle beteiligten als unterlegen', () => {
    const state = play(startedGame(), 'musik-200', null, ['team-b']);
    const summary = selectClueSummary(state, 'musik-200');

    expect(summary?.winner).toBeNull();
    expect(summary?.losers).toHaveLength(2);
  });

  it('meldet nichts für eine ungespielte frage', () => {
    expect(selectClueSummary(startedGame(), 'film-400')).toBeNull();
  });
});

describe('veto-runde', () => {
  it('bietet nur unbeteiligte teams als kandidaten an', () => {
    const opened = openClue(startedGame(), 'wissenschaft-100');
    expect(selectVetoCandidates(opened).map((team) => team.id)).toEqual(['team-b', 'team-c']);

    const afterVeto = veto(opened, 'team-c');
    expect(selectVetoCandidates(afterVeto).map((team) => team.id)).toEqual(['team-b']);
  });

  it('bietet nach dem aufdecken keine kandidaten mehr an', () => {
    const revealed = gameReducer(openClue(startedGame(), 'wissenschaft-100'), {
      type: 'clue/revealAnswer',
    });
    expect(selectVetoCandidates(revealed)).toEqual([]);
  });

  it('führt die beteiligten in der reihenfolge ihres zugriffs', () => {
    const state = veto(veto(openClue(startedGame(), 'wissenschaft-100'), 'team-c'), 'team-b');
    expect(selectAnsweringTeams(state).map((team) => team.name)).toEqual([
      'Team A',
      'Team C',
      'Team B',
    ]);
  });

  it('nennt das antwortende team und das startteam der nächsten frage', () => {
    const state = veto(openClue(startedGame(), 'wissenschaft-100'), 'team-c');

    expect(selectActiveTeam(state)?.id).toBe('team-c');
    expect(selectStartingTeam(state)?.id).toBe('team-a');
    expect(selectIsTimerRunning(state)).toBe(true);
  });

  it('erkennt eine abgelaufene frist', () => {
    const opened = openClue(startedGame(), 'wissenschaft-100', 1_000);
    expect(selectIsTimeUp(opened)).toBe(false);

    const expired = gameReducer(opened, { type: 'clue/timerExpired', at: 31_000 });
    expect(selectIsTimeUp(expired)).toBe(true);
  });

  it('meldet ohne offene frage weder zugriff noch kandidaten', () => {
    expect(selectActiveTeam(initialGameState)).toBeNull();
    expect(selectStartingTeam(initialGameState)).toBeNull();
    expect(selectVetoCandidates(initialGameState)).toEqual([]);
    expect(selectIsTimeUp(initialGameState)).toBe(false);
  });
});

describe('ranking', () => {
  it('sortiert absteigend nach punkten', () => {
    let state = play(startedGame(), 'wissenschaft-100', 'team-a');
    state = play(state, 'geografie-500', 'team-b');
    state = play(state, 'musik-300', 'team-c');

    expect(selectRanking(state).map((entry) => entry.team.id)).toEqual([
      'team-b',
      'team-c',
      'team-a',
    ]);
  });

  it('vergibt bei gleichstand denselben rang', () => {
    let state = play(startedGame(), 'wissenschaft-300', 'team-a');
    state = play(state, 'geografie-300', 'team-b');
    state = play(state, 'musik-100', 'team-c');

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
  });

  it('zählt gespielte karten, nicht wertungen', () => {
    const state = play(startedGame(), 'wissenschaft-100', 'team-b', ['team-b', 'team-c']);

    expect(state.events).toHaveLength(3);
    expect(selectScoredCount(state)).toBe(1);
    expect(selectClueCount(state)).toBe(25);
    expect(selectIsFinished(state)).toBe(false);
    expect(selectIsFinished(initialGameState)).toBe(false);
  });

  it('liefert die geöffnete frage samt kategorie', () => {
    const state = openClue(startedGame(), 'musik-400');
    const open = selectOpenClue(state);

    expect(open?.category.name).toBe('Musik');
    expect(open?.clue.points).toBe(400);
    expect(selectOpenClue(initialGameState)).toBeNull();
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

describe('serien', () => {
  it('meldet erst ab drei gleichen ausgängen in folge', () => {
    let state = play(startedGame(), 'wissenschaft-100', 'team-a');
    state = play(state, 'wissenschaft-200', 'team-a', ['team-a']);
    expect(selectStreak(state, 'team-a')).toBeNull();

    state = play(state, 'wissenschaft-300', 'team-a', ['team-a']);
    expect(selectStreak(state, 'team-a')).toEqual({ kind: 'correct', length: 3 });
  });

  it('zählt auch falsche antworten in folge', () => {
    let state = startedGame(2);
    // Niemand liegt richtig; Team A ist jedes Mal beteiligt.
    state = play(state, 'wissenschaft-100', null);
    state = play(state, 'wissenschaft-200', null, ['team-a']);
    state = play(state, 'wissenschaft-300', null);

    expect(selectStreak(state, 'team-a')).toEqual({ kind: 'wrong', length: 3 });
  });

  it('zählt nur eigene beteiligungen – fremde fragen unterbrechen nicht', () => {
    let state = startedGame();
    // Team A gewinnt seine drei Beteiligungen; dazwischen spielen B und C unter sich.
    state = play(state, 'wissenschaft-100', 'team-a');
    state = play(state, 'geografie-100', 'team-b');
    state = play(state, 'musik-100', 'team-c');
    state = play(state, 'wissenschaft-200', 'team-a', ['team-a']);
    state = play(state, 'geografie-200', 'team-b');
    state = play(state, 'musik-200', 'team-a', ['team-a']);

    expect(selectStreak(state, 'team-a')).toEqual({ kind: 'correct', length: 3 });
  });

  it('bricht die serie beim ersten abweichenden ausgang', () => {
    let state = startedGame(2);
    for (const clueId of ['wissenschaft-100', 'wissenschaft-200', 'wissenschaft-300']) {
      state = play(state, clueId, 'team-a', ['team-a']);
    }
    expect(selectStreak(state, 'team-a')).toEqual({ kind: 'correct', length: 3 });

    state = play(state, 'wissenschaft-400', 'team-b', ['team-a']);
    expect(selectStreak(state, 'team-a')).toBeNull();
  });

  it('kennt ohne beteiligung keine serie', () => {
    expect(selectStreak(startedGame(), 'team-c')).toBeNull();
  });
});
