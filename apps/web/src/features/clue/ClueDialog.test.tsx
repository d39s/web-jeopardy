import { gameReducer, sampleDefinition } from '@jeopardy/game-core';
import type { GameDefinition, GameState } from '@jeopardy/game-core';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { renderWithGame, startedState } from '../../test/renderWithGame';
import { ClueDialog } from './ClueDialog';

function openedState(teamCount = 2, clueId = 'wissenschaft-100'): GameState {
  return gameReducer(startedState(teamCount), { type: 'clue/open', clueId, at: 0 });
}

function revealedState(teamCount = 2): GameState {
  return gameReducer(openedState(teamCount), { type: 'clue/revealAnswer' });
}

/** Kopie des Beispielsets, bei der die erste Frage einen Moderationshinweis trägt. */
function withNoteOnFirstClue(note: string): GameDefinition {
  return {
    ...sampleDefinition,
    categories: sampleDefinition.categories.map((category, index) =>
      index === 0
        ? {
            ...category,
            clues: category.clues.map((clue, clueIndex) =>
              clueIndex === 0 ? { ...clue, note } : clue,
            ),
          }
        : category,
    ),
  };
}

describe('frage-popup', () => {
  it('zeigt kategorie, punktzahl und frage', () => {
    renderWithGame(<ClueDialog />, openedState());

    expect(screen.getByText('Wissenschaft')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '100 Punkte' })).toBeInTheDocument();
    expect(
      screen.getByText('Welches Gas atmen Pflanzen bei der Fotosynthese auf?'),
    ).toBeInTheDocument();
  });

  it('hält musterlösung und punktebuttons vor dem aufdecken aus dem dom', () => {
    renderWithGame(<ClueDialog />, openedState());

    expect(screen.queryByText('Kohlenstoffdioxid')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Team A richtig' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Team A falsch' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Antwort anzeigen' })).toBeInTheDocument();
  });

  it('zeigt nach dem aufdecken musterlösung und punktebuttons', async () => {
    renderWithGame(<ClueDialog />, openedState());

    await userEvent.click(screen.getByRole('button', { name: 'Antwort anzeigen' }));

    expect(screen.getByText('Kohlenstoffdioxid')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Team A richtig' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Team A falsch' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Team B richtig' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Team B falsch' })).toBeInTheDocument();
  });

  it('erzeugt bei zwei teams genau die vier geforderten punktebuttons', () => {
    renderWithGame(<ClueDialog />, revealedState(2));

    const labels = screen
      .getAllByRole('button')
      .map((button) => button.textContent)
      .filter((label) => label?.includes('richtig') || label?.includes('falsch'));

    expect(labels).toEqual(['Team A richtig', 'Team A falsch', 'Team B richtig', 'Team B falsch']);
  });

  it.each([1, 2, 5])('erzeugt bei %i team(s) zwei buttons je team', (teamCount) => {
    renderWithGame(<ClueDialog />, revealedState(teamCount));

    const scoreButtons = screen
      .getAllByRole('button')
      .filter((button) => /(richtig|falsch)$/.test(button.textContent ?? ''));

    expect(scoreButtons).toHaveLength(teamCount * 2);
  });

  it('wertet auf knopfdruck und schließt das popup', async () => {
    const { transport } = renderWithGame(<ClueDialog />, revealedState());

    await userEvent.click(screen.getByRole('button', { name: 'Team B falsch' }));

    const state = transport.getState();
    expect(state.events).toHaveLength(1);
    expect(state.events[0]?.teamId).toBe('team-b');
    expect(state.events[0]?.delta).toBe(-100);
    expect(state.openClueId).toBeNull();
  });

  it('wertet nicht, wenn das popup ohne punktebutton geschlossen wird', async () => {
    const { transport } = renderWithGame(<ClueDialog />, revealedState());

    await userEvent.click(screen.getByRole('button', { name: 'Schließen' }));

    expect(transport.getState().events).toHaveLength(0);
    expect(transport.getState().openClueId).toBeNull();
  });

  it('zeigt den moderationshinweis erst nach dem aufdecken', async () => {
    const withNote = withNoteOnFirstClue('Nicht mit dem Switch verwechseln.');
    renderWithGame(
      <ClueDialog />,
      gameReducer(startedState(2, withNote), {
        type: 'clue/open',
        clueId: 'wissenschaft-100',
        at: 0,
      }),
    );

    expect(screen.queryByText(/Nicht mit dem Switch verwechseln/)).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Antwort anzeigen' }));
    expect(screen.getByText(/Nicht mit dem Switch verwechseln/)).toBeInTheDocument();
  });
});
