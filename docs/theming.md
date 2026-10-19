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

The bundled presets are:

| Preset | Feel |
| --- | --- |
| `minimal-dark` | Dark, high-contrast, calm surfaces. |
| `light-simple` | Light, neutral, generous whitespace. |

| minimal-dark | light-simple |
| --- | --- |
| ![minimal-dark theme](assets/screenshots/theme-minimal-dark.png) | ![light-simple theme](assets/screenshots/theme-light-simple.png) |

Both presets are responsive: a single centered column on phones and tablet
widths, and on desktops (≥ 48rem) a wider column with the link cards flowing
in a two-column grid.

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
