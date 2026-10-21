/**
 * @file brand.ts
 * @description The single source of truth for the footer brand line so the
 * runtime Preact `Footer` and the build-time `<noscript>` fallback never drift.
 * Pure string helper — no I/O, no clock.
 */

/** The human-readable product name used in the brand line. */
export const BRAND_NAME = "linklist";

/**
 * Build the "Made with linklist · vN" footer brand text.
 *
 * `version` is the **package** version (stamped at build from
 * `packages/core/deno.jsonc`), never the content date. It may carry a leading
 * `v`; that is normalized away and re-added so a double `vv` never appears, and
 * an empty/unknown version degrades gracefully to just the product name.
 *
 * @param version - The raw package version string (e.g. `"v0.2.5"`).
 * @returns The brand line to render.
 * @example
 * ```ts
 * import { brandText } from "./brand.ts";
 * brandText("0.2.5"); // "Made with linklist · v0.2.5"
 * brandText(""); // "Made with linklist"
 * ```
 */
export function brandText(version = "",): string {
    const clean = version.replace(/^v/, "",);
    return clean
        ? `Made with ${BRAND_NAME} · v${clean}`
        : `Made with ${BRAND_NAME}`;
}
