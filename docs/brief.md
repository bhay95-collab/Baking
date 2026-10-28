> **Update 28 Oct 2026:** the sourdough in this brief (520 g flour, 110 g 100% starter) is superseded by Ben's recipe sheet: *Classic White Sourdough* (598 g flour, 450 g water, 102 g stiff 60% starter, 14 g salt) and a new *White, Whole Wheat & Rye Sourdough*. The live data is `src/data/seed-recipes.json`; this file is kept as history.

# HAY’S CRUST & CRUMB
## Complete Recipe Ratios + Website Agent Design & Build Brief

**Version:** 1.0 · **Prepared:** 28 October 2026 · **Format:** single self-contained Markdown specification  
**For:** a private, local-first recipe calculator and ratio workbench  
**Included:** eight recipes (including both croissant variants), original measures, baker's percentages, cooking method notes where known, interface design brief, developer implementation rules, sample calculations, and a complete machine-readable JSON dataset embedded at the bottom.

> **Agent instruction:** Treat this Markdown file as the ONLY required input. Build the app from the embedded recipe data in **Part III** and the product requirements in **Part I**. The readable tables in **Part II** allow human checking. Do not assume a separate `.json` or design asset is available. Prioritise exact source quantities over guessed measures.

---

# Part I — Website design and implementation brief

## 1. Product goal

Build a personal-use website called **Hay’s Crust & Crumb** that makes it effortless to scale recipes, inspect baker's percentages or rice-based ratios, understand hydration and preferment contributions, and plan dough portions. The experience should feel like an **80s neon bakery/pizzeria arcade poster** turned into a polished, practical kitchen tool — not like an accounting spreadsheet.

This is **not** an ecommerce, social, or public recipe-sharing product. **No sign-in, checkout, ads, account system, analytics SDK, or backend is required.** A local-first client app is preferable. Data should persist on the user's own device; include export/import so personal edits can be backed up.

### Primary jobs to be done
1. Select one of the eight recipes and see the **unmodified original** formula immediately.
2. Scale from 0.25× to 10× (or wider sensible limits) with **a live, accurately recalculated ingredient table**.
3. Specify a *target number of loaves/buns/croissants*, *target flour or rice quantity*, *target batch multiplier*, and (when safe) *target dough mass*.
4. For pizza, optionally enter **number of pizza balls + desired weight per ball**; generate the poolish and final dough components without double-counting.
5. Compare **baker's percentages** and true / nominal hydration, showing the basis clearly.
6. Toggle **classic vs bright-red croissants** without losing or overwriting the classic base recipe.
7. Get a clear printable / phone-friendly **bake sheet**, including each recipe's known method and timing.
8. Edit or duplicate a recipe *as a personal variant*, without modifying the preserved original; export all data.

## 2. Brand and visual direction

The user’s supplied **Classic Poolish Pizza** poster is the design anchor. Its distinctive elements: a near-black/ink-blue ground; electric cyan outline; hot coral/red headline; fuchsia/pink accents; sunshine-yellow information panels; teal highlights; bold offset-shadow lettering; 80s checkers, little starbursts, retro sunset motif, and an expressive cartoon pizza slice. Recreate that **visual language** in a usable responsive UI, rather than trying to cram a literal poster into each screen. Keep the playful identity while making figures, fractions, labels, and controls extremely legible.

### Suggested style tokens (design targets, not measured poster swatches)

| Role | Value | Usage |
|---|---|---|
| Page background | `#09111B` | Deep midnight/navy, slight grain optional |
| Raised panels | `#11212A` | Cards, tables, forms |
| Electric cyan | `#16E6DD` | Primary outlines, active navigation, focus rings |
| Hot coral | `#FF5868` | Large titles, important accent |
| Neon magenta | `#FF2E96` | Offset shadows, accents, secondary highlight |
| Arcade yellow | `#FFD232` | Recipe / stage ribbons, important metrics |
| Teal green | `#22D8C1` | Positive accents and percentage labels |
| Cream | `#FFF0D6` | Large text on dark, legible displays |
| Body text | `#EDF3F1` | Normal reading |
| Subtle text | `#ADC2C7` | Secondary labels (keep accessible contrast) |

**Typography:** A bold, condensed retro display face (for example *Bebas Neue* or *Barlow Condensed*) for hero headings; expressive brush-style lettering very sparingly for playful stage labels; a clean numerically legible sans-serif (*Inter*, *DM Sans*, or similar) for form inputs and recipe tables. Use tabular lining numerals for ingredient weights. Use good fallbacks and avoid requiring a commercial font licence.

**Graphics:** Neon outer glow should be restrained. Use checkerboard dividers, starbursts, sticker-like stage headers (`POOLISH`, `MAIN DOUGH`), simple baking icons and recipe-specific illustration when available. Illustrations must not obscure data. Respect `prefers-reduced-motion` and make all functional states visually distinct without relying on colour alone.

### Tone and microcopy
Clever, confident, retro and practical. Useful labels such as **“Dial in your dough”**, **“Mixing maths”**, **“Slow dough. Big flavour.”**, and **“Your batch, your rules.”** Avoid turning the working calculator into a gimmick: quantities and instructions take precedence over decoration.

## 3. Main app layout

### Desktop
- **Top bar:** Hay’s Crust & Crumb logotype, `Recipes`, `Ratio Lab`, `Saved Variants`, `Settings` / `Backup`.
- **Hero area:** compact arcade-style branding strip with cheerful illustration/slogan; avoid dominating the screen above the calculator.
- **Recipe selector:** 8 tiles / category filter: `Sourdough`, `Poolish Pizza`, `Focaccia`, `Raisin Bread`, `Hot Cross Buns`, `Classic Croissants`, `Red Croissants`, `Risotto`.
- **Two-column main workbench:** left = scaling controls and editable targets (sticky within reason); right = ingredient output and stage cards.
- **Metrics strip:** show e.g. hydration, true dough weight, total flour, salt %, prefermented flour, balls/loaf count; show only applicable metrics.
- **Method timeline:** collapsible steps; temperature and time information; clear indication if the original source omitted method detail.
- **Print / save controls:** print-friendly ingredient sheet, save as variant, reset to original, export.

### Mobile (kitchen use is essential)
- Single column. Recipe picker at top; scaling controls visible without repeated scrolling; big +/- batch buttons and an accessible numeric input.
- Large **“Ingredients / Method / Ratios”** tabs. Stage-by-stage ingredients stay grouped.
- 44px+ tap targets, high contrast, no horizontal overflow, text still readable with wet hands / across the bench.
- Make the final ingredient quantities visually dominant and easy to scan.
- Sticky compact bottom bar with `Scale`, `Print`, and `Reset` if it improves usability; never obstruct ingredient rows.

### Suggested interaction details
- Selected scaling mode is obvious; invalid scale combinations produce clear validation, not silently conflicting outputs.
- Show both **original quantity** and **current scaled quantity** on demand.
- Show a discrete source status: `Original recipe`, `Calculated`, `Estimated conversion`, `Suggested setting`, or `Personal edit`.
- Adjust with controls or direct keyboard input; all recalculations should be instantaneous.
- Allow `Metric only` as default. Spoons and eggs can retain their original units, alongside optional gram equivalents.
- Print stylesheet: plain white background, black text, sections, dates/times and checkboxes; no expensive neon ink.

## 4. The recipe engine and data integrity (most important)

### Canonical model
- Use the **complete JSON in Part III** as a *seed* for a typed recipe model (for instance TypeScript types). It contains `recipes[]`, `ratio_basis`, `components[]`, original `amount` + `unit`, `weight_equivalent_g`, ratios, method, notes and derived fields.
- **Each ingredient belongs to one component**: poolish, main dough, laminating butter, red outer sheet, glaze/finishing, etc.
- `amount` and `unit` are canonical originals; computed ratio or estimated grams must **not** replace them.
- Preserve source metadata, statuses, notes and version IDs. Make user changes new variants or new versions; never silently edit the seed.
- Use data **roles** such as `flour`, `water`, `starter`, `milk`, `salt`, `oil`, `butter`, `yeast`, `fruit`, and `optional`. The role helps calculations but stage membership controls inclusion in totals.
- Do not use the displayed, rounded percent to reconstruct ingredient mass. **Scale exact original amounts**.
- Recommended additional fields for an implementation model: `measurementPrecision`, `conversionConfidence`, `editable`, `includeInDoughMass`, `formulaBasis`, `ingredientStage`, `yieldMode`, `sourceStatus`.

### Core formulas

**Universal scale:** `factor = desired_base_quantity / original_base_quantity`  
**Yield scale:** `factor = desired_servings / original_servings`  
**Recipe quantity:** `new_amount = original_amount * factor`  
**Baker's percent:** `100 * ingredient_weight_g / flour_basis_g`  
**Ordinary dough hydration:** `100 * water_g / flour_g` (water, **not** oil or butter)  
**Sourdough starter:** if hydration `h = water/flour` (e.g. 1.0 for 100%), `starter_flour = starter_mass/(1+h)` and `starter_water = starter_mass*h/(1+h)`  
**Sourdough effective hydration:** `100 * (added_water+starter_water)/(added_flour+starter_flour)`  
**Pizza overall hydration:** `100 * (poolish_water+main_water)/(poolish_flour+main_flour)`  
**Pizza poolish prepared mass:** sum of its four original ingredients; its final-dough incorporation is *a transfer, not another added ingredient mass*  
**Pizza ball count / target mass:** `required_batch_mass = number_of_balls * grams_per_ball`; `factor = required_batch_mass / 1751` for baseline formula  
**Risotto (practical mixed-unit ratio):** `rice_g : wine_ml : stock_ml = 1 : 0.3333 : 3.75`, with stock adjustable **3.5–4.25 mL/g**.

### Critical conventions and edge cases
1. **Preferments are never counted twice.** Poolish ingredients count toward total flour/water/mass; the label “all prepared poolish” in the final stage does **not** count as an additional 611g on top of them.
2. **Sourdough: two percentage views are valid and different.** The source table uses 520g *added flour* as 100%, yielding 71.15% added water and 21.15% starter. Effective total flour is 575g and effective hydration is **73.913%**. Label both explicitly; don't conflate them.
3. **Olive oil and butter are not water.** Focaccia water hydration is **62.5%**; pizza **70%**. Croissant 63.33% is a **milk+water liquid loading ratio**, not true water hydration.
4. **Eggs, oranges and teaspoons are count/volume units.** Preserve as given, and flag any gram conversion as estimated. For 1.5× buns, show 6 eggs, not rounded from an intermediate estimate; for 0.5×, show 2 eggs.
5. At fractional portions where an egg count would be e.g. 2.5, display **“2.5 eggs (beat and weigh half)”** with a *suggested* editable mass equivalent. Never round eggs silently.
6. **Focaccia oil** source is 200mL; optional estimate at density 0.91g/mL = 182g. Maintain mL in display. Do not include unmeasured topping/tray oil in exact dough mass.
7. **Hot cross buns:** 50g “extra flour” is working/extra flour in the source, separate from the 600g dough flour basis; the source does not include a complete crossing method or water for a cross paste. Do not invent one as original.
8. **Raisin bread** calls the fruit *sultanas*; do not rename them raisins as an ingredient just because of the recipe title.
9. **Croissants:** lamination butter = 300g **in addition to** 30g dough butter. For the red version, **add** the 50g-flour coloured sheet to the classic recipe, after three single folds. Keep original croissant percentages anchored to 600g main flour; show optional all-flour view if desired.
10. **Risotto percentages** are mixed grams vs millilitres and are *not baker's percentages*. Call them practical rice-based ratios; reserve stock may be needed.
11. **Yeast timing:** The pizza poster contains 6g dry yeast and no actual proof time. Warn about long warm poolish fermentation at this yeast load if users enable a timeline, but do not change the canonical recipe automatically.
12. Never report a dough mass as exact when unmeasured ingredients or density estimates affect it; use **“approx.”** with an explanation. For recipes with missing weights, disable exact mass scaling or label it clearly as estimated.
13. All calculation logic should be pure, unit-tested functions; keep display rounding separate from arithmetic. Reject zero/negative/NaN quantities with an informative message.

### Rounding and display
- Calculation precision: retain full floating-point precision internally, or use decimal arithmetic where needed.
- Display grams: whole grams by default for large masses; 0.1g for yeast/spices or scaled sub-10g amounts. Keep a precision switch for advanced use.
- Display volumes: mL for water, milk, olive oil, stock, wine. Original spoon/count units remain available.
- Show percentages to 1–2 decimal places; do not calculate from those rounded displays.
- Display rising/proofing time ranges and target temperatures as **guidance**, not as computer-derived predictions from dough quantity.

## 5. Recipe-specific tools and screens

| Recipe | Specific UI / computation requirements |
|---|---|
| Sourdough | Starter % and hydration breakdown; added-flour vs effective-flour toggle; 1/2/3 loaves; dough weight. Optional *separate* starter feeding calculator in a future iteration. |
| Poolish Pizza | Poolish and main dough stages; poolish actual mass; six-ball suggestion; ball count/weight planning; hydration, salt %, pre-fermented flour. |
| Focaccia | Pan/tray quantity and target dimensions as optional future feature; quantity in mL for dough oil; extra pan/topping oil as independent editable field. |
| Raisin Bread | Tin loaf scaling, source 82% nominal hydration and fruit ratio, cinnamon preserved as tablespoons. |
| Hot Cross Buns | 12-bun baseline, count-aware eggs and oranges, 600g main flour vs 50g extra flour, fruit total, apricot glaze separate; method flagged incomplete. |
| Classic Croissants | 14–16 as estimated yield; detachable **300g butter block**, mix temperature, lamination temperatures, 3 folds, proof and bake cards. |
| Red Croissants | Toggle inherited from classic; 106.5g default red sheet including 1.5g colour; extra 50g flour; red layer 0.8–1mm. |
| Risotto | Rice-based calculator by people; 80g rice/person main course or 60g for side as selectable presets; default 0.333mL wine and 3.75mL stock per gram of rice; adjustable stock range. |

## 6. Build approach and deliverables for the agent

Use the repository's existing framework if present. If starting from nothing, **React + TypeScript + Vite or Next.js** is a sensible small-web-app choice. Use an isolated `recipe-engine` module with pure functions and a small `seed-recipes` dataset produced from the JSON in **this same Markdown file**. No dependency on a separate recipe file at the handoff stage.

**Suggested modules:** `recipeData`, `normalizeUnits`, `scaleRecipe`, `calculateNutritionFreeRatios` (no nutrition claims), `calculateDoughMass`, `calculateEffectiveHydration`, `calculatePreferment`, `createVariant`, `exportImport`, `printRecipe`. Include `tests/` for exact deterministic calculations.

**Storage:** start with `localStorage` or IndexedDB; include a versioned migration for user-owned edits; JSON export and import and a simple reset-to-original flow. A PWA/offline mode is desirable but secondary.

**Performance / accessibility:** no mandatory remote requests at runtime, keyboard accessible controls, focus rings, semantic tables, appropriate contrast, validation messaging, mobile and tablet testing, reduced-motion support and robust number parsing (decimal comma if practical).

**Implementation order:**
1. Parse or manually transfer **Part III**'s fenced JSON into app seed data; validate its schema.
2. Build pure calculation functions and write the acceptance tests below **before** polishing visuals.
3. Build recipe selection, scale controls, output ingredient tables and per-stage views.
4. Implement pizza ball planner, sourdough effective hydration and red-croissant variant.
5. Add design system, source-status indicators, print layout, local saving and export/import.
6. Verify on narrow mobile screens and with keyboard-only use.

## 7. Required calculations and acceptance tests

| Test | Required result |
|---|---|
| Sourdough 1 loaf | 520g added flour, 370g added water, 110g 100%-hydration starter, 12g salt; 1,012g dough; 575g effective flour, 425g effective water, **73.913%** true hydration. |
| Sourdough 2 loaves | 1,040g flour, 740g water, 220g starter, 24g salt; **2,024g** dough. |
| Pizza 1 batch poolish | 300g flour + 300mL water + 6g yeast + 5g malt = **611g poolish**. |
| Pizza 1 batch dough | 611g poolish + 700g flour + 400mL water + **30g salt + 10g oil** = **1,751g**, 1,000g total flour, 700g water, 70% hydration. |
| Pizza 2 batches | **3,502g** final dough, 1,222g poolish, 60g salt, 20g olive oil. |
| Pizza balls | 6 equal balls from 1 batch = **291.83g** each before rounding; don't lose dough through rounding. |
| Focaccia | 1,200g flour, 750mL water → **62.5%** water hydration; 200mL oil is tracked separately. |
| Raisin bread | 500g flour, 410mL water → **82%** nominal hydration; 110g sultanas = **22%** of flour. |
| Hot cross buns | 600g dough flour, 150g raisins + 60g currants = **210g dried fruit = 35%** of flour. |
| Classic croissants | 600g flour; 300g laminating butter (**50%**) + 30g dough butter; baseline summed ingredient mass **1,421g** (excluding egg wash, not specified). |
| Red croissants | Same base plus 50+10+1+40+4+1.5 = **106.5g sheet**, total formula mass **1,527.5g**; red sheet flour is extra. |
| Risotto 3 main-course portions | 240g dry rice, 80mL wine, **900mL planned stock**, before to-taste seasonings. |
| Risotto 5 main-course portions | 400g dry rice, approximately 133.3mL wine, 1,500mL planned stock. |
| Reset / personal variant | After editing and resetting, the immutable original ingredient values exactly match the seed data. |

**Completion criterion:** a person can open the website on a phone, choose a recipe, scale by a target, see all updated quantities by stage, understand the ratio basis, print the result, and save a personal variation — without manual arithmetic or any account setup.

## 8. Source fidelity and known limitations

- **Sourdough:** formula is supplied; no complete original method is included.
- **Poolish pizza:** full ingredient quantities come from the most recently supplied poster (authoritative). Labels such as ≈600g poolish and ≈1,700g dough are rounded poster display values; the exact arithmetic is **611g** and **1,751g**. Proofing and bake method were not provided.
- **Focaccia and raisin bread:** transcribed from the provided DOCX recipes, including original units, quantities, and methods.
- **Hot cross buns:** ingredients and 30-minute cook-time indicator from the one-page PDF; full crossing/baking process not visible in that source.
- **Croissants:** proposed formulation from the recent discussion, for practical trial baking — **not a previously supplied independently documented household recipe**. All timing and temperatures are technique guidance requiring real-world adjustment.
- **Risotto:** a proposed repeatable house-standard ratio, not a transcribed existing personal recipe.
- **No nutrition calculations, yeast fermentation predictions or guaranteed bake yields** are implied by the current dataset.

---

# Part II — Complete recipe ratios and process reference

The original quantities are preserved in their source units. A `ratio_percent` is calculated metadata and must never overwrite a source quantity. The **embedded JSON in Part III of this same document** is the machine-readable source of truth; do not require or request a separate JSON file.
## Application rules
1. Let the user scale by multiplier, number of servings/items, base flour (or dry rice), or target dough mass **only** when the ingredient weights are adequately known.
2. Show preferment stages separately (poolish and final dough). Count each gram of flour and water once.
3. For sourdough, account for flour/water in the starter to display actual hydration.
4. Keep liquid hydration separate from fat percentage. Olive oil does not count as water.
5. Record variant ingredients separately rather than merging the red croissant layer into the main dough.
6. Keep to-taste toppings, glaze, working flour and optional ingredients separate.
7. When scaling teaspoons/tablespoons/eggs/oranges, show fractional original units and optional mass estimates.
8. Preserve recipe versions so edits do not overwrite the original baseline.
## The recipe formulas
### Classic Sourdough
**Source:** User’s original formula. **Ratio basis:** 520 g_flour — main dough flour.
**Main dough**

| Ingredient | Base quantity | Ratio % |
|---|---:|---:|
| Bread flour | 520 g | 100.00% |
| Water | 370 g | 71.15% |
| 100% hydration sourdough starter | 110 g | 21.15% |
| Salt | 12 g | 2.31% |

**Calculated context:** added_flour_g: 520; starter_hydration_percent: 100; starter_flour_g: 55; starter_water_g: 55; effective_total_flour_g: 575; effective_total_water_g: 425; effective_hydration_percent: 73.913; prefermented_flour_percent: 9.5652.
**Important notes:** Baker percentages shown against 520g added flour; starter flour is not part of this displayed percentage denominator. For true hydration, include starter-derived water and flour. No original method was supplied in this request.

### Classic Poolish Pizza
**Source:** User-provided full pizza recipe poster (28 Oct 2026), superseding the incomplete earlier formula. **Ratio basis:** 1,000g total flour (300g poolish + 700g final dough).

**Poolish — use all of this when mixing the main dough**

| Ingredient | 1 batch | 2 batches | Baker’s % (total flour) |
|---|---:|---:|---:|
| Bread / pizza flour | 300g | 600g | 30% |
| Water | 300mL | 600mL | 30% |
| Dry yeast | 6g | 12g | 0.6% |
| Barley malt | 5g | 10g | 0.5% |
| **Poolish actual mass** | **611g** | **1,222g** | — |

**Main dough — additions to all the poolish above**

| Ingredient | 1 batch | 2 batches | Baker’s % (total flour) |
|---|---:|---:|---:|
| Poolish, all of above | 611g | 1,222g | do not count twice |
| Bread / pizza flour | 700g | 1,400g | 70% |
| Water | 400mL | 800mL | 40% |
| Salt | **30g** | **60g** | **3%** |
| Olive oil | **10g** | **20g** | **1%** |
| **Actual total final dough mass** | **1,751g** | **3,502g** | — |

**Calculated context:** Total flour 1,000g, total water 700g, overall hydration 70%, 30% of flour prefermented, 100% poolish hydration, 3% salt, 1% olive oil, 0.6% dry yeast, 0.5% barley malt. Dividing into 6 pizza balls yields about 292g each.

**Important source detail:** The graphic gives rounded labels “poolish ≈600g”, “final dough ≈1,700g”, and “2 batches ≈3,400g”. These rounded values are not the precise sums of the ingredient quantities. The poolish actually weighs **611g** (including yeast and malt) and should all be incorporated. This produces **1,751g** dough, or **3,502g** doubled. Do not subtract 11g of poolish to force a 600g weight. The previously used 30g oil and an optional 25g salt were based on an incomplete version and should NOT be used as the original formula.

**Process / method notes:**
1. Mix the poolish from the poolish-stage ingredients.
2. Add *all* poolish to the final flour, water, salt and olive oil.
3. The supplied poster does not specify fermentation duration, resting time or baking settings. Make those independently configurable if the website includes a method/timeline.

### Ben’s Focaccia
**Source:** Attached focaccia DOCX. **Ratio basis:** 1200 g_flour — main dough flour.
**Focaccia dough**

| Ingredient | Base quantity | Ratio % |
|---|---:|---:|
| High-protein bread flour | 1200 g | 100.00% |
| Warm water | 750 ml | 62.50% ≈ |
| Olive oil | 200 ml | 15.17% ≈ |
| Kosher salt | 24 g | 2.00% |
| Instant dry yeast | 14 g | 1.17% |

**Finishing and toppings**

| Ingredient | Base quantity | Ratio % |
|---|---:|---:|
| Strong flake salt | to_taste | — |
| Desired toppings | to_taste | — |
| Extra oil for the tray, topping and finishing | to_taste | — |

**Calculated context:** water_hydration_percent: 62.5; olive_oil_percent_estimated_by_mass: 15.1667; fan_oven_c: 220; bake_minutes: [25, 30].
**Important notes:** Source calls this a high hydration dough, but WATER hydration is exactly 62.5%. Olive oil is not water and should be counted separately. The 200ml dough oil is separate from additional tray/finishing oil. Topping ideas: balsamic-roasted cherry tomatoes/olives/rosemary; pesto/bocconcini; rosemary.
**Process / method notes:**
1. Mix warm water and yeast; rest about 10 minutes until foamy.
2. Mix flour and kosher salt. Stir olive oil into the yeast-water mixture and add to the flour; mix until incorporated.
3. Rest covered for 30 minutes.
4. Stretch and fold the dough, then rest for 30 minutes. Repeat until four stretch-and-fold sessions have been completed, with 30-minute rests.
5. Optionally refrigerate the dough for 24 hours after folding.
6. Move dough to a generously oiled large tray; stretch gently to the corners, resting 5 minutes if it resists.
7. Proof in the tray 30 minutes; meanwhile preheat fan oven to 220°C.
8. Oil, dimple, top with desired ingredients and flake salt.
9. Bake fan 220°C for 25–30 minutes until golden; oil lightly and rest 10–15 minutes.

### Ben’s Raisin Bread
**Source:** Attached raisin bread DOCX. **Ratio basis:** 500 g_flour — main dough flour.
**Raisin dough**

| Ingredient | Base quantity | Ratio % |
|---|---:|---:|
| Bread flour | 500 g | 100.00% |
| Water | 410 ml | 82.00% ≈ |
| Sultanas | 110 g | 22.00% |
| Malt extract | 40 g | 8.00% |
| Yeast | 5 g | 1.00% |
| Salt | 8 g | 1.60% |
| Ground cinnamon | 2 tbsp | 3.12% ≈ |
| Orange zest | 1 orange | — |

**Calculated context:** nominal_hydration_percent: 82; bake_c: 220; bake_minutes: 45; tin_loaves: 1.
**Important notes:** Source uses sultanas, despite the name raisin bread. 82% is nominal water-to-flour hydration; sultanas absorb some water. Cinnamon density is approximate; preserve the source’s 2-tablespoon quantity as the editable canonical measurement.
**Process / method notes:**
1. Grease a lidded bread loaf tin.
2. Combine water, malt, yeast, salt, orange zest and sultanas; let stand 10 minutes.
3. Combine flour and cinnamon separately, then mix wet and dry ingredients to a shaggy dough; rest 10 minutes.
4. Slap-and-fold dough, return to proofing chamber for 30 minutes.
5. Laminate dough by hand, roll into a log seam-down and place into tin; proof covered 2–3 hours.
6. Remove the tin lid before dough reaches the top and allow dough to rise to the rim.
7. Bake at 220°C for 45 minutes; cool on a rack at least 1 hour before slicing.

### Hot Cross Buns
**Source:** Attached hot cross buns PDF. **Ratio basis:** 600 g_flour — main dough flour.
**Bun dough**

| Ingredient | Base quantity | Ratio % |
|---|---:|---:|
| Plain flour | 600 g | 100.00% |
| Raisins | 150 g | 25.00% |
| Zest and juice | 1 large_orange | — |
| Lukewarm milk | 125 ml | 20.83% ≈ |
| Dried yeast | 7 g | 1.17% |
| Caster sugar | 75 g | 12.50% |
| Fine sea salt | 1 tsp | 0.83% ≈ |
| Ground cinnamon | 2 tsp | 0.87% ≈ |
| Ground allspice | 0.5 tsp | 0.17% ≈ |
| Ground ginger | 0.5 tsp | 0.15% ≈ |
| Ground nutmeg | 0.25 tsp | 0.09% ≈ |
| Vanilla extract | 1 tsp | 0.83% ≈ |
| Eggs, beaten | 4 egg | 33.33% ≈ |
| Butter, diced, room temperature | 175 g | 29.17% |
| Currants | 60 g | 10.00% |

**Working flour and glaze**

| Ingredient | Base quantity | Ratio % |
|---|---:|---:|
| Extra plain flour | 50 g | 8.33% |
| Apricot jam | 2 tbsp | 6.67% ≈ |

**Calculated context:** bun_count: 12; fruit_total_g: 210; fruit_to_flour_percent: 35; butter_to_flour_percent: 29.1667; sugar_to_flour_percent: 12.5.
**Important notes:** Original recipe says 600g plain flour plus 50g extra; 600g is the dough baker-percentage basis. Oranges and eggs supply variable water; avoid reporting hydration from milk alone as overall hydration. Keep apricot jam outside the dough in a finishing component; extra flour outside the fixed dough formula. The conversion weights for spices, eggs, milk and jam are estimates and should be editable in the app.
**Process / method notes:**
1. The attached one-page PDF contains ingredient quantities and a visible “Cook time: 30 mins” line only.
2. Full proofing, shaping and crossing instructions are not present in the source; do not claim an exact original method.

### Classic Butter Croissants
**Source:** Croissant recipe discussed 27 Oct. **Ratio basis:** 600 g_flour — main dough flour.
**Main croissant dough (détrempe)**

| Ingredient | Base quantity | Ratio % |
|---|---:|---:|
| Strong plain / bread flour | 600 g | 100.00% |
| Sugar | 90 g | 15.00% |
| Cold milk | 280 g | 46.67% |
| Cold water | 100 g | 16.67% |
| Salt | 12 g | 2.00% |
| Instant yeast | 9 g | 1.50% |
| Softened butter, in dough | 30 g | 5.00% |

**Butter block for lamination**

| Ingredient | Base quantity | Ratio % |
|---|---:|---:|
| Unsalted butter for butter block | 300 g | 50.00% |

**Calculated context:** nominal_milk_plus_water_percent: 63.3333; lamination_butter_percent: 50; butter_in_dough_percent: 5; mix_target_dough_temp_c: [20, 23]; butter_block_temp_c: [12, 16]; proof_c: [24, 25]; proof_hours: [2, 3]; bake_fan_c: 190; bake_minutes: [16, 21].
**Important notes:** Milk plus water is 380g / 600g = 63.33% nominal liquid, not literal water hydration because milk includes solids. The lamination butter block is separate from the 30g butter mixed into the dough. Base formula produces 14–16 medium croissants according to the previous recipe.
**Process / method notes:**
1. Use the Ooni Halo Pro spiral mixer: approximately 3 minutes at 20–25% speed then 4–6 minutes at 30–40% speed; target dough temperature 20–23°C.
2. Chill dough overnight, approximately 8–12 hours at 2–5°C.
3. Prepare butter block at approximately 12–16°C; enclose in chilled dough.
4. Perform 3 single folds, chilling dough 30–45 minutes between folds.
5. Roll to 4–4.5mm final thickness and cut/shape the croissants.
6. Proof at 24–25°C for about 2–3 hours until noticeably puffy and gently wobbly; avoid overheating the lamination butter.
7. Bake in a preheated fan oven at about 190°C for 16–21 minutes until deeply golden; adjust to oven and size.

### Bright-Red Layer Croissants
**Source:** Red-sheet croissant variation discussed 27 Oct. **Ratio basis:** 600 g_flour — main croissant dough flour; red sheet is additional.
**Main croissant dough (détrempe)**

| Ingredient | Base quantity | Ratio % |
|---|---:|---:|
| Strong plain / bread flour | 600 g | 100.00% |
| Sugar | 90 g | 15.00% |
| Cold milk | 280 g | 46.67% |
| Cold water | 100 g | 16.67% |
| Salt | 12 g | 2.00% |
| Instant yeast | 9 g | 1.50% |
| Softened butter, in dough | 30 g | 5.00% |

**Butter block for lamination**

| Ingredient | Base quantity | Ratio % |
|---|---:|---:|
| Unsalted butter for butter block | 300 g | 50.00% |

**Additional bright-red outer pastry sheet**

| Ingredient | Base quantity | Ratio % |
|---|---:|---:|
| Flour | 50 g | 8.33% |
| Sugar | 10 g | 1.67% |
| Salt | 1 g | 0.17% |
| Cold water | 40 g | 6.67% |
| Butter | 4 g | 0.67% |
| Concentrated red food colouring | 1.5 g | 0.25% |

**Calculated context:** total_flour_including_red_sheet_g: 650; main_dough_flour_g: 600; extra_red_flour_g: 50; red_sheet_thickness_mm: [0.8, 1.0]; nominal_milk_plus_water_percent_main_dough: 63.3333.
**Important notes:** Shares all classic croissant ingredients and adds the separate red pastry sheet. Do not colour the main dough. Ratios in this variant use 600g main dough flour as denominator; the 50g red-sheet flour is ADDITIONAL. Total actual flour is 650g. Add red sheet only after the three folds, before final sheet-out. 0.8–1mm red outer layer. Red colourant quantity 1–2g concentrated colour; default 1.5g for scaling.
**Process / method notes:**
1. Use the Ooni Halo Pro spiral mixer: approximately 3 minutes at 20–25% speed then 4–6 minutes at 30–40% speed; target dough temperature 20–23°C.
2. Chill dough overnight, approximately 8–12 hours at 2–5°C.
3. Prepare butter block at approximately 12–16°C; enclose in chilled dough.
4. Perform 3 single folds, chilling dough 30–45 minutes between folds.
5. After the three single folds, prepare a bright-red dough sheet, roll thinly to about 0.8–1mm and lay over the laminated dough before the final rollout and cutting. Keep cool while working.
6. Roll to 4–4.5mm final thickness and cut/shape the croissants.
7. Proof at 24–25°C for about 2–3 hours until noticeably puffy and gently wobbly; avoid overheating the lamination butter.
8. Bake in a preheated fan oven at about 190°C for 16–21 minutes until deeply golden; adjust to oven and size.

### Standard Risotto
**Source:** Newly proposed standard formula. **Ratio basis:** 240 g_rice — dry rice weight; wine and stock ml are compared numerically to rice grams.
**Risotto ingredients**

| Ingredient | Base quantity | Ratio % |
|---|---:|---:|
| Arborio or Carnaroli rice (dry) | 240 g | 100.00% |
| Dry white wine | 80 ml | 33.33% ≈ |
| Hot stock | 900 ml | 375.00% ≈ |
| Finely diced onion or shallot | 60 g | 25.00% |
| Butter for finishing | 30 g | 12.50% |
| Finely grated Parmesan | 45 g | 18.75% |
| Olive oil for cooking | 15 ml | 5.69% ≈ |
| Salt and pepper | to_taste | — |

**Calculated context:** rice_to_wine_to_stock_practical_ratio: [1, 0.3333, 3.75]; stock_ml_per_g_rice_range: [3.5, 4.25].
**Important notes:** Standard planning ratio: 1 part dry rice by weight : 0.333 part wine by volume : 3.75 parts stock by volume. Recommended variable stock range: 3.5–4.25mL per 1g dry rice (840–1,020mL at 240g rice), add as needed. Use 80g dry rice per adult for a main-course portion; 60g as a lighter or side portion. Ratios are RICE-based practical ratios, not flour-based baker percentages.
**Process / method notes:**
1. Sweat finely diced onion or shallot in olive oil without browning.
2. Add dry rice and toast briefly, stirring until coated.
3. Add wine and reduce, then add hot stock gradually while stirring intermittently.
4. Cook until rice is al dente and loose enough to flow; stock addition and timing depend on rice.
5. Off the heat, stir in butter and Parmesan. Adjust consistency with reserved hot stock; season to taste.

## Validations to include in the website
- **Sourdough:** 520g added flour + 110g starter at 100% hydration = 575g total flour, 425g total water, 73.91% hydration, 1,012g dough.
- **Poolish pizza (corrected from full poster):** 300+700=1,000g flour; 300+400=700g water; 70% hydration; 30g salt (3%); 10g olive oil (1%); 611g poolish; 1,751g total finished dough; 3,502g doubled. No optional salt addition.
- **Focaccia:** 750/1,200=62.5% water hydration. The 200ml oil (~182g) is approximately 15.17% fat, **not** additional hydration.
- **Raisin:** 410/500=82% nominal water; 110/500=22% sultanas.
- **Hot cross buns:** 600g base flour; 150g raisins + 60g currants = 35% dried fruit; butter 29.17%; sugar 12.5%; full dough hydration unquantified because orange juice and egg water are not specified by mass.
- **Croissants:** 600g flour and 300g laminating butter = 50% butter block. 30g softened butter belongs to the main dough, never the butter block. Red version has 50g additional flour and a red 0.8–1mm sheet added after folds.
- **Risotto:** for 3, 240g rice + 80ml wine + 900ml stock => ratio 1:0.333:3.75 (rice grams : wine ml : stock ml).
---

# Part III — Embedded machine-readable recipe dataset (authoritative seed)

This JSON is **complete and self-contained**. The website agent should extract the following fenced block from **this very Markdown file** into its app as seed data. It is identical in content to the previously prepared revised recipe dataset, including the corrected pizza ingredients. A separate file is **not** needed to understand or use it. Original quantities have priority over numerical ratio estimates.

```json
{
  "schema_version": "1.0.0",
  "library_title": "Hay’s Crust & Crumb — Recipe Ratio Library",
  "generated_on": "2026-10-28",
  "calculation_conventions": {
    "ratio_percent_formula": "For recipe ingredient gram-equivalent: 100 × ingredient grams equivalent / recipe.ratio_basis.amount. For rice recipe, this is a practical g-vs-ml ratio, not baker percentage.",
    "display_bakers_percent_only_for_flour_recipes": true,
    "canonical_quantity": "The ingredient.amount and ingredient.unit reproduce the supplied recipe where applicable. Estimates for converted spoons, eggs and volume are annotated and must not overwrite original quantities.",
    "scaling": "scale_factor = target_yield / recipe.yield.count (for exact count). For flour/rice targeting, scale_factor = target_basis_amount / recipe.ratio_basis.amount. Multiply each numeric ingredient amount by scale_factor. Preserve unit, stage and role.",
    "dough_mass": "Only include measured, weighted ingredients from components with include_in_dough_mass=true; exclude toppings, glaze, optional working flour and to-taste entries. Use volume-to-weight conversions only as approximate and warn when unquantified ingredients make totals incomplete.",
    "sourdough_hydration": "If starter hydration is H (decimal), starter flour = starter grams / (1+H); starter water = starter grams × H/(1+H). Effective hydration = (added water + starter water)/(added flour + starter flour) × 100.",
    "pizza_poolish": "Keep ingredients separated into poolish and final additions. Calculate overall hydration using both flour stages and both water stages; never add water or flour twice. Treat the poster’s “600g poolish” as a rounded stage label; the 611g prepared poolish (including yeast and malt) is all used in the final dough.",
    "red_croissant": "Default croissant recipe has two butter entries: dough butter and laminate butter. Red variant is additive and has its own 50g-flour red sheet. Do not include that flour in the denominator of the main-dough percentages, unless switching deliberately to a whole-formula view.",
    "risotto": "Rice, wine and stock use practical g:ml:ml ratios. Stock is a range-sensitive liquid, not a fixed dough hydration.",
    "rounding": "Calculate from unrounded numbers. Present flour, water and fat to nearest gram; yeast and spices to at least 0.1g at small scales; percentage displays to one or two decimals.",
    "integer_ingredient_handling": "For eggs and oranges, preserve fractional scaling and offer weighed equivalents rather than silently rounding egg counts or orange yields.",
    "optional_ingredients": "Do not enable optional fillings unless the user selects them. Salt in the pizza recipe is a BASE ingredient (30g), not an optional addition. Do not silently change the original recipes."
  },
  "recipes": [
    {
      "id": "classic_sourdough",
      "name": "Classic Sourdough",
      "category": "sourdough",
      "source": "user-provided recipe, 24 Oct 2026",
      "ratio_basis": {
        "amount": 520,
        "unit": "g_flour",
        "label": "main dough flour"
      },
      "yield": {
        "count": 1,
        "unit": "loaf",
        "base_dough_mass_g": 1012
      },
      "components": [
        {
          "id": "dough",
          "label": "Main dough",
          "include_in_dough_mass": true,
          "ingredients": [
            {
              "id": "bread_flour",
              "name": "Bread flour",
              "amount": 520,
              "unit": "g",
              "role": "flour",
              "weight_equivalent_g": 520,
              "ratio_percent": 100.0
            },
            {
              "id": "water",
              "name": "Water",
              "amount": 370,
              "unit": "g",
              "role": "water",
              "weight_equivalent_g": 370,
              "ratio_percent": 71.1538
            },
            {
              "id": "starter",
              "name": "100% hydration sourdough starter",
              "amount": 110,
              "unit": "g",
              "role": "starter",
              "weight_equivalent_g": 110,
              "note": "Contains 55 g flour and 55 g water at original scale; do not double-count starter in dough mass.",
              "ratio_percent": 21.1538
            },
            {
              "id": "salt",
              "name": "Salt",
              "amount": 12,
              "unit": "g",
              "role": "salt",
              "weight_equivalent_g": 12,
              "ratio_percent": 2.3077
            }
          ]
        }
      ],
      "method": [],
      "notes": [
        "Baker percentages shown against 520g added flour; starter flour is not part of this displayed percentage denominator.",
        "For true hydration, include starter-derived water and flour.",
        "No original method was supplied in this request."
      ],
      "derived": {
        "added_flour_g": 520,
        "starter_hydration_percent": 100,
        "starter_flour_g": 55,
        "starter_water_g": 55,
        "effective_total_flour_g": 575,
        "effective_total_water_g": 425,
        "effective_hydration_percent": 73.913,
        "prefermented_flour_percent": 9.5652
      }
    },
    {
      "id": "poolish_pizza",
      "name": "Classic Poolish Pizza",
      "category": "pizza",
      "source": "user-provided complete Hay’s Classic Poolish Pizza poster, 28 Oct 2026; supersedes incomplete earlier formula",
      "ratio_basis": {
        "amount": 1000,
        "unit": "g_flour",
        "label": "combined flour (poolish + final additions)"
      },
      "yield": {
        "count": 1,
        "unit": "batch",
        "base_dough_mass_g": 1751,
        "suggested_pizza_balls": 6,
        "approx_weight_per_ball_g_at_suggested_count": 291.83
      },
      "components": [
        {
          "id": "poolish",
          "label": "Poolish",
          "include_in_dough_mass": true,
          "ingredients": [
            {
              "id": "poolish_flour",
              "name": "Bread or pizza flour",
              "amount": 300,
              "unit": "g",
              "role": "flour",
              "weight_equivalent_g": 300,
              "ratio_percent": 30.0
            },
            {
              "id": "poolish_water",
              "name": "Water",
              "amount": 300,
              "unit": "g",
              "role": "water",
              "weight_equivalent_g": 300,
              "ratio_percent": 30.0
            },
            {
              "id": "poolish_yeast",
              "name": "Dry yeast",
              "amount": 6,
              "unit": "g",
              "role": "yeast",
              "weight_equivalent_g": 6,
              "ratio_percent": 0.6
            },
            {
              "id": "malt",
              "name": "Barley malt",
              "amount": 5,
              "unit": "g",
              "role": "malt",
              "weight_equivalent_g": 5,
              "ratio_percent": 0.5,
              "source_label": "MALT BARLEY"
            }
          ]
        },
        {
          "id": "final_dough",
          "label": "Final mix additions",
          "include_in_dough_mass": true,
          "ingredients": [
            {
              "id": "final_flour",
              "name": "Bread or pizza flour",
              "amount": 700,
              "unit": "g",
              "role": "flour",
              "weight_equivalent_g": 700,
              "ratio_percent": 70.0
            },
            {
              "id": "final_water",
              "name": "Water",
              "amount": 400,
              "unit": "g",
              "role": "water",
              "weight_equivalent_g": 400,
              "ratio_percent": 40.0
            },
            {
              "id": "salt",
              "name": "Salt",
              "amount": 30,
              "unit": "g",
              "role": "salt",
              "weight_equivalent_g": 30,
              "ratio_percent": 3.0
            },
            {
              "id": "olive_oil",
              "name": "Olive oil",
              "amount": 10,
              "unit": "g",
              "role": "fat",
              "weight_equivalent_g": 10,
              "ratio_percent": 1.0
            }
          ]
        }
      ],
      "method": [
        "Combine poolish-stage ingredients; use all of the prepared poolish in the main dough.",
        "Add remaining flour, water, salt and olive oil to the poolish to form the final dough.",
        "The poster lists quantities only; it does not prescribe a timed fermentation or baking schedule."
      ],
      "notes": [
        "This 28 Oct 2026 image is the authoritative complete pizza formula: final dough salt 30g (3%) and olive oil 10g (1%). Supersedes prior inferred olive oil 30g and omitted salt.",
        "Poolish is described as about 600g on the poster but actual measured poolish mass is 611g (300 flour + 300 water + 6 yeast + 5 malt). Use all of the poolish rather than weighing out precisely 600g.",
        "The poster rounds one finished batch to about 1,700g and two batches to about 3,400g. Exact ingredient totals are 1,751g and 3,502g. Use calculated totals when sizing pizza balls.",
        "6g dry yeast represents 2% of the flour in the poolish; for long fermentation, support independent yeast editing while keeping the original value as default.",
        "30% of total flour is prefermented, at 100% poolish hydration."
      ],
      "derived": {
        "total_flour_g": 1000,
        "total_water_g": 700,
        "hydration_percent": 70,
        "poolish_flour_fraction_percent": 30,
        "poolish_hydration_percent": 100,
        "poolish_total_mass_g": 611,
        "main_additions_mass_g": 1140,
        "dough_mass_g": 1751,
        "salt_percent": 3,
        "oil_percent": 1,
        "six_ball_weight_g": 291.8333333333333
      }
    },
    {
      "id": "bens_focaccia",
      "name": "Ben’s Focaccia",
      "category": "focaccia",
      "source": "attached Ben’s Focaccia Recipe.docx",
      "ratio_basis": {
        "amount": 1200,
        "unit": "g_flour",
        "label": "main dough flour"
      },
      "yield": {
        "count": 1,
        "unit": "large roasting tray",
        "estimated_dough_mass_g_excluding_finishing": 2170
      },
      "components": [
        {
          "id": "dough",
          "label": "Focaccia dough",
          "include_in_dough_mass": true,
          "ingredients": [
            {
              "id": "bread_flour",
              "name": "High-protein bread flour",
              "amount": 1200,
              "unit": "g",
              "role": "flour",
              "weight_equivalent_g": 1200,
              "ratio_percent": 100.0
            },
            {
              "id": "water",
              "name": "Warm water",
              "amount": 750,
              "unit": "ml",
              "role": "water",
              "weight_equivalent_g": 750,
              "weight_equivalent_is_approximate": true,
              "ratio_percent": 62.5
            },
            {
              "id": "olive_oil",
              "name": "Olive oil",
              "amount": 200,
              "unit": "ml",
              "role": "fat",
              "weight_equivalent_g": 182.0,
              "weight_equivalent_is_approximate": true,
              "note": "Original volume preserved. Assumed 0.91g/ml only for ratio and dough-weight estimation.",
              "ratio_percent": 15.1667
            },
            {
              "id": "salt",
              "name": "Kosher salt",
              "amount": 24,
              "unit": "g",
              "role": "salt",
              "weight_equivalent_g": 24,
              "ratio_percent": 2.0
            },
            {
              "id": "instant_yeast",
              "name": "Instant dry yeast",
              "amount": 14,
              "unit": "g",
              "role": "yeast",
              "weight_equivalent_g": 14,
              "ratio_percent": 1.1667
            }
          ]
        },
        {
          "id": "finishing",
          "label": "Finishing and toppings",
          "include_in_dough_mass": false,
          "ingredients": [
            {
              "id": "flake_salt",
              "name": "Strong flake salt",
              "amount": null,
              "unit": "to_taste",
              "exclude_from_dough_mass": true
            },
            {
              "id": "optional_toppings",
              "name": "Desired toppings",
              "amount": null,
              "unit": "to_taste",
              "exclude_from_dough_mass": true
            },
            {
              "id": "extra_oil",
              "name": "Extra oil for the tray, topping and finishing",
              "amount": null,
              "unit": "to_taste",
              "exclude_from_dough_mass": true
            }
          ]
        }
      ],
      "method": [
        "Mix warm water and yeast; rest about 10 minutes until foamy.",
        "Mix flour and kosher salt. Stir olive oil into the yeast-water mixture and add to the flour; mix until incorporated.",
        "Rest covered for 30 minutes.",
        "Stretch and fold the dough, then rest for 30 minutes. Repeat until four stretch-and-fold sessions have been completed, with 30-minute rests.",
        "Optionally refrigerate the dough for 24 hours after folding.",
        "Move dough to a generously oiled large tray; stretch gently to the corners, resting 5 minutes if it resists.",
        "Proof in the tray 30 minutes; meanwhile preheat fan oven to 220°C.",
        "Oil, dimple, top with desired ingredients and flake salt.",
        "Bake fan 220°C for 25–30 minutes until golden; oil lightly and rest 10–15 minutes."
      ],
      "notes": [
        "Source calls this a high hydration dough, but WATER hydration is exactly 62.5%. Olive oil is not water and should be counted separately.",
        "The 200ml dough oil is separate from additional tray/finishing oil.",
        "Topping ideas: balsamic-roasted cherry tomatoes/olives/rosemary; pesto/bocconcini; rosemary."
      ],
      "derived": {
        "water_hydration_percent": 62.5,
        "olive_oil_percent_estimated_by_mass": 15.1667,
        "fan_oven_c": 220,
        "bake_minutes": [
          25,
          30
        ]
      }
    },
    {
      "id": "bens_raisin_bread",
      "name": "Ben’s Raisin Bread",
      "category": "enriched_bread",
      "source": "attached Ben's Raisin Bread Recipe(1).docx",
      "ratio_basis": {
        "amount": 500,
        "unit": "g_flour",
        "label": "main dough flour"
      },
      "yield": {
        "count": 1,
        "unit": "tin loaf"
      },
      "components": [
        {
          "id": "dough",
          "label": "Raisin dough",
          "include_in_dough_mass": true,
          "ingredients": [
            {
              "id": "bread_flour",
              "name": "Bread flour",
              "amount": 500,
              "unit": "g",
              "role": "flour",
              "weight_equivalent_g": 500,
              "ratio_percent": 100.0
            },
            {
              "id": "water",
              "name": "Water",
              "amount": 410,
              "unit": "ml",
              "role": "water",
              "weight_equivalent_g": 410,
              "weight_equivalent_is_approximate": true,
              "ratio_percent": 82.0
            },
            {
              "id": "sultanas",
              "name": "Sultanas",
              "amount": 110,
              "unit": "g",
              "role": "inclusion",
              "weight_equivalent_g": 110,
              "ratio_percent": 22.0
            },
            {
              "id": "malt_extract",
              "name": "Malt extract",
              "amount": 40,
              "unit": "g",
              "role": "sweetener",
              "weight_equivalent_g": 40,
              "note": "Original quantity approximately 40g.",
              "ratio_percent": 8.0
            },
            {
              "id": "yeast",
              "name": "Yeast",
              "amount": 5,
              "unit": "g",
              "role": "yeast",
              "weight_equivalent_g": 5,
              "ratio_percent": 1.0
            },
            {
              "id": "salt",
              "name": "Salt",
              "amount": 8,
              "unit": "g",
              "role": "salt",
              "weight_equivalent_g": 8,
              "ratio_percent": 1.6
            },
            {
              "id": "cinnamon",
              "name": "Ground cinnamon",
              "amount": 2,
              "unit": "tbsp",
              "role": "spice",
              "weight_equivalent_g": 15.6,
              "weight_equivalent_is_approximate": true,
              "note": "Approximate 7.8g per tablespoon for baker-percentage display; the source uses 2 tablespoons.",
              "ratio_percent": 3.12
            },
            {
              "id": "orange_zest",
              "name": "Orange zest",
              "amount": 1,
              "unit": "orange",
              "role": "aromatic"
            }
          ]
        }
      ],
      "method": [
        "Grease a lidded bread loaf tin.",
        "Combine water, malt, yeast, salt, orange zest and sultanas; let stand 10 minutes.",
        "Combine flour and cinnamon separately, then mix wet and dry ingredients to a shaggy dough; rest 10 minutes.",
        "Slap-and-fold dough, return to proofing chamber for 30 minutes.",
        "Laminate dough by hand, roll into a log seam-down and place into tin; proof covered 2–3 hours.",
        "Remove the tin lid before dough reaches the top and allow dough to rise to the rim.",
        "Bake at 220°C for 45 minutes; cool on a rack at least 1 hour before slicing."
      ],
      "notes": [
        "Source uses sultanas, despite the name raisin bread.",
        "82% is nominal water-to-flour hydration; sultanas absorb some water.",
        "Cinnamon density is approximate; preserve the source’s 2-tablespoon quantity as the editable canonical measurement."
      ],
      "derived": {
        "nominal_hydration_percent": 82,
        "bake_c": 220,
        "bake_minutes": 45,
        "tin_loaves": 1
      }
    },
    {
      "id": "hot_cross_buns",
      "name": "Hot Cross Buns",
      "category": "enriched_bread",
      "source": "attached Hot Cross Buns.pdf, visible page 1",
      "ratio_basis": {
        "amount": 600,
        "unit": "g_flour",
        "label": "main dough flour"
      },
      "yield": {
        "count": 12,
        "unit": "bun",
        "bake_minutes": 30
      },
      "components": [
        {
          "id": "dough",
          "label": "Bun dough",
          "include_in_dough_mass": true,
          "ingredients": [
            {
              "id": "plain_flour",
              "name": "Plain flour",
              "amount": 600,
              "unit": "g",
              "role": "flour",
              "weight_equivalent_g": 600,
              "ratio_percent": 100.0
            },
            {
              "id": "raisins",
              "name": "Raisins",
              "amount": 150,
              "unit": "g",
              "role": "inclusion",
              "weight_equivalent_g": 150,
              "ratio_percent": 25.0
            },
            {
              "id": "orange_zest_juice",
              "name": "Zest and juice",
              "amount": 1,
              "unit": "large_orange",
              "role": "liquid_and_aromatic",
              "note": "Juice amount not given in grams or ml; do not assume a fixed hydration contribution."
            },
            {
              "id": "milk",
              "name": "Lukewarm milk",
              "amount": 125,
              "unit": "ml",
              "role": "liquid",
              "weight_equivalent_g": 125,
              "weight_equivalent_is_approximate": true,
              "note": "Milk is measured by volume; liquid percentage is not equivalent to full dough hydration.",
              "ratio_percent": 20.8333
            },
            {
              "id": "dried_yeast",
              "name": "Dried yeast",
              "amount": 7,
              "unit": "g",
              "role": "yeast",
              "weight_equivalent_g": 7,
              "ratio_percent": 1.1667
            },
            {
              "id": "caster_sugar",
              "name": "Caster sugar",
              "amount": 75,
              "unit": "g",
              "role": "sugar",
              "weight_equivalent_g": 75,
              "ratio_percent": 12.5
            },
            {
              "id": "fine_sea_salt",
              "name": "Fine sea salt",
              "amount": 1,
              "unit": "tsp",
              "role": "salt",
              "weight_equivalent_g": 5,
              "weight_equivalent_is_approximate": true,
              "note": "Approximate weight only; retain 1 tsp as canonical unit.",
              "ratio_percent": 0.8333
            },
            {
              "id": "cinnamon",
              "name": "Ground cinnamon",
              "amount": 2,
              "unit": "tsp",
              "role": "spice",
              "weight_equivalent_g": 5.2,
              "weight_equivalent_is_approximate": true,
              "ratio_percent": 0.8667
            },
            {
              "id": "allspice",
              "name": "Ground allspice",
              "amount": 0.5,
              "unit": "tsp",
              "role": "spice",
              "weight_equivalent_g": 1.0,
              "weight_equivalent_is_approximate": true,
              "ratio_percent": 0.1667
            },
            {
              "id": "ginger",
              "name": "Ground ginger",
              "amount": 0.5,
              "unit": "tsp",
              "role": "spice",
              "weight_equivalent_g": 0.9,
              "weight_equivalent_is_approximate": true,
              "ratio_percent": 0.15
            },
            {
              "id": "nutmeg",
              "name": "Ground nutmeg",
              "amount": 0.25,
              "unit": "tsp",
              "role": "spice",
              "weight_equivalent_g": 0.55,
              "weight_equivalent_is_approximate": true,
              "ratio_percent": 0.0917
            },
            {
              "id": "vanilla",
              "name": "Vanilla extract",
              "amount": 1,
              "unit": "tsp",
              "role": "aromatic",
              "weight_equivalent_g": 5,
              "weight_equivalent_is_approximate": true,
              "ratio_percent": 0.8333
            },
            {
              "id": "eggs",
              "name": "Eggs, beaten",
              "amount": 4,
              "unit": "egg",
              "role": "liquid_and_protein",
              "weight_equivalent_g": 200,
              "weight_equivalent_is_approximate": true,
              "note": "Estimated 50g edible beaten egg per egg; original recipe specifies 4 eggs.",
              "ratio_percent": 33.3333
            },
            {
              "id": "butter",
              "name": "Butter, diced, room temperature",
              "amount": 175,
              "unit": "g",
              "role": "fat",
              "weight_equivalent_g": 175,
              "ratio_percent": 29.1667
            },
            {
              "id": "currants",
              "name": "Currants",
              "amount": 60,
              "unit": "g",
              "role": "inclusion",
              "weight_equivalent_g": 60,
              "ratio_percent": 10.0
            }
          ]
        },
        {
          "id": "working_and_finish",
          "label": "Working flour and glaze",
          "include_in_dough_mass": false,
          "ingredients": [
            {
              "id": "additional_flour",
              "name": "Extra plain flour",
              "amount": 50,
              "unit": "g",
              "role": "working_flour",
              "weight_equivalent_g": 50,
              "note": "Original: 600g plus 50g extra. Keep separate; unclear how much extra is incorporated.",
              "ratio_percent": 8.3333
            },
            {
              "id": "apricot_jam",
              "name": "Apricot jam",
              "amount": 2,
              "unit": "tbsp",
              "role": "glaze",
              "weight_equivalent_g": 40,
              "weight_equivalent_is_approximate": true,
              "note": "Approximate weight, finishing glaze, not part of bun dough.",
              "ratio_percent": 6.6667
            }
          ]
        }
      ],
      "method": [
        "The attached one-page PDF contains ingredient quantities and a visible “Cook time: 30 mins” line only.",
        "Full proofing, shaping and crossing instructions are not present in the source; do not claim an exact original method."
      ],
      "notes": [
        "Original recipe says 600g plain flour plus 50g extra; 600g is the dough baker-percentage basis.",
        "Oranges and eggs supply variable water; avoid reporting hydration from milk alone as overall hydration.",
        "Keep apricot jam outside the dough in a finishing component; extra flour outside the fixed dough formula.",
        "The conversion weights for spices, eggs, milk and jam are estimates and should be editable in the app."
      ],
      "derived": {
        "bun_count": 12,
        "fruit_total_g": 210,
        "fruit_to_flour_percent": 35,
        "butter_to_flour_percent": 29.1667,
        "sugar_to_flour_percent": 12.5
      }
    },
    {
      "id": "croissant_classic",
      "name": "Classic Butter Croissants",
      "category": "laminated_pastry",
      "source": "assistant recipe from 27 Oct 2026, recovered details",
      "ratio_basis": {
        "amount": 600,
        "unit": "g_flour",
        "label": "main dough flour"
      },
      "yield": {
        "count_range": [
          14,
          16
        ],
        "unit": "medium croissant",
        "base_total_unbaked_mass_g": 1421
      },
      "components": [
        {
          "id": "detrempe",
          "label": "Main croissant dough (détrempe)",
          "include_in_dough_mass": true,
          "ingredients": [
            {
              "id": "flour",
              "name": "Strong plain / bread flour",
              "amount": 600,
              "unit": "g",
              "role": "flour",
              "weight_equivalent_g": 600,
              "ratio_percent": 100.0
            },
            {
              "id": "sugar",
              "name": "Sugar",
              "amount": 90,
              "unit": "g",
              "role": "sugar",
              "weight_equivalent_g": 90,
              "ratio_percent": 15.0
            },
            {
              "id": "cold_milk",
              "name": "Cold milk",
              "amount": 280,
              "unit": "g",
              "role": "liquid",
              "weight_equivalent_g": 280,
              "ratio_percent": 46.6667
            },
            {
              "id": "cold_water",
              "name": "Cold water",
              "amount": 100,
              "unit": "g",
              "role": "liquid",
              "weight_equivalent_g": 100,
              "ratio_percent": 16.6667
            },
            {
              "id": "salt",
              "name": "Salt",
              "amount": 12,
              "unit": "g",
              "role": "salt",
              "weight_equivalent_g": 12,
              "ratio_percent": 2.0
            },
            {
              "id": "instant_yeast",
              "name": "Instant yeast",
              "amount": 9,
              "unit": "g",
              "role": "yeast",
              "weight_equivalent_g": 9,
              "ratio_percent": 1.5
            },
            {
              "id": "butter_in_dough",
              "name": "Softened butter, in dough",
              "amount": 30,
              "unit": "g",
              "role": "fat",
              "weight_equivalent_g": 30,
              "ratio_percent": 5.0
            }
          ]
        },
        {
          "id": "lamination",
          "label": "Butter block for lamination",
          "include_in_dough_mass": true,
          "ingredients": [
            {
              "id": "butter_lamination",
              "name": "Unsalted butter for butter block",
              "amount": 300,
              "unit": "g",
              "role": "laminating_fat",
              "weight_equivalent_g": 300,
              "ratio_percent": 50.0
            }
          ]
        }
      ],
      "method": [
        "Use the Ooni Halo Pro spiral mixer: approximately 3 minutes at 20–25% speed then 4–6 minutes at 30–40% speed; target dough temperature 20–23°C.",
        "Chill dough overnight, approximately 8–12 hours at 2–5°C.",
        "Prepare butter block at approximately 12–16°C; enclose in chilled dough.",
        "Perform 3 single folds, chilling dough 30–45 minutes between folds.",
        "Roll to 4–4.5mm final thickness and cut/shape the croissants.",
        "Proof at 24–25°C for about 2–3 hours until noticeably puffy and gently wobbly; avoid overheating the lamination butter.",
        "Bake in a preheated fan oven at about 190°C for 16–21 minutes until deeply golden; adjust to oven and size."
      ],
      "notes": [
        "Milk plus water is 380g / 600g = 63.33% nominal liquid, not literal water hydration because milk includes solids.",
        "The lamination butter block is separate from the 30g butter mixed into the dough.",
        "Base formula produces 14–16 medium croissants according to the previous recipe."
      ],
      "derived": {
        "nominal_milk_plus_water_percent": 63.3333,
        "lamination_butter_percent": 50,
        "butter_in_dough_percent": 5,
        "mix_target_dough_temp_c": [
          20,
          23
        ],
        "butter_block_temp_c": [
          12,
          16
        ],
        "proof_c": [
          24,
          25
        ],
        "proof_hours": [
          2,
          3
        ],
        "bake_fan_c": 190,
        "bake_minutes": [
          16,
          21
        ]
      }
    },
    {
      "id": "croissant_red",
      "name": "Bright-Red Layer Croissants",
      "category": "laminated_pastry",
      "source": "assistant recipe from 27 Oct 2026, recovered details",
      "ratio_basis": {
        "amount": 600,
        "unit": "g_flour",
        "label": "main croissant dough flour; red sheet is additional"
      },
      "yield": {
        "count_range": [
          14,
          16
        ],
        "unit": "medium croissant",
        "estimated_unbaked_mass_g_at_1_5g_colour": 1527.5
      },
      "components": [
        {
          "id": "detrempe",
          "label": "Main croissant dough (détrempe)",
          "include_in_dough_mass": true,
          "ingredients": [
            {
              "id": "flour",
              "name": "Strong plain / bread flour",
              "amount": 600,
              "unit": "g",
              "role": "flour",
              "weight_equivalent_g": 600,
              "ratio_percent": 100.0
            },
            {
              "id": "sugar",
              "name": "Sugar",
              "amount": 90,
              "unit": "g",
              "role": "sugar",
              "weight_equivalent_g": 90,
              "ratio_percent": 15.0
            },
            {
              "id": "cold_milk",
              "name": "Cold milk",
              "amount": 280,
              "unit": "g",
              "role": "liquid",
              "weight_equivalent_g": 280,
              "ratio_percent": 46.6667
            },
            {
              "id": "cold_water",
              "name": "Cold water",
              "amount": 100,
              "unit": "g",
              "role": "liquid",
              "weight_equivalent_g": 100,
              "ratio_percent": 16.6667
            },
            {
              "id": "salt",
              "name": "Salt",
              "amount": 12,
              "unit": "g",
              "role": "salt",
              "weight_equivalent_g": 12,
              "ratio_percent": 2.0
            },
            {
              "id": "instant_yeast",
              "name": "Instant yeast",
              "amount": 9,
              "unit": "g",
              "role": "yeast",
              "weight_equivalent_g": 9,
              "ratio_percent": 1.5
            },
            {
              "id": "butter_in_dough",
              "name": "Softened butter, in dough",
              "amount": 30,
              "unit": "g",
              "role": "fat",
              "weight_equivalent_g": 30,
              "ratio_percent": 5.0
            }
          ]
        },
        {
          "id": "lamination",
          "label": "Butter block for lamination",
          "include_in_dough_mass": true,
          "ingredients": [
            {
              "id": "butter_lamination",
              "name": "Unsalted butter for butter block",
              "amount": 300,
              "unit": "g",
              "role": "laminating_fat",
              "weight_equivalent_g": 300,
              "ratio_percent": 50.0
            }
          ]
        },
        {
          "id": "red_sheet",
          "label": "Additional bright-red outer pastry sheet",
          "include_in_dough_mass": true,
          "ingredients": [
            {
              "id": "red_flour",
              "name": "Flour",
              "amount": 50,
              "unit": "g",
              "role": "flour",
              "weight_equivalent_g": 50,
              "ratio_percent": 8.3333
            },
            {
              "id": "red_sugar",
              "name": "Sugar",
              "amount": 10,
              "unit": "g",
              "role": "sugar",
              "weight_equivalent_g": 10,
              "ratio_percent": 1.6667
            },
            {
              "id": "red_salt",
              "name": "Salt",
              "amount": 1,
              "unit": "g",
              "role": "salt",
              "weight_equivalent_g": 1,
              "ratio_percent": 0.1667
            },
            {
              "id": "red_water",
              "name": "Cold water",
              "amount": 40,
              "unit": "g",
              "role": "water",
              "weight_equivalent_g": 40,
              "ratio_percent": 6.6667
            },
            {
              "id": "red_butter",
              "name": "Butter",
              "amount": 4,
              "unit": "g",
              "role": "fat",
              "weight_equivalent_g": 4,
              "ratio_percent": 0.6667
            },
            {
              "id": "red_colouring",
              "name": "Concentrated red food colouring",
              "amount": 1.5,
              "unit": "g",
              "role": "colour",
              "weight_equivalent_g": 1.5,
              "note": "Start with 1g, up to 2g. Recipe default 1.5g.",
              "allowable_min": 1,
              "allowable_max": 2,
              "ratio_percent": 0.25
            }
          ]
        }
      ],
      "method": [
        "Use the Ooni Halo Pro spiral mixer: approximately 3 minutes at 20–25% speed then 4–6 minutes at 30–40% speed; target dough temperature 20–23°C.",
        "Chill dough overnight, approximately 8–12 hours at 2–5°C.",
        "Prepare butter block at approximately 12–16°C; enclose in chilled dough.",
        "Perform 3 single folds, chilling dough 30–45 minutes between folds.",
        "After the three single folds, prepare a bright-red dough sheet, roll thinly to about 0.8–1mm and lay over the laminated dough before the final rollout and cutting. Keep cool while working.",
        "Roll to 4–4.5mm final thickness and cut/shape the croissants.",
        "Proof at 24–25°C for about 2–3 hours until noticeably puffy and gently wobbly; avoid overheating the lamination butter.",
        "Bake in a preheated fan oven at about 190°C for 16–21 minutes until deeply golden; adjust to oven and size."
      ],
      "variant_of": "croissant_classic",
      "notes": [
        "Shares all classic croissant ingredients and adds the separate red pastry sheet. Do not colour the main dough.",
        "Ratios in this variant use 600g main dough flour as denominator; the 50g red-sheet flour is ADDITIONAL. Total actual flour is 650g.",
        "Add red sheet only after the three folds, before final sheet-out. 0.8–1mm red outer layer.",
        "Red colourant quantity 1–2g concentrated colour; default 1.5g for scaling."
      ],
      "derived": {
        "total_flour_including_red_sheet_g": 650,
        "main_dough_flour_g": 600,
        "extra_red_flour_g": 50,
        "red_sheet_thickness_mm": [
          0.8,
          1.0
        ],
        "nominal_milk_plus_water_percent_main_dough": 63.3333
      }
    },
    {
      "id": "classic_risotto",
      "name": "Standard Risotto",
      "category": "rice",
      "source": "proposed standard ratio, 28 Oct 2026",
      "ratio_basis": {
        "amount": 240,
        "unit": "g_rice",
        "label": "dry rice weight; wine and stock ml are compared numerically to rice grams"
      },
      "yield": {
        "count": 3,
        "unit": "main-course serving",
        "rice_g_per_serving": 80
      },
      "components": [
        {
          "id": "risotto",
          "label": "Risotto ingredients",
          "include_in_dough_mass": true,
          "ingredients": [
            {
              "id": "arborio_rice",
              "name": "Arborio or Carnaroli rice (dry)",
              "amount": 240,
              "unit": "g",
              "role": "rice",
              "weight_equivalent_g": 240,
              "ratio_percent": 100.0
            },
            {
              "id": "white_wine",
              "name": "Dry white wine",
              "amount": 80,
              "unit": "ml",
              "role": "wine",
              "weight_equivalent_g": 80,
              "weight_equivalent_is_approximate": true,
              "ratio_percent": 33.3333
            },
            {
              "id": "stock",
              "name": "Hot stock",
              "amount": 900,
              "unit": "ml",
              "role": "stock",
              "weight_equivalent_g": 900,
              "weight_equivalent_is_approximate": true,
              "note": "This is the starting planning amount; actual absorption varies by rice, heat and pan.",
              "ratio_percent": 375.0
            },
            {
              "id": "onion",
              "name": "Finely diced onion or shallot",
              "amount": 60,
              "unit": "g",
              "role": "aromatic",
              "weight_equivalent_g": 60,
              "ratio_percent": 25.0
            },
            {
              "id": "butter",
              "name": "Butter for finishing",
              "amount": 30,
              "unit": "g",
              "role": "fat",
              "weight_equivalent_g": 30,
              "ratio_percent": 12.5
            },
            {
              "id": "parmesan",
              "name": "Finely grated Parmesan",
              "amount": 45,
              "unit": "g",
              "role": "cheese",
              "weight_equivalent_g": 45,
              "ratio_percent": 18.75
            },
            {
              "id": "olive_oil",
              "name": "Olive oil for cooking",
              "amount": 15,
              "unit": "ml",
              "role": "fat",
              "weight_equivalent_g": 13.65,
              "weight_equivalent_is_approximate": true,
              "ratio_percent": 5.6875
            },
            {
              "id": "salt_pepper",
              "name": "Salt and pepper",
              "amount": null,
              "unit": "to_taste",
              "role": "seasoning"
            }
          ]
        }
      ],
      "method": [
        "Sweat finely diced onion or shallot in olive oil without browning.",
        "Add dry rice and toast briefly, stirring until coated.",
        "Add wine and reduce, then add hot stock gradually while stirring intermittently.",
        "Cook until rice is al dente and loose enough to flow; stock addition and timing depend on rice.",
        "Off the heat, stir in butter and Parmesan. Adjust consistency with reserved hot stock; season to taste."
      ],
      "notes": [
        "Standard planning ratio: 1 part dry rice by weight : 0.333 part wine by volume : 3.75 parts stock by volume.",
        "Recommended variable stock range: 3.5–4.25mL per 1g dry rice (840–1,020mL at 240g rice), add as needed.",
        "Use 80g dry rice per adult for a main-course portion; 60g as a lighter or side portion.",
        "Ratios are RICE-based practical ratios, not flour-based baker percentages."
      ],
      "derived": {
        "rice_to_wine_to_stock_practical_ratio": [
          1,
          0.3333,
          3.75
        ],
        "stock_ml_per_g_rice_range": [
          3.5,
          4.25
        ]
      }
    }
  ]
}
```

---

## Final agent checklist

- [ ] All eight recipe configurations appear; classic and red croissants behave as separate selectable recipes / linked variants.
- [ ] Master recipe originals remain unmodified after scaling and personal edits.
- [ ] The poolish, final dough and croissant sheets are stage-specific; no ingredient is counted twice.
- [ ] The pizza uses **30g salt and 10g oil** per batch; the old incomplete 25g-salt / 30g-oil assumptions are absent.
- [ ] Sourdough true hydration is **73.913%** while source-added-water ratio is **71.15%**.
- [ ] Oil, milk and eggs do not silently inflate true water hydration.
- [ ] Ingredient unit uncertainty and missing method details are visible.
- [ ] Risotto stock is a planning quantity with an adjustable range, not a fixed guarantee.
- [ ] Website is responsive and legible despite the lively 80s retro neon styling.
- [ ] Works offline after loading / install where feasible, and provides print + backup export.
