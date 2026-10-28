import { Fragment, useId, useMemo, useState } from 'react';
import { CONVERSIONS, MEASURES, RATIOS, baseAmount, defaultVariant, fromGrams, getCard, parseAmount, solveVariant, toGrams, type CupStandard, type RatioCard, type RatioIngredient, type SolvedRow } from '../engine/ratios';
import { getSeedRecipe } from '../engine/seed';
import { formatAmount, formatFraction, formatMeasure, formatPercent } from '../engine/format';
import { unitLabel } from '../engine/units';
import { Icon } from './icons';
import type { AppStore } from './store';

const CONVERTER_ID = 'cups';

/* ------------------------------------------------------------------ list */

export function RatioIndex() {
  const [q, setQ] = useState('');
  const needle = q.trim().toLowerCase();
  const groups = useMemo(
    () =>
      RATIOS.groups
        .map((g) => {
          const entries = [
            ...RATIOS.cards.filter((c) => c.group === g.id).map((c) => ({ id: c.id, name: c.name, meta: c.headline, flag: c.status !== 'solid' })),
            ...(g.id === 'tools' ? [{ id: CONVERTER_ID, name: 'Cups to grams', meta: 'Flour, sugar, butter and more', flag: false }] : []),
          ].filter((e) => !needle || `${e.name} ${e.meta} ${g.label}`.toLowerCase().includes(needle));
          return { ...g, entries };
        })
        .filter((g) => g.entries.length > 0),
    [needle],
  );
  return (
    <div className="page">
      <header className="page-head">
        <h1>Quick Ratios</h1>
        <p className="lede">The proportions cooks reach for, ready to scale. Type what you have and get the rest.</p>
      </header>
      <div className="field search">
        <label htmlFor="ratio-search">Find a ratio</label>
        <input id="ratio-search" type="search" inputMode="search" autoComplete="off" spellCheck={false} placeholder="Rice, pastry, brine…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      {groups.length === 0 && <p className="empty">Nothing matches “{q}”. Try a shorter word.</p>}
      {groups.map((g) => (
        <section key={g.id} className="ratio-group" aria-labelledby={`rg-${g.id}`}>
          <h2 id={`rg-${g.id}`} className="stage-title">{g.label}</h2>
          <ul className="ratio-list">
            {g.entries.map((e) => (
              <li key={e.id}>
                <a href={`#/ratios/${e.id}`}>
                  <span className="ix-name">{e.name}</span>
                  <span className="ix-meta">{e.meta}{e.flag ? ' · starting point' : ''}</span>
                </a>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ card */

/** Cups, spoons and eggs get an approximate weight; millilitres and grams are already measured. */
const showEquivalent = (row: SolvedRow, _ing: RatioIngredient) => row.grams !== null && row.gramsApprox && row.unit !== 'ml';

export function RatioDetail({ id, store }: { id: string; store: AppStore }) {
  if (id === CONVERTER_ID) return <Converter store={store} />;
  const card = getCard(id);
  if (!card) {
    return (
      <div className="page">
        <h1>Ratio not found</h1>
        <p><a href="#/ratios">See all ratios</a>.</p>
      </div>
    );
  }
  return <CardView key={card.id} card={card} std={store.state.settings.cup} />;
}

function CardView({ card, std }: { card: RatioCard; std: CupStandard }) {
  const uid = useId();
  const [variantId, setVariantId] = useState(defaultVariant(card).id);
  const variant = card.variants.find((v) => v.id === variantId) ?? card.variants[0];
  const [anchorId, setAnchorId] = useState(variant.ingredients[0].id);
  const anchor = variant.ingredients.find((i) => i.id === anchorId) ?? variant.ingredients[0];
  const [text, setText] = useState(String(baseAmount(variant, anchor.id)));
  const [good, setGood] = useState(baseAmount(variant, anchor.id));
  const [error, setError] = useState<string | null>(null);

  const rows = useMemo(() => solveVariant(card, variant, anchor.id, good, std), [card, variant, anchor.id, good, std]);
  const trim = (n: number) => String(+n.toFixed(n < 10 ? 3 : 1));

  const type = (v: string) => {
    setText(v);
    const r = parseAmount(v);
    if (r.ok) {
      setGood(r.value);
      setError(null);
    } else setError(r.error);
  };
  const pickVariant = (id: string) => {
    const v = card.variants.find((x) => x.id === id)!;
    const a = v.ingredients.find((i) => i.id === anchor.id) ?? v.ingredients[0];
    setVariantId(id);
    setAnchorId(a.id);
    setGood(baseAmount(v, a.id));
    setText(String(baseAmount(v, a.id)));
    setError(null);
  };
  // Switching the anchor keeps the batch the same, so the numbers do not jump.
  const pickAnchor = (id: string) => {
    const factor = good / anchor.amount;
    const next = baseAmount(variant, id) * factor;
    setAnchorId(id);
    setGood(next);
    setText(trim(next));
    setError(null);
  };

  const unitText = anchor.unit === 'egg' ? '' : unitLabel(anchor.unit, good);
  const related = (card.see ?? []).map((rid) => getSeedRecipe(rid)).filter((r): r is NonNullable<typeof r> => !!r);

  return (
    <article className="page ratio-card" aria-labelledby={`${uid}-h`}>
      <a className="back" href="#/ratios"><Icon name="back" size={16} /> All ratios</a>
      <header className="detail-head">
        <h1 id={`${uid}-h`}>{card.name}</h1>
        <p className="ratio-headline">{variant.headline ?? card.headline}</p>
      </header>

      {card.status !== 'solid' && (
        <p className="notice" role="note">
          <strong>A starting point.</strong> {card.flag}
        </p>
      )}

      {card.variants.length > 1 && (
        <fieldset className="say-it variants">
          <legend>Version</legend>
          <div className="seg">
            {card.variants.map((v) => (
              <label key={v.id} className={v.id === variant.id ? 'on' : undefined}>
                <input type="radio" name={`${uid}-v`} checked={v.id === variant.id} onChange={() => pickVariant(v.id)} />
                {v.label}
              </label>
            ))}
          </div>
        </fieldset>
      )}

      <section className="sentence-panel" aria-label="Your amount">
        <p className="sentence">
          I have{' '}
          <input
            className="blank"
            aria-label={`Amount of ${anchor.name}`}
            aria-invalid={!!error}
            aria-describedby={error ? `${uid}-err` : undefined}
            inputMode="decimal"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            enterKeyHint="done"
            size={5}
            style={{ width: `${Math.max(5, text.length) + 0.6}ch` }}
            value={text}
            onChange={(e) => type(e.target.value)}
            onFocus={(e) => e.currentTarget.select()}
            onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
          />
          {unitText && <> {unitText}</>}
          {anchor.unit !== 'egg' && ' of'}{' '}
          <select className="blank select" aria-label="Which ingredient you have" value={anchor.id} onChange={(e) => pickAnchor(e.target.value)}>
            {variant.ingredients.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
          </select>
          .
        </p>
        {error && <p id={`${uid}-err`} className="error" role="alert">{error}</p>}
      </section>

      <section className="stage ratio-result" aria-labelledby={`${uid}-need`}>
        <h2 id={`${uid}-need`} className="stage-title">You need</h2>
        <table className="ing-table">
          <caption className="sr-only">Amounts for {card.name}</caption>
          <tbody>
            {rows.map((r) => {
              const ing = variant.ingredients.find((i) => i.id === r.id)!;
              const a = formatAmount(r.amount, r.unit);
              return (
                <tr key={r.id}>
                  <th scope="row" className="ing-name">
                    <span>{r.name}</span>
                    {r.percent !== null && <span className="note-line">{formatPercent(r.percent, r.percent < 10 ? 1 : 0)} of {variant.ingredients.find((i) => i.id === card.bakers)?.name.toLowerCase()}</span>}
                  </th>
                  <td className="qty">
                    <span className="qty-main"><b>{a.qty}</b> <span className="unit">{a.unit}</span></span>
                    {a.hint && <span className="qty-hint">{a.hint}</span>}
                    {showEquivalent(r, ing) && <span className="qty-eq">≈ {formatMeasure(r.grams!)} g</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      <section className="ratio-notes" aria-labelledby={`${uid}-notes`}>
        <h2 id={`${uid}-notes`} className="stage-title">Good to know</h2>
        <ul>
          {variant.note && <li>{variant.note}</li>}
          {card.notes.map((n, k) => <li key={k}>{n}</li>)}
          {std === 'au' && rows.some((r) => ['cup', 'tbsp'].includes(r.unit)) && <li>Cups and spoons here are Australian sizes (250 ml cup, 20 ml tablespoon). Change this in <a href="#/settings">Settings</a>.</li>}
        </ul>
      </section>

      {related.length > 0 && (
        <p className="related">
          Related recipes:{' '}
          {related.map((r, k) => (
            <Fragment key={r.id}>{k > 0 && ', '}<a href={`#/recipes/${r.id}`}>{r.name}</a></Fragment>
          ))}
          .
        </p>
      )}
    </article>
  );
}

/* ------------------------------------------------------------------ cups to grams */

/** "About" amounts read better in kitchen fractions: 0.99 cup is 1 cup. */
const nearestEighth = (n: number) => (n < 0.125 ? +n.toFixed(2) : Math.round(n * 8) / 8);

type VolUnit = 'cup' | 'tbsp' | 'tsp' | 'ml';
const VOL_LABEL: Record<VolUnit, [string, string]> = { cup: ['cup', 'cups'], tbsp: ['tablespoon', 'tablespoons'], tsp: ['teaspoon', 'teaspoons'], ml: ['ml', 'ml'] };

function Converter({ store }: { store: AppStore }) {
  const uid = useId();
  const std = store.state.settings.cup;
  const [itemId, setItemId] = useState('flour_plain');
  const [unit, setUnit] = useState<VolUnit>('cup');
  const [dir, setDir] = useState<'toGrams' | 'fromGrams'>('toGrams');
  const [text, setText] = useState('1');
  const item = CONVERSIONS.items.find((i) => i.id === itemId)!;
  const parsed = parseAmount(text);
  const value = parsed.ok ? parsed.value : null;
  const result = value === null ? null : dir === 'toGrams' ? toGrams(item, value, unit, std) : fromGrams(item, value, unit, std);

  const flipDir = (d: 'toGrams' | 'fromGrams') => {
    if (d === dir) return;
    if (result !== null) setText(String(+result.toFixed(2)));
    setDir(d);
  };
  const quick: [string, number, VolUnit][] = [['1 cup', 1, 'cup'], ['¾ cup', 0.75, 'cup'], ['½ cup', 0.5, 'cup'], ['⅓ cup', 1 / 3, 'cup'], ['¼ cup', 0.25, 'cup'], ['1 tablespoon', 1, 'tbsp'], ['1 teaspoon', 1, 'tsp']];

  return (
    <article className="page ratio-card" aria-labelledby={`${uid}-h`}>
      <a className="back" href="#/ratios"><Icon name="back" size={16} /> All ratios</a>
      <header className="detail-head">
        <h1 id={`${uid}-h`}>Cups to grams</h1>
        <p className="ratio-headline">{MEASURES[std].label}</p>
      </header>

      <fieldset className="say-it variants">
        <legend>Convert</legend>
        <div className="seg">
          <label className={dir === 'toGrams' ? 'on' : undefined}><input type="radio" name={`${uid}-d`} checked={dir === 'toGrams'} onChange={() => flipDir('toGrams')} />Cups to grams</label>
          <label className={dir === 'fromGrams' ? 'on' : undefined}><input type="radio" name={`${uid}-d`} checked={dir === 'fromGrams'} onChange={() => flipDir('fromGrams')} />Grams to cups</label>
        </div>
      </fieldset>

      <section className="sentence-panel" aria-label="Convert an amount">
        <p className="sentence">
          {dir === 'toGrams' ? (
            <>
              <input className="blank" aria-label="Amount" aria-invalid={!parsed.ok} inputMode="decimal" autoComplete="off" spellCheck={false} enterKeyHint="done" size={4} style={{ width: `${Math.max(4, text.length) + 0.6}ch` }} value={text} onChange={(e) => setText(e.target.value)} onFocus={(e) => e.currentTarget.select()} onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()} />{' '}
              <UnitSelect unit={unit} onChange={setUnit} plural={value !== 1} />{' '}of{' '}
              <ItemSelect id={itemId} onChange={setItemId} />{' '}weighs{' '}
              <b className="answer">{result === null ? '—' : `${formatMeasure(result)} g`}</b>.
            </>
          ) : (
            <>
              <input className="blank" aria-label="Grams" aria-invalid={!parsed.ok} inputMode="decimal" autoComplete="off" spellCheck={false} enterKeyHint="done" size={4} style={{ width: `${Math.max(4, text.length) + 0.6}ch` }} value={text} onChange={(e) => setText(e.target.value)} onFocus={(e) => e.currentTarget.select()} onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()} />
              {' '}g of{' '}<ItemSelect id={itemId} onChange={setItemId} />{' '}is about{' '}
              <b className="answer">{result === null ? '—' : unit === 'ml' ? formatMeasure(result) : formatFraction(nearestEighth(result))}</b>{' '}
              <UnitSelect unit={unit} onChange={setUnit} plural={result !== null && result > 1} />.
            </>
          )}
        </p>
        {!parsed.ok && <p className="error" role="alert">{parsed.error}</p>}
      </section>

      <section className="stage ratio-result" aria-labelledby={`${uid}-q`}>
        <h2 id={`${uid}-q`} className="stage-title">{item.name} at a glance</h2>
        <table className="ing-table">
          <tbody>
            {quick.map(([label, n, u]) => (
              <tr key={label}>
                <th scope="row" className="ing-name"><span>{label}</span></th>
                <td className="qty"><span className="qty-main"><b>{formatMeasure(toGrams(item, n, u as 'cup' | 'tbsp' | 'tsp', std))}</b> <span className="unit">g</span></span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="ratio-notes">
        <h2 className="stage-title">Good to know</h2>
        <ul>
          <li>{CONVERSIONS.note}</li>
          {item.note && <li>{item.note}</li>}
          <li>Using {std === 'au' ? 'Australian' : 'US'} cups and spoons. Change this in <a href="#/settings">Settings</a>.</li>
        </ul>
      </section>
    </article>
  );
}

function UnitSelect({ unit, onChange, plural }: { unit: VolUnit; onChange: (u: VolUnit) => void; plural: boolean }) {
  return (
    <select className="blank select" aria-label="Unit" value={unit} onChange={(e) => onChange(e.target.value as VolUnit)}>
      {(Object.keys(VOL_LABEL) as VolUnit[]).map((u) => <option key={u} value={u}>{VOL_LABEL[u][plural ? 1 : 0]}</option>)}
    </select>
  );
}

function ItemSelect({ id, onChange }: { id: string; onChange: (id: string) => void }) {
  return (
    <select className="blank select" aria-label="Ingredient" value={id} onChange={(e) => onChange(e.target.value)}>
      {CONVERSIONS.groups.map((g) => (
        <optgroup key={g.id} label={g.label}>
          {CONVERSIONS.items.filter((i) => i.group === g.id).map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
        </optgroup>
      ))}
    </select>
  );
}
