import raw from '../data/inclusions.json';
import { allIngredients } from './scale';
import { FLOUR_ROLES } from './roles';
import type { Recipe, ScaledComponent, ScaledIngredient, ScaledRecipe } from './types';

export type Strength = 'light' | 'classic' | 'loaded';
export const STRENGTHS: Strength[] = ['light', 'classic', 'loaded'];
export type InclusionKind = 'bulk' | 'flavour';

export interface InclusionDef {
  id: string;
  name: string;
  category: string;
  kind: InclusionKind;
  /** % of the flour weighed into the dough. */
  light: number;
  classic: number;
  loaded: number;
  prep: string;
}

export interface InclusionLibrary {
  version: string;
  note: string;
  caps_pct: Record<Strength, number>;
  categories: { id: string; label: string }[];
  items: InclusionDef[];
}

export const INCLUSIONS = raw as InclusionLibrary;

/**
 * The user picked this inclusion. `pct` is their own override of the suggestion, kept as a % of
 * flour (not grams) so it still scales when they change the batch size.
 */
export interface InclusionPick {
  id: string;
  pct?: number;
}

/** An inclusion the library does not know, defined by the user as a % of flour. */
export interface CustomInclusion {
  id: string;
  name: string;
  pct: number;
}

export interface PlanItem {
  id: string;
  name: string;
  kind: InclusionKind;
  custom: boolean;
  /** Final amount for this batch, in grams. */
  grams: number;
  /** What the tool would suggest (after any combined-amount cap). */
  suggestedGrams: number;
  /** Final amount as a % of flour. */
  pct: number;
  edited: boolean;
  prep?: string;
}

export interface InclusionPlan {
  flourG: number;
  items: PlanItem[];
  totalGrams: number;
  /** Bulk inclusions only (flavourings are too small to count toward handling). */
  bulkPct: number;
  capPct: number;
  /** Suggested bulk amounts were scaled down to stay within the cap. */
  reduced: boolean;
  /** Bulk amounts before any scaling down. */
  uncappedBulkPct: number;
  /** Final bulk amounts (including the user's own) are heavy enough to hurt the dough. */
  overLimit: boolean;
}

/** Above this, bulk inclusions tear gluten and slow the rise even in a strong dough. */
export const HARD_LIMIT_PCT = 40;

export function supportsInclusions(recipe: Recipe): boolean {
  return ['sourdough', 'focaccia', 'enriched_bread', 'pizza'].includes(recipe.category);
}

export function findInclusion(id: string): InclusionDef | undefined {
  return INCLUSIONS.items.find((i) => i.id === id);
}

/**
 * Kitchen-friendly rounding: halves of a gram for pinches, whole grams up to 50 g,
 * then fives. The raw percentage is never rounded; only the suggestion is.
 */
export function roundSuggestion(grams: number, kind: InclusionKind): number {
  if (!(grams > 0)) return 0;
  if (grams < 10) return Math.max(0.5, Math.round(grams * 2) / 2);
  if (grams < 50 || kind === 'flavour') return Math.round(grams);
  return Math.round(grams / 5) * 5;
}

/** Total flour weighed into the dough (not counting flour inside a starter). */
export function doughFlour(scaled: ScaledRecipe): number {
  return allIngredients(scaled)
    .filter((i) => i.role && FLOUR_ROLES.includes(i.role) && i.grams !== null)
    .reduce((a, i) => a + (i.grams ?? 0), 0);
}

export function planInclusions(input: {
  flourG: number;
  strength: Strength;
  picks: InclusionPick[];
  customs?: CustomInclusion[];
}): InclusionPlan {
  const { flourG, strength, picks, customs = [] } = input;
  const capPct = INCLUSIONS.caps_pct[strength];

  interface Row { p: InclusionPick; name: string; kind: InclusionKind; pct: number; prep?: string; custom: boolean }
  const rows = picks.flatMap((p): Row[] => {
    const def = findInclusion(p.id);
    if (def) return [{ p, name: def.name, kind: def.kind, pct: def[strength], prep: def.prep, custom: false }];
    const c = customs.find((x) => x.id === p.id);
    if (c) return [{ p, name: c.name, kind: 'bulk', pct: c.pct, custom: true }];
    return [];
  });

  // Several bulk inclusions together are scaled down so the dough can still rise.
  const uncappedBulkPct = rows.filter((r) => r.kind === 'bulk').reduce((a, r) => a + r.pct, 0);
  const scale = uncappedBulkPct > capPct ? capPct / uncappedBulkPct : 1;

  const items: PlanItem[] = rows.map((r) => {
    const suggestedGrams = flourG > 0 ? roundSuggestion(((flourG * r.pct) / 100) * (r.kind === 'bulk' ? scale : 1), r.kind) : 0;
    const own = r.p.pct !== undefined && Number.isFinite(r.p.pct) && r.p.pct > 0 ? (flourG * r.p.pct) / 100 : null;
    const edited = own !== null && Math.abs(own - suggestedGrams) > 0.05;
    const grams = edited ? (own as number) : suggestedGrams;
    return {
      id: r.p.id,
      name: r.name,
      kind: r.kind,
      custom: r.custom,
      grams,
      suggestedGrams,
      pct: flourG > 0 ? (100 * grams) / flourG : 0,
      edited,
      prep: r.prep,
    };
  });

  const bulkPct = items.filter((i) => i.kind === 'bulk').reduce((a, i) => a + i.pct, 0);
  return {
    flourG,
    items,
    totalGrams: items.reduce((a, i) => a + i.grams, 0),
    bulkPct,
    capPct,
    reduced: scale < 1,
    uncappedBulkPct,
    overLimit: bulkPct > HARD_LIMIT_PCT + 1e-9,
  };
}

/** Whole numbers from 10% up (25.1% reads as 25%), one decimal below, two under 1%. */
export const pctText = (n: number) => `${n >= 10 ? Math.round(n) : +n.toFixed(n < 1 ? 2 : 1)}%`;

/**
 * Returns the scaled recipe with an extra "Inclusions" stage. The stage is excluded from dough
 * weight and hydration, but appears in the ingredient list, ratios and the print sheet.
 */
export function withInclusions(scaled: ScaledRecipe, plan: InclusionPlan): ScaledRecipe {
  if (plan.items.length === 0) return scaled;
  const ingredients: ScaledIngredient[] = plan.items.map((it) => ({
    key: `inclusions.${it.id}`,
    componentId: 'inclusions',
    id: it.id,
    name: it.name,
    role: 'inclusion_added',
    unit: 'g',
    seedAmount: null,
    baseAmount: scaled.factor > 0 ? it.grams / scaled.factor : it.grams,
    amount: it.grams,
    grams: it.grams,
    gramsApproximate: false,
    baseGrams: scaled.factor > 0 ? it.grams / scaled.factor : it.grams,
    note: [pctText(it.pct) + ' of flour', it.prep].filter(Boolean).join(' · '),
    status: it.edited ? 'personal_edit' : 'suggested',
    edited: it.edited,
    excludeFromMass: true,
  }));
  const stage: ScaledComponent = { id: 'inclusions', label: 'Inclusions', includeInDoughMass: false, ingredients };
  return { ...scaled, components: [...scaled.components, stage] };
}

export function validateInclusions(lib: InclusionLibrary): string[] {
  const errs: string[] = [];
  const cats = new Set(lib.categories.map((c) => c.id));
  const seen = new Set<string>();
  for (const s of STRENGTHS) if (!(lib.caps_pct[s] > 0)) errs.push(`caps_pct.${s} missing`);
  for (const i of lib.items) {
    if (seen.has(i.id)) errs.push(`duplicate id ${i.id}`);
    seen.add(i.id);
    if (!cats.has(i.category)) errs.push(`${i.id}: unknown category ${i.category}`);
    if (!['bulk', 'flavour'].includes(i.kind)) errs.push(`${i.id}: bad kind`);
    if (!(i.light > 0 && i.light < i.classic && i.classic < i.loaded)) errs.push(`${i.id}: need 0 < light < classic < loaded`);
    if (i.kind === 'flavour' && i.loaded > 3) errs.push(`${i.id}: flavourings should stay at or under 3%`);
    if (i.kind === 'bulk' && i.loaded > lib.caps_pct.loaded) errs.push(`${i.id}: loaded exceeds the cap`);
    if (!i.prep.trim()) errs.push(`${i.id}: missing prep note`);
  }
  return errs;
}
