import { expect, test } from './fixtures';
import { chooseCategory, revealAnswer, setDifficulty, setTimer, settleButton } from './helpers';

for (const finished of [false, true]) {
  test(`Vorherige Einstellungen bleiben ${finished ? 'nach Rundenende' : 'bei Neues Spiel'} erhalten`, async ({
    page,
  }) => {
    await page.goto('/');
    await page.getByLabel('Name von Team 1').fill('Die Adler');
    await chooseCategory(page, 'IT und Technik');
    await setDifficulty(page, 4);
    await setTimer(page, 60);
    await page.getByLabel('Veto-Zeit je Übernahme').fill('3');
    await page.getByRole('button', { name: /Halbe Punktzahl/ }).click();
    const seed = await page.getByText(/^Ziehung /).textContent();
    await page.getByRole('button', { name: 'Spiel starten', exact: true }).click();
    const team = page.getByRole('textbox', { name: 'Name von Die Adler' });
    await team.fill('Die Falken');
    await team.blur();
    if (finished) {
      const openCard = page.getByRole('button', { name: /^[^,]+, \d+ Punkte$/ });
      while (await openCard.count()) {
        await openCard.first().click();
        await revealAnswer(page);
        await settleButton(page, 'Keine richtige Antwort gegeben').click();
      }
    }
    page.once('dialog', (dialog) => dialog.accept());
    const button = finished
      ? page.getByRole('dialog').getByRole('button', { name: 'Neues Spiel', exact: true })
      : page.getByRole('button', { name: 'Neues Spiel', exact: true });
    await button.click();
    await expect(page.getByLabel('Name von Team 1')).toHaveValue('Die Falken');
    await expect(page.getByLabel('Schwierigkeit des Spielfelds')).toHaveValue('4');
    await expect(page.getByLabel('Bedenkzeit je Frage')).toHaveValue('6');
    await expect(page.getByLabel('Veto-Zeit je Übernahme')).toHaveValue('3');
    await expect(page.getByRole('button', { name: /Halbe Punktzahl/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await expect(page.getByText('Kategorie: IT und Technik', { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Spiel starten', exact: true })).toBeEnabled();
    expect(await page.getByText(/^Ziehung /).textContent()).not.toBe(seed);
    await page.reload();
    await expect(page.getByLabel('Schwierigkeit des Spielfelds')).toHaveValue('4');
    await page.getByRole('button', { name: 'Spiel starten', exact: true }).click();
    await expect(page.getByText('Die Falken: 0 Punkte')).toBeAttached();
  });
}
