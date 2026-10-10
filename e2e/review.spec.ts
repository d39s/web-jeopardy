import { test, expect } from './fixtures';

test('Bewertungsmodus deckt Lösung auf und speichert vor der nächsten Frage', async ({ page }) => {
  let votes = 0;
  const question = {
    topicId: 'it',
    topicTitle: 'IT',
    rubricName: 'Hardware',
    id: 'review-frage',
    question: 'Was ist eine CPU?',
    answer: 'Ein Prozessor',
    score: 3,
    level: 3,
    votes: 0,
    version: 'a'.repeat(64),
  };
  await page.route('**/api/v1/review/**', async (route) => {
    if (route.request().method() === 'POST') {
      expect(route.request().postDataJSON().verdict).toBe('too-hard');
      votes++;
      await route.fulfill({ json: { score: 3.2, level: 3, votes } });
    } else {
      await route.fulfill({
        json: votes
          ? {
              ...question,
              id: 'review-naechste',
              question: 'Nächste Frage?',
              answer: 'Nächste Lösung',
            }
          : question,
      });
    }
  });
  await page.goto('/');
  await page.getByRole('button', { name: 'Fragen bewerten' }).click();
  await expect(page.getByText(question.question)).toBeVisible();
  await expect(page.getByText(question.answer)).toHaveCount(0);
  await expect(page.getByText('Schwierigkeit: 3', { exact: true })).toHaveCount(0);
  const filtered = page.waitForRequest(
    (request) => request.url().includes('/review/random') && request.url().includes('topicId=it'),
  );
  await page.getByLabel('Kategorie für die Bewertung').selectOption('it');
  await filtered;
  await expect(page.getByText(question.question)).toBeVisible();
  const revealPosition = await page.getByRole('button', { name: 'Antwort anzeigen' }).boundingBox();
  await page.getByRole('button', { name: 'Antwort anzeigen' }).click();
  await expect(page.getByText(question.answer)).toBeVisible();
  expect(await page.getByRole('button', { name: 'Schwierigkeit passt 3' }).boundingBox()).toEqual(
    revealPosition,
  );
  await expect(page.getByText(/Schwierigkeit:|Schwierigkeitswert:|Bewertungen:/)).toHaveCount(0);
  await expect(page.getByText('So wird die Schwierigkeit angepasst')).toHaveCount(0);
  await expect(
    page.getByRole('region', { name: 'Wie passt die Schwierigkeit?' }).getByRole('button'),
  ).toHaveCount(3);
  await expect(page.getByRole('button', { name: 'nicht einschätzbar' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'zu leicht 2' })).toBeVisible();
  await page.getByRole('button', { name: 'zu schwer 4' }).click();
  await expect(page.getByText('Nächste Frage?', { exact: true })).toBeVisible();
  await expect(page.getByText('Nächste Lösung')).toHaveCount(0);
  expect(await page.getByRole('button', { name: 'Antwort anzeigen' }).boundingBox()).toEqual(
    revealPosition,
  );
  expect(votes).toBe(1);
  await expect(page.getByLabel('Kategorie für die Bewertung')).toHaveValue('it');
  await page.getByRole('link', { name: 'Zurück zum Spiel' }).click();
  await expect(page.getByRole('heading', { name: 'Jeopardy', exact: true })).toBeVisible();
});
