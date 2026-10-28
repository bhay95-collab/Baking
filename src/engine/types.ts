/** Seed data model — mirrors the JSON embedded in docs/brief.md (Part III). */

export type Unit = 'g' | 'ml' | 'tsp' | 'tbsp' | 'egg' | 'orange' | 'large_orange' | 'to_taste' | string;

export interface Ingredient {
  id: string;
  name: string;
  /** Canonical original quantity. `null` for to-taste items. */
  amount: number | null;
  unit: Unit;
  role?: string;
  weight_equivalent_g?: number;
  weight_equivalent_is_approximate?: boolean;
  ratio_percent?: number;
  note?: string;
  source_label?: string;
  allowable_min?: number;
  allowable_max?: number;
  exclude_from_dough_mass?: boolean;
}

export interface Component {
  id: string;
  label: string;
  include_in_dough_mass: boolean;
  ingredients: Ingredient[];
}

export interface RatioBasis {
  amount: number;
  unit: 'g_flour' | 'g_rice' | string;
  label: string;
}

export interface RecipeYield {
  count?: number;
  count_range?: [number, number];
  unit: string;
  base_dough_mass_g?: number;
  base_total_unbaked_mass_g?: number;
  estimated_dough_mass_g_excluding_finishing?: number;
  estimated_unbaked_mass_g_at_1_5g_colour?: number;
  suggested_pizza_balls?: number;
  approx_weight_per_ball_g_at_suggested_count?: number;
  rice_g_per_serving?: number;
  bake_minutes?: number;
}

export interface Recipe {
  id: string;
  name: string;
  category: string;
  source: string;
  ratio_basis: RatioBasis;
  yield: RecipeYield;
  components: Component[];
  method: string[];
  notes: string[];
  derived?: Record<string, number | number[]>;
  variant_of?: string;
}

export interface SeedLibrary {
  schema_version: string;
  library_title: string;
  generated_on: string;
  calculation_conventions: Record<string, string | boolean>;
  recipes: Recipe[];
}

/** A user-owned personal variant. Only changed amounts are stored; the seed is never mutated. */
export interface Variant {
  id: string;
  name: string;
  baseId: string;
  /** schema_version of the seed this was made against. */
  baseSeedVersion: string;
  /** Bumped on every save of an existing variant. */
  version: number;
  createdAt: string;
  updatedAt: string;
  /** `${componentId}.${ingredientId}` → base (factor 1) amount. */
  amounts: Record<string, number>;
  tweaks?: Partial<Tweaks>;
  note?: string;
}

/** Settings that are not ingredient quantities but influence derived amounts. */
export interface Tweaks {
  /** Risotto: planned stock in mL per gram of dry rice (3.5–4.25, default 3.75). */
  stockPerG: number;
  /** Red croissants: concentrated colour in grams at 1× (1–2, default 1.5). */
  colourG: number;
}

export const DEFAULT_TWEAKS: Tweaks = { stockPerG: 3.75, colourG: 1.5 };

export type SourceStatus =
  | 'original'
  | 'calculated'
  | 'estimated'
  | 'suggested'
  | 'personal_edit';

export interface ScaledIngredient {
  key: string;
  componentId: string;
  id: string;
  name: string;
  role?: string;
  unit: Unit;
  /** Amount in the seed (unedited). */
  seedAmount: number | null;
  /** Amount at factor 1 after personal edits / tweaks. */
  baseAmount: number | null;
  /** Amount after scaling. `null` for to-taste items. */
  amount: number | null;
  /** Gram-equivalent after scaling, if known. */
  grams: number | null;
  gramsApproximate: boolean;
  /** Original (factor-1, edited) gram equivalent. */
  baseGrams: number | null;
  note?: string;
  sourceLabel?: string;
  status: SourceStatus;
  edited: boolean;
  excludeFromMass: boolean;
  allowableMin?: number;
  allowableMax?: number;
}

export interface ScaledComponent {
  id: string;
  label: string;
  includeInDoughMass: boolean;
  ingredients: ScaledIngredient[];
}

export interface ScaledRecipe {
  recipe: Recipe;
  factor: number;
  components: ScaledComponent[];
}

export interface Settings {
  /** 'auto' = whole grams ≥10 g, 0.1 g below. */
  precision: 'auto' | 'tenth' | 'hundredth';
  showEquivalents: boolean;
  showOriginal: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  precision: 'auto',
  showEquivalents: true,
  showOriginal: false,
};
