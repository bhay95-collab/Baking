import { describe, expect, it } from 'vitest';
import { CONVERSIONS, MAX_SECTION_CARDS, MEASURES, RATIOS, baseAmount, cardsIn, defaultVariant, equivalentGrams, fromGrams, getCard, parseAmount, solveVariant, toGrams, validateRatios } from '../src/engine/ratios';
import { formatAmount } from '../src/engine/format';

const card = (id: string) => getCard(id)!;
const row = (rows: ReturnType<typeof solveVariant>, id: string) => rows.find((r) => r.id === id)!;
const solve = (cid: string, vid: string, anchor: string, amount: number, std: 'au' | 'us' = 'au') => {
  const c = card(cid);
  return solveVariant(c, c.variants.find((v) => v.id === vid)!, anchor, amount, std);
};

describe('ratio library', () => {
  it('is well formed', () => {
    expect(validateRatios(RATIOS)).toEqual([]);
    expect(RATIOS.cards.length).toBe(49);
  });
  it('splits everything into short sections', () => {
    expect(RATIOS.groups.length).toBeLessThanOrEqual(4);
    for (const sec of RATIOS.sections) {
      const n = cardsIn(sec.id).length;
      expect(n, sec.id).toBeGreaterThan(0);
      expect(n, sec.id).toBeLessThanOrEqual(MAX_SECTION_CARDS);
    }
    for (const g of RATIOS.groups) expect(RATIOS.sections.filter((s) => s.group === g.id).length, g.id).toBeLessThanOrEqual(4);
    expect(RATIOS.cards.every((c) => RATIOS.sections.some((s) => s.id === c.section))).toBe(true);
  });
  it('rejects a section that grows too long', () => {
    const bad = structuredClone(RATIOS);
    for (const c of bad.cards.slice(0, MAX_SECTION_CARDS + 1)) c.section = 'dough';
    expect(validateRatios(bad).some((e) => e.includes('too many'))).toBe(true);
  });
  it('opens on the headline version', () => {
    expect(defaultVariant(card('vinaigrette')).id).toBe('classic');
    expect(defaultVariant(card('wet_brine')).id).toBe('standard');
    expect(defaultVariant(card('rice')).id).toBe('jasmine');
  });
  it('flags problems', () => {
    const bad = structuredClone(RATIOS);
    bad.cards[0].status = 'varies';
    delete bad.cards[0].flag;
    bad.cards[1].variants[0].ingredients[0].amount = 0;
    bad.cards[2].variants[0].ingredients[0].unit = 'cup';
    expect(validateRatios(bad).length).toBeGreaterThanOrEqual(3);
  });
  it('every card and variant solves from every ingredient', () => {
    for (const c of RATIOS.cards)
      for (const v of c.variants)
        for (const i of v.ingredients) {
          const rows = solveVariant(c, v, i.id, i.amount * 3);
          expect(rows).toHaveLength(v.ingredients.length);
          for (const r of rows) expect(r.amount).toBeGreaterThan(0);
          expect(rows.find((r) => r.id === i.id)!.amount).toBeCloseTo(i.amount * 3, 9);
        }
  });
  it('covers the agreed list', () => {
    const ids = RATIOS.cards.map((c) => c.id);
    for (const id of ['yeast_loaf', 'ciabatta', 'pasta_egg', 'pasta_semolina', 'pie_dough', 'biscuits', 'pancakes', 'pound_cake', 'sponge', 'cookies', 'choux', 'meringue', 'custard', 'ganache',
      'rice', 'pasta_cooking', 'polenta', 'grains', 'stock', 'roux', 'vinaigrette', 'syrup', 'jam', 'coffee', 'wet_brine', 'dry_brine', 'quick_pickle', 'fermenting', 'leavening', 'starter',
      'mayonnaise', 'tahini_sauce', 'tzatziki', 'hummus', 'guacamole', 'chimichurri', 'salsa_verde', 'pesto', 'gremolata', 'pico', 'red_wine_sauce', 'hollandaise', 'beurre_blanc', 'tomato_sauce',
      'cowboy_butter', 'garlic_herb_butter', 'honey_butter', 'chilli_lime_butter', 'miso_butter'])
      expect(ids, id).toContain(id);
  });
});

describe('solving ratios', () => {
  it('vinaigrette 3:1', () => {
    const r = solve('vinaigrette', 'classic', 'oil', 300);
    expect(row(r, 'vinegar').amount).toBeCloseTo(100, 9);
    const back = solve('vinaigrette', 'classic', 'vinegar', 75);
    expect(row(back, 'oil').amount).toBeCloseTo(225, 9);
  });
  it('keeps the batch when the anchor changes', () => {
    const v = card('vinaigrette').variants[1];
    const f = 200 / baseAmount(v, 'oil');
    expect(solveVariant(card('vinaigrette'), v, 'vinegar', baseAmount(v, 'vinegar') * f).find((r) => r.id === 'oil')!.amount).toBeCloseTo(200, 9);
  });
  it('baker\'s percentages: yeast loaf is 100 / 65 / 2 / 1', () => {
    const r = solve('yeast_loaf', 'standard', 'flour', 800);
    expect(row(r, 'flour').percent).toBeCloseTo(100, 9);
    expect(row(r, 'water').percent).toBeCloseTo(65, 9);
    expect(row(r, 'salt').percent).toBeCloseTo(2, 9);
    expect(row(r, 'yeast').percent).toBeCloseTo(1, 9);
    expect(row(r, 'water').amount).toBeCloseTo(520, 9);
  });
  it('ciabatta is 78% water', () => {
    expect(row(solve('ciabatta', 'standard', 'flour', 1000), 'water').amount).toBeCloseTo(780, 9);
  });
  it('pasta: 100 g flour per egg, and 3:2', () => {
    const r = solve('pasta_egg', 'per_egg', 'flour', 500);
    expect(row(r, 'egg').amount).toBeCloseTo(5, 9);
    expect(formatAmount(row(solve('pasta_egg', 'per_egg', 'flour', 250), 'egg').amount, 'egg').text).toBe('2.5 eggs');
    expect(row(solve('pasta_egg', 'rich', 'flour', 300), 'egg').amount).toBeCloseTo(200, 9);
    expect(row(solve('pasta_semolina', 'standard', 'semolina', 400), 'water').amount).toBeCloseTo(200, 9);
  });
  it('pie dough 3:2:1 and 2:1', () => {
    const r = solve('pie_dough', 'rich', 'flour', 300);
    expect([row(r, 'fat').amount, row(r, 'water').amount]).toEqual([200, 100]);
    expect(row(solve('pie_dough', 'short', 'flour', 500), 'fat').amount).toBeCloseTo(250, 9);
  });
  it('equal-weight cakes', () => {
    const r = solve('pound_cake', 'standard', 'butter', 450);
    for (const id of ['sugar', 'egg', 'flour']) expect(row(r, id).amount).toBeCloseTo(450, 9);
    expect(row(solve('meringue', 'hard', 'white', 150), 'sugar').amount).toBeCloseTo(300, 9);
    expect(row(solve('meringue', 'soft', 'white', 150), 'sugar').amount).toBeCloseTo(150, 9);
  });
  it('ganache: 1:1 and 2:1', () => {
    expect(row(solve('ganache', 'glaze', 'choc', 300), 'cream').amount).toBeCloseTo(300, 9);
    expect(row(solve('ganache', 'truffle', 'choc', 400), 'cream').amount).toBeCloseTo(200, 9);
  });
  it('pasta cooking, brine and dry brine', () => {
    const p = solve('pasta_cooking', 'standard', 'pasta', 400);
    expect([row(p, 'water').amount, row(p, 'salt').amount]).toEqual([4000, 40]);
    expect(row(solve('wet_brine', 'standard', 'water', 2000), 'salt').amount).toBeCloseTo(100, 9);
    expect(row(solve('dry_brine', 'standard', 'meat', 2400), 'salt').amount).toBeCloseTo(36, 9);
    expect(row(solve('fermenting', 'kraut', 'veg', 1500), 'salt').amount).toBeCloseTo(30, 9);
  });
  it('coffee, syrup, jam', () => {
    expect(row(solve('coffee', 'filter', 'water', 500), 'coffee').amount).toBeCloseTo(31.25, 9);
    expect(row(solve('coffee', 'espresso', 'coffee', 18), 'water').amount).toBeCloseTo(36, 9);
    expect(row(solve('syrup', 'rich', 'water', 100), 'sugar').amount).toBeCloseTo(200, 9);
    expect(row(solve('jam', 'traditional', 'fruit', 1000), 'sugar').amount).toBeCloseTo(1000, 9);
  });
  it('starter feeding matches the sourdough recipe build', () => {
    const r = solve('starter', 'stiff', 'starter', 15);
    expect([row(r, 'flour').amount, row(r, 'water').amount]).toEqual([75, 45]);
  });
  it('rice by volume with approximate weights that follow the cup size', () => {
    const au = solve('rice', 'jasmine', 'rice', 2, 'au');
    expect(row(au, 'water').amount).toBeCloseTo(3, 9);
    expect(row(au, 'rice').grams).toBeCloseTo(2 * 250 * 0.78, 6);
    expect(row(au, 'rice').gramsApprox).toBe(true);
    const us = solve('rice', 'jasmine', 'rice', 2, 'us');
    expect(row(us, 'rice').grams).toBeCloseTo(2 * 236.588 * 0.78, 6);
    expect(row(solve('rice', 'brown', 'rice', 1), 'water').amount).toBeCloseTo(2.25, 9);
    expect(formatAmount(row(solve('rice', 'white', 'rice', 1), 'water').amount, 'cup').text).toBe('1¾ cups');
  });
  it('roux scales with the liquid', () => {
    const r = solve('roux', 'medium', 'liquid', 2);
    expect(row(r, 'flour').amount).toBeCloseTo(4, 9);
    expect(formatAmount(row(solve('roux', 'thin', 'liquid', 0.5), 'flour').amount, 'tbsp').text).toBe('½ tbsp');
  });
  it('leavening and spoon weights', () => {
    const r = solve('leavening', 'powder', 'flour', 120);
    expect(row(r, 'bp').amount).toBeCloseTo(1, 9);
    expect(equivalentGrams(card('leavening').variants[0].ingredients[1], 1, 'au')).toBeCloseTo(4, 6);
    expect(row(solve('leavening', 'soda', 'flour', 120), 'soda').amount).toBeCloseTo(0.25, 9);
  });
  it('sauces: hollandaise, mayonnaise, chimichurri', () => {
    const h = solve('hollandaise', 'hollandaise', 'yolk', 3);
    expect(row(h, 'butter').amount).toBeCloseTo(225, 9);
    expect(row(solve('hollandaise', 'hollandaise', 'butter', 450), 'yolk').amount).toBeCloseTo(6, 9);
    expect(row(solve('mayonnaise', 'mayo', 'yolk', 1), 'oil').amount).toBeCloseTo(200, 9);
    const c = solve('chimichurri', 'classic', 'parsley', 120);
    expect(row(c, 'oil').amount).toBeCloseTo(250, 9);
    expect(row(c, 'garlic').amount).toBeCloseTo(8, 9);
    expect(row(solve('red_wine_sauce', 'everyday', 'wine', 500), 'stock').amount).toBeCloseTo(500, 9);
  });
  it('flavoured butters scale off the butter', () => {
    const r = solve('cowboy_butter', 'standard', 'butter', 250);
    expect(row(r, 'mustard').amount).toBeCloseTo(30, 9);
    expect(row(r, 'garlic').amount).toBeCloseTo(8, 9);
    expect(row(solve('miso_butter', 'standard', 'miso', 80), 'butter').amount).toBeCloseTo(250, 9);
  });
  it('counts read naturally: cloves and whole pieces', () => {
    expect(formatAmount(4, 'clove').text).toBe('4 cloves');
    expect(formatAmount(1, 'clove').text).toBe('1 clove');
    expect(formatAmount(0.5, 'clove').text).toBe('½ clove');
    expect(formatAmount(3, 'piece').text).toBe('3');
  });
  it('rejects bad anchors', () => {
    for (const bad of [0, -3, NaN, Infinity]) expect(() => solve('vinaigrette', 'classic', 'oil', bad)).toThrow();
    expect(parseAmount('1,5')).toEqual({ ok: true, value: 1.5 });
    expect(parseAmount('abc').ok).toBe(false);
    expect(parseAmount('0').ok).toBe(false);
    expect(parseAmount('9999999').ok).toBe(false);
  });
});

describe('cups to grams', () => {
  const item = (id: string) => CONVERSIONS.items.find((i) => i.id === id)!;
  it('plain flour is 120 g per US cup (King Arthur)', () => {
    expect(toGrams(item('flour_plain'), 1, 'cup', 'us')).toBeCloseTo(120, 1);
    expect(fromGrams(item('flour_plain'), 120, 'cup', 'us')).toBeCloseTo(1, 3);
  });
  it('an Australian cup is bigger, so it holds more', () => {
    expect(toGrams(item('flour_plain'), 1, 'cup', 'au')).toBeCloseTo((120 * 250) / 236.588, 1);
    expect(MEASURES.au.tbsp).toBe(20);
    expect(toGrams(item('water'), 1, 'cup', 'au')).toBeCloseTo(250 * (237 / 236.588), 0);
  });
  it('round trips for every item, unit and standard', () => {
    for (const it of CONVERSIONS.items)
      for (const u of ['cup', 'tbsp', 'tsp', 'ml'] as const)
        for (const s of ['au', 'us'] as const) expect(fromGrams(it, toGrams(it, 3.7, u, s), u, s)).toBeCloseTo(3.7, 9);
  });
  it('spoon sizes stay in proportion to the cup (US)', () => {
    expect(toGrams(item('sugar'), 16, 'tbsp', 'us')).toBeCloseTo(toGrams(item('sugar'), 1, 'cup', 'us'), 0);
    expect(toGrams(item('sugar'), 48, 'tsp', 'us')).toBeCloseTo(toGrams(item('sugar'), 1, 'cup', 'us'), 0);
  });
  it('densities are sane', () => {
    for (const it of CONVERSIONS.items) {
      expect(it.gPerMl).toBeGreaterThan(0.2);
      expect(it.gPerMl).toBeLessThan(1.6);
      expect(it.gPerMl).toBeCloseTo(it.gPerUsCup / CONVERSIONS.usCupMl, 3);
    }
  });
});
