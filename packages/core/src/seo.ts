/**
 * @file seo.ts
 * @description Pure, dependency-free builders for the document head metadata
 * (title, description, canonical, Open Graph, Twitter card, JSON-LD) and the
 * favicon data-URI. They take the validated config and return strings only; the
 * browser entry (`entry.ts` → `head.ts`) applies them to the live DOM at runtime.
 * The SaaS tier reuses these verbatim to serve the same metadata.
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

/** Build a `Person` JSON-LD document (name + avatar + `sameAs` profile links). */
export function buildJsonLd(config: LinklistConfig,): Record<string, unknown> {
  const base = config.seo?.url ?? "";
  const entry: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: config.profile.name,
  };
  const url = absoluteUrl(config.seo?.url, base,);
  const image = absoluteUrl(config.profile.avatar, base,);
  if (url) entry.url = url;
  if (image) entry.image = image;
  if (config.profile.tagline) entry.description = config.profile.tagline;
  const sameAs = config.links.map((l,) => l.url).filter(Boolean,);
  if (sameAs.length) entry.sameAs = sameAs;
  return entry;
}

/** Generate a favicon data-URI (a colored tile with the name's initial). */
export function faviconDataUri(name: string, color: string,): string {
  const letter = escapeHtml((name.trim()[0] ?? "?").toUpperCase(),);
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="20" fill="${color}"/><text x="50" y="50" dominant-baseline="central" text-anchor="middle" font-family="system-ui,sans-serif" font-size="58" fill="#ffffff">${letter}</text></svg>`;
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
  const url = absoluteUrl(seo?.url, base,);
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
      safeJson(buildJsonLd(config,),)
    }</script>`,
  );
  return lines.join("\n    ",);
}
