import { describe, expect, it } from 'vitest';
import { CATEGORY_COLORS, categoryColorAt } from './colors';

describe('kategoriefarben', () => {
  it('enthält exakt die fünf vorgegebenen farben in fester reihenfolge', () => {
    expect(CATEGORY_COLORS).toEqual(['#2EC4B6', '#FF7F50', '#B388EB', '#7AE582', '#FFD166']);
  });

  it('ordnet jeder spalte des 5x5-spielfelds eine eigene farbe zu', () => {
    const colors = [0, 1, 2, 3, 4].map(categoryColorAt);
    expect(new Set(colors).size).toBe(5);
  });

  it('läuft bei mehr als fünf kategorien zyklisch weiter', () => {
    expect(categoryColorAt(5)).toBe(categoryColorAt(0));
    expect(categoryColorAt(-1)).toBe(categoryColorAt(4));
  });
});
