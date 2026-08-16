import { sampleDefinition } from '@jeopardy/game-core';
import type { GameState } from '@jeopardy/game-core';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { openClue, playClue, renderWithGame, startedState } from '../../test/renderWithGame';
import { ResultOverlay } from './ResultOverlay';
import { Scoreboard } from './Scoreboard';

/**
 * Spielt alle 25 Karten durch. Gewertet wird jeweils das Team, das die Frage
 * reihum beginnt; jede dritte Frage endet ohne richtige Antwort.
 */
function finishedState(teamCount = 2): GameState {
  let state = startedState(teamCount);
  let index = 0;

  for (const category of sampleDefinition.categories) {
    for (const clue of category.clues) {
      const starter = state.teams[state.startingTeamIndex % state.teams.length];
      if (!starter) throw new Error('Team fehlt.');
      state = playClue(state, clue.id, index % 3 === 0 ? null : starter.id);
      index += 1;
    }
  }
  return state;
}

describe('teamleiste', () => {
  it('zeigt jedes team mit punktestand', () => {
    // Team B steigt per Veto ein und gewinnt die Frage.
    const state = playClue(startedState(3), 'wissenschaft-300', 'team-b', ['team-b']);
    renderWithGame(<Scoreboard />, state);

    expect(screen.getByDisplayValue('Team A')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Team C')).toBeInTheDocument();
    expect(screen.getByText('300')).toBeInTheDocument();
  });

  it('übernimmt einen neuen teamnamen', async () => {
    const { transport } = renderWithGame(<Scoreboard />);
    const input = screen.getByDisplayValue('Team A');

    await userEvent.clear(input);
    await userEvent.type(input, 'Die Adler');
    await userEvent.tab();

    expect(transport.getState().teams[0]?.name).toBe('Die Adler');
  });

  it('stellt einen leer gelassenen namen wieder her', async () => {
    const { transport } = renderWithGame(<Scoreboard />);
    const input = screen.getByDisplayValue('Team B');

    await userEvent.clear(input);
    await userEvent.tab();

    expect(transport.getState().teams[1]?.name).toBe('Team B');
    expect(screen.getByDisplayValue('Team B')).toBeInTheDocument();
  });
});

describe('serien in der teamleiste', () => {
  /** Lässt ein Team `count` Fragen hintereinander gewinnen oder verlieren. */
  function series(count: number, winnerTeamId: string | null): GameState {
    let state = startedState(2);
    const clueIds = [
      'wissenschaft-100',
      'wissenschaft-200',
      'wissenschaft-300',
      'wissenschaft-400',
    ];
    for (const clueId of clueIds.slice(0, count)) {
      state = playClue(state, clueId, winnerTeamId, ['team-a']);
    }
    return state;
  }

  it('zeigt ab drei richtigen antworten die flamme mit der länge', () => {
    renderWithGame(<Scoreboard />, series(3, 'team-a'));

    expect(screen.getByText('Team A: 3 richtige Antworten in Folge')).toBeInTheDocument();
    expect(screen.getByText('🔥')).toBeInTheDocument();
  });

  it('zeigt bei drei falschen antworten das eis', () => {
    renderWithGame(<Scoreboard />, series(3, null));

    expect(screen.getByText('Team A: 3 falsche Antworten in Folge')).toBeInTheDocument();
    expect(screen.getByText('🧊')).toBeInTheDocument();
  });

  it('bleibt bei zwei gleichen ausgängen still', () => {
    renderWithGame(<Scoreboard />, series(2, 'team-a'));

    expect(screen.queryByText('🔥')).not.toBeInTheDocument();
    expect(screen.queryByText('🧊')).not.toBeInTheDocument();
  });
});

/**
 * Laufende Frage, bei der Team B per Veto übernommen hat: Der Zugriff liegt
 * beim zweiten Team, die nächste Frage beginnt weiterhin beim ersten – so wird
 * sichtbar, welcher Selektor die Anzeige speist.
 */
function openClueState(): GameState {
  return openClue(startedState(2, undefined, { timerSeconds: 30 }), 'wissenschaft-100', ['team-b']);
}

/** Die einzige als „am Zug" markierte Kachel – schlägt fehl, wenn es mehr oder keine gibt. */
function tileOnTurn(): HTMLElement {
  const tiles = document.querySelectorAll('[aria-current="true"]');
  expect(tiles).toHaveLength(1);
  const tile = tiles[0];
  if (!(tile instanceof HTMLElement)) throw new Error('Keine Kachel ist als am Zug markiert.');
  return tile;
}

describe('am zug', () => {
  it('markiert bei zwei teams genau ein team als am zug', () => {
    renderWithGame(<Scoreboard />, startedState(2));

    const hinweis = screen.getByText('Nächste Frage beginnt bei Team A');
    expect(hinweis).toHaveAttribute('aria-live', 'polite');
    expect(within(tileOnTurn()).getByDisplayValue('Team A')).toBeInTheDocument();
    expect(screen.getAllByText('Am Zug')).toHaveLength(1);
  });

  it('rückt nach einer gewerteten frage zum nächsten team weiter', () => {
    const state = playClue(startedState(2), 'wissenschaft-100', 'team-a');
    renderWithGame(<Scoreboard />, state);

    expect(screen.getByText('Nächste Frage beginnt bei Team B')).toBeInTheDocument();
    expect(within(tileOnTurn()).getByDisplayValue('Team B')).toBeInTheDocument();
  });

  it('zeigt bei geöffneter frage das team mit zugriff', () => {
    renderWithGame(<Scoreboard />, openClueState());

    expect(screen.getByText('Team B ist am Zug')).toBeInTheDocument();
    expect(screen.queryByText(/Nächste Frage beginnt/)).not.toBeInTheDocument();
    expect(within(tileOnTurn()).getByDisplayValue('Team B')).toBeInTheDocument();
  });

  it('entfällt im übungsmodus mit einem team', () => {
    renderWithGame(<Scoreboard />, startedState(1));

    expect(screen.queryByText(/am Zug/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Nächste Frage beginnt/)).not.toBeInTheDocument();
    expect(document.querySelector('[aria-current="true"]')).toBeNull();
  });

  it('lässt den teamnamen auch am zug editierbar', async () => {
    const { transport } = renderWithGame(<Scoreboard />, startedState(2));
    const input = within(tileOnTurn()).getByDisplayValue('Team A');

    await userEvent.clear(input);
    await userEvent.type(input, 'Die Adler');
    await userEvent.tab();

    expect(transport.getState().teams[0]?.name).toBe('Die Adler');
    expect(screen.getByText('Nächste Frage beginnt bei Die Adler')).toBeInTheDocument();
  });
});

describe('endstand', () => {
  it('bleibt während des spiels verborgen', () => {
    renderWithGame(<ResultOverlay onNewGame={vi.fn()} />, startedState());
    expect(screen.queryByRole('heading', { name: 'Endstand' })).not.toBeInTheDocument();
  });

  it('zeigt nach der letzten frage das ranking', () => {
    renderWithGame(<ResultOverlay onNewGame={vi.fn()} />, finishedState(2));

    expect(screen.getByRole('heading', { name: 'Endstand' })).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
  });

  it('zeigt im übungsmodus die trefferquote statt eines rankings', () => {
    renderWithGame(<ResultOverlay onNewGame={vi.fn()} />, finishedState(1));

    expect(screen.getByRole('heading', { name: 'Ergebnis' })).toBeInTheDocument();
    expect(screen.getByText(/von 25 Fragen richtig beantwortet/)).toBeInTheDocument();
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
  });

  it('lässt sich schließen und meldet den wunsch nach einem neuen spiel', async () => {
    const onNewGame = vi.fn();
    renderWithGame(<ResultOverlay onNewGame={onNewGame} />, finishedState(2));

    await userEvent.click(screen.getByRole('button', { name: 'Zurück zum Spielfeld' }));
    expect(screen.queryByRole('heading', { name: 'Endstand' })).not.toBeInTheDocument();
  });

  it('meldet den start eines neuen spiels', async () => {
    const onNewGame = vi.fn();
    renderWithGame(<ResultOverlay onNewGame={onNewGame} />, finishedState(2));

    await userEvent.click(screen.getByRole('button', { name: 'Neues Spiel' }));
    expect(onNewGame).toHaveBeenCalledOnce();
  });
});
