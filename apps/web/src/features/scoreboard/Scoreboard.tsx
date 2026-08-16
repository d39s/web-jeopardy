import {
  selectActiveTeam,
  selectIsFinished,
  selectIsPracticeMode,
  selectScore,
  selectStartingTeam,
  selectStreak,
} from '@jeopardy/game-core';
import type { GameState, Team } from '@jeopardy/game-core';
import { de } from '../../i18n/de';
import { useGameState } from '../../state/GameProvider';
import { TeamTile } from './TeamTile';

/**
 * Team am Zug: bei geöffneter Frage das Team mit Zugriff, sonst das Team, das
 * die nächste Frage beginnt. Im Übungsmodus (ein Team) gibt es keine
 * Zugreihenfolge, nach der letzten Frage keine nächste – dann entfällt die
 * Anzeige vollständig.
 */
function selectTurnTeam(state: GameState): Team | null {
  if (selectIsPracticeMode(state) || selectIsFinished(state)) return null;
  return state.openClueId ? selectActiveTeam(state) : selectStartingTeam(state);
}

/** Teamleiste über dem Spielfeld – passt sich der Teamanzahl an. */
export function Scoreboard() {
  const state = useGameState();

  const turnTeam = selectTurnTeam(state);
  const clueOpen = state.openClueId !== null;

  return (
    <div className="flex flex-col gap-1 sm:gap-2">
      {/*
        Sichtbarer Hinweis und Screenreader-Meldung in einem: Der Satz nennt
        beim Wechsel, wer am Zug ist, und unterscheidet dabei den Zugriff auf
        die offene Frage vom Beginn der nächsten.
      */}
      {turnTeam ? (
        <p className="flex items-center gap-2 text-sm leading-none" aria-live="polite">
          <span aria-hidden="true" className="size-2 shrink-0 rounded-full bg-cat-1" />
          {clueOpen ? de.board.turnLabel(turnTeam.name) : de.board.turnNext(turnTeam.name)}
        </p>
      ) : null}

      <div className="grid gap-2 sm:gap-3 [grid-template-columns:repeat(auto-fit,minmax(12rem,1fr))]">
        {state.teams.map((team) => (
          <TeamTile
            key={team.id}
            team={team}
            score={selectScore(state, team.id)}
            isOnTurn={team.id === turnTeam?.id}
            streak={selectStreak(state, team.id)}
          />
        ))}
      </div>
    </div>
  );
}
