# Configuration reference

A linklist site is a single `config.json` object (JSON, **not** YAML). It is fully
serializable and validated with ArkType plus a set of semantic cross-field checks. The
canonical TypeScript shape is `LinklistConfig` in `packages/core/src/lib/types.ts`; the JSON
Schema used by editors is `packages/core/schema/config.schema.json`, published at
`https://vanaware.github.io/linklist/config.schema.json`.

Add a top-level `"$schema"` key pointing at that URL to get validation and autocomplete in
your editor.

## Top level

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `version` | string | no | Optional schema version stamp for forward compatibility (e.g. `"1"`). |
| `profile` | object | **yes** | Identity block rendered at the top. |
| `links` | array | **yes** | At least one link (see below). |
| `theme` | object | **yes** | Preset + mode + token overrides. |
| `seo` | object | no | Document/social metadata. |
| `analytics` | object | no | Disabled by default (privacy-first). |
| `plugins` | object | no | Content plugins + third-party script URLs. |
| `sections` | array | no | Markdown content blocks placed before/after the links. |

## `profile`

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `name` | string | **yes** | Non-empty. Rendered as the page `<h1>`. |
| `tagline` | string | no | One-line subtitle (Markdown). |
| `bio` | string | no | Short paragraph (Markdown). |
| `avatar` | string | no | Relative path (copied at build) or absolute URL. |
| `avatar_alt` | string | conditional | **Required whenever `avatar` is set** (accessibility). |
| `location` | string | no | Metadata chip. |

## `links[]`

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `title` | string | **yes** | Non-empty visible label. |
| `url` | string | **yes** | Must be a valid **absolute** URL (`http`/`https`). |
| `icon` | string | no | Bundled brand-icon name (e.g. `github`, `website`, `mastodon`). |
| `subtitle` | string | no | Secondary line (Markdown). |
| `button` | boolean | no | Render as a filled button. Default `false`. |
| `new_tab` | boolean | no | Open in a new tab with `rel="noopener"`. Default `false`. |
| `featured` | boolean | no | Visual emphasis. Default `false`. |
| `nofollow` | boolean | no | Add `rel="nofollow"`. Default `false`. |

## `theme`

See [Theming](theming.md) for the full walkthrough.

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `preset` | string | **yes** | Name of a bundled preset (a CSS file in `packages/core/themes`), e.g. `minimal-dark`. |
| `mode` | `"light" \| "dark" \| "auto"` | no | Color-scheme behavior. Default `auto`. |
| `custom` | object | no | Token overrides merged on top of the preset. |

`custom` tokens: `primary_color`, `background_color`, `text_color`, `font_family`,
`radius` (e.g. `"12px"`), `shadow` (`"none" | "small" | "medium" | "large"`).

## `seo`

| Field | Type | Notes |
| --- | --- | --- |
| `title` | string | Document `<title>`. Defaults to `profile.name`. |
| `description` | string | Meta + Open Graph description. Defaults to `profile.tagline`. |
| `image` | string | Social preview image (1200×630 recommended). Path or URL. |
| `url` | string | Canonical / site base URL — used for absolute OG/JSON-LD URLs. |
| `twitter` | string | `twitter:site` handle (with or without a leading `@`). |
| `lang` | string | Document language. Default `"en"`. |
| `favicon` | string | Favicon path/URL; otherwise a generated inline-SVG favicon is used. |

## `analytics`

Everything defaults to disabled. No tracking happens unless you opt in.

| Field | Type | Notes |
| --- | --- | --- |
| `provider` | `"none" \| "plausible" \| "umami" \| "google"` | Default `"none"`. |
| `plausible_domain` | string | **Required when `provider` is `plausible`.** |
| `umami_website_id` | string | **Required when `provider` is `umami`.** |
| `google_analytics_id` | string | **Required when `provider` is `google`.** |
| `click_counter_endpoint` | string | Optional self-hosted click counter; never identifies users. |

## `plugins`

See [Plugins](plugins.md).

| Field | Type | Notes |
| --- | --- | --- |
| `github_repos` | string[] | Repos as `owner/repo` — renders stars + latest release. |
| `youtube_channel` | string | Channel id — renders a latest-video card. |
| `rss_feed` | string | Feed URL — renders the latest items. |
| `rss_limit` | number | RSS items to render. Default `3`. |
| `show_last_updated` | boolean | Show a "last updated" footer line. Default `false`. |
| `footer_label` | string | Custom Markdown footer line (overrides the default note). |

## `sections[]`

| Field | Type | Notes |
| --- | --- | --- |
| `title` | string | Optional heading above the body. |
| `body` | string | Markdown body. |
| `placement` | `"before" \| "after"` | Relative to the link list. Default `after`. |

## Validation rules (semantic)

Beyond the structural types, `parseAndValidate` enforces:

- every `links[].url` is a valid absolute URL;
- `links` is non-empty and every `title` is non-empty;
- `avatar` ⇒ `avatar_alt` is required;
- a `theme.preset` is required and non-empty;
- the analytics id required by the chosen `provider` is present;
- `plugins.github_repos` entries are `owner/repo`.

## Minimal example

```jsonc
{
  "profile": { "name": "Jane Doe" },
  "links": [{ "title": "GitHub", "url": "https://github.com/janedoe" }],
  "theme": { "preset": "minimal-dark" }
}
```

A fully-annotated sample lives at
[`packages/core/public/config.json`](../packages/core/public/config.json) — it is also the
config that powers the official demo site.
