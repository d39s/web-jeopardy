import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { awardClue, renderWithGame, startedState } from '../../test/renderWithGame';
import { BoardGrid } from './BoardGrid';

describe('spielfeld', () => {
  it('zeigt fünf kategorien und 25 punktekarten', () => {
    renderWithGame(<BoardGrid />);

    expect(screen.getByText('Wissenschaft')).toBeInTheDocument();
    expect(screen.getAllByRole('button')).toHaveLength(25);
  });

  it('öffnet eine karte per klick, ohne sie zu werten', async () => {
    const { transport } = renderWithGame(<BoardGrid />);

    await userEvent.click(screen.getByRole('button', { name: 'Wissenschaft, 100 Punkte' }));

    expect(transport.getState().openClueId).toBe('wissenschaft-100');
    expect(transport.getState().events).toHaveLength(0);
  });

  it('lässt eine geöffnete, aber nicht gewertete karte weiterhin anklickbar', () => {
    renderWithGame(<BoardGrid />);

    // Kernanforderung: Grau wird die Karte erst nach einem Punktebutton.
    expect(screen.getByRole('button', { name: 'Wissenschaft, 100 Punkte' })).toBeEnabled();
  });

  it('sperrt eine gewertete karte und kennzeichnet sie', () => {
    const state = awardClue(startedState(), 'wissenschaft-100', 'team-a', true);
    renderWithGame(<BoardGrid />, state);

    const card = screen.getByRole('button', {
      name: 'Wissenschaft, 100 Punkte – bereits gespielt',
    });
    expect(card).toBeDisabled();
  });
});
