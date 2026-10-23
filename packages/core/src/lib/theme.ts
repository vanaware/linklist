/**
 * @file theme.ts
 * @description Pure theme helpers. Brand customization is expressed as **BeerCSS
 * design tokens**: `config.theme.custom` is turned into a small `:root { … }`
 * block of BeerCSS color variables (`tokensToCss`), while the dark/light/auto
 * mode maps to the BeerCSS `<body>` class (`themeBodyClass`). The shared layout
 * and brand "skin" presets live in `packages/core/themes/` as static CSS that
 * `generate.ts` links and `entry.ts` layers these token overrides on top of.
 */
import type { ThemeConfig, ThemeTokens, } from "./types.ts";

/** Linearize one 8-bit sRGB channel (WCAG relative-luminance input). */
function channelLinear(value: number,): number {
  const s = value / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

/** Parse `#rgb`/`#rrggbb` (leading `#` optional) into an RGB triple. */
function hexToRgb(hex: string,): [number, number, number,] | undefined {
  const match =
    /^#?(?:([0-9a-f])([0-9a-f])([0-9a-f])|([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2}))$/i
      .exec(hex.trim(),);
  if (!match) return undefined;
  const parts = match[1] !== undefined
    ? [match[1], match[2], match[3],]
    : [match[4], match[5], match[6],];
  const [r, g, b,] = parts as [string, string, string,];
  return [
    Number.parseInt(r, 16,),
    Number.parseInt(g, 16,),
    Number.parseInt(b, 16,),
  ];
}

/** WCAG relative luminance (0..1) of an RGB triple. */
function luminance(rgb: [number, number, number,],): number {
  const [r, g, b,] = rgb;
  return 0.2126 * channelLinear(r,) + 0.7152 * channelLinear(g,) +
    0.0722 * channelLinear(b,);
}

/** WCAG contrast ratio between two relative luminances. */
function contrastRatio(a: number, b: number,): number {
  const hi = Math.max(a, b,);
  const lo = Math.min(a, b,);
  return (hi + 0.05) / (lo + 0.05);
}

/**
 * Pick the ink color that stays readable on top of `background`: whichever of
 * `darkInk` / `lightInk` yields the higher WCAG contrast ratio. Used by
 * `tokensToCss` so a custom `primary_color` never strands button text on a
 * low-contrast fill. Unparsable colors fall back to `darkInk`.
 *
 * @param background - The fill color (hex) text will sit on.
 * @param darkInk - Candidate dark text color. Defaults to `"#1e1b2e"`.
 * @param lightInk - Candidate light text color. Defaults to `"#ffffff"`.
 * @returns Either `darkInk` or `lightInk`.
 * @example
 * ```ts
 * import { readableInk } from "@vanaware/linklist";
 * readableInk("#c4b5fd"); // "#1e1b2e" (light fill -> dark ink)
 * readableInk("#171922"); // "#ffffff" (dark fill -> light ink)
 * ```
 */
export function readableInk(
  background: string,
  darkInk = "#1e1b2e",
  lightInk = "#ffffff",
): string {
  const bg = hexToRgb(background,);
  const dark = hexToRgb(darkInk,);
  const light = hexToRgb(lightInk,);
  if (!bg || !dark || !light) return darkInk;
  const bgLum = luminance(bg,);
  return contrastRatio(bgLum, luminance(dark,),) >=
    contrastRatio(bgLum, luminance(light,),)
    ? darkInk
    : lightInk;
}

/** Composite `a` over `b` at alpha `alpha` (both RGB triples). */
function blend(
  a: [number, number, number,],
  b: [number, number, number,],
  alpha: number,
): [number, number, number,] {
  return [
    alpha * a[0] + (1 - alpha) * b[0],
    alpha * a[1] + (1 - alpha) * b[1],
    alpha * a[2] + (1 - alpha) * b[2],
  ];
}

/** Format an RGB triple back into a `#rrggbb` hex string. */
function rgbToHex(rgb: [number, number, number,],): string {
  return `#${rgb.map((v,) => Math.round(v,).toString(16,).padStart(2, "0",)).join("",)
    }`;
}

/** Blend `color` toward white to derive a light tonal container surface. */
function containerTint(color: string,): string {
  const rgb = hexToRgb(color,);
  if (!rgb) return color;
  return rgbToHex(blend(rgb, [255, 255, 255,], 0.15,),);
}

/**
 * Convert `config.theme.custom` tokens into a `:root { … }` block of **BeerCSS
 * design tokens** (`--primary`, `--on-primary`, `--primary-container`,
 * `--on-primary-container`, `--font`). This overrides only the brand color while
 * BeerCSS keeps owning every surface color per light/dark mode. A custom primary
 * never strands its label below AA contrast: `--on-primary` (and the derived
 * container ink) come from `readableInk`. Only the tokens present are emitted;
 * returns an empty string when there is nothing to override.
 *
 * @param tokens - Optional token overrides from the theme config.
 * @returns A CSS string (possibly empty).
 * @example
 * ```ts
 * import { tokensToCss } from "@vanaware/linklist";
 * tokensToCss({ primary_color: "#ff0066" }); // --primary / --on-primary / …
 * ```
 */
export function tokensToCss(tokens?: ThemeTokens,): string {
  if (!tokens) return "";
  const primary = tokens.primary_color;
  const container = primary ? containerTint(primary,) : undefined;
  const entries: [string, string | undefined,][] = [
    ["--primary", primary,],
    // A custom primary must never strand its label below AA contrast: derive
    // the on-primary ink from the chosen color instead of trusting the preset.
    ["--on-primary", primary ? readableInk(primary,) : undefined,],
    ["--primary-container", container,],
    [
      "--on-primary-container",
      container ? readableInk(container,) : undefined,
    ],
    ["--font", tokens.font_family,],
  ];
  const decls = entries
    .filter(([, value,],) => Boolean(value,))
    .map(([prop, value,],) => `  ${prop}: ${value};`)
    .join("\n",);
  return decls ? `:root {\n${decls}\n}` : "";
}

/**
 * Map `theme.mode` to a BeerCSS `<body>` class. BeerCSS has no `auto` class, so
 * `auto` (and the default) yields an empty string: the static head renders the
 * light palette and a small inline script (see `generate.ts` / `entry.ts`) flips
 * `body.dark` from `prefers-color-scheme` before first paint.
 *
 * @param theme - The theme configuration block.
 * @returns `"dark"`, `"light"`, or `""` (auto → resolved at runtime).
 */
export function themeBodyClass(theme?: ThemeConfig,): string {
  const mode = theme?.mode ?? "auto";
  if (mode === "dark") return "dark";
  if (mode === "light") return "light";
  return "";
}

/**
 * The `theme-color` meta value: the configured primary color when present,
 * otherwise a sensible Material default.
 */
export function themeColor(theme?: ThemeConfig,): string {
  return theme?.custom?.primary_color ?? "#6750a4";
}
