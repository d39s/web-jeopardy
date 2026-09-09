import type { GameDefinition } from '@jeopardy/game-core';
import { de } from '../../i18n/de';
import { cn } from '../../lib/cn';

export interface UploadSectionProps {
  uploaded: GameDefinition | null;
  onUpload: (file: File) => void;
}

/**
 * Eigenes Fragenset statt gezogenem Brett. Ein hochgeladenes Set ist ein
 * fertiges 5x5-Spielfeld: Regler und Ziehung greifen daran nicht mehr, deshalb
 * steht der Abschnitt hinter ihnen und nicht dazwischen.
 */
export function UploadSection({ uploaded, onUpload }: UploadSectionProps) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-xl font-bold">{de.setup.uploadHeading}</h2>
      <p className="text-sm text-text-muted">{de.setup.uploadHint}</p>

      <label className="mt-1 flex w-fit flex-col gap-1 text-sm text-text-muted">
        {de.setup.uploadLabel}
        <input
          type="file"
          accept="application/json,.json"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) onUpload(file);
            event.target.value = '';
          }}
          className={cn(
            'rounded-btn border border-border bg-surface-hi p-2 text-text',
            'file:mr-3 file:rounded-btn file:border-0 file:bg-cat-1 file:px-3 file:py-1',
            'file:font-semibold file:text-bg',
          )}
        />
      </label>

      {uploaded ? (
        <p className="text-sm text-cat-4">{de.setup.uploadSuccess(uploaded.title)}</p>
      ) : null}
    </section>
  );
}
