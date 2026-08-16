import { wrongPenaltyPoints } from '@jeopardy/game-core';
import type { Team, WrongPenalty } from '@jeopardy/game-core';
import { Button } from '../../components/ui/Button';
import { de } from '../../i18n/de';

export interface SettleButtonsProps {
  /** Teams, die sich an dieser Frage beteiligt haben – nur sie werden gewertet. */
  participants: Team[];
  points: number;
  wrongPenalty: WrongPenalty;
  /** Bei vielen Beteiligten eine Stufe kleiner, damit die Wertung ohne Scrollen passt. */
  compact?: boolean;
  /** `null` bedeutet „keine richtige Antwort gegeben". */
  onSettle: (winnerTeamId: string | null) => void;
}

/**
 * Wertung der Veto-Runde: Die Moderation wählt den Gewinner, alles Weitere
 * ergibt sich. Unbeteiligte Teams stehen bewusst nicht zur Wahl.
 *
 * Die Zeichen vor den Beschriftungen sind für Screenreader ausgeblendet – der
 * Knopfname bleibt der reine Teamname, sichtbar trägt aber nicht die Farbe
 * allein die Bedeutung.
 */
export function SettleButtons({
  participants,
  points,
  wrongPenalty,
  compact = false,
  onSettle,
}: SettleButtonsProps) {
  const size = compact ? 'md' : 'lg';
  const penalty = wrongPenaltyPoints(points, wrongPenalty);

  return (
    <section className="flex flex-col gap-2">
      <h3 className="text-sm uppercase tracking-wide text-text-muted">{de.clue.settleHeading}</h3>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(12rem,1fr))] gap-2">
        {participants.map((team) => (
          <Button
            key={team.id}
            variant="success"
            size={size}
            className="min-w-0"
            onClick={() => onSettle(team.id)}
          >
            <span aria-hidden="true">{de.clue.settleMarkCorrect}</span>
            <span className="min-w-0 truncate">{team.name}</span>
          </Button>
        ))}
      </div>

      <Button variant="danger" size={size} className="w-full" onClick={() => onSettle(null)}>
        <span aria-hidden="true">{de.clue.settleMarkNobody}</span>
        <span className="min-w-0 truncate">{de.clue.settleNobody}</span>
      </Button>

      <p className="text-sm text-text-muted">
        {penalty === 0 ? de.clue.settleHintKeep : de.clue.settleHintDeduct(penalty)}
      </p>
    </section>
  );
}
