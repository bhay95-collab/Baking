import { useEffect, useState } from 'react';
import { Modal } from './Modal';
import { parseNumber } from '../engine/parse';
import { ingKey, tweakDriven } from '../engine/scale';
import { formatAmount } from '../engine/format';
import type { Recipe } from '../engine/types';

/**
 * Make or edit a personal version: a name plus 1× amounts. The seed is never touched —
 * what is saved is only the difference from the original.
 */
export function VersionDialog({ open, onClose, recipe, amounts, title, initialName, cta, onSave }: {
  open: boolean;
  onClose: () => void;
  recipe: Recipe;
  amounts: Record<string, number>;
  title: string;
  initialName: string;
  cta: string;
  onSave: (name: string, amounts: Record<string, number>) => void;
}) {
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [name, setName] = useState(initialName);
  useEffect(() => {
    if (!open) return;
    const d: Record<string, string> = {};
    for (const c of recipe.components) for (const i of c.ingredients) if (i.amount !== null) d[ingKey(c, i)] = String(+(amounts[ingKey(c, i)] ?? i.amount).toFixed(4));
    setDraft(d);
    setName(initialName);
  }, [open, recipe, amounts, initialName]);

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
  const hasErr = Object.keys(errors).length > 0 || !name.trim();

  return (
    <Modal open={open} onClose={onClose} title={title} wide>
      <p className="muted">Change any amount for one batch. The original recipe stays exactly as written; your version is saved separately on this device.</p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!hasErr) {
            onSave(name.trim(), parsed);
            onClose();
          }
        }}
      >
        <div className="field">
          <label htmlFor="ver-name">Name of your version</label>
          <input id="ver-name" value={name} maxLength={120} onChange={(e) => setName(e.target.value)} aria-invalid={!name.trim()} />
        </div>
        {recipe.components.map((c) => {
          const rows = c.ingredients.filter((i) => i.amount !== null);
          if (!rows.length) return null;
          return (
            <fieldset key={c.id} className="edit-group">
              <legend>{c.label}</legend>
              {rows.map((i) => {
                const k = ingKey(c, i);
                const driven = tweakDriven(recipe, i);
                const changed = parsed[k] !== undefined && Math.abs(parsed[k] - (i.amount ?? 0)) > 1e-9;
                return (
                  <div className={`edit-row${changed ? ' changed' : ''}`} key={k}>
                    <label htmlFor={`e-${k}`}>{i.name}</label>
                    {driven ? (
                      <span className="muted small">{driven === 'build' ? 'Worked out from the starter the dough needs' : `Adjusted in Ratio Lab (${driven === 'stock' ? 'stock allowance' : 'colour strength'})`}</span>
                    ) : (
                      <>
                        <div className="input-unit">
                          <input id={`e-${k}`} inputMode="decimal" autoComplete="off" value={draft[k] ?? ''} onChange={(e) => setDraft({ ...draft, [k]: e.target.value })} aria-invalid={!!errors[k]} />
                          <span>{formatAmount(2, i.unit).unit}</span>
                        </div>
                        {changed ? (
                          <button type="button" className="btn text small" onClick={() => setDraft({ ...draft, [k]: String(i.amount) })} aria-label={`Put ${i.name} back to ${i.amount}`}>
                            Original: {i.amount}
                          </button>
                        ) : (
                          <span className="muted small">As written</span>
                        )}
                      </>
                    )}
                    {errors[k] && <p className="error small" role="alert">{errors[k]}</p>}
                  </div>
                );
              })}
            </fieldset>
          );
        })}
        <div className="modal-actions">
          <button type="button" className="btn ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn primary" disabled={hasErr}>{cta}</button>
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
