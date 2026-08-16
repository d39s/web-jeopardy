import { expect } from '@playwright/test';
import type { Page } from '@playwright/test';

/** Startet ein Spiel mit der gewünschten Teamanzahl und dem ersten Thema. */
export async function startGame(page: Page, teamCount = 2): Promise<void> {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1, name: 'Jeopardy' })).toBeVisible();

  const laufendesSpiel = page.getByRole('button', { name: 'Verwerfen' });
  if (await laufendesSpiel.isVisible().catch(() => false)) {
    await laufendesSpiel.click();
  }

  while ((await page.getByRole('button', { name: /entfernen$/ }).count()) > teamCount) {
    await page
      .getByRole('button', { name: /entfernen$/ })
      .last()
      .click();
  }
  while ((await page.getByRole('button', { name: /entfernen$/ }).count()) < teamCount) {
    await page.getByRole('button', { name: 'Team hinzufügen' }).click();
  }

  await page.getByRole('button', { name: 'Spiel starten' }).click();
  await expect(page.getByRole('button', { name: /, 100 Punkte$/ }).first()).toBeVisible();
}

export function clueCard(page: Page, category: string, points: number) {
  return page.getByRole('button', { name: `${category}, ${points} Punkte` });
}

export function scoredClueCard(page: Page, category: string, points: number) {
  return page.getByRole('button', { name: `${category}, ${points} Punkte – bereits gespielt` });
}

/**
 * Punktebutton im geöffneten Popup. Die Suche bleibt bewusst auf den Dialog
 * beschränkt: Gewertete Karten nennen denselben Wortlaut in ihrem aria-label.
 */
export function scoreButton(page: Page, label: string) {
  return page.getByRole('dialog').getByRole('button', { name: label, exact: true });
}

/** Öffnet eine Karte, deckt die Antwort auf und wertet sie. */
export async function playClue(
  page: Page,
  category: string,
  points: number,
  buttonLabel: string,
): Promise<void> {
  await clueCard(page, category, points).click();
  await page.getByRole('button', { name: 'Antwort anzeigen' }).click();
  await scoreButton(page, buttonLabel).click();
  await expect(scoredClueCard(page, category, points)).toBeVisible();
}
