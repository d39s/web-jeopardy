import { gameReducer } from '@jeopardy/game-core';
import type { GameState } from '@jeopardy/game-core';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { awardClue, renderWithGame, startedState } from '../../test/renderWithGame';
import { BoardGrid } from './BoardGrid';

const CLUE_ID = 'wissenschaft-100';

function openClue(state: GameState, clueId = CLUE_ID): GameState {
  return gameReducer(state, { type: 'clue/open', clueId, at: 0 });
}

/**
 * Bedenkzeit bei allen Teams abgelaufen: die Frage gilt als gespielt, ohne Punkte.
 * Der Ablauf zählt erst zum Fristende, daher die Zeitstempel nach 30 bzw. 60 Sekunden.
 */
function unansweredState(): GameState {
  const opened = openClue({ ...startedState(2), timerSeconds: 30 });
  const nextTeam = gameReducer(opened, { type: 'clue/timerExpired', at: 30_000 });
  return gameReducer(nextTeam, { type: 'clue/timerExpired', at: 60_000 });
}

function scoredCard(suffix: string): HTMLElement {
  return screen.getByRole('button', {
    name: `Wissenschaft, 100 Punkte – bereits gespielt. ${suffix}`,
  });
}

describe('spielfeld', () => {
  it('zeigt fünf kategorien und 25 punktekarten', () => {
    renderWithGame(<BoardGrid />);

    expect(screen.getByText('Wissenschaft')).toBeInTheDocument();
    expect(screen.getAllByRole('button')).toHaveLength(25);
  });

  it('öffnet eine karte per klick, ohne sie zu werten', async () => {
    const { transport } = renderWithGame(<BoardGrid />);

    await userEvent.click(screen.getByRole('button', { name: 'Wissenschaft, 100 Punkte' }));

    expect(transport.getState().openClueId).toBe(CLUE_ID);
    expect(transport.getState().events).toHaveLength(0);
  });

  it('lässt eine geöffnete, aber nicht gewertete karte unverändert und anklickbar', () => {
    renderWithGame(<BoardGrid />, openClue(startedState()));

    // Kernanforderung: Grau wird die Karte erst nach einem Punktebutton.
    const card = screen.getByRole('button', { name: 'Wissenschaft, 100 Punkte' });
    expect(card).toBeEnabled();
    expect(card).not.toHaveClass('bg-surface-mut');
    expect(within(card).getByText('100')).not.toHaveClass('text-positive');
    expect(within(card).queryByText('Team A')).not.toBeInTheDocument();
  });

  it('sperrt eine gewertete karte und kennzeichnet sie', () => {
    const state = awardClue(startedState(), CLUE_ID, 'team-a', true);
    renderWithGame(<BoardGrid />, state);

    const card = scoredCard('Team A richtig, plus 100 Punkte');
    expect(card).toBeDisabled();
    // Der Grauton bleibt – die Ausgangsmarkierung kommt nur hinzu.
    expect(card).toHaveClass('bg-surface-mut');
  });

  it('zeigt eine richtig beantwortete karte in grün mit häkchen und teamname', () => {
    renderWithGame(<BoardGrid />, awardClue(startedState(), CLUE_ID, 'team-a', true));

    const card = scoredCard('Team A richtig, plus 100 Punkte');
    expect(within(card).getByText('✓')).toBeInTheDocument();
    expect(within(card).getByText('100')).toHaveClass('text-positive');
    expect(within(card).getByText('Team A')).toBeInTheDocument();
  });

  it('zeigt eine falsch beantwortete karte in rot, durchgestrichen und mit teamname', () => {
    renderWithGame(<BoardGrid />, awardClue(startedState(), CLUE_ID, 'team-b', false));

    const card = scoredCard('Team B falsch, minus 100 Punkte');
    expect(within(card).getByText('✗')).toBeInTheDocument();

    const punkte = within(card).getByText('100');
    expect(punkte).toHaveClass('text-negative');
    expect(punkte).toHaveClass('line-through');

    expect(within(card).getByText('Team B')).toBeInTheDocument();
  });

  it('kennzeichnet eine nicht beantwortete karte neutral', () => {
    renderWithGame(<BoardGrid />, unansweredState());

    const card = scoredCard('Nicht beantwortet');
    expect(card).toBeDisabled();
    expect(within(card).getByText('Ohne Wertung')).toBeInTheDocument();
    expect(within(card).getByText('100')).toHaveClass('text-text-muted');
    expect(within(card).queryByText('✓')).not.toBeInTheDocument();
    expect(within(card).queryByText('✗')).not.toBeInTheDocument();
  });

  it('nennt im übungsmodus kein team auf der karte', () => {
    renderWithGame(<BoardGrid />, awardClue(startedState(1), CLUE_ID, 'team-a', true));

    const card = scoredCard('Team A richtig, plus 100 Punkte');
    expect(within(card).getByText('✓')).toBeInTheDocument();
    expect(within(card).queryByText('Team A')).not.toBeInTheDocument();
  });
});
