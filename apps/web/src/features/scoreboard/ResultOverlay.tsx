import {
  selectClueCount,
  selectIsFinished,
  selectIsPracticeMode,
  selectRanking,
  selectTeamStats,
} from '@jeopardy/game-core';
import { useState } from 'react';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { de } from '../../i18n/de';
import { useGameState } from '../../state/GameProvider';

const TITLE_ID = 'endstand-titel';

export interface ResultOverlayProps {
  onNewGame: () => void;
}

/**
 * Erscheint, sobald alle Karten gewertet sind. Bei mehreren Teams als Ranking,
 * im Übungsmodus stattdessen mit Trefferquote – dort gibt es keinen Sieger.
 */
export function ResultOverlay({ onNewGame }: ResultOverlayProps) {
  const state = useGameState();
  const [dismissed, setDismissed] = useState(false);

  const finished = selectIsFinished(state);
  const practice = selectIsPracticeMode(state);
  const ranking = selectRanking(state);
  const firstTeam = ranking[0];

  const hasTie = !practice && ranking.filter((entry) => entry.rank === 1).length > 1;

  return (
    <Modal
      open={finished && !dismissed}
      onClose={() => setDismissed(true)}
      labelledBy={TITLE_ID}
      className="w-[min(36rem,92vw)]"
    >
      <div className="flex flex-col gap-6">
        <h2 id={TITLE_ID} className="text-3xl font-bold">
          {practice ? de.result.practiceHeading : de.result.heading}
        </h2>

        {practice && firstTeam ? (
          <div className="flex flex-col gap-2">
            <p className="text-xl font-semibold">{firstTeam.team.name}</p>
            <p className="text-4xl font-bold tabular-nums">
              {de.result.scoreSummary(firstTeam.score)}
            </p>
            <p className="text-text-muted">
              {de.result.practiceSummary(
                selectTeamStats(state, firstTeam.team.id).correct,
                selectClueCount(state),
              )}
            </p>
          </div>
        ) : (
          <ol className="flex flex-col gap-2">
            {ranking.map((entry) => (
              <li
                key={entry.team.id}
                className="flex items-center justify-between gap-4 rounded-btn border border-border bg-surface-hi px-4 py-3"
              >
                <span className="flex items-center gap-3">
                  <span className="text-text-muted tabular-nums">{de.result.rank(entry.rank)}</span>
                  <span className="font-semibold">{entry.team.name}</span>
                </span>
                <span className="text-2xl font-bold tabular-nums">{entry.score}</span>
              </li>
            ))}
          </ol>
        )}

        {hasTie ? <p className="text-text-muted">{de.result.tie}</p> : null}

        <div className="flex flex-wrap justify-end gap-3">
          <Button onClick={() => setDismissed(true)}>{de.result.backToBoard}</Button>
          <Button variant="primary" onClick={onNewGame}>
            {de.result.newGame}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
