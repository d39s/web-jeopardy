import { sampleDefinition } from '@jeopardy/game-core';
import type { GameState } from '@jeopardy/game-core';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { awardClue, renderWithGame, startedState } from '../../test/renderWithGame';
import { ResultOverlay } from './ResultOverlay';
import { Scoreboard } from './Scoreboard';

/** Wertet alle 25 Karten – abwechselnd auf die vorhandenen Teams verteilt. */
function finishedState(teamCount = 2): GameState {
  let state = startedState(teamCount);
  let index = 0;

  for (const category of sampleDefinition.categories) {
    for (const clue of category.clues) {
      const team = state.teams[index % state.teams.length];
      if (!team) throw new Error('Team fehlt.');
      state = awardClue(state, clue.id, team.id, index % 3 !== 0);
      index += 1;
    }
  }
  return state;
}

describe('teamleiste', () => {
  it('zeigt jedes team mit punktestand', () => {
    const state = awardClue(startedState(3), 'wissenschaft-300', 'team-b', true);
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
