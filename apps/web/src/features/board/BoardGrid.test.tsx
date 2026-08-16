import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { openClue, playClue, renderWithGame, startedState } from '../../test/renderWithGame';
import { BoardGrid } from './BoardGrid';

const CLUE_ID = 'wissenschaft-100';

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
    renderWithGame(<BoardGrid />, openClue(startedState(), CLUE_ID));

    // Kernanforderung: Grau wird die Karte erst mit der Wertung.
    const card = screen.getByRole('button', { name: 'Wissenschaft, 100 Punkte' });
    expect(card).toBeEnabled();
    expect(card).not.toHaveClass('bg-surface-mut');
    expect(within(card).getByText('100')).not.toHaveClass('text-positive');
    expect(within(card).queryByText('Team A')).not.toBeInTheDocument();
  });

  it('sperrt eine gewertete karte und kennzeichnet sie', () => {
    renderWithGame(<BoardGrid />, playClue(startedState(), CLUE_ID, 'team-a'));

    const card = scoredCard('Team A richtig, plus 100 Punkte');
    expect(card).toBeDisabled();
    // Der Grauton bleibt – die Ausgangsmarkierung kommt nur hinzu.
    expect(card).toHaveClass('bg-surface-mut');
  });

  it('zeigt den gewinner in grün mit häkchen und namen', () => {
    renderWithGame(<BoardGrid />, playClue(startedState(), CLUE_ID, 'team-a'));

    const card = scoredCard('Team A richtig, plus 100 Punkte');
    expect(within(card).getByText('✓')).toBeInTheDocument();
    expect(within(card).getByText('100')).toHaveClass('text-positive');
    expect(within(card).getByText('Team A')).toBeInTheDocument();
  });

  it('nennt bei mehreren beteiligten deren anzahl', () => {
    renderWithGame(<BoardGrid />, playClue(startedState(3), CLUE_ID, 'team-b', ['team-b']));

    const card = scoredCard('Team B richtig, plus 100 Punkte');
    expect(within(card).getByText('Team B · 2 Teams')).toBeInTheDocument();
  });

  it('zeigt „niemand richtig" in rot und durchgestrichen', () => {
    renderWithGame(<BoardGrid />, playClue(startedState(), CLUE_ID, null, ['team-b']));

    const card = scoredCard('Niemand richtig, 100 Punkte');
    expect(within(card).getByText('✗')).toBeInTheDocument();

    const punkte = within(card).getByText('100');
    expect(punkte).toHaveClass('text-negative');
    expect(punkte).toHaveClass('line-through');

    expect(within(card).getByText('Niemand richtig · 2 Teams')).toBeInTheDocument();
  });

  it('nennt im übungsmodus kein team auf der karte', () => {
    renderWithGame(<BoardGrid />, playClue(startedState(1), CLUE_ID, 'team-a'));

    const card = scoredCard('Team A richtig, plus 100 Punkte');
    expect(within(card).getByText('✓')).toBeInTheDocument();
    expect(within(card).queryByText('Team A')).not.toBeInTheDocument();
  });
});
