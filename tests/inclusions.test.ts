import { describe, expect, it } from 'vitest';
import { getSeedRecipe } from '../src/engine/seed';
import { calculateDoughMass, scaleRecipe } from '../src/engine/scale';
import { ratioRows, starterBreakdown } from '../src/engine/metrics';
import {
  INCLUSIONS, doughFlour, findInclusion, planInclusions, roundSuggestion, supportsInclusions, validateInclusions, withInclusions,
} from '../src/engine/inclusions';

const sourdough = (factor = 1) => scaleRecipe(getSeedRecipe('classic_sourdough')!, { factor });

describe('inclusion library', () => {
  it('is well formed', () => {
    expect(validateInclusions(INCLUSIONS)).toEqual([]);
    expect(INCLUSIONS.items.length).toBeGreaterThanOrEqual(30);
    expect(new Set(INCLUSIONS.items.map((i) => i.category))).toEqual(new Set(INCLUSIONS.categories.map((c) => c.id)));
  });
  it('flags bad data', () => {
    const bad = { ...INCLUSIONS, items: [{ ...INCLUSIONS.items[0], classic: 1 }, INCLUSIONS.items[0]] };
    expect(validateInclusions(bad).length).toBeGreaterThanOrEqual(2);
  });
  it('applies to breads and pizza, not pastry or rice', () => {
    for (const id of ['classic_sourdough', 'sourdough_wheat_rye', 'bens_focaccia', 'bens_raisin_bread', 'hot_cross_buns', 'poolish_pizza']) expect(supportsInclusions(getSeedRecipe(id)!)).toBe(true);
    for (const id of ['croissant_classic', 'croissant_red', 'classic_risotto']) expect(supportsInclusions(getSeedRecipe(id)!)).toBe(false);
  });
});

describe('suggestions', () => {
  it('uses the flour weighed into the dough', () => {
    expect(doughFlour(sourdough())).toBe(598);
    expect(doughFlour(sourdough(5))).toBe(2990);
    expect(doughFlour(scaleRecipe(getSeedRecipe('poolish_pizza')!, { factor: 1 }))).toBe(1000);
  });
  it('one cheddar loaf at classic = 25% of 598 g, rounded to 150 g', () => {
    const plan = planInclusions({ flourG: 598, strength: 'classic', picks: [{ id: 'cheddar' }] });
    expect(plan.items[0].suggestedGrams).toBe(150);
    expect(plan.items[0].pct).toBeCloseTo(25.08, 1);
    expect(plan.reduced).toBe(false);
  });
  it('strength changes the amount: light < classic < loaded', () => {
    const g = (s: 'light' | 'classic' | 'loaded') => planInclusions({ flourG: 598, strength: s, picks: [{ id: 'walnuts' }] }).items[0].grams;
    expect(g('light')).toBeLessThan(g('classic'));
    expect(g('classic')).toBeLessThan(g('loaded'));
    expect([g('light'), g('classic'), g('loaded')]).toEqual([70, 120, 180]);
  });
  it('scales with the batch', () => {
    const one = planInclusions({ flourG: 598, strength: 'classic', picks: [{ id: 'olives' }] }).items[0].grams;
    const five = planInclusions({ flourG: 2990, strength: 'classic', picks: [{ id: 'olives' }] }).items[0].grams;
    expect(five).toBe(one * 5);
  });
  it('kitchen rounding', () => {
    expect(roundSuggestion(0, 'bulk')).toBe(0);
    expect(roundSuggestion(0.2, 'flavour')).toBe(0.5);
    expect(roundSuggestion(7.2, 'flavour')).toBe(7);
    expect(roundSuggestion(7.3, 'flavour')).toBe(7.5);
    expect(roundSuggestion(23.4, 'flavour')).toBe(23);
    expect(roundSuggestion(71.8, 'bulk')).toBe(70);
    expect(roundSuggestion(149.5, 'bulk')).toBe(150);
  });
  it('flavourings stay small and are not capped', () => {
    const plan = planInclusions({ flourG: 598, strength: 'classic', picks: [{ id: 'cinnamon' }, { id: 'rosemary' }, { id: 'black_pepper' }] });
    expect(plan.items.map((i) => i.grams)).toEqual([7, 11, 6]);
    expect(plan.bulkPct).toBe(0);
    expect(plan.reduced).toBe(false);
  });
});

describe('combining inclusions', () => {
  it('cheddar + jalapeño exceed the 30% cap, so both are scaled down together', () => {
    const plan = planInclusions({ flourG: 598, strength: 'classic', picks: [{ id: 'cheddar' }, { id: 'jalapeno_fresh' }] });
    expect(plan.uncappedBulkPct).toBe(37);
    expect(plan.reduced).toBe(true);
    expect(plan.bulkPct).toBeLessThanOrEqual(30.9);
    const [c, j] = plan.items;
    expect(c.grams / j.grams).toBeGreaterThan(1.9); // keeps the 25 : 12 proportion
    expect(c.grams).toBe(120);
    expect(j.grams).toBe(60);
  });
  it('the cap rises with strength', () => {
    const picks = [{ id: 'cheddar' }, { id: 'walnuts' }];
    expect(planInclusions({ flourG: 598, strength: 'light', picks }).capPct).toBe(20);
    expect(planInclusions({ flourG: 598, strength: 'loaded', picks }).capPct).toBe(40);
  });
  it('unknown ids are ignored; custom inclusions use their own %', () => {
    const plan = planInclusions({ flourG: 598, strength: 'classic', picks: [{ id: 'nope' }, { id: 'c1' }], customs: [{ id: 'c1', name: 'Smoked cheese', pct: 10 }] });
    expect(plan.items).toHaveLength(1);
    expect(plan.items[0]).toMatchObject({ name: 'Smoked cheese', custom: true, grams: 60 });
  });
  it('a typed amount overrides the suggestion, scales with the batch, and flags a heavy dough', () => {
    const own = (150 / 598) * 100 * 2; // 2× the usual 150 g
    const one = planInclusions({ flourG: 598, strength: 'classic', picks: [{ id: 'cheddar', pct: own }] });
    expect(one.items[0].edited).toBe(true);
    expect(one.items[0].grams).toBeCloseTo(300, 6);
    const five = planInclusions({ flourG: 2990, strength: 'classic', picks: [{ id: 'cheddar', pct: own }] });
    expect(five.items[0].grams).toBeCloseTo(1500, 6);
    const heavy = planInclusions({ flourG: 598, strength: 'classic', picks: [{ id: 'cheddar', pct: 45 }] });
    expect(heavy.overLimit).toBe(true);
    // typing exactly the suggestion is not an "edit"
    expect(planInclusions({ flourG: 598, strength: 'classic', picks: [{ id: 'cheddar', pct: (150 / 598) * 100 }] }).items[0].edited).toBe(false);
  });
  it('no picks = no stage, same object', () => {
    const s = sourdough();
    expect(withInclusions(s, planInclusions({ flourG: 598, strength: 'classic', picks: [] }))).toBe(s);
  });
});

describe('inclusions in the recipe', () => {
  it('appears as its own stage and never changes dough weight, hydration or the starter maths', () => {
    const s = sourdough(2);
    const plan = planInclusions({ flourG: doughFlour(s), strength: 'classic', picks: [{ id: 'cheddar' }, { id: 'olives' }] });
    const v = withInclusions(s, plan);
    const stage = v.components.at(-1)!;
    expect(stage).toMatchObject({ id: 'inclusions', label: 'Inclusions', includeInDoughMass: false });
    expect(stage.ingredients.map((i) => i.name)).toEqual(['Cheddar, cubed', 'Olives, pitted']);
    expect(calculateDoughMass(v).grams).toBeCloseTo(calculateDoughMass(s).grams, 9);
    expect(starterBreakdown(v)!.effectiveHydrationPct).toBeCloseTo(73.7817, 3);
    expect(s.components.some((c) => c.id === 'inclusions')).toBe(false); // original untouched
  });
  it('shows up in the ratios against the same flour basis', () => {
    const s = sourdough();
    const plan = planInclusions({ flourG: 598, strength: 'classic', picks: [{ id: 'walnuts' }] });
    const row = ratioRows(withInclusions(s, plan), 'recipe').find((r) => r.key === 'inclusions.walnuts')!;
    expect(row.grams).toBe(120);
    expect(row.percent).toBeCloseTo(20.07, 1);
  });
  it('every library item has a usable suggestion for a loaf', () => {
    for (const it of INCLUSIONS.items) {
      const p = planInclusions({ flourG: 598, strength: 'classic', picks: [{ id: it.id }] });
      expect(p.items[0].grams, it.id).toBeGreaterThan(0);
      expect(findInclusion(it.id)).toBeTruthy();
    }
  });
});
