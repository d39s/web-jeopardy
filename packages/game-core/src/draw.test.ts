import { describe, expect, it } from 'vitest';
import { drawBoard, fittingRubrics } from './draw';
import { samplePool } from './fixtures';
import { validateGameDefinition } from './schema';
import { CATEGORY_COUNT, CLUES_PER_CATEGORY, DIFFICULTY_BANDS, POINT_STEPS } from './types';
import type { Difficulty, GameDefinition, QuestionPool } from './types';

/** Stufe einer gezogenen Karte, über ihre ID im Pool nachgeschlagen. */
function levelOf(pool: QuestionPool, clueId: string): Difficulty | undefined {
  for (const rubric of pool.rubrics) {
    const clue = rubric.clues.find((entry) => entry.id === clueId);
    if (clue) return clue.level;
  }
  return undefined;
}

function draw(level: Difficulty, seed: number, pool = samplePool): GameDefinition {
  const result = drawBoard({ pool, level, seed });
  if (!result.ok) throw new Error(`Ziehung fehlgeschlagen: ${result.problem.kind}`);
  return result.definition;
}

describe('brett ziehen', () => {
  it('liefert ein gültiges spielfeld', () => {
    const definition = draw(3, 4711);

    expect(validateGameDefinition(definition).ok).toBe(true);
    expect(definition.categories).toHaveLength(CATEGORY_COUNT);
    for (const category of definition.categories) {
      expect(category.clues).toHaveLength(CLUES_PER_CATEGORY);
      expect(category.clues.map((clue) => clue.points)).toEqual([...POINT_STEPS]);
    }
  });

  it('ergibt zur selben ziehungsnummer dasselbe brett', () => {
    expect(draw(3, 4711)).toEqual(draw(3, 4711));
  });

  it('ergibt zu einer anderen ziehungsnummer ein anderes brett', () => {
    const first = draw(3, 4711);
    const second = draw(3, 1234);

    const ids = (definition: GameDefinition) =>
      definition.categories.flatMap((category) => category.clues.map((clue) => clue.id));
    expect(ids(first)).not.toEqual(ids(second));
  });

  it('verwendet keine frage zweimal', () => {
    const definition = draw(3, 99);
    const ids = definition.categories.flatMap((category) => category.clues.map((clue) => clue.id));

    expect(new Set(ids).size).toBe(ids.length);
  });

  it('setzt in jeder zeile die stufe aus dem band des reglers', () => {
    for (const level of [1, 2, 3, 4, 5] as const) {
      const definition = draw(level, 2024);

      for (const category of definition.categories) {
        const levels = category.clues.map((clue) => levelOf(samplePool, clue.id));
        expect(levels).toEqual([...DIFFICULTY_BANDS[level]]);
      }
    }
  });

  it('trägt die angaben des pools in das gezogene brett', () => {
    const definition = draw(4, 8);

    expect(definition.category).toBe(samplePool.id);
    expect(definition.title).toBe(samplePool.title);
    expect(definition.difficulty).toBe(4);
    expect(definition.id).toMatch(/^testpool-4-[0-9a-z]+$/);
  });

  it('bevorzugt rubriken, die das band ohne ausweichen bedienen', () => {
    // Fünf lückenlose Rubriken und eine, die nur leichte Fragen kennt: Die
    // leichte darf bei hoher Reglerstellung nicht auf das Brett kommen.
    const pool: QuestionPool = {
      ...samplePool,
      rubrics: [
        ...samplePool.rubrics.slice(0, 5),
        {
          id: 'nur-leicht',
          name: 'Nur leicht',
          clues: Array.from({ length: 6 }, (_, index) => ({
            id: `nur-leicht-${index}`,
            level: 1 as Difficulty,
            question: `Leichte Frage ${index}?`,
            answer: `Antwort ${index}`,
          })),
        },
      ],
    };

    for (let seed = 0; seed < 25; seed++) {
      const definition = draw(5, seed, pool);
      expect(definition.categories.map((category) => category.id)).not.toContain('nur-leicht');
    }
  });

  it('weicht auf benachbarte stufen aus, wenn der vorrat lückenhaft ist', () => {
    // Alle Rubriken kennen nur Stufe 1 – ein Brett muss trotzdem entstehen,
    // sonst bliebe ein noch dünner Pool unspielbar.
    const pool: QuestionPool = {
      ...samplePool,
      rubrics: samplePool.rubrics.slice(0, 5).map((rubric) => ({
        ...rubric,
        clues: rubric.clues
          .filter((clue) => clue.level === 1)
          .concat(
            Array.from({ length: 4 }, (_, index) => ({
              id: `${rubric.id}-extra-${index}`,
              level: 1 as Difficulty,
              question: `${rubric.name}: Zusatzfrage ${index}?`,
              answer: `Antwort ${index}`,
            })),
          ),
      })),
    };

    const result = drawBoard({ pool, level: 5, seed: 3 });
    expect(result.ok).toBe(true);
  });

  it('meldet zu wenige rubriken, statt ein halbes brett zu liefern', () => {
    const pool: QuestionPool = { ...samplePool, rubrics: samplePool.rubrics.slice(0, 4) };
    const result = drawBoard({ pool, level: 3, seed: 1 });

    expect(result).toEqual({
      ok: false,
      problem: { kind: 'notEnoughRubrics', usable: 4, required: CATEGORY_COUNT },
    });
  });

  it('meldet zu wenige spalten, wenn die rubriken zu dünn sind', () => {
    // Sechs Rubriken, aber jede mit nur vier Fragen: Keine füllt eine Spalte.
    const pool: QuestionPool = {
      ...samplePool,
      rubrics: samplePool.rubrics.map((rubric) => ({ ...rubric, clues: rubric.clues.slice(0, 4) })),
    };

    expect(drawBoard({ pool, level: 3, seed: 1 })).toEqual({
      ok: false,
      problem: { kind: 'notEnoughRubrics', usable: 0, required: CATEGORY_COUNT },
    });
  });

  it('übergeht rubriken mit zu wenigen fragen', () => {
    const pool: QuestionPool = {
      ...samplePool,
      rubrics: [
        ...samplePool.rubrics.slice(0, 5),
        { id: 'zu-duenn', name: 'Zu dünn', clues: samplePool.rubrics[0]!.clues.slice(0, 3) },
      ],
    };

    for (let seed = 0; seed < 20; seed++) {
      const definition = draw(3, seed, pool);
      expect(definition.categories.map((category) => category.id)).not.toContain('zu-duenn');
    }
  });
});

describe('passende rubriken zählen', () => {
  it('nennt alle rubriken, wenn der vorrat lückenlos ist', () => {
    for (const level of [1, 2, 3, 4, 5] as const) {
      expect(fittingRubrics(samplePool, level)).toHaveLength(samplePool.rubrics.length);
    }
  });

  it('lässt rubriken aus, denen die stufen des bandes fehlen', () => {
    const pool: QuestionPool = {
      ...samplePool,
      rubrics: [
        ...samplePool.rubrics,
        {
          id: 'nur-leicht',
          name: 'Nur leicht',
          clues: Array.from({ length: 6 }, (_, index) => ({
            id: `nur-leicht-${index}`,
            level: 1 as Difficulty,
            question: `Leichte Frage ${index}?`,
            answer: `Antwort ${index}`,
          })),
        },
      ],
    };

    const ids = (level: Difficulty) => fittingRubrics(pool, level).map((rubric) => rubric.id);

    // Auf Stufe 1 verlangt das Band 1 · 1 · 2 · 2 · 3 – dafür reicht sie nicht.
    expect(ids(1)).not.toContain('nur-leicht');
    expect(ids(5)).not.toContain('nur-leicht');
  });

  it('lässt rubriken aus, die keine volle spalte füllen', () => {
    const pool: QuestionPool = {
      ...samplePool,
      rubrics: [
        ...samplePool.rubrics,
        { id: 'zu-duenn', name: 'Zu dünn', clues: samplePool.rubrics[0]!.clues.slice(0, 3) },
      ],
    };

    expect(fittingRubrics(pool, 3).map((rubric) => rubric.id)).not.toContain('zu-duenn');
  });
});
