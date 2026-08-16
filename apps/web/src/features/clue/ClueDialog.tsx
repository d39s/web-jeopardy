import { resolveCategoryColor, selectOpenClue } from '@jeopardy/game-core';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { de } from '../../i18n/de';
import { useDispatch, useGameState } from '../../state/GameProvider';
import { ScoreButtons } from './ScoreButtons';

const TITLE_ID = 'frage-dialog-titel';

export function ClueDialog() {
  const state = useGameState();
  const dispatch = useDispatch();
  const open = selectOpenClue(state);

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
            Musterlösung und Punktebuttons entstehen erst nach dem Aufdecken –
            vorher sind sie nicht im DOM und können nicht versehentlich sichtbar
            werden.
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

              <ScoreButtons
                teams={state.teams}
                onAward={(teamId, correct) =>
                  dispatch({
                    type: 'score/award',
                    clueId: open.clue.id,
                    teamId,
                    correct,
                    at: Date.now(),
                  })
                }
              />
            </div>
          ) : (
            <div className="flex justify-center">
              <Button
                variant="primary"
                size="lg"
                onClick={() => dispatch({ type: 'clue/revealAnswer' })}
              >
                {de.clue.revealAnswer}
              </Button>
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
