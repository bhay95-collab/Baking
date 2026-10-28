import { useRef, useState } from 'react';
import { SEED } from '../engine/seed';
import { exportState, parseImport } from '../engine/storage';
import { DEFAULT_SETTINGS, type Settings } from '../engine/types';
import { duplicateVariant } from '../engine/variants';
import { ConfirmDialog, NameDialog } from './Editor';
import { Icon } from './icons';
import type { AppStore } from './store';

/* ------------------------------------------------------------------ Saved variants */

export function Variants({ store, go }: { store: AppStore; go: (id: string) => void }) {
  const { variants } = store.state;
  const [renaming, setRenaming] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const ren = variants.find((v) => v.id === renaming);
  const del = variants.find((v) => v.id === deleting);
  return (
    <div className="page">
      <header className="page-head">
        <h1>Your versions</h1>
        <p className="lede">Personal changes to Ben’s recipes, kept on this device. The originals are never changed.</p>
      </header>
      {!store.canSave && <p className="notice" role="note">This browser can’t save between visits (private mode?). Use <a href="#/settings">Settings → Export backup</a> to keep your versions.</p>}
      {variants.length === 0 ? (
        <div className="empty-state">
          <p className="empty-title">No versions yet</p>
          <p>Open a recipe and choose <b>Make my own version</b> to change an amount — less yeast, more salt, a different flour.</p>
          <a className="btn primary" href="#/recipes">Browse recipes</a>
        </div>
      ) : (
        <ul className="variant-list">
          {variants.map((v) => {
            const base = SEED.recipes.find((r) => r.id === v.baseId);
            const changes = base
              ? base.components.flatMap((c) => c.ingredients.flatMap((i) => (`${c.id}.${i.id}` in v.amounts ? [`${i.name}: ${i.amount} → ${v.amounts[`${c.id}.${i.id}`]} ${i.unit}`] : [])))
              : [];
            return (
              <li key={v.id} className="variant-row">
                <div className="vc-main">
                  <h2>{v.name}</h2>
                  <p className="muted">Based on {base?.name ?? v.baseId} · version {v.version} · updated {new Date(v.updatedAt).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                  {changes.length ? <ul className="changes">{changes.map((c) => <li key={c}>{c}</li>)}</ul> : <p className="muted">No amount changes (settings only).</p>}
                  {!base && <p className="error small">The original recipe for this version is missing from this version of the app.</p>}
                </div>
                <div className="vc-actions">
                  <button type="button" className="btn primary" disabled={!base} onClick={() => go(`#/recipes/${v.id}`)}>Open</button>
                  <button type="button" className="btn ghost" disabled={!base} onClick={() => go(`#/lab/${v.id}`)}>Scale</button>
                  <button type="button" className="btn text" onClick={() => store.upsertVariant(duplicateVariant(v))}><Icon name="copy" /> Duplicate</button>
                  <button type="button" className="btn text" onClick={() => setRenaming(v.id)}><Icon name="edit" /> Rename</button>
                  <button type="button" className="btn text danger" onClick={() => setDeleting(v.id)}><Icon name="trash" /> Delete</button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      <NameDialog open={!!ren} onClose={() => setRenaming(null)} title="Rename version" label="Name" initial={ren?.name ?? ''} cta="Rename" onSubmit={(name) => ren && store.upsertVariant({ ...ren, name, updatedAt: new Date().toISOString(), version: ren.version + 1 })} />
      <ConfirmDialog open={!!del} onClose={() => setDeleting(null)} title="Delete this version?" body={`“${del?.name ?? ''}” will be removed from this device. Export a backup first if you might want it back.`} cta="Delete" danger onConfirm={() => del && store.deleteVariant(del.id)} />
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
    setMsg({ ok: true, text: `Exported ${store.state.variants.length} version(s) and your settings.` });
  };

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    try {
      const incoming = parseImport(await file.text());
      store.importMerge(incoming);
      setMsg({ ok: true, text: `Imported ${incoming.variants.length} version(s). Matching versions keep whichever copy is newer.` });
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
      <header className="page-head">
        <h1>Settings</h1>
        <p className="lede">Display preferences and backups for this device.</p>
      </header>
      <section className="section" aria-labelledby="disp-h">
        <h2 id="disp-h" className="section-title">Display</h2>
        <fieldset className="radios">
          <legend>Rounding</legend>
          {prec.map(([k, l, d]) => (
            <label key={k} className="radio"><input type="radio" name="prec" checked={settings.precision === k} onChange={() => store.setSettings({ precision: k })} /><span><b>{l}</b> <span className="muted">— {d}</span></span></label>
          ))}
        </fieldset>
        <fieldset className="radios">
          <legend>Cups and spoons</legend>
          {(['au', 'us'] as const).map((k) => (
            <label key={k} className="radio"><input type="radio" name="cup" checked={settings.cup === k} onChange={() => store.setSettings({ cup: k })} /><span><b>{k === 'au' ? 'Australian' : 'US'}</b> <span className="muted">— {k === 'au' ? '250 ml cup, 20 ml tablespoon, 5 ml teaspoon' : '237 ml cup, 15 ml tablespoon, 5 ml teaspoon'}</span></span></label>
          ))}
        </fieldset>
        <label className="check"><input type="checkbox" checked={settings.showEquivalents} onChange={(e) => store.setSettings({ showEquivalents: e.target.checked })} /> Show gram equivalents beside spoons, eggs and millilitres</label>
        <label className="check"><input type="checkbox" checked={settings.showOriginal} onChange={(e) => store.setSettings({ showOriginal: e.target.checked })} /> Show original amounts beside scaled ones</label>
        <button type="button" className="btn ghost" onClick={() => store.setSettings({ ...DEFAULT_SETTINGS })}>Restore display defaults</button>
        <p className="hint">Rounding only changes what is shown. Every calculation uses full precision.</p>
      </section>

      <section className="section" aria-labelledby="bk-h">
        <h2 id="bk-h" className="section-title">Backup</h2>
        <p>Everything lives on this device only — no account, no server. Export a file now and then so a cleared browser doesn’t lose your versions.</p>
        {!store.canSave && <p className="notice" role="note">This browser can’t save between visits. Export before you close the tab.</p>}
        <div className="row-btns">
          <button type="button" className="btn primary" onClick={download}><Icon name="download" /> Export backup</button>
          <button type="button" className="btn ghost" onClick={() => fileRef.current?.click()}><Icon name="upload" /> Import backup</button>
          <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={(e) => onFile(e.target.files?.[0])} />
        </div>
        <div role="status" aria-live="polite">{msg && <p className={msg.ok ? 'ok-msg' : 'error'}>{msg.text}</p>}</div>
        <hr />
        <button type="button" className="btn text danger" onClick={() => setConfirmReset(true)}><Icon name="trash" /> Erase all versions and settings</button>
      </section>

      <section className="section" aria-labelledby="ab-h">
        <h2 id="ab-h" className="section-title">About</h2>
        <p>Recipe data v{SEED.schema_version}, {SEED.generated_on}. {SEED.recipes.length} recipes. Original quantities are frozen; your changes live in your versions only. Works offline once loaded.</p>
      </section>
      <ConfirmDialog open={confirmReset} onClose={() => setConfirmReset(false)} title="Erase everything?" body="This removes all saved versions and resets settings on this device. It can’t be undone — export a backup first." cta="Erase" danger onConfirm={store.resetAll} />
    </div>
  );
}
