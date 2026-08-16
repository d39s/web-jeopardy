import { expect, test } from '@playwright/test';
import { clueCard, playClue, scoreButton, scoredClueCard, startGame } from './helpers';

test('bedenkzeit läuft und gibt den zugriff an das nächste team weiter', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Bedenkzeit je Frage').selectOption('10');
  await page.getByRole('button', { name: 'Spiel starten' }).click();

  await clueCard(page, 'Erdkunde', 100).click();
  await expect(page.getByText('Bedenkzeit für Team A')).toBeVisible();

  // Nach Ablauf ist ohne Zutun das nächste Team an der Reihe.
  await expect(page.getByText('Bedenkzeit für Team B')).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText('Zeit für Team A abgelaufen')).toBeVisible();
});

test('unbeantwortete frage gilt nach ablauf bei allen teams als gespielt', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Bedenkzeit je Frage').selectOption('10');
  await page.getByRole('button', { name: 'Spiel starten' }).click();

  await clueCard(page, 'Erdkunde', 100).click();
  await expect(page.getByRole('dialog')).toBeVisible();

  // Zweimal zehn Sekunden: erst Team A, dann Team B – danach schließt das Popup.
  await expect(page.getByRole('dialog')).toBeHidden({ timeout: 30_000 });
  await expect(scoredClueCard(page, 'Erdkunde', 100)).toBeDisabled();
  await expect(page.getByText('Ohne Wertung')).toBeVisible();
  await expect(page.getByText('Team A: 0 Punkte')).toBeAttached();
});

test('gespielte karten zeigen ausgang und verantwortliches team', async ({ page }) => {
  await startGame(page, 2);

  await playClue(page, 'Erdkunde', 100, 'Team A richtig');
  await playClue(page, 'Geschichte', 200, 'Team B falsch');

  await expect(
    page.getByRole('button', { name: /Erdkunde, 100 Punkte – bereits gespielt\. Team A richtig/ }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: /Geschichte, 200 Punkte – bereits gespielt\. Team B falsch/ }),
  ).toBeVisible();

  // Der Teamname steht auch sichtbar auf der Karte.
  await expect(page.getByRole('button', { name: /Erdkunde, 100/ })).toContainText('Team A');
});

test('anzeige des teams am zug wandert reihum weiter', async ({ page }) => {
  await startGame(page, 3);

  await expect(page.getByText('Nächste Frage beginnt bei Team A')).toBeVisible();

  await playClue(page, 'Erdkunde', 100, 'Team A richtig');
  await expect(page.getByText('Nächste Frage beginnt bei Team B')).toBeVisible();

  await playClue(page, 'Geschichte', 100, 'Team C richtig');
  await expect(page.getByText('Nächste Frage beginnt bei Team C')).toBeVisible();
});

test('ohne abzugsregel bleibt der punktestand bei einer falschen antwort stehen', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByLabel('Falsche Antwort kostet Punkte').uncheck();
  await page.getByRole('button', { name: 'Spiel starten' }).click();

  await playClue(page, 'Erdkunde', 100, 'Team A richtig');
  await expect(page.getByText('Team A: 100 Punkte')).toBeAttached();

  await playClue(page, 'Geschichte', 200, 'Team A falsch');
  await expect(page.getByText('Team A: 100 Punkte')).toBeAttached();
});

test('geteilter link belegt thema, teams, bedenkzeit und regel vor', async ({ page }) => {
  await page.goto('/?thema=popkultur&teams=Rote%20Riesen,Blaue%20Zwerge&timer=45&abzug=0');

  const dialog = page.getByRole('dialog');
  await expect(dialog.getByText('Geteiltes Spiel')).toBeVisible();
  await expect(dialog.getByText(/Popkultur/)).toBeVisible();
  await expect(dialog.getByText(/45 Sekunden/)).toBeVisible();
  await expect(dialog.getByText('Falsche Antwort kostet keine Punkte')).toBeVisible();

  // Der Name lässt sich vor der Übernahme anpassen.
  await dialog.getByRole('textbox', { name: 'Name von Team 2' }).fill('Blaue Riesen');
  await dialog.getByRole('button', { name: 'Namen übernehmen' }).click();

  await expect(page.getByRole('textbox', { name: 'Name von Team 1' })).toHaveValue('Rote Riesen');
  await expect(page.getByRole('textbox', { name: 'Name von Team 2' })).toHaveValue('Blaue Riesen');
  await expect(page.getByLabel('Bedenkzeit je Frage')).toHaveValue('45');
  await expect(page.getByLabel('Falsche Antwort kostet Punkte')).not.toBeChecked();

  // Die Parameter verschwinden aus der Adresse, ein Neuladen zeigt den Dialog nicht erneut.
  expect(new URL(page.url()).search).toBe('');

  await page.getByRole('button', { name: 'Spiel starten' }).click();
  await clueCard(page, 'Kino', 100).click();
  await page.getByRole('button', { name: 'Antwort anzeigen' }).click();
  await expect(scoreButton(page, 'Rote Riesen richtig')).toBeVisible();
});
