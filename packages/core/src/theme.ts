/**
 * @file theme.ts
 * @description Pure theme helpers. `core` never touches the filesystem: the host
 * (the browser entry `entry.ts`) fetches the selected preset's CSS (from
 * `packages/core/themes`) and passes it here so `config.theme.custom` token overrides
 * and the color-scheme mode are turned into a small CSS block. The same function
 * is reused by the future SaaS tier.
 */
import type { ThemeConfig, ThemeTokens, } from "./types.ts";

/** Shadow presets mapped to concrete values. */
const SHADOWS: Record<NonNullable<ThemeTokens["shadow"]>, string> = {
  none: "none",
  small: "0 1px 2px rgba(0,0,0,0.12), 0 1px 3px rgba(0,0,0,0.10)",
  medium: "0 6px 16px rgba(0,0,0,0.14)",
  large: "0 14px 32px rgba(0,0,0,0.22)",
};

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
 * import { readableInk } from "@vanaware/linklist-core";
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

/**
 * Pick a text-color variant of `color` that stays readable on `background`:
 * keep the original hue when it already clears `min` contrast, otherwise
 * blend it toward black (on light backgrounds) or white (on dark ones) in
 * 5% steps until it does. Used by presets for link text, icons and focus
 * rings, where a brand color chosen for a dark surface would otherwise turn
 * invisible on a light one. Unparsable colors fall back to `color`.
 *
 * @param color - The brand color (hex) to render as text.
 * @param background - The surface (hex) the text sits on.
 * @param min - Minimum WCAG contrast ratio. Defaults to `4.5` (AA body text).
 * @returns A hex color (possibly the input unchanged).
 * @example
 * ```ts
 * import { readableLink } from "@vanaware/linklist-core";
 * readableLink("#a78bfa", "#f5f6fb"); // darkened toward black, >= 4.5:1
 * readableLink("#4f46e5", "#0e0f13"); // already readable -> returned as-is
 * ```
 */
export function readableLink(
  color: string,
  background: string,
  min = 4.5,
): string {
  const c = hexToRgb(color,);
  const bg = hexToRgb(background,);
  if (!c || !bg) return color;
  const bgLum = luminance(bg,);
  const toward: [number, number, number,] = bgLum > 0.5
    ? [0, 0, 0,]
    : [255, 255, 255,];
  let current = c;
  for (let step = 0; step <= 20; step++) {
    if (contrastRatio(luminance(current,), bgLum,) >= min) {
      return rgbToHex(current,);
    }
    current = blend(toward, c, (step + 1) * 0.05,);
  }
  return rgbToHex(current,);
}

/**
 * Convert `config.theme.custom` tokens into a `:root { … }` CSS override block.
 * Tokens are namespaced as `--ll-*` so they never collide with the CSS custom
 * properties BeerCSS owns (`--surface`, `--primary`, …) — the preset reads these
 * namespaced vars, guaranteeing brand overrides win in every color mode. Only the
 * tokens that are present are emitted. Returns an empty string when there is
 * nothing to override.
 *
 * @param tokens - Optional token overrides from the theme config.
 * @param fallbackBackground - Page background parsed from the preset (used to
 * derive `--ll-link` when `custom.background_color` is not set).
 * @returns A CSS string (possibly empty).
 * @example
 * ```ts
 * import { tokensToCss } from "@vanaware/linklist-core";
 * tokensToCss({ primary_color: "#ff0066", radius: "18px" });
 * ```
 */
export function tokensToCss(
  tokens?: ThemeTokens,
  fallbackBackground?: string,
): string {
  if (!tokens) return "";
  const entries: [string, string | undefined,][] = [
    ["--ll-primary", tokens.primary_color,],
    // A custom primary must never strand its label below AA contrast: derive
    // the on-primary ink from the chosen color instead of trusting the preset.
    [
      "--ll-on-primary",
      tokens.primary_color ? readableInk(tokens.primary_color,) : undefined,
    ],
    [
      "--ll-link",
      tokens.primary_color
        ? readableLink(
          tokens.primary_color,
          tokens.background_color ?? fallbackBackground ?? "#ffffff",
        )
        : undefined,
    ],
    ["--ll-background", tokens.background_color,],
    ["--ll-text", tokens.text_color,],
    ["--ll-font-family", tokens.font_family,],
    ["--ll-radius", tokens.radius,],
    ["--ll-shadow", tokens.shadow ? SHADOWS[tokens.shadow] : undefined,],
  ];
  const decls = entries
    .filter(([, value,],) => Boolean(value,))
    .map(([prop, value,],) => `  ${prop}: ${value};`)
    .join("\n",);
  return decls ? `:root {\n${decls}\n}` : "";
}

/**
 * Read one custom property value (e.g. `--ll-background`) from a preset's
 * CSS, as long as it is a plain hex color. Used to feed the preset's own
 * background into the `--ll-link` derivation when the user only overrides
 * `primary_color`. Returns undefined for absent or non-hex values.
 */
export function presetVariable(
  presetCss: string,
  property: string,
): string | undefined {
  const match = new RegExp(
    `${property.replace(/-/g, "\\-",)}\\s*:\\s*(#[0-9a-fA-F]{3,8})`,
  ).exec(presetCss,);
  return match?.[1];
}

/**
 * Resolve the full theme CSS: the preset base (read by the caller) plus any
 * token overrides, joined into a single stylesheet string.
 *
 * @param theme - The theme configuration block.
 * @param presetCss - CSS text for the selected preset (empty if none).
 * @returns The merged CSS to inline into the page.
 */
export function resolveThemeCss(
  theme: ThemeConfig,
  presetCss: string,
): string {
  const overrides = tokensToCss(
    theme.custom,
    presetVariable(presetCss, "--ll-background",),
  );
  return [presetCss.trim(), overrides,].filter(Boolean,).join("\n\n",);
}

/**
 * Map `theme.mode` to a BeerCSS body class (`auto` | `light` | `dark`).
 *
 * @param theme - The theme configuration block.
 * @returns A single CSS class name for the `<body>` element.
 */
export function themeBodyClass(theme?: ThemeConfig,): string {
  return theme?.mode ?? "auto";
}

/**
 * The `theme-color` meta value: the configured primary color when present,
 * otherwise a sensible Material default.
 */
export function themeColor(theme?: ThemeConfig,): string {
  return theme?.custom?.primary_color ?? "#6750a4";
}
