import {
  selectClueCount,
  selectIsPracticeMode,
  selectRanking,
  selectTeamStats,
} from '@jeopardy/game-core';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Tabs } from '../../components/ui/Tabs';
import type { TabItem } from '../../components/ui/Tabs';
import { de } from '../../i18n/de';
import { useGameState } from '../../state/GameProvider';
import { ClueReviewPanel } from './ClueReviewPanel';
import { ProgressPanel } from './ProgressPanel';
import { StatisticsPanel } from './StatisticsPanel';

const TITLE_ID = 'endstand-titel';

export interface ResultOverlayProps {
  open: boolean;
  onClose: () => void;
  onNewGame: () => void;
}

/** Endstand: bei mehreren Teams als Ranking, im Übungsmodus mit Trefferquote. */
function RankingPanel() {
  const state = useGameState();
  const practice = selectIsPracticeMode(state);
  const ranking = selectRanking(state);
  const firstTeam = ranking[0];
  const hasTie = !practice && ranking.filter((entry) => entry.rank === 1).length > 1;

  if (practice && firstTeam) {
    return (
      <div className="flex flex-col gap-2">
        <p className="text-xl font-semibold">{firstTeam.team.name}</p>
        <p className="text-4xl font-bold tabular-nums">{de.result.scoreSummary(firstTeam.score)}</p>
        <p className="text-text-muted">
          {de.result.practiceSummary(
            selectTeamStats(state, firstTeam.team.id).correct,
            selectClueCount(state),
          )}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
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
      {hasTie ? <p className="text-text-muted">{de.result.tie}</p> : null}
    </div>
  );
}

/**
 * Auswertung am Spielende in drei Reitern: Endstand, Zahlen je Team mit
 * Punkteverlauf und der Rückblick auf alle Fragen. Sie öffnet sich mit der
 * letzten Wertung von selbst und lässt sich danach jederzeit wieder aufrufen.
 */
export function ResultOverlay({ open, onClose, onNewGame }: ResultOverlayProps) {
  const state = useGameState();
  const practice = selectIsPracticeMode(state);

  const tabs: TabItem[] = [
    { id: 'endstand', label: de.result.tabRanking, content: <RankingPanel /> },
    { id: 'statistik', label: de.result.tabStatistics, content: <StatisticsPanel /> },
    { id: 'verlauf', label: de.result.tabProgress, content: <ProgressPanel /> },
    { id: 'fragen', label: de.result.tabClues, content: <ClueReviewPanel /> },
  ];

  return (
    <Modal open={open} onClose={onClose} labelledBy={TITLE_ID} className="w-[min(52rem,94vw)]">
      {/*
        Feste Höhe mit scrollendem Reiterinhalt: Der Rückblick auf 25 Fragen ist
        länger als jeder Bildschirm, Überschrift und Knöpfe bleiben trotzdem sichtbar.
      */}
      <div className="flex max-h-[80vh] flex-col gap-5">
        <h2 id={TITLE_ID} className="text-3xl font-bold">
          {practice ? de.result.practiceHeading : de.result.heading}
        </h2>

        <Tabs items={tabs} label={de.result.tabsLabel} className="min-h-0" />

        <div className="flex flex-wrap justify-end gap-3">
          <Button onClick={onClose}>{de.result.backToBoard}</Button>
          <Button variant="primary" onClick={onNewGame}>
            {de.result.newGame}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
