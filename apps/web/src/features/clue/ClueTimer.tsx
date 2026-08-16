import { selectActiveTeam } from '@jeopardy/game-core';
import { useEffect, useState } from 'react';
import { de } from '../../i18n/de';
import { cn } from '../../lib/cn';
import { useDispatch, useGameState } from '../../state/GameProvider';

/** Taktrate der Anzeige: fein genug, dass der Sekundenwechsel nicht ruckelt. */
const TICK_MS = 250;
/** Ab hier wirkt die Anzeige dringlich (Farbe, Größe, dezenter Puls). */
const URGENT_SECONDS = 5;
/** Wie lange der Hinweis auf den Teamwechsel stehen bleibt. */
const NOTICE_MS = 3000;

/** Beamer-taugliche Ziffern: unter einer Minute nur Sekunden, darüber „m:ss". */
function formatRemaining(seconds: number): string {
  if (seconds < 60) return String(seconds);
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

/**
 * Countdown der Bedenkzeit im Frage-Popup.
 *
 * Die Anzeige hält **keinen** eigenen Spielzustand: Die Frist steht als
 * `timerEndsAt` im Spielstand, hier läuft lediglich eine Uhr mit, die den
 * Abstand zur Frist darstellt. Ist die Zeit abgelaufen, wird
 * `clue/timerExpired` gemeldet – ob daraufhin das nächste Team an den Zug
 * kommt oder die Frage als gespielt gilt, entscheidet allein der Reducer.
 */
export function ClueTimer() {
  const state = useGameState();
  const dispatch = useDispatch();

  const endsAt = state.timerEndsAt;
  const teamName = selectActiveTeam(state)?.name ?? '';

  const [now, setNow] = useState(() => Date.now());
  const [notice, setNotice] = useState<string | null>(null);

  // Ein Takt je Frist: Bei jedem Teamwechsel startet der Reducer eine neue
  // Frist, damit läuft auch der Takt frisch los und wird sauber aufgeräumt.
  useEffect(() => {
    if (endsAt === null) return;

    setNow(Date.now());
    const tick = setInterval(() => setNow(Date.now()), TICK_MS);
    return () => clearInterval(tick);
  }, [endsAt]);

  const expired = endsAt !== null && now >= endsAt;

  useEffect(() => {
    if (!expired) return;

    setNotice(de.clue.timerExpiredForTeam(teamName));
    dispatch({ type: 'clue/timerExpired', at: Date.now() });
  }, [expired, teamName, dispatch]);

  // Der Hinweis begleitet nur den Wechsel und verschwindet danach wieder.
  useEffect(() => {
    if (notice === null) return;

    const reset = setTimeout(() => setNotice(null), NOTICE_MS);
    return () => clearTimeout(reset);
  }, [notice]);

  // Ohne eingestellte Bedenkzeit (oder nach dem Aufdecken der Antwort) ist
  // kein Timer-Element im DOM.
  if (state.timerSeconds === null || endsAt === null) return null;

  const remainingMs = Math.max(0, endsAt - now);
  const seconds = Math.ceil(remainingMs / 1000);
  const urgent = seconds <= URGENT_SECONDS;
  const share = Math.min(1, remainingMs / (state.timerSeconds * 1000));

  return (
    <section
      className={cn(
        'mx-auto flex w-full max-w-xl flex-col gap-3 rounded-card border bg-surface-hi px-5 py-4',
        urgent ? 'border-negative/50' : 'border-border',
      )}
    >
      <p className="text-center text-sm uppercase tracking-wide text-text-muted sm:text-base">
        {de.clue.timerLabel(teamName)}
      </p>

      {/*
        Die Ziffern sind reine Optik – vorgelesen wird die verbleibende Zeit
        nicht, sonst spräche der Screenreader im Sekundentakt dazwischen.
      */}
      <p
        aria-hidden="true"
        className={cn(
          'text-center font-bold leading-none tabular-nums transition-colors',
          urgent
            ? 'text-[clamp(3rem,9vw,6rem)] text-negative motion-safe:animate-pulse'
            : 'text-[clamp(2.5rem,7vw,5rem)] text-text',
        )}
      >
        {formatRemaining(seconds)}
      </p>
      <span className="sr-only">{de.clue.timerRemaining(seconds)}</span>

      <div className="h-2 overflow-hidden rounded-full bg-surface-mut" aria-hidden="true">
        <div
          className={cn(
            'h-full rounded-full motion-safe:transition-[width] motion-safe:duration-200',
            urgent ? 'bg-negative' : 'bg-cat-1',
          )}
          style={{ width: `${share * 100}%` }}
        />
      </div>

      {/* Nur der Teamwechsel wird angesagt, nicht jede Sekunde. */}
      <p className="min-h-6 text-center text-sm text-text-muted" aria-live="polite">
        {notice ?? ''}
      </p>
    </section>
  );
}
