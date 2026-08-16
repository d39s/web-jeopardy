import { z } from 'zod';
import { CATEGORY_COLORS } from './colors';
import { CATEGORY_COUNT, CLUES_PER_CATEGORY } from './types';
import type { GameDefinition, TopicIndex } from './types';

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

const gameDefinitionShape = z.strictObject({
  schemaVersion: z.literal(1),
  id: idSchema,
  title: z.string().trim().min(1).max(80),
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

export const topicIndexSchema = z.strictObject({
  schemaVersion: z.literal(1),
  topics: z.array(
    z.strictObject({
      id: idSchema,
      title: z.string().trim().min(1).max(80),
      description: z.string().trim().max(300).optional(),
      file: z
        .string()
        .trim()
        .min(1)
        .regex(/^[a-z0-9][a-z0-9-]*\.json$/i, 'Dateiname muss auf .json enden.'),
    }),
  ),
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

export function validateTopicIndex(input: unknown): ValidationResult<TopicIndex> {
  const result = topicIndexSchema.safeParse(input);
  return result.success
    ? { ok: true, data: result.data as TopicIndex }
    : { ok: false, issues: toIssues(result.error) };
}

/** Einzeilige Darstellung je Fehler, z. B. für CLI-Ausgabe und Fehlerdialoge. */
export function formatIssues(issues: ValidationIssue[]): string[] {
  return issues.map((issue) => `${issue.path}: ${issue.message}`);
}
