import { expect, test } from '@playwright/test';
import { clueCard, playClue, scoredClueCard, startGame } from './helpers';

/**
 * Verbindliche Regressionstests für die Kernanforderungen aus details.md.
 * Diese Fälle dürfen nicht entfernt werden (siehe docs/arbeitsplan.md, Kapitel 9).
 */

test('karte bleibt farbig nach öffnen ohne wertung', async ({ page }) => {
  await startGame(page);

  const karte = clueCard(page, 'Erdkunde', 100);
  await karte.click();

  await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByRole('button', { name: 'Antwort anzeigen' }).click();
  await page.getByRole('button', { name: 'Schließen' }).click();

  // Weder Öffnen noch Aufdecken werten – die Karte bleibt spielbar.
  await expect(karte).toBeEnabled();
  await expect(scoredClueCard(page, 'Erdkunde', 100)).toHaveCount(0);
});

test('antwort und punktebuttons erscheinen erst nach reveal', async ({ page }) => {
  await startGame(page);
  await clueCard(page, 'Erdkunde', 100).click();

  const dialog = page.getByRole('dialog');
  await expect(dialog.getByText('Musterlösung')).toHaveCount(0);
  await expect(dialog.getByRole('button', { name: 'Team A richtig' })).toHaveCount(0);
  await expect(dialog.getByRole('button', { name: 'Team A falsch' })).toHaveCount(0);

  await page.getByRole('button', { name: 'Antwort anzeigen' }).click();

  await expect(dialog.getByText('Musterlösung')).toBeVisible();
  await expect(dialog.getByText('Rom')).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'Team A richtig' })).toBeVisible();
});

test('beschriftung team a und b richtig und falsch', async ({ page }) => {
  await startGame(page, 2);
  await clueCard(page, 'Erdkunde', 100).click();
  await page.getByRole('button', { name: 'Antwort anzeigen' }).click();

  const labels = await page
    .getByRole('dialog')
    .getByRole('button')
    .filter({ hasText: /(richtig|falsch)$/ })
    .allInnerTexts();

  expect(labels).toEqual(['Team A richtig', 'Team A falsch', 'Team B richtig', 'Team B falsch']);
});

test('punktestand fällt nicht unter null', async ({ page }) => {
  await startGame(page);

  await playClue(page, 'Erdkunde', 100, 'Team A richtig');
  await expect(page.getByText('Team A: 100 Punkte')).toBeAttached();

  // 100 Punkte minus 200 ergibt 0 und nicht -100.
  await playClue(page, 'Geschichte', 200, 'Team A falsch');
  await expect(page.getByText('Team A: 0 Punkte')).toBeAttached();

  await playClue(page, 'Natur', 300, 'Team A richtig');
  await expect(page.getByText('Team A: 300 Punkte')).toBeAttached();
});

test('punktebuttons entstehen für beliebig viele teams', async ({ page }) => {
  await startGame(page, 4);
  await clueCard(page, 'Erdkunde', 100).click();
  await page.getByRole('button', { name: 'Antwort anzeigen' }).click();

  const scoreButtons = page
    .getByRole('dialog')
    .getByRole('button')
    .filter({ hasText: /(richtig|falsch)$/ });

  await expect(scoreButtons).toHaveCount(8);
  await expect(page.getByRole('button', { name: 'Team D falsch' })).toBeVisible();
});

test('übungsmodus mit einem team', async ({ page }) => {
  await startGame(page, 1);
  await clueCard(page, 'Erdkunde', 100).click();
  await page.getByRole('button', { name: 'Antwort anzeigen' }).click();

  const scoreButtons = page
    .getByRole('dialog')
    .getByRole('button')
    .filter({ hasText: /(richtig|falsch)$/ });
  await expect(scoreButtons).toHaveCount(2);

  await page.getByRole('button', { name: 'Team A richtig' }).click();
  await expect(page.getByText('Team A: 100 Punkte')).toBeAttached();
});
