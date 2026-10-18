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
      "primary_color": "#8b5cf6",
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
| `primary_color` | `--primary` (also the `theme-color` meta) | `"#8b5cf6"` |
| `background_color` | `--background` | `"#0f0f12"` |
| `text_color` | `--text` | `"#e8e8ea"` |
| `font_family` | `--font-family` (defaults to the system stack) | `"Inter, system-ui"` |
| `radius` | `--radius` | `"16px"` |
| `shadow` | `--shadow` | `"none" \| "small" \| "medium" \| "large"` |

## Adding a new preset

Drop a `<name>.css` file into `packages/core/themes/`. The build copies every file in that
folder into the deployed output, so it becomes selectable as `theme.preset: "<name>"` with
no code change. A preset should style the component classes used by core (`link-row`,
`footer`, the profile header, etc.) — copy an existing preset as a starting point.

> Theme customization is config-only for now: presets plus `theme.custom` tokens. Runtime
> third-party theme scripts are intentionally deferred until the engine is stable.
