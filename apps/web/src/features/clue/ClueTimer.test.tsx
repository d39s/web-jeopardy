import {
  createDefaultTeams,
  gameReducer,
  initialGameState,
  sampleDefinition,
} from '@jeopardy/game-core';
import type { GameState } from '@jeopardy/game-core';
import { act, fireEvent, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithGame } from '../../test/renderWithGame';
import { ClueDialog } from './ClueDialog';

const CLUE_ID = 'wissenschaft-100';
const START = new Date('2026-08-16T20:00:00.000Z').getTime();

/** Geöffnete Frage mit (oder ohne) laufende Bedenkzeit. */
function openedWithTimer(timerSeconds: number | null, teamCount = 2): GameState {
  const started = gameReducer(initialGameState, {
    type: 'game/start',
    definition: sampleDefinition,
    teams: createDefaultTeams(teamCount),
    timerSeconds,
  });
  return gameReducer(started, { type: 'clue/open', clueId: CLUE_ID, at: START });
}

/** Lässt die Uhr weiterlaufen – Takt und Anzeige folgen im selben Schritt. */
function advance(ms: number): void {
  act(() => {
    vi.advanceTimersByTime(ms);
  });
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(START);
});

afterEach(() => {
  vi.useRealTimers();
});

describe('bedenkzeit im frage-popup', () => {
  it('zeigt ohne eingestellte bedenkzeit keinerlei countdown', () => {
    renderWithGame(<ClueDialog />, openedWithTimer(null));

    expect(screen.getByText('Welches Gas atmen Pflanzen bei der Fotosynthese auf?')).toBeVisible();
    expect(screen.queryByText(/Bedenkzeit für/)).not.toBeInTheDocument();
  });

  it('zeigt die bedenkzeit für das team am zug', () => {
    renderWithGame(<ClueDialog />, openedWithTimer(20));

    expect(screen.getByText('Bedenkzeit für Team A')).toBeVisible();
    expect(screen.getByText('20')).toBeVisible();
    expect(screen.getByText('noch 20 Sekunden')).toBeInTheDocument();
  });

  it('zählt die verbleibenden sekunden herunter', () => {
    renderWithGame(<ClueDialog />, openedWithTimer(20));

    advance(5000);
    expect(screen.getByText('15')).toBeVisible();

    advance(9000);
    expect(screen.getByText('6')).toBeVisible();
  });

  it('zeigt längere zeiten als minuten und sekunden', () => {
    renderWithGame(<ClueDialog />, openedWithTimer(90));

    expect(screen.getByText('1:30')).toBeVisible();

    advance(35_000);
    expect(screen.getByText('55')).toBeVisible();
  });

  it('meldet den ablauf, rückt aber nicht von selbst weiter', () => {
    const { transport } = renderWithGame(<ClueDialog />, openedWithTimer(20));

    advance(20_000);

    const state = transport.getState();
    // Nach dem Ablauf entscheidet die Moderation – die Frage bleibt offen.
    expect(state.timerEndsAt).toBeNull();
    expect(state.activeTeamId).toBe('team-a');
    expect(state.openClueId).toBe('wissenschaft-100');
    expect(state.events).toHaveLength(0);
    expect(screen.getByText('Zeit abgelaufen')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Veto: Team B' })).toBeVisible();
  });

  it('startet die zeit neu, wenn ein team per veto übernimmt', () => {
    const { transport } = renderWithGame(<ClueDialog />, openedWithTimer(20));

    advance(20_000);
    fireEvent.click(screen.getByRole('button', { name: 'Veto: Team B' }));

    expect(transport.getState().activeTeamId).toBe('team-b');
    expect(screen.getByText('Veto-Zeit für Team B')).toBeVisible();
    expect(screen.getByText('20')).toBeVisible();
  });

  it('zeigt im übungsmodus keine veto-auswahl', () => {
    renderWithGame(<ClueDialog />, openedWithTimer(20, 1));

    expect(screen.getByText('Bedenkzeit für Team A')).toBeVisible();
    expect(screen.queryByRole('button', { name: /^Veto:/ })).not.toBeInTheDocument();

    advance(20_000);
    expect(screen.getByText('Zeit abgelaufen')).toBeVisible();
  });

  // Bei laufender Uhr wird geklickt, ohne die Zeit zu bewegen – daher
  // fireEvent statt userEvent, das intern selbst auf Timer wartet.
  it('beendet die bedenkzeit mit dem aufdecken', () => {
    const { transport } = renderWithGame(<ClueDialog />, openedWithTimer(20));

    fireEvent.click(screen.getByRole('button', { name: 'Kein Veto – Antwort aufdecken' }));

    expect(transport.getState().timerEndsAt).toBeNull();
    expect(screen.queryByText(/Bedenkzeit für/)).not.toBeInTheDocument();
    expect(screen.getByText('Kohlenstoffdioxid')).toBeVisible();
  });

  it('räumt den takt beim schließen des popups auf', () => {
    const { transport, unmount } = renderWithGame(<ClueDialog />, openedWithTimer(20));

    unmount();
    advance(60_000);

    expect(transport.getState().events).toHaveLength(0);
    expect(transport.getState().activeTeamId).toBe('team-a');
  });
});
