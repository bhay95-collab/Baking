import { Fragment, useEffect, useId, useMemo, useState } from 'react';
import { DEFAULT_TWEAKS, type Recipe, type Tweaks, type Variant } from '../engine/types';
import { TILE_ORDER, getSeedRecipe } from '../engine/seed';
import { calculateDoughMass, scaleRecipe, splitDough } from '../engine/scale';
import {
  MAX_FACTOR, MIN_FACTOR, baseInfo, factorFromInputs, inputsFromFactor, modesFor, valueForMode,
  type BaseInfo, type ScaleInputs, type ScaleMode,
} from '../engine/factor';
import { computeMetrics, type BasisMode } from '../engine/metrics';
import { formatMeasure, formatMetric } from '../engine/format';
import { IngredientsView, RatiosView } from './Views';
import { PrintSheet } from './PrintSheet';
import { ConfirmDialog } from './Editor';
import { Icon } from './icons';
import { defaultMode, phrasesFor, type Phrase } from './sentences';
import type { AppStore } from './store';

export interface LabCarry {
  factor: number;
  mode: ScaleMode;
  inputs: ScaleInputs;
}

function syncInputs(mode: ScaleMode, factor: number, base: BaseInfo, prev: ScaleInputs): ScaleInputs {
  return { ...inputsFromFactor(factor, base, prev), value: valueForMode(mode, factor, base) };
}

const EMPTY: ScaleInputs = { value: '', balls: '6', ballWeight: '', servings: '', portionG: '80' };

const CHOOSER = TILE_ORDER.filter((t) => t.id !== 'croissant_red').map((t) => ({ id: t.id, label: t.id === 'croissant_classic' ? 'Croissants' : t.tile }));

export function Lab({ routeId, store, carry, go }: { routeId: string; store: AppStore; carry: { current: LabCarry | null }; go: (hash: string) => void }) {
  const variant: Variant | undefined = store.state.variants.find((v) => v.id === routeId);
  const seed = variant ? getSeedRecipe(variant.baseId) : getSeedRecipe(routeId);
  const activeSeed = variant?.baseId ?? routeId;
  return (
    <div className="lab">
      <header className="page-head">
        <h1>Ratio Lab</h1>
        <p className="lede">Say how much you want. Every stage is worked out for you, with the original formula left untouched.</p>
      </header>
      <nav className="chooser" aria-label="Choose a recipe to scale">
        <ul>
          {CHOOSER.map((c) => {
            const on = activeSeed === c.id || (c.id === 'croissant_classic' && activeSeed === 'croissant_red');
            return (
              <li key={c.id}>
                <a href={`#/lab/${c.id === 'croissant_classic' && activeSeed === 'croissant_red' ? 'croissant_red' : c.id}`} aria-current={on && !variant ? 'page' : undefined} className={on ? 'on' : undefined}>{c.label}</a>
              </li>
            );
          })}
          {store.state.variants.map((v) => (
            <li key={v.id}>
              <a href={`#/lab/${v.id}`} aria-current={v.id === routeId ? 'page' : undefined} className={`mine${v.id === routeId ? ' on' : ''}`}>{v.name}</a>
            </li>
          ))}
        </ul>
      </nav>
      {seed ? (
        <LabBench key={routeId} seed={seed} variant={variant} routeId={routeId} store={store} carry={carry} go={go} />
      ) : (
        <p className="empty">That recipe or version no longer exists on this device. Pick another above.</p>
      )}
    </div>
  );
}

function LabBench({ seed, variant, routeId, store, carry, go }: { seed: Recipe; variant?: Variant; routeId: string; store: AppStore; carry: { current: LabCarry | null }; go: (hash: string) => void }) {
  const uid = useId();
  const { settings } = store.state;
  const amounts = useMemo(() => variant?.amounts ?? {}, [variant]);
  const [tweaks, setTweaks] = useState<Tweaks>({ ...DEFAULT_TWEAKS, ...(variant?.tweaks ?? {}) });
  const base = useMemo(() => baseInfo(seed, amounts, tweaks), [seed, amounts, tweaks]);
  const modes = modesFor(seed, base);
  const [init] = useState(() => {
    const c = carry.current;
    if (c && modes.includes(c.mode)) return c;
    const m = defaultMode(seed, modes);
    return { factor: 1, mode: m, inputs: syncInputs(m, 1, base, EMPTY) };
  });
  const [factor, setFactor] = useState(init.factor);
  const [mode, setMode] = useState<ScaleMode>(init.mode);
  const [inputs, setInputs] = useState<ScaleInputs>(init.inputs);
  const [error, setError] = useState<string | null>(null);
  const [basis, setBasis] = useState<BasisMode>('recipe');
  const [showOriginal, setShowOriginal] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  useEffect(() => {
    carry.current = null;
  }, [carry]);

  // Keep typed fields describing the same batch when a tweak changes the base (e.g. colour weight).
  useEffect(() => {
    setInputs((p) => syncInputs(mode, factor, base, p));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [base]);

  const scaled = useMemo(() => scaleRecipe(seed, { factor, amounts, tweaks }), [seed, factor, amounts, tweaks]);
  const mass = useMemo(() => calculateDoughMass(scaled), [scaled]);
  const metrics = useMemo(() => computeMetrics(scaled, { stockPerG: tweaks.stockPerG }), [scaled, tweaks.stockPerG]);
  const phrases = phrasesFor(seed, modes, base);
  const phrase = phrases.find((p) => p.mode === mode) ?? phrases[0];

  const onInputs = (patch: Partial<ScaleInputs>) => {
    const next = { ...inputs, ...patch };
    setInputs(next);
    const r = factorFromInputs(mode, next, base);
    if (r.ok) {
      setFactor(r.factor);
      setError(null);
    } else setError(r.error);
  };
  const onMode = (m: ScaleMode) => {
    setMode(m);
    setError(null);
    setInputs(syncInputs(m, factor, base, inputs));
  };
  const reset = () => {
    const m = defaultMode(seed, modes);
    setTweaks({ ...DEFAULT_TWEAKS, ...(variant?.tweaks ?? {}) });
    setFactor(1);
    setMode(m);
    setError(null);
    setInputs(syncInputs(m, 1, baseInfo(seed, amounts, { ...DEFAULT_TWEAKS, ...(variant?.tweaks ?? {}) }), EMPTY));
  };

  const isOne = Math.abs(factor - 1) < 1e-9;
  const twin = !variant && (seed.id === 'croissant_classic' ? 'croissant_red' : seed.id === 'croissant_red' ? 'croissant_classic' : null);
  const rice = seed.ratio_basis.unit === 'g_rice';
  const ballsN = Number(inputs.balls);
  const split = seed.id === 'poolish_pizza' && Number.isInteger(ballsN) && ballsN >= 1 && ballsN <= 200 ? splitDough(mass.grams, ballsN) : null;
  const keyMetric = metrics.find((m) => ['hyd', 'liquid'].includes(m.id) && m.value !== null);
  const title = variant?.name ?? seed.name;

  return (
    <>
      <section className="sentence-panel" aria-labelledby={`${uid}-h`}>
        <h2 id={`${uid}-h`} className="sr-only">How much {title}</h2>
        <Sentence phrase={phrase} inputs={inputs} onInputs={onInputs} error={error} uid={uid} />
        {variant && <p className="hint">Scaling your version: {variant.name}</p>}
        {phrase.hint && <p className="hint">{phrase.hint}</p>}
        {error && (
          <p id={`${uid}-err`} className="error" role="alert">
            {error} Showing the last batch that worked ({+factor.toFixed(3)}×).
          </p>
        )}

        {phrases.length > 1 && (
          <fieldset className="say-it">
            <legend>Say it another way</legend>
            <div className="seg">
              {phrases.map((p) => (
                <label key={p.mode} className={p.mode === mode ? 'on' : undefined}>
                  <input type="radio" name={`${uid}-mode`} checked={p.mode === mode} onChange={() => onMode(p.mode)} />
                  {p.name}
                </label>
              ))}
            </div>
          </fieldset>
        )}

        {twin && (
          <label className="switch">
            <input type="checkbox" checked={seed.id === 'croissant_red'} onChange={() => { carry.current = { factor, mode, inputs }; go(`#/lab/${twin}`); }} />
            <span className="switch-track" aria-hidden="true" />
            <span>With the bright-red outer layer <span className="muted">(adds a 106.5 g red sheet per batch)</span></span>
          </label>
        )}

        {rice && (
          <div className="tune">
            <label htmlFor={`${uid}-stock`}>Stock allowance <b>{tweaks.stockPerG.toFixed(2).replace(/0$/, '')} mL per g of rice</b></label>
            <input id={`${uid}-stock`} type="range" min={3.5} max={4.25} step={0.05} value={tweaks.stockPerG} onChange={(e) => setTweaks((t) => ({ ...t, stockPerG: Number(e.target.value) }))} />
            <div className="range-ends"><span>3.5 tighter</span><span>3.75 standard</span><span>4.25 looser</span></div>
            <p className="hint">A planning amount. Rice, heat and pan change how much it takes, so keep extra hot stock back.</p>
          </div>
        )}
        {seed.id === 'croissant_red' && (
          <div className="tune">
            <label htmlFor={`${uid}-col`}>Red colour <b>{tweaks.colourG.toFixed(1)} g per batch</b></label>
            <input id={`${uid}-col`} type="range" min={1} max={2} step={0.1} value={tweaks.colourG} onChange={(e) => setTweaks((t) => ({ ...t, colourG: Number(e.target.value) }))} />
            <div className="range-ends"><span>1 g softer</span><span>1.5 g default</span><span>2 g deeper</span></div>
          </div>
        )}
      </section>

      <div className="result-bar" aria-live="polite">
        <p className="result-line">
          <span>{isOne ? 'The original recipe' : <><b>{+factor.toFixed(2)}×</b> the original</>}</span>
          {!rice && <span><b>{mass.incomplete ? 'at least ' : mass.approximate ? '≈ ' : ''}{formatMeasure(mass.grams, settings.precision)} g</b> {seed.id === 'poolish_pizza' ? 'final dough' : 'dough'}</span>}
          {keyMetric && <span><b>{formatMetric(keyMetric.value!, keyMetric.format, keyMetric.decimals ?? 1)}</b> {keyMetric.label.toLowerCase()}</span>}
          {rice && <span><b>{formatMeasure(metrics.find((m) => m.id === 'rice')?.value ?? 0)} g</b> rice</span>}
        </p>
        {split && (
          <p className="split">
            {ballsN} {ballsN === 1 ? 'ball' : 'balls'} of <b>{formatMeasure(mass.grams / ballsN, 'tenth')} g</b>. To lose nothing to rounding, weigh {summarise(split)}.
          </p>
        )}
        <div className="actions">
          <button type="button" className="btn ghost" onClick={() => window.print()}><Icon name="print" /> Print bake sheet</button>
          <button type="button" className="btn text" disabled={isOne && !error} onClick={() => setConfirmReset(true)}><Icon name="reset" /> Back to 1×</button>
          <label className="check"><input type="checkbox" checked={showOriginal} onChange={(e) => setShowOriginal(e.target.checked)} /> Show original amounts</label>
        </div>
        <p className="hint limits">Batches from {MIN_FACTOR}× to {MAX_FACTOR}× the original.</p>
      </div>

      <IngredientsView scaled={scaled} settings={settings} showOriginal={showOriginal} />

      <details className="lab-ratios" open>
        <summary><Icon name="chevron" size={16} /> Ratios at this size</summary>
        <RatiosView scaled={scaled} basis={basis} onBasis={setBasis} settings={settings} />
      </details>
      <p className="hint method-link">Method, timings and source notes are on the <a href={`#/recipes/${routeId}`}>recipe page</a>.</p>

      <PrintSheet scaled={scaled} title={title} settings={settings} scaleLabel={isOne ? 'original quantities' : `scaled ${+factor.toFixed(3)}×`} edited={!!variant} />
      <ConfirmDialog open={confirmReset} onClose={() => setConfirmReset(false)} title="Back to one batch?" body="This puts the amounts back to the original recipe size." cta="Back to 1×" onConfirm={reset} />
    </>
  );
}

function Sentence({ phrase, inputs, onInputs, error, uid }: { phrase: Phrase; inputs: ScaleInputs; onInputs: (p: Partial<ScaleInputs>) => void; error: string | null; uid: string }) {
  return (
    <p className="sentence">
      {phrase.pieces.map((p, n) => {
        const space = n > 0 && !(p.kind === 'text' && /^[.,]/.test(p.text)) ? ' ' : '';
        if (p.kind === 'text') return <Fragment key={n}>{space}{p.text}</Fragment>;
        if (p.kind === 'noun') {
          const one = Number(String(inputs[p.field]).replace(',', '.')) === 1;
          return <Fragment key={n}>{space}{one ? p.one : p.many}</Fragment>;
        }
        if (p.kind === 'portion') {
          return (
            <Fragment key={n}>
              {space}
              <select aria-label={p.label} className="blank select" value={inputs.portionG === '60' ? '60' : '80'} onChange={(e) => onInputs({ portionG: e.target.value })}>
                <option value="80">main (80 g rice)</option>
                <option value="60">side (60 g rice)</option>
              </select>
            </Fragment>
          );
        }
        return (
          <Fragment key={n}>
            {space}
            <input
              className="blank"
              aria-label={p.label}
              inputMode={p.numeric ? 'numeric' : 'decimal'}
              autoComplete="off"
              size={p.size}
              style={{ width: `${Math.max(p.size, String(inputs[p.field]).length) + 0.6}ch` }}
              value={inputs[p.field]}
              onChange={(e) => onInputs({ [p.field]: e.target.value })}
              onFocus={(e) => e.currentTarget.select()}
              aria-invalid={!!error}
              aria-describedby={error ? `${uid}-err` : undefined}
            />
          </Fragment>
        );
      })}
    </p>
  );
}

function summarise(parts: number[]): string {
  const counts = new Map<number, number>();
  for (const w of parts) counts.set(w, (counts.get(w) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[0] - a[0]).map(([w, n]) => `${n} × ${formatMeasure(w)} g`).join(' and ');
}
