import { z } from 'zod';
import { CATEGORY_COLORS } from './colors';
import { MAX_TEAM_NAME_LENGTH } from './teams';
import {
  CATEGORY_COUNT,
  CLUES_PER_CATEGORY,
  MAX_CLUE_LEVEL,
  MAX_DIFFICULTY,
  WRONG_PENALTIES,
} from './types';
import type { GameDefinition, GameState, QuestionPool, TopicIndex } from './types';

const idSchema = z
  .string()
  .trim()
  .min(1)
  .max(64)
  .regex(/^[a-z0-9][a-z0-9-]*$/i, 'Nur Buchstaben, Ziffern und Bindestriche erlaubt.');

export const clueSchema = z.strictObject({
  id: idSchema,
  points: z.number().int().positive(),
  question: z.string().trim().min(1).max(500),
  answer: z.string().trim().min(1).max(500),
  note: z.string().trim().max(500).optional(),
});

export const categorySchema = z.strictObject({
  id: idSchema,
  name: z.string().trim().min(1).max(40),
  color: z.enum(CATEGORY_COLORS).optional(),
  clues: z
    .array(clueSchema)
    .length(CLUES_PER_CATEGORY, `Jede Kategorie braucht genau ${CLUES_PER_CATEGORY} Fragen.`),
});

/** Reglerstellung eines Fragensets. */
const difficultyMessage = `Schwierigkeit liegt zwischen 1 und ${MAX_DIFFICULTY}.`;

const difficultySchema = z
  .number()
  .int()
  .min(1, difficultyMessage)
  .max(MAX_DIFFICULTY, difficultyMessage);

/** Stufe einer einzelnen Frage – breitere Skala als der Regler, siehe types.ts. */
const clueLevelMessage = `Stufe liegt zwischen 1 und ${MAX_CLUE_LEVEL}.`;

const clueLevelSchema = z
  .number()
  .int()
  .min(1, clueLevelMessage)
  .max(MAX_CLUE_LEVEL, clueLevelMessage);

const gameDefinitionShape = z.strictObject({
  schemaVersion: z.literal(1),
  id: idSchema,
  title: z.string().trim().min(1).max(80),
  category: idSchema,
  difficulty: difficultySchema,
  description: z.string().trim().max(300).optional(),
  author: z.string().trim().max(80).optional(),
  locale: z.string().trim().max(20).optional(),
  pointSteps: z
    .array(z.number().int().positive())
    .length(CLUES_PER_CATEGORY, `Es werden genau ${CLUES_PER_CATEGORY} Punktestufen erwartet.`),
  categories: z
    .array(categorySchema)
    .length(CATEGORY_COUNT, `Das Spielfeld braucht genau ${CATEGORY_COUNT} Kategorien.`),
});

export const gameDefinitionSchema = gameDefinitionShape.superRefine((definition, ctx) => {
  const { pointSteps, categories } = definition;

  pointSteps.forEach((points, index) => {
    const previous = pointSteps[index - 1];
    if (previous !== undefined && points <= previous) {
      ctx.addIssue({
        code: 'custom',
        path: ['pointSteps', index],
        message: 'Punktestufen müssen aufsteigend sein.',
      });
    }
  });

  const seenIds = new Set<string>();
  const register = (id: string, path: (string | number)[]) => {
    if (seenIds.has(id)) {
      ctx.addIssue({ code: 'custom', path, message: `Die ID "${id}" wird mehrfach verwendet.` });
    }
    seenIds.add(id);
  };

  categories.forEach((category, categoryIndex) => {
    register(category.id, ['categories', categoryIndex, 'id']);

    category.clues.forEach((clue, clueIndex) => {
      register(clue.id, ['categories', categoryIndex, 'clues', clueIndex, 'id']);

      const expected = pointSteps[clueIndex];
      if (expected !== undefined && clue.points !== expected) {
        ctx.addIssue({
          code: 'custom',
          path: ['categories', categoryIndex, 'clues', clueIndex, 'points'],
          message: `Erwartet werden ${expected} Punkte (Position ${clueIndex + 1} der Punktestufen).`,
        });
      }
    });
  });
});

const fileSchema = z
  .string()
  .trim()
  .min(1)
  .regex(/^[a-z0-9][a-z0-9-]*\.json$/i, 'Dateiname muss auf .json enden.');

/**
 * Version 2: Der Index führt nur noch die Themenkategorien, jede mit ihrem
 * Fragenpool. Fertige Fragensets stehen nicht mehr darin – die Schwierigkeit
 * wählt der Regler, das Brett wird beim Start gezogen.
 */
const topicIndexShape = z.strictObject({
  schemaVersion: z.literal(2),
  categories: z
    .array(
      z.strictObject({
        id: idSchema,
        title: z.string().trim().min(1).max(80),
        description: z.string().trim().max(300).optional(),
        file: fileSchema,
      }),
    )
    .min(1, 'Es braucht mindestens eine Themenkategorie.'),
});

export const topicIndexSchema = topicIndexShape.superRefine((index, ctx) => {
  index.categories.forEach((category, position) => {
    if (index.categories.findIndex((other) => other.id === category.id) !== position) {
      ctx.addIssue({
        code: 'custom',
        path: ['categories', position, 'id'],
        message: `Die Kategorie "${category.id}" ist mehrfach eingetragen.`,
      });
    }
  });
});

// ---------------------------------------------------------------------------
// Fragenpool
// ---------------------------------------------------------------------------

export const poolClueSchema = z.strictObject({
  id: idSchema,
  level: clueLevelSchema,
  question: z.string().trim().min(1).max(500),
  answer: z.string().trim().min(1).max(500),
  note: z.string().trim().max(500).optional(),
});

export const poolRubricSchema = z.strictObject({
  id: idSchema,
  name: z.string().trim().min(1).max(40),
  color: z.enum(CATEGORY_COLORS).optional(),
  clues: z
    .array(poolClueSchema)
    .min(CLUES_PER_CATEGORY, `Eine Rubrik braucht mindestens ${CLUES_PER_CATEGORY} Fragen.`),
});

const questionPoolShape = z.strictObject({
  schemaVersion: z.literal(1),
  id: idSchema,
  title: z.string().trim().min(1).max(80),
  description: z.string().trim().max(300).optional(),
  author: z.string().trim().max(80).optional(),
  locale: z.string().trim().max(20).optional(),
  rubrics: z
    .array(poolRubricSchema)
    .min(CATEGORY_COUNT, `Ein Pool braucht mindestens ${CATEGORY_COUNT} Rubriken.`),
});

export const questionPoolSchema = questionPoolShape.superRefine((pool, ctx) => {
  // Rubriken werden zu Spalten, Fragen zu Karten – im gezogenen Brett stehen
  // beide IDs im selben Namensraum und müssen sich deshalb hier unterscheiden.
  const seenIds = new Set<string>();
  const register = (id: string, path: (string | number)[]) => {
    if (seenIds.has(id)) {
      ctx.addIssue({ code: 'custom', path, message: `Die ID "${id}" wird mehrfach verwendet.` });
    }
    seenIds.add(id);
  };

  const seenQuestions = new Map<string, string>();
  const seenAnswers = new Map<string, string>();

  /** Vergleicht tolerant: Groß- und Kleinschreibung und Zeichensetzung zählen nicht. */
  const normalize = (value: string) =>
    value
      .toLowerCase()
      .replace(/[^\p{L}\p{N}]+/gu, ' ')
      .trim();

  pool.rubrics.forEach((rubric, rubricIndex) => {
    register(rubric.id, ['rubrics', rubricIndex, 'id']);

    rubric.clues.forEach((clue, clueIndex) => {
      register(clue.id, ['rubrics', rubricIndex, 'clues', clueIndex, 'id']);

      // Dieselbe Frage zweimal im Vorrat hieße: irgendwann steht sie doppelt
      // auf dem Brett. Verglichen wird tolerant, damit Tippvarianten auffallen.
      const questionKey = normalize(clue.question);
      const sameQuestion = seenQuestions.get(questionKey);
      if (sameQuestion !== undefined) {
        ctx.addIssue({
          code: 'custom',
          path: ['rubrics', rubricIndex, 'clues', clueIndex, 'question'],
          message: `Gleiche Frage wie "${sameQuestion}".`,
        });
      }
      seenQuestions.set(questionKey, clue.id);

      // Auch dieselbe Lösung darf im Pool nur einmal vorkommen: Sonst kann
      // dieselbe Antwort zweimal auf einem Brett stehen – in zwei Spalten oder
      // sogar in zwei Zeilen derselben Spalte.
      const answerKey = normalize(clue.answer);
      const sameAnswer = seenAnswers.get(answerKey);
      if (sameAnswer !== undefined) {
        ctx.addIssue({
          code: 'custom',
          path: ['rubrics', rubricIndex, 'clues', clueIndex, 'answer'],
          message: `Gleiche Lösung wie "${sameAnswer}".`,
        });
      }
      seenAnswers.set(answerKey, clue.id);
    });
  });
});

export const teamSchema = z.strictObject({
  id: idSchema,
  name: z.string().trim().min(1).max(MAX_TEAM_NAME_LENGTH),
});

export const scoreEventSchema = z.strictObject({
  id: z.string().min(1),
  clueId: idSchema,
  teamId: idSchema,
  outcome: z.enum(['correct', 'wrong']),
  delta: z.number().int(),
  viaVeto: z.boolean(),
  at: z.number().int().nonnegative(),
});

/** Schema des laufenden Spielstands – Grundlage für das Wiederherstellen aus dem Speicher. */
export const gameStateSchema = z.strictObject({
  phase: z.enum(['setup', 'playing', 'finished']),
  definition: gameDefinitionSchema.nullable(),
  teams: z.array(teamSchema),
  events: z.array(scoreEventSchema),
  openClueId: z.string().min(1).nullable(),
  answerRevealed: z.boolean(),
  timerSeconds: z.number().int().positive().nullable(),
  vetoSeconds: z.number().int().positive().nullable(),
  startingTeamIndex: z.number().int().nonnegative(),
  activeTeamId: idSchema.nullable(),
  answeringTeamIds: z.array(idSchema),
  timerEndsAt: z.number().int().nonnegative().nullable(),
  wrongPenalty: z.enum(WRONG_PENALTIES),
});

// ---------------------------------------------------------------------------
// Validierung mit feldgenauen, anzeigbaren Meldungen
// ---------------------------------------------------------------------------

export interface ValidationIssue {
  /** Punktnotation des betroffenen Feldes, z. B. "categories.2.clues.4.answer". */
  path: string;
  message: string;
}

export type ValidationResult<T> = { ok: true; data: T } | { ok: false; issues: ValidationIssue[] };

function toIssues(error: z.ZodError): ValidationIssue[] {
  return error.issues.map((issue) => ({
    path: issue.path.join('.') || '(Wurzel)',
    message: issue.message,
  }));
}

export function validateGameDefinition(input: unknown): ValidationResult<GameDefinition> {
  const result = gameDefinitionSchema.safeParse(input);
  return result.success
    ? { ok: true, data: result.data as GameDefinition }
    : { ok: false, issues: toIssues(result.error) };
}

export function validateQuestionPool(input: unknown): ValidationResult<QuestionPool> {
  const result = questionPoolSchema.safeParse(input);
  return result.success
    ? { ok: true, data: result.data as QuestionPool }
    : { ok: false, issues: toIssues(result.error) };
}

export function validateTopicIndex(input: unknown): ValidationResult<TopicIndex> {
  const result = topicIndexSchema.safeParse(input);
  return result.success
    ? { ok: true, data: result.data as TopicIndex }
    : { ok: false, issues: toIssues(result.error) };
}

export function validateGameState(input: unknown): ValidationResult<GameState> {
  const result = gameStateSchema.safeParse(input);
  return result.success
    ? { ok: true, data: result.data as GameState }
    : { ok: false, issues: toIssues(result.error) };
}

/** Einzeilige Darstellung je Fehler, z. B. für CLI-Ausgabe und Fehlerdialoge. */
export function formatIssues(issues: ValidationIssue[]): string[] {
  return issues.map((issue) => `${issue.path}: ${issue.message}`);
}
