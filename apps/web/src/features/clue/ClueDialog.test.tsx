import { gameReducer, sampleDefinition } from '@jeopardy/game-core';
import type { GameDefinition, GameState } from '@jeopardy/game-core';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { openClue, renderWithGame, startedState } from '../../test/renderWithGame';
import { ClueDialog } from './ClueDialog';

const CLUE_ID = 'wissenschaft-100';

function openedState(teamCount = 3, vetoTeamIds: string[] = []): GameState {
  return openClue(startedState(teamCount), CLUE_ID, vetoTeamIds);
}

function revealedState(teamCount = 3, vetoTeamIds: string[] = []): GameState {
  return gameReducer(openedState(teamCount, vetoTeamIds), { type: 'clue/revealAnswer' });
}

/** Offene Frage, deren Frist verstrichen ist – ohne dass etwas weitergerückt wäre. */
function expiredState(teamCount = 8, vetoTeamIds: string[] = []): GameState {
  const opened = openClue(
    startedState(teamCount, sampleDefinition, { timerSeconds: 20 }),
    CLUE_ID,
    vetoTeamIds,
  );
  return gameReducer(opened, { type: 'clue/timerExpired', at: (opened.timerEndsAt ?? 0) + 1 });
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

  it('hält musterlösung und wertung vor dem aufdecken aus dem dom', () => {
    renderWithGame(<ClueDialog />, openedState());

    expect(screen.queryByText('Kohlenstoffdioxid')).not.toBeInTheDocument();
    expect(screen.queryByText('Wer lag richtig?')).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Keine richtige Antwort gegeben' }),
    ).not.toBeInTheDocument();
  });
});

describe('veto-runde', () => {
  it('bietet ab dem öffnen jedes noch unbeteiligte team an', () => {
    renderWithGame(<ClueDialog />, openedState(3));

    expect(screen.getByRole('button', { name: 'Veto: Team B' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Veto: Team C' })).toBeInTheDocument();
    // Das Team am Zug kann sich nicht selbst überbieten.
    expect(screen.queryByRole('button', { name: 'Veto: Team A' })).not.toBeInTheDocument();
  });

  it('übergibt den zugriff und nimmt das team aus der auswahl', async () => {
    const { transport } = renderWithGame(<ClueDialog />, openedState(3));

    await userEvent.click(screen.getByRole('button', { name: 'Veto: Team C' }));

    expect(transport.getState().activeTeamId).toBe('team-c');
    expect(screen.queryByRole('button', { name: 'Veto: Team C' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Veto: Team B' })).toBeInTheDocument();
    expect(screen.getByText('Bereits dran: Team A · Team C')).toBeInTheDocument();
  });

  it('nennt den aufdeck-knopf „kein veto", solange kandidaten übrig sind', () => {
    renderWithGame(<ClueDialog />, openedState(3));

    expect(
      screen.getByRole('button', { name: 'Kein Veto – Antwort aufdecken' }),
    ).toBeInTheDocument();
  });

  it('nennt ihn schlicht „antwort anzeigen", wenn die vetos erschöpft sind', () => {
    renderWithGame(<ClueDialog />, openedState(3, ['team-b', 'team-c']));

    expect(screen.getByRole('button', { name: 'Antwort anzeigen' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^Veto:/ })).not.toBeInTheDocument();
  });

  it('zeigt im übungsmodus keine veto-auswahl', () => {
    renderWithGame(<ClueDialog />, openedState(1));

    expect(screen.queryByRole('button', { name: /^Veto:/ })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Antwort anzeigen' })).toBeInTheDocument();
  });

  it('bietet auch bei acht teams jeden veto-knopf an', () => {
    renderWithGame(<ClueDialog />, openedState(8));

    for (const name of ['Team B', 'Team C', 'Team D', 'Team E', 'Team F', 'Team G', 'Team H']) {
      expect(screen.getByRole('button', { name: `Veto: ${name}` })).toBeVisible();
    }

    expect(screen.queryByRole('button', { name: 'Veto: Team A' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Kein Veto – Antwort aufdecken' })).toBeVisible();
  });

  it('hält die beteiligtenzeile einzeilig und trotzdem vollständig', () => {
    renderWithGame(<ClueDialog />, openedState(8, ['team-b', 'team-c', 'team-d', 'team-e']));

    const zeile = screen.getByText(/^Bereits dran:/);
    const voll = 'Bereits dran: Team A · Team B · Team C · Team D · Team E';

    expect(zeile).toHaveTextContent(voll);
    // Eine Zeile mit Kürzung – der volle Wortlaut bleibt im Titel erreichbar.
    expect(zeile).toHaveClass('truncate');
    expect(zeile).toHaveAttribute('title', voll);
  });
});

describe('fristablauf', () => {
  it('lässt veto-auswahl und hauptaktion stehen und sagt, was zu tun ist', () => {
    renderWithGame(<ClueDialog />, expiredState(8));

    const hinweis = screen.getByRole('status');
    expect(hinweis).toHaveTextContent('Zeit abgelaufen');
    expect(hinweis).toHaveTextContent('Veto zulassen oder die Antwort aufdecken');

    // Von selbst passiert nichts: Beide Wege bleiben offen.
    expect(screen.getByRole('button', { name: 'Veto: Team B' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Veto: Team H' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Kein Veto – Antwort aufdecken' })).toBeVisible();
  });

  it('zeigt auch nach dem ablauf noch die frage', () => {
    renderWithGame(<ClueDialog />, expiredState(8));

    expect(
      screen.getByText('Welches Gas atmen Pflanzen bei der Fotosynthese auf?'),
    ).toBeInTheDocument();
  });
});

describe('barrierefreiheit der veto-runde', () => {
  it('meldet die übernahme in einer höflichen live-region', async () => {
    renderWithGame(<ClueDialog />, openedState(3));

    expect(screen.queryByText(/hat übernommen/)).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Veto: Team C' }));

    const meldung = screen.getByText('Team C hat übernommen und ist jetzt am Zug.');
    expect(meldung).toHaveAttribute('aria-live', 'polite');
  });

  it('nennt beim nächsten veto das neue team', async () => {
    renderWithGame(<ClueDialog />, openedState(4));

    await userEvent.click(screen.getByRole('button', { name: 'Veto: Team C' }));
    await userEvent.click(screen.getByRole('button', { name: 'Veto: Team D' }));

    expect(screen.getByText('Team D hat übernommen und ist jetzt am Zug.')).toBeInTheDocument();
    expect(screen.queryByText(/^Team C hat übernommen/)).not.toBeInTheDocument();
  });
});

describe('wertung', () => {
  it('stellt nach dem aufdecken musterlösung und beteiligte zur wahl', () => {
    renderWithGame(<ClueDialog />, revealedState(3, ['team-c']));

    expect(screen.getByText('Kohlenstoffdioxid')).toBeInTheDocument();
    expect(screen.getByText('Wer lag richtig?')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Team A' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Team C' })).toBeInTheDocument();
    // Team B hat sich nicht beteiligt und wird deshalb nicht gewertet.
    expect(screen.queryByRole('button', { name: 'Team B' })).not.toBeInTheDocument();
  });

  it('gibt dem gewählten team die punkte und schließt das popup', async () => {
    const { transport } = renderWithGame(<ClueDialog />, revealedState(3, ['team-c']));

    await userEvent.click(screen.getByRole('button', { name: 'Team C' }));

    const state = transport.getState();
    expect(state.events).toHaveLength(2);
    expect(state.events.find((event) => event.outcome === 'correct')?.teamId).toBe('team-c');
    expect(state.openClueId).toBeNull();
  });

  it('wertet bei „keine richtige antwort" alle beteiligten als falsch', async () => {
    const { transport } = renderWithGame(<ClueDialog />, revealedState(3, ['team-c']));

    await userEvent.click(screen.getByRole('button', { name: 'Keine richtige Antwort gegeben' }));

    const state = transport.getState();
    expect(state.events).toHaveLength(2);
    expect(state.events.every((event) => event.outcome === 'wrong')).toBe(true);
  });

  it('erklärt die folge für die übrigen beteiligten je nach abzugsregel', () => {
    const { unmount } = renderWithGame(<ClueDialog />, revealedState(3, ['team-c']));
    expect(screen.getByText('Die übrigen beteiligten Teams verlieren 100 Punkte.')).toBeVisible();
    unmount();

    const ohneAbzug = gameReducer(
      openClue(startedState(3, undefined, { deductOnWrong: false }), CLUE_ID, ['team-c']),
      { type: 'clue/revealAnswer' },
    );
    renderWithGame(<ClueDialog />, ohneAbzug);
    expect(screen.getByText('Die übrigen beteiligten Teams erhalten keine Punkte.')).toBeVisible();
  });

  it('wertet nicht, wenn das popup ohne wahl geschlossen wird', async () => {
    const { transport } = renderWithGame(<ClueDialog />, revealedState(3, ['team-c']));

    await userEvent.click(screen.getByRole('button', { name: 'Schließen' }));

    expect(transport.getState().events).toHaveLength(0);
    expect(transport.getState().openClueId).toBeNull();
    expect(transport.getState().answeringTeamIds).toEqual([]);
  });

  it('zeigt den moderationshinweis erst nach dem aufdecken', async () => {
    const withNote = withNoteOnFirstClue('Nicht mit dem Switch verwechseln.');
    renderWithGame(<ClueDialog />, openClue(startedState(2, withNote), CLUE_ID));

    expect(screen.queryByText(/Nicht mit dem Switch verwechseln/)).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Kein Veto – Antwort aufdecken' }));
    expect(screen.getByText(/Nicht mit dem Switch verwechseln/)).toBeInTheDocument();
  });
});
