import { useMemo, useRef, useState } from 'react';
import { SEED, TILE_ORDER, getSeedRecipe } from '../engine/seed';
import { scaleRecipe } from '../engine/scale';
import { calculateEffectiveHydration, recipeShares } from '../engine/metrics';
import { formatMeasure, formatPercent } from '../engine/format';
import { parseNumber } from '../engine/parse';
import { exportState, parseImport } from '../engine/storage';
import { DEFAULT_SETTINGS, type Settings } from '../engine/types';
import { duplicateVariant } from '../engine/variants';
import { ConfirmDialog, NameDialog } from './Editor';
import { RecipeIcon } from './art';
import type { AppStore } from './store';

/* ------------------------------------------------------------------ Recipe picker */

const FILTERS = ['All', 'Bread', 'Pizza', 'Pastry', 'Rice', 'My variants'] as const;

export function RecipePicker({ activeId, store, go }: { activeId: string; store: AppStore; go: (id: string) => void }) {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('All');
  const variants = store.state.variants;
  const activeSeedId = variants.find((v) => v.id === activeId)?.baseId ?? activeId;
  const tiles = TILE_ORDER.filter((t) => filter === 'All' || t.filter === filter);
  return (
    <section aria-labelledby="pick-h" className="picker">
      <div className="picker-head">
        <h2 id="pick-h" className="sr-only">Choose a recipe</h2>
        <div className="chips" role="group" aria-label="Filter recipes">
          {FILTERS.map((f) => (
            <button key={f} type="button" className={`chip-btn${filter === f ? ' on' : ''}`} aria-pressed={filter === f} onClick={() => setFilter(f)}>
              {f}{f === 'My variants' && variants.length ? ` (${variants.length})` : ''}
            </button>
          ))}
        </div>
      </div>
      <ul className="tiles">
        {filter !== 'My variants' &&
          tiles.map((t) => (
            <li key={t.id}>
              <button type="button" className={`tile${activeSeedId === t.id ? ' on' : ''}`} aria-current={activeId === t.id ? 'page' : undefined} onClick={() => go(t.id)}>
                <RecipeIcon id={t.id} size={52} />
                <span className="tile-name">{t.tile}</span>
              </button>
            </li>
          ))}
        {(filter === 'All' || filter === 'My variants') &&
          variants.map((v) => (
            <li key={v.id}>
              <button type="button" className={`tile variant${activeId === v.id ? ' on' : ''}`} aria-current={activeId === v.id ? 'page' : undefined} onClick={() => go(v.id)}>
                <RecipeIcon id={v.baseId} size={52} />
                <span className="tile-name">{v.name}</span>
                <span className="tag personal_edit">✎ Variant</span>
              </button>
            </li>
          ))}
      </ul>
      {filter === 'My variants' && variants.length === 0 && <p className="empty">No variants yet. Open a recipe, tap <b>Edit formula</b>, then <b>Save as variant</b>.</p>}
    </section>
  );
}

/* ------------------------------------------------------------------ Ratio Lab */

const fmtP = (n: number | null, d = 1) => (n === null ? '—' : formatPercent(n, d));

export function RatioLab() {
  const rows = useMemo(
    () =>
      TILE_ORDER.map((t) => {
        const r = getSeedRecipe(t.id)!;
        return { id: t.id, name: t.tile, sh: recipeShares(scaleRecipe(r, { factor: 1 })) };
      }),
    [],
  );
  const [flour, setFlour] = useState('500');
  const [water, setWater] = useState('350');
  const [starter, setStarter] = useState('0');
  const [sh, setSh] = useState('100');
  const [target, setTarget] = useState('75');

  const f = parseNumber(flour, { label: 'Flour' });
  const w = parseNumber(water, { label: 'Water', allowZero: true });
  const s = parseNumber(starter, { label: 'Starter', allowZero: true });
  const h = parseNumber(sh, { label: 'Starter hydration', allowZero: true });
  const t = parseNumber(target, { label: 'Target hydration' });
  const errs = [f, w, s, h].flatMap((x) => (x.ok ? [] : [x.error]));
  const calc = f.ok && w.ok && s.ok && h.ok ? calculateEffectiveHydration({ addedFlour: f.value, addedWater: w.value, starter: s.value, starterHydration: h.value / 100 }) : null;
  const needWater = calc && t.ok ? (t.value / 100) * calc.totalFlour - calc.starterWater : null;

  return (
    <div className="page">
      <h1>Ratio Lab</h1>
      <p className="lede">Compare formulas side by side, or check a dough’s true hydration.</p>

      <section className="panel" aria-labelledby="cmp-h">
        <h2 id="cmp-h" className="panel-title">Compare all formulas</h2>
        <div className="table-scroll" tabIndex={0} role="region" aria-label="Comparison table, scrolls sideways on small screens">
          <table className="ratio-table compare">
            <thead>
              <tr><th scope="col">Recipe</th><th scope="col" className="num">Hydration</th><th scope="col" className="num">Salt</th><th scope="col" className="num">Yeast</th><th scope="col" className="num">Fat</th><th scope="col" className="num">Sugar</th><th scope="col" className="num">Prefermented</th></tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <th scope="row"><a href={`#/recipes/${r.id}`}>{r.name}</a></th>
                  <td className="num">{fmtP(r.sh.hydration, 1)}<span className="muted small block">{r.sh.hydrationKind}</span></td>
                  <td className="num">{fmtP(r.sh.salt, 1)}</td>
                  <td className="num">{fmtP(r.sh.yeast, 2)}</td>
                  <td className="num">{fmtP(r.sh.fat, 1)}</td>
                  <td className="num">{fmtP(r.sh.sugar, 1)}</td>
                  <td className="num">{fmtP(r.sh.prefermented, 1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="hint">Each figure is against that recipe’s own flour (sourdough: effective flour incl. starter; croissants: main-dough flour). “Hydration” means different things per recipe — read the small label. Risotto is rice-based, so it has no baker’s percentages. Pizza yeast is % of total flour.</p>
      </section>

      <section className="panel" aria-labelledby="hyd-h">
        <h2 id="hyd-h" className="panel-title">True hydration calculator</h2>
        <div className="field-row wrap">
          <div className="field"><label htmlFor="l-f">Flour (g)</label><input id="l-f" inputMode="decimal" value={flour} onChange={(e) => setFlour(e.target.value)} /></div>
          <div className="field"><label htmlFor="l-w">Added water (g)</label><input id="l-w" inputMode="decimal" value={water} onChange={(e) => setWater(e.target.value)} /></div>
          <div className="field"><label htmlFor="l-s">Starter (g)</label><input id="l-s" inputMode="decimal" value={starter} onChange={(e) => setStarter(e.target.value)} /></div>
          <div className="field"><label htmlFor="l-h">Starter hydration (%)</label><input id="l-h" inputMode="decimal" value={sh} onChange={(e) => setSh(e.target.value)} /></div>
        </div>
        {errs.length > 0 && <p className="alert" role="alert">{errs[0]}</p>}
        {calc && (
          <dl className="results">
            <div><dt>True hydration</dt><dd>{formatPercent(calc.effectiveHydrationPct, 2)}</dd></div>
            <div><dt>Total flour</dt><dd>{formatMeasure(calc.totalFlour)} g</dd></div>
            <div><dt>Total water</dt><dd>{formatMeasure(calc.totalWater)} g</dd></div>
            <div><dt>Prefermented flour</dt><dd>{formatPercent(calc.prefermentedFlourPct, 1)}</dd></div>
          </dl>
        )}
        {calc && (
          <div className="field inline">
            <label htmlFor="l-t">Water needed for a target hydration of (%)</label>
            <input id="l-t" inputMode="decimal" value={target} onChange={(e) => setTarget(e.target.value)} />
            <p className="ball-result">{needWater === null ? '' : needWater < 0 ? 'The starter alone already exceeds that target.' : <>Add <b>{formatMeasure(needWater)} g</b> water.</>}</p>
          </div>
        )}
      </section>
    </div>
  );
}

/* ------------------------------------------------------------------ Saved variants */

export function Variants({ store, go }: { store: AppStore; go: (id: string) => void }) {
  const { variants } = store.state;
  const [renaming, setRenaming] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const ren = variants.find((v) => v.id === renaming);
  const del = variants.find((v) => v.id === deleting);
  return (
    <div className="page">
      <h1>Saved Variants</h1>
      <p className="lede">Your personal versions. The original recipes are never changed.</p>
      {!store.canSave && <p className="alert warn" role="note">This browser mode can’t save data. Use <a href="#/settings">Backup → Export</a> to keep your variants.</p>}
      {variants.length === 0 ? (
        <div className="panel empty-state">
          <p className="panel-title">Nothing saved yet</p>
          <p>Open any recipe, tap <b>Edit formula</b> to change an amount, then <b>Save as variant</b>.</p>
          <a className="btn primary" href="#/">Pick a recipe</a>
        </div>
      ) : (
        <ul className="variant-list">
          {variants.map((v) => {
            const base = SEED.recipes.find((r) => r.id === v.baseId);
            const changes = base
              ? base.components.flatMap((c) => c.ingredients.flatMap((i) => (`${c.id}.${i.id}` in v.amounts ? [`${i.name}: ${i.amount} → ${v.amounts[`${c.id}.${i.id}`]} ${i.unit}`] : [])))
              : [];
            return (
              <li key={v.id} className="panel variant-card">
                <RecipeIcon id={v.baseId} size={56} />
                <div className="vc-main">
                  <h2>{v.name}</h2>
                  <p className="muted">Based on {base?.name ?? v.baseId} · version {v.version} · updated {new Date(v.updatedAt).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                  {changes.length ? <ul className="changes">{changes.map((c) => <li key={c}>{c}</li>)}</ul> : <p className="muted">No amount changes (settings only).</p>}
                  {!base && <p className="alert small">The original recipe for this variant is missing from this version of the app.</p>}
                </div>
                <div className="vc-actions">
                  <button type="button" className="btn primary" disabled={!base} onClick={() => go(v.id)}>Open</button>
                  <button type="button" className="btn" onClick={() => store.upsertVariant(duplicateVariant(v))}>Duplicate</button>
                  <button type="button" className="btn" onClick={() => setRenaming(v.id)}>Rename</button>
                  <button type="button" className="btn danger-ghost" onClick={() => setDeleting(v.id)}>Delete</button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      <NameDialog open={!!ren} onClose={() => setRenaming(null)} title="Rename variant" label="Variant name" initial={ren?.name ?? ''} cta="Rename" onSubmit={(name) => ren && store.upsertVariant({ ...ren, name, updatedAt: new Date().toISOString(), version: ren.version + 1 })} />
      <ConfirmDialog open={!!del} onClose={() => setDeleting(null)} title="Delete this variant?" body={`“${del?.name ?? ''}” will be removed from this device. Export a backup first if you might want it back.`} cta="Delete" danger onConfirm={() => del && store.deleteVariant(del.id)} />
    </div>
  );
}

/* ------------------------------------------------------------------ Settings / backup */

export function SettingsPage({ store }: { store: AppStore }) {
  const { settings } = store.state;
  const fileRef = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  const download = () => {
    const blob = new Blob([exportState(store.state)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `crust-and-crumb-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setMsg({ ok: true, text: `Exported ${store.state.variants.length} variant(s) and your settings.` });
  };

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    try {
      const incoming = parseImport(await file.text());
      store.importMerge(incoming);
      setMsg({ ok: true, text: `Imported ${incoming.variants.length} variant(s). Matching variants keep whichever copy is newer.` });
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : 'Import failed.' });
    }
    if (fileRef.current) fileRef.current.value = '';
  };

  const prec: [Settings['precision'], string, string][] = [
    ['auto', 'Automatic', 'Whole grams for 10 g and up, 0.1 g below'],
    ['tenth', '0.1 g everywhere', 'e.g. 292.0 g'],
    ['hundredth', '0.01 g everywhere', 'for tiny scaled amounts'],
  ];

  return (
    <div className="page">
      <h1>Settings &amp; Backup</h1>
      <section className="panel" aria-labelledby="disp-h">
        <h2 id="disp-h" className="panel-title">Display</h2>
        <fieldset className="radios">
          <legend>Rounding</legend>
          {prec.map(([k, l, d]) => (
            <label key={k} className="radio"><input type="radio" name="prec" checked={settings.precision === k} onChange={() => store.setSettings({ precision: k })} /><span><b>{l}</b> <span className="muted">— {d}</span></span></label>
          ))}
        </fieldset>
        <label className="check"><input type="checkbox" checked={settings.showEquivalents} onChange={(e) => store.setSettings({ showEquivalents: e.target.checked })} /> Show gram equivalents beside spoons, eggs and millilitres</label>
        <label className="check"><input type="checkbox" checked={settings.showOriginal} onChange={(e) => store.setSettings({ showOriginal: e.target.checked })} /> Show original amounts beside scaled ones</label>
        <button type="button" className="btn ghost" onClick={() => store.setSettings({ ...DEFAULT_SETTINGS })}>Restore display defaults</button>
        <p className="hint">Rounding only changes what is shown. Every calculation uses full precision.</p>
      </section>

      <section className="panel" aria-labelledby="bk-h">
        <h2 id="bk-h" className="panel-title">Backup</h2>
        <p>Everything lives on this device only — no account, no server. Export a file now and then so a cleared browser doesn’t lose your variants.</p>
        {!store.canSave && <p className="alert warn" role="note">This browser mode can’t save data between visits. Export before you close the tab.</p>}
        <div className="row-btns">
          <button type="button" className="btn primary" onClick={download}>⬇ Export backup</button>
          <button type="button" className="btn" onClick={() => fileRef.current?.click()}>⬆ Import backup</button>
          <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={(e) => onFile(e.target.files?.[0])} />
        </div>
        <div role="status" aria-live="polite">{msg && <p className={msg.ok ? 'ok-msg' : 'alert'}>{msg.text}</p>}</div>
        <hr />
        <button type="button" className="btn danger-ghost" onClick={() => setConfirmReset(true)}>Erase all variants and settings</button>
      </section>

      <section className="panel" aria-labelledby="ab-h">
        <h2 id="ab-h" className="panel-title">About</h2>
        <p>Recipe data v{SEED.schema_version}, generated {SEED.generated_on}. Eight recipes. Original quantities are frozen; your edits live in variants only.</p>
      </section>
      <ConfirmDialog open={confirmReset} onClose={() => setConfirmReset(false)} title="Erase everything?" body="This removes all saved variants and resets settings on this device. It can’t be undone — export a backup first." cta="Erase" danger onConfirm={store.resetAll} />
    </div>
  );
}
