import { samplePool } from '@jeopardy/game-core';
import type { QuestionPool, TopicIndex } from '@jeopardy/game-core';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, vi } from 'vitest';

/** Zwei Kategorien: genug, um auch den Wechsel zwischen ihnen zu prüfen. */
export const testIndex: TopicIndex = {
  schemaVersion: 2,
  categories: [
    {
      id: 'testkategorie',
      title: 'Testkategorie',
      description: 'Zum Ausprobieren.',
      file: 'pool-testkategorie.json',
    },
    {
      id: 'zweite',
      title: 'Zweite Kategorie',
      description: 'Noch etwas zum Ausprobieren.',
      file: 'pool-zweite.json',
    },
  ],
};

/** Der Vorrat trägt die ID seiner Kategorie – sonst passt er nicht zum Index. */
function poolFor(id: string, title: string): QuestionPool {
  return { ...samplePool, id, title };
}

export const testPool = poolFor('testkategorie', 'Testkategorie');

const poolsByFile = new Map<string, QuestionPool>([
  ['pool-testkategorie.json', testPool],
  ['pool-zweite.json', poolFor('zweite', 'Zweite Kategorie')],
]);

/** Beantwortet die Index- und Vorrat-Anfragen der Startseite. */
export function mockContentRequests(): void {
  vi.stubGlobal(
    'fetch',
    vi.fn((url: string) =>
      Promise.resolve({
        ok: true,
        status: 200,
        json: () =>
          Promise.resolve(
            url.endsWith('index.json')
              ? testIndex
              : (poolsByFile.get(url.slice(url.lastIndexOf('/') + 1)) ?? testPool),
          ),
      } as Response),
    ),
  );
}

/**
 * Erste Stufe der Auswahl. Danach lädt der Vorrat nach – erst wenn er da ist,
 * lässt sich starten, deshalb wartet der Helfer auf den freigegebenen Knopf.
 */
export async function chooseCategory(title = 'Testkategorie'): Promise<void> {
  await userEvent.click(await screen.findByRole('button', { name: new RegExp(title) }));
  await waitFor(() => expect(screen.getByRole('button', { name: 'Spiel starten' })).toBeEnabled());
}

/** Ziehungsnummer, wie sie auf der Seite steht – sie steckt auch im Link. */
export function drawNumber(): string {
  return (screen.getByText(/^Ziehung /).textContent ?? '').replace('Ziehung ', '');
}

/** Alle Frage-IDs eines gezogenen Bretts in Spielfeld-Reihenfolge. */
export function clueIdsOf(definition: { categories: { clues: { id: string }[] }[] }): string[] {
  return definition.categories.flatMap((category) => category.clues.map((clue) => clue.id));
}
