export type ParseResult = { ok: true; value: number } | { ok: false; error: string };

/**
 * Robust number parsing: accepts "1.5", "1,5" (decimal comma) and "1,200" (thousands).
 * Rejects empty, NaN, Infinity and anything not strictly positive (unless allowZero).
 */
export function parseNumber(input: string | number, opts: { allowZero?: boolean; label?: string } = {}): ParseResult {
  const label = opts.label ?? 'Value';
  let s = typeof input === 'number' ? String(input) : input;
  s = s.trim().replace(/\s+/g, '');
  if (s === '') return { ok: false, error: `${label} is empty — enter a number.` };
  if (s.includes('.') && s.includes(',')) {
    s = s.replace(/,/g, '');
  } else if (s.includes(',')) {
    s = /^\d{1,3}(,\d{3})+$/.test(s) ? s.replace(/,/g, '') : s.replace(',', '.');
  }
  if (!/^\d*\.?\d+$|^\d+\.$/.test(s)) return { ok: false, error: `${label} "${String(input).trim()}" is not a number.` };
  const n = Number(s);
  if (!Number.isFinite(n)) return { ok: false, error: `${label} is not a finite number.` };
  if (n < 0 || (n === 0 && !opts.allowZero)) return { ok: false, error: `${label} must be greater than zero.` };
  return { ok: true, value: n };
}
