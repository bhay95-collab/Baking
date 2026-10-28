import { useId } from 'react';
import {
  MAX_FACTOR, MIN_FACTOR, isRice, stepMultiplier, valueForMode,
  type BaseInfo, type ScaleInputs, type ScaleMode,
} from '../engine/factor';
import { splitDough } from '../engine/scale';
import { formatMeasure } from '../engine/format';
import type { Recipe, Tweaks } from '../engine/types';

const MODE_LABEL: Record<ScaleMode, (r: Recipe, b: BaseInfo) => string> = {
  multiplier: () => 'Batch ×',
  count: (_r, b) => cap(noun(b.countUnit)),
  basis: (r) => (isRice(r) ? 'Dry rice' : 'Flour'),
  mass: () => 'Dough weight',
  balls: () => 'Pizza balls',
  servings: () => 'Servings',
};

const NOUNS: Record<string, string> = {
  loaf: 'loaves',
  batch: 'batches',
  'large roasting tray': 'trays',
  'tin loaf': 'loaves',
  bun: 'buns',
  'medium croissant': 'croissants',
  'main-course serving': 'servings',
};
const noun = (unit: string) => NOUNS[unit] ?? `${unit}s`;
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export interface ScalePanelProps {
  recipe: Recipe;
  base: BaseInfo;
  modes: ScaleMode[];
  mode: ScaleMode;
  factor: number;
  inputs: ScaleInputs;
  error: string | null;
  tweaks: Tweaks;
  massNow: number;
  onMode: (m: ScaleMode) => void;
  onInputs: (patch: Partial<ScaleInputs>, mode?: ScaleMode) => void;
  onFactor: (f: number) => void;
  onTweaks: (patch: Partial<Tweaks>) => void;
}

export function ScalePanel(p: ScalePanelProps) {
  const uid = useId();
  const { recipe, base, mode, inputs } = p;
  const rice = isRice(recipe);
  const set = (v: string) => p.onInputs({ value: v });

  const valueField = (label: string, unit: string, hint?: string) => (
    <div className="field">
      <label htmlFor={`${uid}-v`}>{label}</label>
      <div className="input-unit">
        <input id={`${uid}-v`} inputMode="decimal" autoComplete="off" value={inputs.value} onChange={(e) => set(e.target.value)} aria-describedby={p.error ? `${uid}-err` : undefined} aria-invalid={!!p.error} />
        <span>{unit}</span>
      </div>
      {hint && <p className="hint">{hint}</p>}
    </div>
  );

  const ballsN = Math.round(Number(inputs.balls));
  const validBalls = Number.isInteger(ballsN) && ballsN >= 1 && ballsN <= 100;
  const split = validBalls ? splitDough(p.massNow, ballsN) : null;

  return (
    <section className="panel scale-panel" id="scale-panel" aria-labelledby={`${uid}-h`}>
      <h2 id={`${uid}-h`} className="panel-title">Dial in your {rice ? 'rice' : 'dough'}</h2>

      <div role="radiogroup" aria-label="Scale by" className="seg">
        {p.modes.map((m) => (
          <button key={m} type="button" role="radio" aria-checked={mode === m} className={mode === m ? 'on' : ''} onClick={() => p.onMode(m)}>
            {MODE_LABEL[m](recipe, base)}
          </button>
        ))}
      </div>

      <div className="scale-body">
        {mode === 'multiplier' && (
          <div className="field">
            <label htmlFor={`${uid}-v`}>Batch multiplier</label>
            <div className="stepper">
              <button type="button" className="btn big" aria-label="Smaller batch" onClick={() => p.onFactor(stepMultiplier(p.factor, -1))}>−</button>
              <input id={`${uid}-v`} inputMode="decimal" autoComplete="off" value={inputs.value} onChange={(e) => set(e.target.value)} aria-invalid={!!p.error} aria-describedby={p.error ? `${uid}-err` : undefined} />
              <span className="times" aria-hidden="true">×</span>
              <button type="button" className="btn big" aria-label="Bigger batch" onClick={() => p.onFactor(stepMultiplier(p.factor, 1))}>+</button>
            </div>
            <div className="chips" aria-label="Quick multipliers">
              {[0.5, 1, 1.5, 2, 3, 4].map((x) => (
                <button key={x} type="button" className={`chip-btn${Math.abs(p.factor - x) < 1e-9 ? ' on' : ''}`} onClick={() => p.onFactor(x)}>{x}×</button>
              ))}
            </div>
          </div>
        )}

        {mode === 'count' && valueField(`How many ${noun(base.countUnit)}?`, '', base.countIsEstimate ? `Source yield is an estimate (${recipe.yield.count_range?.join('–')}). Baseline used: ${base.count}.` : `Source recipe makes ${base.count}.`)}
        {mode === 'basis' && valueField(rice ? 'Dry rice' : 'Total flour', 'g', `Original: ${formatMeasure(base.basis)} g${recipe.id === 'poolish_pizza' ? ' (poolish + final mix)' : ''}.`)}
        {mode === 'mass' && valueField('Target dough weight', 'g', `Original: ${formatMeasure(base.mass)} g${base.massExact ? '' : ' (approx. — includes estimated conversions)'}.`)}

        {mode === 'balls' && (
          <>
            <div className="field-row">
              <div className="field">
                <label htmlFor={`${uid}-n`}>Balls</label>
                <input id={`${uid}-n`} inputMode="numeric" autoComplete="off" value={inputs.balls} onChange={(e) => p.onInputs({ balls: e.target.value }, 'balls')} />
              </div>
              <div className="field">
                <label htmlFor={`${uid}-w`}>Each (g)</label>
                <input id={`${uid}-w`} inputMode="decimal" autoComplete="off" value={inputs.ballWeight} onChange={(e) => p.onInputs({ ballWeight: e.target.value }, 'balls')} aria-invalid={!!p.error} />
              </div>
            </div>
            <p className="hint">Sets the batch so balls × weight = dough. One batch is {formatMeasure(base.mass)} g (about 6 × 292 g).</p>
          </>
        )}

        {mode === 'servings' && (
          <>
            <div className="field-row">
              <div className="field">
                <label htmlFor={`${uid}-s`}>Servings</label>
                <input id={`${uid}-s`} inputMode="decimal" autoComplete="off" value={inputs.servings} onChange={(e) => p.onInputs({ servings: e.target.value }, 'servings')} aria-invalid={!!p.error} />
              </div>
              <div className="field">
                <label htmlFor={`${uid}-p`}>Rice each</label>
                <select id={`${uid}-p`} value={['80', '60'].includes(inputs.portionG) ? inputs.portionG : 'custom'} onChange={(e) => p.onInputs({ portionG: e.target.value === 'custom' ? '70' : e.target.value }, 'servings')}>
                  <option value="80">80 g — main course</option>
                  <option value="60">60 g — side / light</option>
                  <option value="custom">Custom…</option>
                </select>
              </div>
            </div>
            {!['80', '60'].includes(inputs.portionG) && (
              <div className="field">
                <label htmlFor={`${uid}-pc`}>Custom rice per serving (g)</label>
                <input id={`${uid}-pc`} inputMode="decimal" value={inputs.portionG} onChange={(e) => p.onInputs({ portionG: e.target.value }, 'servings')} />
              </div>
            )}
          </>
        )}

        <p className="factor-line" aria-live="polite">
          <span>Batch</span> <strong>{+p.factor.toFixed(3)}×</strong> <span>of the {Math.abs(p.factor - 1) < 1e-9 ? 'original' : 'original formula'}</span>
        </p>

        {p.error && (
          <p id={`${uid}-err`} className="alert" role="alert">
            <strong>Can’t use that.</strong> {p.error}
            <br /><span className="muted">Showing the last valid batch ({+p.factor.toFixed(3)}×).</span>
          </p>
        )}
      </div>

      {recipe.id === 'poolish_pizza' && (
        <div className="subpanel">
          <h3 className="sub-title">Divide into balls</h3>
          {mode !== 'balls' && (
            <div className="field">
              <label htmlFor={`${uid}-bn`}>Number of balls</label>
              <input id={`${uid}-bn`} inputMode="numeric" value={inputs.balls} onChange={(e) => p.onInputs({ balls: e.target.value })} />
            </div>
          )}
          {split ? (
            <p className="ball-result">
              <strong>{formatMeasure(p.massNow / ballsN)} g</strong> each
              <span className="muted"> · weigh out {summarise(split)}</span>
            </p>
          ) : (
            <p className="hint">Enter a whole number of balls (1–100).</p>
          )}
          <p className="hint">Whole-gram split adds up to the full dough — nothing lost to rounding.</p>
        </div>
      )}

      {rice && (
        <div className="subpanel">
          <h3 className="sub-title">Stock allowance <span className="tag suggested">★ Suggested</span></h3>
          <label htmlFor={`${uid}-stock`} className="slider-label">
            <span>{p.tweaks.stockPerG.toFixed(2).replace(/0$/, '')} mL per g rice</span>
          </label>
          <input id={`${uid}-stock`} type="range" min={3.5} max={4.25} step={0.05} value={p.tweaks.stockPerG} onChange={(e) => p.onTweaks({ stockPerG: Number(e.target.value) })} />
          <div className="range-ends"><span>3.5 thinner rice</span><span>3.75 standard</span><span>4.25 loose</span></div>
          <p className="hint">Planning amount only. Absorption varies by rice, heat and pan — keep extra hot stock back.</p>
        </div>
      )}

      {recipe.id === 'croissant_red' && (
        <div className="subpanel">
          <h3 className="sub-title">Red colour <span className="tag suggested">★ Suggested</span></h3>
          <label htmlFor={`${uid}-col`} className="slider-label"><span>{p.tweaks.colourG.toFixed(1)} g concentrate (at 1×)</span></label>
          <input id={`${uid}-col`} type="range" min={1} max={2} step={0.1} value={p.tweaks.colourG} onChange={(e) => p.onTweaks({ colourG: Number(e.target.value) })} />
          <div className="range-ends"><span>1 g paler</span><span>1.5 default</span><span>2 g deeper</span></div>
        </div>
      )}

      <p className="hint limits">Allowed scale {MIN_FACTOR}× – {MAX_FACTOR}×. {mode !== 'multiplier' && <>Switch mode to type a target instead (current: {valueForMode(mode, p.factor, base)}).</>}</p>
    </section>
  );
}

function summarise(parts: number[]): string {
  const counts = new Map<number, number>();
  for (const w of parts) counts.set(w, (counts.get(w) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[0] - a[0]).map(([w, n]) => `${n} × ${formatMeasure(w)} g`).join(' + ');
}
