import { initialGameState, sampleDefinition } from '@jeopardy/game-core';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithGame, startedState } from '../../test/renderWithGame';
import { SetupPage } from './SetupPage';

const topicIndex = {
  schemaVersion: 1,
  topics: [
    {
      id: 'testthema',
      title: 'Testthema',
      description: 'Zum Ausprobieren.',
      file: 'testthema.json',
    },
    { id: 'zweites', title: 'Zweites Thema', file: 'zweites.json' },
  ],
};

function mockTopicRequests(): void {
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
}

function renderSetup(state = initialGameState) {
  return renderWithGame(
    <MemoryRouter>
      <SetupPage />
    </MemoryRouter>,
    state,
  );
}

beforeEach(() => {
  mockTopicRequests();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('startseite', () => {
  it('startet mit zwei teams', async () => {
    renderSetup();

    expect(screen.getByDisplayValue('Team A')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Team B')).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText('Testthema')).toBeInTheDocument());
  });

  it('fügt teams hinzu und entfernt sie wieder', async () => {
    renderSetup();

    await userEvent.click(screen.getByRole('button', { name: 'Team hinzufügen' }));
    expect(screen.getByDisplayValue('Team C')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Team C entfernen' }));
    expect(screen.queryByDisplayValue('Team C')).not.toBeInTheDocument();
  });

  it('weist bei einem einzigen team auf den übungsmodus hin', async () => {
    renderSetup();

    await userEvent.click(screen.getByRole('button', { name: 'Team B entfernen' }));

    expect(screen.getByText(/Übungsmodus – Solo-Training/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Team A entfernen' })).toBeDisabled();
  });

  it('begrenzt die teamanzahl auf acht', async () => {
    renderSetup();

    for (let index = 0; index < 6; index += 1) {
      await userEvent.click(screen.getByRole('button', { name: 'Team hinzufügen' }));
    }

    expect(screen.getByRole('button', { name: 'Team hinzufügen' })).toBeDisabled();
    expect(screen.getByText(/Mehr als 8 Teams/)).toBeInTheDocument();
  });

  it('startet das spiel mit dem gewählten thema und den teams', async () => {
    const { transport } = renderSetup();
    await waitFor(() => expect(screen.getByText('Testthema')).toBeInTheDocument());

    await userEvent.click(screen.getByRole('button', { name: 'Spiel starten' }));

    await waitFor(() => expect(transport.getState().phase).toBe('playing'));
    expect(transport.getState().definition?.id).toBe('testthema');
    expect(transport.getState().teams.map((team) => team.name)).toEqual(['Team A', 'Team B']);
  });

  it('übernimmt geänderte teamnamen und füllt leere felder auf', async () => {
    const { transport } = renderSetup();
    await waitFor(() => expect(screen.getByText('Testthema')).toBeInTheDocument());

    await userEvent.clear(screen.getByDisplayValue('Team A'));
    await userEvent.type(screen.getByLabelText('Name von Team 1'), 'Die Adler');
    await userEvent.clear(screen.getByDisplayValue('Team B'));

    await userEvent.click(screen.getByRole('button', { name: 'Spiel starten' }));

    await waitFor(() => expect(transport.getState().phase).toBe('playing'));
    expect(transport.getState().teams.map((team) => team.name)).toEqual(['Die Adler', 'Team B']);
  });

  it('meldet einen fehler, wenn die themenliste nicht geladen werden kann', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    renderSetup();

    await waitFor(() =>
      expect(screen.getByText(/Themenliste konnte nicht geladen werden/)).toBeInTheDocument(),
    );
  });

  it('bietet ein laufendes spiel zum fortsetzen an', async () => {
    const { transport } = renderSetup(startedState(2));

    expect(screen.getByText('Laufendes Spiel gefunden')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Verwerfen' }));
    expect(transport.getState().phase).toBe('setup');
  });

  it('nimmt ein eigenes fragenset entgegen', async () => {
    renderSetup();
    const file = new File([JSON.stringify(sampleDefinition)], 'thema.json', {
      type: 'application/json',
    });

    await userEvent.upload(screen.getByLabelText('JSON-Datei auswählen'), file);

    await waitFor(() =>
      expect(screen.getByText(/Eigenes Fragenset geladen: Testthema/)).toBeInTheDocument(),
    );
  });

  it('meldet ein ungültiges eigenes fragenset feldgenau', async () => {
    renderSetup();
    const file = new File(['{"schemaVersion":1}'], 'kaputt.json', { type: 'application/json' });

    await userEvent.upload(screen.getByLabelText('JSON-Datei auswählen'), file);

    await waitFor(() =>
      expect(screen.getByText(/entspricht nicht dem erwarteten Format/)).toBeInTheDocument(),
    );
    expect(screen.getByText(/^categories:/)).toBeInTheDocument();
  });
});
