import { parseNumber } from './parse';
import { calculateDoughMass, scaleRecipe } from './scale';
import { basisGrams } from './metrics';
import type { Recipe, Tweaks } from './types';

export type ScaleMode = 'multiplier' | 'count' | 'basis' | 'mass' | 'balls' | 'servings';

export const MIN_FACTOR = 0.1;
export const MAX_FACTOR = 20;

export interface ScaleInputs {
  /** Free value for multiplier / count / basis / mass modes (raw text, so decimal commas survive). */
  value: string;
  balls: string;
  ballWeight: string;
  servings: string;
  /** Risotto: dry rice per serving, grams (80 main / 60 side). */
  portionG: string;
}

export interface BaseInfo {
  /** Dough mass at factor 1, edits included. */
  mass: number;
  massExact: boolean;
  /** false when an unmeasured ingredient makes mass scaling meaningless. */
  massUsable: boolean;
  basis: number;
  count: number | null;
  countIsEstimate: boolean;
  countUnit: string;
  riceG: number;
}

export function isRice(recipe: Recipe): boolean {
  return recipe.ratio_basis.unit === 'g_rice';
}

export function baseInfo(recipe: Recipe, amounts: Record<string, number> = {}, tweaks: Partial<Tweaks> = {}): BaseInfo {
  const s1 = scaleRecipe(recipe, { factor: 1, amounts, tweaks });
  const mass = calculateDoughMass(s1);
  const range = recipe.yield.count_range;
  const count = recipe.yield.count ?? (range ? (range[0] + range[1]) / 2 : null);
  return {
    mass: mass.grams,
    massExact: !mass.approximate && !mass.incomplete,
    massUsable: !isRice(recipe) && !mass.incomplete && mass.grams > 0,
    basis: basisGrams(s1, 'recipe'),
    count,
    countIsEstimate: !!range,
    countUnit: recipe.yield.unit,
    riceG: isRice(recipe) ? basisGrams(s1, 'recipe') : 0,
  };
}

export function modesFor(recipe: Recipe, base: BaseInfo): ScaleMode[] {
  const modes: ScaleMode[] = ['multiplier'];
  if (isRice(recipe)) modes.push('servings', 'basis');
  else {
    if (base.count) modes.push('count');
    modes.push('basis');
    if (base.massUsable) modes.push('mass');
    if (recipe.id === 'poolish_pizza') modes.push('balls');
  }
  return modes;
}

export type FactorResult = { ok: true; factor: number } | { ok: false; error: string };

const check = (f: number): FactorResult => {
  if (!Number.isFinite(f) || f <= 0) return { ok: false, error: 'That combination does not give a usable batch size.' };
  if (f < MIN_FACTOR || f > MAX_FACTOR)
    return { ok: false, error: `That works out to ${+f.toFixed(2)}× — keep the scale between ${MIN_FACTOR}× and ${MAX_FACTOR}×.` };
  return { ok: true, factor: f };
};

/** Turn the user's typed target into a scale factor. Explains problems instead of guessing. */
export function factorFromInputs(mode: ScaleMode, inputs: ScaleInputs, base: BaseInfo): FactorResult {
  const num = (s: string, label: string) => parseNumber(s, { label });
  switch (mode) {
    case 'multiplier': {
      const v = num(inputs.value, 'Batch multiplier');
      return v.ok ? check(v.value) : v;
    }
    case 'count': {
      const v = num(inputs.value, 'Target quantity');
      if (!v.ok) return v;
      if (!base.count) return { ok: false, error: 'This recipe has no stated yield to scale by.' };
      return check(v.value / base.count);
    }
    case 'basis': {
      const v = num(inputs.value, base.riceG ? 'Dry rice' : 'Flour');
      if (!v.ok) return v;
      if (!(base.basis > 0)) return { ok: false, error: 'The recipe has no flour/rice basis to scale by.' };
      return check(v.value / base.basis);
    }
    case 'mass': {
      if (!base.massUsable) return { ok: false, error: 'Dough weight scaling is switched off — some ingredients have no stated weight.' };
      const v = num(inputs.value, 'Target dough weight');
      return v.ok ? check(v.value / base.mass) : v;
    }
    case 'balls': {
      const n = num(inputs.balls, 'Number of balls');
      if (!n.ok) return n;
      if (!Number.isInteger(n.value)) return { ok: false, error: 'Number of balls must be a whole number.' };
      const w = num(inputs.ballWeight, 'Weight per ball');
      if (!w.ok) return w;
      return check((n.value * w.value) / base.mass);
    }
    case 'servings': {
      const n = num(inputs.servings, 'Servings');
      if (!n.ok) return n;
      const p = num(inputs.portionG, 'Rice per serving');
      if (!p.ok) return p;
      return check((n.value * p.value) / base.riceG);
    }
  }
}

const trim = (n: number, dp: number) => String(+n.toFixed(dp));

/** Populate the input fields from the current factor so that switching mode never changes the batch. */
export function inputsFromFactor(factor: number, base: BaseInfo, prev?: Partial<ScaleInputs>): ScaleInputs {
  const portionG = prev?.portionG ?? '80';
  const portion = Number(portionG) || 80;
  const balls = prev?.balls ?? '6';
  const ballsN = Number(balls) || 6;
  return {
    value: trim(factor, 3),
    balls,
    ballWeight: trim((base.mass * factor) / ballsN, 1),
    servings: base.riceG ? trim((base.riceG * factor) / portion, 2) : '',
    portionG,
  };
}

/** Value for the single "value" field when entering a given mode. */
export function valueForMode(mode: ScaleMode, factor: number, base: BaseInfo): string {
  switch (mode) {
    case 'count': return trim((base.count ?? 1) * factor, 2);
    case 'basis': return trim(base.basis * factor, 1);
    case 'mass': return trim(base.mass * factor, 0);
    default: return trim(factor, 3);
  }
}

/** Next/previous sensible multiplier for the +/- buttons. */
export function stepMultiplier(f: number, dir: 1 | -1): number {
  const step = (dir === 1 ? f >= 2 : f > 2) ? 0.5 : 0.25;
  const next = Math.round((f + dir * step) / step) * step;
  return Math.min(10, Math.max(0.25, +next.toFixed(2)));
}
