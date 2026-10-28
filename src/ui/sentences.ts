import type { BaseInfo, ScaleInputs, ScaleMode } from '../engine/factor';
import type { Recipe } from '../engine/types';

/** A piece of the fill-in-the-blank scaling sentence. */
export type Piece =
  | { kind: 'text'; text: string }
  | { kind: 'field'; field: keyof ScaleInputs; label: string; size: number; numeric?: boolean }
  | { kind: 'portion'; label: string }
  | { kind: 'noun'; one: string; many: string; field: keyof ScaleInputs };

export interface Phrase {
  mode: ScaleMode;
  /** Short name for the "say it another way" list. */
  name: string;
  pieces: Piece[];
  hint?: string;
}

const t = (text: string): Piece => ({ kind: 'text', text });
const f = (field: keyof ScaleInputs, label: string, size = 4, numeric = false): Piece => ({ kind: 'field', field, label, size, numeric });
const noun = (one: string, many: string, field: keyof ScaleInputs = 'value'): Piece => ({ kind: 'noun', one, many, field });

const COUNT: Record<string, { verb: string; one: string; many: string; name: string }> = {
  classic_sourdough: { verb: 'Make', one: 'loaf', many: 'loaves', name: 'Loaves' },
  sourdough_wheat_rye: { verb: 'Make', one: 'loaf', many: 'loaves', name: 'Loaves' },
  poolish_pizza: { verb: 'Make', one: 'batch', many: 'batches', name: 'Batches' },
  bens_focaccia: { verb: 'Bake', one: 'tray', many: 'trays', name: 'Trays' },
  bens_raisin_bread: { verb: 'Bake', one: 'tin loaf', many: 'tin loaves', name: 'Loaves' },
  hot_cross_buns: { verb: 'Make', one: 'bun', many: 'buns', name: 'Buns' },
  croissant_classic: { verb: 'Make about', one: 'croissant', many: 'croissants', name: 'Croissants' },
  croissant_red: { verb: 'Make about', one: 'croissant', many: 'croissants', name: 'Croissants' },
};

export function phrasesFor(recipe: Recipe, modes: ScaleMode[], base: BaseInfo): Phrase[] {
  const rice = recipe.ratio_basis.unit === 'g_rice';
  const out: Phrase[] = [];
  for (const mode of modes) {
    switch (mode) {
      case 'balls':
        out.push({ mode, name: 'Pizza balls', pieces: [t('Make'), f('balls', 'Number of pizza balls', 3, true), noun('pizza ball', 'pizza balls', 'balls'), t('of'), f('ballWeight', 'Grams per ball', 4), t('g each.')] });
        break;
      case 'servings':
        out.push({ mode, name: 'People', pieces: [t('Feed'), f('servings', 'Number of people', 3), noun('person', 'people', 'servings'), t('with'), { kind: 'portion', label: 'Portion size' }, t('portions.')] });
        break;
      case 'count': {
        const c = COUNT[recipe.id];
        if (!c) break;
        out.push({
          mode,
          name: c.name,
          pieces: [t(c.verb), f('value', `Number of ${c.many}`, 3), noun(c.one, c.many), t('.')],
          hint: base.countIsEstimate ? `Yield is the source’s estimate of ${recipe.yield.count_range?.join('–')} per batch; ${base.count} is used as one batch.` : undefined,
        });
        break;
      }
      case 'basis':
        out.push({ mode, name: rice ? 'Rice weight' : 'Flour weight', pieces: rice ? [t('Cook'), f('value', 'Grams of dry rice', 5), t('g of dry rice.')] : [t('Use'), f('value', 'Grams of flour', 5), t('g of flour in total.')] });
        break;
      case 'mass':
        out.push({ mode, name: 'Dough weight', pieces: [t('Make'), f('value', 'Grams of dough', 5), t('g of dough.')], hint: base.massExact ? undefined : 'Dough weight includes estimated conversions (oil, spoons), so the result is approximate.' });
        break;
      case 'multiplier':
        out.push({ mode, name: 'Multiplier', pieces: [t('Make'), f('value', 'Batch multiplier', 3), t('× the original recipe.')] });
        break;
    }
  }
  return out;
}

export function defaultMode(recipe: Recipe, modes: ScaleMode[]): ScaleMode {
  const pref: ScaleMode = recipe.id === 'poolish_pizza' ? 'balls' : recipe.ratio_basis.unit === 'g_rice' ? 'servings' : 'count';
  return modes.includes(pref) ? pref : 'multiplier';
}
