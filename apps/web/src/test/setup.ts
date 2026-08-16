import '@testing-library/jest-dom/vitest';

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
