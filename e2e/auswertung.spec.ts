import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { playAllClues, startGame } from './helpers';

/**
 * Auswertung am Spielende: Endstand, Statistik mit Punkteverlauf und der
 * Rückblick auf alle Fragen.
 */

test('auswertung öffnet sich am spielende und zeigt alle reiter', async ({ page }) => {
  await startGame(page, 3);
  await playAllClues(page);

  const dialog = page.getByRole('dialog');
  await expect(dialog.getByRole('heading', { name: 'Endstand' })).toBeVisible();

  await dialog.getByRole('tab', { name: 'Statistik' }).click();
  await expect(dialog.getByRole('row', { name: /^Team A/ })).toBeVisible();

  await dialog.getByRole('tab', { name: 'Verlauf' }).click();
  await expect(dialog.getByRole('img', { name: /Punkteverlauf über 25 Fragen/ })).toBeVisible();

  await dialog.getByRole('tab', { name: 'Fragen' }).click();
  const fragen = dialog.getByRole('tabpanel').getByRole('listitem');
  await expect(fragen).toHaveCount(25);
  // Welche Frage zuerst gespielt wurde, entscheidet die Ziehung – der Rückblick
  // nennt sie in jedem Fall mit Punktzahl und Antwort.
  await expect(fragen.first()).toContainText('Frage 1');
  await expect(fragen.first()).toContainText('Antwort');

  // Barrierefreiheit der Auswertung selbst.
  const ergebnis = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
  expect(ergebnis.violations).toEqual([]);
});

test('auswertung lässt sich schließen und über die kopfzeile erneut öffnen', async ({ page }) => {
  await startGame(page, 2);
  await playAllClues(page);

  await page.getByRole('button', { name: 'Zurück zum Spielfeld' }).click();
  await expect(page.getByRole('heading', { name: 'Endstand' })).toHaveCount(0);

  await page.getByRole('button', { name: 'Auswertung' }).click();
  await expect(page.getByRole('heading', { name: 'Endstand' })).toBeVisible();
});
