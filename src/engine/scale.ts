import { RICE_ROLES } from './roles';
import { scaleEquivalent } from './units';
import {
  DEFAULT_TWEAKS,
  type Component,
  type Ingredient,
  type Recipe,
  type ScaledComponent,
  type ScaledIngredient,
  type ScaledRecipe,
  type Tweaks,
} from './types';

export const ingKey = (c: Pick<Component, 'id'>, i: Pick<Ingredient, 'id'>) => `${c.id}.${i.id}`;

export interface ScaleOptions {
  factor: number;
  /** Personal edits of base (factor 1) amounts. */
  amounts?: Record<string, number>;
  tweaks?: Partial<Tweaks>;
}

const EPS = 1e-9;

const BUILD_ROLES = ['build_seed', 'build_flour', 'build_water'] as const;

/** Which ingredient keys are driven by a tweak or a rule rather than a typed quantity. */
export function tweakDriven(recipe: Recipe, ing: Ingredient): 'stock' | 'colour' | 'build' | null {
  if (ing.role === 'stock' && recipe.ratio_basis.unit === 'g_rice') return 'stock';
  if (ing.role === 'colour') return 'colour';
  if (ing.role && (BUILD_ROLES as readonly string[]).includes(ing.role) && Array.isArray(recipe.derived?.starter_build_ratio)) return 'build';
  return null;
}

export interface StarterBuild {
  seed: number;
  flour: number;
  water: number;
  total: number;
  needed: number;
  spare: number;
}

/**
 * Size a starter build (seed : flour : water by `ratio`) so that after taking `neededG` for the
 * dough, what is left still seeds the next build of the same size plus `lossG` lost to the jar.
 * The seed is rounded up to a whole gram; flour and water follow the ratio exactly.
 */
export function starterBuild(neededG: number, ratio: readonly number[], lossG: number): StarterBuild {
  const [a, b, c] = ratio;
  const sum = a + b + c;
  const seed = Math.ceil((a * (neededG + lossG)) / (sum - a) - 1e-9);
  const flour = (seed * b) / a;
  const water = (seed * c) / a;
  const total = seed + flour + water;
  return { seed, flour, water, total, needed: neededG, spare: total - neededG };
}

/**
 * Scale a recipe. Pure: never mutates the (frozen) seed recipe, never reads rounded
 * display values. `factor` multiplies the exact (edited) base amounts.
 */
export function scaleRecipe(recipe: Recipe, opts: ScaleOptions): ScaledRecipe {
  const { factor } = opts;
  if (!Number.isFinite(factor) || factor <= 0) throw new RangeError(`Scale factor must be a positive finite number, got ${factor}`);
  const amounts = opts.amounts ?? {};
  const tweaks: Tweaks = { ...DEFAULT_TWEAKS, ...(opts.tweaks ?? {}) };

  // Pass 1: base amounts (edited or seed). Pass 2: tweak-driven amounts that depend on other rows.
  
  let riceBase = 0;
  let starterBase = 0;
  for (const c of recipe.components)
    for (const i of c.ingredients) {
      if (i.role && RICE_ROLES.includes(i.role) && i.unit === 'g') riceBase += amounts[ingKey(c, i)] ?? i.amount ?? 0;
      if (i.role === 'starter') starterBase += amounts[ingKey(c, i)] ?? i.amount ?? 0;
    }
  const ratio = recipe.derived?.starter_build_ratio as number[] | undefined;
  const loss = (recipe.derived?.starter_spare_loss_g as number | undefined) ?? 0;
  // The build is not linear in the batch: it is re-sized for the starter this batch needs.
  const build = ratio ? { base: starterBuild(starterBase, ratio, loss), now: starterBuild(starterBase * factor, ratio, loss) } : null;
  const pick = (b: StarterBuild, role?: string) => (role === 'build_seed' ? b.seed : role === 'build_flour' ? b.flour : b.water);

  const components: ScaledComponent[] = recipe.components.map((c) => ({
    id: c.id,
    label: c.label,
    includeInDoughMass: c.include_in_dough_mass,
    ingredients: c.ingredients.map((i): ScaledIngredient => {
      const key = ingKey(c, i);
      const driven = tweakDriven(recipe, i);
      let baseAmount: number | null = i.amount;
      let edited = false;
      if (driven === 'stock') baseAmount = riceBase * tweaks.stockPerG;
      else if (driven === 'colour') baseAmount = tweaks.colourG;
      else if (i.amount !== null && key in amounts && Math.abs(amounts[key] - i.amount) > EPS) {
        baseAmount = amounts[key];
        edited = true;
      }
      if (driven === 'build' && build) baseAmount = pick(build.base, i.role);
      const amount = baseAmount === null ? null : driven === 'build' && build ? pick(build.now, i.role) : baseAmount * factor;
      const gramsFromUnit = i.unit === 'g';
      const baseGrams = gramsFromUnit ? baseAmount : scaleEquivalent(i.amount, i.weight_equivalent_g, baseAmount);
      const grams = baseGrams === null ? null : gramsFromUnit ? amount : baseGrams * factor;
      let status: ScaledIngredient['status'] = Math.abs(factor - 1) > EPS ? 'calculated' : 'original';
      if (driven === 'build') status = amount !== null && i.amount !== null && Math.abs(amount - i.amount) < EPS ? 'original' : 'calculated';
      else if (driven) status = 'suggested';
      if (edited) status = 'personal_edit';
      return {
        key,
        componentId: c.id,
        id: i.id,
        name: i.name,
        role: i.role,
        unit: i.unit,
        seedAmount: i.amount,
        baseAmount,
        amount,
        grams,
        gramsApproximate: !gramsFromUnit && !!i.weight_equivalent_is_approximate,
        baseGrams,
        note: i.note,
        sourceLabel: i.source_label,
        status,
        edited,
        excludeFromMass: !!i.exclude_from_dough_mass,
        allowableMin: i.allowable_min,
        allowableMax: i.allowable_max,
      };
    }),
  }));

  return { recipe, factor, components };
}

export const allIngredients = (s: ScaledRecipe): ScaledIngredient[] => s.components.flatMap((c) => c.ingredients);

export interface DoughMass {
  grams: number;
  /** Density / count conversions affect the total. */
  approximate: boolean;
  /** A measured-by-feel ingredient (e.g. orange juice) has no weight, so the total is a floor. */
  incomplete: boolean;
}

/**
 * Sum of weighed ingredients in components flagged include_in_dough_mass.
 * Toppings, glazes, working flour and to-taste items are excluded by the seed flags.
 */
export function calculateDoughMass(s: ScaledRecipe): DoughMass {
  let grams = 0;
  let approximate = false;
  let incomplete = false;
  for (const c of s.components) {
    if (!c.includeInDoughMass) continue;
    for (const i of c.ingredients) {
      if (i.excludeFromMass || i.amount === null) continue;
      if (i.grams === null) {
        if (i.role !== 'aromatic') incomplete = true;
        continue;
      }
      grams += i.grams;
      if (i.gramsApproximate) approximate = true;
    }
  }
  return { grams, approximate, incomplete };
}

/**
 * Split a dough mass into n pieces in whole grams without losing dough to rounding:
 * remainders are handed out one gram at a time. Returns weights summing to round(total).
 */
export function splitDough(totalG: number, n: number): number[] {
  if (!Number.isInteger(n) || n < 1) throw new RangeError('n must be a positive integer');
  const total = Math.round(totalG);
  const base = Math.floor(total / n);
  const extra = total - base * n;
  return Array.from({ length: n }, (_, i) => (i < extra ? base + 1 : base));
}
