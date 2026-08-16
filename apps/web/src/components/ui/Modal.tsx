import { useCallback, useEffect, useRef } from 'react';
import type { MouseEvent, ReactNode } from 'react';
import { cn } from '../../lib/cn';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  /** ID der Überschrift im Inhalt – verbindet Dialog und Titel für Screenreader. */
  labelledBy: string;
  className?: string;
  children: ReactNode;
}

/**
 * Dialog auf Basis des nativen `<dialog>`-Elements: Fokusfalle, ESC-Handling
 * und Top-Layer kommen damit vom Browser, ohne zusätzliche Bibliothek.
 * Der Inhalt wird nur bei geöffnetem Dialog gerendert.
 */
export function Modal({ open, onClose, labelledBy, className, children }: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleClose = () => onClose();
    dialog.addEventListener('close', handleClose);
    return () => dialog.removeEventListener('close', handleClose);
  }, [onClose]);

  // Klick auf den Bereich außerhalb des Inhalts (Backdrop) schließt den Dialog.
  const handleClick = useCallback(
    (event: MouseEvent<HTMLDialogElement>) => {
      if (event.target === dialogRef.current) onClose();
    },
    [onClose],
  );

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={labelledBy}
      onClick={handleClick}
      className={cn(
        'm-auto w-[min(60rem,92vw)] rounded-card border border-border bg-surface',
        'p-6 text-text shadow-card sm:p-10',
        className,
      )}
    >
      {open ? children : null}
    </dialog>
  );
}
