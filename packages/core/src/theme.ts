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
  small: "0 1px 3px rgba(0, 0, 0, 0.18)",
  medium: "0 3px 10px rgba(0, 0, 0, 0.22)",
  large: "0 8px 28px rgba(0, 0, 0, 0.28)",
};

/**
 * Convert `config.theme.custom` tokens into a `:root { … }` CSS override block.
 * Only the tokens that are present are emitted. Returns an empty string when
 * there is nothing to override.
 *
 * @param tokens - Optional token overrides from the theme config.
 * @returns A CSS string (possibly empty).
 * @example
 * ```ts
 * import { tokensToCss } from "@vanaware/linklist-core";
 * tokensToCss({ primary_color: "#ff0066", radius: "18px" });
 * ```
 */
export function tokensToCss(tokens?: ThemeTokens,): string {
  if (!tokens) return "";
  const entries: [string, string | undefined,][] = [
    ["--primary", tokens.primary_color,],
    ["--background", tokens.background_color,],
    ["--text", tokens.text_color,],
    ["--font-family", tokens.font_family,],
    ["--radius", tokens.radius,],
    ["--shadow", tokens.shadow ? SHADOWS[tokens.shadow] : undefined,],
  ];
  const decls = entries
    .filter(([, value,],) => Boolean(value,))
    .map(([prop, value,],) => `  ${prop}: ${value};`)
    .join("\n",);
  return decls ? `:root {\n${decls}\n}` : "";
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
  const overrides = tokensToCss(theme.custom,);
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
