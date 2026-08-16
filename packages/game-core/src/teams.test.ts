import { describe, expect, it } from 'vitest';
import { MAX_TEAMS_UI, createDefaultTeams, createTeam, defaultTeamName } from './teams';

describe('teamverwaltung', () => {
  it('erzeugt die geforderten standardnamen', () => {
    expect(createDefaultTeams(2).map((team) => team.name)).toEqual(['Team A', 'Team B']);
  });

  it('unterstützt den übungsmodus mit einem einzigen team', () => {
    const teams = createDefaultTeams(1);
    expect(teams).toHaveLength(1);
    expect(teams[0]?.name).toBe('Team A');
  });

  it('erzeugt beliebig viele teams mit eindeutigen ids', () => {
    const teams = createDefaultTeams(MAX_TEAMS_UI);
    expect(teams).toHaveLength(MAX_TEAMS_UI);
    expect(new Set(teams.map((team) => team.id)).size).toBe(MAX_TEAMS_UI);
  });

  it('fällt bei leerem namen auf den standardnamen zurück', () => {
    expect(createTeam(1, '   ').name).toBe('Team B');
  });

  it('kürzt zu lange namen', () => {
    expect(createTeam(0, 'x'.repeat(40)).name).toHaveLength(24);
  });

  it('bleibt auch jenseits des alphabets eindeutig', () => {
    expect(defaultTeamName(26)).toBe('Team 27');
    expect(createTeam(26).id).toBe('team-27');
  });

  it('erzwingt mindestens ein team', () => {
    expect(createDefaultTeams(0)).toHaveLength(1);
  });
});
