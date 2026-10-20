/**
 * @file types.ts
 * @description Canonical, fully-serializable configuration schema for
 * `@vanaware/linklist`. The shape mirrors `config.json` one-to-one so the exact
 * same object can later be stored/served like a database record by the hosted
 * SaaS tier without any translation layer.
 *
 * This module is intentionally dependency-free and side-effect-free: it only
 * declares types. Runtime validation lives in `lib/schema.ts`.
 */

/** Identity block rendered at the top of the page. */
export interface Profile {
  /** Display name (rendered as the page `<h1>`). Required. */
  name: string;
  /** Optional one-line subtitle shown under the name. */
  tagline?: string;
  /** Optional short bio paragraph. */
  bio?: string;
  /** Avatar path (relative, copied at build) or absolute URL. */
  avatar?: string;
  /** Alt text for the avatar. REQUIRED whenever `avatar` is set (a11y). */
  avatar_alt?: string;
  /** Optional location metadata chip. */
  location?: string;
}

/** A single entry in the link list. */
export interface LinkItem {
  /** Link label (visible text). Required. */
  title: string;
  /** Destination URL. Required, must be a valid absolute URL. */
  url: string;
  /** Bundled brand icon name (e.g. "github", "youtube"). Optional. */
  icon?: string;
  /** Optional secondary line under the title. */
  subtitle?: string;
  /** Render as a filled button instead of a plain row. Defaults to false. */
  button?: boolean;
  /** Open in a new tab (adds rel="noopener"). Defaults to false. */
  new_tab?: boolean;
  /** Emphasize visually. Defaults to false. */
  featured?: boolean;
  /** Add rel="nofollow" for SEO control. Defaults to false. */
  nofollow?: boolean;
}

/** Theme token overrides — customize without editing CSS. */
export interface ThemeTokens {
  /** Brand color as a plain hex value (`#rgb` / `#rrggbb` …). */
  primary_color?: string;
  /** Page background as a plain hex value (`#rgb` / `#rrggbb` …). */
  background_color?: string;
  /** Body text color as a plain hex value (`#rgb` / `#rrggbb` …). */
  text_color?: string;
  /** CSS font stack. Defaults to the system stack (no webfont fetch). */
  font_family?: string;
  /** Border radius, e.g. "12px". */
  radius?: string;
  /** Elevation preset. */
  shadow?: "none" | "small" | "medium" | "large";
}

/** Appearance configuration. */
export interface ThemeConfig {
  /** Name of a bundled theme preset, e.g. "minimal-dark". Required. */
  preset: string;
  /** Color scheme behavior. Defaults to "auto" (follows system). */
  mode?: "light" | "dark" | "auto";
  /** Optional token overrides merged on top of the preset. */
  custom?: ThemeTokens;
}

/** SEO and social metadata. */
export interface SeoConfig {
  /** Document `<title>`. Defaults to `profile.name`. */
  title?: string;
  /** Meta + OG description. */
  description?: string;
  /** Social preview image path/URL (1200x630 recommended). */
  image?: string;
  /** Canonical/site base URL, used for sitemap and absolute OG URLs. */
  url?: string;
  /** Twitter handle for `twitter:site` (with or without leading @). */
  twitter?: string;
  /** Document language for the `lang` attribute. Defaults to "en". */
  lang?: string;
  /** Favicon path/URL; else a generated inline SVG favicon is used. */
  favicon?: string;
}

/** Analytics configuration. Everything defaults to disabled (privacy-first). */
export interface AnalyticsConfig {
  /** Analytics provider. Defaults to "none". */
  provider?: "none" | "plausible" | "umami" | "google";
  /** REQUIRED when provider === "plausible". */
  plausible_domain?: string;
  /** REQUIRED when provider === "umami". */
  umami_website_id?: string;
  /** REQUIRED when provider === "google". */
  google_analytics_id?: string;
  /** Optional self-hosted click-count endpoint. Never identifies users. */
  click_counter_endpoint?: string;
}

/** Content plugins (data fetched at build for SaaS, or at runtime in the browser). */
export interface PluginsConfig {
  /** GitHub repos to show stars / latest release for (owner/repo). */
  github_repos?: string[];
  /** YouTube channel id — renders a latest-video card at build time. */
  youtube_channel?: string;
  /** RSS feed URL — renders the latest items at build time. */
  rss_feed?: string;
  /** Number of RSS items to render. Defaults to 3. */
  rss_limit?: number;
  /** Show a "last updated" footer line. Defaults to false. */
  show_last_updated?: boolean;
  /** Optional Markdown for the footer line (defaults to a last-updated note). */
  footer_label?: string;
}

/** A user-authored content block (Markdown body) placed around the links. */
export interface ContentSection {
  /** Optional heading shown above the body. */
  title?: string;
  /** Markdown body, rendered at build (see `markdown.ts`). */
  body?: string;
  /** Placement relative to the link list. Defaults to "after". */
  placement?: "before" | "after";
}

/** Top-level configuration object for a linklist site. */
export interface LinklistConfig {
  /** Optional schema version stamp for forward compatibility. */
  version?: string;
  /** Identity block: name, tagline, bio, avatar. Name is required. */
  profile: Profile;
  /** At least one link is required. */
  links: LinkItem[];
  /** Preset + mode + token overrides for the page appearance. */
  theme: ThemeConfig;
  /** Optional SEO/social metadata (falls back to profile fields). */
  seo?: SeoConfig;
  /** Optional analytics; everything defaults to disabled (privacy-first). */
  analytics?: AnalyticsConfig;
  /** Optional built-in plugin toggles and footer options. */
  plugins?: PluginsConfig;
  /** Optional Markdown content blocks placed before/after the link list. */
  sections?: ContentSection[];
}
