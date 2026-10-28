import { useCallback, useEffect, useRef, useState } from 'react';
import { emptyState, loadState, mergeImport, saveState, type AppState } from '../engine/storage';
import type { Settings, Variant } from '../engine/types';

function getStore() {
  try {
    const s = window.localStorage;
    s.setItem('hcc:probe', '1');
    s.removeItem('hcc:probe');
    return s;
  } catch {
    return null;
  }
}

export function useAppState() {
  const store = useRef(getStore());
  const [state, setState] = useState<AppState>(() => loadState(store.current));
  const [canSave] = useState(() => store.current !== null);

  useEffect(() => {
    saveState(store.current, state);
  }, [state]);

  const setSettings = useCallback((patch: Partial<Settings>) => setState((s) => ({ ...s, settings: { ...s.settings, ...patch } })), []);
  const upsertVariant = useCallback(
    (v: Variant) => setState((s) => ({ ...s, variants: s.variants.some((x) => x.id === v.id) ? s.variants.map((x) => (x.id === v.id ? v : x)) : [...s.variants, v] })),
    [],
  );
  const deleteVariant = useCallback((id: string) => setState((s) => ({ ...s, variants: s.variants.filter((v) => v.id !== id) })), []);
  const importMerge = useCallback((incoming: AppState) => setState((s) => mergeImport(s, incoming)), []);
  const resetAll = useCallback(() => setState(emptyState()), []);

  return { state, canSave, setSettings, upsertVariant, deleteVariant, importMerge, resetAll };
}

export type AppStore = ReturnType<typeof useAppState>;
