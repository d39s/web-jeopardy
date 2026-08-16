import { useState } from 'react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { TextField } from '../../components/ui/TextField';
import { de } from '../../i18n/de';
import { cn } from '../../lib/cn';

/**
 * Ersatzweg für Umgebungen ohne Zwischenablage-API (kein HTTPS, älterer
 * Browser, verweigerte Berechtigung): Der Text wird in einem unsichtbaren Feld
 * markiert und über das alte Kopier-Kommando übernommen.
 */
function copyViaSelection(text: string): boolean {
  const area = document.createElement('textarea');
  area.value = text;
  area.setAttribute('readonly', '');
  area.style.position = 'fixed';
  area.style.opacity = '0';
  document.body.append(area);
  area.select();

  try {
    return typeof document.execCommand === 'function' && document.execCommand('copy');
  } catch {
    return false;
  } finally {
    area.remove();
  }
}

export async function copyToClipboard(text: string): Promise<boolean> {
  const clipboard: Clipboard | undefined = navigator.clipboard;
  if (typeof clipboard?.writeText === 'function') {
    try {
      await clipboard.writeText(text);
      return true;
    } catch {
      // Kein Zugriff – der Ersatzweg bekommt noch eine Chance.
    }
  }
  return copyViaSelection(text);
}

export interface ShareSectionProps {
  /** Link zur aktuellen Einstellung; null, solange sich nichts teilen lässt. */
  link: string | null;
  /** Ein eigenes Fragenset ist geladen – das passt in keine Adresszeile. */
  uploadWarning?: boolean;
  /** Der aufgerufene Link enthielt nichts Verwertbares. */
  invalidLink?: boolean;
}

type CopyState = 'idle' | 'copied' | 'failed';

const copyMessages: Record<CopyState, string> = {
  idle: '',
  copied: de.setup.shareCopied,
  failed: de.setup.shareFailed,
};

/** Teilen-Bereich der Startseite: zeigt den Link zur aktuellen Konfiguration. */
export function ShareSection({
  link,
  uploadWarning = false,
  invalidLink = false,
}: ShareSectionProps) {
  const [copied, setCopied] = useState<CopyState>('idle');

  const copy = async () => {
    if (link === null) return;
    setCopied((await copyToClipboard(link)) ? 'copied' : 'failed');
  };

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-xl font-bold">{de.setup.shareHeading}</h2>
      <p className="text-sm text-text-muted">{de.setup.shareHint}</p>

      {invalidLink ? (
        <Card className="border-negative/40 p-4">
          <p className="text-sm text-negative">{de.setup.sharedInvalid}</p>
        </Card>
      ) : null}

      {uploadWarning ? (
        <Card className="p-4">
          <p className="text-sm text-text-muted">{de.setup.shareUploadWarning}</p>
        </Card>
      ) : link === null ? (
        <p className="text-sm text-text-muted">{de.setup.startHint}</p>
      ) : (
        <Card className="flex flex-col gap-3 p-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-64 flex-1">
              <TextField
                label={de.setup.shareLinkLabel}
                value={link}
                readOnly
                onFocus={(event) => event.target.select()}
              />
            </div>
            <Button variant="primary" onClick={() => void copy()}>
              {de.setup.shareCopy}
            </Button>
          </div>

          {/* Dauerhaft im DOM, damit Screenreader die Rückmeldung ansagen. */}
          <p
            aria-live="polite"
            className={cn('min-h-5 text-sm', copied === 'failed' ? 'text-negative' : 'text-cat-4')}
          >
            {copyMessages[copied]}
          </p>
        </Card>
      )}
    </section>
  );
}
