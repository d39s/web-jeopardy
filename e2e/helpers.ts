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

  await chooseTopic(page);
  await page.getByRole('button', { name: 'Spiel starten' }).click();
  await expect(page.getByRole('button', { name: /, 100 Punkte$/ }).first()).toBeVisible();
}

/**
 * Die Auswahl läuft in zwei Stufen: erst die Themenkategorie, dann das
 * Fragenset. Ohne Angabe wird jeweils das erste genommen.
 */
export async function chooseTopic(
  page: Page,
  category = 'Allgemeinwissen',
  topic = category,
): Promise<void> {
  const kategorie = page.getByRole('button', { name: new RegExp(`^${category} `) });
  // Der barrierefreie Name beginnt mit dem Titel und nennt danach die
  // Schwierigkeit – so trifft die Suche genau ein Fragenset, auch wenn die
  // Kategorie mehrere Stufen enthält.
  const fragenset = page.getByRole('button', { name: new RegExp(`^${topic} Schwierigkeit`) });

  // Erst warten, bis die Themenliste steht: sonst greift die Sichtbarkeitsprüfung
  // unter Last zu früh und die Kategoriestufe wird stillschweigend übersprungen.
  await expect(kategorie.or(fragenset).first()).toBeVisible();
  if (await kategorie.isVisible()) await kategorie.click();

  await fragenset.click();
}

export function clueCard(page: Page, category: string, points: number) {
  return page.getByRole('button', { name: `${category}, ${points} Punkte` });
}

export function scoredClueCard(page: Page, category: string, points: number) {
  return page.getByRole('button', { name: new RegExp(`^${category}, ${points} Punkte – bereits`) });
}

/** Veto-Knopf im geöffneten Popup. */
export function vetoButton(page: Page, teamName: string) {
  return page.getByRole('dialog').getByRole('button', { name: `Veto: ${teamName}`, exact: true });
}

/**
 * Wertungsknopf im geöffneten Popup. Die Suche bleibt auf den Dialog beschränkt,
 * weil gewertete Karten dieselben Teamnamen in ihrem aria-label nennen.
 */
export function settleButton(page: Page, label: string) {
  return page.getByRole('dialog').getByRole('button', { name: label, exact: true });
}

/** Deckt die Antwort auf – der Knopf heißt je nach verbliebenen Kandidaten anders. */
export async function revealAnswer(page: Page): Promise<void> {
  const keinVeto = page.getByRole('button', { name: 'Kein Veto – Antwort aufdecken' });
  if (await keinVeto.isVisible().catch(() => false)) {
    await keinVeto.click();
    return;
  }
  await page.getByRole('button', { name: 'Antwort anzeigen' }).click();
}

/**
 * Spielt eine Frage komplett durch: öffnen, optionale Vetos, aufdecken, werten.
 * `winner` ist der Teamname; `null` bedeutet „keine richtige Antwort gegeben".
 */
export async function playClue(
  page: Page,
  category: string,
  points: number,
  winner: string | null,
  vetoTeams: string[] = [],
): Promise<void> {
  await clueCard(page, category, points).click();
  for (const team of vetoTeams) await vetoButton(page, team).click();
  await revealAnswer(page);
  await settleButton(page, winner ?? 'Keine richtige Antwort gegeben').click();
  await expect(scoredClueCard(page, category, points)).toBeVisible();
}

/**
 * Stellt die Bedenkzeit über den Schieberegler ein. Die Stufen sind ungleich
 * verteilt, deshalb trägt der Regler den Index; Position 0 heißt „ohne Zeit".
 * Die Liste entspricht TIMER_OPTIONS aus @jeopardy/game-core.
 */
const TIMER_STEPS = [10, 15, 20, 30, 45, 60, 90, 120, 180, 240, 300];

export async function setTimer(page: Page, seconds: number | null): Promise<void> {
  const position = seconds === null ? 0 : TIMER_STEPS.indexOf(seconds) + 1;
  if (position < 0) throw new Error(`Keine Bedenkzeit-Stufe für ${String(seconds)} Sekunden.`);

  await page.getByLabel('Bedenkzeit je Frage').fill(String(position));
}
