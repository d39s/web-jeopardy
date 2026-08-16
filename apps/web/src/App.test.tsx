import { sampleDefinition } from '@jeopardy/game-core';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from './App';

const topicIndex = {
  schemaVersion: 1,
  topics: [{ id: 'testthema', title: 'Testthema', file: 'testthema.json' }],
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
  it('zeigt zunächst die startseite', async () => {
    render(<App />);

    expect(screen.getByRole('heading', { level: 1, name: 'Jeopardy' })).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText('Testthema')).toBeInTheDocument());
  });

  it('führt von der startseite über das spielfeld bis zur wertung', async () => {
    render(<App />);
    await waitFor(() => expect(screen.getByText('Testthema')).toBeInTheDocument());

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

    // Antwort aufdecken und werten
    await userEvent.click(screen.getByRole('button', { name: 'Antwort anzeigen' }));
    await userEvent.click(screen.getByRole('button', { name: 'Team A richtig' }));

    // Karte ist jetzt gesperrt, Punktestand steht
    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: 'Wissenschaft, 100 Punkte – bereits gespielt' }),
      ).toBeDisabled(),
    );
    expect(screen.getByText('Team A: 100 Punkte')).toBeInTheDocument();
  });
});
