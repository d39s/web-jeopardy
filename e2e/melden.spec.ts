import { expect, test } from './fixtures';
import { clueCard, revealAnswer, startGame } from './helpers';

test('frage lässt sich nach dem aufdecken mit kommentar melden', async ({ page }) => {
  const reports: { url: string; body: unknown }[] = [];
  await page.route('**/api/v1/questions/**', async (route) => {
    reports.push({ url: route.request().url(), body: route.request().postDataJSON() });
    await route.fulfill({ status: 204 });
  });
  await startGame(page);
  await clueCard(page, 0, 100).click();
  await expect(page.getByRole('button', { name: 'Frage melden' })).toHaveCount(0);
  await revealAnswer(page);

  await page.getByRole('button', { name: 'Frage melden' }).click();
  const confirm = page.getByRole('dialog', { name: 'Frage melden?' });
  await confirm.getByLabel('Kommentar (freiwillig)').fill('Antwort ist veraltet');
  await confirm.getByRole('button', { name: 'Melden' }).click();

  await expect(page.getByText('Frage gemeldet – danke!')).toBeVisible();
  // Der Fragedialog bleibt für die Wertung offen.
  await expect(page.getByRole('button', { name: 'Keine richtige Antwort gegeben' })).toBeVisible();
  expect(reports).toHaveLength(1);
  expect(reports[0]!.url).toMatch(/\/api\/v1\/questions\/allgemeinwissen\/[^/]+\/reports$/);
  expect(reports[0]!.body).toMatchObject({ source: 'game', comment: 'Antwort ist veraltet' });
});
