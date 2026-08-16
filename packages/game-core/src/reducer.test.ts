import { describe, expect, it } from 'vitest';
import { sampleDefinition } from './fixtures';
import { effectiveVetoSeconds, gameReducer, initialGameState } from './reducer';
import { selectIsClueScored, selectScore, selectScoredCount } from './selectors';
import { createDefaultTeams } from './teams';
import type { GameAction, GameState } from './types';

const CLUE_100 = 'wissenschaft-100';
const CLUE_200 = 'wissenschaft-200';
const CLUE_300 = 'wissenschaft-300';

interface StartOptions {
  teams?: number;
  timerSeconds?: number | null;
  vetoSeconds?: number | null;
  deductOnWrong?: boolean;
}

function startedGame({
  teams = 2,
  timerSeconds = null,
  vetoSeconds = null,
  deductOnWrong = true,
}: StartOptions = {}): GameState {
  return gameReducer(initialGameState, {
    type: 'game/start',
    definition: sampleDefinition,
    teams: createDefaultTeams(teams),
    timerSeconds,
    vetoSeconds,
    deductOnWrong,
  });
}

function openClue(state: GameState, clueId = CLUE_100, at = 1_000): GameState {
  return gameReducer(state, { type: 'clue/open', clueId, at });
}

function veto(state: GameState, teamId: string, at = 2_000): GameState {
  return gameReducer(state, { type: 'clue/veto', teamId, at });
}

/** Meldet den Ablauf standardmäßig genau zum Fristende. */
function expireTimer(state: GameState, at = state.timerEndsAt ?? 0): GameState {
  return gameReducer(state, { type: 'clue/timerExpired', at });
}

function reveal(state: GameState): GameState {
  return gameReducer(state, { type: 'clue/revealAnswer' });
}

function settle(state: GameState, winnerTeamId: string | null, clueId = CLUE_100): GameState {
  return gameReducer(state, { type: 'score/settle', clueId, winnerTeamId, at: 1_700_000_000 });
}

describe('spielstart', () => {
  it('übernimmt fragenset, teams und einstellungen', () => {
    const state = startedGame({ teams: 3, timerSeconds: 30, vetoSeconds: 15 });

    expect(state.phase).toBe('playing');
    expect(state.teams).toHaveLength(3);
    expect(state.timerSeconds).toBe(30);
    expect(state.vetoSeconds).toBe(15);
    expect(state.events).toEqual([]);
    expect(state.answeringTeamIds).toEqual([]);
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

describe('veto-zeit', () => {
  it('koppelt sich ohne eigenen wert an die bedenkzeit', () => {
    expect(effectiveVetoSeconds(startedGame({ timerSeconds: 45 }))).toBe(45);
  });

  it('gilt eigenständig, sobald sie gesetzt ist', () => {
    expect(effectiveVetoSeconds(startedGame({ timerSeconds: 45, vetoSeconds: 15 }))).toBe(15);
  });

  it('bleibt ohne bedenkzeit ebenfalls leer', () => {
    expect(effectiveVetoSeconds(startedGame({ timerSeconds: null }))).toBeNull();
  });
});

describe('frage öffnen', () => {
  it('macht das team am zug zum ersten beteiligten und startet die bedenkzeit', () => {
    const state = openClue(startedGame({ teams: 3, timerSeconds: 30 }), CLUE_100, 1_000);

    expect(state.openClueId).toBe(CLUE_100);
    expect(state.activeTeamId).toBe('team-a');
    expect(state.answeringTeamIds).toEqual(['team-a']);
    expect(state.timerEndsAt).toBe(31_000);
    expect(state.answerRevealed).toBe(false);
  });

  it('erzeugt beim öffnen keine wertung – die karte bleibt farbig', () => {
    const state = openClue(startedGame());

    expect(state.events).toEqual([]);
    expect(selectIsClueScored(state, CLUE_100)).toBe(false);
  });

  it('öffnet eine bereits gewertete karte nicht erneut', () => {
    const scored = settle(reveal(openClue(startedGame())), 'team-a');
    expect(openClue(scored).openClueId).toBeNull();
  });

  it('läuft ohne bedenkzeit ohne frist', () => {
    expect(openClue(startedGame({ timerSeconds: null })).timerEndsAt).toBeNull();
  });
});

describe('veto', () => {
  it('gibt den zugriff weiter und startet die veto-zeit', () => {
    const state = veto(
      openClue(startedGame({ teams: 3, timerSeconds: 30, vetoSeconds: 15 }), CLUE_100, 1_000),
      'team-c',
      5_000,
    );

    expect(state.activeTeamId).toBe('team-c');
    expect(state.answeringTeamIds).toEqual(['team-a', 'team-c']);
    expect(state.timerEndsAt).toBe(20_000);
  });

  it('nutzt ohne eigene veto-zeit die bedenkzeit', () => {
    const state = veto(
      openClue(startedGame({ teams: 3, timerSeconds: 30 }), CLUE_100, 1_000),
      'team-b',
      5_000,
    );
    expect(state.timerEndsAt).toBe(35_000);
  });

  it('lässt jedes team nur einmal je frage antworten', () => {
    const once = veto(openClue(startedGame({ teams: 3, timerSeconds: 30 })), 'team-b');

    expect(veto(once, 'team-b')).toBe(once);
    expect(veto(once, 'team-a')).toBe(once);
  });

  it('ignoriert unbekannte teams', () => {
    const opened = openClue(startedGame({ teams: 3 }));
    expect(veto(opened, 'team-z')).toBe(opened);
  });

  it('wirkt nach dem aufdecken nicht mehr', () => {
    const revealed = reveal(openClue(startedGame({ teams: 3 })));
    expect(veto(revealed, 'team-c')).toBe(revealed);
  });

  it('funktioniert auch ohne laufende zeit', () => {
    const state = veto(openClue(startedGame({ teams: 3, timerSeconds: null })), 'team-b');

    expect(state.activeTeamId).toBe('team-b');
    expect(state.timerEndsAt).toBeNull();
  });

  it('kann sich vollständig erschöpfen', () => {
    let state = openClue(startedGame({ teams: 3, timerSeconds: 30 }));
    state = veto(state, 'team-b');
    state = veto(state, 'team-c');

    expect(state.answeringTeamIds).toEqual(['team-a', 'team-b', 'team-c']);
    expect(veto(state, 'team-a')).toBe(state);
  });
});

describe('fristablauf', () => {
  it('beendet nur die frist, ohne weiterzurücken oder aufzudecken', () => {
    const state = expireTimer(openClue(startedGame({ teams: 3, timerSeconds: 30 })));

    expect(state.timerEndsAt).toBeNull();
    expect(state.activeTeamId).toBe('team-a');
    expect(state.answerRevealed).toBe(false);
    expect(state.openClueId).toBe(CLUE_100);
    expect(state.events).toEqual([]);
  });

  it('lässt ein veto auch nach abgelaufener zeit zu', () => {
    const expired = expireTimer(openClue(startedGame({ teams: 3, timerSeconds: 30 })));
    const state = veto(expired, 'team-b', 40_000);

    expect(state.activeTeamId).toBe('team-b');
    expect(state.timerEndsAt).toBe(70_000);
  });

  it('ignoriert eine meldung vor dem fristende', () => {
    const opened = openClue(startedGame({ teams: 3, timerSeconds: 30 }), CLUE_100, 1_000);
    expect(gameReducer(opened, { type: 'clue/timerExpired', at: 5_000 })).toBe(opened);
  });

  it('ignoriert eine zweite meldung derselben frist', () => {
    const once = expireTimer(openClue(startedGame({ teams: 3, timerSeconds: 30 })));
    expect(expireTimer(once, 99_000)).toBe(once);
  });
});

describe('aufdecken und schließen', () => {
  it('beendet mit dem aufdecken die frist', () => {
    const state = reveal(openClue(startedGame({ timerSeconds: 30 })));

    expect(state.answerRevealed).toBe(true);
    expect(state.timerEndsAt).toBeNull();
  });

  it('verwirft beim schließen die ganze runde', () => {
    let state = openClue(startedGame({ teams: 3, timerSeconds: 30 }));
    state = veto(state, 'team-b');
    state = gameReducer(state, { type: 'clue/close' });

    expect(state.openClueId).toBeNull();
    expect(state.answeringTeamIds).toEqual([]);
    expect(state.activeTeamId).toBeNull();
    expect(state.events).toEqual([]);
    expect(selectIsClueScored(state, CLUE_100)).toBe(false);
  });
});

describe('wertung', () => {
  it('gibt dem gewinner punkte und wertet die übrigen beteiligten als falsch', () => {
    let state = openClue(startedGame({ teams: 3, timerSeconds: 30 }));
    state = veto(state, 'team-b');
    state = veto(state, 'team-c');
    state = settle(reveal(state), 'team-b');

    expect(state.events).toHaveLength(3);
    expect(selectScore(state, 'team-b')).toBe(100);
    expect(selectScore(state, 'team-a')).toBe(0);
    expect(state.events.filter((event) => event.outcome === 'wrong')).toHaveLength(2);
  });

  it('lässt unbeteiligte teams vollständig außen vor', () => {
    let state = openClue(startedGame({ teams: 4, timerSeconds: 30 }));
    state = veto(state, 'team-b');
    state = settle(reveal(state), 'team-b');

    expect(state.events.map((event) => event.teamId).sort()).toEqual(['team-a', 'team-b']);
  });

  it('wertet bei „keine richtige antwort" alle beteiligten als falsch', () => {
    let state = openClue(startedGame({ teams: 3, timerSeconds: 30 }));
    state = veto(state, 'team-b');
    state = settle(reveal(state), null);

    expect(state.events).toHaveLength(2);
    expect(state.events.every((event) => event.outcome === 'wrong')).toBe(true);
  });

  it('zieht ohne abzugsregel keine punkte ab', () => {
    let state = startedGame({ teams: 3, timerSeconds: 30, deductOnWrong: false });
    state = settle(reveal(openClue(state, CLUE_300)), 'team-a', CLUE_300);
    state = settle(reveal(openClue(state, CLUE_100)), null, CLUE_100);

    expect(selectScore(state, 'team-a')).toBe(300);
    expect(state.events.filter((event) => event.outcome === 'wrong')[0]?.delta).toBe(0);
  });

  it('klammert den punktestand schrittweise bei null', () => {
    let state = startedGame({ teams: 2 });
    state = settle(reveal(openClue(state, CLUE_100)), 'team-a', CLUE_100);
    expect(selectScore(state, 'team-a')).toBe(100);

    // Zweite Frage beginnt reihum bei Team B; Team A steigt per Veto ein und
    // verliert. 100 minus 200 ergibt 0, nicht -100.
    let zweite = openClue(state, CLUE_200);
    zweite = veto(zweite, 'team-a');
    state = settle(reveal(zweite), 'team-b', CLUE_200);

    expect(selectScore(state, 'team-a')).toBe(0);
  });

  it('lässt den punktestand eines unbeteiligten teams unangetastet', () => {
    let state = startedGame({ teams: 2 });
    state = settle(reveal(openClue(state, CLUE_100)), 'team-a', CLUE_100);
    // Team B spielt die nächste Frage allein – Team A behält seine Punkte.
    state = settle(reveal(openClue(state, CLUE_200)), 'team-b', CLUE_200);

    expect(selectScore(state, 'team-a')).toBe(100);
    expect(selectScore(state, 'team-b')).toBe(200);
  });

  it('weist einen gewinner ab, der nicht beteiligt war', () => {
    const revealed = reveal(openClue(startedGame({ teams: 3 })));
    expect(settle(revealed, 'team-c')).toBe(revealed);
  });

  it('ignoriert eine zweite wertung derselben frage', () => {
    const first = settle(reveal(openClue(startedGame())), 'team-a');
    expect(settle(first, 'team-b')).toBe(first);
  });

  it('schließt das popup und markiert die karte als gespielt', () => {
    const state = settle(reveal(openClue(startedGame())), 'team-a');

    expect(state.openClueId).toBeNull();
    expect(state.answeringTeamIds).toEqual([]);
    expect(selectIsClueScored(state, CLUE_100)).toBe(true);
  });

  it('zählt gespielte karten, nicht wertungen', () => {
    let state = openClue(startedGame({ teams: 3, timerSeconds: 30 }));
    state = veto(state, 'team-b');
    state = settle(reveal(state), 'team-b');

    expect(state.events).toHaveLength(2);
    expect(selectScoredCount(state)).toBe(1);
  });

  it('wechselt nach der letzten frage in die endphase', () => {
    let state = startedGame();
    for (const category of sampleDefinition.categories) {
      for (const clue of category.clues) {
        // Gewertet wird jeweils das Team, das die Frage begonnen hat.
        const opened = openClue(state, clue.id);
        state = settle(reveal(opened), opened.activeTeamId, clue.id);
      }
    }

    expect(state.phase).toBe('finished');
    expect(selectScoredCount(state)).toBe(25);
  });
});

describe('zugreihenfolge', () => {
  it('lässt den ersten zugriff nach jeder frage reihum wandern', () => {
    let state = startedGame({ teams: 3 });
    expect(state.startingTeamIndex).toBe(0);

    state = settle(reveal(openClue(state, CLUE_100)), 'team-a', CLUE_100);
    expect(state.startingTeamIndex).toBe(1);
    expect(openClue(state, CLUE_200).activeTeamId).toBe('team-b');

    state = settle(reveal(openClue(state, CLUE_200)), 'team-b', CLUE_200);
    expect(state.startingTeamIndex).toBe(2);
  });

  it('läuft nach dem letzten team wieder von vorn', () => {
    let state = startedGame({ teams: 2 });
    state = settle(reveal(openClue(state, CLUE_100)), 'team-a', CLUE_100);
    state = settle(reveal(openClue(state, CLUE_200)), 'team-b', CLUE_200);

    expect(state.startingTeamIndex).toBe(0);
  });
});

describe('übungsmodus', () => {
  it('kennt keine veto-kandidaten und wertet trotzdem', () => {
    let state = openClue(startedGame({ teams: 1, timerSeconds: 30 }));
    expect(state.answeringTeamIds).toEqual(['team-a']);
    expect(veto(state, 'team-b')).toBe(state);

    state = settle(reveal(state), 'team-a');
    expect(selectScore(state, 'team-a')).toBe(100);
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
    const state = settle(reveal(openClue(startedGame())), 'team-a');
    expect(gameReducer(state, { type: 'game/reset' })).toEqual(initialGameState);
  });

  it('lässt unbekannte actions wirkungslos', () => {
    const state = startedGame();
    const unknownAction = { type: 'gibt/es-nicht' } as unknown as GameAction;
    expect(gameReducer(state, unknownAction)).toBe(state);
  });

  it('ist deterministisch und verändert den vorzustand nicht', () => {
    const state = reveal(openClue(startedGame()));
    const before = JSON.stringify(state);

    const first = settle(state, 'team-a');
    const second = settle(state, 'team-a');

    expect(JSON.stringify(state)).toBe(before);
    expect(first).toEqual(second);
  });
});
