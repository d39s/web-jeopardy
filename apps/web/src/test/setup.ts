import '@testing-library/jest-dom/vitest';
import { beforeEach } from 'vitest';

/**
 * Die Oberfläche merkt sich Einstellungen im localStorage. Jeder Test beginnt
 * daher mit leerem Speicher – sonst trägt eine gemerkte Partie in den nächsten.
 */
beforeEach(() => {
  try {
    globalThis.localStorage?.clear();
  } catch {
    // Ohne Speicher gibt es nichts aufzuräumen.
  }
});

/**
 * jsdom implementiert `<dialog>` nur teilweise. Damit Komponententests dasselbe
 * Verhalten sehen wie der Browser, werden die fehlenden Methoden ergänzt.
 */
if (typeof HTMLDialogElement !== 'undefined') {
  const proto = HTMLDialogElement.prototype;

  if (typeof proto.showModal !== 'function') {
    proto.showModal = function showModal(this: HTMLDialogElement) {
      this.open = true;
    };
  }
  if (typeof proto.close !== 'function') {
    proto.close = function close(this: HTMLDialogElement) {
      this.open = false;
      this.dispatchEvent(new Event('close'));
    };
  }
}
