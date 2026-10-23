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
import { brandText, } from "./brand.ts";
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
  const clean = src.split(/[?#]/,)[0] ?? src;
  const ext = (clean.split(".",).pop() ?? "").toLowerCase();
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
 * A no-JS fallback rendered straight from the config using the SAME pure
 * BeerCSS markup the live app emits (`.grid` of `.button` links, a `.circle`
 * avatar), so crawlers and the first paint stay coherent with the hydrated page.
 * Text/figure/island blocks are skipped (Markdown source and runtime-hydrated
 * islands have no place without JS). It closes with the same "Made with
 * linklist" brand line the live footer always shows (the version is the
 * **package** version passed in at build). It lives inside `<noscript>` so
 * JavaScript users never see it, while crawlers, disabled-JS visitors and the
 * PWA splash still get real content.
 */
function noScriptFallback(config: LinklistConfig, version: string,): string {
  const { profile, } = config;
  const hidden = new Set(profile.hide ?? [],);
  const avatar = profile.avatar && !hidden.has("avatar",)
    ? `<img class="circle" src="${escapeHtml(profile.avatar,)}" alt="${escapeHtml(profile.avatar_alt ?? "",
    )}" width="120" height="120">`
    : "";
  const tagline = profile.tagline && !hidden.has("tagline",)
    ? `<p class="medium-text">${escapeHtml(profile.tagline,)}</p>`
    : "";
  const links = config.blocks.filter((block,) => block.type === "link");
  const list = links.length === 0
    ? ""
    : `<nav><ul class="grid">${links.map((block,) => {
      // Mirror the live grid span: a `row` is full-width, `button`/`card`
      // pair into two columns, so crawlers and the JS-disabled paint match
      // the app.
      const span = block.format === "row" ? "s12" : "s12 m6";
      return `<li class="${span}"><a class="button" href="${escapeHtml(block.link.url,)
        }">${escapeHtml(block.link.title,)}</a></li>`;
    }).join("",)
    }</ul></nav>`;
  return [
    `<main class="linklist">`,
    `<header class="profile">${avatar}<h1>${escapeHtml(profile.name,)
    }</h1>${tagline}</header>`,
    `${list}`,
    `<p class="small-text">Enable JavaScript to load the full styled page.</p>`,
    `<footer class="footer small-text"><div>${escapeHtml(brandText(version,),)
    }</div></footer>`,
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
  opts: { baseUrl?: string; version?: string } = {},
): string {
  const lang = escapeHtml(config.profile.lang ?? "en",);
  const head = buildHead(config, opts,);
  const bodyClass = escapeHtml(themeBodyClass(config.theme,),);
  const mode = config.theme?.mode ?? "auto";
  // `auto` is not a BeerCSS class: a tiny blocking script right after `<body>`
  // flips `body.dark` from the OS preference before the first paint (no flash),
  // then entry.ts keeps it in sync live. `dark`/`light` come baked in `bodyClass`.
  const autoScript = mode === "auto"
    ? `<script>if(matchMedia("(prefers-color-scheme:dark)").matches)document.body.classList.add("dark")</script>`
    : "";
  // The shared layout and the brand "skin" are real static files next to the
  // page (buildit copies `themes/`), so link them: the `<noscript>` fallback and
  // the first paint are styled before entry.ts layers the runtime overrides.
  const presetLink = config.theme.preset
    ? `<link rel="stylesheet" href="./${escapeHtml(config.theme.preset,)}.css">`
    : "";
  return `<!DOCTYPE html>
<html lang="${lang}">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    ${head.split("\n",).join("\n    ",)}
    <link rel="manifest" href="./manifest.json">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link rel="stylesheet" href="${BEER_CSS}">
    <link rel="stylesheet" href="./linklist-base.css">
    ${presetLink}
    <link rel="stylesheet" href="${MATERIAL_ICONS}">
    <script type="module" src="${BEER_JS}"></script>
  </head>
  <body class="${bodyClass}">
    ${autoScript}
    <div id="app">
      <noscript>${noScriptFallback(config, opts.version ?? "",)}</noscript>
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
  const { profile, theme, } = config;
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
  const manifest: Record<string, unknown> = {
    name: profile.title ?? profile.name,
    short_name: profile.name,
    description: profile.description ?? profile.tagline ??
      "A fast, private link-in-bio page.",
    start_url: "./",
    scope: "./",
    display: "standalone",
    // `theme_color` is the brand primary (falls back to a Material default);
    // the page background is owned by BeerCSS per light/dark mode, so no
    // `background_color` is guessed here (a wrong value would flash a mismatched
    // PWA splash behind the preset).
    theme_color: themeColorValue,
    icons,
  };
  return `${JSON.stringify(manifest, undefined, 2,)}\n`;
}

/**
 * Render `robots.txt`. Privacy-first default: a plain allow-all crawler policy.
 * The page is a single document with no hosted sitemap yet, so none is
 * referenced; note that on a GitHub Pages *project* subfolder crawlers do not
 * even fetch `robots.txt` (it is only honored at a domain root), which is
 * harmless for an allow-all file.
 */
export function renderRobotsTxt(
  _config: LinklistConfig,
  _opts: { baseUrl?: string } = {},
): string {
  return `User-agent: *\nAllow: /\n`;
}

/** Generate every static file derived from the config, in a stable order. */
export function generateSite(
  config: LinklistConfig,
  opts: { baseUrl?: string; version?: string } = {},
): GeneratedFile[] {
  return [
    { name: "index.html", content: renderIndexHtml(config, opts,), },
    { name: "manifest.json", content: renderManifest(config,), },
    { name: "robots.txt", content: renderRobotsTxt(config, opts,), },
  ];
}
