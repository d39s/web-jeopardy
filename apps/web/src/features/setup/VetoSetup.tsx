import { useId } from 'react';
import { de } from '../../i18n/de';
import { TimerSlider, formatTimerOption } from './TimerSetup';

export interface VetoSetupProps {
  /** Sekunden für ein übernehmendes Team; null koppelt die Zeit an die Bedenkzeit. */
  value: number | null;
  /** Eingestellte Bedenkzeit; null bedeutet ohne Zeitbegrenzung. */
  timerSeconds: number | null;
  onChange: (value: number | null) => void;
}

/**
 * Die Veto-Zeit, die am Ende wirklich gilt. `null` heißt „an die Bedenkzeit
 * gekoppelt“ – wird ohne Zeitbegrenzung gespielt, läuft auch im Veto keine Uhr,
 * eine eigene Angabe wäre dann gegenstandslos und fällt weg.
 */
export function effectiveVetoSetting(
  value: number | null,
  timerSeconds: number | null,
): number | null {
  return timerSeconds === null ? null : value;
}

/** Klartext der Veto-Zeit in einer Zeile – für Abzeichen und Vorlesetexte. */
export function vetoValueText(value: number | null, timerSeconds: number | null): string {
  if (timerSeconds === null) return de.setup.timerOff;
  if (value !== null) return formatTimerOption(value);
  return de.setup.vetoLinkedWith(formatTimerOption(timerSeconds));
}

/**
 * Zweiter Regler unter der Bedenkzeit. Die linke Stufe koppelt die Veto-Zeit an
 * die Bedenkzeit; rechts davon stehen dieselben Stufen wie dort.
 */
export function VetoSetup({ value, timerSeconds, onChange }: VetoSetupProps) {
  const hintId = useId();
  // Ohne Bedenkzeit gibt es nichts einzustellen – der Regler bleibt gesperrt.
  const disabled = timerSeconds === null;
  /**
   * Bei Kopplung steht der daraus folgende Wert unter dem Regler, damit die
   * Moderation sieht, wie lange ein übernehmendes Team wirklich hat. Null heißt:
   * nicht gekoppelt oder gar keine Zeit – dann trägt die erste Zeile den Wert.
   */
  const derived = timerSeconds === null || value !== null ? null : formatTimerOption(timerSeconds);

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-xl font-bold">{de.setup.vetoHeading}</h2>
      <p className="text-sm text-text-muted">{de.setup.vetoHint}</p>

      <TimerSlider
        value={effectiveVetoSetting(value, timerSeconds)}
        onChange={onChange}
        label={de.setup.vetoLabel}
        valueText={derived === null ? vetoValueText(value, timerSeconds) : de.setup.vetoLinked}
        note={derived === null ? undefined : de.setup.vetoDerived(derived)}
        ariaValueText={vetoValueText(value, timerSeconds)}
        scaleStart={de.setup.vetoScaleLinked}
        disabled={disabled}
        describedBy={disabled ? hintId : undefined}
      />

      {disabled ? (
        <p id={hintId} className="text-sm text-text-muted">
          {de.setup.vetoNoTimerHint}
        </p>
      ) : null}
    </section>
  );
}
