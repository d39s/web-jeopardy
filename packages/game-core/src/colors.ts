/**
 * Kategoriepalette – exakt die fünf in den Anforderungen vorgegebenen Farben.
 * Dies ist die einzige Stelle im Projekt, an der diese Hex-Werte stehen dürfen.
 */
export const CATEGORY_COLORS = ['#2EC4B6', '#FF7F50', '#B388EB', '#7AE582', '#FFD166'] as const;

export type CategoryColor = (typeof CATEGORY_COLORS)[number];

/** Farbe einer Kategorie anhand ihrer Position im Spielfeld (0–4, danach zyklisch). */
export function categoryColorAt(index: number): CategoryColor {
  const palette = CATEGORY_COLORS;
  const safeIndex = ((index % palette.length) + palette.length) % palette.length;
  return palette[safeIndex] as CategoryColor;
}
