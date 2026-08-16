import {
  resolveCategoryColor,
  selectAnsweringTeams,
  selectOpenClue,
  selectVetoCandidates,
} from '@jeopardy/game-core';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { de } from '../../i18n/de';
import { useDispatch, useGameState } from '../../state/GameProvider';
import { ClueTimer } from './ClueTimer';
import { SettleButtons } from './SettleButtons';
import { VetoButtons } from './VetoButtons';

const TITLE_ID = 'frage-dialog-titel';

export function ClueDialog() {
  const state = useGameState();
  const dispatch = useDispatch();
  const open = selectOpenClue(state);
  const candidates = selectVetoCandidates(state);
  const participants = selectAnsweringTeams(state);

  const categoryIndex = open
    ? (state.definition?.categories.findIndex((entry) => entry.id === open.category.id) ?? 0)
    : 0;

  const close = () => dispatch({ type: 'clue/close' });

  return (
    <Modal open={open !== null} onClose={close} labelledBy={TITLE_ID}>
      {open ? (
        <div className="flex flex-col gap-6">
          <header className="flex items-baseline justify-between gap-4">
            <p
              className="text-lg font-bold uppercase tracking-wide"
              style={{ color: resolveCategoryColor(open.category, categoryIndex) }}
            >
              {open.category.name}
            </p>
            <h2 id={TITLE_ID} className="text-xl font-bold text-text-muted">
              {de.clue.pointsLabel(open.clue.points)}
            </h2>
          </header>

          <p className="text-center text-[clamp(1.4rem,3vw,2.4rem)] font-semibold text-balance">
            {open.clue.question}
          </p>

          {/*
            Musterlösung und Wertung entstehen erst nach dem Aufdecken – vorher
            sind sie nicht im DOM und können nicht versehentlich sichtbar werden.
          */}
          {state.answerRevealed ? (
            <div className="flex flex-col gap-6">
              <section className="rounded-btn border border-border bg-surface-hi p-4">
                <h3 className="text-sm uppercase tracking-wide text-text-muted">
                  {de.clue.answerHeading}
                </h3>
                <p className="mt-1 text-[clamp(1.1rem,2vw,1.6rem)]">{open.clue.answer}</p>
                {open.clue.note ? (
                  <p className="mt-3 text-sm text-text-muted">
                    {de.clue.noteHeading}: {open.clue.note}
                  </p>
                ) : null}
              </section>

              <SettleButtons
                participants={participants}
                points={open.clue.points}
                deductOnWrong={state.deductOnWrong}
                onSettle={(winnerTeamId) =>
                  dispatch({
                    type: 'score/settle',
                    clueId: open.clue.id,
                    winnerTeamId,
                    at: Date.now(),
                  })
                }
              />
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <ClueTimer />

              {participants.length > 1 ? (
                <p className="text-center text-sm text-text-muted">
                  {de.clue.participants(participants.map((team) => team.name).join(' · '))}
                </p>
              ) : null}

              <VetoButtons
                candidates={candidates}
                onVeto={(teamId) => dispatch({ type: 'clue/veto', teamId, at: Date.now() })}
              />

              <div className="flex justify-center">
                <Button
                  variant="primary"
                  size="lg"
                  onClick={() => dispatch({ type: 'clue/revealAnswer' })}
                >
                  {candidates.length > 0 ? de.clue.noVeto : de.clue.revealAnswer}
                </Button>
              </div>
            </div>
          )}

          <div className="flex justify-end">
            <Button onClick={close}>{de.clue.close}</Button>
          </div>
        </div>
      ) : null}
    </Modal>
  );
}
