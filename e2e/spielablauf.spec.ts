import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import {
  chooseTopic,
  clueCard,
  revealAnswer,
  scoredClueCard,
  settleButton,
  startGame,
  vetoButton,
} from './helpers';

test('spielfeld passt ohne scrollen auf einen bildschirm', async ({ page }) => {
  await startGame(page);

  const scrollHeight = await page.evaluate(() => document.documentElement.scrollHeight);
  const clientHeight = await page.evaluate(() => document.documentElement.clientHeight);

  expect(scrollHeight).toBeLessThanOrEqual(clientHeight + 1);
});

test('spielfeld zeigt fünf kategorien und 25 karten', async ({ page }) => {
  await startGame(page);

  await expect(page.getByRole('button', { name: /Punkte$/ })).toHaveCount(25);
  for (const category of ['Erdkunde', 'Geschichte', 'Natur', 'Sprache', 'Zahlen']) {
    await expect(page.getByText(category, { exact: true })).toBeVisible();
  }
});

test('lange kategorienamen bleiben in ihrer spalte', async ({ page }) => {
  await page.goto('/');
  await chooseTopic(
    page,
    'Historische Persönlichkeiten',
    'Historische Persönlichkeiten – Einstieg',
  );
  await page.getByRole('button', { name: 'Spiel starten' }).click();

  // "Nationalsozialismus" ist breiter als eine Spalte und muss getrennt werden.
  const kopf = page.getByText('Nationalsozialismus', { exact: true });
  await expect(kopf).toBeVisible();
  const laeuftUeber = await kopf.evaluate((el) => el.scrollWidth > el.clientWidth);
  expect(laeuftUeber).toBe(false);
});

test('teamname lässt sich am spielfeld ändern und wirkt auf die punktebuttons', async ({
  page,
}) => {
  await startGame(page);

  const nameField = page.getByRole('textbox', { name: 'Name von Team A' });
  await nameField.fill('Die Adler');
  await nameField.blur();

  await clueCard(page, 'Erdkunde', 100).click();
  await revealAnswer(page);

  await expect(settleButton(page, 'Die Adler')).toBeVisible();
  await expect(settleButton(page, 'Team A')).toHaveCount(0);
});

test('laufendes spiel übersteht neuladen und lässt sich fortsetzen', async ({ page }) => {
  await startGame(page);
  await clueCard(page, 'Erdkunde', 100).click();
  await revealAnswer(page);
  await settleButton(page, 'Team A').click();

  // Auf das entprellte Speichern warten.
  await page.waitForFunction(() => localStorage.getItem('jeopardy:v1:state') !== null);

  await page.reload();
  await expect(page.getByText('Team A: 100 Punkte')).toBeAttached();
  await expect(scoredClueCard(page, 'Erdkunde', 100)).toBeDisabled();

  // Über die Startseite wird dasselbe Spiel zum Fortsetzen angeboten.
  await page.goto('/');
  await expect(page.getByText('Laufendes Spiel gefunden')).toBeVisible();
  await page.getByRole('button', { name: 'Fortsetzen' }).click();

  await expect(page.getByText('Team A: 100 Punkte')).toBeAttached();
});

test('startseite und spielfeld sind ohne barrieren bedienbar', async ({ page }) => {
  await page.goto('/');
  const startseite = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
  expect(startseite.violations).toEqual([]);

  await startGame(page);
  const spielfeld = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
  expect(spielfeld.violations).toEqual([]);

  await clueCard(page, 'Erdkunde', 100).click();
  const dialog = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
  expect(dialog.violations).toEqual([]);
});

test('frage-popup passt bei acht teams ohne scrollen auf einen bildschirm', async ({ page }) => {
  await startGame(page, 8);
  await clueCard(page, 'Erdkunde', 500).click();

  const dialog = page.locator('dialog[open]');
  await expect(dialog).toBeVisible();

  // Sieben Veto-Knöpfe, Countdown, Frage und Hauptaktion gleichzeitig im Dialog.
  await expect(page.getByRole('button', { name: /^Veto:/ })).toHaveCount(7);

  const scrollt = await dialog.evaluate((el) => el.scrollHeight > el.clientHeight + 1);
  expect(scrollt).toBe(false);

  // Auch die Wertung mit acht Beteiligten bleibt im Rahmen.
  for (const team of ['Team B', 'Team C', 'Team D', 'Team E', 'Team F', 'Team G', 'Team H']) {
    await vetoButton(page, team).click();
  }
  await revealAnswer(page);

  await expect(page.getByText('Wer lag richtig?')).toBeVisible();
  const scrolltWertung = await dialog.evaluate((el) => el.scrollHeight > el.clientHeight + 1);
  expect(scrolltWertung).toBe(false);
});
