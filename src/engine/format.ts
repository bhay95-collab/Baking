import { unitKind, unitLabel } from './units';
import type { Settings, Unit } from './types';

const FRACS: [number, string][] = [
  [0, ''], [1 / 8, '⅛'], [1 / 4, '¼'], [1 / 3, '⅓'], [3 / 8, '⅜'], [1 / 2, '½'],
  [5 / 8, '⅝'], [2 / 3, '⅔'], [3 / 4, '¾'], [7 / 8, '⅞'], [1, ''],
];

const nf = new Intl.NumberFormat('en-AU', { maximumFractionDigits: 2, useGrouping: true });

/** Strip trailing zeros: 3.50 → "3.5". */
function fixed(n: number, dp: number): string {
  return nf.format(+n.toFixed(dp));
}

/** Gram / mL display. Calculation precision is untouched — this is display only. */
export function formatMeasure(n: number, precision: Settings['precision'] = 'auto'): string {
  if (precision === 'tenth') return fixed(n, 1);
  if (precision === 'hundredth') return fixed(n, 2);
  const a = Math.abs(n);
  if (a >= 10) return fixed(n, 0);
  if (a >= 1) return fixed(n, 1);
  return fixed(n, 2);
}

/** Spoon / count fractions: 0.25 → "¼", 1.5 → "1½", 0.4 → "0.4". */
export function formatFraction(n: number): string {
  const whole = Math.floor(n + 1e-9);
  const frac = n - whole;
  for (const [v, sym] of FRACS) {
    if (Math.abs(frac - v) < 0.012) {
      if (v === 1) return String(whole + 1);
      return `${whole > 0 || !sym ? whole : ''}${sym}` || '0';
    }
  }
  return fixed(n, 2);
}

export const formatPercent = (n: number, decimals = 1) => `${fixed(n, decimals)}%`;

export interface FormattedAmount {
  qty: string;
  unit: string;
  text: string;
  /** e.g. "(beat and weigh half)" for fractional eggs */
  hint?: string;
}

export function formatAmount(amount: number | null, unit: Unit, precision: Settings['precision'] = 'auto'): FormattedAmount {
  if (amount === null || unit === 'to_taste') return { qty: 'to taste', unit: '', text: 'to taste' };
  const kind = unitKind(unit);
  let qty: string;
  let hint: string | undefined;
  if (kind === 'spoon') qty = formatFraction(amount);
  else if (kind === 'count') {
    const isInt = Math.abs(amount - Math.round(amount)) < 1e-9;
    if (unit === 'egg') {
      qty = isInt ? String(Math.round(amount)) : fixed(amount, 1);
      if (!isInt) hint = Math.abs(amount * 2 - Math.round(amount * 2)) < 1e-9 ? '(beat and weigh half)' : '(beat and weigh)';
    } else qty = isInt ? String(Math.round(amount)) : formatFraction(amount);
  } else qty = formatMeasure(amount, precision);
  const u = unitLabel(unit, amount);
  return { qty, unit: u, text: `${qty} ${u}`.trim(), hint };
}

/** "≈ 292 g" style equivalent. */
export const formatGrams = (g: number, precision: Settings['precision'] = 'auto') => `${formatMeasure(g, precision)} g`;

export function formatMetric(value: number, format: 'g' | 'ml' | 'pct' | 'count' | 'text', decimals = 1, precision: Settings['precision'] = 'auto'): string {
  switch (format) {
    case 'g': return formatGrams(value, precision);
    case 'ml': return `${formatMeasure(value, precision)} mL`;
    case 'pct': return formatPercent(value, decimals);
    case 'count': return fixed(value, 1);
    default: return String(value);
  }
}
