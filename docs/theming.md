# Theming

linklist styles the page with **pure [BeerCSS](beercss.md)** (Material Design 3).
Colors, components and the light/dark palettes come from BeerCSS itself. A small
shared layout stylesheet (`linklist-base.css`) adds only what BeerCSS utilities
cannot express for a link-in-bio page, and brand "skin" presets override just
BeerCSS's color tokens. You never hand-write CSS to customize a stock page.

## Dark / light / auto (BeerCSS-native)

Mode uses BeerCSS's own mechanism: `body.dark` selects the dark palette and
`body.light` (or no class) the light one.

```jsonc
{
  "theme": {
    "preset": "violet",
    "mode": "auto" // "light" | "dark" | "auto" (default)
  }
}
```

- **`dark` / `light`** — baked into `<body class="…">` at build time.
- **`auto`** — BeerCSS has no `auto` class, so a tiny inline script in the head
  sets `body.dark` from `prefers-color-scheme` before the first paint (no flash),
  and the browser entry (`entry.ts`) keeps it in sync live when the OS theme
  changes.

Because this is real BeerCSS theming, **every** component follows the mode —
including interactive [islands](islands.md), which are just BeerCSS markup.

## Choosing a preset (brand skin)

A preset is a **brand skin**: it overrides only BeerCSS color tokens
(`--primary`, `--on-primary`, `--primary-container`, `--on-primary-container`) —
for light (`:root`) and dark (`body.dark`) separately. It never touches surfaces,
radius or elevation, which BeerCSS owns per mode.

| Skin | Brand color | Try it when |
| --- | --- | --- |
| `violet` | Violet / lavender — `#7c4dff` (light), `#c4b5fd` (dark) | Expressive, purple personal brands. |
| `indigo` | Indigo — `#4f46e5` (light), `#a5b4fc` (dark) | Blue-neutral, corporate or editorial. |

Switching is config-only: edit `theme.preset`, rebuild and reload. Any
`<name>.css` dropped into `packages/core/themes/` becomes selectable as
`theme.preset: "<name>"` — see [Adding a brand skin](#adding-a-brand-skin).

The generated page `<head>` always links the same chain:

```
beer.min.css → linklist-base.css → ./<preset>.css → Material Symbols
```

At runtime `entry.ts` inlines only `theme.custom` as a small `:root { … }` token
block into `<style id="linklist-theme">`, layered over the preset.

## Brand overrides (`theme.custom`)

`theme.custom` maps straight onto BeerCSS design tokens, so you can recolor a
skin without editing any CSS:

```jsonc
{
  "theme": {
    "preset": "violet",
    "custom": {
      "primary_color": "#a78bfa",
      "font_family": "Inter, system-ui, sans-serif"
    }
  }
}
```

| Token | Maps to | Notes |
| --- | --- | --- |
| `primary_color` | `--primary` + `--on-primary` | `--on-primary` is auto-picked for AA contrast (`readableInk`); the `theme-color` meta and manifest color derive from it. |
| `font_family` | `--font` | Any CSS font stack; no webfont is fetched. |

> Under pure BeerCSS the page background, text color, radius and elevation are
> owned by the framework per light/dark mode, so they are intentionally **not**
> exposed as overrides. The old namespaced `--ll-*` token system was removed with
> this migration.

## Adding a brand skin

Drop a `<name>.css` into `packages/core/themes/`; the build copies the whole
folder into the output, so it becomes selectable as `theme.preset: "<name>"` with
no code change. A skin overrides only BeerCSS color tokens, once for light and
once for dark:

```css
:root {
  --primary: #7c4dff;
  --on-primary: #ffffff;
  --primary-container: #eaddff;
  --on-primary-container: #21005d;
}
body.dark {
  --primary: #c4b5fd;
  --on-primary: #1e1b2e;
  --primary-container: #4f378a;
  --on-primary-container: #e9ddff;
}
```

Copy `violet.css` as a starting point. Layout, the landmark reset, full-width
link buttons and vertical rhythm all live in `linklist-base.css` — keep the skin
to brand **color** only. Static CSS cannot run `readableInk`, so pick the dark
tone by hand so the brand stays readable on the dark palette.

> For the full list of BeerCSS classes and tokens, see the bundled
> [BeerCSS API reference](beercss.md).
