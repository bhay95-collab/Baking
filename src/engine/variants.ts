import { SEED } from './seed';
import { ingKey } from './scale';
import type { Recipe, Tweaks, Variant } from './types';

export const newId = (prefix = 'v') => `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;

/** Keep only amounts that differ from the seed, so a variant records edits, never a full copy. */
export function diffAmounts(recipe: Recipe, amounts: Record<string, number>): Record<string, number> {
  const out: Record<string, number> = {};
  for (const c of recipe.components)
    for (const i of c.ingredients) {
      const k = ingKey(c, i);
      if (i.amount !== null && k in amounts && Number.isFinite(amounts[k]) && amounts[k] >= 0 && Math.abs(amounts[k] - i.amount) > 1e-9) out[k] = amounts[k];
    }
  return out;
}

export function createVariant(
  base: Recipe,
  name: string,
  amounts: Record<string, number>,
  tweaks: Partial<Tweaks> = {},
  now: Date = new Date(),
): Variant {
  const iso = now.toISOString();
  return {
    id: newId('v'),
    name: name.trim() || `${base.name} (my version)`,
    baseId: base.id,
    baseSeedVersion: SEED.schema_version,
    version: 1,
    createdAt: iso,
    updatedAt: iso,
    amounts: diffAmounts(base, amounts),
    tweaks: { ...tweaks },
  };
}

/** New version of the same variant. */
export function updateVariant(v: Variant, base: Recipe, patch: { name?: string; amounts?: Record<string, number>; tweaks?: Partial<Tweaks> }, now: Date = new Date()): Variant {
  return {
    ...v,
    name: patch.name?.trim() || v.name,
    amounts: patch.amounts ? diffAmounts(base, patch.amounts) : v.amounts,
    tweaks: patch.tweaks ?? v.tweaks,
    version: v.version + 1,
    updatedAt: now.toISOString(),
  };
}

export function duplicateVariant(v: Variant, now: Date = new Date()): Variant {
  const iso = now.toISOString();
  return { ...v, id: newId('v'), name: `${v.name} (copy)`, version: 1, createdAt: iso, updatedAt: iso, amounts: { ...v.amounts }, tweaks: { ...v.tweaks } };
}
