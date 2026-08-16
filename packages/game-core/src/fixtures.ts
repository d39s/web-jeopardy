import type { Category, GameDefinition } from './types';

const POINT_STEPS = [100, 200, 300, 400, 500];

function makeCategory(id: string, name: string, entries: [string, string][]): Category {
  return {
    id,
    name,
    clues: entries.map(([question, answer], index) => ({
      id: `${id}-${POINT_STEPS[index]}`,
      points: POINT_STEPS[index] as number,
      question,
      answer,
    })),
  };
}

/**
 * Vollständiges, gültiges 5x5-Fragenset für Tests und für die Entwicklung von
 * Oberflächen, solange der Content-Loader noch nicht verdrahtet ist.
 */
export const sampleDefinition: GameDefinition = {
  schemaVersion: 1,
  id: 'testthema',
  title: 'Testthema',
  description: 'Fragenset für Tests und Entwicklung.',
  author: 'Projektteam',
  locale: 'de-DE',
  pointSteps: POINT_STEPS,
  categories: [
    makeCategory('wissenschaft', 'Wissenschaft', [
      ['Welches Gas atmen Pflanzen bei der Fotosynthese auf?', 'Kohlenstoffdioxid'],
      ['Wie viele Planeten hat unser Sonnensystem?', 'Acht'],
      ['Welches Element hat das chemische Symbol Fe?', 'Eisen'],
      ['Wie heißt die Kraft, die Körper zum Erdmittelpunkt zieht?', 'Gravitation'],
      ['Wer stellte die Relativitätstheorie auf?', 'Albert Einstein'],
    ]),
    makeCategory('geografie', 'Geografie', [
      ['Wie heißt die Hauptstadt von Frankreich?', 'Paris'],
      ['Welcher Fluss fließt durch Köln?', 'Der Rhein'],
      ['Welches ist das flächengrößte Land der Erde?', 'Russland'],
      ['An welches Meer grenzt Hamburg über die Elbe?', 'An die Nordsee'],
      ['Wie heißt der höchste Berg Afrikas?', 'Kilimandscharo'],
    ]),
    makeCategory('musik', 'Musik', [
      ['Wie viele Saiten hat eine klassische Gitarre?', 'Sechs'],
      ['Wer komponierte die Zauberflöte?', 'Wolfgang Amadeus Mozart'],
      ['Wie heißt das Tempo-Maß in der Musik?', 'Beats per minute'],
      ['Aus welcher Stadt stammen die Beatles?', 'Liverpool'],
      ['Wie viele Töne hat eine Dur-Tonleiter ohne Oktave?', 'Sieben'],
    ]),
    makeCategory('film', 'Film', [
      ['Wie heißt der Zauberer in "Der Herr der Ringe"?', 'Gandalf'],
      ['Welches Studio steht für Micky Maus?', 'Disney'],
      ['In welcher Stadt spielt "Casablanca"?', 'In Casablanca'],
      ['Wie heißt der Preis der US-Filmakademie?', 'Oscar'],
      ['Wer führte Regie bei "Jurassic Park"?', 'Steven Spielberg'],
    ]),
    makeCategory('sport', 'Sport', [
      ['Wie viele Spieler stehen bei Fußball je Team auf dem Feld?', 'Elf'],
      ['Alle wie viele Jahre finden Olympische Sommerspiele statt?', 'Alle vier Jahre'],
      ['Wie heißt der Sprung über eine Latte in der Leichtathletik?', 'Hochsprung'],
      ['Wie viele Ringe hat das olympische Symbol?', 'Fünf'],
      ['In welcher Sportart gibt es den Begriff "Ass"?', 'Tennis'],
    ]),
  ],
};

/** Bewusst fehlerhafte Fragensets für Negativtests der Validierung. */
export const invalidDefinitionSamples: { name: string; value: unknown }[] = [
  {
    name: 'nur vier kategorien',
    value: { ...sampleDefinition, categories: sampleDefinition.categories.slice(0, 4) },
  },
  {
    name: 'kategorie mit vier fragen',
    value: {
      ...sampleDefinition,
      categories: sampleDefinition.categories.map((category, index) =>
        index === 0 ? { ...category, clues: category.clues.slice(0, 4) } : category,
      ),
    },
  },
  {
    name: 'punktzahl passt nicht zur punktestufe',
    value: {
      ...sampleDefinition,
      categories: sampleDefinition.categories.map((category, index) =>
        index === 0
          ? {
              ...category,
              clues: category.clues.map((clue, clueIndex) =>
                clueIndex === 0 ? { ...clue, points: 150 } : clue,
              ),
            }
          : category,
      ),
    },
  },
  {
    name: 'farbe außerhalb der palette',
    value: {
      ...sampleDefinition,
      categories: sampleDefinition.categories.map((category, index) =>
        index === 0 ? { ...category, color: '#123456' } : category,
      ),
    },
  },
  {
    name: 'unbekanntes feld',
    value: { ...sampleDefinition, unbekanntesFeld: true },
  },
  {
    name: 'doppelte frage-id',
    value: {
      ...sampleDefinition,
      categories: sampleDefinition.categories.map((category, index) =>
        index === 1
          ? {
              ...category,
              clues: category.clues.map((clue, clueIndex) =>
                clueIndex === 0 ? { ...clue, id: 'wissenschaft-100' } : clue,
              ),
            }
          : category,
      ),
    },
  },
  {
    name: 'leere antwort',
    value: {
      ...sampleDefinition,
      categories: sampleDefinition.categories.map((category, index) =>
        index === 0
          ? {
              ...category,
              clues: category.clues.map((clue, clueIndex) =>
                clueIndex === 0 ? { ...clue, answer: '   ' } : clue,
              ),
            }
          : category,
      ),
    },
  },
  { name: 'falsche schema-version', value: { ...sampleDefinition, schemaVersion: 2 } },
];

/** Alle Frage-IDs des Beispielsets in Spielfeld-Reihenfolge. */
export const sampleClueIds = sampleDefinition.categories.flatMap((category) =>
  category.clues.map((clue) => clue.id),
);
