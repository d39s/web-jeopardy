import { expect } from '@playwright/test';
import type { Page } from '@playwright/test';

/** Startet ein Spiel mit der gewünschten Teamanzahl aus der ersten Kategorie. */
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

  await chooseCategory(page);
  await page.getByRole('button', { name: 'Spiel starten' }).click();
  await expect(page.getByRole('button', { name: /, 100 Punkte$/ }).first()).toBeVisible();
}

/**
 * Wählt eine Themenkategorie und wartet, bis ihr Fragenvorrat geladen ist –
 * vorher lässt sich kein Spiel starten.
 */
export async function chooseCategory(page: Page, category = 'Allgemeinwissen'): Promise<void> {
  await page.getByRole('button', { name: new RegExp(`^${category}`) }).click();
  await expect(page.getByRole('button', { name: 'Neu mischen' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Spiel starten' })).toBeEnabled();
}

/** Stellt die Schwierigkeit über den Regler ein (1 bis 5). */
export async function setDifficulty(page: Page, level: number): Promise<void> {
  await page.getByLabel('Schwierigkeit des Spielfelds').fill(String(level));
}

/**
 * Namen der gezogenen Spalten in Reihenfolge des Bretts. Welche Rubriken es
 * trifft, entscheidet die Ziehung – Tests greifen deshalb über die Position zu.
 */
export async function columnNames(page: Page): Promise<string[]> {
  const labels = await page
    .getByRole('button', { name: /, 100 Punkte/ })
    .evaluateAll((nodes) => nodes.map((node) => node.getAttribute('aria-label') ?? ''));

  return labels.map((label) => label.split(', ')[0] ?? '');
}

/**
 * Karte über Spalte (0 bis 4) und Punktzahl. Gesucht wird bewusst unabhängig
 * davon, ob die Karte schon gewertet ist: Sonst würde sich die Position mit
 * jeder gespielten Karte verschieben.
 */
export function clueCard(page: Page, column: number, points: number) {
  return page.getByRole('button', { name: new RegExp(`, ${points} Punkte`) }).nth(column);
}

/** Dieselbe Karte, aber nur solange sie schon gewertet ist. */
export function scoredClueCard(page: Page, column: number, points: number) {
  return clueCard(page, column, points).and(
    page.getByRole('button', { name: /– bereits gespielt/ }),
  );
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
  column: number,
  points: number,
  winner: string | null,
  vetoTeams: string[] = [],
): Promise<void> {
  await clueCard(page, column, points).click();
  for (const team of vetoTeams) await vetoButton(page, team).click();
  await revealAnswer(page);
  await settleButton(page, winner ?? 'Keine richtige Antwort gegeben').click();
  await expect(scoredClueCard(page, column, points)).toBeVisible();
}

/**
 * Spielt das ganze Spielfeld durch. Gewertet wird jeweils das Team, das die
 * Frage beginnt; jede dritte endet ohne richtige Antwort, damit die Auswertung
 * beide Ausgänge kennt.
 */
export async function playAllClues(page: Page): Promise<void> {
  // Gewertete Karten heißen „… – bereits gespielt" und passen hier nicht mehr.
  const offeneKarte = page.getByRole('button', { name: /^[^,]+, \d+ Punkte$/ });

  for (let index = 0; (await offeneKarte.count()) > 0; index += 1) {
    await offeneKarte.first().click();
    await revealAnswer(page);

    const dialog = page.getByRole('dialog');
    if (index % 3 === 2) {
      await settleButton(page, 'Keine richtige Antwort gegeben').click();
    } else {
      await dialog
        .getByRole('button', { name: /^Team [A-H]$/ })
        .first()
        .click();
    }
  }
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
