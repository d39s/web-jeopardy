import {
  CATEGORY_COUNT,
  CLUE_LEVELS,
  CLUES_PER_CATEGORY,
  DIFFICULTY_BANDS,
  POINT_STEPS,
} from './types';
import type {
  Category,
  Clue,
  ClueLevel,
  Difficulty,
  GameDefinition,
  PoolClue,
  PoolRubric,
  QuestionPool,
} from './types';
import { createRandom, formatSeed } from './random';
import type { Random } from './random';

/**
 * Ziehung eines Spielfelds aus einem Fragenpool.
 *
 * Aus dem Vorrat einer Themenkategorie entsteht bei jedem Start ein eigenes
 * 5x5-Brett: fünf Rubriken als Spalten, je fünf Fragen in aufsteigender Härte.
 * Dieselbe Ziehungsnummer ergibt dabei immer dasselbe Brett – nur so lässt sich
 * eine Partie über einen Link teilen.
 */

export interface DrawRequest {
  pool: QuestionPool;
  /** Reglerstellung 1 bis 5; bestimmt über `DIFFICULTY_BANDS` die Zeilen. */
  level: Difficulty;
  seed: number;
}

/**
 * Warum aus einem Pool kein Brett zu ziehen war: Es kamen zu wenige Rubriken
 * zusammen, die eine volle Spalte füllen können.
 */
export interface DrawProblem {
  kind: 'notEnoughRubrics';
  /** Wie viele Spalten sich bauen ließen. */
  usable: number;
  required: number;
}

export type DrawResult =
  { ok: true; definition: GameDefinition } | { ok: false; problem: DrawProblem };

/** Wie viele Fragen der Stufe das Band verlangt. */
function demandPerLevel(band: readonly ClueLevel[]): Map<ClueLevel, number> {
  const demand = new Map<ClueLevel, number>();
  for (const level of band) demand.set(level, (demand.get(level) ?? 0) + 1);
  return demand;
}

/**
 * Ob die Rubrik das Band ohne Ausweichen bedienen kann. Solche Rubriken haben
 * beim Ziehen Vorrang: Erst wenn es zu wenige davon gibt, kommen Rubriken zum
 * Zug, für die auf benachbarte Stufen ausgewichen werden muss.
 */
function servesBand(rubric: PoolRubric, band: readonly ClueLevel[]): boolean {
  for (const [level, count] of demandPerLevel(band)) {
    const available = rubric.clues.filter((clue) => clue.level === level).length;
    if (available < count) return false;
  }
  return true;
}

/**
 * Eine noch unbenutzte Frage möglichst nah an der gewünschten Stufe. Der Radius
 * wächst erst, wenn auf der gewünschten Stufe nichts mehr frei ist – ein Brett
 * kommt so auch aus einem lückenhaften Pool zustande, nur eben unschärfer.
 */
function pickNearLevel(
  clues: readonly PoolClue[],
  wanted: ClueLevel,
  used: Set<string>,
  random: Random,
): PoolClue | null {
  for (let radius = 0; radius < CLUE_LEVELS.length; radius++) {
    const candidates = clues.filter(
      (clue) => !used.has(clue.id) && Math.abs(clue.level - wanted) === radius,
    );
    if (candidates.length > 0) return candidates[random.int(candidates.length)] ?? null;
  }
  return null;
}

/** Fünf Fragen einer Rubrik in Zeilenreihenfolge; null, wenn der Vorrat nicht reicht. */
function pickClues(
  rubric: PoolRubric,
  band: readonly ClueLevel[],
  random: Random,
): PoolClue[] | null {
  const used = new Set<string>();
  const picked: PoolClue[] = [];

  for (const wanted of band) {
    const clue = pickNearLevel(rubric.clues, wanted, used, random);
    if (clue === null) return null;
    used.add(clue.id);
    picked.push(clue);
  }
  return picked;
}

/**
 * Aus einer Frage des Vorrats wird eine Karte. Die Punkte kommen aus der Zeile –
 * Band und Punktestufen sind beide genau `CLUES_PER_CATEGORY` lang, deshalb
 * trifft der Index immer.
 */
function toClue(clue: PoolClue, row: number): Clue {
  return {
    id: clue.id,
    points: POINT_STEPS[row] as number,
    question: clue.question,
    answer: clue.answer,
    ...(clue.note === undefined ? {} : { note: clue.note }),
  };
}

/**
 * Rubriken, die das Band der Stufe ohne Ausweichen bedienen. Ihre Anzahl sagt,
 * wie viel Abwechslung ein Pool bei dieser Reglerstellung hergibt: Bei genau
 * fünf steht jedes Spiel dieselbe Spaltenauswahl auf dem Brett.
 */
export function fittingRubrics(pool: QuestionPool, level: Difficulty): PoolRubric[] {
  const band = DIFFICULTY_BANDS[level];
  return pool.rubrics.filter(
    (rubric) => rubric.clues.length >= CLUES_PER_CATEGORY && servesBand(rubric, band),
  );
}

export function drawBoard({ pool, level, seed }: DrawRequest): DrawResult {
  const band = DIFFICULTY_BANDS[level];
  const random = createRandom(seed);

  // Erst mischen, dann nach Eignung ordnen: Unter gleich geeigneten Rubriken
  // entscheidet der Zufall, die Eignung schlägt ihn aber immer.
  const shuffled = random.shuffle(pool.rubrics);
  const fitting = shuffled.filter((rubric) => servesBand(rubric, band));
  const rest = shuffled.filter((rubric) => !servesBand(rubric, band));

  const categories: Category[] = [];
  for (const rubric of [...fitting, ...rest]) {
    if (categories.length === CATEGORY_COUNT) break;

    // Eine Rubrik mit zu wenigen Fragen füllt keine Spalte. Dann kommt die
    // nächste an die Reihe, statt ein halbes Brett zu liefern.
    const picked = pickClues(rubric, band, random);
    if (picked === null) continue;

    categories.push({
      id: rubric.id,
      name: rubric.name,
      ...(rubric.color === undefined ? {} : { color: rubric.color }),
      clues: picked.map(toClue),
    });
  }

  if (categories.length < CATEGORY_COUNT) {
    return {
      ok: false,
      problem: {
        kind: 'notEnoughRubrics',
        usable: categories.length,
        required: CATEGORY_COUNT,
      },
    };
  }

  return {
    ok: true,
    definition: {
      schemaVersion: 1,
      id: `${pool.id}-${level}-${formatSeed(seed)}`,
      title: pool.title,
      category: pool.id,
      difficulty: level,
      ...(pool.description === undefined ? {} : { description: pool.description }),
      ...(pool.author === undefined ? {} : { author: pool.author }),
      ...(pool.locale === undefined ? {} : { locale: pool.locale }),
      pointSteps: [...POINT_STEPS],
      categories,
    },
  };
}
