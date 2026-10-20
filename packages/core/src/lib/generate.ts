/**
 * @file generate.ts
 * @description Pure site-file generators. Each function turns a validated
 * {@linkcode LinklistConfig} into the complete text of a static output file —
 * `index.html`, `manifest.json` and `robots.txt` — with the SEO head, theme
 * color, favicon and avatar already baked in from the config.
 *
 * Nothing here reads or writes the filesystem, and the HTML shell is embedded
 * as a string literal (no template file to import), so the output is fully
 * reproducible and reusable by any host: the build-time CLI (`../cli.ts`)
 * writes these into `public/` for buildit to copy into `dist`, and a future
 * server `main.ts` can stream the very same strings to a response.
 */
import { buildHead, escapeHtml, faviconDataUri, } from "./seo.ts";
import { themeBodyClass, themeColor, } from "./theme.ts";
import type { LinklistConfig, } from "./types.ts";

/** A single generated file: its name (relative to the output dir) and content. */
export interface GeneratedFile {
  /** File name relative to the output directory, e.g. `"index.html"`. */
  name: string;
  /** The complete file text. */
  content: string;
}

/** BeerCSS + Material Symbols CDN pins, kept in lockstep with the shell. */
const BEER_CSS =
  "https://cdn.jsdelivr.net/npm/beercss@3.7.12/dist/cdn/beer.min.css";
const BEER_JS =
  "https://cdn.jsdelivr.net/npm/beercss@3.7.12/dist/cdn/beer.min.js";
const MATERIAL_ICONS =
  "https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200";

/** Icon MIME type inferred from the path extension (defaults to png). */
function iconType(src: string,): string {
  const ext = (src.split(".",).pop() ?? "").toLowerCase();
  switch (ext) {
    case "svg":
      return "image/svg+xml";
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "webp":
      return "image/webp";
    case "png":
      return "image/png";
    default:
      return "image/png";
  }
}

/**
 * A no-JS fallback rendered straight from the config: the profile name, an
 * optional avatar/tagline and every link as a plain anchor. It lives inside
 * `<noscript>` so JavaScript users never see it, while crawlers, disabled-JS
 * visitors and the PWA splash still get real content.
 */
function noScriptFallback(config: LinklistConfig,): string {
  const { profile, links, } = config;
  const avatar = profile.avatar
    ? `<img src="${escapeHtml(profile.avatar,)}" alt="${
      escapeHtml(profile.avatar_alt ?? "",)
    }" width="96" height="96">`
    : "";
  const tagline = profile.tagline
    ? `<p>${escapeHtml(profile.tagline,)}</p>`
    : "";
  const items = links.map((link,) =>
    `<li><a href="${escapeHtml(link.url,)}">${escapeHtml(link.title,)}</a></li>`
  ).join("",);
  return [
    `<main class="linklist">`,
    `${avatar}<h1>${escapeHtml(profile.name,)}</h1>${tagline}`,
    `<nav><ul>${items}</ul></nav>`,
    `<p>Enable JavaScript to load the full styled page.</p>`,
    `</main>`,
  ].join("",);
}

/**
 * Render the complete `index.html` shell: the per-config head (title, Open
 * Graph, Twitter card, JSON-LD, theme-color, favicon, canonical) followed by
 * the static structure (manifest link, BeerCSS, Material Symbols) and the
 * `<div id="app">` mount the bundled `linklist.js` hydrates.
 */
export function renderIndexHtml(
  config: LinklistConfig,
  opts: { baseUrl?: string } = {},
): string {
  const lang = escapeHtml(config.seo?.lang ?? "en",);
  const head = buildHead(config, opts,);
  const bodyClass = escapeHtml(themeBodyClass(config.theme,),);
  return `<!DOCTYPE html>
<html lang="${lang}">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    ${head.split("\n",).join("\n    ",)}
    <link rel="manifest" href="./manifest.json">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link rel="stylesheet" href="${BEER_CSS}">
    <link rel="stylesheet" href="${MATERIAL_ICONS}">
    <script type="module" src="${BEER_JS}"></script>
  </head>
  <body class="${bodyClass}">
    <div id="app">
      <noscript>${noScriptFallback(config,)}</noscript>
    </div>
    <script type="module" src="./linklist.js"></script>
  </body>
</html>
`;
}

/**
 * Render the web app `manifest.json`: name/description/theme color from the
 * config, plus the avatar (from `profile.avatar`) and a generated SVG icon so
 * the installed app uses the real profile art.
 */
export function renderManifest(config: LinklistConfig,): string {
  const { profile, theme, seo, } = config;
  const themeColorValue = themeColor(theme,);
  const icons: Array<Record<string, string>> = [];
  if (profile.avatar) {
    icons.push({
      src: profile.avatar,
      sizes: "any",
      type: iconType(profile.avatar,),
      purpose: "any",
    },);
  }
  icons.push({
    src: faviconDataUri(profile.name, themeColorValue,),
    sizes: "512x512",
    type: "image/svg+xml",
    purpose: "any maskable",
  },);
  const manifest = {
    name: seo?.title ?? profile.name,
    short_name: profile.name,
    description: seo?.description ?? profile.tagline ??
      "A fast, private link-in-bio page.",
    start_url: "./",
    scope: "./",
    display: "standalone",
    background_color: theme.custom?.background_color ?? "#ffffff",
    theme_color: themeColorValue,
    icons,
  };
  return `${JSON.stringify(manifest, undefined, 2,)}\n`;
}

/**
 * Render `robots.txt`. Privacy-first default: allow every crawler. A sitemap is
 * only referenced when a canonical URL is configured (a hosted sitemap is a
 * future concern, so by default this stays a plain allow-all).
 */
export function renderRobotsTxt(
  config: LinklistConfig,
  _opts: { baseUrl?: string } = {},
): string {
  return `User-agent: *\nAllow: /\n`;
}

/** Generate every static file derived from the config, in a stable order. */
export function generateSite(
  config: LinklistConfig,
  opts: { baseUrl?: string } = {},
): GeneratedFile[] {
  return [
    { name: "index.html", content: renderIndexHtml(config, opts,), },
    { name: "manifest.json", content: renderManifest(config,), },
    { name: "robots.txt", content: renderRobotsTxt(config, opts,), },
  ];
}
