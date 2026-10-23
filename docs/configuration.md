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
| `version` | string | no | Optional schema version stamp (recommended: `"2"`). |
| `profile` | object | **yes** | Identity block rendered at the top **and** the source of the `<head>` metadata. |
| `blocks` | array | **yes** | The ordered page content (see below). At least one link block (`row`/`button`/`card`). |
| `theme` | object | **yes** | Brand skin (`preset`) + BeerCSS-native color scheme (`mode`) + brand overrides. |
| `footer` | object | no | Optional "Last updated" note (a "Made with linklist" brand line always shows). |

## `profile`

`profile` is the single identity block. Some fields render **on screen**, others are
**head-only** metadata (they never appear in the page body — they feed `<title>`,
Open Graph, Twitter, JSON-LD and the PWA manifest; see `packages/core/src/lib/seo.ts`).

### Screen fields (rendered in the page header)

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `name` | string | **yes** | Non-empty. Rendered as the page `<h1>`; always shown. |
| `tagline` | string | no | One-line subtitle (Markdown). |
| `bio` | string | no | Short paragraph (Markdown). |
| `avatar` | string | no | Relative path (copied at build) or absolute URL. |
| `avatar_alt` | string | conditional | **Required whenever `avatar` is set** (accessibility). |
| `location` | string | no | Metadata chip. |
| `hide` | array | no | Fields to skip **on screen**: `"tagline"`, `"bio"`, `"avatar"`, `"location"` (this is the only hide list; head-only fields are never shown). The data still feeds the SEO head, JSON-LD and manifest. |

### Head-only overrides

Each falls back to a screen field, so you usually set none of them.

| Field | Type | Used for | Defaults to |
| --- | --- | --- | --- |
| `title` | string | `<title>`, `og:title`, manifest `name` | `name` |
| `description` | string | meta description, `og:description`, JSON-LD | `tagline` |
| `image` | string | `og:image` / Twitter preview | `avatar` |
| `url` | string | canonical URL, `og:url`, JSON-LD `url` (absolute http/https) | — |
| `twitter` | string | `twitter:site` handle (with or without `@`) | — |
| `lang` | string | `<html lang>` | `"en"` |
| `favicon` | string | favicon path/URL | a generated inline-SVG favicon |

## `footer`

Every page always ends with a **"Made with linklist · vN"** brand line — `vN` is the
**package** version (stamped at build), never your content's version. On top of that you
can opt into a **content** last-updated note:

| Field | Type | Notes |
| --- | --- | --- |
| `show_last_updated` | boolean | Show the last-updated note line above the brand. Default `false`. |
| `updated` | string | The **content** last-updated date as `YYYY-MM-DD` (author-maintained; validated). Rendered as "Last updated <date>". |
| `label` | string | Custom Markdown note that overrides the auto "Last updated <date>" line. |

The note renders only when `show_last_updated` is `true` **and** an `updated` date (or
`label`) is present. The date is a plain string you keep current — the app never infers it
from the build or the visitor's clock. The **brand line also appears in the build-time
no-JS `<noscript>` fallback** (with the same package version), so crawlers and JS-disabled
visitors see it too.

## `blocks[]`

The page is the literal order of `blocks`: declaration order **is** display order.
Every block is a **pure, self-contained item** that names one predefined `format`.
The `format` decides both how the block renders **and** which fields it needs. There
is no `type` key and no nesting — a link is a block, a paragraph is a block. Consecutive
link blocks are grouped into a single list on screen; any other block breaks the run.

| `format` | Renders as | Required fields | Optional fields |
| --- | --- | --- | --- |
| `row` | a full-width link row | `title`, `url` | `icon`, `image`+`image_alt`, `subtitle`, `new_tab`, `nofollow` |
| `button` | a filled button link | `title`, `url` | same as `row` |
| `card` | an emphasized card link | `title`, `url` | same as `row` (usually with `image`) |
| `text` | a Markdown content section | `body` (or `markdown`) | `title` |
| `card_text` | a Markdown section framed as a card (elevated surface) | `body` (or `markdown`) | `title` |
| `figure` | a standalone image/figure | `image`, `image_alt` | `caption` |
| `card_figure` | an image/figure framed as a card (elevated surface) | `image`, `image_alt` | `caption` |
| `island` | an interactive component hydrated at runtime | `island` (file name) | `params` |

```jsonc
"blocks": [
  { "format": "button", "title": "GitHub", "url": "https://github.com/janedoe", "icon": "github" },
  { "format": "card", "title": "Blog", "url": "https://janedoe.dev", "image": "./assets/cover.svg", "image_alt": "Blog cover" },
  { "format": "text", "title": "About", "body": "Markdown **here**" },
  { "format": "card_text", "title": "Note", "body": "A pinned, carded paragraph" },
  { "format": "figure", "image": "./assets/cover.svg", "image_alt": "…", "caption": "Latest post" },
  { "format": "island", "island": "Counter", "params": { "start": 3, "step": 2 } }
]
```

### Framed content (`card_text` / `card_figure`)

`card_text` and `card_figure` take exactly the same fields as `text` and `figure`
respectively — the only difference is presentation: the block is wrapped in an
`<article>`, which is what BeerCSS styles as a **card** (padding, a tinted
`--surface-container-low` background and a soft `--elevate1` shadow — note there
is no `.card` *class*; the look is the `article` element itself). It gives the
block the same softly-elevated surface an island gets. Use them to make a quote,
a note or a highlight stand out from the plain flow without reaching for a full
interactive island.

### Link fields (`row` / `button` / `card`)

The three link formats share one data shape; `format` picks only the presentation:

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `title` | string | **yes** | Non-empty visible label. |
| `url` | string | **yes** | Must be a valid **absolute** URL (`http`/`https`). |
| `icon` | string | no | Bundled brand-icon name (e.g. `github`, `website`, `mastodon`). |
| `image` | string | no | Thumbnail replacing the icon tile (relative path or URL). |
| `image_alt` | string | conditional | **Required whenever `image` is set** (accessibility). |
| `subtitle` | string | no | Secondary line (Markdown). |
| `new_tab` | boolean | no | Open in a new tab with `rel="noopener"`. Default `false`. |
| `nofollow` | boolean | no | Add `rel="nofollow"`. Default `false`. |

### Island field (`island`)

An `island` block renders a static placeholder at build time and hydrates a
plain-JS Preact component from `./islands/<island>.js` at runtime, reusing the
app's single shared Preact/Signals instance. See [Islands](islands.md) for the
full model, authoring guide and the `params` → props contract.

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `island` | string | **yes** | Safe file name (letters/digits/`_`/`-`, starts with a letter) — becomes `./islands/<island>.js`. |
| `params` | object | no | Passed verbatim as the component's props (rendered via Preact, never raw HTML). |

## `theme`

See [Theming](theming.md) for the full walkthrough.

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `preset` | string | **yes** | Name of a bundled brand skin (a CSS file in `packages/core/themes`), e.g. `violet`. |
| `mode` | `"light" \| "dark" \| "auto"` | no | BeerCSS-native color scheme. Default `auto` (follows the OS, resolved with no flash). |
| `custom` | object | no | Brand color/font overrides merged on top of the skin (see [Theming](theming.md)). |

`custom` tokens: `primary_color` (→ `--primary`/`--on-primary`) and `font_family`
(→ `--font`). Background, text color, radius and elevation are owned by BeerCSS
per light/dark mode and are no longer author-tunable.

## Validation rules (semantic)

Beyond the structural types, `parseAndValidate` enforces:

- every block sets a known `format`, and its fields satisfy that format's requirements
  (a `text`/`card_text` block needs a body, a `figure`/`card_figure` needs `image`+`image_alt`, an `island`
  needs a safe `island` name, a link format needs `title`+`url`);
- `blocks` contains at least one link block (`row`/`button`/`card`) — the page is never
  empty;
- every link `url` is a valid absolute URL;
- `image` ⇒ `image_alt` (figure block and link thumbnail) and `avatar` ⇒ `avatar_alt`;
- `profile.hide` only contains known screen-field names;
- `profile.url`, when set, is a valid http(s) URL;
- `footer.updated`, when set, is a real `YYYY-MM-DD` calendar date;
- a `theme.preset` is required and non-empty; theme colors are plain hex, and CSS token
  values carry no structural characters (`< > { } ; "`).

## Minimal example

```jsonc
{
  "profile": { "name": "Jane Doe" },
  "blocks": [
    { "format": "row", "title": "GitHub", "url": "https://github.com/janedoe" }
  ],
  "theme": { "preset": "violet" }
}
```

A fully-annotated sample lives at
[`packages/core/public/config.json`](../packages/core/public/config.json) — it is also the
config that powers the official demo site.
