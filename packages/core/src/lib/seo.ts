/**
 * @file seo.ts
 * @description Pure builders for the document head metadata (title, description,
 * canonical, Open Graph, Twitter card, JSON-LD) and the favicon data-URI. Every
 * function here returns strings only — no DOM, no filesystem. The generated head
 * is baked into `index.html` at build time (see `generate.ts`), so crawlers and
 * link-preview scrapers read it without executing JavaScript; the same builders
 * are reused verbatim by the future server tier.
 */
import { themeColor, } from "./theme.ts";
import type { LinklistConfig, } from "./types.ts";

/** Escape a string for safe insertion into HTML text/attribute content. */
export function escapeHtml(value: string,): string {
  return value
    .replace(/&/g, "&amp;",)
    .replace(/</g, "&lt;",)
    .replace(/>/g, "&gt;",)
    .replace(/"/g, "&quot;",)
    .replace(/'/g, "&#39;",);
}

/**
 * Serialize JSON for embedding in a `<script>` block: escapes `<` so a value
 * can never close the surrounding tag.
 */
export function safeJson(value: unknown,): string {
  return JSON.stringify(value,).replace(/</g, "\\u003c",);
}

/** Resolve `url` against `base` when possible, otherwise return it unchanged. */
function absoluteUrl(
  url: string | undefined,
  base: string,
): string | undefined {
  if (!url) return undefined;
  try {
    return new URL(url, base || undefined,).href;
  } catch {
    return url;
  }
}

/**
 * Build a `Person` JSON-LD document (name + avatar + `sameAs` profile links).
 * `base` (e.g. the CLI `--base-url`) resolves relative avatar/url values and
 * doubles as the profile URL when `seo.url` is not configured — keeping the
 * structured data consistent with the OG tags in {@linkcode buildHead}.
 */
export function buildJsonLd(
  config: LinklistConfig,
  base?: string,
): Record<string, unknown> {
  const root = base ?? config.seo?.url ?? "";
  const entry: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: config.profile.name,
  };
  const url = absoluteUrl(config.seo?.url ?? (root || undefined), root,);
  const image = absoluteUrl(config.profile.avatar, root,);
  if (url) entry.url = url;
  if (image) entry.image = image;
  if (config.profile.tagline) entry.description = config.profile.tagline;
  const sameAs = config.links.map((l,) => l.url).filter(Boolean,);
  if (sameAs.length) entry.sameAs = sameAs;
  return entry;
}

/** Generate a favicon data-URI (a colored tile with the name's initial). */
export function faviconDataUri(name: string, color: string,): string {
  // Colors reach the SVG `fill` attribute unescaped, so only trust plain
  // hex; anything else falls back to the default Material primary.
  const safeColor = /^#([0-9a-fA-F]{3,8})$/.test(color,) ? color : "#6750a4";
  const letter = escapeHtml((name.trim()[0] ?? "?").toUpperCase(),);
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="20" fill="${safeColor}"/><text x="50" y="50" dominant-baseline="central" text-anchor="middle" font-family="system-ui,sans-serif" font-size="58" fill="#ffffff">${letter}</text></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg,)}`;
}

/** Head metadata: title, description, canonical, Open Graph and Twitter cards. */
export function buildHead(
  config: LinklistConfig,
  opts: { baseUrl?: string } = {},
): string {
  const { profile, seo, theme, } = config;
  const base = opts.baseUrl ?? seo?.url ?? "";
  const title = seo?.title ?? profile.name;
  const description = seo?.description ?? profile.tagline ?? "";
  const url = absoluteUrl(seo?.url ?? (opts.baseUrl || undefined), base,);
  const image = absoluteUrl(seo?.image ?? profile.avatar, base,);
  const favicon = seo?.favicon
    ? absoluteUrl(seo.favicon, base,)
    : faviconDataUri(profile.name, themeColor(theme,),);
  const handle = seo?.twitter?.replace(/^@/, "",);

  const lines: string[] = [
    `<title>${escapeHtml(title,)}</title>`,
    `<meta name="description" content="${escapeHtml(description,)}">`,
    `<meta name="theme-color" content="${escapeHtml(themeColor(theme,),)}">`,
    `<meta property="og:type" content="profile">`,
    `<meta property="og:title" content="${escapeHtml(title,)}">`,
  ];
  if (description) {
    lines.push(
      `<meta property="og:description" content="${escapeHtml(description,)}">`,
    );
  }
  if (url) {
    lines.push(`<meta property="og:url" content="${escapeHtml(url,)}">`,);
  }
  if (image) {
    lines.push(`<meta property="og:image" content="${escapeHtml(image,)}">`,);
    lines.push(`<meta name="twitter:card" content="summary_large_image">`,);
  } else {
    lines.push(`<meta name="twitter:card" content="summary">`,);
  }
  if (handle) {
    lines.push(`<meta name="twitter:site" content="@${escapeHtml(handle,)}">`,);
  }
  if (url) lines.push(`<link rel="canonical" href="${escapeHtml(url,)}">`,);
  lines.push(`<link rel="icon" href="${escapeHtml(favicon ?? "",)}">`,);
  lines.push(
    `<script type="application/ld+json">${
      safeJson(buildJsonLd(config, base,),)
    }</script>`,
  );
  return lines.join("\n    ",);
}
