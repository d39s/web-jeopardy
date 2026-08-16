import { expect, test } from '@playwright/test';
import {
  clueCard,
  playClue,
  revealAnswer,
  scoredClueCard,
  settleButton,
  startGame,
  vetoButton,
} from './helpers';

/**
 * Verbindliche Regressionstests für die Kernanforderungen aus details.md,
 * ergänzt um die Regeln der Veto-Runde (docs/konzept-veto-runde.md).
 * Diese Fälle dürfen nicht entfernt werden.
 */

test('karte bleibt farbig nach öffnen ohne wertung', async ({ page }) => {
  await startGame(page);

  const karte = clueCard(page, 'Erdkunde', 100);
  await karte.click();

  await expect(page.getByRole('dialog')).toBeVisible();
  await revealAnswer(page);
  await page.getByRole('button', { name: 'Schließen' }).click();

  // Weder Öffnen noch Aufdecken werten – die Karte bleibt spielbar.
  await expect(karte).toBeEnabled();
  await expect(scoredClueCard(page, 'Erdkunde', 100)).toHaveCount(0);
});

test('antwort und wertung erscheinen erst nach dem aufdecken', async ({ page }) => {
  await startGame(page);
  await clueCard(page, 'Erdkunde', 100).click();

  const dialog = page.getByRole('dialog');
  await expect(dialog.getByText('Musterlösung')).toHaveCount(0);
  await expect(dialog.getByText('Wer lag richtig?')).toHaveCount(0);
  await expect(dialog.getByRole('button', { name: 'Team A', exact: true })).toHaveCount(0);

  await revealAnswer(page);

  await expect(dialog.getByText('Musterlösung')).toBeVisible();
  await expect(dialog.getByText('Rom')).toBeVisible();
  await expect(dialog.getByText('Wer lag richtig?')).toBeVisible();
});

test('veto steht für jedes unbeteiligte team bereit', async ({ page }) => {
  await startGame(page, 4);
  await clueCard(page, 'Erdkunde', 100).click();

  // Das Team am Zug taucht nicht auf, die drei anderen schon.
  await expect(vetoButton(page, 'Team A')).toHaveCount(0);
  for (const team of ['Team B', 'Team C', 'Team D']) {
    await expect(vetoButton(page, team)).toBeVisible();
  }

  await vetoButton(page, 'Team C').click();
  await expect(vetoButton(page, 'Team C')).toHaveCount(0);
  await expect(page.getByText('Bereits dran: Team A · Team C')).toBeVisible();
});

test('gewertet werden nur teams, die sich beteiligt haben', async ({ page }) => {
  await startGame(page, 4);
  await clueCard(page, 'Erdkunde', 100).click();
  await vetoButton(page, 'Team C').click();
  await revealAnswer(page);

  const dialog = page.getByRole('dialog');
  await expect(dialog.getByRole('button', { name: 'Team A', exact: true })).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'Team C', exact: true })).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'Team B', exact: true })).toHaveCount(0);
  await expect(dialog.getByRole('button', { name: 'Team D', exact: true })).toHaveCount(0);

  await settleButton(page, 'Team C').click();

  await expect(page.getByText('Team C: 100 Punkte')).toBeAttached();
  await expect(page.getByText('Team A: 0 Punkte')).toBeAttached();
  // Unbeteiligte bleiben unberührt.
  await expect(page.getByText('Team B: 0 Punkte')).toBeAttached();
});

test('punktestand fällt nicht unter null', async ({ page }) => {
  await startGame(page);

  await playClue(page, 'Erdkunde', 100, 'Team A');
  await expect(page.getByText('Team A: 100 Punkte')).toBeAttached();

  // Zweite Frage beginnt reihum bei Team B; Team A steigt per Veto ein und
  // verliert: 100 minus 200 ergibt 0, nicht -100.
  await playClue(page, 'Geschichte', 200, 'Team B', ['Team A']);
  await expect(page.getByText('Team A: 0 Punkte')).toBeAttached();
});

test('übungsmodus mit einem team', async ({ page }) => {
  await startGame(page, 1);
  await clueCard(page, 'Erdkunde', 100).click();

  await expect(page.getByRole('button', { name: /^Veto:/ })).toHaveCount(0);
  await revealAnswer(page);

  await settleButton(page, 'Team A').click();
  await expect(page.getByText('Team A: 100 Punkte')).toBeAttached();
});
