---
version: 1
slug: "src-ui-app-tsx"
primary_target: "src/ui/App.tsx"
related_targets: ["src/ui/styles.css"]
---

# Surface brief — whole app (Recipes, Ratio Lab, Variants, Settings)

Scope: every route of the app. Visitor mode: **Operate** (a kitchen tool), Recipes pages lean **Read**.
Audience/job: Ben and friends on a phone at the bench; read an original, then say how much and weigh out numbers.
Constraints: light theme only (daylight kitchen); no photography yet; offline; standard web controls.
Build path: code-led (no image generation available; Operate surface).
Unresolved: real bake photos may replace the empty imagery budget later.

## Direction contract

THESIS: A baker's private formula book in stone and walnut, where scaling is a sentence you finish ("Make 14 pizza balls of 250 g"), not a form you fill. Refuses the category default of a dashboard of steppers, metric cards and icon tiles.

OWN-WORLD: Travertine ground (#EFE8DE) with paper panels (#F8F4EE), espresso ink (#2B211B), walnut (#4A3628) shell band, bronze (#8A6A3F) for selection, focus and the script mark; hairline stone rules (#D6CABA); sage (#46553A) only for 'complete' states, rust (#9B3B26) only for errors. Gilda Display for titles and large quantities, Hanken Grotesk for UI and labels, Mrs Saint Delafield only for the "Hay's" mark. Pill buttons and chips (from Ben's third reference); 8px inputs and notices, 14px on the sentence panel and dialog. No decorative shadows: one soft daylight wash on the sentence panel, and an elevation shadow on the dialog only.

STORY: The visitor sees Ben's recipes as a quiet index, opens one and reads it exactly as written, then taps "Scale in Ratio Lab", types the number they want into the sentence, and gets every stage's weights with honest notes about estimates.

FIRST VIEWPORT: Ratio Lab — walnut top bar with mark and nav; recipe chooser as a single row of names; the sentence panel spanning the content width, the sentence in 2.4–3.2rem serif with inline underlined number fields; a one-line summary (batch ×, dough weight) under it; first ingredient stage beginning below the fold line on phones, above it on desktop beside the sentence.

FORM: Pinned by Ben's brief and reference images (minimalist, soft, earthy, high-end); concept roll not run because the direction was user-pinned. Signature move: the fill-in-the-blank scaling sentence. seed: none (roll skipped: direction pinned by user; `concept-seed --check-seed none` exit 0)

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
