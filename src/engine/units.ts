import type { Unit } from './types';

export type UnitKind = 'mass' | 'volume' | 'spoon' | 'count' | 'taste' | 'other';

const COUNT_UNITS = new Set(['egg', 'orange', 'large_orange']);

export function unitKind(unit: Unit): UnitKind {
  if (unit === 'g') return 'mass';
  if (unit === 'ml') return 'volume';
  if (unit === 'tsp' || unit === 'tbsp') return 'spoon';
  if (COUNT_UNITS.has(unit)) return 'count';
  if (unit === 'to_taste') return 'taste';
  return 'other';
}

/** Human label for a unit at a given amount (handles plurals). */
export function unitLabel(unit: Unit, amount: number | null): string {
  const one = amount !== null && Math.abs(amount - 1) < 1e-9;
  switch (unit) {
    case 'g': return 'g';
    case 'ml': return 'mL';
    case 'tsp': return 'tsp';
    case 'tbsp': return 'tbsp';
    case 'egg': return one ? 'egg' : 'eggs';
    case 'orange': return one ? 'orange' : 'oranges';
    case 'large_orange': return one ? 'large orange' : 'large oranges';
    case 'to_taste': return 'to taste';
    default: return unit.replace(/_/g, ' ');
  }
}

/** Convert a canonical-unit amount to a value comparable with grams, if the ingredient carries a ratio. */
export function scaleEquivalent(seedAmount: number | null, seedGrams: number | undefined, newAmount: number | null): number | null {
  if (seedGrams === undefined || seedAmount === null || newAmount === null) return null;
  if (seedAmount === 0) return null;
  return (seedGrams * newAmount) / seedAmount;
}
