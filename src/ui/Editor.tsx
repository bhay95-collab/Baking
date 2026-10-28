import { useEffect, useState } from 'react';
import { Modal } from './Modal';
import { parseNumber } from '../engine/parse';
import { ingKey, tweakDriven } from '../engine/scale';
import { formatAmount } from '../engine/format';
import type { Recipe } from '../engine/types';

/** Edit base (1×) amounts of the working copy. Never touches the seed. */
export function EditDialog({ open, onClose, recipe, amounts, onApply }: { open: boolean; onClose: () => void; recipe: Recipe; amounts: Record<string, number>; onApply: (next: Record<string, number>) => void }) {
  const [draft, setDraft] = useState<Record<string, string>>({});
  useEffect(() => {
    if (!open) return;
    const d: Record<string, string> = {};
    for (const c of recipe.components) for (const i of c.ingredients) if (i.amount !== null) d[ingKey(c, i)] = String(+(amounts[ingKey(c, i)] ?? i.amount).toFixed(4));
    setDraft(d);
  }, [open, recipe, amounts]);

  const errors: Record<string, string> = {};
  const parsed: Record<string, number> = {};
  for (const c of recipe.components)
    for (const i of c.ingredients) {
      const k = ingKey(c, i);
      if (i.amount === null || !(k in draft)) continue;
      const r = parseNumber(draft[k], { allowZero: true, label: i.name });
      if (r.ok) parsed[k] = r.value;
      else errors[k] = r.error;
    }
  const hasErr = Object.keys(errors).length > 0;

  return (
    <Modal open={open} onClose={onClose} title="Edit base formula" wide>
      <p className="hint">These are the 1× amounts of your working copy. The original recipe is never changed — you can reset any time or save the result as a personal variant.</p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!hasErr) {
            onApply(parsed);
            onClose();
          }
        }}
      >
        {recipe.components.map((c) => {
          const rows = c.ingredients.filter((i) => i.amount !== null);
          if (!rows.length) return null;
          return (
            <fieldset key={c.id} className="edit-group">
              <legend className="sticker small">{c.label}</legend>
              {rows.map((i) => {
                const k = ingKey(c, i);
                const driven = tweakDriven(recipe, i);
                const changed = parsed[k] !== undefined && Math.abs(parsed[k] - (i.amount ?? 0)) > 1e-9;
                return (
                  <div className="edit-row" key={k}>
                    <label htmlFor={`e-${k}`}>{i.name}</label>
                    {driven ? (
                      <span className="muted">{driven === 'stock' ? 'Set by the stock allowance slider' : 'Set by the colour slider'}</span>
                    ) : (
                      <>
                        <div className="input-unit">
                          <input id={`e-${k}`} inputMode="decimal" autoComplete="off" value={draft[k] ?? ''} onChange={(e) => setDraft({ ...draft, [k]: e.target.value })} aria-invalid={!!errors[k]} />
                          <span>{formatAmount(1, i.unit).unit.replace(/^eggs?$/, 'egg(s)') || i.unit}</span>
                        </div>
                        <button type="button" className="btn ghost small" disabled={!changed} onClick={() => setDraft({ ...draft, [k]: String(i.amount) })} aria-label={`Revert ${i.name} to ${i.amount}`}>
                          {changed ? `↺ ${i.amount}` : 'Original'}
                        </button>
                      </>
                    )}
                    {errors[k] && <p className="alert small" role="alert">{errors[k]}</p>}
                  </div>
                );
              })}
            </fieldset>
          );
        })}
        <div className="modal-actions">
          <button type="button" className="btn ghost" onClick={onClose}>Cancel</button>
          <button type="button" className="btn ghost" onClick={() => onApply({})}>Reset all to original</button>
          <button type="submit" className="btn primary" disabled={hasErr}>Apply edits</button>
        </div>
      </form>
    </Modal>
  );
}

export function NameDialog({ open, onClose, title, label, initial, cta, onSubmit }: { open: boolean; onClose: () => void; title: string; label: string; initial: string; cta: string; onSubmit: (name: string) => void }) {
  const [name, setName] = useState(initial);
  useEffect(() => {
    if (open) setName(initial);
  }, [open, initial]);
  return (
    <Modal open={open} onClose={onClose} title={title}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (name.trim()) {
            onSubmit(name.trim());
            onClose();
          }
        }}
      >
        <div className="field">
          <label htmlFor="name-in">{label}</label>
          <input id="name-in" value={name} maxLength={120} onChange={(e) => setName(e.target.value)} autoFocus />
        </div>
        <div className="modal-actions">
          <button type="button" className="btn ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn primary" disabled={!name.trim()}>{cta}</button>
        </div>
      </form>
    </Modal>
  );
}

export function ConfirmDialog({ open, onClose, title, body, cta, danger, onConfirm }: { open: boolean; onClose: () => void; title: string; body: string; cta: string; danger?: boolean; onConfirm: () => void }) {
  return (
    <Modal open={open} onClose={onClose} title={title}>
      <p>{body}</p>
      <div className="modal-actions">
        <button type="button" className="btn ghost" onClick={onClose}>Cancel</button>
        <button type="button" className={`btn ${danger ? 'danger' : 'primary'}`} onClick={() => { onConfirm(); onClose(); }}>{cta}</button>
      </div>
    </Modal>
  );
}
