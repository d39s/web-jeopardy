import { TIMER_OPTIONS } from '@jeopardy/game-core';
import { ScaleSlider } from '../../components/ui/ScaleSlider';
import { de } from '../../i18n/de';

export interface TimerSetupProps {
  /** Sekunden je Frage; null bedeutet ohne Zeitbegrenzung. */
  value: number | null;
  onChange: (value: number | null) => void;
}

/** Lesbare Beschriftung einer Bedenkzeit, z. B. „45 Sekunden" oder „1:30 Minuten". */
export function formatTimerOption(seconds: number): string {
  if (seconds < 60) return de.setup.timerSeconds(seconds);

  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return rest === 0 ? de.setup.timerMinutes(minutes) : de.setup.timerMinutesSeconds(minutes, rest);
}

/**
 * Position auf dem Schieberegler. Die Stufen sind ungleich verteilt (10 s bis
 * 5 min), deshalb steht auf dem Regler der Index und nicht die Sekundenzahl.
 * Position 0 bedeutet „ohne Zeitbegrenzung".
 */
export function timerSliderValue(seconds: number | null): number {
  if (seconds === null) return 0;
  const index = (TIMER_OPTIONS as readonly number[]).indexOf(seconds);
  return index === -1 ? 0 : index + 1;
}

/** Umkehrung von `timerSliderValue`; Position 0 ist die Sonderstufe. */
export function secondsAtSliderValue(position: number): number | null {
  return position === 0 ? null : (TIMER_OPTIONS[position - 1] ?? null);
}

const LAST_OPTION = TIMER_OPTIONS[TIMER_OPTIONS.length - 1] as number;

export interface TimerSliderProps {
  /** Sekunden; null steht für die Sonderstufe ganz links. */
  value: number | null;
  onChange: (value: number | null) => void;
  /** Unsichtbare Beschriftung – auf dem Regler selbst steht nur ein Index. */
  label: string;
  /** Klartext des eingestellten Werts; steht über dem Regler. */
  valueText: string;
  /** Zweite Zeile darunter, z. B. die daraus folgende Zeit. */
  note?: string;
  /** Beschriftung der Skala ganz links (Position 0). */
  scaleStart: string;
  /** Vorlesetext; ohne Angabe gilt `valueText`. */
  ariaValueText?: string;
  disabled?: boolean;
  /** Id eines Textes, der die Sperre erklärt. */
  describedBy?: string;
}

/**
 * Regler über die Zeitstufen. Bedenkzeit und Veto-Zeit teilen sich Optik und
 * Bedienung und unterscheiden sich nur in den Beschriftungen.
 */
export function TimerSlider({ value, onChange, ...rest }: TimerSliderProps) {
  return (
    <ScaleSlider
      {...rest}
      position={timerSliderValue(value)}
      max={TIMER_OPTIONS.length}
      onChange={(position) => onChange(secondsAtSliderValue(position))}
      scaleEnd={formatTimerOption(LAST_OPTION)}
    />
  );
}

export function TimerSetup({ value, onChange }: TimerSetupProps) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-xl font-bold">{de.setup.timerHeading}</h2>
      <p className="text-sm text-text-muted">{de.setup.timerHint}</p>

      <TimerSlider
        value={value}
        onChange={onChange}
        label={de.setup.timerLabel}
        valueText={value === null ? de.setup.timerOff : formatTimerOption(value)}
        scaleStart={de.setup.timerScaleOff}
      />
    </section>
  );
}
