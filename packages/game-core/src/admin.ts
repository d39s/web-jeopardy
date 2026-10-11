import { z } from 'zod';
import { questionReportSourceSchema } from './report';
import { idSchema } from './schema';
import { MAX_CLUE_LEVEL } from './types';

// Verträge des Admin-Backends (/api/v1/admin). API und Oberfläche prüfen dieselben Schemas.

const levelSchema = z.number().int().min(1).max(MAX_CLUE_LEVEL);
const textSchema = z.string().trim().min(1).max(500);
const noteSchema = z.string().trim().max(500);
const versionSchema = z.string().regex(/^[a-f0-9]{64}$/);

export const adminIdentitySchema = z.object({
  user: z.string(),
  groups: z.array(z.string()),
});
export type AdminIdentity = z.infer<typeof adminIdentitySchema>;

export const adminTopicSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().optional(),
  questionCount: z.number().int().nonnegative(),
  rubrics: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      color: z.string().optional(),
      questionCount: z.number().int().nonnegative(),
    }),
  ),
});
export type AdminTopic = z.infer<typeof adminTopicSchema>;

export const adminQuestionSchema = z.object({
  topicId: z.string(),
  rubricId: z.string(),
  rubricName: z.string(),
  id: z.string(),
  question: z.string(),
  answer: z.string(),
  note: z.string().optional(),
  /** Redaktionelle Ausgangsstufe. */
  sourceLevel: levelSchema,
  /** Aktuelle Spielstufe nach Bewertungen. */
  level: levelSchema,
  score: z.number().min(1).max(MAX_CLUE_LEVEL),
  votes: z.object({
    fits: z.number().int().nonnegative(),
    tooHard: z.number().int().nonnegative(),
    tooEasy: z.number().int().nonnegative(),
    unsure: z.number().int().nonnegative(),
  }),
  /** Offene Meldungen; solange es welche gibt, kommt die Frage in keinem neuen Spiel vor. */
  openReports: z.number().int().nonnegative(),
  /** Inhaltsstand für Änderungen: verhindert das stille Überschreiben fremder Bearbeitungen. */
  version: versionSchema,
});
export type AdminQuestion = z.infer<typeof adminQuestionSchema>;

export const adminQuestionListSchema = z.object({
  total: z.number().int().nonnegative(),
  questions: z.array(adminQuestionSchema),
});
export type AdminQuestionList = z.infer<typeof adminQuestionListSchema>;

export const adminQuestionCreateSchema = z.strictObject({
  rubricId: idSchema,
  /** Ohne Angabe vergibt die API eine neue ID. */
  id: idSchema.optional(),
  level: levelSchema,
  question: textSchema,
  answer: textSchema,
  note: noteSchema.optional(),
});
export type AdminQuestionCreate = z.infer<typeof adminQuestionCreateSchema>;

export const adminQuestionUpdateSchema = z.strictObject({
  version: versionSchema,
  rubricId: idSchema,
  level: levelSchema,
  question: textSchema,
  answer: textSchema,
  /** Leer entfernt die Notiz. */
  note: noteSchema,
  /** Score und Zähler auf die Ausgangsstufe zurücksetzen; bei geänderter Stufe immer. */
  resetRating: z.boolean(),
});
export type AdminQuestionUpdate = z.infer<typeof adminQuestionUpdateSchema>;

export const adminQuestionDeleteSchema = z.strictObject({ version: versionSchema });

export const adminReportSchema = z.object({
  id: z.number().int().positive(),
  createdAt: z.string(),
  source: questionReportSourceSchema,
  comment: z.string().optional(),
  /** Frage und Antwort zum Zeitpunkt der Meldung. */
  question: z.string(),
  answer: z.string(),
});
export type AdminReport = z.infer<typeof adminReportSchema>;

export const adminReportedQuestionSchema = z.object({
  topicId: z.string(),
  questionId: z.string(),
  topicTitle: z.string().optional(),
  /** Fehlt, wenn die Frage inzwischen gelöscht oder per SQL ersetzt wurde. */
  question: adminQuestionSchema.optional(),
  /** Offene Meldungen, neueste zuerst. */
  reports: z.array(adminReportSchema).min(1),
});
export type AdminReportedQuestion = z.infer<typeof adminReportedQuestionSchema>;

export const adminReportListSchema = z.object({ questions: z.array(adminReportedQuestionSchema) });
export type AdminReportList = z.infer<typeof adminReportListSchema>;

export const adminReportResolveSchema = z.strictObject({
  /** Neueste gesehene Meldung; später eingegangene bleiben offen. */
  throughId: z.number().int().positive(),
});
export type AdminReportResolve = z.infer<typeof adminReportResolveSchema>;

/** Entspricht dem Body-Limit der API. */
export const MAX_SQL_LENGTH = 10 * 1024 * 1024 - 1024;

export const sqlRunRequestSchema = z.strictObject({
  sql: z.string().min(1).max(MAX_SQL_LENGTH),
  filename: z.string().trim().max(200).optional(),
});
export type SqlRunRequest = z.infer<typeof sqlRunRequestSchema>;

const countsSchema = z.object({
  topics: z.number().int().nonnegative(),
  rubrics: z.number().int().nonnegative(),
  questions: z.number().int().nonnegative(),
});

export const sqlRunResultSchema = z.object({
  /** Ohne Fehler und ohne neue Pool-Probleme. */
  ok: z.boolean(),
  committed: z.boolean(),
  sha256: z.string(),
  durationMs: z.number().nonnegative(),
  statements: z.array(
    z.object({
      command: z.string(),
      rowCount: z.number().int().nullable(),
      columns: z.array(z.string()).optional(),
      /** Erste Zeilen einer Abfrage, Werte als Text. */
      rows: z.array(z.array(z.string().nullable())).optional(),
    }),
  ),
  notices: z.array(z.string()),
  counts: z.object({ before: countsSchema, after: countsSchema }),
  /** Nur Themen, deren Rubrik- oder Fragenzahl sich ändert. */
  topics: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      before: countsSchema.omit({ topics: true }),
      after: countsSchema.omit({ topics: true }),
    }),
  ),
  /** Pool-Probleme, die erst durch das Skript entstehen und die Ausführung verhindern. */
  issues: z.array(z.object({ topicId: z.string(), issues: z.array(z.string()) })),
  error: z
    .object({
      message: z.string(),
      line: z.number().int().positive().optional(),
      column: z.number().int().positive().optional(),
      detail: z.string().optional(),
      hint: z.string().optional(),
      where: z.string().optional(),
    })
    .optional(),
});
export type SqlRunResult = z.infer<typeof sqlRunResultSchema>;

export const adminLogEntrySchema = z.object({
  id: z.number().int().positive(),
  createdAt: z.string(),
  actor: z.string(),
  action: z.string(),
  target: z.string().optional(),
  detail: z.record(z.string(), z.unknown()),
});
export type AdminLogEntry = z.infer<typeof adminLogEntrySchema>;

export const adminLogSchema = z.object({ entries: z.array(adminLogEntrySchema) });
