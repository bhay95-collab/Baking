import ratiosRaw from '../data/ratios.json';
import conversionsRaw from '../data/conversions.json';
import { parseNumber } from './parse';

export type RatioUnit = 'g' | 'ml' | 'cup' | 'tbsp' | 'tsp' | 'egg';
export type RatioStatus = 'solid' | 'check' | 'varies';
export type CupStandard = 'au' | 'us';

export interface RatioIngredient {
  id: string;
  name: string;
  /** Amount for the card's base batch, in `unit`. The ratio is the relationship between these. */
  amount: number;
  unit: RatioUnit;
  /** Grams per ml, so cups, spoons and ml can show an approximate weight. */
  gPerMl?: number;
  /** Grams for one `egg`. */
  gPerUnit?: number;
}

export interface RatioVariant {
  id: string;
  label: string;
  headline?: string;
  note?: string;
  ingredients: RatioIngredient[];
}

export interface RatioCard {
  id: string;
  name: string;
  group: string;
  headline: string;
  status: RatioStatus;
  flag?: string;
  /** Variant shown first. Defaults to the first one listed. */
  default?: string;
  /** Ingredient id other amounts are shown as a % of (baker's percentages). */
  bakers?: string;
  variants: RatioVariant[];
  notes: string[];
  see?: string[];
}

export interface RatioLibrary {
  version: string;
  note: string;
  groups: { id: string; label: string }[];
  cards: RatioCard[];
}

export interface Conversion {
  id: string;
  name: string;
  group: string;
  gPerMl: number;
  gPerUsCup: number;
  note?: string;
}

export interface ConversionLibrary {
  version: string;
  note: string;
  usCupMl: number;
  groups: { id: string; label: string }[];
  items: Conversion[];
}

export const RATIOS = ratiosRaw as RatioLibrary;
export const CONVERSIONS = conversionsRaw as ConversionLibrary;

/** Cup and spoon volumes in ml. Australian: 250 ml cup, 20 ml tablespoon, 5 ml teaspoon. */
export const MEASURES: Record<CupStandard, { cup: number; tbsp: number; tsp: number; label: string }> = {
  au: { cup: 250, tbsp: 20, tsp: 5, label: 'Australian (250 ml cup, 20 ml tablespoon)' },
  us: { cup: 236.588, tbsp: 14.787, tsp: 4.929, label: 'US (237 ml cup, 15 ml tablespoon)' },
};

export function defaultVariant(card: RatioCard): RatioVariant {
  return card.variants.find((v) => v.id === card.default) ?? card.variants[0];
}

export function getCard(id: string): RatioCard | undefined {
  return RATIOS.cards.find((c) => c.id === id);
}

/** Volume of one `unit` in ml, for volume units only. */
export function unitMl(unit: RatioUnit, std: CupStandard): number | null {
  if (unit === 'ml') return 1;
  if (unit === 'cup' || unit === 'tbsp' || unit === 'tsp') return MEASURES[std][unit];
  return null;
}

/** Approximate grams for an amount of an ingredient, or null when the card gives no density. */
export function equivalentGrams(ing: RatioIngredient, amount: number, std: CupStandard): number | null {
  if (ing.unit === 'g') return null;
  if (ing.unit === 'egg') return ing.gPerUnit ? amount * ing.gPerUnit : null;
  const ml = unitMl(ing.unit, std);
  return ml !== null && ing.gPerMl ? amount * ml * ing.gPerMl : null;
}

export interface SolvedRow {
  id: string;
  name: string;
  unit: RatioUnit;
  amount: number;
  /** Approximate weight (cups, spoons, ml, eggs) or the exact weight for grams. */
  grams: number | null;
  gramsApprox: boolean;
  /** % of the baker's-percentage ingredient, when the card has one. */
  percent: number | null;
  isAnchor: boolean;
}

/**
 * Scale a variant so that `anchorId` equals `anchorAmount`. Every other ingredient keeps its
 * ratio to the anchor. Pure: never changes the data.
 */
export function solveVariant(card: RatioCard, variant: RatioVariant, anchorId: string, anchorAmount: number, std: CupStandard = 'au'): SolvedRow[] {
  const anchor = variant.ingredients.find((i) => i.id === anchorId) ?? variant.ingredients[0];
  if (!(anchorAmount > 0) || !Number.isFinite(anchorAmount)) throw new RangeError('Anchor amount must be a positive number');
  const factor = anchorAmount / anchor.amount;
  const amounts = variant.ingredients.map((i) => ({ i, amount: i.amount * factor }));
  const gramsOf = (i: RatioIngredient, a: number) => (i.unit === 'g' ? a : equivalentGrams(i, a, std));
  const baker = card.bakers ? amounts.find((x) => x.i.id === card.bakers) : undefined;
  const bakerG = baker ? gramsOf(baker.i, baker.amount) : null;
  return amounts.map(({ i, amount }) => {
    const g = gramsOf(i, amount);
    return {
      id: i.id,
      name: i.name,
      unit: i.unit,
      amount,
      grams: g,
      gramsApprox: i.unit !== 'g' && g !== null,
      percent: bakerG && g !== null ? (100 * g) / bakerG : null,
      isAnchor: i.id === anchor.id,
    };
  });
}

/** The base amount of one ingredient in a variant, so switching anchor can keep the batch the same. */
export function baseAmount(variant: RatioVariant, id: string): number {
  return (variant.ingredients.find((i) => i.id === id) ?? variant.ingredients[0]).amount;
}

export interface ConvertResult {
  ok: boolean;
  grams?: number;
  error?: string;
}

/** Cups / tablespoons / teaspoons / ml of an ingredient to grams. */
export function toGrams(item: Conversion, amount: number, unit: 'cup' | 'tbsp' | 'tsp' | 'ml', std: CupStandard): number {
  const ml = unit === 'ml' ? amount : amount * (MEASURES[std][unit] as number);
  return ml * item.gPerMl;
}

/** Grams of an ingredient to cups / tablespoons / teaspoons / ml. */
export function fromGrams(item: Conversion, grams: number, unit: 'cup' | 'tbsp' | 'tsp' | 'ml', std: CupStandard): number {
  const ml = grams / item.gPerMl;
  return unit === 'ml' ? ml : ml / (MEASURES[std][unit] as number);
}

export function parseAmount(text: string): { ok: true; value: number } | { ok: false; error: string } {
  const r = parseNumber(text, { label: 'Amount' });
  if (!r.ok) return r;
  if (r.value > 1e6) return { ok: false, error: 'That is too large to be useful.' };
  return r;
}

export function validateRatios(lib: RatioLibrary): string[] {
  const errs: string[] = [];
  const groups = new Set(lib.groups.map((g) => g.id));
  const ids = new Set<string>();
  const units = new Set(['g', 'ml', 'cup', 'tbsp', 'tsp', 'egg']);
  for (const c of lib.cards) {
    if (ids.has(c.id)) errs.push(`duplicate card ${c.id}`);
    ids.add(c.id);
    if (!groups.has(c.group)) errs.push(`${c.id}: unknown group ${c.group}`);
    if (!['solid', 'check', 'varies'].includes(c.status)) errs.push(`${c.id}: bad status`);
    if (c.status !== 'solid' && !c.flag) errs.push(`${c.id}: ${c.status} cards need a flag explaining why`);
    if (!c.variants.length) errs.push(`${c.id}: no variants`);
    if (c.default && !c.variants.some((v) => v.id === c.default)) errs.push(`${c.id}: default variant ${c.default} does not exist`);
    if (!c.notes.length) errs.push(`${c.id}: no notes`);
    const vids = new Set<string>();
    for (const v of c.variants) {
      if (vids.has(v.id)) errs.push(`${c.id}: duplicate variant ${v.id}`);
      vids.add(v.id);
      if (v.ingredients.length < 2) errs.push(`${c.id}/${v.id}: needs at least two ingredients`);
      const iids = new Set<string>();
      for (const i of v.ingredients) {
        if (iids.has(i.id)) errs.push(`${c.id}/${v.id}: duplicate ingredient ${i.id}`);
        iids.add(i.id);
        if (!units.has(i.unit)) errs.push(`${c.id}/${v.id}/${i.id}: bad unit ${i.unit}`);
        if (!(i.amount > 0)) errs.push(`${c.id}/${v.id}/${i.id}: amount must be positive`);
        if (['cup', 'tbsp', 'tsp'].includes(i.unit) && !i.gPerMl) errs.push(`${c.id}/${v.id}/${i.id}: spoon/cup units need gPerMl`);
        if (i.unit === 'egg' && !i.gPerUnit) errs.push(`${c.id}/${v.id}/${i.id}: eggs need gPerUnit`);
      }
      if (c.bakers && !iids.has(c.bakers)) errs.push(`${c.id}/${v.id}: bakers ingredient ${c.bakers} missing`);
    }
  }
  return errs;
}
