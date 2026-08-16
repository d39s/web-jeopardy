import { selectScore } from '@jeopardy/game-core';
import { useGameState } from '../../state/GameProvider';
import { TeamTile } from './TeamTile';

/** Teamleiste über dem Spielfeld – passt sich der Teamanzahl an. */
export function Scoreboard() {
  const state = useGameState();

  return (
    <div className="grid gap-2 sm:gap-3 [grid-template-columns:repeat(auto-fit,minmax(12rem,1fr))]">
      {state.teams.map((team) => (
        <TeamTile key={team.id} team={team} score={selectScore(state, team.id)} />
      ))}
    </div>
  );
}
