import { useMemo, useState } from 'react';
import { TILE_ORDER, getSeedRecipe } from '../engine/seed';
import { scaleRecipe } from '../engine/scale';
import { computeMetrics } from '../engine/metrics';
import { formatMetric } from '../engine/format';
import { createVariant, updateVariant } from '../engine/variants';
import { DEFAULT_TWEAKS, type Recipe, type Settings, type Variant } from '../engine/types';
import { IngredientsView, MethodView, NotesList, RatiosView, StatusChip } from './Views';
import { VersionDialog } from './Editor';
import { PrintSheet } from './PrintSheet';
import { Icon } from './icons';
import { RECIPE_PHOTOS } from './photos';
import type { AppStore } from './store';
import type { BasisMode } from '../engine/metrics';

const yieldText = (r: Recipe) => {
  const y = r.yield;
  if (y.count_range) return `${y.count_range.join('–')} ${y.unit}s`;
  const n = y.count ?? 1;
  const unit = y.unit.replace('main-course serving', n === 1 ? 'serving' : 'servings').replace('tin loaf', n === 1 ? 'tin loaf' : 'tin loaves');
  return `${n} ${n === 1 || unit.endsWith('s') ? unit : unit === 'loaf' ? 'loaves' : `${unit}s`}`;
};

function keyFigure(r: Recipe, s: Settings): string | null {
  const ms = computeMetrics(scaleRecipe(r, { factor: 1 }));
  const m = ms.find((x) => ['hyd', 'liquid'].includes(x.id) && x.value !== null) ?? ms.find((x) => ['fruitpct', 'stockratio'].includes(x.id));
  if (!m) return null;
  const v = m.text ?? formatMetric(m.value!, m.format, m.decimals ?? 1, s.precision);
  return m.id === 'fruitpct' ? `${v} dried fruit` : `${v} ${m.label.toLowerCase()}`;
}

export function RecipeIndex({ activeId, store }: { activeId: string | null; store: AppStore }) {
  const { variants, settings } = store.state;
  const items = useMemo(() => TILE_ORDER.map((t) => ({ t, r: getSeedRecipe(t.id)! })), []);
  return (
    <nav className="index" aria-label="Recipes">
      <h2 className="index-head">Recipes</h2>
      <ul>
        {items.map(({ t, r }) => (
          <li key={t.id}>
            <a href={`#/recipes/${t.id}`} aria-current={activeId === t.id ? 'page' : undefined}>
              <span className="ix-name">{r.name}</span>
              <span className="ix-meta">{yieldText(r)}{keyFigure(r, settings) ? ` · ${keyFigure(r, settings)}` : ''}</span>
            </a>
          </li>
        ))}
      </ul>
      {variants.length > 0 && (
        <>
          <h2 className="index-head">Your versions</h2>
          <ul>
            {variants.map((v) => (
              <li key={v.id}>
                <a href={`#/recipes/${v.id}`} aria-current={activeId === v.id ? 'page' : undefined}>
                  <span className="ix-name">{v.name}</span>
                  <span className="ix-meta">From {getSeedRecipe(v.baseId)?.name ?? 'a missing recipe'} · v{v.version}</span>
                </a>
              </li>
            ))}
          </ul>
        </>
      )}
    </nav>
  );
}

type Tab = 'ingredients' | 'method' | 'ratios';

export function RecipeDetail({ routeId, store, go }: { routeId: string; store: AppStore; go: (hash: string) => void }) {
  const variant: Variant | undefined = store.state.variants.find((v) => v.id === routeId);
  const seed = variant ? getSeedRecipe(variant.baseId) : getSeedRecipe(routeId);
  const [tab, setTab] = useState<Tab>('ingredients');
  const [basis, setBasis] = useState<BasisMode>('recipe');
  const [editing, setEditing] = useState(false);
  const [toast, setToast] = useState('');
  const { settings } = store.state;
  const scaled = useMemo(() => (seed ? scaleRecipe(seed, { factor: 1, amounts: variant?.amounts, tweaks: { ...DEFAULT_TWEAKS, ...variant?.tweaks } }) : null), [seed, variant]);
  const metrics = useMemo(() => (scaled ? computeMetrics(scaled) : []), [scaled]);

  if (!seed || !scaled) {
    return (
      <article className="detail">
        <h1>Recipe not found</h1>
        <p>That recipe or version no longer exists on this device. <a href="#/recipes">See all recipes</a>.</p>
      </article>
    );
  }
  const editCount = variant ? Object.keys(variant.amounts).length : 0;
  const title = variant?.name ?? seed.name;
  const tabs: [Tab, string][] = [['ingredients', 'Ingredients'], ['method', 'Method'], ['ratios', 'Ratios']];

  return (
    <article className="detail" aria-labelledby="rec-title">
      <a className="back" href="#/recipes"><Icon name="back" size={16} /> All recipes</a>
      {RECIPE_PHOTOS[seed.id] && (
        <figure className="hero-photo">
          <img
            src={RECIPE_PHOTOS[seed.id].src}
            srcSet={RECIPE_PHOTOS[seed.id].srcSet}
            sizes="(min-width: 1200px) 830px, (min-width: 960px) calc(100vw - 420px), 100vw"
            width={1536}
            height={1024}
            alt={RECIPE_PHOTOS[seed.id].alt}
            fetchPriority="high"
            decoding="async"
          />
        </figure>
      )}
      <header className="detail-head">
        <h1 id="rec-title">{title}</h1>
        <p className="source">
          {variant ? <>Your version of {seed.name} · version {variant.version} · {editCount} {editCount === 1 ? 'change' : 'changes'}. </> : null}
          Source: {seed.source}
        </p>
        <dl className="facts">
          {metrics.filter((m) => m.value !== null || m.text).slice(0, 4).map((m) => (
            <div key={m.id}>
              <dt>{m.label}</dt>
              <dd>{m.approx && m.value !== null ? '≈ ' : ''}{m.text ?? formatMetric(m.value!, m.format, m.decimals ?? 1, settings.precision)}</dd>
            </div>
          ))}
        </dl>
        <div className="actions">
          <a className="btn primary" href={`#/lab/${routeId}`}>Scale in Ratio Lab <Icon name="arrow" /></a>
          <button type="button" className="btn ghost" onClick={() => setEditing(true)}><Icon name="edit" /> {variant ? 'Edit this version' : 'Make my own version'}</button>
          <button type="button" className="btn ghost" onClick={() => window.print()}><Icon name="print" /> Print</button>
        </div>
        {variant && <p className="status-line"><StatusChip status="personal_edit" /> Amounts marked “Edited” differ from the original.</p>}
        <div role="status" aria-live="polite" className="toast">{toast}</div>
      </header>

      <div role="tablist" aria-label="Recipe sections" className="tabs">
        {tabs.map(([k, label]) => (
          <button key={k} role="tab" type="button" id={`tab-${k}`} aria-selected={tab === k} aria-controls={`panel-${k}`} onClick={() => setTab(k)}>
            {label}
          </button>
        ))}
      </div>
      <div role="tabpanel" id="panel-ingredients" aria-labelledby="tab-ingredients" hidden={tab !== 'ingredients'}>
        <IngredientsView scaled={scaled} settings={settings} />
      </div>
      <div role="tabpanel" id="panel-method" aria-labelledby="tab-method" hidden={tab !== 'method'}>
        <MethodView scaled={scaled} />
      </div>
      <div role="tabpanel" id="panel-ratios" aria-labelledby="tab-ratios" hidden={tab !== 'ratios'}>
        <RatiosView scaled={scaled} basis={basis} onBasis={setBasis} settings={settings} />
      </div>
      <NotesList notes={seed.notes} />

      <PrintSheet scaled={scaled} title={title} settings={settings} scaleLabel="original quantities" edited={editCount > 0} />
      <VersionDialog
        open={editing}
        onClose={() => setEditing(false)}
        recipe={seed}
        amounts={variant?.amounts ?? {}}
        title={variant ? 'Edit your version' : 'Make your own version'}
        initialName={variant?.name ?? `${seed.name} — my version`}
        cta={variant ? 'Save changes' : 'Save my version'}
        onSave={(name, amounts) => {
          if (variant) {
            store.upsertVariant(updateVariant(variant, seed, { name, amounts }));
            setToast(`Saved as version ${variant.version + 1}.`);
          } else {
            const v = createVariant(seed, name, amounts);
            store.upsertVariant(v);
            go(`#/recipes/${v.id}`);
          }
        }}
      />
    </article>
  );
}
