import { useState } from 'react';
import { INCLUSIONS, HARD_LIMIT_PCT, STRENGTHS, pctText, type CustomInclusion, type InclusionPick, type InclusionPlan, type Strength } from '../engine/inclusions';
import { formatMeasure } from '../engine/format';
import { parseNumber } from '../engine/parse';
import { Icon } from './icons';

export interface InclusionState {
  strength: Strength;
  picks: InclusionPick[];
  customs: CustomInclusion[];
}

export const EMPTY_INCLUSIONS: InclusionState = { strength: 'classic', picks: [], customs: [] };

const STRENGTH_LABEL: Record<Strength, string> = { light: 'Light', classic: 'Classic', loaded: 'Loaded' };
const STRENGTH_HINT: Record<Strength, string> = {
  light: 'A little in every bite.',
  classic: 'What most bakers use.',
  loaded: 'Packed. Expect a denser crumb.',
};

const plain = (g: number) => String(+g.toFixed(1));

export function Inclusions({ state, plan, loaves, onChange }: { state: InclusionState; plan: InclusionPlan; loaves: number | null; onChange: (s: InclusionState) => void }) {
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [adding, setAdding] = useState(false);
  const [custom, setCustom] = useState({ name: '', pct: '15' });
  const [customErr, setCustomErr] = useState<string | null>(null);
  const picked = new Set(state.picks.map((p) => p.id));
  const open = state.picks.length > 0;

  const add = (id: string) => onChange({ ...state, picks: [...state.picks, { id }] });
  const remove = (id: string) =>
    onChange({ ...state, picks: state.picks.filter((p) => p.id !== id), customs: state.customs.filter((c) => c.id !== id) });
  const setOwn = (id: string, pct: number | undefined) => onChange({ ...state, picks: state.picks.map((p) => (p.id === id ? { ...p, pct } : p)) });

  const type = (id: string, text: string) => {
    setDrafts((d) => ({ ...d, [id]: text }));
    const r = parseNumber(text, { label: 'Grams' });
    if (r.ok && plan.flourG > 0) setOwn(id, (100 * r.value) / plan.flourG);
  };
  const settle = (id: string) =>
    setDrafts((d) => {
      const { [id]: _gone, ...rest } = d;
      return rest;
    });

  const addCustom = () => {
    const name = custom.name.trim();
    const pct = parseNumber(custom.pct, { label: 'Percentage' });
    if (!name) return setCustomErr('Give it a name.');
    if (!pct.ok) return setCustomErr(pct.error);
    if (pct.value > HARD_LIMIT_PCT) return setCustomErr(`Keep it under ${HARD_LIMIT_PCT}% of the flour.`);
    const id = `custom_${Date.now().toString(36)}`;
    onChange({ ...state, picks: [...state.picks, { id }], customs: [...state.customs, { id, name, pct: pct.value }] });
    setCustom({ name: '', pct: '15' });
    setCustomErr(null);
    setAdding(false);
  };

  return (
    <details className="inclusions" open={open || undefined}>
      <summary>
        <Icon name="chevron" size={16} /> Add inclusions
        {open && <span className="inc-count">{state.picks.length} added</span>}
      </summary>

      <p className="hint">Cheese, nuts, spices and more. Amounts are a share of the {formatMeasure(plan.flourG)} g of flour in this batch.</p>

      <div className="inc-controls">
        <div className="field">
          <label htmlFor="inc-add">Add an inclusion</label>
          <select
            id="inc-add"
            value=""
            onChange={(e) => {
              if (e.target.value === '__custom') setAdding(true);
              else if (e.target.value) add(e.target.value);
            }}
          >
            <option value="">Choose…</option>
            {INCLUSIONS.categories.map((c) => (
              <optgroup key={c.id} label={c.label}>
                {INCLUSIONS.items.filter((i) => i.category === c.id).map((i) => (
                  <option key={i.id} value={i.id} disabled={picked.has(i.id)}>{i.name}{picked.has(i.id) ? ' (added)' : ''}</option>
                ))}
              </optgroup>
            ))}
            <option value="__custom">Something else…</option>
          </select>
        </div>

        <fieldset className="say-it">
          <legend>How much</legend>
          <div className="seg">
            {STRENGTHS.map((s) => (
              <label key={s} className={s === state.strength ? 'on' : undefined}>
                <input type="radio" name="inc-strength" checked={s === state.strength} onChange={() => onChange({ ...state, strength: s })} />
                {STRENGTH_LABEL[s]}
              </label>
            ))}
          </div>
          <p className="hint">{STRENGTH_HINT[state.strength]}</p>
        </fieldset>
      </div>

      {adding && (
        <form
          className="inc-custom"
          onSubmit={(e) => {
            e.preventDefault();
            addCustom();
          }}
        >
          <div className="field">
            <label htmlFor="inc-name">Name</label>
            <input id="inc-name" value={custom.name} maxLength={60} onChange={(e) => setCustom({ ...custom, name: e.target.value })} autoFocus />
          </div>
          <div className="field">
            <label htmlFor="inc-pct">% of flour</label>
            <input id="inc-pct" inputMode="decimal" value={custom.pct} onChange={(e) => setCustom({ ...custom, pct: e.target.value })} />
          </div>
          <div className="inc-custom-actions">
            <button type="submit" className="btn primary">Add</button>
            <button type="button" className="btn text" onClick={() => { setAdding(false); setCustomErr(null); }}>Cancel</button>
          </div>
          {customErr && <p className="error small" role="alert">{customErr}</p>}
        </form>
      )}

      {plan.items.length > 0 && (
        <ul className="inc-list">
          {plan.items.map((it) => {
            const bad = drafts[it.id] !== undefined && !parseNumber(drafts[it.id]).ok;
            return (
              <li key={it.id}>
                <div className="inc-name">
                  <span>{it.name}</span>
                  <span className="muted small">
                    {pctText(it.pct)} of flour
                    {it.edited && <> · <button type="button" className="link-btn" onClick={() => { setOwn(it.id, undefined); settle(it.id); }}>Back to {plain(it.suggestedGrams)} g</button></>}
                  </span>
                </div>
                <div className="inc-amount">
                  <input
                    className={`inc-g${it.edited ? ' edited' : ''}`}
                    aria-label={`Grams of ${it.name}`}
                    aria-invalid={bad}
                    inputMode="decimal"
                    autoComplete="off"
                    autoCorrect="off"
                    spellCheck={false}
                    enterKeyHint="done"
                    value={drafts[it.id] ?? plain(it.grams)}
                    onChange={(e) => type(it.id, e.target.value)}
                    onFocus={(e) => e.currentTarget.select()}
                    onBlur={() => settle(it.id)}
                    onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
                  />
                  <span className="unit">g</span>
                </div>
                <button type="button" className="btn text icon-btn" onClick={() => remove(it.id)} aria-label={`Remove ${it.name}`}><Icon name="close" /></button>
              </li>
            );
          })}
        </ul>
      )}

      {plan.items.length > 0 && (
        <p className="inc-total">
          <b>{formatMeasure(plan.totalGrams)} g</b> in total
          {loaves && loaves > 0 && <> · about <b>{formatMeasure(plan.totalGrams / loaves)} g</b> per loaf</>}
        </p>
      )}
      {plan.reduced && (
        <p className="notice" role="note">
          Together these would be {+plan.uncappedBulkPct.toFixed(0)}% of the flour. They are scaled down to {plan.capPct}% so the dough can still rise. Choose “Loaded” if you want more.
        </p>
      )}
      {plan.overLimit && (
        <p className="error" role="alert">
          That is {+plan.bulkPct.toFixed(0)}% of the flour in add-ins. Above {HARD_LIMIT_PCT}% the dough tears and rises poorly.
        </p>
      )}
      <p className="hint">Suggested amounts are common starting points, not tested for your dough. Fold inclusions in at the last stretch and fold. They are not counted in dough weight or hydration.</p>
    </details>
  );
}
