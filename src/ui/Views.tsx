import { useState } from 'react';
import { basisGrams, basisLabel, calculatePreferment, hasAlternateBasis, ratioRows, starterBreakdown, type BasisMode } from '../engine/metrics';
import { calculateDoughMass } from '../engine/scale';
import { formatAmount, formatGrams, formatMeasure, formatPercent } from '../engine/format';
import { unitKind } from '../engine/units';
import type { ScaledIngredient, ScaledRecipe, Settings, SourceStatus } from '../engine/types';
import { Icon } from './icons';
import { METHOD_BADGE, METHOD_META, STATUS_LABEL, STATUS_SHORT, guidanceChips } from './meta';

export function StatusChip({ status }: { status: SourceStatus | 'estimated' }) {
  return (
    <span className={`tag ${status}`} title={STATUS_LABEL[status]}>
      {STATUS_SHORT[status]}
    </span>
  );
}

/* ------------------------------------------------------------------ Ingredients */

function Row({ i, settings, showOriginal }: { i: ScaledIngredient; settings: Settings; showOriginal: boolean }) {
  const a = formatAmount(i.amount, i.unit, settings.precision);
  const kind = unitKind(i.unit);
  // 1 mL ≈ 1 g liquids (water, milk, wine, stock) need no equivalent line; oil, spoons and eggs do.
  const oneToOne = i.amount !== null && i.grams !== null && kind === 'volume' && Math.abs(i.grams / i.amount - 1) < 1e-9;
  const showEq = settings.showEquivalents && i.grams !== null && kind !== 'mass' && kind !== 'taste' && !oneToOne;
  const orig = showOriginal && i.amount !== null && i.seedAmount !== null && Math.abs(i.amount - i.seedAmount) > 1e-9
    ? formatAmount(i.seedAmount, i.unit, settings.precision).text
    : null;
  const taste = i.amount === null;
  return (
    <tr className={i.status === 'personal_edit' ? 'edited' : undefined}>
      <th scope="row" className="ing-name">
        <span>{i.name}</span>
        {i.sourceLabel && <span className="muted small"> · source: “{i.sourceLabel}”</span>}
        {i.note && <span className="note-line">{i.note}</span>}
        <span className="chips-inline">
          {(i.status === 'personal_edit' || i.status === 'suggested') && <StatusChip status={i.status} />}
        </span>
      </th>
      <td className="qty">
        {taste ? (
          <span className="to-taste">to taste</span>
        ) : (
          <>
            <span className="qty-main"><b>{a.qty}</b> <span className="unit">{a.unit}</span></span>
            {a.hint && <span className="qty-hint">{a.hint}</span>}
            {showEq && (
              <span className="qty-eq">
                ≈ {formatGrams(i.grams!, settings.precision)}{i.gramsApproximate && <i>, estimated</i>}
              </span>
            )}
            {orig && <span className="qty-orig">original {orig}</span>}
          </>
        )}
      </td>
    </tr>
  );
}

export function IngredientsView({ scaled, settings, showOriginal = false }: { scaled: ScaledRecipe; settings: Settings; showOriginal?: boolean }) {
  const mass = calculateDoughMass(scaled);
  const isRice = scaled.recipe.ratio_basis.unit === 'g_rice';
  const poolish = scaled.recipe.id === 'poolish_pizza' ? calculatePreferment(scaled) : null;
  return (
    <div className="stages">
      {scaled.components.map((c) => (
        <section key={c.id} className="stage" aria-labelledby={`st-${c.id}`}>
          <h3 id={`st-${c.id}`} className="stage-title">{c.label}</h3>
          <table className="ing-table">
            <caption className="sr-only">{c.label}</caption>
            <thead className="sr-only"><tr><th scope="col">Ingredient</th><th scope="col">Amount</th></tr></thead>
            <tbody>
              {poolish && c.id === 'final_dough' && (
                <tr className="transfer">
                  <th scope="row" className="ing-name">
                    <span>All of the poolish above</span>
                    <span className="note-line">Add the whole batch — it is a transfer, not extra ingredients. Already counted in the totals.</span>
                  </th>
                  <td className="qty"><span className="qty-main"><b>{formatMeasure(poolish.poolishMass, settings.precision)}</b> <span className="unit">g</span></span></td>
                </tr>
              )}
              {c.ingredients.map((i) => <Row key={i.key} i={i} settings={settings} showOriginal={showOriginal} />)}
            </tbody>
          </table>
          {!c.includeInDoughMass && <p className="hint stage-note">Not counted in dough weight.</p>}
        </section>
      ))}
      {!isRice && (
        <div className="total-bar" role="status">
          <span>{scaled.recipe.id === 'poolish_pizza' ? 'Final dough' : scaled.recipe.category === 'laminated_pastry' ? 'Formula weight' : 'Dough weight'}</span>
          <strong>{mass.incomplete ? 'at least ' : mass.approximate ? '≈ ' : ''}{formatGrams(mass.grams, settings.precision)}</strong>
          {(mass.approximate || mass.incomplete) && (
            <small>
              {mass.incomplete ? 'Orange juice and zest have no stated weight, so this is a minimum. ' : ''}
              {mass.approximate ? 'Includes estimated conversions for oil, spoons or eggs — a guide, not a scale reading.' : ''}
            </small>
          )}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ Method */

export function MethodView({ scaled }: { scaled: ScaledRecipe }) {
  const r = scaled.recipe;
  const meta = METHOD_META[r.id];
  const chips = guidanceChips(r);
  const [done, setDone] = useState<Record<number, boolean>>({});
  const yeastPizza = r.id === 'poolish_pizza';
  return (
    <div className="method">
      <div className="method-head">
        <span className={`tag method-${meta?.status ?? 'full'}`}>{METHOD_BADGE[meta?.status ?? 'full']}</span>
        <p className="muted">{meta?.note}</p>
      </div>

      {yeastPizza && (
        <p className="notice" role="note">
          <strong>A note on yeast.</strong> 6 g dry yeast on 300 g of poolish flour is 2% — a lot for a long warm poolish. Use it for a short ferment, or keep the poolish cool/fridge-cold if you leave it longer. The recipe above is unchanged; edit the yeast if you want a long version.
        </p>
      )}

      {chips.length > 0 && (
        <dl className="guidance">
          {chips.map((c) => (
            <div key={c.label}><dt>{c.label}</dt><dd>{c.value}</dd></div>
          ))}
        </dl>
      )}
      {chips.length > 0 && <p className="hint">Times and temperatures are guidance from the source, not predictions from your batch size.</p>}

      {r.method.length === 0 ? (
        <p className="empty">No method steps in the source for this recipe.</p>
      ) : meta?.asNotes ? (
        <ul className="source-notes">{r.method.map((m, n) => <li key={n}>{m}</li>)}</ul>
      ) : (
        <ol className="steps">
          {r.method.map((m, n) => (
            <li key={n} className={done[n] ? 'done' : ''}>
              <label>
                <input type="checkbox" checked={!!done[n]} onChange={(e) => setDone({ ...done, [n]: e.target.checked })} />
                <span className="step-n" aria-hidden="true">{n + 1}</span>
                <span className="step-t">{m}</span>
              </label>
            </li>
          ))}
        </ol>
      )}
      {r.method.length > 0 && !meta?.asNotes && Object.values(done).some(Boolean) && (
        <button type="button" className="btn ghost" onClick={() => setDone({})}>Clear ticks</button>
      )}

    </div>
  );
}

export function NotesList({ notes }: { notes: string[] }) {
  if (!notes.length) return null;
  return (
    <details className="notes">
      <summary><Icon name="chevron" size={16} /> Notes from the source</summary>
      <ul>{notes.map((n, k) => <li key={k}>{n}</li>)}</ul>
    </details>
  );
}

/* ------------------------------------------------------------------ Ratios */

export function RatiosView({ scaled, basis, onBasis, settings }: { scaled: ScaledRecipe; basis: BasisMode; onBasis: (b: BasisMode) => void; settings: Settings }) {
  const r = scaled.recipe;
  const rice = r.ratio_basis.unit === 'g_rice';
  const alt = hasAlternateBasis(scaled);
  const rows = ratioRows(scaled, basis);
  const denom = basisGrams(scaled, basis);
  const sb = r.id === 'classic_sourdough' ? starterBreakdown(scaled) : null;
  const pb = r.id === 'poolish_pizza' ? calculatePreferment(scaled) : null;
  const names = new Map(scaled.components.flatMap((c) => c.ingredients.map((i) => [i.key, c.label] as const)));
  return (
    <div className="ratios">
      <p className="basis-line">
        <strong>{rice ? 'Rice-based practical ratios' : 'Baker’s percentages'}</strong> against <b>{formatGrams(denom, settings.precision)}</b> {basisLabel(scaled, basis).toLowerCase()}.
      </p>
      {rice && <p className="hint">These compare grams of rice with millilitres of wine and stock. They are practical ratios, not baker’s percentages.</p>}
      {alt && (
        <div role="radiogroup" aria-label="Percentage basis" className="seg">
          <button type="button" role="radio" aria-checked={basis === 'recipe'} className={basis === 'recipe' ? 'on' : ''} onClick={() => onBasis('recipe')}>{r.id === 'classic_sourdough' ? 'Added flour' : 'Main dough flour'}</button>
          <button type="button" role="radio" aria-checked={basis === 'total'} className={basis === 'total' ? 'on' : ''} onClick={() => onBasis('total')}>{r.id === 'classic_sourdough' ? 'Effective flour' : 'All flour'}</button>
        </div>
      )}

      <table className="ratio-table">
        <thead><tr><th scope="col">Ingredient</th><th scope="col" className="num">Amount (g eq.)</th><th scope="col" className="num">{rice ? 'Ratio' : '%'}</th></tr></thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.key}>
              <th scope="row"><span>{row.name}</span> <span className="muted small">· {names.get(row.key)}</span></th>
              <td className="num">{row.grams === null ? '—' : <>{row.approximate && '≈ '}{formatMeasure(row.grams, settings.precision)}</>}</td>
              <td className="num pct">{row.percent === null ? '—' : formatPercent(row.percent, 2)}{row.percent !== null && row.approximate && <span className="sr-only"> (estimated)</span>}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="hint">Percentages are computed from the exact scaled weights, never from the rounded display. ≈ marks gram values converted from volume or counts.</p>

      {sb && (
        <section className="explain">
          <h3 className="sub-head">Two views of the same dough</h3>
          <table className="ratio-table">
            <tbody>
              <tr><th scope="row">Added flour</th><td className="num">{formatMeasure(sb.totalFlour - sb.starterFlour)} g</td></tr>
              <tr><th scope="row">+ Flour inside the starter</th><td className="num">{formatMeasure(sb.starterFlour)} g</td></tr>
              <tr><th scope="row">= Effective flour</th><td className="num"><b>{formatMeasure(sb.totalFlour)} g</b></td></tr>
              <tr><th scope="row">Added water</th><td className="num">{formatMeasure(sb.totalWater - sb.starterWater)} g</td></tr>
              <tr><th scope="row">+ Water inside the starter</th><td className="num">{formatMeasure(sb.starterWater)} g</td></tr>
              <tr><th scope="row">= Effective water</th><td className="num"><b>{formatMeasure(sb.totalWater)} g</b></td></tr>
              <tr className="hl"><th scope="row">Source table: added water ÷ added flour</th><td className="num">{formatPercent(sb.addedWaterPct, 2)}</td></tr>
              <tr className="hl"><th scope="row">True hydration: effective water ÷ effective flour</th><td className="num"><b>{formatPercent(sb.effectiveHydrationPct, 3)}</b></td></tr>
            </tbody>
          </table>
          <p className="hint">The starter is not extra dough weight — its flour and water are already inside its {formatMeasure(sb.starterFlour + sb.starterWater)} g.</p>
        </section>
      )}

      {pb && (
        <section className="explain">
          <h3 className="sub-head">Poolish and final mix</h3>
          <table className="ratio-table">
            <thead><tr><th scope="col">Stage</th><th scope="col" className="num">Flour</th><th scope="col" className="num">Water</th><th scope="col" className="num">Hydration</th></tr></thead>
            <tbody>
              <tr><th scope="row">Poolish ({formatMeasure(pb.poolishMass)} g)</th><td className="num">{formatMeasure(pb.poolishFlour)}</td><td className="num">{formatMeasure(pb.poolishWater)}</td><td className="num">{formatPercent(pb.poolishHydrationPct, 0)}</td></tr>
              <tr><th scope="row">Final additions</th><td className="num">{formatMeasure(pb.finalFlour)}</td><td className="num">{formatMeasure(pb.finalWater)}</td><td className="num">{formatPercent((100 * pb.finalWater) / pb.finalFlour, 1)}</td></tr>
              <tr className="hl"><th scope="row">Whole dough</th><td className="num"><b>{formatMeasure(pb.totalFlour)}</b></td><td className="num"><b>{formatMeasure(pb.totalWater)}</b></td><td className="num"><b>{formatPercent(pb.overallHydrationPct, 1)}</b></td></tr>
            </tbody>
          </table>
          <p className="hint">{formatPercent(pb.prefermentedFlourPct, 0)} of the flour is prefermented. The poolish goes into the final dough whole and is counted once.</p>
        </section>
      )}

      {r.id === 'bens_focaccia' && <p className="explain hint">Olive oil is not water: hydration is water ÷ flour only. The oil’s share is shown separately (estimated at 0.91 g/mL).</p>}
      {(r.id === 'croissant_classic' || r.id === 'croissant_red') && (
        <p className="explain hint">Milk + water is a liquid-loading ratio, not true hydration (milk has solids). The {formatMeasure(scaled.components.find((c) => c.id === 'lamination')!.ingredients[0].grams ?? 0)} g butter block is separate from the dough butter.{r.id === 'croissant_red' && ' The red sheet’s flour is extra — switch to “All flour” to see percentages against 650 g.'}</p>
      )}
      {r.id === 'hot_cross_buns' && <p className="explain hint">Percentages use the 600 g dough flour. The extra 50 g working flour is listed separately; hydration is not stated because orange juice and egg water have no mass.</p>}

    </div>
  );
}
