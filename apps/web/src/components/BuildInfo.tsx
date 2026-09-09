import { de } from '../i18n/de';

/** Nur Tests setzen den Wert; sonst gilt der beim Bauen eingesetzte Stand. */
export type BuildInfoProps = {
  info?: typeof __BUILD_INFO__;
};

const dateFormat = new Intl.DateTimeFormat('de-DE', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

/**
 * Ein unbrauchbarer Zeitstempel darf die Startseite nicht zerlegen – dann
 * entfällt das Datum und Version und Commit bleiben stehen.
 */
export function formatBuildDate(builtAt: string): string | null {
  const date = new Date(builtAt);
  return Number.isNaN(date.getTime()) ? null : dateFormat.format(date);
}

/** Fußzeile der Startseite: welcher Stand hier gerade läuft. */
export function BuildInfo({ info = __BUILD_INFO__ }: BuildInfoProps) {
  const date = formatBuildDate(info.builtAt);
  const parts = [
    de.version.version(info.version),
    de.version.commit(info.commit || de.version.commitUnknown),
    ...(date === null ? [] : [de.version.builtAt(date)]),
  ];

  return (
    <footer className="mt-auto border-t border-border pt-4">
      <p className="text-sm text-text-muted">{parts.join(de.version.separator)}</p>
    </footer>
  );
}
