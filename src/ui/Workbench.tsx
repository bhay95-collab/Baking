import { useEffect, useMemo, useRef, useState } from 'react';
import { DEFAULT_TWEAKS, type Recipe, type Tweaks, type Variant } from '../engine/types';
import { getSeedRecipe } from '../engine/seed';
import { calculateDoughMass, scaleRecipe } from '../engine/scale';
import {
  baseInfo, factorFromInputs, inputsFromFactor, modesFor, valueForMode,
  type BaseInfo, type ScaleInputs, type ScaleMode,
} from '../engine/factor';
import { computeMetrics, type BasisMode } from '../engine/metrics';
import { formatMetric } from '../engine/format';
import { createVariant, diffAmounts, updateVariant } from '../engine/variants';
import { ScalePanel } from './ScalePanel';
import { IngredientsView, MethodView, RatiosView, StatusChip } from './Views';
import { ConfirmDialog, EditDialog, NameDialog } from './Editor';
import { PrintSheet } from './PrintSheet';
import { RecipeIcon } from './art';
import { STATUS_LABEL } from './meta';
import type { AppStore } from './store';

type Tab = 'ingredients' | 'method' | 'ratios';

function syncInputs(mode: ScaleMode, factor: number, base: BaseInfo, prev: ScaleInputs): ScaleInputs {
  return { ...inputsFromFactor(factor, base, prev), value: valueForMode(mode, factor, base) };
}

export interface WorkbenchProps {
  routeId: string;
  store: AppStore;
  /** One-shot scale carried across a recipe switch (e.g. classic ⇄ red croissants). */
  carry: { current: number | null };
  go: (id: string) => void;
}

export function Workbench({ routeId, store, carry, go }: WorkbenchProps) {
  const variant: Variant | undefined = store.state.variants.find((v) => v.id === routeId);
  const seed: Recipe | undefined = variant ? getSeedRecipe(variant.baseId) : getSeedRecipe(routeId);
  if (!seed) {
    return (
      <div className="panel">
        <h2 className="panel-title">Recipe not found</h2>
        <p>That recipe or variant no longer exists. <a href="#/">Back to recipes</a>.</p>
      </div>
    );
  }
  return <WorkbenchInner seed={seed} variant={variant} store={store} carry={carry} go={go} />;
}

function WorkbenchInner({ seed, variant, store, carry, go }: { seed: Recipe; variant?: Variant } & Omit<WorkbenchProps, 'routeId'>) {
  const { settings } = store.state;
  const initTweaks: Tweaks = { ...DEFAULT_TWEAKS, ...(variant?.tweaks ?? {}) };
  const [amounts, setAmounts] = useState<Record<string, number>>(variant?.amounts ?? {});
  const [tweaks, setTweaks] = useState<Tweaks>(initTweaks);
  const [factor, setFactor] = useState<number>(() => carry.current ?? 1);
  const [mode, setMode] = useState<ScaleMode>('multiplier');
  const [error, setError] = useState<string | null>(null);
  const [basis, setBasis] = useState<BasisMode>('recipe');
  const [tab, setTab] = useState<Tab>('ingredients');
  const [dialog, setDialog] = useState<null | 'edit' | 'save' | 'saveNew' | 'reset'>(null);
  const [toast, setToast] = useState('');
  const carried = useRef(false);

  const base = useMemo(() => baseInfo(seed, amounts, tweaks), [seed, amounts, tweaks]);
  const modes = modesFor(seed, base);
  const [inputs, setInputs] = useState<ScaleInputs>(() => syncInputs('multiplier', factor, baseInfo(seed, variant?.amounts ?? {}, initTweaks), { value: '', balls: '6', ballWeight: '', servings: '', portionG: '80' }));

  useEffect(() => {
    if (!carried.current) {
      carried.current = true;
      carry.current = null;
    }
  }, [carry]);

  // Keep the typed fields describing the same batch when the base formula changes.
  useEffect(() => {
    setInputs((p) => syncInputs(mode, factor, base, p));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [base]);

  const scaled = useMemo(() => scaleRecipe(seed, { factor, amounts, tweaks }), [seed, factor, amounts, tweaks]);
  const metrics = useMemo(() => computeMetrics(scaled, { stockPerG: tweaks.stockPerG }), [scaled, tweaks.stockPerG]);
  const mass = useMemo(() => calculateDoughMass(scaled), [scaled]);

  const editCount = Object.keys(diffAmounts(seed, amounts)).length;
  const tweaksDirty = tweaks.stockPerG !== DEFAULT_TWEAKS.stockPerG || tweaks.colourG !== DEFAULT_TWEAKS.colourG;
  const dirty = editCount > 0 || tweaksDirty;
  const notSaved = variant
    ? JSON.stringify(diffAmounts(seed, amounts)) !== JSON.stringify(variant.amounts) || JSON.stringify(tweaks) !== JSON.stringify(initTweaks)
    : dirty;

  const say = (m: string) => {
    setToast(m);
    window.setTimeout(() => setToast(''), 3500);
  };

  const applyFactor = (m: ScaleMode, f: number, prev: ScaleInputs) => {
    setFactor(f);
    setError(null);
    setInputs(syncInputs(m, f, base, prev));
  };

  const onMode = (m: ScaleMode) => {
    setMode(m);
    setError(null);
    setInputs(syncInputs(m, factor, base, inputs));
  };

  const onInputs = (patch: Partial<ScaleInputs>, modeOverride?: ScaleMode) => {
    const next = { ...inputs, ...patch };
    setInputs(next);
    const r = factorFromInputs(modeOverride ?? mode, next, base);
    if (r.ok) {
      setFactor(r.factor);
      setError(null);
    } else setError(r.error);
  };

  const reset = () => {
    setAmounts({});
    setTweaks({ ...DEFAULT_TWEAKS });
    setMode('multiplier');
    setBasis('recipe');
    const b = baseInfo(seed, {}, DEFAULT_TWEAKS);
    setFactor(1);
    setError(null);
    setInputs(syncInputs('multiplier', 1, b, inputs));
    say('Back to the original recipe.');
  };

  const scaleLabel = Math.abs(factor - 1) < 1e-9 ? 'original quantities' : `scaled ${+factor.toFixed(3)}×`;
  const title = variant ? variant.name : seed.name;
  const overallStatus = editCount > 0 ? 'personal_edit' : Math.abs(factor - 1) > 1e-9 ? 'calculated' : 'original';

  const saveNew = (name: string) => {
    const v = createVariant(seed, name, amounts, tweaks);
    store.upsertVariant(v);
    carry.current = factor;
    go(v.id);
  };
  const saveExisting = () => {
    if (!variant) return;
    store.upsertVariant(updateVariant(variant, seed, { amounts, tweaks }));
    say(`Saved as version ${variant.version + 1}.`);
  };

  const croissantTwin = seed.id === 'croissant_classic' ? 'croissant_red' : seed.id === 'croissant_red' ? 'croissant_classic' : null;

  const tabs: [Tab, string][] = [['ingredients', 'Ingredients'], ['method', 'Method'], ['ratios', 'Ratios']];

  return (
    <div className="workbench-wrap">
      <header className="wb-head">
        <RecipeIcon id={seed.id} size={72} />
        <div className="wb-title">
          <h1>{title}</h1>
          <p className="source">
            {variant ? <>Personal variant of <b>{seed.name}</b> · v{variant.version} · </> : null}
            {seed.source}
          </p>
          <p className="wb-status">
            <StatusChip status={overallStatus} />
            <span className="muted"> {STATUS_LABEL[overallStatus]}{overallStatus === 'calculated' ? ` · ${scaleLabel}` : overallStatus === 'personal_edit' ? ` · ${editCount} changed ${editCount === 1 ? 'amount' : 'amounts'}` : ''}</span>
            {tweaksDirty && editCount === 0 && <span className="muted"> · settings adjusted</span>}
            {variant && notSaved && <span className="tag unsaved">Unsaved changes</span>}
          </p>
        </div>
        <div className="wb-actions no-print">
          <button type="button" className="btn" onClick={() => setDialog('edit')}>✎ Edit formula</button>
          {variant ? (
            <>
              <button type="button" className="btn primary" onClick={saveExisting} disabled={!notSaved}>Save changes</button>
              <button type="button" className="btn" onClick={() => setDialog('saveNew')}>Save as new variant</button>
            </>
          ) : (
            <button type="button" className="btn primary" onClick={() => setDialog('save')}>Save as variant</button>
          )}
          <button type="button" className="btn" onClick={() => window.print()}>🖨 Print</button>
          <button type="button" className="btn ghost" onClick={() => (notSaved || factor !== 1 ? setDialog('reset') : reset())}>↺ Reset to original</button>
        </div>
      </header>

      {croissantTwin && !variant && (
        <label className="toggle">
          <input type="checkbox" checked={seed.id === 'croissant_red'} onChange={() => { carry.current = factor; go(croissantTwin); }} />
          <span className="toggle-track" aria-hidden="true" />
          <span><b>Bright-red layer</b> <span className="muted">— adds the 106.5 g red sheet to the classic recipe; the classic stays untouched.</span></span>
        </label>
      )}

      <div role="status" aria-live="polite" className="toast">{toast}</div>

      <ul className="metrics" aria-label="Key figures">
        {metrics.map((m) => (
          <li key={m.id} className="metric">
            <span className="m-label">{m.label}</span>
            <span className="m-value">{m.approx && m.value !== null ? '≈ ' : ''}{m.text ?? (m.value === null ? '—' : formatMetric(m.value, m.format, m.decimals ?? 1, settings.precision))}</span>
            {m.hint && <span className="m-hint">{m.hint}</span>}
          </li>
        ))}
      </ul>

      <div className="workbench">
        <aside className="wb-left">
          <ScalePanel
            recipe={seed}
            base={base}
            modes={modes}
            mode={mode}
            factor={factor}
            inputs={inputs}
            error={error}
            tweaks={tweaks}
            massNow={mass.grams}
            onMode={onMode}
            onInputs={onInputs}
            onFactor={(f) => applyFactor(mode, f, inputs)}
            onTweaks={(patch) => setTweaks((t) => ({ ...t, ...patch }))}
          />
        </aside>

        <main className="wb-right">
          <div role="tablist" aria-label="Recipe sections" className="tabs">
            {tabs.map(([k, label]) => (
              <button key={k} role="tab" type="button" id={`tab-${k}`} aria-selected={tab === k} aria-controls={`panel-${k}`} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>
                {label}
              </button>
            ))}
          </div>

          <div role="tabpanel" id="panel-ingredients" aria-labelledby="tab-ingredients" hidden={tab !== 'ingredients'} className="tab-panel">
            <div className="panel-tools">
              <label className="check">
                <input type="checkbox" checked={settings.showOriginal} onChange={(e) => store.setSettings({ showOriginal: e.target.checked })} />
                Show original amounts
              </label>
            </div>
            <IngredientsView scaled={scaled} settings={settings} />
          </div>
          <div role="tabpanel" id="panel-method" aria-labelledby="tab-method" hidden={tab !== 'method'} className="tab-panel">
            <MethodView scaled={scaled} />
          </div>
          <div role="tabpanel" id="panel-ratios" aria-labelledby="tab-ratios" hidden={tab !== 'ratios'} className="tab-panel">
            <RatiosView scaled={scaled} basis={basis} onBasis={setBasis} settings={settings} />
          </div>
        </main>
      </div>

      <nav className="bottom-bar no-print" aria-label="Quick actions">
        <button type="button" className="btn" onClick={() => { document.getElementById('scale-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }}>⚖ Scale</button>
        <button type="button" className="btn" onClick={() => window.print()}>🖨 Print</button>
        <button type="button" className="btn" onClick={() => (notSaved || factor !== 1 ? setDialog('reset') : reset())}>↺ Reset</button>
      </nav>

      <PrintSheet scaled={scaled} title={title} settings={settings} scaleLabel={scaleLabel} edited={editCount > 0} />

      <EditDialog open={dialog === 'edit'} onClose={() => setDialog(null)} recipe={seed} amounts={amounts} onApply={(next) => { setAmounts(next); say(Object.keys(diffAmounts(seed, next)).length ? 'Edits applied to your working copy.' : 'Back to original amounts.'); }} />
      <NameDialog open={dialog === 'save' || dialog === 'saveNew'} onClose={() => setDialog(null)} title="Save as personal variant" label="Variant name" initial={`${variant?.name ?? seed.name} — my version`} cta="Save variant" onSubmit={saveNew} />
      <ConfirmDialog open={dialog === 'reset'} onClose={() => setDialog(null)} title="Reset to the original recipe?" body={notSaved ? 'This clears your unsaved edits and returns the scale to 1×. Saved variants are not affected.' : 'This returns the scale to 1×.'} cta="Reset" danger onConfirm={reset} />
    </div>
  );
}
