import type { Team } from './types';

export const MIN_TEAMS = 1;
/** Reine Layoutgrenze der Oberfläche – die Spiellogik kennt keine Obergrenze. */
export const MAX_TEAMS_UI = 8;
export const MAX_TEAM_NAME_LENGTH = 24;

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

/** Vorbelegter Name eines Teams: 'Team A', 'Team B', … */
export function defaultTeamName(index: number): string {
  const letter = LETTERS[index];
  return letter ? `Team ${letter}` : `Team ${index + 1}`;
}

export function createTeam(index: number, name?: string): Team {
  const letter = LETTERS[index];
  const id = letter ? `team-${letter.toLowerCase()}` : `team-${index + 1}`;
  const trimmed = name?.trim();
  return { id, name: trimmed ? trimmed.slice(0, MAX_TEAM_NAME_LENGTH) : defaultTeamName(index) };
}

/** Erzeugt beliebig viele Teams mit den Standardnamen. */
export function createDefaultTeams(count: number): Team[] {
  const safeCount = Math.max(MIN_TEAMS, Math.floor(count));
  return Array.from({ length: safeCount }, (_, index) => createTeam(index));
}
