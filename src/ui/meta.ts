import type { Recipe, SourceStatus } from '../engine/types';

export type MethodStatus = 'none' | 'partial' | 'full' | 'proposed';

export const METHOD_META: Record<string, { status: MethodStatus; note: string; asNotes?: boolean }> = {
  classic_sourdough: { status: 'none', note: 'The source formula has no method — only quantities.' },
  poolish_pizza: { status: 'partial', note: 'The poster lists quantities only. No fermentation time, resting or bake settings were supplied.' },
  bens_focaccia: { status: 'full', note: 'Transcribed from the source recipe.' },
  bens_raisin_bread: { status: 'full', note: 'Transcribed from the source recipe.' },
  hot_cross_buns: { status: 'partial', note: 'The source PDF shows ingredients and “Cook time: 30 mins” only. Proofing, shaping and crossing are not in it.', asNotes: true },
  croissant_classic: { status: 'proposed', note: 'A proposed trial formulation, not a documented household recipe. Times and temperatures are guidance — adjust to your kitchen.' },
  croissant_red: { status: 'proposed', note: 'A proposed trial formulation, not a documented household recipe. Times and temperatures are guidance — adjust to your kitchen.' },
  classic_risotto: { status: 'proposed', note: 'A proposed house-standard ratio, not a transcribed personal recipe.' },
};

export const METHOD_BADGE: Record<MethodStatus, string> = {
  none: 'No method in source',
  partial: 'Method incomplete in source',
  full: 'Method from source',
  proposed: 'Proposed method',
};

export const STATUS_LABEL: Record<SourceStatus | 'estimated', string> = {
  original: 'Original recipe',
  calculated: 'Calculated',
  estimated: 'Estimated conversion',
  suggested: 'Suggested setting',
  personal_edit: 'Personal edit',
};

export const STATUS_SHORT: Record<SourceStatus | 'estimated', string> = {
  original: 'Original',
  calculated: 'Calculated',
  estimated: 'Estimated',
  suggested: 'Suggested',
  personal_edit: 'Personal edit',
};

export const STATUS_ICON: Record<SourceStatus | 'estimated', string> = {
  original: '●',
  calculated: 'ƒ',
  estimated: '≈',
  suggested: '★',
  personal_edit: '✎',
};

const range = (v: unknown, unit: string, sep = '–') =>
  Array.isArray(v) ? `${v[0]}${v[0] === v[1] ? '' : sep + v[1]} ${unit}` : `${v} ${unit}`;

/** Timing/temperature facts pulled from `derived` + `yield` — guidance only, never computed from quantity. */
export function guidanceChips(recipe: Recipe): { label: string; value: string }[] {
  const d = recipe.derived ?? {};
  const out: { label: string; value: string }[] = [];
  const add = (label: string, v: unknown, unit: string) => v !== undefined && out.push({ label, value: range(v, unit) });
  add('Dough temp after mixing', d.mix_target_dough_temp_c, '°C');
  add('Butter block', d.butter_block_temp_c, '°C');
  add('Proof temperature', d.proof_c, '°C');
  add('Proof time', d.proof_hours, 'h');
  add('Red sheet thickness', d.red_sheet_thickness_mm, 'mm');
  add('Oven (fan)', d.fan_oven_c ?? d.bake_fan_c, '°C');
  add('Oven', d.bake_c, '°C');
  add('Bake time', d.bake_minutes ?? recipe.yield.bake_minutes, 'min');
  add('Stock range', d.stock_ml_per_g_rice_range, 'mL per g rice');
  return out;
}
