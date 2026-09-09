/**
 * Angaben zum ausgelieferten Stand. Der Wert wird beim Bauen fest eingesetzt –
 * siehe buildInfo() in apps/web/vite.config.ts.
 */
declare const __BUILD_INFO__: {
  /** Projektversion nach SemVer aus der package.json im Wurzelverzeichnis. */
  readonly version: string;
  /** Kurzer Commit-Hash, leer wenn beim Bauen kein Git verfügbar war. */
  readonly commit: string;
  /** Zeitpunkt des Builds als ISO-8601-Zeichenkette. */
  readonly builtAt: string;
};
