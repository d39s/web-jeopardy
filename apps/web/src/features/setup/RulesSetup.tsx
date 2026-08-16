import type { WrongPenalty } from '@jeopardy/game-core';
import { de } from '../../i18n/de';
import { cn } from '../../lib/cn';

export interface RulesSetupProps {
  /** Was eine falsche Antwort kostet. */
  wrongPenalty: WrongPenalty;
  onChange: (wrongPenalty: WrongPenalty) => void;
}

const options = [
  {
    value: 'full',
    title: de.setup.rulesFullTitle,
    description: de.setup.rulesFullDescription,
  },
  {
    value: 'half',
    title: de.setup.rulesHalfTitle,
    description: de.setup.rulesHalfDescription,
  },
  {
    value: 'none',
    title: de.setup.rulesKeepTitle,
    description: de.setup.rulesKeepDescription,
  },
] as const satisfies readonly { value: WrongPenalty; title: string; description: string }[];

/** Spielregeln als Auswahl – gleiche Kartenoptik wie die Themenauswahl. */
export function RulesSetup({ wrongPenalty, onChange }: RulesSetupProps) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-xl font-bold">{de.setup.rulesHeading}</h2>
      <p className="text-sm text-text-muted">{de.setup.rulesHint}</p>

      <ul className="grid items-stretch gap-3 sm:grid-cols-3" aria-label={de.setup.rulesGroupLabel}>
        {options.map((option) => {
          const selected = wrongPenalty === option.value;

          return (
            <li key={option.value}>
              <button
                type="button"
                aria-pressed={selected}
                onClick={() => onChange(option.value)}
                className={cn(
                  // h-full: alle Karten sind gleich hoch, auch bei unterschiedlich
                  // langer Beschreibung.
                  'h-full w-full rounded-card border bg-surface p-4 text-left transition-colors',
                  selected ? 'border-cat-1 bg-surface-hi' : 'border-border hover:bg-surface-hi',
                )}
              >
                <span className="block font-semibold">{option.title}</span>
                <span className="mt-1 block text-sm text-text-muted">{option.description}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
