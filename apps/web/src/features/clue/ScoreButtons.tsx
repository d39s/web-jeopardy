import type { Team } from '@jeopardy/game-core';
import { Button } from '../../components/ui/Button';
import { de } from '../../i18n/de';

export interface ScoreButtonsProps {
  teams: Team[];
  onAward: (teamId: string, correct: boolean) => void;
}

/**
 * Zwei Buttons je Team – die Liste entsteht ausschließlich aus den Teams des
 * Spielstands. Bei der Standardbesetzung (Team A, Team B) ergibt das genau
 * „Team A richtig / Team A falsch / Team B richtig / Team B falsch"; bei einem
 * einzigen Team im Übungsmodus entsprechend zwei Buttons.
 */
export function ScoreButtons({ teams, onAward }: ScoreButtonsProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {teams.map((team) => (
        <div key={team.id} className="grid grid-cols-2 gap-2">
          <Button variant="success" size="lg" onClick={() => onAward(team.id, true)}>
            <span className="truncate">{de.clue.scoreCorrect(team.name)}</span>
          </Button>
          <Button variant="danger" size="lg" onClick={() => onAward(team.id, false)}>
            <span className="truncate">{de.clue.scoreWrong(team.name)}</span>
          </Button>
        </div>
      ))}
    </div>
  );
}
