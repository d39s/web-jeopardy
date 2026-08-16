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

  it('gibt nach ablauf an das nächste team weiter und startet die zeit neu', () => {
    const { transport } = renderWithGame(<ClueDialog />, openedWithTimer(20));

    advance(20_000);

    expect(transport.getState().activeTeamIndex).toBe(1);
    expect(transport.getState().timerEndsAt).toBe(START + 40_000);
    expect(screen.getByText('Bedenkzeit für Team B')).toBeVisible();
    expect(screen.getByText('20')).toBeVisible();
    expect(screen.getByText('Zeit für Team A abgelaufen')).toBeVisible();
  });

  it('blendet den hinweis auf den teamwechsel wieder aus', () => {
    renderWithGame(<ClueDialog />, openedWithTimer(20));

    advance(20_000);
    expect(screen.getByText('Zeit für Team A abgelaufen')).toBeVisible();

    advance(3000);
    expect(screen.queryByText('Zeit für Team A abgelaufen')).not.toBeInTheDocument();
  });

  it('schließt das popup ohne wertung, wenn alle teams durch sind', () => {
    const { transport } = renderWithGame(<ClueDialog />, openedWithTimer(20));

    advance(20_000);
    advance(20_000);

    const state = transport.getState();
    expect(state.openClueId).toBeNull();
    expect(state.events).toHaveLength(1);
    expect(state.events[0]?.outcome).toBe('unanswered');
    expect(state.events[0]?.teamId).toBeNull();
    expect(state.events[0]?.delta).toBe(0);
    expect(screen.queryByText(/Bedenkzeit für/)).not.toBeInTheDocument();
  });

  it('wertet im übungsmodus mit einem team die frage nach einem ablauf als gespielt', () => {
    const { transport } = renderWithGame(<ClueDialog />, openedWithTimer(20, 1));

    expect(screen.getByText('Bedenkzeit für Team A')).toBeVisible();

    advance(20_000);

    const state = transport.getState();
    expect(state.openClueId).toBeNull();
    expect(state.events).toHaveLength(1);
    expect(state.events[0]?.outcome).toBe('unanswered');
    expect(screen.queryByText(/Bedenkzeit für/)).not.toBeInTheDocument();
  });

  // Bei laufender Uhr wird geklickt, ohne die Zeit zu bewegen – daher
  // fireEvent statt userEvent, das intern selbst auf Timer wartet.
  it('beendet die bedenkzeit mit "antwort anzeigen"', () => {
    const { transport } = renderWithGame(<ClueDialog />, openedWithTimer(20));

    fireEvent.click(screen.getByRole('button', { name: 'Antwort anzeigen' }));

    expect(transport.getState().timerEndsAt).toBeNull();
    expect(screen.queryByText(/Bedenkzeit für/)).not.toBeInTheDocument();
    expect(screen.getByText('Kohlenstoffdioxid')).toBeVisible();
  });

  it('räumt den takt beim schließen des popups auf', () => {
    const { transport, unmount } = renderWithGame(<ClueDialog />, openedWithTimer(20));

    unmount();
    advance(60_000);

    expect(transport.getState().events).toHaveLength(0);
    expect(transport.getState().activeTeamIndex).toBe(0);
  });
});
