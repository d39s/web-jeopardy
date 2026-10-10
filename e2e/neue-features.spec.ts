import { expect, test } from './fixtures';
import {
  chooseCategory,
  clueCard,
  columnNames,
  playClue,
  revealAnswer,
  scoredClueCard,
  settleButton,
  setTimer,
  startGame,
  vetoButton,
} from './helpers';

test('bedenkzeit läuft ab, ohne von selbst weiterzurücken', async ({ page }) => {
  await page.goto('/');
  await setTimer(page, 10);
  await chooseCategory(page);
  await page.getByRole('button', { name: 'Spiel starten' }).click();

  await clueCard(page, 0, 100).click();
  await expect(page.getByText('Bedenkzeit Team A')).toBeVisible();

  // Nach Ablauf entscheidet die Moderation – die Frage bleibt offen.
  await expect(page.getByText('Zeit abgelaufen')).toBeVisible({ timeout: 15_000 });
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(vetoButton(page, 'Team B')).toBeVisible();
  await expect(scoredClueCard(page, 0, 100)).toHaveCount(0);
});

test('veto startet die zeit für das übernehmende team neu', async ({ page }) => {
  await page.goto('/');
  await setTimer(page, 10);
  await chooseCategory(page);
  await page.getByRole('button', { name: 'Spiel starten' }).click();

  await clueCard(page, 0, 100).click();
  await expect(page.getByText('Zeit abgelaufen')).toBeVisible({ timeout: 15_000 });

  await vetoButton(page, 'Team B').click();
  // Ohne eigene Veto-Zeit gilt die Bedenkzeit erneut.
  await expect(page.getByText('Veto-Zeit Team B')).toBeVisible();
});

test('gespielte karten zeigen ausgang und verantwortliches team', async ({ page }) => {
  await startGame(page, 2);

  await playClue(page, 0, 100, 'Team A');
  await playClue(page, 1, 200, null, ['Team A']);

  const [erste, zweite] = await columnNames(page);

  await expect(
    page.getByRole('button', {
      name: new RegExp(`^${erste}, 100 Punkte – bereits gespielt\\. Team A richtig`),
    }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', {
      name: new RegExp(`^${zweite}, 200 Punkte – bereits gespielt\\. Niemand richtig`),
    }),
  ).toBeVisible();

  await expect(clueCard(page, 0, 100)).toContainText('Team A');
  await expect(clueCard(page, 1, 200)).toContainText('2 Teams');
});

test('anzeige des teams am zug wandert reihum weiter', async ({ page }) => {
  await startGame(page, 3);

  await expect(page.getByText('Nächste Frage beginnt bei Team A')).toBeVisible();

  await playClue(page, 0, 100, 'Team A');
  await expect(page.getByText('Nächste Frage beginnt bei Team B')).toBeVisible();

  await playClue(page, 1, 100, 'Team B');
  await expect(page.getByText('Nächste Frage beginnt bei Team C')).toBeVisible();
});

test('ohne abzugsregel bleibt der punktestand bei einer falschen antwort stehen', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByRole('button', { name: /Punktestand bleibt/ }).click();
  await chooseCategory(page);
  await page.getByRole('button', { name: 'Spiel starten' }).click();

  await playClue(page, 0, 100, 'Team A');
  await expect(page.getByText('Team A: 100 Punkte')).toBeAttached();

  // Team A steigt per Veto ein und verliert – ohne Abzug bleiben die Punkte.
  await playClue(page, 1, 200, 'Team B', ['Team A']);
  await expect(page.getByText('Team A: 100 Punkte')).toBeAttached();
});

test('serie erscheint am teamnamen ab drei richtigen antworten in folge', async ({ page }) => {
  await startGame(page, 2);

  await playClue(page, 0, 100, 'Team A');
  await playClue(page, 1, 100, 'Team A', ['Team A']);
  await expect(page.getByText('Team A: 3 richtige Antworten in Folge')).toHaveCount(0);

  await playClue(page, 2, 100, 'Team A');
  await expect(page.getByText('Team A: 3 richtige Antworten in Folge')).toBeAttached();

  // Eine verlorene Frage beendet die Serie.
  await playClue(page, 3, 100, 'Team B', ['Team A']);
  await expect(page.getByText(/Team A: \d+ richtige Antworten in Folge/)).toHaveCount(0);
});

test('bei halber abzugsregel kostet eine falsche antwort die hälfte', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /Halbe Punktzahl/ }).click();
  await chooseCategory(page);
  await page.getByRole('button', { name: 'Spiel starten' }).click();

  await playClue(page, 0, 500, 'Team A');
  await expect(page.getByText('Team A: 500 Punkte')).toBeAttached();

  // Team A steigt per Veto ein und verliert: 200er-Frage kostet 100 Punkte.
  await playClue(page, 1, 200, 'Team B', ['Team A']);
  await expect(page.getByText('Team A: 400 Punkte')).toBeAttached();
});

test('geteilter link belegt kategorie, stufe, ziehung, teams und regel vor', async ({ page }) => {
  await page.goto(
    '/?kategorie=popkultur&stufe=4&ziehung=3mv&teams=Rote%20Riesen,Blaue%20Zwerge&timer=45&abzug=0',
  );

  const dialog = page.getByRole('dialog');
  await expect(dialog.getByText('Geteiltes Spiel')).toBeVisible();
  await expect(dialog.getByText('Kategorie: Popkultur')).toBeVisible();
  await expect(dialog.getByText('Schwierigkeit: Fordernd')).toBeVisible();
  await expect(dialog.getByText('Ziehung 3mv')).toBeVisible();
  await expect(dialog.getByText('Bedenkzeit: 45 Sekunden')).toBeVisible();
  // Ohne eigenen Wert im Link koppelt sich die Veto-Zeit an die Bedenkzeit.
  await expect(dialog.getByText(/^Veto-Zeit: Wie die Bedenkzeit/)).toBeVisible();
  await expect(dialog.getByText('Falsche Antwort kostet keine Punkte')).toBeVisible();

  await dialog.getByRole('textbox', { name: 'Name von Team 2' }).fill('Blaue Riesen');
  await dialog.getByRole('button', { name: 'Namen übernehmen' }).click();

  await expect(page.getByRole('textbox', { name: 'Name von Team 1' })).toHaveValue('Rote Riesen');
  await expect(page.getByRole('textbox', { name: 'Name von Team 2' })).toHaveValue('Blaue Riesen');
  await expect(page.getByLabel('Bedenkzeit je Frage')).toHaveAttribute(
    'aria-valuetext',
    '45 Sekunden',
  );
  await expect(page.getByRole('button', { name: /Punktestand bleibt/ })).toHaveAttribute(
    'aria-pressed',
    'true',
  );

  await expect(page.getByLabel('Schwierigkeit des Spielfelds')).toHaveValue('4');
  // Dieselbe Ziehung wie im Link – sonst wäre es nicht dieselbe Partie.
  await expect(page.getByText('Ziehung 3mv')).toBeVisible();

  expect(new URL(page.url()).search).toBe('');

  await page.getByRole('button', { name: 'Spiel starten' }).click();
  await clueCard(page, 0, 100).click();
  await revealAnswer(page);
  await expect(settleButton(page, 'Rote Riesen')).toBeVisible();
});
