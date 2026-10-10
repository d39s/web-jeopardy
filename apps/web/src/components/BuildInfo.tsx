import { Fragment, type ReactNode } from 'react';
import { de } from '../i18n/de';

/** Der Commit-Hash in der Fußzeile verlinkt auf den Stand in diesem Repository. */
export const REPOSITORY_URL = 'https://github.com/d39s/Web-jeopardy';

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
  // Ohne bekannten Commit gibt es nichts zu verlinken.
  const commit = info.commit ? (
    <a
      href={`${REPOSITORY_URL}/commit/${encodeURIComponent(info.commit)}`}
      target="_blank"
      rel="noreferrer"
      aria-label={de.version.commitLink(info.commit)}
      className="text-cat-1 underline underline-offset-4"
    >
      {info.commit}
    </a>
  ) : (
    de.version.commitUnknown
  );
  const parts: ReactNode[] = [
    de.version.version(info.version),
    <>
      {de.version.commit} {commit}
    </>,
    ...(date === null ? [] : [de.version.builtAt(date)]),
  ];

  return (
    <footer className="mt-auto border-t border-border pt-4">
      <p className="text-sm text-text-muted">
        {parts.map((part, index) => (
          <Fragment key={index}>
            {index > 0 && de.version.separator}
            {part}
          </Fragment>
        ))}
      </p>
    </footer>
  );
}
