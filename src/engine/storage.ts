import { DEFAULT_SETTINGS, type Settings, type Variant } from './types';

export const STORAGE_KEY = 'hcc:state';
export const CURRENT_VERSION = 1;

export interface AppState {
  version: number;
  variants: Variant[];
  settings: Settings;
}

export const emptyState = (): AppState => ({ version: CURRENT_VERSION, variants: [], settings: { ...DEFAULT_SETTINGS } });

type Migration = (raw: Record<string, unknown>) => Record<string, unknown>;

/** Index n migrates a version-n document to version n+1. Add new steps at the end. */
export const MIGRATIONS: Migration[] = [
  // v0 → v1: early drafts stored { variants } only, without settings.
  (raw) => ({ ...raw, version: 1, settings: { ...DEFAULT_SETTINGS, ...((raw.settings as object) ?? {}) }, variants: raw.variants ?? [] }),
];

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

function sanitizeVariant(v: unknown): Variant | null {
  if (!isObj(v) || typeof v.id !== 'string' || typeof v.baseId !== 'string' || typeof v.name !== 'string') return null;
  const amounts: Record<string, number> = {};
  if (isObj(v.amounts)) for (const [k, n] of Object.entries(v.amounts)) if (typeof n === 'number' && Number.isFinite(n) && n >= 0) amounts[k] = n;
  const now = new Date().toISOString();
  return {
    id: v.id,
    name: v.name.slice(0, 120),
    baseId: v.baseId,
    baseSeedVersion: typeof v.baseSeedVersion === 'string' ? v.baseSeedVersion : '1.0.0',
    version: typeof v.version === 'number' ? v.version : 1,
    createdAt: typeof v.createdAt === 'string' ? v.createdAt : now,
    updatedAt: typeof v.updatedAt === 'string' ? v.updatedAt : now,
    amounts,
    tweaks: isObj(v.tweaks) ? (v.tweaks as Variant['tweaks']) : {},
    note: typeof v.note === 'string' ? v.note : undefined,
  };
}

/** Bring any stored/imported document up to CURRENT_VERSION and sanitize it. */
export function migrate(raw: unknown): AppState {
  if (!isObj(raw)) return emptyState();
  let doc: Record<string, unknown> = raw;
  let version = typeof doc.version === 'number' ? doc.version : 0;
  if (version > CURRENT_VERSION) throw new Error(`This data was saved by a newer version of the app (v${version}).`);
  while (version < CURRENT_VERSION) {
    doc = MIGRATIONS[version](doc);
    version = typeof doc.version === 'number' ? doc.version : version + 1;
  }
  const settings = { ...DEFAULT_SETTINGS, ...(isObj(doc.settings) ? doc.settings : {}) } as Settings;
  const variants = (Array.isArray(doc.variants) ? doc.variants : []).map(sanitizeVariant).filter((v): v is Variant => v !== null);
  return { version: CURRENT_VERSION, variants, settings };
}

export interface KV {
  getItem(k: string): string | null;
  setItem(k: string, v: string): void;
  removeItem(k: string): void;
}

export function loadState(store: KV | null): AppState {
  if (!store) return emptyState();
  try {
    const text = store.getItem(STORAGE_KEY);
    return text ? migrate(JSON.parse(text)) : emptyState();
  } catch {
    return emptyState();
  }
}

export function saveState(store: KV | null, state: AppState): boolean {
  if (!store) return false;
  try {
    store.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}

export const EXPORT_APP = 'hays-crust-and-crumb';

export function exportState(state: AppState, now: Date = new Date()): string {
  return JSON.stringify({ app: EXPORT_APP, exportedAt: now.toISOString(), state }, null, 2);
}

/** Parse + migrate an exported file. Throws a readable Error on anything unexpected. */
export function parseImport(text: string): AppState {
  let doc: unknown;
  try {
    doc = JSON.parse(text);
  } catch {
    throw new Error('That file is not valid JSON.');
  }
  if (!isObj(doc) || doc.app !== EXPORT_APP || !isObj(doc.state)) throw new Error("That doesn't look like a Hay's Crust & Crumb backup.");
  return migrate(doc.state);
}

/** Merge imported variants into current: same id → newer updatedAt wins. Settings are kept. */
export function mergeImport(current: AppState, incoming: AppState): AppState {
  const byId = new Map(current.variants.map((v) => [v.id, v]));
  for (const v of incoming.variants) {
    const have = byId.get(v.id);
    if (!have || v.updatedAt > have.updatedAt) byId.set(v.id, v);
  }
  return { ...current, variants: [...byId.values()] };
}
