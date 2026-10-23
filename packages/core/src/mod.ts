/**
 * @file mod.ts
 * @description Public entry point for `@vanaware/linklist` — the importable,
 * side-effect-free surface of the package (the executable bootstrap lives in
 * `entry.ts`, which buildit bundles into `linklist.js`; importing this module
 * never fetches or renders anything).
 *
 * The public API is the pure engine: the config types (`lib/types.ts`) and
 * validator (`lib/schema.ts`), the theme helpers (`lib/theme.ts`), the SEO/head
 * builders (`lib/seo.ts`), the static-file generators (`lib/generate.ts`) that
 * bake a config into `index.html` / `manifest.json` / `robots.txt`, and the
 * `linklist` CLI (`cli.ts` — build + validate,
 * exported as command objects; importing them never runs anything).
 *
 * Deliberately NOT public: the Preact rendering runtime (`components/`,
 * `markdown.ts`, `state.ts`) and `configType`. Their npm `preact` /
 * `@preact/signals` / `arktype` type graphs cannot be re-exported as a
 * documented JSR surface (private-type-ref / missing-jsdoc cascade through the
 * upstream `.d.ts`); consume them via the `linklist.js` bundle or monorepo
 * deep imports. `entry.ts` (not exported here) is the only module with
 * import-time side effects.
 */

export type {
  Block,
  BlockFormat,
  ContentSection,
  FooterConfig,
  ImageBlock,
  IslandBlock,
  LinkBlock,
  LinkItem,
  LinklistConfig,
  Profile,
  ProfileField,
  SectionBlock,
  ThemeConfig,
  ThemeTokens,
} from "./lib/types.ts";

export { parseAndValidate, validateConfig, } from "./lib/schema.ts";
export type {
  ValidationFailure,
  ValidationResult,
  ValidationSuccess,
} from "./lib/schema.ts";

// Static metadata builders (pure string helpers; no filesystem access).
export {
  readableInk,
  themeBodyClass,
  themeColor,
  tokensToCss,
} from "./lib/theme.ts";
export {
  buildHead,
  buildJsonLd,
  escapeHtml,
  faviconDataUri,
  safeJson,
} from "./lib/seo.ts";

// Static-site generators: config -> index.html / manifest.json / robots.txt text.
// Pure (no filesystem); the CLI writes these outputs, a server can stream them.
export {
  generateSite,
  renderIndexHtml,
  renderManifest,
  renderRobotsTxt,
} from "./lib/generate.ts";
export type { GeneratedFile, } from "./lib/generate.ts";

// Build/validate CLI (Cliffy; parsing only runs via `deno run`). Only the
// root program and the reusable writer are public: subcommand instances carry
// infeasible generic variance, reach them via `linklistCommand.getCommand()`.
export { buildSiteFiles, linklistCommand, } from "./cli.ts";
