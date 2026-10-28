import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { SEED, getSeedRecipe } from '../src/engine/seed';
import { calculateDoughMass, scaleRecipe, splitDough, ingKey } from '../src/engine/scale';
import { baseInfo, factorFromInputs, inputsFromFactor, stepMultiplier } from '../src/engine/factor';
import { basisGrams, calculateEffectiveHydration, calculatePreferment, computeMetrics, ratioRows, starterBreakdown } from '../src/engine/metrics';
import { formatAmount, formatFraction, formatMeasure } from '../src/engine/format';
import { parseNumber } from '../src/engine/parse';
import { validateSeed } from '../src/engine/validate';
import { createVariant, diffAmounts, duplicateVariant, updateVariant } from '../src/engine/variants';
import { emptyState, exportState, loadState, mergeImport, migrate, parseImport, saveState, STORAGE_KEY } from '../src/engine/storage';
import raw from '../src/data/seed-recipes.json';

const R = (id: string) => getSeedRecipe(id)!;
const scale = (id: string, factor = 1, extra: object = {}) => scaleRecipe(R(id), { factor, ...extra });
const g = (s: ReturnType<typeof scale>, key: string) => s.components.flatMap((c) => c.ingredients).find((i) => i.key === key)!;

describe('seed', () => {
  it('is valid and has all eight recipes', () => {
    expect(validateSeed(raw)).toEqual([]);
    expect(SEED.recipes.map((r) => r.id)).toEqual([
      'classic_sourdough', 'poolish_pizza', 'bens_focaccia', 'bens_raisin_bread',
      'hot_cross_buns', 'croissant_classic', 'croissant_red', 'classic_risotto',
    ]);
  });
  it('matches the JSON embedded in docs/brief.md', () => {
    const md = readFileSync(new URL('../docs/brief.md', import.meta.url), 'utf8');
    const json = JSON.parse(/```json\n([\s\S]*?)\n```/.exec(md)![1]);
    expect(raw).toEqual(json);
  });
  it('is frozen', () => {
    expect(Object.isFrozen(SEED.recipes[0].components[0].ingredients[0])).toBe(true);
  });
  it('flags bad data', () => {
    expect(validateSeed({ schema_version: '1', recipes: [{ id: 'x' }] }).length).toBeGreaterThan(0);
    expect(validateSeed(null)).toEqual(['Seed is not an object']);
  });
});

describe('sourdough', () => {
  it('1 loaf: 1,012 g dough, 73.913% true hydration', () => {
    const s = scale('classic_sourdough');
    expect(g(s, 'dough.bread_flour').amount).toBe(520);
    expect(calculateDoughMass(s).grams).toBeCloseTo(1012, 9);
    const b = starterBreakdown(s)!;
    expect(b.totalFlour).toBeCloseTo(575, 9);
    expect(b.totalWater).toBeCloseTo(425, 9);
    expect(b.effectiveHydrationPct).toBeCloseTo(73.913, 3);
    expect(b.addedWaterPct).toBeCloseTo(71.1538, 3);
    expect(b.prefermentedFlourPct).toBeCloseTo(9.5652, 3);
  });
  it('2 loaves: doubled, 2,024 g', () => {
    const s = scale('classic_sourdough', 2);
    expect(g(s, 'dough.bread_flour').amount).toBe(1040);
    expect(g(s, 'dough.water').amount).toBe(740);
    expect(g(s, 'dough.starter').amount).toBe(220);
    expect(g(s, 'dough.salt').amount).toBe(24);
    expect(calculateDoughMass(s).grams).toBeCloseTo(2024, 9);
  });
  it('ratio basis: added flour vs effective flour', () => {
    const s = scale('classic_sourdough');
    expect(basisGrams(s, 'recipe')).toBeCloseTo(520, 9);
    expect(basisGrams(s, 'total')).toBeCloseTo(575, 9);
    const rows = ratioRows(s, 'recipe');
    expect(rows.find((r) => r.key === 'dough.water')!.percent).toBeCloseTo(71.1538, 3);
    expect(rows.find((r) => r.key === 'dough.starter')!.percent).toBeCloseTo(21.1538, 3);
  });
  it('generic effective hydration formula', () => {
    const r = calculateEffectiveHydration({ addedFlour: 500, addedWater: 350, starter: 100, starterHydration: 0.5 });
    expect(r.starterFlour).toBeCloseTo(66.667, 3);
    expect(r.starterWater).toBeCloseTo(33.333, 3);
  });
});

describe('poolish pizza', () => {
  it('1 batch: poolish 611 g, dough 1,751 g, 70% hydration, salt 30 / oil 10', () => {
    const s = scale('poolish_pizza');
    const p = calculatePreferment(s);
    expect(p.poolishMass).toBeCloseTo(611, 9);
    expect(p.totalFlour).toBe(1000);
    expect(p.totalWater).toBe(700);
    expect(p.overallHydrationPct).toBe(70);
    expect(p.prefermentedFlourPct).toBe(30);
    expect(p.poolishHydrationPct).toBe(100);
    expect(g(s, 'final_dough.salt').amount).toBe(30);
    expect(g(s, 'final_dough.olive_oil').amount).toBe(10);
    const m = calculateDoughMass(s);
    expect(m.grams).toBeCloseTo(1751, 9);
    expect(m.approximate).toBe(false);
  });
  it('2 batches: 3,502 g, 1,222 g poolish, 60 g salt, 20 g oil — poolish never double counted', () => {
    const s = scale('poolish_pizza', 2);
    expect(calculateDoughMass(s).grams).toBeCloseTo(3502, 9);
    expect(calculatePreferment(s).poolishMass).toBeCloseTo(1222, 9);
    expect(g(s, 'final_dough.salt').amount).toBe(60);
    expect(g(s, 'final_dough.olive_oil').amount).toBe(20);
  });
  it('6 balls = 291.83 g each, rounding loses no dough', () => {
    const per = calculateDoughMass(scale('poolish_pizza')).grams / 6;
    expect(per).toBeCloseTo(291.8333, 3);
    const parts = splitDough(1751, 6);
    expect(parts.reduce((a, b) => a + b, 0)).toBe(1751);
    expect(parts).toEqual([292, 292, 292, 292, 292, 291]);
  });
  it('ball planner: n × weight sets the batch', () => {
    const base = baseInfo(R('poolish_pizza'));
    const r = factorFromInputs('balls', { value: '', balls: '8', ballWeight: '250', servings: '', portionG: '80' }, base);
    expect(r).toEqual({ ok: true, factor: 2000 / 1751 });
    expect(factorFromInputs('balls', { value: '', balls: '2.5', ballWeight: '250', servings: '', portionG: '80' }, base).ok).toBe(false);
  });
  it('yeast is editable without touching the seed', () => {
    const s = scale('poolish_pizza', 1, { amounts: { 'poolish.poolish_yeast': 1 } });
    expect(g(s, 'poolish.poolish_yeast').amount).toBe(1);
    expect(g(s, 'poolish.poolish_yeast').status).toBe('personal_edit');
    expect(calculateDoughMass(s).grams).toBeCloseTo(1746, 9);
    expect(R('poolish_pizza').components[0].ingredients[2].amount).toBe(6);
  });
});

describe('focaccia / raisin / buns', () => {
  it('focaccia: 62.5% water hydration, oil separate and approximate', () => {
    const s = scale('bens_focaccia');
    const flour = 1200;
    expect(100 * g(s, 'dough.water').grams! / flour).toBe(62.5);
    expect(g(s, 'dough.olive_oil').amount).toBe(200);
    expect(g(s, 'dough.olive_oil').unit).toBe('ml');
    expect(g(s, 'dough.olive_oil').grams).toBeCloseTo(182, 9);
    const m = calculateDoughMass(s);
    expect(m.grams).toBeCloseTo(2170, 9);
    expect(m.approximate).toBe(true);
    const hyd = computeMetrics(s).find((x) => x.id === 'hyd')!;
    expect(hyd.value).toBe(62.5);
  });
  it('focaccia finishing items stay out of dough mass', () => {
    const s = scale('bens_focaccia');
    const fin = s.components.find((c) => c.id === 'finishing')!;
    expect(fin.includeInDoughMass).toBe(false);
    expect(fin.ingredients.every((i) => i.amount === null)).toBe(true);
  });
  it('raisin bread: 82% nominal hydration, 22% sultanas, cinnamon kept in tbsp', () => {
    const s = scale('bens_raisin_bread');
    const m = computeMetrics(s);
    expect(m.find((x) => x.id === 'hyd')!.value).toBe(82);
    expect(m.find((x) => x.id === 'fruit')!.value).toBe(22);
    expect(g(s, 'dough.cinnamon').unit).toBe('tbsp');
    expect(g(s, 'dough.sultanas').name).toBe('Sultanas');
  });
  it('hot cross buns: 210 g fruit = 35%, extra flour separate, mass not usable', () => {
    const s = scale('hot_cross_buns');
    const m = computeMetrics(s);
    expect(m.find((x) => x.id === 'fruit')!.value).toBe(210);
    expect(m.find((x) => x.id === 'fruitpct')!.value).toBe(35);
    expect(m.find((x) => x.id === 'flour')!.value).toBe(600);
    expect(calculateDoughMass(s).incomplete).toBe(true);
    expect(baseInfo(R('hot_cross_buns')).massUsable).toBe(false);
  });
  it('buns: eggs are counts — 1.5× = 6, 0.5× = 2, 2.5 shows a beat-and-weigh hint', () => {
    expect(g(scale('hot_cross_buns', 1.5), 'dough.eggs').amount).toBe(6);
    expect(g(scale('hot_cross_buns', 0.5), 'dough.eggs').amount).toBe(2);
    const a = formatAmount(g(scale('hot_cross_buns', 0.625), 'dough.eggs').amount, 'egg');
    expect(a.text).toBe('2.5 eggs');
    expect(a.hint).toBe('(beat and weigh half)');
    expect(formatAmount(6, 'egg').text).toBe('6 eggs');
    expect(g(scale('hot_cross_buns', 0.625), 'dough.eggs').grams).toBeCloseTo(125, 9);
  });
});

describe('croissants', () => {
  it('classic: 50% lamination butter, 30 g dough butter, 1,421 g', () => {
    const s = scale('croissant_classic');
    expect(calculateDoughMass(s).grams).toBeCloseTo(1421, 9);
    const rows = ratioRows(s);
    expect(rows.find((r) => r.key === 'lamination.butter_lamination')!.percent).toBeCloseTo(50, 9);
    expect(rows.find((r) => r.key === 'detrempe.butter_in_dough')!.percent).toBeCloseTo(5, 9);
    expect(computeMetrics(s).find((x) => x.id === 'liquid')!.value).toBeCloseTo(63.3333, 3);
  });
  it('red: 106.5 g sheet, 1,527.5 g total, 650 g real flour, 600 g basis', () => {
    const s = scale('croissant_red');
    const sheet = s.components.find((c) => c.id === 'red_sheet')!;
    expect(sheet.ingredients.reduce((a, i) => a + i.grams!, 0)).toBeCloseTo(106.5, 9);
    expect(calculateDoughMass(s).grams).toBeCloseTo(1527.5, 9);
    expect(basisGrams(s, 'recipe')).toBe(600);
    expect(basisGrams(s, 'total')).toBe(650);
    expect(computeMetrics(s).find((x) => x.id === 'flour')!.value).toBe(650);
  });
  it('red colour is a tweak 1–2 g, scales with the batch', () => {
    const s = scale('croissant_red', 2, { tweaks: { colourG: 1 } });
    expect(g(s, 'red_sheet.red_colouring').amount).toBe(2);
    expect(g(s, 'red_sheet.red_colouring').status).toBe('suggested');
  });
});

describe('risotto', () => {
  it('3 main-course portions: 240 g rice, 80 mL wine, 900 mL stock', () => {
    const s = scale('classic_risotto');
    expect(g(s, 'risotto.arborio_rice').amount).toBe(240);
    expect(g(s, 'risotto.white_wine').amount).toBe(80);
    expect(g(s, 'risotto.stock').amount).toBeCloseTo(900, 9);
  });
  it('5 portions via servings mode: 400 g, 133.3 mL wine, 1,500 mL stock', () => {
    const base = baseInfo(R('classic_risotto'));
    const r = factorFromInputs('servings', { value: '', balls: '', ballWeight: '', servings: '5', portionG: '80' }, base);
    expect(r.ok).toBe(true);
    const s = scaleRecipe(R('classic_risotto'), { factor: (r as { factor: number }).factor });
    expect(g(s, 'risotto.arborio_rice').amount).toBeCloseTo(400, 9);
    expect(g(s, 'risotto.white_wine').amount).toBeCloseTo(133.333, 3);
    expect(g(s, 'risotto.stock').amount).toBeCloseTo(1500, 9);
  });
  it('60 g side portions and stock range', () => {
    const base = baseInfo(R('classic_risotto'));
    const r = factorFromInputs('servings', { value: '', balls: '', ballWeight: '', servings: '4', portionG: '60' }, base);
    expect((r as { factor: number }).factor).toBeCloseTo(1, 9);
    const hi = scaleRecipe(R('classic_risotto'), { factor: 1, tweaks: { stockPerG: 4.25 } });
    expect(g(hi, 'risotto.stock').amount).toBeCloseTo(1020, 9);
    const lo = scaleRecipe(R('classic_risotto'), { factor: 1, tweaks: { stockPerG: 3.5 } });
    expect(g(lo, 'risotto.stock').amount).toBeCloseTo(840, 9);
  });
  it('percentages are rice-based g vs mL', () => {
    const rows = ratioRows(scale('classic_risotto'));
    expect(rows.find((r) => r.key === 'risotto.stock')!.percent).toBeCloseTo(375, 9);
    expect(rows.find((r) => r.key === 'risotto.white_wine')!.percent).toBeCloseTo(33.3333, 3);
  });
  it('has no mass-scaling mode', () => {
    expect(baseInfo(R('classic_risotto')).massUsable).toBe(false);
  });
});

describe('scale targets & validation', () => {
  const base = baseInfo(R('classic_sourdough'));
  const inp = (value: string) => ({ value, balls: '6', ballWeight: '', servings: '', portionG: '80' });
  it('flour target', () => {
    expect(factorFromInputs('basis', inp('1040'), base)).toEqual({ ok: true, factor: 2 });
  });
  it('dough mass target', () => {
    const r = factorFromInputs('mass', inp('2024'), base);
    expect(r.ok && r.factor).toBeCloseTo(2, 9);
  });
  it('count target', () => {
    expect(factorFromInputs('count', inp('3'), base)).toEqual({ ok: true, factor: 3 });
  });
  it('rejects zero, negative, NaN, out of range with a message', () => {
    for (const v of ['0', '-1', 'abc', '', '999']) {
      const r = factorFromInputs('multiplier', inp(v), base);
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error.length).toBeGreaterThan(5);
    }
  });
  it('scaleRecipe throws on bad factor', () => {
    for (const f of [0, -2, NaN, Infinity]) expect(() => scaleRecipe(R('classic_sourdough'), { factor: f })).toThrow();
  });
  it('mode switch keeps the batch', () => {
    const f = 1.5;
    const i = inputsFromFactor(f, base);
    expect(Number(i.value)).toBeCloseTo(f, 9);
  });
  it('stepper', () => {
    expect(stepMultiplier(1, 1)).toBe(1.25);
    expect(stepMultiplier(2, 1)).toBe(2.5);
    expect(stepMultiplier(2, -1)).toBe(1.75);
    expect(stepMultiplier(0.25, -1)).toBe(0.25);
    expect(stepMultiplier(10, 1)).toBe(10);
  });
});

describe('parsing & formatting', () => {
  it('decimal comma and thousands', () => {
    expect(parseNumber('1,5')).toEqual({ ok: true, value: 1.5 });
    expect(parseNumber('1,250')).toEqual({ ok: true, value: 1250 });
    expect(parseNumber('1,250.5')).toEqual({ ok: true, value: 1250.5 });
    expect(parseNumber(' 2.25 ')).toEqual({ ok: true, value: 2.25 });
    expect(parseNumber('1e3').ok).toBe(false);
    expect(parseNumber('Infinity').ok).toBe(false);
  });
  it('display rounding is separate from arithmetic', () => {
    expect(formatMeasure(291.8333)).toBe('292');
    expect(formatMeasure(1751)).toBe('1,751');
    expect(formatMeasure(1.5)).toBe('1.5');
    expect(formatMeasure(0.375)).toBe('0.38');
    expect(formatMeasure(6, 'hundredth')).toBe('6');
    expect(formatFraction(0.25)).toBe('¼');
    expect(formatFraction(1.5)).toBe('1½');
    expect(formatFraction(0.4)).toBe('0.4');
    expect(formatFraction(2)).toBe('2');
    expect(formatFraction(1.999)).toBe('2');
  });
  it('amount formatting keeps original units', () => {
    expect(formatAmount(2, 'tbsp').text).toBe('2 tbsp');
    expect(formatAmount(0.25, 'tsp').text).toBe('¼ tsp');
    expect(formatAmount(1, 'large_orange').text).toBe('1 large orange');
    expect(formatAmount(750, 'ml').text).toBe('750 mL');
    expect(formatAmount(null, 'to_taste').text).toBe('to taste');
  });
});

describe('variants, reset and persistence', () => {
  const snapshot = JSON.stringify(SEED);
  it('editing a variant never touches the seed; reset restores originals', () => {
    const base = R('poolish_pizza');
    const v = createVariant(base, 'Less yeast', { 'poolish.poolish_yeast': 1, 'final_dough.salt': 30 });
    expect(v.amounts).toEqual({ 'poolish.poolish_yeast': 1 }); // unchanged salt not stored
    const s = scaleRecipe(base, { factor: 1, amounts: v.amounts });
    expect(g(s, 'poolish.poolish_yeast').amount).toBe(1);
    const reset = scaleRecipe(base, { factor: 1 });
    for (const c of reset.components) for (const i of c.ingredients) expect(i.amount).toBe(i.seedAmount);
    expect(JSON.stringify(SEED)).toBe(snapshot);
  });
  it('update bumps version, duplicate gets a new id', () => {
    const base = R('bens_focaccia');
    const v = createVariant(base, '  ', { 'dough.salt': 20 });
    expect(v.name).toContain('Ben’s Focaccia');
    const v2 = updateVariant(v, base, { amounts: { 'dough.salt': 22 } });
    expect(v2.version).toBe(2);
    expect(v2.amounts['dough.salt']).toBe(22);
    const d = duplicateVariant(v2);
    expect(d.id).not.toBe(v2.id);
    expect(d.version).toBe(1);
    expect(diffAmounts(base, { 'dough.nope': 3, 'dough.salt': -4 })).toEqual({});
  });
  it('edit scales gram equivalents proportionally', () => {
    const s = scale('bens_focaccia', 1, { amounts: { 'dough.olive_oil': 100 } });
    expect(g(s, 'dough.olive_oil').grams).toBeCloseTo(91, 9);
    expect(ingKey({ id: 'a' }, { id: 'b' })).toBe('a.b');
  });
  it('storage round-trip, migration, import merge', () => {
    const mem = new Map<string, string>();
    const kv = { getItem: (k: string) => mem.get(k) ?? null, setItem: (k: string, v: string) => void mem.set(k, v), removeItem: (k: string) => void mem.delete(k) };
    const st = emptyState();
    st.variants.push(createVariant(R('bens_focaccia'), 'Mine', { 'dough.salt': 20 }));
    expect(saveState(kv, st)).toBe(true);
    expect(loadState(kv)).toEqual(st);
    // v0 document (no version, no settings)
    const old = migrate({ variants: [{ id: 'a', baseId: 'x', name: 'n', amounts: { k: 1, bad: -1 } }] });
    expect(old.version).toBe(1);
    expect(old.settings.precision).toBe('auto');
    expect(old.variants[0].amounts).toEqual({ k: 1 });
    expect(() => migrate({ version: 99 })).toThrow();
    // corrupt storage falls back to empty
    mem.set(STORAGE_KEY, '{not json');
    expect(loadState(kv)).toEqual(emptyState());
    // export/import
    const text = exportState(st);
    expect(parseImport(text).variants).toHaveLength(1);
    expect(() => parseImport('nope')).toThrow();
    expect(() => parseImport('{"a":1}')).toThrow();
    const newer = { ...st.variants[0], name: 'Renamed', updatedAt: '2999-01-01T00:00:00.000Z' };
    expect(mergeImport(st, { ...st, variants: [newer] }).variants[0].name).toBe('Renamed');
    const older = { ...st.variants[0], name: 'Old', updatedAt: '1999-01-01T00:00:00.000Z' };
    expect(mergeImport(st, { ...st, variants: [older] }).variants[0].name).toBe('Mine');
  });
});
