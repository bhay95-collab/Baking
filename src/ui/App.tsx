import { useEffect, useRef, useState } from 'react';
import { SEED } from '../engine/seed';
import { useAppState } from './store';
import { RecipeDetail, RecipeIndex } from './RecipePage';
import { Lab, type LabCarry } from './Lab';
import { SettingsPage, Variants } from './Pages';
import { RatioDetail, RatioIndex } from './RatioPages';
import { Logo } from './icons';

type Route =
  | { page: 'recipes'; id: string | null }
  | { page: 'lab'; id: string }
  | { page: 'ratios'; id: string | null }
  | { page: 'variants' }
  | { page: 'settings' };

const DEFAULT_ID = SEED.recipes[0].id;

function parse(hash: string): Route {
  const p = hash.replace(/^#\/?/, '').split('/');
  switch (p[0]) {
    case 'lab': return { page: 'lab', id: p[1] || DEFAULT_ID };
    case 'ratios': return { page: 'ratios', id: p[1] || null };
    case 'variants': return { page: 'variants' };
    case 'settings': return { page: 'settings' };
    case 'recipes': return { page: 'recipes', id: p[1] || null };
    default: return { page: 'recipes', id: null };
  }
}

export function App() {
  const store = useAppState();
  const [route, setRoute] = useState<Route>(() => parse(window.location.hash));
  const carry = useRef<LabCarry | null>(null);
  const lastId = useRef<string>(DEFAULT_ID);
  const main = useRef<HTMLElement>(null);

  useEffect(() => {
    const on = () => {
      const prev = route;
      const r = parse(window.location.hash);
      setRoute(r);
      // Moving between pages resets scroll and focus; switching recipe inside the Lab keeps your place.
      if (!(prev.page === 'lab' && r.page === 'lab')) {
        window.scrollTo({ top: 0 });
        main.current?.focus({ preventScroll: true });
      }
    };
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, [route]);

  if ((route.page === 'recipes' || route.page === 'lab') && route.id) lastId.current = route.id;
  const go = (hash: string) => {
    window.location.hash = hash;
  };

  const nav: [string, string, Route['page']][] = [
    ['#/recipes', 'Recipes', 'recipes'],
    [`#/lab/${lastId.current}`, 'Ratio Lab', 'lab'],
    ['#/ratios', 'Ratios', 'ratios'],
    ['#/variants', 'Versions', 'variants'],
    ['#/settings', 'Settings', 'settings'],
  ];

  return (
    <>
      <a className="skip" href="#main">Skip to content</a>
      <header className="topbar no-print">
        <div className="topbar-in">
          <a href="#/recipes" className="brand" aria-label="Hay’s Crust & Crumb, all recipes"><Logo /></a>
          <nav aria-label="Main">
            <ul>
              {nav.map(([href, label, page]) => (
                <li key={page}>
                  <a href={href} aria-current={route.page === page ? 'page' : undefined}>{label}</a>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </header>

      <main id="main" tabIndex={-1} ref={main} className="shell">
        {route.page === 'recipes' && (
          <div className={`book${route.id ? ' has-detail' : ''}`}>
            <RecipeIndex activeId={route.id ?? (window.matchMedia?.('(min-width: 960px)').matches ? DEFAULT_ID : null)} store={store} />
            <div className="book-page">
              <RecipeDetail key={route.id ?? DEFAULT_ID} routeId={route.id ?? DEFAULT_ID} store={store} go={go} />
            </div>
          </div>
        )}
        {route.page === 'lab' && <Lab routeId={route.id} store={store} carry={carry} go={go} />}
        {route.page === 'ratios' && (route.id ? <RatioDetail key={route.id} id={route.id} store={store} /> : <RatioIndex />)}
        {route.page === 'variants' && <Variants store={store} go={go} />}
        {route.page === 'settings' && <SettingsPage store={store} />}
      </main>
      <footer className="foot no-print">
        <p>Hay’s Crust &amp; Crumb · a private recipe book · works offline, nothing leaves this device</p>
      </footer>
    </>
  );
}
