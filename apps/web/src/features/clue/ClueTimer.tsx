import { effectiveVetoSeconds, selectActiveTeam, selectIsTimeUp } from '@jeopardy/game-core';
import { useEffect, useState } from 'react';
import { de } from '../../i18n/de';
import { cn } from '../../lib/cn';
import { useDispatch, useGameState } from '../../state/GameProvider';

/** Taktrate der Anzeige: fein genug, dass der Sekundenwechsel nicht ruckelt. */
const TICK_MS = 250;
/** Ab hier wirkt die Anzeige dringlich (Farbe, Größe, dezenter Puls). */
const URGENT_SECONDS = 5;

/** Beamer-taugliche Ziffern: unter einer Minute nur Sekunden, darüber „m:ss". */
function formatRemaining(seconds: number): string {
  if (seconds < 60) return String(seconds);
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

/**
 * Countdown im Frage-Popup.
 *
 * Die Anzeige hält **keinen** eigenen Spielzustand: Die Frist steht als
 * `timerEndsAt` im Spielstand, hier läuft lediglich eine Uhr mit, die den
 * Abstand dazu darstellt. Läuft die Zeit ab, wird `clue/timerExpired` gemeldet –
 * mehr passiert dann nicht: Wie es weitergeht, entscheidet die Moderation über
 * die Veto-Auswahl.
 */
export function ClueTimer() {
  const state = useGameState();
  const dispatch = useDispatch();

  const endsAt = state.timerEndsAt;
  const activeTeam = selectActiveTeam(state);
  const teamName = activeTeam?.name ?? '';
  // Das erste Team spielt die Bedenkzeit, jedes übernehmende die Veto-Zeit.
  const label =
    state.answeringTeamIds.length > 1
      ? de.clue.vetoTimerLabel(teamName)
      : de.clue.timerLabel(teamName);

  const [now, setNow] = useState(() => Date.now());

  // Ein Takt je Frist: Bei jeder Übernahme startet der Reducer eine neue Frist,
  // damit läuft auch der Takt frisch los und wird sauber aufgeräumt.
  useEffect(() => {
    if (endsAt === null) return;

    setNow(Date.now());
    const tick = setInterval(() => setNow(Date.now()), TICK_MS);
    return () => clearInterval(tick);
  }, [endsAt]);

  const expired = endsAt !== null && now >= endsAt;

  useEffect(() => {
    if (!expired) return;
    dispatch({ type: 'clue/timerExpired', at: Date.now() });
  }, [expired, dispatch]);

  // Ohne eingestellte Zeit gibt es keinen Countdown.
  if (state.timerSeconds === null) return null;

  // Die Frist ist abgelaufen: Der Hinweis bleibt stehen, bis die Moderation
  // entscheidet – von selbst geschieht nichts mehr.
  if (endsAt === null) {
    if (!selectIsTimeUp(state)) return null;

    return (
      <section className="mx-auto flex w-full max-w-xl flex-col gap-1 rounded-card border border-negative/50 bg-surface-hi px-5 py-4 text-center">
        <p className="text-sm uppercase tracking-wide text-text-muted sm:text-base">{label}</p>
        <p className="text-[clamp(1.5rem,4vw,2.5rem)] font-bold text-negative" aria-live="polite">
          {de.clue.timeUp}
        </p>
      </section>
    );
  }

  const remainingMs = Math.max(0, endsAt - now);
  const seconds = Math.ceil(remainingMs / 1000);
  const urgent = seconds <= URGENT_SECONDS;
  // Der Balken misst gegen die Zeit, die diesem Team zusteht – für Übernahmen
  // ist das die Veto-Zeit, sonst die Bedenkzeit.
  const fullSeconds =
    state.answeringTeamIds.length > 1 ? effectiveVetoSeconds(state) : state.timerSeconds;
  const share = fullSeconds === null ? 1 : Math.min(1, remainingMs / (fullSeconds * 1000));

  return (
    <section
      className={cn(
        'mx-auto flex w-full max-w-xl flex-col gap-3 rounded-card border bg-surface-hi px-5 py-4',
        urgent ? 'border-negative/50' : 'border-border',
      )}
    >
      <p className="text-center text-sm uppercase tracking-wide text-text-muted sm:text-base">
        {label}
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
    </section>
  );
}
