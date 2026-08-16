import { effectiveVetoSeconds, selectActiveTeam, selectIsTimeUp } from '@jeopardy/game-core';
import { useEffect, useState } from 'react';
import { de } from '../../i18n/de';
import { cn } from '../../lib/cn';
import { useDispatch, useGameState } from '../../state/GameProvider';

/** Taktrate der Anzeige: fein genug, dass der Sekundenwechsel nicht ruckelt. */
const TICK_MS = 250;
/** Ab hier wirkt die Anzeige dringlich (Farbe, Größe, dezenter Puls). */
const URGENT_SECONDS = 5;

/**
 * Zifferngrößen des Countdowns. Der `vh`-Anteil in `min()` deckelt sie über die
 * Höhe, damit auf einem Beamer mit 1280 × 720 auch bei acht Teams alles ohne
 * Scrollen in den Dialog passt.
 */
const DIGITS = {
  roomy: {
    calm: 'text-[clamp(2.25rem,min(6vw,9vh),4.5rem)] text-text',
    urgent: 'text-[clamp(2.5rem,min(7vw,10vh),5rem)] text-negative motion-safe:animate-pulse',
  },
  compact: {
    calm: 'text-[clamp(1.75rem,min(4vw,6.5vh),3rem)] text-text',
    urgent: 'text-[clamp(2rem,min(4.5vw,7.5vh),3.5rem)] text-negative motion-safe:animate-pulse',
  },
} as const;

/** Beamer-taugliche Ziffern: unter einer Minute nur Sekunden, darüber „m:ss". */
function formatRemaining(seconds: number): string {
  if (seconds < 60) return String(seconds);
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

export interface ClueTimerProps {
  /** Bei vielen Teams rücken Ziffern und Innenabstände eine Stufe kleiner. */
  compact?: boolean;
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
export function ClueTimer({ compact = false }: ClueTimerProps) {
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
  // entscheidet – von selbst geschieht nichts mehr. Deshalb steht hier nicht nur
  // „Zeit abgelaufen", sondern auch, was jetzt zu tun ist. Kein Blinken: Der
  // Zustand ist dauerhaft und soll ruhig, aber unübersehbar sein.
  if (endsAt === null) {
    if (!selectIsTimeUp(state)) return null;

    return (
      <section
        role="status"
        className={cn(
          'flex w-full flex-col gap-1 rounded-card border-2 border-negative bg-negative-soft px-5',
          compact ? 'py-3' : 'py-4',
        )}
      >
        <p className="truncate text-sm uppercase tracking-wide text-text-muted sm:text-base">
          {label}
        </p>
        <p
          className={cn(
            'font-bold text-negative',
            compact
              ? 'text-[clamp(1.25rem,min(3vw,4.5vh),1.9rem)]'
              : 'text-[clamp(1.5rem,min(4vw,6vh),2.5rem)]',
          )}
        >
          <span aria-hidden="true" className="mr-2">
            {de.clue.timeUpMark}
          </span>
          {de.clue.timeUp}
        </p>
        <p className="text-sm text-text-muted sm:text-base">{de.clue.timeUpHint}</p>
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
  const digits = (compact ? DIGITS.compact : DIGITS.roomy)[urgent ? 'urgent' : 'calm'];

  return (
    <section
      className={cn(
        'flex w-full flex-col rounded-card border bg-surface-hi px-5',
        compact ? 'gap-2 py-3' : 'gap-3 py-4',
        urgent ? 'border-negative/60' : 'border-border',
      )}
    >
      {/*
        Beschriftung und Ziffern teilen sich eine Zeile: Das spart genau die
        Höhe, die sieben Veto-Knöpfe darunter brauchen.
      */}
      <div className="flex items-baseline justify-between gap-4">
        <p className="min-w-0 truncate text-sm uppercase tracking-wide text-text-muted sm:text-base">
          {label}
        </p>

        {/*
          Die Ziffern sind reine Optik – vorgelesen wird die verbleibende Zeit
          nicht, sonst spräche der Screenreader im Sekundentakt dazwischen.
        */}
        <p
          aria-hidden="true"
          className={cn('shrink-0 font-bold leading-none tabular-nums transition-colors', digits)}
        >
          {formatRemaining(seconds)}
        </p>
      </div>
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
