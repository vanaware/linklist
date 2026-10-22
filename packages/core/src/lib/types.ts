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

/** Profile fields the reader may hide on screen (`name` is always shown). */
export type ProfileField = "tagline" | "bio" | "avatar" | "location";

/**
 * Identity block: rendered at the top of the page AND the source of the
 * document `<head>` metadata. Screen fields (`name`/`tagline`/`bio`/`avatar`/
 * `location`) are gated by `hide`; the remaining fields are head-only
 * overrides that fall back to the identity fields (see `lib/seo.ts`).
 */
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
  /** Fields to hide on screen. Data still feeds the SEO head/manifest. */
  hide?: ProfileField[];
  /** Document `<title>`; head-only. Defaults to `name`. */
  title?: string;
  /** Meta + OG description; head-only. Defaults to `tagline`. */
  description?: string;
  /** Social preview image; head-only. Defaults to `avatar`. */
  image?: string;
  /** Canonical/site base URL; head-only. */
  url?: string;
  /** Twitter handle for `twitter:site`; head-only. */
  twitter?: string;
  /** Document `lang` attribute; head-only. Defaults to "en". */
  lang?: string;
  /** Favicon path/URL; head-only, else a generated inline-SVG favicon. */
  favicon?: string;
}

/** A single entry in the link list. Presentation lives on the block's `format`. */
export interface LinkItem {
  /** Link label (visible text). Required. */
  title: string;
  /** Destination URL. Required, must be a valid absolute URL. */
  url: string;
  /** Bundled brand icon name (e.g. "github", "youtube"). Optional. */
  icon?: string;
  /** Thumbnail image (path/URL) shown in place of `icon`. Optional. */
  image?: string;
  /** Alt text for `image`. REQUIRED whenever `image` is set (a11y). */
  image_alt?: string;
  /** Optional secondary line under the title. */
  subtitle?: string;
  /** Open in a new tab (adds rel="noopener"). Defaults to false. */
  new_tab?: boolean;
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

/** Optional footer note (the "Made with linklist" brand line always shows). */
export interface FooterConfig {
  /** Show the "Last updated" note line (needs `updated` or a `label`). Default false. */
  show_last_updated?: boolean;
  /**
   * The **content** last-updated date as `YYYY-MM-DD` (author-maintained). This is
   * deliberately NOT the package/build date — it is when the page content changed.
   */
  updated?: string;
  /** Optional Markdown note overriding the auto "Last updated <date>" line. */
  label?: string;
}

/** A user-authored content block (Markdown body) inside the `blocks` flow. */
export interface ContentSection {
  /** Optional heading shown above the body. */
  title?: string;
  /** Markdown body, rendered by the app (see `components/markdown.ts`). */
  body?: string;
}

/**
 * The predefined block presentations an author picks from with `block.format`.
 * Each format implies the content fields it needs (link → url/title, text →
 * body, figure → image); the validator maps it to the matching render shape
 * below.
 */
export type BlockFormat =
  | "row"
  | "button"
  | "card"
  | "text"
  | "figure";

/** Ordered-flow block: a single link, presented per its `format`. */
export interface LinkBlock {
  /** Block discriminant (assigned by the validator from `format`). */
  type: "link";
  /** Predefined presentation: a plain row, a filled button, or a card. */
  format: "row" | "button" | "card";
  /** The link's data. */
  link: LinkItem;
}

/** Ordered-flow block: a Markdown content section, inline with the links. */
export interface SectionBlock {
  /** Block discriminant. */
  type: "section";
  /** Optional heading shown above the body. */
  title?: string;
  /** Markdown body. */
  body?: string;
}

/** Ordered-flow block: a standalone image/figure with an optional caption. */
export interface ImageBlock {
  /** Block discriminant (assigned by the validator's block classifier). */
  type: "image";
  /** Image path (relative, copied at build) or absolute URL. */
  image: string;
  /** Alt text. Required (a11y). */
  image_alt: string;
  /** Optional caption shown under the image. */
  caption?: string;
}

/** One item of the page's ordered content (`config.blocks`). */
export type Block = LinkBlock | SectionBlock | ImageBlock;

/** Top-level configuration object for a linklist site (shape v2). */
export interface LinklistConfig {
  /** Optional schema version stamp for forward compatibility. */
  version?: string;
  /** Identity + head metadata: name, tagline, bio, avatar, url, twitter, … */
  profile: Profile;
  /** The page's content in final display order (link / section / image). */
  blocks: Block[];
  /** Preset + mode + token overrides for the page appearance. */
  theme: ThemeConfig;
  /** Optional footer note (last-updated / custom label; brand line is always on). */
  footer?: FooterConfig;
}
