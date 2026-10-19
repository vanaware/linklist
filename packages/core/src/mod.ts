/**
 * @file mod.ts
 * @description Public entry point for `@vanaware/linklist-core`.
 *
 * The core is pure: it exposes the config schema (types) and the validator
 * (`schema.ts`), the client rendering runtime (Preact components + signals),
 * theme/markdown/SEO helpers, and the runtime head injection (`head.ts`). It
 * performs no filesystem or network access; the browser entry (`entry.ts`, not
 * exported here) is the only DOM-aware module and is bundled by buildit.
 */

export type {
  AnalyticsConfig,
  ContentSection,
  IO,
  LinkItem,
  LinklistConfig,
  PluginsConfig,
  Profile,
  SeoConfig,
  ThemeConfig,
  ThemeTokens,
} from "./types.ts";

export { configType, parseAndValidate, validateConfig, } from "./schema.ts";
export type {
  ValidationFailure,
  ValidationResult,
  ValidationSuccess,
} from "./schema.ts";

// Rendering runtime (Preact + Signals + BeerCSS markup).
export { renderInlineMarkdown, renderMarkdown, } from "./markdown.ts";
export {
  computed,
  configSignal,
  linksSignal,
  setConfig,
  signal,
  themeSignal,
} from "./state.ts";
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
} from "./theme.ts";
export {
  buildHead,
  buildJsonLd,
  escapeHtml,
  faviconDataUri,
  safeJson,
} from "./seo.ts";

// Runtime head injection (browser DOM; safe to import in tests).
export { applyHead, headFragment, } from "./head.ts";

// Plugin contract + orchestration (runs at build for SaaS, in the browser for
// the static site; the network always stays injected, never a global).
export { mergePluginOutputs, runPlugins, } from "./plugin.ts";
export type { LinklistPlugin, PluginContext, PluginOutput, } from "./plugin.ts";

// Built-in plugins (the default data contributions core ships with).
export { builtinPlugins, githubReposPlugin, } from "./plugins/mod.ts";

/** Core package version; kept in sync with the workspace by the build tooling. */
export const CORE_VERSION = "0.1.0";
