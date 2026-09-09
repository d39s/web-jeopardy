import { DIFFICULTY_BANDS, initialGameState, sampleDefinition } from '@jeopardy/game-core';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { chooseCategory, clueIdsOf, mockContentRequests, testPool } from '../../test/content';
import { renderWithGame, startedState } from '../../test/renderWithGame';
import { SetupPage } from './SetupPage';
import { timerSliderValue } from './TimerSetup';

/** Stufe einer gezogenen Karte, über ihre ID im Testvorrat nachgeschlagen. */
function levelOf(clueId: string): number | undefined {
  for (const rubric of testPool.rubrics) {
    const clue = rubric.clues.find((entry) => entry.id === clueId);
    if (clue) return clue.level;
  }
  return undefined;
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
  mockContentRequests();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('startseite', () => {
  it('startet mit zwei teams', async () => {
    renderSetup();

    expect(screen.getByDisplayValue('Team A')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Team B')).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText('Testkategorie')).toBeInTheDocument());
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

  it('zieht beim start ein spielfeld aus der gewählten kategorie', async () => {
    const { transport } = renderSetup();
    await chooseCategory();

    await userEvent.click(screen.getByRole('button', { name: 'Spiel starten' }));

    await waitFor(() => expect(transport.getState().phase).toBe('playing'));
    const definition = transport.getState().definition;
    expect(definition?.category).toBe('testkategorie');
    expect(definition?.categories).toHaveLength(5);
    expect(clueIdsOf(definition!)).toHaveLength(25);
    expect(transport.getState().teams.map((team) => team.name)).toEqual(['Team A', 'Team B']);
  });

  it('gibt die eingestellte stufe an die zeilen des bretts weiter', async () => {
    const { transport } = renderSetup();
    await chooseCategory();

    fireEvent.change(screen.getByLabelText('Schwierigkeit des Spielfelds'), {
      target: { value: '5' },
    });
    await userEvent.click(screen.getByRole('button', { name: 'Spiel starten' }));

    await waitFor(() => expect(transport.getState().phase).toBe('playing'));
    const definition = transport.getState().definition;
    expect(definition?.difficulty).toBe(5);
    for (const category of definition?.categories ?? []) {
      expect(category.clues.map((clue) => levelOf(clue.id))).toEqual([...DIFFICULTY_BANDS[5]]);
    }
  });

  it('zeigt zur eingestellten stufe ihren namen und die zeilen', async () => {
    renderSetup();
    await chooseCategory();

    // Der Name steht auch an den Enden der Skala – geprüft wird deshalb der
    // Vorlesetext des Reglers, der eindeutig den eingestellten Wert nennt.
    const regler = screen.getByLabelText('Schwierigkeit des Spielfelds');
    expect(regler).toHaveAttribute('aria-valuetext', 'Ausgewogen, Schwierigkeit 3 von 5');
    expect(
      screen.getByText('Zeilen 100 bis 500 auf den Stufen 3 · 4 · 5 · 6 · 7'),
    ).toBeInTheDocument();

    fireEvent.change(regler, { target: { value: '1' } });

    expect(regler).toHaveAttribute('aria-valuetext', 'Locker, Schwierigkeit 1 von 5');
    expect(
      screen.getByText('Zeilen 100 bis 500 auf den Stufen 1 · 2 · 3 · 4 · 5'),
    ).toBeInTheDocument();
  });

  it('zieht nach neu mischen ein anderes brett', async () => {
    const { transport } = renderSetup();
    await chooseCategory();

    const erste = screen.getByText(/^Ziehung /).textContent;
    await userEvent.click(screen.getByRole('button', { name: 'Neu mischen' }));
    expect(screen.getByText(/^Ziehung /).textContent).not.toBe(erste);

    await userEvent.click(screen.getByRole('button', { name: 'Spiel starten' }));
    await waitFor(() => expect(transport.getState().phase).toBe('playing'));
    expect(transport.getState().definition).not.toBeNull();
  });

  it('gibt jeder zeile eine andere stufe – die härte steigt im brett', async () => {
    const { transport } = renderSetup();
    await chooseCategory();

    await userEvent.click(screen.getByRole('button', { name: 'Spiel starten' }));
    await waitFor(() => expect(transport.getState().phase).toBe('playing'));

    for (const category of transport.getState().definition?.categories ?? []) {
      const stufen = category.clues.map((clue) => levelOf(clue.id) ?? 0);
      expect(new Set(stufen).size).toBe(5);
      expect([...stufen].sort((a, b) => a - b)).toEqual(stufen);
    }
  });

  it('zeigt umfang und rubriken des geladenen vorrats', async () => {
    renderSetup();
    await chooseCategory();

    const clues = testPool.rubrics.reduce((sum, rubric) => sum + rubric.clues.length, 0);
    expect(
      screen.getByText(`${clues} Fragen in ${testPool.rubrics.length} Rubriken`),
    ).toBeInTheDocument();
  });

  it('übernimmt geänderte teamnamen und füllt leere felder auf', async () => {
    const { transport } = renderSetup();
    await chooseCategory();

    await userEvent.clear(screen.getByDisplayValue('Team A'));
    await userEvent.type(screen.getByLabelText('Name von Team 1'), 'Die Adler');
    await userEvent.clear(screen.getByDisplayValue('Team B'));

    await userEvent.click(screen.getByRole('button', { name: 'Spiel starten' }));

    await waitFor(() => expect(transport.getState().phase).toBe('playing'));
    expect(transport.getState().teams.map((team) => team.name)).toEqual(['Die Adler', 'Team B']);
  });

  it('reicht eine eigene veto-zeit an das spiel weiter', async () => {
    const { transport } = renderSetup();
    await chooseCategory();

    fireEvent.change(screen.getByLabelText('Bedenkzeit je Frage'), {
      target: { value: String(timerSliderValue(45)) },
    });
    fireEvent.change(screen.getByLabelText('Veto-Zeit je Übernahme'), {
      target: { value: String(timerSliderValue(20)) },
    });

    await userEvent.click(screen.getByRole('button', { name: 'Spiel starten' }));

    await waitFor(() => expect(transport.getState().phase).toBe('playing'));
    expect(transport.getState().timerSeconds).toBe(45);
    expect(transport.getState().vetoSeconds).toBe(20);
  });

  it('gibt die kopplung als offene veto-zeit weiter', async () => {
    const { transport } = renderSetup();
    await chooseCategory();

    fireEvent.change(screen.getByLabelText('Bedenkzeit je Frage'), {
      target: { value: String(timerSliderValue(45)) },
    });

    await userEvent.click(screen.getByRole('button', { name: 'Spiel starten' }));

    await waitFor(() => expect(transport.getState().phase).toBe('playing'));
    // null heißt im Kern: es gilt die Bedenkzeit.
    expect(transport.getState().vetoSeconds).toBeNull();
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

  it('zeigt regler und ziehung erst nach der wahl einer kategorie', async () => {
    renderSetup();
    await waitFor(() => expect(screen.getByText('Testkategorie')).toBeInTheDocument());

    expect(screen.queryByLabelText('Schwierigkeit des Spielfelds')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Neu mischen' })).not.toBeInTheDocument();

    await chooseCategory();

    expect(screen.getByLabelText('Schwierigkeit des Spielfelds')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Neu mischen' })).toBeInTheDocument();
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
    // Die Reihenfolge der Meldungen folgt dem Schema – geprüft wird, dass die
    // fehlenden Pflichtfelder feldgenau benannt sind.
    expect(screen.getByText(/^category:/)).toBeInTheDocument();
  });
});
