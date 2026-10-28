# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users
Ben (the owner) baking at home: phone on the kitchen bench, sometimes floury hands, bright daylight. Friends he shares the link with also open it to read and scale recipes on their own devices; they do not change Ben's originals (any edits stay on their own device).

## Product Purpose
A private recipe book and scaling tool for Ben's own formulas: nine recipes (classic white sourdough, white/whole wheat/rye sourdough, poolish pizza, focaccia, raisin bread, hot cross buns, classic and bright-red croissants, risotto). It shows each original exactly as written and turns a plain request ("14 pizza balls of 250 g", "risotto for 8", "5 loaves") into a correct, stage-by-stage ingredient list with no arithmetic. Success: open on a phone, pick a recipe, say how much you want, weigh out the numbers.

## Positioning
Ben's own formulas with the baking maths done properly: preferments and starter counted once, true vs added-water hydration kept distinct, eggs and spoons kept in their real units, and the originals frozen so scaling and personal versions can never corrupt them.

## Operating Context
- Recipes section: read-only originals, method, notes, baker's percentages. Personal versions (variants) are made from here.
- Ratio Lab: the one place scaling happens, driven by plain-language targets (people, balls × grams, loaves, buns, trays, flour, dough weight, multiplier).
- Used mid-bake, often one-handed; printing a bake sheet is part of the ritual.
- Works offline after first load; no account, no backend, data stays in the browser with JSON export/import.

## Capabilities and Constraints
- Stack: React + TypeScript + Vite PWA; pure calculation engine in `src/engine/` with tests in `tests/`.
- Seed data: `src/data/seed-recipes.json` (extracted from `docs/brief.md`; both sourdoughs updated from Ben's Oct 2026 recipe sheet); immutable at runtime.
- Sourdough uses a stiff 60% starter built 1:5:3; the app sizes each build so the leftover seeds the next build of the same size plus ~18 g jar loss.
- Scaling limits 0.1×–20×; invalid targets explain themselves and never silently change output.
- Hosting: intended for Vercel; the Vercel connector could not create the project (403), so Ben links it manually.
- Photography: still-life only; Ben may swap in photos of his own bakes later.

## Brand Commitments
- Name: Hay's Crust & Crumb.
- Ben's binding visual brief (Oct 2026): minimalist, soft, earthy, high-end. References supplied: warm stone/cream interiors with window light, a fine script logotype in bronze, elegant serif headings, generous calm whitespace, espresso-brown and cream. The earlier 80s neon direction is rejected.
- Voice: plain, warm, confident, practical. No gimmicks.

## Evidence on Hand
- Recipe data and method text in `src/data/seed-recipes.json`; design/data brief in `docs/brief.md`.
- Recipe photos: AI-generated still-lifes of ingredients and tools (not Ben's bakes) for every recipe in `src/assets/recipes/`. Never present a generated image as one of Ben's own bakes; do not invent testimonials or yields beyond the source data.

## Product Principles
1. Originals are sacred: show them exactly, never overwrite them.
2. Say what you want, get the numbers: scaling is a plain sentence, not a form.
3. Honest maths: label estimates, approximations and missing source detail.
4. Kitchen-first: big legible quantities, large tap targets, works offline.
5. Calm over clever: nothing decorative competes with the numbers.

## Accessibility & Inclusion
WCAG AA contrast, keyboard operable, 44px+ tap targets, reduced-motion respected, legible at arm's length on a phone.
