import { allIngredients, calculateDoughMass } from './scale';
import { FLOUR_ROLES, RICE_ROLES } from './roles';
import type { ScaledIngredient, ScaledRecipe } from './types';

const sum = (xs: ScaledIngredient[]) => xs.reduce((a, i) => a + (i.grams ?? 0), 0);
const byRole = (s: ScaledRecipe, ...roles: string[]) => allIngredients(s).filter((i) => i.role && roles.includes(i.role));
const inComponent = (s: ScaledRecipe, compId: string) => s.components.find((c) => c.id === compId)?.ingredients ?? [];
const pct = (n: number, d: number) => (d > 0 ? (100 * n) / d : 0);

/* ---------- pure formulas ---------- */

export interface StarterBreakdown {
  starterFlour: number;
  starterWater: number;
  totalFlour: number;
  totalWater: number;
  /** (added + starter water) / (added + starter flour) × 100 */
  effectiveHydrationPct: number;
  /** added water / added flour × 100 (the source table view) */
  addedWaterPct: number;
  starterPct: number;
  prefermentedFlourPct: number;
}

/** Sourdough: starter hydration H (decimal, 1 = 100 %). Starter flour/water are NOT extra dough mass. */
export function calculateEffectiveHydration(input: {
  addedFlour: number;
  addedWater: number;
  starter: number;
  starterHydration: number;
}): StarterBreakdown {
  const { addedFlour, addedWater, starter, starterHydration: h } = input;
  const starterFlour = starter / (1 + h);
  const starterWater = (starter * h) / (1 + h);
  const totalFlour = addedFlour + starterFlour;
  const totalWater = addedWater + starterWater;
  return {
    starterFlour,
    starterWater,
    totalFlour,
    totalWater,
    effectiveHydrationPct: pct(totalWater, totalFlour),
    addedWaterPct: pct(addedWater, addedFlour),
    starterPct: pct(starter, addedFlour),
    prefermentedFlourPct: pct(starterFlour, totalFlour),
  };
}

export interface PrefermentBreakdown {
  poolishFlour: number;
  poolishWater: number;
  poolishMass: number;
  poolishHydrationPct: number;
  finalFlour: number;
  finalWater: number;
  totalFlour: number;
  totalWater: number;
  overallHydrationPct: number;
  prefermentedFlourPct: number;
}

/** Pizza: poolish ingredients count once toward totals; handing the poolish to the final mix is a transfer. */
export function calculatePreferment(s: ScaledRecipe, poolishId = 'poolish'): PrefermentBreakdown {
  const pool = inComponent(s, poolishId);
  const rest = s.components.filter((c) => c.id !== poolishId).flatMap((c) => c.ingredients);
  const sumRole = (xs: ScaledIngredient[], role: string) => sum(xs.filter((i) => i.role === role));
  const poolishFlour = sumRole(pool, 'flour');
  const poolishWater = sumRole(pool, 'water');
  const finalFlour = sumRole(rest, 'flour');
  const finalWater = sumRole(rest, 'water');
  const totalFlour = poolishFlour + finalFlour;
  const totalWater = poolishWater + finalWater;
  return {
    poolishFlour,
    poolishWater,
    poolishMass: sum(pool),
    poolishHydrationPct: pct(poolishWater, poolishFlour),
    finalFlour,
    finalWater,
    totalFlour,
    totalWater,
    overallHydrationPct: pct(totalWater, totalFlour),
    prefermentedFlourPct: pct(poolishFlour, totalFlour),
  };
}

export function starterBreakdown(s: ScaledRecipe): StarterBreakdown | null {
  const starter = byRole(s, 'starter')[0];
  if (!starter || starter.grams === null) return null;
  const h = ((s.recipe.derived?.starter_hydration_percent as number | undefined) ?? 100) / 100;
  return calculateEffectiveHydration({
    addedFlour: sum(byRole(s, ...FLOUR_ROLES)),
    addedWater: sum(byRole(s, 'water')),
    starter: starter.grams,
    starterHydration: h,
  });
}

/* ---------- ratio basis ---------- */

export type BasisMode = 'recipe' | 'total';

/** Recipes where a second denominator is meaningful. */
export function hasAlternateBasis(s: ScaledRecipe): boolean {
  return s.recipe.id === 'classic_sourdough' || s.recipe.id === 'croissant_red';
}

export function basisLabel(s: ScaledRecipe, mode: BasisMode): string {
  if (s.recipe.id === 'classic_sourdough') return mode === 'recipe' ? 'Added flour (source table)' : 'Effective total flour (incl. starter flour)';
  if (s.recipe.id === 'croissant_red') return mode === 'recipe' ? 'Main dough flour (red sheet is extra)' : 'All flour incl. red sheet';
  return s.recipe.ratio_basis.label;
}

/** Denominator in grams, computed from the actual (scaled, possibly edited) ingredients. */
export function basisGrams(s: ScaledRecipe, mode: BasisMode = 'recipe'): number {
  if (s.recipe.ratio_basis.unit === 'g_rice') return sum(byRole(s, ...RICE_ROLES));
  if (s.recipe.id === 'classic_sourdough') {
    const added = sum(byRole(s, ...FLOUR_ROLES));
    if (mode === 'recipe') return added;
    return starterBreakdown(s)?.totalFlour ?? added;
  }
  if (s.recipe.id === 'croissant_red' && mode === 'recipe') return sum(inComponent(s, 'detrempe').filter((i) => i.role === 'flour'));
  return sum(byRole(s, ...FLOUR_ROLES));
}

export interface RatioRow {
  key: string;
  name: string;
  grams: number | null;
  percent: number | null;
  approximate: boolean;
  componentId: string;
}

/** Ratio % per ingredient — always from exact scaled grams, never from stored/rounded percentages. */
export function ratioRows(s: ScaledRecipe, mode: BasisMode = 'recipe'): RatioRow[] {
  const denom = basisGrams(s, mode);
  return s.components.flatMap((c) =>
    c.ingredients.map((i) => ({
      key: i.key,
      name: i.name,
      grams: i.grams,
      percent: i.grams !== null && denom > 0 ? (100 * i.grams) / denom : null,
      approximate: i.gramsApproximate,
      componentId: c.id,
    })),
  );
}

/* ---------- headline metrics ---------- */

export type MetricFormat = 'g' | 'ml' | 'pct' | 'count' | 'text';
export interface Metric {
  id: string;
  label: string;
  value: number | null;
  format: MetricFormat;
  text?: string;
  approx?: boolean;
  hint?: string;
  /** Percentage decimals (default 1). */
  decimals?: number;
}

const m = (id: string, label: string, value: number | null, format: MetricFormat, extra: Partial<Metric> = {}): Metric => ({
  id,
  label,
  value,
  format,
  ...extra,
});

/** Only the metrics that apply to this recipe. */
export function computeMetrics(s: ScaledRecipe, opts: { stockPerG?: number } = {}): Metric[] {
  const mass = calculateDoughMass(s);
  const flourAll = sum(byRole(s, ...FLOUR_ROLES));
  const salt = sum(byRole(s, 'salt'));
  const out: Metric[] = [];

  switch (s.recipe.id) {
    case 'classic_sourdough': {
      const b = starterBreakdown(s)!;
      out.push(
        m('dough', 'Dough weight', mass.grams, 'g', { approx: mass.approximate }),
        m('hyd', 'True hydration', b.effectiveHydrationPct, 'pct', { decimals: 2, hint: 'Includes water in the starter' }),
        m('addedhyd', 'Added-water ratio', b.addedWaterPct, 'pct', { decimals: 2, hint: 'Source table: added water ÷ added flour' }),
        m('flour', 'Total flour', b.totalFlour, 'g', { hint: 'Added + starter flour' }),
        m('salt', 'Salt', pct(salt, flourAll), 'pct', { decimals: 2, hint: '% of added flour' }),
        m('pref', 'Prefermented flour', b.prefermentedFlourPct, 'pct', { decimals: 2 }),
      );
      break;
    }
    case 'poolish_pizza': {
      const p = calculatePreferment(s);
      out.push(
        m('dough', 'Final dough weight', mass.grams, 'g', { approx: mass.approximate }),
        m('poolish', 'Poolish weight', p.poolishMass, 'g', { hint: 'Use all of it — not just 600 g' }),
        m('flour', 'Total flour', p.totalFlour, 'g'),
        m('hyd', 'Overall hydration', p.overallHydrationPct, 'pct'),
        m('salt', 'Salt', pct(salt, p.totalFlour), 'pct'),
        m('pref', 'Prefermented flour', p.prefermentedFlourPct, 'pct'),
      );
      break;
    }
    case 'bens_focaccia': {
      const oil = sum(byRole(s, 'fat'));
      out.push(
        m('dough', 'Dough weight', mass.grams, 'g', { approx: true, hint: 'Oil converted at 0.91 g/mL' }),
        m('hyd', 'Water hydration', pct(sum(byRole(s, 'water')), flourAll), 'pct', { hint: 'Oil is not water' }),
        m('oil', 'Dough oil', pct(oil, flourAll), 'pct', { approx: true, hint: '% of flour, by estimated mass' }),
        m('salt', 'Salt', pct(salt, flourAll), 'pct'),
        m('flour', 'Total flour', flourAll, 'g'),
      );
      break;
    }
    case 'bens_raisin_bread': {
      out.push(
        m('dough', 'Dough weight', mass.grams, 'g', { approx: true }),
        m('hyd', 'Nominal hydration', pct(sum(byRole(s, 'water')), flourAll), 'pct', { hint: 'Sultanas absorb some water' }),
        m('fruit', 'Sultanas', pct(sum(byRole(s, 'inclusion')), flourAll), 'pct', { hint: '% of flour' }),
        m('salt', 'Salt', pct(salt, flourAll), 'pct'),
        m('flour', 'Total flour', flourAll, 'g'),
      );
      break;
    }
    case 'hot_cross_buns': {
      const fruit = sum(byRole(s, 'inclusion'));
      const bun = s.recipe.yield.count ?? 12;
      out.push(
        m('buns', 'Buns', bun * s.factor, 'count', { hint: 'Source yield × scale' }),
        m('flour', 'Dough flour', flourAll, 'g', { hint: 'Excludes the extra working flour' }),
        m('fruit', 'Dried fruit', fruit, 'g'),
        m('fruitpct', 'Fruit', pct(fruit, flourAll), 'pct', { hint: '% of dough flour' }),
        m('butter', 'Butter', pct(sum(byRole(s, 'fat')), flourAll), 'pct'),
        m('sugar', 'Sugar', pct(sum(byRole(s, 'sugar')), flourAll), 'pct'),
        m('hyd', 'Hydration', null, 'text', { text: 'Not quantified', hint: 'Orange juice and egg water have no stated mass' }),
      );
      break;
    }
    case 'croissant_classic':
    case 'croissant_red': {
      const det = inComponent(s, 'detrempe');
      const detFlour = sum(det.filter((i) => i.role === 'flour'));
      const liquid = sum(det.filter((i) => i.role === 'liquid' || i.role === 'water'));
      const lam = sum(byRole(s, 'laminating_fat'));
      const [lo, hi] = s.recipe.yield.count_range ?? [14, 16];
      out.push(
        m('dough', 'Formula weight', mass.grams, 'g', { approx: mass.approximate, hint: 'Excludes egg wash (not specified)' }),
        m('liquid', 'Milk + water', pct(liquid, detFlour), 'pct', { decimals: 2, hint: 'Liquid loading, not true water hydration' }),
        m('lam', 'Lamination butter', pct(lam, detFlour), 'pct', { hint: '% of main dough flour' }),
        m('flour', 'Total flour', flourAll, 'g'),
        m('yield', 'Estimated yield', null, 'text', { text: `${Math.round(lo * s.factor)}–${Math.round(hi * s.factor)}`, approx: true, hint: 'Medium croissants (estimate)' }),
      );
      break;
    }
    case 'classic_risotto': {
      const rice = sum(byRole(s, ...RICE_ROLES));
      const stock = byRole(s, 'stock')[0];
      const wine = byRole(s, 'wine')[0];
      out.push(
        m('rice', 'Dry rice', rice, 'g'),
        m('stock', 'Planned stock', stock?.amount ?? null, 'ml', { approx: true, hint: 'Planning amount — keep extra hot' }),
        m('stockratio', 'Stock per g rice', opts.stockPerG ?? (rice > 0 && stock?.amount ? stock.amount / rice : null), 'text', {
          text: `${(opts.stockPerG ?? (stock?.amount ?? 0) / (rice || 1)).toFixed(2).replace(/0$/, '')} mL/g`,
          hint: 'Adjustable 3.5–4.25',
        }),
        m('wine', 'Wine', wine?.amount ?? null, 'ml'),
      );
      break;
    }
    default:
      out.push(m('dough', 'Total weight', mass.grams, 'g', { approx: mass.approximate }));
  }
  return out;
}

/* ---------- cross-recipe comparison (Ratio Lab) ---------- */

export interface RecipeShares {
  hydration: number | null;
  /** What `hydration` actually means for this recipe. */
  hydrationKind: string;
  salt: number | null;
  yeast: number | null;
  fat: number | null;
  sugar: number | null;
  prefermented: number | null;
}

/** Comparable figures, each against the recipe's own flour. Rice recipes return nulls (not baker's maths). */
export function recipeShares(s: ScaledRecipe): RecipeShares {
  const nul: RecipeShares = { hydration: null, hydrationKind: 'n/a', salt: null, yeast: null, fat: null, sugar: null, prefermented: null };
  if (s.recipe.ratio_basis.unit === 'g_rice') return nul;
  const flour = sum(byRole(s, ...FLOUR_ROLES));
  if (flour <= 0) return nul;
  const of = (...roles: string[]) => pct(sum(byRole(s, ...roles)), flour);
  const base: RecipeShares = {
    ...nul,
    salt: of('salt'),
    yeast: of('yeast'),
    fat: of('fat', 'laminating_fat'),
    sugar: of('sugar'),
    hydration: of('water'),
    hydrationKind: 'water ÷ flour',
  };
  switch (s.recipe.id) {
    case 'classic_sourdough': {
      const b = starterBreakdown(s)!;
      return { ...base, hydration: b.effectiveHydrationPct, hydrationKind: 'true (incl. starter)', prefermented: b.prefermentedFlourPct, salt: pct(sum(byRole(s, 'salt')), b.totalFlour) };
    }
    case 'poolish_pizza': {
      const p = calculatePreferment(s);
      return { ...base, hydration: p.overallHydrationPct, prefermented: p.prefermentedFlourPct };
    }
    case 'hot_cross_buns':
      return { ...base, hydration: null, hydrationKind: 'not quantified' };
    case 'croissant_classic':
    case 'croissant_red': {
      const det = inComponent(s, 'detrempe');
      const df = sum(det.filter((i) => i.role === 'flour'));
      const liq = sum(det.filter((i) => i.role === 'liquid' || i.role === 'water'));
      return { ...base, hydration: pct(liq, df), hydrationKind: 'milk + water (loading)', salt: pct(sum(det.filter((i) => i.role === 'salt')), df), yeast: pct(sum(det.filter((i) => i.role === 'yeast')), df), fat: pct(sum(byRole(s, 'fat', 'laminating_fat').filter((i) => i.componentId !== 'red_sheet')), df), sugar: pct(sum(det.filter((i) => i.role === 'sugar')), df) };
    }
    case 'bens_raisin_bread':
      return { ...base, hydrationKind: 'nominal water ÷ flour' };
    default:
      return base;
  }
}
