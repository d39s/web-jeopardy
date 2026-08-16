import { sampleDefinition } from '@jeopardy/game-core';
import type { GameState } from '@jeopardy/game-core';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { openClue, playClue, renderWithGame, startedState } from '../../test/renderWithGame';
import { BoardGrid } from './BoardGrid';

const CLUE_ID = 'wissenschaft-100';

/**
 * Spielt die ersten `count` Karten durch. Gewertet wird jeweils das Team, das
 * reihum beginnt – ein anderes wäre gar nicht beteiligt.
 */
function stateWithPlayed(count: number): GameState {
  let state = startedState();
  const clueIds = sampleDefinition.categories.flatMap((category) =>
    category.clues.map((clue) => clue.id),
  );

  for (const clueId of clueIds.slice(0, count)) {
    const starter = state.teams[state.startingTeamIndex % state.teams.length];
    if (!starter) throw new Error('Team fehlt.');
    state = playClue(state, clueId, starter.id);
  }
  return state;
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

  it('zeigt „niemand richtig" in rot mit kreuz', () => {
    renderWithGame(<BoardGrid />, playClue(startedState(), CLUE_ID, null, ['team-b']));

    const card = scoredCard('Niemand richtig, 100 Punkte');
    expect(within(card).getByText('✗')).toBeInTheDocument();

    // Das Kreuz trägt die Aussage – durchgestrichen wird nicht zusätzlich.
    const punkte = within(card).getByText('100');
    expect(punkte).toHaveClass('text-negative');
    expect(punkte).not.toHaveClass('line-through');

    expect(within(card).getByText('Niemand richtig · 2 Teams')).toBeInTheDocument();
  });

  it('lässt die letzten offenen karten funkeln', () => {
    // 17 gespielte Karten lassen 8 offen – genau die Schwelle.
    renderWithGame(<BoardGrid />, stateWithPlayed(17));

    const karten = screen.getAllByRole('button');
    const offen = karten.filter((karte) => !(karte as HTMLButtonElement).disabled);
    expect(offen).toHaveLength(8);
    expect(offen.every((karte) => karte.className.includes('animate-funkeln'))).toBe(true);
    // Gespielte Karten bleiben ruhig.
    expect(
      karten
        .filter((karte) => (karte as HTMLButtonElement).disabled)
        .every((karte) => !karte.className.includes('animate-funkeln')),
    ).toBe(true);
  });

  it('funkelt bei neun offenen karten noch nicht', () => {
    renderWithGame(<BoardGrid />, stateWithPlayed(16));

    expect(
      screen.getAllByRole('button').every((karte) => !karte.className.includes('animate-funkeln')),
    ).toBe(true);
  });

  it('nennt im übungsmodus kein team auf der karte', () => {
    renderWithGame(<BoardGrid />, playClue(startedState(1), CLUE_ID, 'team-a'));

    const card = scoredCard('Team A richtig, plus 100 Punkte');
    expect(within(card).getByText('✓')).toBeInTheDocument();
    expect(within(card).queryByText('Team A')).not.toBeInTheDocument();
  });
});
