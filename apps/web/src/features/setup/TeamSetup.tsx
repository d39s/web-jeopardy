import {
  MAX_TEAMS_UI,
  MAX_TEAM_NAME_LENGTH,
  MIN_TEAMS,
  createTeam,
  defaultTeamName,
} from '@jeopardy/game-core';
import type { Team } from '@jeopardy/game-core';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { TextField } from '../../components/ui/TextField';
import { de } from '../../i18n/de';

export interface TeamSetupProps {
  teams: Team[];
  onChange: (teams: Team[]) => void;
}

/** Beliebig viele Teams: hinzufügen, entfernen, umbenennen. Ein Team = Übungsmodus. */
export function TeamSetup({ teams, onChange }: TeamSetupProps) {
  const canAdd = teams.length < MAX_TEAMS_UI;
  const canRemove = teams.length > MIN_TEAMS;

  const rename = (index: number, name: string) => {
    onChange(teams.map((team, position) => (position === index ? { ...team, name } : team)));
  };

  const add = () => {
    // Nächste freie Kennung suchen, damit IDs auch nach Entfernen eindeutig bleiben.
    const usedIds = new Set(teams.map((team) => team.id));
    let index = teams.length;
    let candidate = createTeam(index);
    while (usedIds.has(candidate.id)) {
      index += 1;
      candidate = createTeam(index);
    }
    onChange([...teams, candidate]);
  };

  const remove = (index: number) => {
    onChange(teams.filter((_, position) => position !== index));
  };

  const duplicates = new Set(
    teams
      .map((team) => team.name.trim().toLowerCase())
      .filter((name, index, all) => name && all.indexOf(name) !== index),
  );

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-xl font-bold">{de.setup.teamsHeading}</h2>
        {teams.length === 1 ? <Badge>{de.setup.practiceBadge}</Badge> : null}
      </div>
      <p className="text-sm text-text-muted">{de.setup.teamsHint}</p>

      <ul className="flex flex-col gap-3">
        {teams.map((team, index) => (
          <li key={team.id} className="flex items-end gap-2">
            <div className="flex-1">
              <TextField
                label={de.setup.teamLabel(index)}
                value={team.name}
                maxLength={MAX_TEAM_NAME_LENGTH}
                placeholder={defaultTeamName(index)}
                onChange={(event) => rename(index, event.target.value)}
                hint={
                  duplicates.has(team.name.trim().toLowerCase())
                    ? de.setup.duplicateName
                    : undefined
                }
              />
            </div>
            <Button
              onClick={() => remove(index)}
              disabled={!canRemove}
              aria-label={de.setup.removeTeam(team.name || defaultTeamName(index))}
            >
              –
            </Button>
          </li>
        ))}
      </ul>

      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={add} disabled={!canAdd}>
          {de.setup.addTeam}
        </Button>
        {canAdd ? null : (
          <p className="text-sm text-text-muted">{de.setup.maxTeamsReached(MAX_TEAMS_UI)}</p>
        )}
      </div>
    </section>
  );
}
