import { calculateDoughMass } from '../engine/scale';
import { formatAmount, formatGrams } from '../engine/format';
import { unitKind } from '../engine/units';
import type { ScaledRecipe, Settings } from '../engine/types';
import { guidanceChips, METHOD_META } from './meta';

/** Plain, ink-friendly sheet. Hidden on screen; shown by the print stylesheet. */
export function PrintSheet({ scaled, title, settings, scaleLabel, edited }: { scaled: ScaledRecipe; title: string; settings: Settings; scaleLabel: string; edited: boolean }) {
  const mass = calculateDoughMass(scaled);
  const meta = METHOD_META[scaled.recipe.id];
  const date = new Date().toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' });
  const rice = scaled.recipe.ratio_basis.unit === 'g_rice';
  return (
    <section className="print-sheet" aria-hidden="true">
      <header>
        <p className="ps-brand">Hay’s Crust &amp; Crumb</p>
        <h1>{title}</h1>
        <p>{date} · {scaleLabel}{edited ? ' · includes personal edits' : ''}</p>
        <p className="ps-note">Source: {scaled.recipe.source}</p>
      </header>
      {scaled.components.map((c) => (
        <div key={c.id} className="ps-stage">
          <h2>{c.label}</h2>
          <ul>
            {c.ingredients.map((i) => {
              const a = formatAmount(i.amount, i.unit, settings.precision);
              const kind = unitKind(i.unit);
              return (
                <li key={i.key}>
                  <span className="box" />
                  <span className="ps-name">{i.name}</span>
                  <span className="ps-qty">
                    {a.text}{a.hint ? ` ${a.hint}` : ''}
                    {i.grams !== null && kind !== 'mass' && kind !== 'taste' && settings.showEquivalents ? ` (≈ ${formatGrams(i.grams, settings.precision)}${i.gramsApproximate ? ', est.' : ''})` : ''}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
      {!rice && (
        <p className="ps-total"><b>{scaled.recipe.id === 'poolish_pizza' ? 'Final dough' : 'Dough / formula weight'}:</b> {mass.incomplete ? '≥ ' : mass.approximate ? '≈ ' : ''}{formatGrams(mass.grams, settings.precision)}</p>
      )}
      <div className="ps-stage">
        <h2>Method</h2>
        <p className="ps-note">{meta?.note}</p>
        {scaled.recipe.method.length > 0 && (
          <ol>
            {scaled.recipe.method.map((m, n) => (
              <li key={n}>{!meta?.asNotes && <span className="box" />}{m}</li>
            ))}
          </ol>
        )}
        {guidanceChips(scaled.recipe).length > 0 && (
          <p className="ps-note">{guidanceChips(scaled.recipe).map((c) => `${c.label}: ${c.value}`).join(' · ')}</p>
        )}
      </div>
    </section>
  );
}
