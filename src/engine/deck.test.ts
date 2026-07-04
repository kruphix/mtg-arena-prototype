import { describe, expect, it } from 'vitest';
import { buildStandardDeck, shuffle } from './deck';

describe('deck', () => {
  it('builds a 40 card deck with 17 lands', () => {
    const deck = buildStandardDeck();
    expect(deck).toHaveLength(40);
    const lands = deck.filter((c) => c.defId === 'ashcrag' || c.defId === 'mistpool');
    expect(lands).toHaveLength(17);
  });

  it('every card instance has a unique instanceId', () => {
    const deck = buildStandardDeck();
    const ids = new Set(deck.map((c) => c.instanceId));
    expect(ids.size).toBe(deck.length);
  });

  it('shuffle preserves all elements and can reorder deterministically', () => {
    const items = [1, 2, 3, 4, 5];
    let seed = 42;
    const rng = () => {
      seed = (seed * 1103515245 + 12345) % 2147483648;
      return seed / 2147483648;
    };
    const shuffled = shuffle(items, rng);
    expect(shuffled.slice().sort()).toEqual(items.slice().sort());
    expect(shuffled).not.toEqual(items);
  });
});
