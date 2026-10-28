# Hay's Crust & Crumb

Private, local-first recipe book and scaler. Nine recipes (classic white sourdough, white/whole wheat/rye sourdough, poolish pizza, focaccia, raisin bread, hot cross buns, classic and red croissants, risotto).

- **Recipes** — the originals exactly as written, with method, notes and baker's percentages. Make your own version of any recipe here.
- **Ratio Lab** — the one place scaling happens. Finish a sentence ("Make 14 pizza balls of 250 g", "Feed 8 people", "Make 5 loaves") and every stage is recalculated.
- Versions, print sheets and JSON backup. No account, no backend — everything stays on the device and works offline after the first load.

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # engine acceptance tests
npm run build      # production build in dist/
```

## Layout

| Path | What |
|---|---|
| `docs/brief.md` | The original design + data brief. |
| `src/data/seed-recipes.json` | Seed data, extracted from the JSON block in the brief. Frozen at runtime; a test checks it matches the brief. |
| `src/engine/` | Pure calculation code (no React): scaling, hydration, preferments, formatting, variants, storage/migrations. |
| `src/ui/` | React screens and the stylesheet (stone, walnut and bronze). |
| `PRODUCT.md`, `DESIGN.md` | Product record and design system. |
| `tests/` | Acceptance tests from section 7 of the brief, plus edge cases. |

## Rules the code keeps

- Original `amount` + `unit` are never overwritten; edits live in variants (`src/engine/variants.ts`).
- Percentages come from exact scaled weights, never from rounded display values.
- Poolish and sourdough starter are counted once.
- Eggs, spoons and oranges keep their original units; gram equivalents are marked as estimates.
