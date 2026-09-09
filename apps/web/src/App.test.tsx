import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from './App';
import { chooseCategory, mockContentRequests } from './test/content';

beforeEach(() => {
  mockContentRequests();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

/** Karten einer Punktestufe, unabhängig davon, welche Rubriken gezogen wurden. */
function cardsWorth(points: number): HTMLElement[] {
  return screen.getAllByRole('button', { name: new RegExp(`, ${points} Punkte$`) });
}

describe('anwendung', () => {
  it('zeigt zunächst die startseite mit den kategorien', async () => {
    render(<App />);

    expect(screen.getByRole('heading', { level: 1, name: 'Jeopardy' })).toBeInTheDocument();
    // Erste Stufe der Auswahl: Der Regler kommt erst hinter der Kategorie.
    await waitFor(() => expect(screen.getByText('Testkategorie')).toBeInTheDocument());
    expect(screen.getByText('Zweite Kategorie')).toBeInTheDocument();
    expect(screen.queryByLabelText('Schwierigkeit des Spielfelds')).not.toBeInTheDocument();
  });

  it('führt von der startseite über das spielfeld bis zur wertung', async () => {
    render(<App />);
    await chooseCategory();

    await userEvent.click(screen.getByRole('button', { name: 'Spiel starten' }));

    // Spielfeld mit 25 gezogenen Karten und Teamleiste. Welche Rubriken es
    // trifft, entscheidet die Ziehung – geprüft wird deshalb die Form.
    await waitFor(() => expect(cardsWorth(100)).toHaveLength(5));
    expect(screen.getAllByRole('button', { name: /, \d+ Punkte$/ })).toHaveLength(25);
    expect(screen.getByDisplayValue('Team A')).toBeInTheDocument();

    // Karte öffnen: Frage sichtbar, Antwort noch nicht
    const karte = cardsWorth(100)[0]!;
    const kartenname = karte.getAttribute('aria-label') ?? '';
    await userEvent.click(karte);
    expect(screen.getByText(/Frage auf Stufe/)).toBeInTheDocument();
    expect(screen.queryByText(/^Rubrik [A-F] \d\.\d$/)).not.toBeInTheDocument();

    // Kein Veto: aufdecken und den Gewinner wählen
    await userEvent.click(screen.getByRole('button', { name: 'Kein Veto – Antwort aufdecken' }));
    expect(screen.getByText(/^Rubrik [A-F] \d\.\d$/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Team A' }));

    // Karte ist jetzt gesperrt, Punktestand steht
    await waitFor(() =>
      expect(
        // Der Name beginnt mit dem gespielt-Hinweis und nennt danach den Ausgang.
        screen.getByRole('button', { name: new RegExp(`^${kartenname} – bereits gespielt`) }),
      ).toBeDisabled(),
    );
    expect(screen.getByText('Team A: 100 Punkte')).toBeInTheDocument();
  });
});
