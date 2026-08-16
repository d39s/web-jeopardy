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
  it('bleibt geschlossen, solange er nicht angefordert ist', () => {
    renderWithGame(
      <ResultOverlay open={false} onClose={vi.fn()} onNewGame={vi.fn()} />,
      finishedState(2),
    );
    expect(screen.queryByRole('heading', { name: 'Endstand' })).not.toBeInTheDocument();
  });

  it('zeigt nach der letzten frage das ranking', () => {
    renderWithGame(<ResultOverlay open onClose={vi.fn()} onNewGame={vi.fn()} />, finishedState(2));

    expect(screen.getByRole('heading', { name: 'Endstand' })).toBeInTheDocument();
    expect(within(screen.getByRole('tabpanel')).getAllByRole('listitem')).toHaveLength(2);
  });

  it('zeigt im übungsmodus die trefferquote statt eines rankings', () => {
    renderWithGame(<ResultOverlay open onClose={vi.fn()} onNewGame={vi.fn()} />, finishedState(1));

    expect(screen.getByRole('heading', { name: 'Ergebnis' })).toBeInTheDocument();
    expect(screen.getByText(/von 25 Fragen richtig beantwortet/)).toBeInTheDocument();
    expect(within(screen.getByRole('tabpanel')).queryByRole('list')).not.toBeInTheDocument();
  });

  it('meldet das schließen und den start eines neuen spiels', async () => {
    const onClose = vi.fn();
    const onNewGame = vi.fn();
    renderWithGame(
      <ResultOverlay open onClose={onClose} onNewGame={onNewGame} />,
      finishedState(2),
    );

    await userEvent.click(screen.getByRole('button', { name: 'Zurück zum Spielfeld' }));
    expect(onClose).toHaveBeenCalledOnce();

    await userEvent.click(screen.getByRole('button', { name: 'Neues Spiel' }));
    expect(onNewGame).toHaveBeenCalledOnce();
  });
});

describe('auswertung in reitern', () => {
  function renderAuswertung(teamCount = 2) {
    return renderWithGame(
      <ResultOverlay open onClose={vi.fn()} onNewGame={vi.fn()} />,
      finishedState(teamCount),
    );
  }

  it('startet beim endstand', () => {
    renderAuswertung();

    expect(screen.getByRole('tab', { name: 'Endstand' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: 'Statistik' })).toHaveAttribute(
      'aria-selected',
      'false',
    );
  });

  it('zeigt im reiter Statistik die zahlen je team', async () => {
    renderAuswertung();
    await userEvent.click(screen.getByRole('tab', { name: 'Statistik' }));

    // Reihenfolge der Spalten: richtig, falsch, Vetos, Punkte.
    const zeile = screen.getByRole('row', { name: /^Team A/ });
    expect(within(zeile).getAllByRole('cell')).toHaveLength(4);
  });

  it('zeigt im reiter Verlauf das diagramm mit einer linie je team', async () => {
    const { container } = renderAuswertung(3);
    await userEvent.click(screen.getByRole('tab', { name: 'Verlauf' }));

    expect(screen.getByRole('img', { name: /Punkteverlauf über 25 Fragen/ })).toBeInTheDocument();
    // Eine Polylinie je Team, dazu die Legendenstriche.
    expect(container.querySelectorAll('polyline')).toHaveLength(3);
  });

  it('zeigt im reiter Fragen alle fragen mit lösung und beteiligten', async () => {
    renderAuswertung(3);
    await userEvent.click(screen.getByRole('tab', { name: 'Fragen' }));

    const panel = within(screen.getByRole('tabpanel'));
    expect(panel.getAllByRole('listitem')).toHaveLength(25);
    expect(panel.getByText('Wer stellte die Relativitätstheorie auf?')).toBeInTheDocument();
    expect(panel.getByText('Albert Einstein')).toBeInTheDocument();
  });

  it('weist im rückblick auf ein veto hin', async () => {
    let state = startedState(3);
    // Team B steigt per Veto ein und gewinnt.
    state = playClue(state, 'wissenschaft-100', 'team-b', ['team-b']);
    renderWithGame(<ResultOverlay open onClose={vi.fn()} onNewGame={vi.fn()} />, state);

    await userEvent.click(screen.getByRole('tab', { name: 'Fragen' }));
    const panel = within(screen.getByRole('tabpanel'));

    expect(panel.getByText('Beteiligt: Team A · Team B (Veto)')).toBeInTheDocument();
    expect(panel.getByText('Team B richtig')).toBeInTheDocument();
  });

  it('wechselt den reiter auch mit den pfeiltasten', async () => {
    renderAuswertung();
    const ersterReiter = screen.getByRole('tab', { name: 'Endstand' });
    ersterReiter.focus();

    await userEvent.keyboard('{ArrowRight}');
    expect(screen.getByRole('tab', { name: 'Statistik' })).toHaveFocus();

    await userEvent.keyboard('{End}');
    expect(screen.getByRole('tab', { name: 'Fragen' })).toHaveAttribute('aria-selected', 'true');

    await userEvent.keyboard('{Home}');
    expect(screen.getByRole('tab', { name: 'Endstand' })).toHaveAttribute('aria-selected', 'true');
  });
});
