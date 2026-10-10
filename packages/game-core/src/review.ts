import { z } from 'zod';

export const difficultyVerdictSchema = z.enum(['fits', 'too-hard', 'too-easy', 'unsure']);
export type DifficultyVerdict = z.infer<typeof difficultyVerdictSchema>;

export const reviewQuestionSchema = z.object({
  topicId: z.string(),
  topicTitle: z.string(),
  rubricName: z.string(),
  id: z.string(),
  question: z.string(),
  answer: z.string(),
  note: z.string().optional(),
  level: z.number().int().min(1).max(9),
  score: z.number().min(1).max(9),
  votes: z.number().int().nonnegative(),
  version: z.string(),
});
export type ReviewQuestion = z.infer<typeof reviewQuestionSchema>;

export const difficultyVoteSchema = z.strictObject({
  requestId: z.uuid(),
  version: z.string().regex(/^[a-f0-9]{64}$/),
  verdict: difficultyVerdictSchema,
});
export type DifficultyVote = z.infer<typeof difficultyVoteSchema>;

export const difficultyRatingSchema = z.object({
  score: z.number().min(1).max(9),
  level: z.number().int().min(1).max(9),
  votes: z.number().int().nonnegative(),
});
export type DifficultyRating = z.infer<typeof difficultyRatingSchema>;
