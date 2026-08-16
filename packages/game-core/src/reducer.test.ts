import { describe, expect, it } from 'vitest';
import { sampleDefinition } from './fixtures';
import { gameReducer, initialGameState } from './reducer';
import { selectIsClueScored, selectScore } from './selectors';
import { createDefaultTeams } from './teams';
import type { GameAction, GameState } from './types';

const CLUE_100 = 'wissenschaft-100';
const CLUE_200 = 'wissenschaft-200';
const CLUE_300 = 'wissenschaft-300';

function startedGame(teamCount = 2): GameState {
  return gameReducer(initialGameState, {
    type: 'game/start',
    definition: sampleDefinition,
    teams: createDefaultTeams(teamCount),
  });
}

function award(state: GameState, clueId: string, teamId: string, correct: boolean): GameState {
  return gameReducer(state, { type: 'score/award', clueId, teamId, correct, at: 1_700_000_000 });
}

describe('spielstart', () => {
  it('übernimmt fragenset und teams und startet ohne wertungen', () => {
    const state = startedGame();
    expect(state.phase).toBe('playing');
    expect(state.definition?.id).toBe(sampleDefinition.id);
    expect(state.teams).toHaveLength(2);
    expect(state.events).toEqual([]);
  });

  it.each([1, 2, 5])('startet mit %i team(s)', (count) => {
    expect(startedGame(count).teams).toHaveLength(count);
  });

  it('lehnt einen start ohne teams ab', () => {
    const state = gameReducer(initialGameState, {
      type: 'game/start',
      definition: sampleDefinition,
      teams: [],
    });
    expect(state).toBe(initialGameState);
  });
});

describe('invariante: eine geöffnete karte wird nicht grau', () => {
  it('erzeugt beim öffnen keine wertung', () => {
    const opened = gameReducer(startedGame(), { type: 'clue/open', clueId: CLUE_100 });

    expect(opened.openClueId).toBe(CLUE_100);
    expect(opened.events).toEqual([]);
    expect(selectIsClueScored(opened, CLUE_100)).toBe(false);
  });

  it('lässt die karte auch nach anzeigen der antwort und schließen unberührt', () => {
    let state = gameReducer(startedGame(), { type: 'clue/open', clueId: CLUE_100 });
    state = gameReducer(state, { type: 'clue/revealAnswer' });
    state = gameReducer(state, { type: 'clue/close' });

    expect(selectIsClueScored(state, CLUE_100)).toBe(false);
    expect(state.openClueId).toBeNull();
  });

  it('öffnet eine bereits gewertete karte nicht erneut', () => {
    const scored = award(
      gameReducer(startedGame(), { type: 'clue/open', clueId: CLUE_100 }),
      CLUE_100,
      'team-a',
      true,
    );
    const reopened = gameReducer(scored, { type: 'clue/open', clueId: CLUE_100 });

    expect(reopened.openClueId).toBeNull();
  });
});

describe('invariante: die antwort ist erst nach dem aufdecken sichtbar', () => {
  it('startet jede frage mit verdeckter antwort', () => {
    const opened = gameReducer(startedGame(), { type: 'clue/open', clueId: CLUE_100 });
    expect(opened.answerRevealed).toBe(false);
  });

  it('deckt die antwort nur bei geöffneter frage auf', () => {
    const state = gameReducer(startedGame(), { type: 'clue/revealAnswer' });
    expect(state.answerRevealed).toBe(false);
  });

  it('verdeckt die antwort beim öffnen der nächsten frage wieder', () => {
    let state = gameReducer(startedGame(), { type: 'clue/open', clueId: CLUE_100 });
    state = gameReducer(state, { type: 'clue/revealAnswer' });
    state = gameReducer(state, { type: 'clue/open', clueId: CLUE_200 });

    expect(state.answerRevealed).toBe(false);
  });
});

describe('wertung', () => {
  it('schließt das popup und markiert die karte als gespielt', () => {
    const state = award(startedGame(), CLUE_100, 'team-a', true);

    expect(state.openClueId).toBeNull();
    expect(state.answerRevealed).toBe(false);
    expect(selectIsClueScored(state, CLUE_100)).toBe(true);
  });

  it('ignoriert eine zweite wertung derselben frage', () => {
    const first = award(startedGame(), CLUE_100, 'team-a', true);
    const second = award(first, CLUE_100, 'team-b', true);

    expect(second).toBe(first);
    expect(second.events).toHaveLength(1);
  });

  it('ignoriert wertungen für unbekannte teams und fragen', () => {
    const state = startedGame();
    expect(award(state, CLUE_100, 'team-x', true)).toBe(state);
    expect(award(state, 'gibt-es-nicht', 'team-a', true)).toBe(state);
  });

  it('übernimmt den zeitstempel aus der action', () => {
    const state = award(startedGame(), CLUE_100, 'team-a', true);
    expect(state.events[0]?.at).toBe(1_700_000_000);
  });

  it('funktioniert im übungsmodus mit einem einzigen team', () => {
    let state = startedGame(1);
    state = award(state, CLUE_100, 'team-a', true);
    state = award(state, CLUE_200, 'team-a', false);

    expect(state.events).toHaveLength(2);
    expect(selectScore(state, 'team-a')).toBe(0);
  });

  it('wechselt nach der letzten frage in die endphase', () => {
    let state = startedGame();
    for (const category of sampleDefinition.categories) {
      for (const clue of category.clues) {
        state = award(state, clue.id, 'team-a', true);
      }
    }

    expect(state.phase).toBe('finished');
    expect(state.events).toHaveLength(25);
  });
});

describe('teamnamen', () => {
  it('übernimmt einen neuen namen', () => {
    const state = gameReducer(startedGame(), {
      type: 'team/rename',
      teamId: 'team-a',
      name: '  Die Adler  ',
    });
    expect(state.teams[0]?.name).toBe('Die Adler');
  });

  it('ignoriert leere namen und unbekannte teams', () => {
    const state = startedGame();
    expect(gameReducer(state, { type: 'team/rename', teamId: 'team-a', name: '   ' })).toBe(state);
    expect(gameReducer(state, { type: 'team/rename', teamId: 'team-z', name: 'Neu' })).toBe(state);
  });
});

describe('reducer-eigenschaften', () => {
  it('setzt das spiel vollständig zurück', () => {
    const state = award(startedGame(), CLUE_100, 'team-a', true);
    expect(gameReducer(state, { type: 'game/reset' })).toEqual(initialGameState);
  });

  it('lässt unbekannte actions wirkungslos', () => {
    const state = startedGame();
    const unknownAction = { type: 'gibt/es-nicht' } as unknown as GameAction;
    expect(gameReducer(state, unknownAction)).toBe(state);
  });

  it('ist deterministisch und verändert den vorzustand nicht', () => {
    const state = startedGame();
    const before = JSON.stringify(state);

    const first = award(state, CLUE_300, 'team-b', false);
    const second = award(state, CLUE_300, 'team-b', false);

    expect(JSON.stringify(state)).toBe(before);
    expect(first).toEqual(second);
  });
});
