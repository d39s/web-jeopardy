import { chromium } from '@playwright/test';
const out = process.env.OUT ?? '/tmp';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 810 } });

await page.goto('http://localhost:5173/');
const verwerfen = page.getByRole('button', { name: 'Verwerfen' });
if (await verwerfen.isVisible().catch(() => false)) await verwerfen.click();
await page.getByRole('button', { name: 'Team hinzufügen' }).click();
await page.getByRole('button', { name: 'Spiel starten' }).click();

const spiele = async (kategorie, punkte, gewinner, vetos = []) => {
  await page.getByRole('button', { name: `${kategorie}, ${punkte} Punkte` }).click();
  for (const t of vetos) await page.getByRole('button', { name: `Veto: ${t}`, exact: true }).click();
  const keinVeto = page.getByRole('button', { name: 'Kein Veto – Antwort aufdecken' });
  if (await keinVeto.isVisible().catch(() => false)) await keinVeto.click();
  else await page.getByRole('button', { name: 'Antwort anzeigen' }).click();
  await page.getByRole('dialog').getByRole('button', { name: gewinner ?? 'Keine richtige Antwort gegeben', exact: true }).click();
  await page.waitForTimeout(120);
};

await spiele('Erdkunde', 100, 'Team A');
await spiele('Geschichte', 200, null, ['Team A']);
await spiele('Natur', 300, 'Team C', ['Team C']);
await spiele('Sprache', 400, null);
await page.waitForTimeout(200);
await page.screenshot({ path: `${out}/50-brett-farben.png` });
await browser.close();
