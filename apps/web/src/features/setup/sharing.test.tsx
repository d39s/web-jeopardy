import { initialGameState, sampleDefinition } from '@jeopardy/game-core';
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { chooseCategory, drawNumber, mockContentRequests } from '../../test/content';
import { renderWithGame } from '../../test/renderWithGame';
import { SetupPage } from './SetupPage';
import { timerSliderValue } from './TimerSetup';

/** Startseite unter einer Adresse mit oder ohne Teilen-Parameter. */
async function renderSetup(entry = '/') {
  const result = renderWithGame(
    <MemoryRouter initialEntries={[entry]}>
      <SetupPage />
    </MemoryRouter>,
    initialGameState,
  );
  await waitFor(() => expect(screen.getByText('Testkategorie')).toBeInTheDocument());
  return result;
}

/** Startseite rendern und gleich eine Kategorie wählen. */
async function renderWithCategory(entry = '/') {
  const result = await renderSetup(entry);
  await chooseCategory();
  return result;
}

/**
 * Erwarteter Link. Die Ziehungsnummer entsteht beim Aufbau der Seite und ist
 * deshalb nicht vorhersagbar – sie wird von der Seite selbst abgelesen.
 */
function erwarteterLink(rest: string, kategorie = 'testkategorie', stufe = 3): string {
  return `${window.location.origin}/?kategorie=${kategorie}&stufe=${stufe}&ziehung=${drawNumber()}${rest}`;
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
  mockContentRequests();
  window.history.replaceState(null, '', '/');
});

afterEach(() => {
  vi.unstubAllGlobals();
  Reflect.deleteProperty(navigator, 'clipboard');
});

describe('spiel teilen', () => {
  it('zeigt einen link mit kategorie, stufe, ziehung, teams und bedenkzeit', async () => {
    await renderWithCategory();

    expect(linkField()).toHaveValue(erwarteterLink('&teams=Team%20A,Team%20B'));

    fireEvent.change(screen.getByLabelText('Bedenkzeit je Frage'), {
      target: { value: String(timerSliderValue(45)) },
    });

    expect(linkField()).toHaveValue(erwarteterLink('&teams=Team%20A,Team%20B&timer=45'));
  });

  it('übernimmt die eingestellte stufe in den link', async () => {
    await renderWithCategory();

    fireEvent.change(screen.getByLabelText('Schwierigkeit des Spielfelds'), {
      target: { value: '5' },
    });

    expect(linkField()).toHaveValue(erwarteterLink('&teams=Team%20A,Team%20B', 'testkategorie', 5));
  });

  it('tauscht die ziehungsnummer im link, sobald neu gemischt wird', async () => {
    await renderWithCategory();
    const vorher = linkField().value;

    await userEvent.click(screen.getByRole('button', { name: 'Neu mischen' }));

    expect(linkField().value).not.toBe(vorher);
    expect(linkField()).toHaveValue(erwarteterLink('&teams=Team%20A,Team%20B'));
  });

  it('nimmt eine eigene veto-zeit auf und lässt die kopplung weg', async () => {
    await renderWithCategory();

    fireEvent.change(screen.getByLabelText('Bedenkzeit je Frage'), {
      target: { value: String(timerSliderValue(45)) },
    });
    // Solange die Veto-Zeit an der Bedenkzeit hängt, steht sie nicht im Link.
    expect(linkField().value).not.toContain('vetozeit');

    fireEvent.change(screen.getByLabelText('Veto-Zeit je Übernahme'), {
      target: { value: String(timerSliderValue(20)) },
    });

    expect(linkField()).toHaveValue(
      erwarteterLink('&teams=Team%20A,Team%20B&timer=45&vetozeit=20'),
    );
  });

  it('übernimmt geänderte teamnamen und die gewählte kategorie in den link', async () => {
    await renderWithCategory();

    await userEvent.clear(screen.getByLabelText('Name von Team 1'));
    await userEvent.type(screen.getByLabelText('Name von Team 1'), 'Die Grünen Füchse');
    await userEvent.click(screen.getByRole('button', { name: 'Andere Kategorie' }));
    await chooseCategory('Zweite Kategorie');

    expect(linkField()).toHaveValue(
      erwarteterLink('&teams=Die%20Gr%C3%BCnen%20F%C3%BCchse,Team%20B', 'zweite'),
    );
  });

  it('kopiert den link in die zwischenablage und meldet den erfolg', async () => {
    await renderWithCategory();
    const writeText = stubClipboard();
    const erwartet = linkField().value;

    await userEvent.click(screen.getByRole('button', { name: 'Link kopieren' }));

    await waitFor(() => expect(screen.getByText('Link kopiert.')).toBeInTheDocument());
    expect(writeText).toHaveBeenCalledWith(erwartet);
    expect(erwartet).toContain('kategorie=testkategorie');
    expect(erwartet).toContain('teams=Team%20A,Team%20B');
  });

  it('meldet, wenn der link nicht kopiert werden kann', async () => {
    await renderWithCategory();
    stubClipboard('fehler');

    await userEvent.click(screen.getByRole('button', { name: 'Link kopieren' }));

    await waitFor(() =>
      expect(screen.getByText('Der Link konnte nicht kopiert werden.')).toBeInTheDocument(),
    );
  });

  it('bietet ohne verfügbare kategorie keinen link an', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    renderWithGame(
      <MemoryRouter>
        <SetupPage />
      </MemoryRouter>,
      initialGameState,
    );

    await waitFor(() =>
      expect(screen.getByText(/Themenliste konnte nicht geladen werden/)).toBeInTheDocument(),
    );
    expect(screen.queryByRole('button', { name: 'Link kopieren' })).not.toBeInTheDocument();
  });

  it('weist bei einem eigenen fragenset darauf hin, dass der link entfällt', async () => {
    await renderWithCategory();
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

  it('zeigt kategorie, stufe, ziehung, bedenkzeit und die geteilten teamnamen', async () => {
    await renderSetup('/?kategorie=zweite&stufe=4&ziehung=3mv&teams=Adler,Falken&timer=45');

    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText('Geteiltes Spiel')).toBeInTheDocument();
    expect(within(dialog).getByText('Kategorie: Zweite Kategorie')).toBeInTheDocument();
    expect(within(dialog).getByText('Schwierigkeit: Fordernd')).toBeInTheDocument();
    expect(within(dialog).getByText('Ziehung 3mv')).toBeInTheDocument();
    expect(within(dialog).getByText('Bedenkzeit: 45 Sekunden')).toBeInTheDocument();
    expect(within(dialog).getByLabelText('Name von Team 1')).toHaveValue('Adler');
    expect(within(dialog).getByLabelText('Name von Team 2')).toHaveValue('Falken');
  });

  it('übernimmt geänderte namen, kategorie, stufe und ziehung in die startseite', async () => {
    await renderSetup('/?kategorie=zweite&stufe=4&ziehung=3mv&teams=Adler,Falken&timer=45');
    const dialog = await screen.findByRole('dialog');

    await userEvent.clear(within(dialog).getByLabelText('Name von Team 2'));
    await userEvent.type(within(dialog).getByLabelText('Name von Team 2'), 'Die Falken');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Namen übernehmen' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(screen.getByLabelText('Name von Team 1')).toHaveValue('Adler');
    expect(screen.getByLabelText('Name von Team 2')).toHaveValue('Die Falken');
    expect(screen.getByLabelText('Bedenkzeit je Frage')).toHaveValue(String(timerSliderValue(45)));
    expect(screen.getByText('Kategorie: Zweite Kategorie')).toBeInTheDocument();
    expect(screen.getByLabelText('Schwierigkeit des Spielfelds')).toHaveValue('4');
    // Dieselbe Ziehung wie im Link – sonst wäre es nicht dieselbe Partie.
    await waitFor(() => expect(screen.getByText('Ziehung 3mv')).toBeInTheDocument());
  });

  it('zeigt die geteilte veto-zeit und übernimmt sie in den regler', async () => {
    await renderSetup(
      '/?kategorie=zweite&stufe=4&ziehung=3mv&teams=Adler,Falken&timer=45&vetozeit=20',
    );
    const dialog = await screen.findByRole('dialog');

    expect(within(dialog).getByText('Veto-Zeit: 20 Sekunden')).toBeInTheDocument();

    await userEvent.click(within(dialog).getByRole('button', { name: 'Namen übernehmen' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(screen.getByLabelText('Veto-Zeit je Übernahme')).toHaveValue(
      String(timerSliderValue(20)),
    );
    expect(screen.getByText('20 Sekunden')).toBeInTheDocument();
  });

  it('nennt die kopplung, wenn der link keine brauchbare veto-zeit enthält', async () => {
    await renderSetup('/?kategorie=zweite&stufe=4&ziehung=3mv&teams=Adler&timer=45&vetozeit=7');
    const dialog = await screen.findByRole('dialog');

    expect(
      within(dialog).getByText('Veto-Zeit: Wie die Bedenkzeit (45 Sekunden)'),
    ).toBeInTheDocument();

    await userEvent.click(within(dialog).getByRole('button', { name: 'Namen übernehmen' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(screen.getByLabelText('Veto-Zeit je Übernahme')).toHaveValue(
      String(timerSliderValue(null)),
    );
    expect(screen.getByText('Damit gilt: 45 Sekunden')).toBeInTheDocument();
  });

  it('entfernt die parameter aus der adresszeile', async () => {
    window.history.replaceState(null, '', '/?kategorie=zweite&stufe=4&ziehung=3mv&teams=Adler');
    await renderSetup('/?kategorie=zweite&stufe=4&ziehung=3mv&teams=Adler');
    const dialog = await screen.findByRole('dialog');

    await userEvent.click(within(dialog).getByRole('button', { name: 'Namen übernehmen' }));

    await waitFor(() => expect(window.location.search).toBe(''));
  });

  it('lässt die geteilten werte auf wunsch fallen', async () => {
    await renderSetup('/?kategorie=zweite&stufe=4&ziehung=3mv&teams=Adler,Falken&timer=45');
    const dialog = await screen.findByRole('dialog');

    await userEvent.click(within(dialog).getByRole('button', { name: 'Nicht übernehmen' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(screen.getByLabelText('Name von Team 1')).toHaveValue('Team A');
    expect(screen.getByLabelText('Bedenkzeit je Frage')).toHaveValue(
      String(timerSliderValue(null)),
    );
  });

  it('ignoriert eine unbekannte kategorie und eine unzulässige bedenkzeit', async () => {
    await renderSetup('/?kategorie=gibtesnicht&teams=Adler&timer=7');
    const dialog = await screen.findByRole('dialog');

    expect(within(dialog).getByText(/Link ist unvollständig oder fehlerhaft/)).toBeInTheDocument();
    expect(within(dialog).getByText('Bedenkzeit: Ohne Zeitbegrenzung')).toBeInTheDocument();

    await userEvent.click(within(dialog).getByRole('button', { name: 'Namen übernehmen' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    // Ohne brauchbare Kategorie bleibt die Auswahl stehen; die Namen aus dem
    // Link kommen trotzdem an.
    expect(screen.getByRole('button', { name: /Testkategorie/ })).toBeInTheDocument();
    expect(screen.queryByLabelText('Schwierigkeit des Spielfelds')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Name von Team 1')).toHaveValue('Adler');
    expect(screen.getByRole('button', { name: 'Spiel starten' })).toBeDisabled();
  });

  it('begrenzt zu viele geteilte teams auf die obergrenze der oberfläche', async () => {
    const namen = ['A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'A9', 'A10'];
    await renderSetup(`/?kategorie=testkategorie&teams=${namen.join(',')}`);
    const dialog = await screen.findByRole('dialog');

    expect(within(dialog).getAllByRole('textbox')).toHaveLength(8);
    expect(within(dialog).queryByDisplayValue('A9')).not.toBeInTheDocument();
  });

  it('weist auf einen fehlerhaften link hin und bleibt bedienbar', async () => {
    await renderSetup('/?kategorie=&teams=');

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(
      screen.getByText('Der geteilte Link ist unvollständig oder fehlerhaft.'),
    ).toBeInTheDocument();
    // Die Seite bleibt bedienbar: Die Kategorien stehen bereit.
    expect(screen.getByRole('button', { name: /Testkategorie/ })).toBeInTheDocument();
    expect(screen.getByLabelText('Name von Team 1')).toHaveValue('Team A');
  });
});
