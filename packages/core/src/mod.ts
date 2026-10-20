/**
 * @file mod.ts
 * @description Public entry point for `@vanaware/linklist` — the importable,
 * side-effect-free surface of the package (the executable bootstrap lives in
 * `entry.ts`, which buildit bundles into `linklist.js`; importing this module
 * never fetches or renders anything).
 *
 * The core is pure: it exposes the config schema (types) and the validator
 * (`lib/schema.ts`), the client rendering runtime (Preact components + signals),
 * the theme helpers (`lib/theme.ts`), the SEO/head builders (`lib/seo.ts`) and the
 * static-file generators (`lib/generate.ts`) that bake a config into
 * `index.html` / `manifest.json` / `robots.txt`. The `linklist` CLI (`cli.ts` —
 * build + validate) is exported as command objects; importing them never runs
 * anything. The browser entry (`entry.ts`, not exported here) is the only module
 * with import-time side effects.
 */

export type {
  AnalyticsConfig,
  ContentSection,
  LinkItem,
  LinklistConfig,
  PluginsConfig,
  Profile,
  SeoConfig,
  ThemeConfig,
  ThemeTokens,
} from "./lib/types.ts";

export { configType, parseAndValidate, validateConfig, } from "./lib/schema.ts";
export type {
  ValidationFailure,
  ValidationResult,
  ValidationSuccess,
} from "./lib/schema.ts";

// Rendering runtime (Preact + Signals + BeerCSS markup).
export {
  renderInlineMarkdown,
  renderMarkdown,
} from "./components/markdown.ts";
export {
  computed,
  configSignal,
  linksSignal,
  setConfig,
  signal,
  themeSignal,
} from "./components/state.ts";
export { App, } from "./components/App.ts";
export type { AppProps, } from "./components/App.ts";
export { BrandIcon, } from "./components/BrandIcon.ts";
export { ContentSection as ContentSectionView, } from "./components/ContentSection.ts";
export { Footer, } from "./components/Footer.ts";
export { LinkList, LinkRow, } from "./components/LinkList.ts";
export { MarkdownText, } from "./components/MarkdownText.ts";
export { ProfileHeader, } from "./components/ProfileHeader.ts";

// Static metadata builders (pure string helpers; no filesystem access).
export {
  presetVariable,
  readableInk,
  readableLink,
  resolveThemeCss,
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

// Plugin contract + orchestration (runs at build for SaaS, in the browser for
// the static site; the network always stays injected, never a global).
export { mergePluginOutputs, runPlugins, } from "./plugins/engine.ts";
export type {
  LinklistPlugin,
  PluginContext,
  PluginOutput,
} from "./plugins/engine.ts";

// Built-in plugins (the default data contributions core ships with).
export { builtinPlugins, githubReposPlugin, } from "./plugins/mod.ts";

// Build/validate CLI (Cliffy command objects; parsing only runs via `deno run`).
export {
  buildCommand,
  buildSiteFiles,
  linklistCommand,
  validateCommand,
} from "./cli.ts";
