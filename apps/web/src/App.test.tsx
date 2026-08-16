import { sampleDefinition } from '@jeopardy/game-core';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from './App';

const topicIndex = {
  schemaVersion: 1,
  categories: [{ id: 'testkategorie', title: 'Testkategorie', description: 'Zum Ausprobieren.' }],
  topics: [
    {
      id: 'testthema',
      title: 'Testthema',
      category: 'testkategorie',
      difficulty: 1,
      file: 'testthema.json',
    },
  ],
};

beforeEach(() => {
  vi.stubGlobal(
    'fetch',
    vi.fn((url: string) =>
      Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve(url.endsWith('index.json') ? topicIndex : sampleDefinition),
      } as Response),
    ),
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('anwendung', () => {
  it('zeigt zunächst die startseite mit den kategorien', async () => {
    render(<App />);

    expect(screen.getByRole('heading', { level: 1, name: 'Jeopardy' })).toBeInTheDocument();
    // Erste Stufe der Auswahl: die Fragensets stehen erst hinter der Kategorie.
    await waitFor(() => expect(screen.getByText('Testkategorie')).toBeInTheDocument());
    expect(screen.queryByText('Testthema')).not.toBeInTheDocument();
  });

  it('führt von der startseite über das spielfeld bis zur wertung', async () => {
    render(<App />);
    await waitFor(() => expect(screen.getByText('Testkategorie')).toBeInTheDocument());

    await userEvent.click(screen.getByRole('button', { name: /Testkategorie/ }));
    await userEvent.click(screen.getByRole('button', { name: /Testthema/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Spiel starten' }));

    // Spielfeld mit Kategorien und Teamleiste
    await waitFor(() => expect(screen.getByText('Wissenschaft')).toBeInTheDocument());
    expect(screen.getByDisplayValue('Team A')).toBeInTheDocument();

    // Karte öffnen: Frage sichtbar, Antwort noch nicht
    await userEvent.click(screen.getByRole('button', { name: 'Wissenschaft, 100 Punkte' }));
    expect(
      screen.getByText('Welches Gas atmen Pflanzen bei der Fotosynthese auf?'),
    ).toBeInTheDocument();
    expect(screen.queryByText('Kohlenstoffdioxid')).not.toBeInTheDocument();

    // Kein Veto: aufdecken und den Gewinner wählen
    await userEvent.click(screen.getByRole('button', { name: 'Kein Veto – Antwort aufdecken' }));
    expect(screen.getByText('Kohlenstoffdioxid')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Team A' }));

    // Karte ist jetzt gesperrt, Punktestand steht
    await waitFor(() =>
      expect(
        // Der Name beginnt mit dem gespielt-Hinweis und nennt danach den Ausgang.
        screen.getByRole('button', { name: /^Wissenschaft, 100 Punkte – bereits gespielt/ }),
      ).toBeDisabled(),
    );
    expect(screen.getByText('Team A: 100 Punkte')).toBeInTheDocument();
  });
});
