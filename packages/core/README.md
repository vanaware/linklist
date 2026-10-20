# @vanaware/linklist

The pure engine behind [linklist](https://github.com/vanaware/linklist): a
config schema + validator, theme/SEO helpers, and static-file generators that
turn a single JSON config into a fast, offline-capable link-in-bio page. No
framework, no filesystem, no network — every export is a pure function or a
plain data structure you can run anywhere Deno or the browser runs.

> Note: this package is currently published `publish: false` while the
> monorepo matures; the JSR publication gate lives in
> `.github/workflows/jsr-publish.yml`.

## What's inside

| Area         | Exports                                                                                                                                         |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Config types | `LinklistConfig`, `Profile`, `LinkItem`, `ThemeConfig`, `ThemeTokens`, `SeoConfig`, `AnalyticsConfig`, `PluginsConfig`, `ContentSection`        |
| Validation   | `parseAndValidate`, `validateConfig` (+ `ValidationResult` types)                                                                               |
| Theme        | `resolveThemeCss`, `tokensToCss`, `themeColor`, `themeBodyClass`, `presetVariable`, `readableInk`, `readableLink`                               |
| SEO head     | `buildHead`, `buildJsonLd`, `faviconDataUri`, `escapeHtml`, `safeJson`                                                                          |
| Static files | `generateSite`, `renderIndexHtml`, `renderManifest`, `renderRobotsTxt` — config → `index.html` / `manifest.json` / `robots.txt` text            |
| Plugins      | `LinklistPlugin` contract, `runPlugins`, `mergePluginOutputs`, `builtinPlugins` (`githubReposPlugin`)                                           |
| CLI          | `linklistCommand` (Cliffy: `linklist build` / `linklist validate`), `buildSiteFiles` — importable command objects; parsing never runs on import |

The Preact rendering runtime (`components/`, `markdown.ts`, `state.ts`) is
intentionally **not** part of the public JSR surface — consume it through the
bundled `linklist.js` client or monorepo deep imports.

## Usage

Validate a config and render the static head from it:

```ts
import { generateSite, parseAndValidate, } from "@vanaware/linklist";

const raw = `{
  "profile": { "name": "Ada", "tagline": "Mathematician" },
  "links": [{ "title": "GitHub", "url": "https://github.com/ada" }],
  "theme": { "preset": "minimal-dark" }
}`;

const result = parseAndValidate(raw,);
if (!result.ok) {
  console.error(result.errors,); // human-readable, path-qualified messages
} else {
  // Pure strings — write them wherever you serve static files from.
  for (const file of generateSite(result.data,)) {
    console.log(file.name, file.content.length, "bytes",);
  }
}
```

`deno run jsr:@vanaware/linklist` is not a binary; use the exported
`linklistCommand` from your own CLI entry (as the repo does via
`deno task linklist:build`).

## Config at a glance

A linklist site is one JSON file. Minimum viable config:

```json
{
  "profile": { "name": "Ada", "tagline": "Mathematician" },
  "links": [{ "title": "GitHub", "url": "https://github.com/ada" }],
  "theme": { "preset": "minimal-dark" }
}
```

Everything else is optional: SEO/social metadata (`seo`), privacy-first
analytics (`analytics`), build/runtime data plugins (`plugins`), Markdown
content sections (`content`), and token-level theme overrides (`theme.custom`).
The JSON Schema for editors and CI lives at `schema/config.schema.json`
(referenced from your config via `"$schema"`).

## License

MIT © Vanaware
