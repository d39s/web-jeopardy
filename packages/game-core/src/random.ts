/**
 * Reproduzierbarer Zufall.
 *
 * Ein geteilter Link soll überall dasselbe Spielfeld ergeben – zwei Leute
 * moderieren sonst zwei verschiedene Partien. `Math.random` kann das nicht,
 * deshalb ein eigener Generator, der allein von der Ziehungsnummer abhängt.
 */

/** Ziehungsnummern sind 32 Bit ohne Vorzeichen – kurz genug für die Adresszeile. */
export const MAX_SEED = 0xffffffff;

export interface Random {
  /** Gleichverteilt in [0, 1). */
  next(): number;
  /** Ganzzahl in [0, bound); bei bound <= 0 immer 0. */
  int(bound: number): number;
  /** Neue, gemischte Liste – die Eingabe bleibt unangetastet. */
  shuffle<T>(items: readonly T[]): T[];
}

/**
 * mulberry32: klein, gleichmäßig genug für eine Ziehung und in jeder Sprache
 * nachbaubar. Für Kryptografie ist er ungeeignet – hier geht es nur darum,
 * dass dieselbe Nummer dieselbe Reihenfolge ergibt.
 */
export function createRandom(seed: number): Random {
  // Die Nummer wird erst durchmischt: Ohne das lägen benachbarte Ziehungen
  // dicht beieinander und 0 fiele mit 1 zusammen. Der Finalizer aus splitmix32
  // verteilt schon kleinste Unterschiede über alle 32 Bit.
  let state = seed >>> 0;
  state = Math.imul(state ^ (state >>> 16), 0x45d9f3b) >>> 0;
  state = Math.imul(state ^ (state >>> 16), 0x45d9f3b) >>> 0;
  state = (state ^ (state >>> 16)) >>> 0;

  const next = () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  const int = (bound: number) => (bound <= 0 ? 0 : Math.floor(next() * bound));

  return {
    next,
    int,
    shuffle<T>(items: readonly T[]): T[] {
      // Fisher-Yates von hinten nach vorn.
      const result = [...items];
      for (let index = result.length - 1; index > 0; index--) {
        const swap = int(index + 1);
        const a = result[index] as T;
        const b = result[swap] as T;
        result[index] = b;
        result[swap] = a;
      }
      return result;
    },
  };
}

/** Frische Ziehungsnummer für eine neue Partie. */
export function createSeed(): number {
  return Math.floor(Math.random() * (MAX_SEED + 1)) >>> 0;
}

/** Kurzform für Adresszeile und Anzeige, z. B. „1z9k2p". */
export function formatSeed(seed: number): string {
  return (seed >>> 0).toString(36);
}

/** Umkehrung von `formatSeed`; `null`, wenn nichts Brauchbares dasteht. */
export function parseSeed(value: string): number | null {
  const trimmed = value.trim().toLowerCase();
  if (!/^[0-9a-z]{1,7}$/.test(trimmed)) return null;

  const seed = Number.parseInt(trimmed, 36);
  return Number.isSafeInteger(seed) && seed >= 0 && seed <= MAX_SEED ? seed : null;
}
