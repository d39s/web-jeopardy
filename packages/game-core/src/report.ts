import { z } from 'zod';

/** Wo eine Frage gemeldet wurde: im laufenden Spiel oder im Bewertungsmodus. */
export const questionReportSourceSchema = z.enum(['game', 'review']);
export type QuestionReportSource = z.infer<typeof questionReportSourceSchema>;

export const MAX_REPORT_COMMENT_LENGTH = 500;

export const questionReportRequestSchema = z.strictObject({
  /** Wiederholte Anfragen mit derselben ID legen keine zweite Meldung an. */
  requestId: z.uuid(),
  source: questionReportSourceSchema,
  comment: z.string().trim().max(MAX_REPORT_COMMENT_LENGTH).optional(),
});
export type QuestionReportRequest = z.infer<typeof questionReportRequestSchema>;
