# Theming

linklist styles the page with **BeerCSS** (Material Design 3) and a small set of theme
presets. A theme is chosen entirely from `config.theme` — you never hand-write CSS to
customize a stock page.

## Choosing a preset

```jsonc
{
  "theme": {
    "preset": "minimal-dark",   // a CSS file in packages/core/themes
    "mode": "auto"              // "light" | "dark" | "auto" (default)
  }
}
```

The bundled presets — pick one as `theme.preset`:

| Preset | Feel / when to choose it | Preview |
| --- | --- | --- |
| `minimal-dark` | Dark, high-contrast, calm surfaces. Choose it for night-friendly brands and vivid accent colors. | ![minimal-dark theme](assets/screenshots/theme-minimal-dark.png) |
| `light-simple` | Light, neutral, generous whitespace. Choose it for print-like, editorial or corporate pages. | ![light-simple theme](assets/screenshots/theme-light-simple.png) |

How to choose:

- **They differ only in palette.** Layout, components, responsive behavior (single
  column on phones, two-column cards ≥ 48rem) and the WCAG AA contrast guards are
  shared, so pick by look, not by capability.
- **Switching needs no rebuild.** The browser fetches `./<preset>.css` and
  `./config.json` at runtime: edit `theme.preset`, save, reload — done.
- **`mode` is a hint, not the theme.** The preset decides the page colors; `mode`
  only sets the `<body>` class BeerCSS uses for its own controls plus browser UI
  (scrollbars, form widgets). Set it to match the preset's lightness
  (`light-simple` → `"light"`, `minimal-dark` → `"dark"`) or leave `"auto"`.
- **Not listed? It is a file away.** Any `<name>.css` dropped into
  `packages/core/themes` becomes selectable as `"<name>"` — see
  [Adding a new preset](#adding-a-new-preset).

At runtime the browser entry (`packages/core/src/entry.ts`) applies the theme:

1. sets `<body class="…">` from `theme.mode` (`auto` / `light` / `dark`);
2. fetches `./<preset>.css` from the deployed folder;
3. merges your `theme.custom` token overrides on top of the preset;
4. injects the result into a single `<style id="linklist-theme">` in the document head.

## Token overrides

`theme.custom` emits CSS variables on `:root` for only the tokens you set, so you can
recolor and reshape a preset without touching a stylesheet:

```jsonc
{
  "theme": {
    "preset": "minimal-dark",
    "custom": {
      "primary_color": "#a78bfa",
      "background_color": "#0f0f12",
      "text_color": "#e8e8ea",
      "font_family": "system-ui, sans-serif",
      "radius": "12px",
      "shadow": "medium"
    }
  }
}
```

| Token | Maps to | Example |
| --- | --- | --- |
| `primary_color` | `--ll-primary` (also the `theme-color` meta) | `"#a78bfa"` |
| `background_color` | `--ll-background` | `"#0f0f12"` |
| `text_color` | `--ll-text` | `"#e8e8ea"` |
| `font_family` | `--ll-font-family` (defaults to the system stack) | `"Inter, system-ui"` |
| `radius` | `--ll-radius` | `"16px"` |
| `shadow` | `--ll-shadow` | `"none" \| "small" \| "medium" \| "large"` |

Tokens are namespaced `--ll-*` on purpose: BeerCSS owns the Material role
variables (`--surface`, `--primary`, …) and redefines them per color mode, so
overriding those names directly would silently lose to the framework.

Two contrast guards run automatically when you set `primary_color`:

- `--ll-on-primary` (button/fill labels) flips to dark or light ink, whichever
  is readable on your color (`readableInk`).
- `--ll-link` (link text, icon tints, focus rings) is your color blended toward
  black or white just enough to reach WCAG AA 4.5:1 against the page background
  (`readableLink`) — so a lavender that looks great on `minimal-dark` stays
  legible on `light-simple`.

## Adding a new preset

Drop a `<name>.css` file into `packages/core/themes/`. The build copies every file in that
folder into the deployed output, so it becomes selectable as `theme.preset: "<name>"` with
no code change. A preset should define the `--ll-*` role tokens on `:root` and style the
component classes used by core (`.linklist`, `.profile`, `.links`/`.link`, `.link-icon`,
`.section`, `.footer` — copy an existing preset as a starting point). Include the
BeerCSS landmark reset from the bundled presets: the framework paints bare
`header`/`footer` elements with a light `--surface-container` and constrains `nav`/`ul`
sizing.

> Theme customization is config-only for now: presets plus `theme.custom` tokens. Runtime
> third-party theme scripts are intentionally deferred until the engine is stable.
