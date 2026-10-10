import {
  resolveCategoryColor,
  selectAnsweringTeams,
  selectOpenClue,
  selectVetoCandidates,
} from '@jeopardy/game-core';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { de } from '../../i18n/de';
import { cn } from '../../lib/cn';
import { useDispatch, useGameState } from '../../state/GameProvider';
import { ClueTimer } from './ClueTimer';
import { SettleButtons } from './SettleButtons';
import { VetoButtons } from './VetoButtons';

const TITLE_ID = 'frage-dialog-titel';

/**
 * Ab dieser Teamzahl wird das Popup eine Stufe kompakter gezeichnet. Bei acht
 * Teams stehen sieben Veto-Knöpfe, Countdown, Frage und Beteiligtenzeile
 * gleichzeitig im Dialog – ohne die kompakte Stufe passt das auf einem Beamer
 * mit 1280 × 720 nicht mehr ohne Scrollen.
 *
 * Maßgeblich ist die Teamzahl und nicht die Zahl der offenen Kandidaten: So
 * bleibt das Layout während der ganzen Veto-Runde stehen und springt nicht mit
 * jeder Übernahme.
 */
const COMPACT_FROM_TEAMS = 5;

/**
 * Schriftgrößen der Frage. Der `vh`-Anteil in `min()` deckelt die Größe auch
 * über die Höhe – ein flacher Beamer bekommt so von selbst eine Stufe weniger.
 */
const QUESTION_SIZE = {
  roomy: 'text-[clamp(1.4rem,min(3vw,5vh),2.4rem)]',
  compact: 'text-[clamp(1.05rem,min(2.3vw,3.8vh),1.7rem)]',
  /** Nach dem Aufdecken tritt die Frage zurück – vorgelesen wird die Musterlösung. */
  revealed: 'text-[clamp(0.95rem,min(1.8vw,2.8vh),1.35rem)] text-text-muted',
} as const;

export function ClueDialog() {
  const state = useGameState();
  const dispatch = useDispatch();
  const open = selectOpenClue(state);
  const candidates = selectVetoCandidates(state);
  const participants = selectAnsweringTeams(state);

  const compact = state.teams.length >= COMPACT_FROM_TEAMS;
  const gap = compact ? 'gap-3' : 'gap-4';

  const categoryIndex = open
    ? (state.definition?.categories.findIndex((entry) => entry.id === open.category.id) ?? 0)
    : 0;

  const participantLine = de.clue.participants(participants.map((team) => team.name).join(' · '));

  // Der Wechsel des antwortenden Teams ist sonst rein visuell. Die Meldung steht
  // dauerhaft im DOM und bleibt leer, solange nur das Team am Zug beteiligt ist –
  // erst die Übernahme füllt sie und wird damit einmalig angesagt.
  const lastEntrant = participants.length > 1 ? participants[participants.length - 1] : undefined;

  const close = () => dispatch({ type: 'clue/close' });

  return (
    <Modal open={open !== null} onClose={close} labelledBy={TITLE_ID}>
      {open ? (
        <div className={cn('flex flex-col', gap)}>
          <header className="flex items-center justify-between gap-3">
            <p
              className="min-w-0 truncate text-base font-bold uppercase tracking-wide sm:text-lg"
              style={{ color: resolveCategoryColor(open.category, categoryIndex) }}
            >
              {open.category.name}
            </p>
            <div className="flex shrink-0 items-center gap-3">
              <h2 id={TITLE_ID} className="text-lg font-bold text-text-muted sm:text-xl">
                {de.clue.pointsLabel(open.clue.points)}
              </h2>
              <Button className="px-3 py-1 text-sm text-text-muted" onClick={close}>
                {de.clue.close}
              </Button>
            </div>
          </header>

          <p
            className={cn(
              'text-center font-semibold text-balance',
              state.answerRevealed
                ? QUESTION_SIZE.revealed
                : compact
                  ? QUESTION_SIZE.compact
                  : QUESTION_SIZE.roomy,
            )}
          >
            {open.clue.question}
          </p>

          <p className="sr-only" aria-live="polite">
            {lastEntrant ? de.clue.vetoAnnouncement(lastEntrant.name) : ''}
          </p>

          {/*
            Musterlösung und Wertung entstehen erst nach dem Aufdecken – vorher
            sind sie nicht im DOM und können nicht versehentlich sichtbar werden.
          */}
          {state.answerRevealed ? (
            <div className={cn('flex flex-col', gap)}>
              <section className="rounded-card border border-border border-l-4 border-l-cat-1 bg-surface-hi px-5 py-4">
                <h3 className="text-sm uppercase tracking-wide text-text-muted">
                  {de.clue.answerHeading}
                </h3>
                <p className="mt-1 text-[clamp(1.3rem,min(2.8vw,4.6vh),2.1rem)] font-semibold text-balance">
                  {open.clue.answer}
                </p>
                {open.clue.note ? (
                  <p className="mt-2 text-sm text-text-muted">
                    {de.clue.noteHeading}: {open.clue.note}
                  </p>
                ) : null}
              </section>

              <SettleButtons
                participants={participants}
                points={open.clue.points}
                wrongPenalty={state.wrongPenalty}
                compact={compact}
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
            <div className={cn('flex flex-col', gap)}>
              <ClueTimer compact={compact} />

              {participants.length > 1 ? (
                <p
                  className="w-full truncate text-center text-sm text-text-muted"
                  title={participantLine}
                >
                  {participantLine}
                </p>
              ) : null}

              <VetoButtons
                candidates={candidates}
                compact={compact}
                onVeto={(teamId) => dispatch({ type: 'clue/veto', teamId, at: Date.now() })}
              />

              {/*
                Die Hauptaktion sitzt hinter einer Trennlinie und über die volle
                Breite: Sie ist der nächste Schritt, die Veto-Knöpfe sind nur ein
                Angebot.
              */}
              <div className="border-t border-border pt-3">
                <Button
                  variant="primary"
                  size="lg"
                  className="w-full"
                  onClick={() => dispatch({ type: 'clue/revealAnswer' })}
                >
                  {candidates.length > 0 ? de.clue.noVeto : de.clue.revealAnswer}
                </Button>
              </div>
            </div>
          )}
        </div>
      ) : null}
    </Modal>
  );
}
