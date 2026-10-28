import type { SeedLibrary } from './types';

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

/** Structural validation of the seed library. Returns a list of problems (empty = valid). */
export function validateSeed(data: unknown): string[] {
  const errs: string[] = [];
  if (!isObj(data)) return ['Seed is not an object'];
  if (typeof data.schema_version !== 'string') errs.push('schema_version missing');
  if (!Array.isArray(data.recipes) || data.recipes.length === 0) return [...errs, 'recipes[] missing or empty'];
  const seenRecipes = new Set<string>();
  for (const [ri, r] of (data.recipes as unknown[]).entries()) {
    if (!isObj(r)) {
      errs.push(`recipes[${ri}] is not an object`);
      continue;
    }
    const rid = String(r.id ?? `#${ri}`);
    if (typeof r.id !== 'string' || !r.id) errs.push(`recipes[${ri}].id missing`);
    if (seenRecipes.has(rid)) errs.push(`duplicate recipe id ${rid}`);
    seenRecipes.add(rid);
    if (typeof r.name !== 'string') errs.push(`${rid}: name missing`);
    const basis = r.ratio_basis;
    if (!isObj(basis) || typeof basis.amount !== 'number' || !(basis.amount > 0)) errs.push(`${rid}: ratio_basis.amount must be > 0`);
    if (!Array.isArray(r.components) || r.components.length === 0) {
      errs.push(`${rid}: components[] missing`);
      continue;
    }
    const keys = new Set<string>();
    for (const c of r.components as unknown[]) {
      if (!isObj(c) || typeof c.id !== 'string' || !Array.isArray(c.ingredients)) {
        errs.push(`${rid}: malformed component`);
        continue;
      }
      if (typeof c.include_in_dough_mass !== 'boolean') errs.push(`${rid}.${c.id}: include_in_dough_mass must be boolean`);
      for (const i of c.ingredients as unknown[]) {
        if (!isObj(i) || typeof i.id !== 'string' || typeof i.name !== 'string' || typeof i.unit !== 'string') {
          errs.push(`${rid}.${c.id}: malformed ingredient`);
          continue;
        }
        const k = `${c.id}.${i.id}`;
        if (keys.has(k)) errs.push(`${rid}: duplicate ingredient key ${k}`);
        keys.add(k);
        if (i.amount !== null && (typeof i.amount !== 'number' || !Number.isFinite(i.amount) || i.amount < 0)) errs.push(`${rid}.${k}: amount must be a non-negative number or null`);
        if (i.amount === null && i.unit !== 'to_taste') errs.push(`${rid}.${k}: null amount requires unit to_taste`);
      }
    }
    if (!Array.isArray(r.method)) errs.push(`${rid}: method[] missing`);
    if (!Array.isArray(r.notes)) errs.push(`${rid}: notes[] missing`);
  }
  return errs;
}

export function assertSeed(data: unknown): SeedLibrary {
  const errs = validateSeed(data);
  if (errs.length) throw new Error('Invalid recipe seed:\n' + errs.join('\n'));
  return data as SeedLibrary;
}
