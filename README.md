# Hay's Crust & Crumb

Private, local-first recipe scaler and ratio workbench. Eight recipes (sourdough, poolish pizza, focaccia, raisin bread, hot cross buns, classic and red croissants, risotto), baker's percentages, hydration maths, personal variants, print sheets and JSON backup. No account, no backend — everything stays on the device and works offline after the first load.

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
| `src/ui/` | React screens and the retro stylesheet. |
| `tests/` | Acceptance tests from section 7 of the brief, plus edge cases. |

## Rules the code keeps

- Original `amount` + `unit` are never overwritten; edits live in variants (`src/engine/variants.ts`).
- Percentages come from exact scaled weights, never from rounded display values.
- Poolish and sourdough starter are counted once.
- Eggs, spoons and oranges keep their original units; gram equivalents are marked as estimates.
