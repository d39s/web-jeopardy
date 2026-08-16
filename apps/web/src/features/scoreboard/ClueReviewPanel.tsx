import { categoryColorAt, selectClueReview } from '@jeopardy/game-core';
import type { ClueReviewEntry } from '@jeopardy/game-core';
import { de } from '../../i18n/de';
import { useGameState } from '../../state/GameProvider';

/** Beteiligte in Zugreihenfolge; per Veto Eingestiegene sind gekennzeichnet. */
function participantsText(entry: ClueReviewEntry): string {
  return entry.participants
    .map((teil) =>
      teil.viaVeto ? `${teil.team.name} (${de.result.clueVetoMark})` : teil.team.name,
    )
    .join(' · ');
}

/**
 * Rückblick auf alle gewerteten Fragen in Spielreihenfolge – mit Musterlösung,
 * Gewinner und den Beteiligten. Der Moderationshinweis einer Frage bleibt außen
 * vor: Er richtet sich an die Moderation während des Spiels, nicht an die Runde.
 */
export function ClueReviewPanel() {
  const state = useGameState();
  const review = selectClueReview(state);

  if (review.length === 0) {
    return <p className="text-text-muted">{de.result.cluesEmpty}</p>;
  }

  return (
    <ol className="flex flex-col gap-3">
      {review.map((entry) => (
        <li
          key={entry.clue.id}
          className="rounded-btn border border-border bg-surface-hi px-4 py-3"
          // Farbe der Kategorie als schmaler Streifen – sie ordnet ein, trägt aber nichts allein.
          style={{ borderLeft: `4px solid ${categoryColorAt(entry.categoryIndex)}` }}
        >
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <p className="text-sm text-text-muted">
              {de.result.clueOrder(entry.order)} · {entry.categoryName} ·{' '}
              {de.result.cluePoints(entry.clue.points)}
            </p>
            <p
              className={`text-sm font-semibold ${entry.winner ? 'text-positive' : 'text-negative'}`}
            >
              <span aria-hidden="true">
                {entry.winner ? de.board.resultMarkCorrect : de.board.resultMarkWrong}{' '}
              </span>
              {entry.winner ? de.result.clueWinner(entry.winner.name) : de.result.clueNobody}
            </p>
          </div>

          <p className="mt-1 font-semibold">{entry.clue.question}</p>
          <p className="mt-1">
            <span className="text-text-muted">{de.result.clueAnswer}: </span>
            {entry.clue.answer}
          </p>

          {/* Bei einem einzigen Beteiligten sagt die Zeile nichts – dann entfällt sie. */}
          {entry.participants.length > 1 ? (
            <p className="mt-1 text-sm text-text-muted">
              {de.result.clueParticipants}: {participantsText(entry)}
            </p>
          ) : null}
        </li>
      ))}
    </ol>
  );
}
