# BeerCSS — practical guide & reference

> Rewritten reference for **BeerCSS** (a utility-first CSS kit for Material Design 3).
> This file has two jobs: teach a **human newcomer** how BeerCSS actually works, and
> give an **AI/code-assistant** the mental model, the gotchas, and the class inventory
> needed to style pages in *pure BeerCSS* quickly and correctly — instead of falling
> back to custom CSS.
>
> Version note: BeerCSS `3.x` (linklist pins `3.7.12`). The official site is
> <https://www.beercss.com>. Class/variable names below are taken from the official
> docs; when a behaviour was confirmed empirically (not documented) it is marked
> **(verified)**.

---

## 1. The mental model (read this first)

BeerCSS is **not** a component framework and **not** a Tailwind clone. Four ideas
explain ~90% of it:

1. **Components are driven by semantic HTML tags, not by wrapper classes.** Many
   elements are styled just by being the right tag: `<button class="button">`,
   `<nav>`, `<header>`, `<footer>`, `<dialog>`, `<table>`, `<article>` (the card
   surface — see §7), `<label>` around an input. You mostly add a base class to a
   real tag, then add *modifier* classes.
2. **Helpers are small, single-purpose classes** (`round`, `elevate2`, `center-align`,
   `large`, `primary`) that you stack on any element. The official tip is literally:
   *"Try to use helpers first, before any custom CSS."*
3. **All color, elevation, radius and type scale come from CSS custom properties
   (design tokens).** You almost never type a hex value; you reference a role
   (`--primary`, `--surface-container`, `--on-surface-variant`) and BeerCSS maps it
   for **light** and **dark** automatically.
4. **JS is optional and only adds behavior.** `beer.min.css` does *all* layout,
   color and typography (works with JavaScript disabled). `beer.min.js` only wires
   interactive widgets (tabs, dropdown menus, dialogs, side-nav toggle, waves,
   date/time pickers). Pure static pages need **no JS** from BeerCSS.

Total footprint is tiny — ~100 CSS classes. When you feel the urge to write a
`<style>` block, first check whether a helper or a token already does it.

### Icons
Icons are **Google Material Symbols ligatures**: a `<i>` whose *text* is the icon's
ligature name renders as that glyph, using the `--font-icon` font.

```html
<i>home</i>          <!-- Material Symbol "home" -->
<i class="small">search</i>
```

`<i>` is a plain icon slot. **Never add `class="icon"`** — `.icon` is a *reserved*
BeerCSS layout class (fixed size box) and using it to style a glyph breaks the
grid/row math **(verified)**. Brand logos are not Material ligatures; ship inline
SVG with `fill="currentColor"` for those.

---

## 2. Pure BeerCSS vs other techniques

Knowing what BeerCSS is *not* prevents the instinct to reach for patterns that do
not apply. Agility cheat-sheet:

| Technique | How it differs from BeerCSS | What to do in BeerCSS instead |
| --- | --- | --- |
| **Bootstrap** (opinionated `.card`/`.btn` components) | BeerCSS components are tag+modifier driven, far fewer classes, no JS plugin ecosystem. | Use the semantic tag + a base class + modifiers. |
| **Tailwind** (atomic utilities, `bg-blue-600`) | BeerCSS has **no literal color/spacing scale** in markup; it uses **semantic roles** + tokens, so classes are fewer but less granular. | Say `primary`/`surface`, not `bg-[#4f46e5]`. Use `--size` and helpers (`small`, `large`, `padding`) instead of arbitrary values. |
| **CSS Modules / styled-components** | BeerCSS is global-by-design; there is no scoping layer. | Prefix your own helper classes with a namespace (e.g. `linklist`) and rely on BeerCSS classes for everything else. |
| **Custom CSS / design systems** | Most things you'd hand-write (elevations, containers, theme switching) already exist as tokens/helpers. | Override a token in `:root`/`body.dark` rather than re-declaring component CSS. |
| **Material Web Components** (custom elements, `@material/web`) | BeerCSS is CSS+classes only; no shadow DOM, no `<md-button>`. | Plain tags; add `beer.min.js` for interactions. |

**Golden rules for a coding agent working in pure BeerCSS:**

- Prefer a BeerCSS **class** over a new CSS rule; prefer a **token** over a literal value.
- Never hardcode colors — always a role class or `var(--*)`, so light/dark keep working.
- Structure = real HTML tags; presentation = modifiers stacked on them.
- Static content must render correctly with **JS off**; add `beer.min.js` only where an interaction is needed.
- When a size/space/width does not take effect, **inspect COMPUTED styles** — a BeerCSS
  base class often overrides your HTML attributes or universal selectors (see §5).

---

## 3. Setup

### CDN (recommended for static sites)

```html
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <!-- CSS only = fully styled, no-JS-capable page -->
  <link href="https://cdn.jsdelivr.net/npm/beercss@3.7.12/dist/cdn/beer.min.css" rel="stylesheet" />
  <!-- Optional: JS for interactive widgets + Material Symbols font -->
  <script type="module" src="https://cdn.jsdelivr.net/npm/beercss@3.7.12/dist/cdn/beer.min.js"></script>
  <!-- Optional: runtime theme swapping (dynamic colors) -->
  <script type="module" src="https://cdn.jsdelivr.net/npm/material-dynamic-colors@1.1.2/dist/cdn/material-dynamic-colors.min.js"></script>
  <!-- Optional: a custom UI font + the icon font, otherwise BeerCSS uses system fonts -->
  <link href="https://fonts.googleapis.com/css2?family=Roboto+Flex:wght@400;500;700&display=swap" rel="stylesheet" />
</head>
<body class="light"><!-- or dark --> … </body>
```

Use `material-dynamic-colors` **only** if you change the theme at runtime; a static
site can pick brand colors by overriding tokens in CSS (§4). npm: `npm i beercss`
(`beer.min.css` / `beer.min.js` under `dist/cdn`).

---

## 4. Theming & configuration (the highest-value section)

### 4.1 Light / dark are two token palettes on `<body>`

BeerCSS ships two complete palettes selected by a body class:

```css
:root, body.light { /* light role values */ }
body.dark          { /* dark role values */ }
```

So the mode is literally `document.body.classList` = `light` | `dark`. There is **no
`prefers-color-scheme` in BeerCSS** — "follow the OS" is not built in **(verified)**.

**Auto without a flash, no dependency** — a one-line blocking script right after
`<body>` reads the OS preference before first paint, then (optionally) keep it live:

```html
<body class="">
  <script>
    if (matchMedia("(prefers-color-scheme: dark)").matches)
      document.body.classList.add("dark");
  </script>
  <!-- runtime sync (optional) -->
  <script>
    const mq = matchMedia("(prefers-color-scheme: dark)");
    mq.addEventListener("change", () => {
      document.body.classList.toggle("dark", mq.matches);
      document.body.classList.remove("light");
    });
  </script>
```

(When JS is off, force a mode statically with `<body class="dark">` at build time.)

### 4.2 The tokens you actually override

Colors are **role tokens** (Material 3). The important pairs are a *fill* and its
*on-* foreground (text/icon drawn on that fill):

| Role | Meaning |
| --- | --- |
| `--primary`, `--on-primary`, `--primary-container`, `--on-primary-container` | brand color + legible ink + tonal container |
| `--secondary`, `--tertiary`, `--error` (+ their `-on-*` / `-container` variants) | secondary/tertiary palettes, error color |
| `--background`, `--on-background` | page canvas |
| `--surface`, `--on-surface`, `--surface-variant`, `--on-surface-variant` | component surfaces + text |
| `--surface-dim`, `--surface-bright`, `--surface-container`, `--surface-container-low(-est)`, `--surface-container-high(-est)` | the tonal elevation ramp (cards, wells) |
| `--outline`, `--outline-variant` | borders/dividers |
| `--inverse-surface`, `--inverse-on-surface`, `--inverse-primary` | inverted context |
| `--shadow`, `--scrim`, `--overlay`, `--active` | shadow color, modal scrim, hover/press tint |

Non-color config tokens (change these in `:root`):

| Token | Effect |
| --- | --- |
| `--size` | the base unit — **scales almost every component** (button height, spacing, fonts). One knob to make the whole UI denser/roomier. |
| `--font` | UI font family stack. |
| `--font-icon` | icon font: `"Material Symbols Outlined"` (default) / `"…Rounded"` / `"…Sharp"` / `none`. |
| `--elevate1/2/3` | box-shadow values for `elevate*`. |
| `--speed1/2/3/4` | animation durations. |

### 4.3 Changing the brand color statically (no runtime JS)

Only override the roles you care about; keep everything else. Set the light block on
`:root, body.light` and the dark block on `body.dark` (dark usually needs a *lighter*
primary for contrast):

```css
:root, body.light {
  --primary: #4f46e5;            /* indigo-600 */
  --on-primary: #ffffff;         /* legible ink on the fill */
  --primary-container: #e0e7ff;
  --on-primary-container: #1e1b4b;
}
body.dark {
  --primary: #a5b4fc;            /* lighter tint for dark mode */
  --on-primary: #1e1b4b;
  --primary-container: #3730a3;
  --on-primary-container: #e0e7ff;
}
```

`--on-*` must contrast with its fill. Do it by hand in static CSS, or compute it at
build/runtime (WCAG relative-luminance → pick black/white ink). A tonal
`--*-container` is roughly the primary blended ~15% toward white.

### 4.4 Runtime theming (dynamic colors) — optional

With `material-dynamic-colors` loaded, `ui()` can derive a full theme from any seed
(color/image/file) and flip mode:

```js
let theme = await ui("theme", "#ffd700"); // returns { dark: "--primary:…;…", light: "--primary:…;…" } and applies it
ui("mode", "dark");                        // or "light"
```

Only reach for this when the user picks a theme live; otherwise static overrides
(§4.3) are simpler and work without JS.

### 4.5 Fonts

```css
@import "https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap";
:root {
  --font: "Roboto Flex";
  --font-icon: "Material Symbols Outlined"; /* or Rounded / Sharp / none */
}
```

---

## 5. Gotchas that bite everyone (all **verified** building linklist)

These are the traps that waste the most time. When something "won't size/space", it
is almost always one of these:

1. **`.button` is `inline` and `box-sizing: content-box`.** A `width:100%` button is
   therefore **48px wider than its cell** (`padding: 0 24px` is added to content-box)
   and overlaps neighbors. Fixes:
   - idiomatic full-width: add **`.responsive`** — *"a button that automatically
     adjusts to the width of its container"* — `<a class="button responsive">`.
   - if you set `width:100%` yourself, also set **`box-sizing: border-box`** on the
     same (specific, class-scoped) selector; a global `*{box-sizing:border-box}` **loses**
     to the `.button` class rule.
2. **`.circle` / `.round` / `.square` fix a size** (`.circle` = `3rem`, i.e. 48px) as
   well as the radius. This **beats HTML `width`/`height` attributes**, so an avatar
   "stuck small" is a `.circle` not respecting your attrs. To enlarge, override
   `width`/`height` in a class-scoped CSS rule (keep `.circle` for the round shape).
3. **Semantic landmarks come pre-styled.** BeerCSS paints `header`, `footer`, `nav`,
   `section` with a surface background, `display:flex`, and **`white-space:nowrap`**.
   If you use them as plain page structure, **reset** them:
   ```css
   .linklist header, .linklist nav, .linklist footer, .linklist section {
     background: transparent; display: block; min-block-size: 0;
     padding: 0; margin: 0; white-space: normal;
   }
   ```
4. **`.icon` is reserved** (a fixed-size layout box). Use a bare `<i>` for glyphs;
   never style icons with `class="icon"`.
5. **`.grid` gutters come from the `---gap` custom property, which feeds BOTH
   `gap` and the 12-column track `calc()`.** The `*-space` helpers (`no-space` /
   `small-space` / `medium-space` / `large-space`) work by setting `---gap`. If you
   override only `gap`, the tracks stay sized for the old `---gap` and *every child
   shrinks* by ~11×(old−new) — e.g. a `gap:.75rem` override leaves buttons ~44px
   narrower than full-width siblings **(verified)**. Do it right: add a `*-space`
   class, **or** set `---gap` directly (`grid { ---gap: .75rem }`). Children size by
   **12-column spans** (`s*`,`m*`,`l*`), so a *consistent* gap never overflows.
6. **`.row` never wraps** (`white-space:nowrap`). Put only short controls in a `.row`
   (center with `center-align`, a `.row` helper — *not* `.center`, which is an
   absolute-position helper). For many items that must reflow, use `.grid`.
7. **Headings are big by default.** `h1`–`h3` are *Display*, `h4`–`h6` are *Headline*
   (page-level sizes). For a compact block, retune `font-size`/`font-weight` in a
   scoped rule, or use the text helpers `small-text` / `medium-text` / `large-text`.
8. **No container/max-width utility.** BeerCSS has `.responsive`/`.max` but no
   `.container`; center + cap a column yourself (e.g. `max-width:36rem;margin-inline:auto`).

> **Debug method that ends all these:** open DevTools, read the **Computed** tab for
> `box-sizing`, `width`, `display`, `white-space`, `gap`. A BeerCSS base class is
> almost always the thing overriding you — beat it with a more specific selector,
> don't fight it globally.

---

## 6. Layout system

- **Grid** — `<div class="grid">` with children spanning 12 columns per breakpoint:
  `s1..s12` (small/phone), `m1..m12` (medium/tablet+), `l1..l12` (large/desktop).
  Example one/two columns responsively: `<li class="s12 m6">`. (There is no CSS-grid
  `span N` class — the number *is* the column count.)
- **Row** — `<div class="row">` = a nowrap flex line; align with `left-align` /
  `center-align` / `right-align` / `top-align` / `middle-align` / `bottom-align`.
- **Breakpoint visibility** — `s`, `m`, `l` (and `small-device`/`medium-device`/
  `large-device`) show/apply an element only in that band; used on nav drawers.
- **Responsive element** — `.responsive` makes an element (button, image, video,
  `<main>`) fill its container width.
- **Positioning** — `absolute` or `fixed` + edges/side: `left right top bottom
  center middle front back`. `max` = grow to available space.
- **Sizing helpers** — `tiny small medium large extra` (component scale),
  `max small-width medium-width large-width small-height medium-height large-height`,
  `wrap` / `no-wrap`.

---

## 7. Component reference (tag + base class + modifiers)

Modifiers listed are the common ones; full helper set in §8.

- **Button / FAB** — `<button class="button">…</button>`. Modifiers: `small medium
  large extra`, `border`, `round`/`circle`/`square`, `fill`/`extend`/`none`,
  `responsive` (full-width), `horizontal`/`vertical`, `left`/`right`/`top`/`bottom`.
  FAB: `<a class="circle">` icon button; container-less links use `<a class="button">`.
- **Card** — write `<article>…</article>`. **Heads-up: 3.7.12 has no `.card`
  class** — the surface (`padding: 1rem`, `background: --surface-container-low`,
  `box-shadow: var(--elevate1)`, `border-radius: .75rem`) is a **plain `article`
  ELEMENT style**, so the effect comes from the tag, not any class; `class="card"`
  is decorative only. Sizes via helpers (`small/medium/large`), `no-padding`,
  `round`/`no-round`, `elevate*`; add these classes to the `<article>`.
- **Badge / Chip** — `<span class="badge">` / `<span class="chip">` with `left/right/
  top/bottom`, shape (`circle`/`square`/`round`), `border`, `small/medium/large`,
  `horizontal/vertical` (chip).
- **Field (input/textarea/select)** — a `.field` wrapper + a real control:
  ```html
  <div class="field label border">
    <input placeholder=" " id="name" /><label for="name">Name</label>
  </div>
  ```
  Modifiers: `border`/`fill`/`round`, `small/medium/large/extra`, `prefix`/`suffix`,
  `textarea`, `label`. The `label` + empty `placeholder=" "` trick animates the label.
- **Nav / drawer / bottom-nav** — `<nav>` with `left`/`right`/`top`/`bottom`,
  `drawer` (slide-in), breakpoint `s`/`m`/`l`, `border`, alignment helpers.
  Bottom app bar: `<nav class="bottom s">`.
- **Menu / dropdown** — `<menu class="max">` with `<li>` items; toggle by adding the
  `active` class (JS helper `ui("anchor")`/`ui("dropdown")` for smart positioning).
- **Dialog / modal** — `<dialog>` + `active` to open; `modal` (scrim), placement
  `left/right/top/bottom`, sizes `small/medium/large`, `max`, `round`, `border`.
- **Tabs** — `<div class="tabs"><a>…</a></div>` + `horizontal`/`vertical`, `min`/`max`,
  alignment; JS switches the `active` tab.
- **Table** — `<table>` + `stripes`/`border`, spacing `no-space`/`small-space`…,
  `min`/`fixed`, alignments.
- **Progress / loader** — `<progress>` (linear) or `class="circle"` (indeterminate
  ring), sizes `small/medium/large`.
- **Snackbar / tooltip** — `<div class="snackbar">` and `<div class="tooltip">` (or a
  `data=` tooltip), toggled with `active` and positioned `top`/`bottom`/`left`/`right`.
- **Selection controls** — `<label><input type="radio|checkbox|switch"> …</label>` —
  the `<label>` carries `radio`/`checkbox`/`switch` to render the MD3 control. Slider:
  `<input type="range">`.
- **Media** — `<img class="circle|round|responsive">`, `<video>` same modifiers;
  `<div class="responsive">` crop area.
- **Expansion** — native `<details><summary>` styled automatically.

---

## 8. Helper index (the class inventory)

Stack these on any element. Names are exact BeerCSS classes.

- **Alignments** `left-align right-align center-align top-align bottom-align middle-align`
- **Blurs** `blur small-blur medium-blur large-blur light dark`
- **Directions** `horizontal vertical`
- **Dividers** `divider small-divider medium-divider large-divider`
- **Elevates** `elevate small-elevate medium-elevate large-elevate no-elevate`
- **Forms** (shape/variant) `border no-border circle square none fill extend drawer
  round no-round small-round medium-round large-round left-round right-round top-round
  bottom-round`
- **Margins** `margin no-margin auto-margin tiny-margin small-margin medium-margin
  large-margin left-margin right-margin top-margin bottom-margin horizontal-margin
  vertical-margin`
- **Opacities** `opacity no-opacity small-opacity medium-opacity large-opacity`
- **Paddings** `padding no-padding auto-padding tiny-padding small-padding
  medium-padding large-padding left-padding right-padding top-padding bottom-padding
  horizontal-padding vertical-padding`
- **Positions** `left right center top bottom middle front back`
- **Responsive** `responsive small-device medium-device large-device s m l`
- **Scrolls** `scroll no-scroll`
- **Shadows** `shadow left-shadow right-shadow top-shadow bottom-shadow`
- **Sizes** `tiny small medium large extra wrap no-wrap max small-width medium-width
  large-width small-height medium-height large-height`
- **Spaces** `space no-space small-space medium-space large-space` *(these set the
  `---gap` var that drives both the `.grid` gap and its track calc — see §5.5)*
- **Theme (color/role classes)** `light dark primary primary-text primary-border
  primary-container secondary… tertiary… error… background surface surface-variant
  inverse-surface inverse-primary black black-text white white-text transparent
  transparent-text` *(apply a role as text vs fill via the `-text`/`-border` suffix)*
- **Typography** `italic bold underline overline upper lower capitalize link
  small-text medium-text large-text` (+ `h1`…`h6` for heading sizes)
- **Triggers** `active` (opens menus/dialogs/snackbars/tooltips)
- **Waves** `wave no-wave light dark` (ripple; needs JS)

### Named color palette (helper classes)
Beyond the semantic roles, BeerCSS ships a fixed palette you can use as fill /
`-text` / `-border`. Names follow the pattern:

```
<color>1 … <color>10 | <color> | <color>-border | <color>-text
```

for `amber blue blue-grey brown cyan deep-orange deep-purple green grey indigo
light-blue light-green lime orange pink purple red teal yellow`.
Prefer the **semantic role** classes/vars (they theme with light/dark); use named
palette colors only for genuinely fixed hues.

---

## 9. Full design-token list

Colors (roles): `--primary --on-primary --primary-container --on-primary-container`
`--secondary --on-secondary --secondary-container --on-secondary-container`
`--tertiary --on-tertiary --tertiary-container --on-tertiary-container`
`--error --on-error --error-container --on-error-container`
`--background --on-background --surface --on-surface --surface-variant
--on-surface-variant --surface-dim --surface-bright --surface-container
--surface-container-low --surface-container-lowest --surface-container-high
--surface-container-highest --outline --outline-variant --inverse-surface
--inverse-on-surface --inverse-primary`
Effects/misc: `--shadow --scrim --overlay --active`
Config: `--size --font --font-icon --elevate1 --elevate2 --elevate3 --speed1 --speed2
--speed3 --speed4`

Override the *config* and *color* tokens in `:root, body.light` / `body.dark` (§4).

---

## 10. AI quick-decision cheatsheet ("I want X → use Y")

- full-width button → `class="button responsive"` (or `width:100%` **and** scoped
  `box-sizing:border-box`)
- round avatar / icon button → `.circle` + override `width/height` in CSS if you need
  it bigger than 48px
- card / elevated panel → `<article class="elevate2 round">` (**an `article`
  element**, not a `.card` class — see §7 Card)
- responsive N-up columns → `<div class="grid">` + `s12 m6 l3` children; tune
  gutters with a `*-space` class or by setting `---gap` (**never** `gap` alone)
- horizontal toolbar of short controls → `<div class="row center-align">`
- primary/secondary button color → rely on the theme tokens; add `border` for
  outline style
- dark mode → set `body.dark` (OS-sync script if you want `auto`)
- brand color only, static → override `--primary` + `--on-primary` (+ containers) in
  `:root, body.light` and `body.dark`
- everything denser/roomier → change `--size`
- icons → `<i>ligature_name</i>`; set `--font-icon` style
- text emphasis sizes → `small-text` / `medium-text` / `large-text` (don't rely on
  `h1..h6` for small UI labels)
- interactive widget (tabs/menu/dialog/drawer) → add `beer.min.js`; toggle `active`,
  or call `ui("dropdown")` / `ui("anchor")`
- **stuck styling** → read DevTools **Computed**; a base BeerCSS class is overriding
  your attribute/global rule; fix with a more specific selector, colors only via tokens.

---

*Official site & playground: <https://www.beercss.com>. Package: `beercss` on npm.*
