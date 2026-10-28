---
name: Hay's Crust & Crumb
description: A baker's private formula book in stone, walnut and bronze.
colors:
  travertine: "#EFE8DE"
  paper: "#F8F4EE"
  stone: "#E4DACC"
  hairline: "#D6CABA"
  hairline-strong: "#B9A892"
  espresso-ink: "#2B211B"
  umber-ink: "#5C4D41"
  taupe-muted: "#6E5F53"
  walnut: "#4A3628"
  bronze: "#8A6A3F"
  bronze-ink: "#6F522C"
  bronze-light: "#DCC196"
  cream-on-walnut: "#F3EADC"
  sage: "#46553A"
  rust: "#9B3B26"
  rust-wash: "#F6E6DF"
typography:
  display:
    fontFamily: "Gilda Display, Iowan Old Style, Palatino, Georgia, serif"
    fontSize: "clamp(2.3rem, 6vw, 3.9rem)"
    fontWeight: 400
    lineHeight: 1.04
    letterSpacing: "-0.012em"
  sentence:
    fontFamily: "Gilda Display, Georgia, serif"
    fontSize: "clamp(1.85rem, 5.2vw, 3.1rem)"
    fontWeight: 400
    lineHeight: 1.5
  quantity:
    fontFamily: "Gilda Display, Georgia, serif"
    fontSize: "1.9rem"
    fontWeight: 400
    lineHeight: 1
    fontFeature: "lnum, tnum"
  title:
    fontFamily: "Gilda Display, Georgia, serif"
    fontSize: "1.42rem"
    fontWeight: 400
    lineHeight: 1.2
  body:
    fontFamily: "Hanken Grotesk Variable, -apple-system, Segoe UI, Roboto, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.55
  label:
    fontFamily: "Hanken Grotesk Variable, sans-serif"
    fontSize: "0.76rem"
    fontWeight: 600
    letterSpacing: "0.18em"
  mark:
    fontFamily: "Mrs Saint Delafield, cursive"
    fontSize: "2.1rem"
    fontWeight: 400
rounded:
  input: "8px"
  notice: "8px"
  panel: "14px"
  pill: "999px"
spacing:
  gutter-mobile: "16px"
  gutter-desktop: "32px"
  row: "14px"
  section: "36px"
components:
  button-primary:
    backgroundColor: "{colors.espresso-ink}"
    textColor: "{colors.paper}"
    rounded: "{rounded.pill}"
    padding: "0 20px"
    height: "44px"
  button-primary-hover:
    backgroundColor: "{colors.walnut}"
  button-ghost:
    textColor: "{colors.espresso-ink}"
    rounded: "{rounded.pill}"
    padding: "0 20px"
    height: "44px"
  chip-selected:
    backgroundColor: "{colors.espresso-ink}"
    textColor: "{colors.paper}"
    rounded: "{rounded.pill}"
    height: "42px"
  input:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.espresso-ink}"
    rounded: "{rounded.input}"
    height: "46px"
  topbar:
    backgroundColor: "{colors.walnut}"
    textColor: "{colors.cream-on-walnut}"
  sentence-panel:
    backgroundColor: "{colors.paper}"
    rounded: "{rounded.panel}"
---

# Design System: Hay's Crust & Crumb

## Overview

**Creative North Star: "The Baker's Formula Book"**

A private notebook of formulas kept on a stone bench: travertine ground, a walnut spine across the top, bronze where your hand goes. The page is quiet so the numbers can be loud. Quantities are set large in a fine display serif on hairline rules, like a weighed list in a good cookbook. Chrome is minimal and the type does the work.

Scaling is a sentence, not a form. In Ratio Lab the visitor finishes a line such as "Make 14 pizza balls of 250 g each" by typing into underlined blanks, and every stage below recalculates. Ben rejected the earlier 80s neon look. This system replaces it entirely.

**Key Characteristics:**
- Light only. The app is used on a phone in a daylight kitchen.
- One serif voice for titles, sentences and quantities. One grotesk for UI. A script for the mark only.
- Hairline rules instead of cards. Space instead of boxes.
- Bronze marks interaction: selection underlines, focus rings, inline blanks.

## Colors

Warm, low-chroma earth tones. Colour does structural jobs (shell, ink, interaction), not decoration.

### Primary
- **Bronze** (#8A6A3F): focus rings, the active-tab underline, inline sentence blanks, disclosure chevrons, method step numbers. **Bronze Ink** (#6F522C) is the text-safe version, used for links, typed values and edited quantities.

### Secondary
- **Walnut** (#4A3628): the top bar shell, and the hover state of primary buttons. **Bronze Light** (#DCC196) is the script mark on walnut.

### Neutral
- **Travertine** (#EFE8DE): page ground.
- **Paper** (#F8F4EE): raised surfaces: sentence panel, dialog, active index row, the poolish transfer row, inputs.
- **Stone** (#E4DACC): switch track and quiet fills.
- **Hairline** (#D6CABA) / **Hairline Strong** (#B9A892): row rules, stage underlines, ghost-button borders.
- **Espresso Ink** (#2B211B): primary text, primary buttons, selected chips.
- **Umber Ink** (#5C4D41): secondary text and captions.
- **Taupe Muted** (#6E5F53): hints and metadata (4.9:1 on travertine).

### State
- **Sage** (#46553A): "complete" states only (method from source, success messages).
- **Rust** (#9B3B26) on **Rust Wash** (#F6E6DF): errors and "method missing in source" only.

### Named Rules
**The Earth-Only Rule.** No saturated or neon hue enters the UI. A new state colour must be an earth tone and must carry meaning.

**The Bronze-Means-Touch Rule.** Bronze appears where the visitor can act or has acted. It is never decoration.

## Typography

**Display Font:** Gilda Display (with Iowan Old Style, Palatino, Georgia)
**Body Font:** Hanken Grotesk Variable (with system UI sans)
**Mark Font:** Mrs Saint Delafield (only for the "Hay's" logotype)

**Character:** A fine, high-contrast display serif paired with a calm, slightly warm grotesk. This is the type pairing of the reference interiors and calligraphic stationery.

### Hierarchy
- **Display** (400, clamp(2.3rem, 6vw, 3.9rem), 1.04): page and recipe titles.
- **Sentence** (400, clamp(1.85rem, 5.2vw, 3.1rem), 1.5): the Ratio Lab scaling sentence.
- **Quantity** (400, 1.9rem, lining tabular figures): ingredient amounts, totals (2.2rem) and headline facts (1.55rem).
- **Title** (400, 1.42rem): index recipe names, version names, sub-heads.
- **Body** (400, 1rem, 1.55): reading text; measure capped near 64–70ch.
- **Label** (600, 0.7–0.8rem, 0.14–0.18em tracking, uppercase): stage captions, tab labels, fact labels. These are headings in their own right, never eyebrows above another heading.

### Named Rules
**The Serif-For-Numbers Rule.** Every weighed quantity is set in the display serif with lining tabular figures, right-aligned. Units are small grotesk in taupe.

## Layout

- Container max 1200px, gutter 16px on mobile and 32px from 720px.
- **Recipes:** two columns from 960px (280px sticky index, then detail, 72px gap). Below 960px it is a single column: index alone at `#/recipes`, detail alone at `#/recipes/:id` with a back link.
- **Ratio Lab:** below 1040px it is one column: chooser, sentence panel, results. From 1040px it is two columns. The sentence panel is sticky on the left and the summary and stages are on the right.
- **Rhythm:** 14px row padding on hairlines, 36px between stages, 48px before closing disclosures, more space above headings than below.

## Elevation & Depth

Flat. Depth comes from the travertine → paper tonal step and hairlines. There are two exceptions:

- **Dialog elevation** (`box-shadow: 0 24px 60px -20px rgba(43,33,27,.35), 0 2px 8px rgba(43,33,27,.08)`): only for modal dialogs.
- **Daylight wash** (`radial-gradient(120% 90% at 8% 0%, rgba(255,255,255,.34), transparent 62%)` over a paper-to-stone gradient): only on the sentence panel.

**The Window-Light Rule.** One soft daylight falloff, on one panel. No streaks, gloss, glass or glows anywhere.

## Shapes

- Buttons, chips and segments are pills (999px). This follows Ben's interior-design reference.
- Inputs and notices are 8px.
- The sentence panel and dialog are 14px.
- Sentence blanks have 6px top corners and an underline.
- Lists and tables have no containers: just hairlines.

## Components

### Buttons
- **Shape:** pill (999px), 44px min height.
- **Primary:** espresso fill, paper text. Hover goes to walnut.
- **Ghost:** transparent with a hairline-strong border. Hover darkens the border to espresso.
- **Text:** no border, umber text. Hover underlines. Used for quiet actions (Back to 1×, Duplicate, Rename) and in rust for Delete.
- Icons are authored 24px line SVGs with a 1.5px stroke (`src/ui/icons.tsx`). Never emoji or glyphs.

### Chips (recipe chooser, "Say it another way")
- **Default:** hairline-strong border, umber text. The chooser scrolls horizontally on phones.
- **Selected:** espresso fill, paper text. Personal versions use a dashed border until selected.

### Inputs / Fields
- **Style:** paper fill, hairline-strong 1px border, 8px radius, 46px min height.
- **Focus:** 2px bronze outline. **Error:** rust border plus a rust-wash message that names the problem and the fallback.

### Navigation
- Walnut top bar, sticky. Links are cream at 78% opacity. Active is full cream with a bronze-light 1px underline. On phones the links scroll in one row under the mark.

### Ingredient Stage (signature list)
- Uppercase label caption over a strong hairline, then a semantic table of rows: grotesk name with a taupe note, right-aligned serif quantity, small unit.
- Edited amounts turn bronze-ink and get an "Edited" pill.
- Estimated gram equivalents read "≈ 5 g, estimated".
- The poolish transfer row sits on paper.

### Scaling Sentence (signature component)
- The display serif sentence with inline `<input>` blanks: bronze-ink value, bronze underline, translucent paper fill. Hover and focus go to white with an ink underline.
- The portion choice is an inline `<select>` in the same style.
- Values re-set with a 0.45s settle (blur and opacity) on change, and not at all under reduced motion.

## Do's and Don'ts

### Do:
- **Do** set every weighed quantity in Gilda Display with lining tabular figures, right-aligned.
- **Do** separate content with hairlines (#D6CABA) and space, not boxes.
- **Do** reserve bronze for interaction and rust/sage for meaning.
- **Do** keep tap targets at 44px or more and text contrast at 4.5:1 or more (taupe #6E5F53 is the floor for small text).

### Don't:
- **Don't** reintroduce the neon world: no navy grounds, cyan outlines, hard offset shadows, checkerboards, starbursts or cartoon icons.
- **Don't** wrap content in cards or nest panels; the sentence panel and dialog are the only raised surfaces.
- **Don't** put a tracked-caps eyebrow above a heading.
- **Don't** use the script face for anything but the "Hay's" mark.
