import { z } from 'zod';
import { gameDefinitionSchema, teamSchema } from './schema';
import { MAX_DIFFICULTY, TIMER_OPTIONS, WRONG_PENALTIES } from './types';
import { MAX_TEAMS_UI } from './teams';
import type { Difficulty, GameDefinition, Team, WrongPenalty } from './types';

export interface SetupPreset {
  categoryId: string | null;
  level: Difficulty;
  teams: Team[];
  timerSeconds: number | null;
  vetoSeconds: number | null;
  wrongPenalty: WrongPenalty;
  uploaded: GameDefinition | null;
}

const time = z
  .number()
  .refine((seconds) => (TIMER_OPTIONS as readonly number[]).includes(seconds))
  .nullable();
export const setupPresetSchema = z.strictObject({
  categoryId: z
    .string()
    .regex(/^[a-z0-9][a-z0-9-]{0,63}$/i)
    .nullable(),
  level: z.number().int().min(1).max(MAX_DIFFICULTY),
  teams: z.array(teamSchema).min(1).max(MAX_TEAMS_UI),
  timerSeconds: time,
  vetoSeconds: time,
  wrongPenalty: z.enum(WRONG_PENALTIES),
  uploaded: gameDefinitionSchema.nullable(),
});
