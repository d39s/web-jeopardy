import { initialGameState, sampleDefinition } from '@jeopardy/game-core';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithGame } from '../../test/renderWithGame';
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

/** Startseite unter einer Adresse mit oder ohne Teilen-Parameter. */
async function renderSetup(entry = '/') {
  const result = renderWithGame(
    <MemoryRouter initialEntries={[entry]}>
      <SetupPage />
    </MemoryRouter>,
    initialGameState,
  );
  await waitFor(() => expect(screen.getByText('Testthema')).toBeInTheDocument());
  return result;
}

/** Ersetzt die Zwischenablage; gibt die Aufzeichnung der kopierten Texte zurück. */
function stubClipboard(behaviour: 'ok' | 'fehler' = 'ok') {
  const writeText = vi.fn(() =>
    behaviour === 'ok' ? Promise.resolve() : Promise.reject(new Error('verweigert')),
  );
  Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
  return writeText;
}

function linkField(): HTMLInputElement {
  return screen.getByLabelText('Link zur Spielkonfiguration');
}

beforeEach(() => {
  mockTopicRequests();
  window.history.replaceState(null, '', '/');
});

afterEach(() => {
  vi.unstubAllGlobals();
  Reflect.deleteProperty(navigator, 'clipboard');
});

describe('spiel teilen', () => {
  it('zeigt einen link mit thema, teams und bedenkzeit', async () => {
    await renderSetup();

    expect(linkField()).toHaveValue(
      `${window.location.origin}/?thema=testthema&teams=Team%20A,Team%20B`,
    );

    await userEvent.selectOptions(screen.getByLabelText('Bedenkzeit je Frage'), '45');

    expect(linkField()).toHaveValue(
      `${window.location.origin}/?thema=testthema&teams=Team%20A,Team%20B&timer=45`,
    );
  });

  it('übernimmt geänderte teamnamen und das gewählte thema in den link', async () => {
    await renderSetup();

    await userEvent.clear(screen.getByLabelText('Name von Team 1'));
    await userEvent.type(screen.getByLabelText('Name von Team 1'), 'Die Grünen Füchse');
    await userEvent.click(screen.getByRole('button', { name: 'Zweites Thema' }));

    expect(linkField()).toHaveValue(
      `${window.location.origin}/?thema=zweites&teams=Die%20Gr%C3%BCnen%20F%C3%BCchse,Team%20B`,
    );
  });

  it('kopiert den link in die zwischenablage und meldet den erfolg', async () => {
    await renderSetup();
    const writeText = stubClipboard();
    const erwartet = linkField().value;

    await userEvent.click(screen.getByRole('button', { name: 'Link kopieren' }));

    await waitFor(() => expect(screen.getByText('Link kopiert.')).toBeInTheDocument());
    expect(writeText).toHaveBeenCalledWith(erwartet);
    expect(erwartet).toContain('thema=testthema');
    expect(erwartet).toContain('teams=Team%20A,Team%20B');
  });

  it('meldet, wenn der link nicht kopiert werden kann', async () => {
    await renderSetup();
    stubClipboard('fehler');

    await userEvent.click(screen.getByRole('button', { name: 'Link kopieren' }));

    await waitFor(() =>
      expect(screen.getByText('Der Link konnte nicht kopiert werden.')).toBeInTheDocument(),
    );
  });

  it('weist bei einem eigenen fragenset darauf hin, dass der link entfällt', async () => {
    await renderSetup();
    const file = new File([JSON.stringify(sampleDefinition)], 'thema.json', {
      type: 'application/json',
    });

    await userEvent.upload(screen.getByLabelText('JSON-Datei auswählen'), file);

    await waitFor(() =>
      expect(screen.getByText(/lässt sich nicht per Link teilen/)).toBeInTheDocument(),
    );
    expect(screen.queryByRole('button', { name: 'Link kopieren' })).not.toBeInTheDocument();
  });
});

describe('geteilten link öffnen', () => {
  it('zeigt ohne teilen-parameter keinen dialog', async () => {
    await renderSetup();

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.queryByText('Geteiltes Spiel')).not.toBeInTheDocument();
  });

  it('zeigt thema, bedenkzeit und die geteilten teamnamen zur bestätigung', async () => {
    await renderSetup('/?thema=zweites&teams=Adler,Falken&timer=45');

    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText('Geteiltes Spiel')).toBeInTheDocument();
    expect(within(dialog).getByText('Thema: Zweites Thema')).toBeInTheDocument();
    expect(within(dialog).getByText('Bedenkzeit: 45 Sekunden')).toBeInTheDocument();
    expect(within(dialog).getByLabelText('Name von Team 1')).toHaveValue('Adler');
    expect(within(dialog).getByLabelText('Name von Team 2')).toHaveValue('Falken');
  });

  it('übernimmt geänderte namen, thema und bedenkzeit in die startseite', async () => {
    await renderSetup('/?thema=zweites&teams=Adler,Falken&timer=45');
    const dialog = await screen.findByRole('dialog');

    await userEvent.clear(within(dialog).getByLabelText('Name von Team 2'));
    await userEvent.type(within(dialog).getByLabelText('Name von Team 2'), 'Die Falken');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Namen übernehmen' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(screen.getByLabelText('Name von Team 1')).toHaveValue('Adler');
    expect(screen.getByLabelText('Name von Team 2')).toHaveValue('Die Falken');
    expect(screen.getByLabelText('Bedenkzeit je Frage')).toHaveValue('45');
    expect(screen.getByRole('button', { name: 'Zweites Thema' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  it('entfernt die parameter aus der adresszeile', async () => {
    window.history.replaceState(null, '', '/?thema=zweites&teams=Adler');
    await renderSetup('/?thema=zweites&teams=Adler');
    const dialog = await screen.findByRole('dialog');

    await userEvent.click(within(dialog).getByRole('button', { name: 'Namen übernehmen' }));

    await waitFor(() => expect(window.location.search).toBe(''));
  });

  it('lässt die geteilten werte auf wunsch fallen', async () => {
    await renderSetup('/?thema=zweites&teams=Adler,Falken&timer=45');
    const dialog = await screen.findByRole('dialog');

    await userEvent.click(within(dialog).getByRole('button', { name: 'Nicht übernehmen' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(screen.getByLabelText('Name von Team 1')).toHaveValue('Team A');
    expect(screen.getByLabelText('Bedenkzeit je Frage')).toHaveValue('');
  });

  it('ignoriert ein unbekanntes thema und eine unzulässige bedenkzeit', async () => {
    await renderSetup('/?thema=gibtesnicht&teams=Adler&timer=7');
    const dialog = await screen.findByRole('dialog');

    expect(within(dialog).getByText(/Link ist unvollständig oder fehlerhaft/)).toBeInTheDocument();
    expect(within(dialog).getByText('Bedenkzeit: Ohne Zeitbegrenzung')).toBeInTheDocument();

    await userEvent.click(within(dialog).getByRole('button', { name: 'Namen übernehmen' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    // Das Thema bleibt bei der Vorauswahl, die Namen kommen trotzdem an.
    expect(screen.getByRole('button', { name: /Testthema/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByLabelText('Name von Team 1')).toHaveValue('Adler');
    expect(screen.getByRole('button', { name: 'Spiel starten' })).toBeEnabled();
  });

  it('begrenzt zu viele geteilte teams auf die obergrenze der oberfläche', async () => {
    const namen = ['A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'A9', 'A10'];
    await renderSetup(`/?thema=testthema&teams=${namen.join(',')}`);
    const dialog = await screen.findByRole('dialog');

    expect(within(dialog).getAllByRole('textbox')).toHaveLength(8);
    expect(within(dialog).queryByDisplayValue('A9')).not.toBeInTheDocument();
  });

  it('weist auf einen fehlerhaften link hin und bleibt bedienbar', async () => {
    await renderSetup('/?thema=&teams=');

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(
      screen.getByText('Der geteilte Link ist unvollständig oder fehlerhaft.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Spiel starten' })).toBeEnabled();
    expect(screen.getByLabelText('Name von Team 1')).toHaveValue('Team A');
  });
});
