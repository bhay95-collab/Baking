import raw from '../data/seed-recipes.json';
import { assertSeed } from './validate';
import type { Recipe, SeedLibrary } from './types';

function deepFreeze<T>(o: T): T {
  if (o && typeof o === 'object' && !Object.isFrozen(o)) {
    Object.freeze(o);
    for (const v of Object.values(o as Record<string, unknown>)) deepFreeze(v);
  }
  return o;
}

/** Validated, deeply frozen seed — the immutable originals. Never mutate. */
export const SEED: SeedLibrary = deepFreeze(assertSeed(structuredClone(raw)));

export const SEED_RECIPES: readonly Recipe[] = SEED.recipes;

export function getSeedRecipe(id: string): Recipe | undefined {
  return SEED.recipes.find((r) => r.id === id);
}

/** Display order and short names for the recipe chooser and index. */
export const TILE_ORDER: { id: string; tile: string; filter: string }[] = [
  { id: 'classic_sourdough', tile: 'White Sourdough', filter: 'Bread' },
  { id: 'sourdough_wheat_rye', tile: 'Wheat & Rye Sourdough', filter: 'Bread' },
  { id: 'poolish_pizza', tile: 'Poolish Pizza', filter: 'Pizza' },
  { id: 'bens_focaccia', tile: 'Focaccia', filter: 'Bread' },
  { id: 'bens_raisin_bread', tile: 'Raisin Bread', filter: 'Bread' },
  { id: 'hot_cross_buns', tile: 'Hot Cross Buns', filter: 'Bread' },
  { id: 'croissant_classic', tile: 'Classic Croissants', filter: 'Pastry' },
  { id: 'croissant_red', tile: 'Red Croissants', filter: 'Pastry' },
  { id: 'classic_risotto', tile: 'Risotto', filter: 'Rice' },
];
