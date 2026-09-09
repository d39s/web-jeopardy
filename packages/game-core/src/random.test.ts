import { describe, expect, it } from 'vitest';
import { MAX_SEED, createRandom, createSeed, formatSeed, parseSeed } from './random';

describe('reproduzierbarer zufall', () => {
  it('liefert zur selben nummer dieselbe folge', () => {
    const first = Array.from({ length: 10 }, () => createRandom(4711).next());
    const second = Array.from({ length: 10 }, () => createRandom(4711).next());

    expect(first).toEqual(second);
  });

  it('liefert zu verschiedenen nummern verschiedene folgen', () => {
    const first = Array.from({ length: 10 }, () => createRandom(1).next());
    const second = Array.from({ length: 10 }, () => createRandom(2).next());

    expect(first).not.toEqual(second);
  });

  it('bleibt im bereich zwischen null und eins', () => {
    const random = createRandom(99);

    for (let index = 0; index < 500; index++) {
      const value = random.next();
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });

  it('würfelt ganzzahlen unterhalb der schranke', () => {
    const random = createRandom(7);

    for (let index = 0; index < 500; index++) {
      const value = random.int(5);
      expect(Number.isInteger(value)).toBe(true);
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(5);
    }
  });

  it('gibt bei einer schranke von null keine negative zahl zurück', () => {
    expect(createRandom(7).int(0)).toBe(0);
  });

  it('mischt reproduzierbar und lässt die eingabe unangetastet', () => {
    const input = ['a', 'b', 'c', 'd', 'e', 'f'];

    const first = createRandom(123).shuffle(input);
    const second = createRandom(123).shuffle(input);

    expect(first).toEqual(second);
    expect(input).toEqual(['a', 'b', 'c', 'd', 'e', 'f']);
    expect([...first].sort()).toEqual(input);
  });

  it('erzeugt nummern im gültigen bereich', () => {
    for (let index = 0; index < 50; index++) {
      const seed = createSeed();
      expect(seed).toBeGreaterThanOrEqual(0);
      expect(seed).toBeLessThanOrEqual(MAX_SEED);
      expect(Number.isInteger(seed)).toBe(true);
    }
  });

  it('schreibt und liest eine nummer verlustfrei', () => {
    for (const seed of [0, 1, 42, 123456, MAX_SEED]) {
      expect(parseSeed(formatSeed(seed))).toBe(seed);
    }
  });

  it('weist unbrauchbare nummern ab', () => {
    expect(parseSeed('')).toBeNull();
    expect(parseSeed('-1')).toBeNull();
    expect(parseSeed('zzzzzzzz')).toBeNull();
    // 7 Zeichen zur Basis 36 passen in die Länge, sprengen aber den Wertebereich.
    expect(parseSeed('zzzzzzz')).toBeNull();
    expect(parseSeed('  1z9k2p  ')).toBe(parseSeed('1z9k2p'));
  });
});
