import { useEffect, useRef, useState } from 'react';
import { SEED } from '../engine/seed';
import { useAppState } from './store';
import { Workbench } from './Workbench';
import { RatioLab, RecipePicker, SettingsPage, Variants } from './Pages';
import { HeroSlice, Logo, Starburst } from './art';

type Route = { page: 'recipes'; id: string } | { page: 'lab' } | { page: 'variants' } | { page: 'settings' };

const DEFAULT_ID = SEED.recipes[0].id;

function parse(hash: string): Route {
  const p = hash.replace(/^#\/?/, '').split('/');
  switch (p[0]) {
    case 'lab': return { page: 'lab' };
    case 'variants': return { page: 'variants' };
    case 'settings': return { page: 'settings' };
    case 'recipes': return { page: 'recipes', id: p[1] || DEFAULT_ID };
    default: return { page: 'recipes', id: DEFAULT_ID };
  }
}

const NAV: [string, string, Route['page']][] = [['#/', 'Recipes', 'recipes'], ['#/lab', 'Ratio Lab', 'lab'], ['#/variants', 'Saved Variants', 'variants'], ['#/settings', 'Settings / Backup', 'settings']];

export function App() {
  const store = useAppState();
  const [route, setRoute] = useState<Route>(() => parse(window.location.hash));
  const carry = useRef<number | null>(null);
  const lastRecipe = useRef(route.page === 'recipes' ? route.id : DEFAULT_ID);
  const main = useRef<HTMLElement>(null);

  useEffect(() => {
    const on = () => {
      const r = parse(window.location.hash);
      setRoute(r);
      window.scrollTo({ top: 0 });
      main.current?.focus({ preventScroll: true });
    };
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);

  if (route.page === 'recipes') lastRecipe.current = route.id;
  const go = (id: string) => {
    window.location.hash = `#/recipes/${id}`;
  };

  return (
    <>
      <a className="skip" href="#main">Skip to content</a>
      <header className="topbar no-print">
        <div className="topbar-in">
          <a href="#/" className="brand"><Logo /></a>
          <nav aria-label="Main">
            <ul>
              {NAV.map(([href, label, page]) => (
                <li key={page}>
                  <a href={page === 'recipes' ? `#/recipes/${lastRecipe.current}` : href} aria-current={route.page === page ? 'page' : undefined}>{label}</a>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </header>

      <div className="shell">
        {route.page === 'recipes' && (
          <div className="hero no-print">
            <HeroSlice />
            <div>
              <p className="hero-kicker"><Starburst /> Slow dough. Big flavour.</p>
              <p className="hero-sub">Your batch, your rules. Pick a formula, set a target, bake without the arithmetic.</p>
            </div>
            <div className="checker" aria-hidden="true" />
          </div>
        )}
        <main id="main" tabIndex={-1} ref={main}>
          {route.page === 'recipes' && (
            <>
              <div className="no-print"><RecipePicker activeId={route.id} store={store} go={go} /></div>
              <Workbench key={route.id} routeId={route.id} store={store} carry={carry} go={go} />
            </>
          )}
          {route.page === 'lab' && <RatioLab />}
          {route.page === 'variants' && <Variants store={store} go={go} />}
          {route.page === 'settings' && <SettingsPage store={store} />}
        </main>
        <footer className="foot no-print">
          <div className="checker" aria-hidden="true" />
          <p>Hay’s Crust &amp; Crumb · private, works offline, nothing leaves this device.</p>
        </footer>
      </div>
    </>
  );
}
