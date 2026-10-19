# @vanaware/linklist 🔗

> A link-in-bio site generator: describe yourself in a single `config.json` and get a
> fast, accessible, private, static page you can host anywhere (GitHub Pages, Netlify,
> Vercel, Cloudflare Pages, Nginx…). Built on Deno, Preact + Signals, and BeerCSS
> (Material Design 3).

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Deno 2.x](https://img.shields.io/badge/Deno-2.x-000000?logo=deno&logoColor=white)](https://deno.com)

---

## 🌟 Highlights

- **One file, whole page**: everything — profile, links, sections, theme, SEO — lives in
  a versioned `config.json`, validated with [ArkType](https://arktype.io).
- **Pure client render**: the build emits a tiny static `index.html` shell plus
  `linklist.js`, which fetches `./config.json` at runtime, runs plugins, applies the
  per-config SEO head, and renders the Preact app. Paths are relative, so it works at a
  domain root **or** a subfolder.
- **100% Pure Deno**: no Node runtime, no `node_modules` workflow, no bespoke CLI. The
  entire static build is declarative via [`@vanaware/buildit`](https://jsr.io/@vanaware/buildit)
  (`scripts/esbuild.jsonc` / `scripts/denobuild.jsonc`).
- **BeerCSS themes**: presets (`minimal-dark`, `light-simple`) selectable via
  `config.theme.preset`, with token overrides (colors, radius, shadow, font).
- **Rich text where you want it**: Markdown (CommonMark + GFM) in the bio, tagline,
  section bodies, link subtitles and footer — rendered to real Preact VNodes, no
  `dangerouslySetInnerHTML`.
- **Extensible engine**: the theme and plugin engines live in core, with a built-in
  `github-repos` plugin (stars + latest release). Add your own by extending core.
- **Private by default**: no analytics or click tracking unless you explicitly add them.

---

## 🚀 Quick start

### Requirements

- [Deno 2.x](https://deno.com) (pinned in `.tool-versions`).

### Edit your config

Start from a template: `docs/templates/minimal.config.json` (bare-bones) or
`packages/core/public/config.json` (the fully-annotated sample that powers the official
site). The shape mirrors `packages/core/src/types.ts`, with the JSON Schema at
`packages/core/schema/config.schema.json` (published at
`https://vanaware.github.io/linklist/config.schema.json`).

```bash
git clone https://github.com/vanaware/linklist.git
cd linklist

# Copy a starter and edit it
cp packages/core/public/config.json site/config.json

# Validate your config at any time
deno task validate-config site/config.json
```

### Preview locally

```bash
deno task dev        # build, then serve packages/server/build/dist
```

Open the URL the server prints. (See [Building](#-build) for the sandbox fallback.)

---

## 🏗️ Build

The build is entirely driven by buildit config files — clean the output dir, copy the
static shell + theme CSS + `config.json`, and bundle `core/src/entry.ts` → `linklist.js`:

| Task                   | Engine                  | Output                       | Notes                                                          |
| ---------------------- | ----------------------- | ---------------------------- | -------------------------------------------------------------- |
| `deno task build`      | **esbuild** (preferred) | `packages/server/build/dist` | Dev bundle, used by `dev`.                                     |
| `deno task build:dist` | esbuild                 | `packages/core/dist`         | Minified production bundle.                                    |
| `deno task build:deno` | Deno in-process bundler | `packages/server/build/dist` | Fallback for sandboxes where esbuild's subprocess can't spawn. |

> ⚠️ **Local sandbox note**: on some locked-down containers esbuild's npm subprocess
> cannot start (`ChildProcess.unref` undefined). There, use `deno task build:deno` (Deno's
> own in-process bundler) to produce `linklist.js`, then `deno task serve`. CI runners
> build with esbuild normally.

Then serve the built folder with the static server:

```bash
deno task serve      # packages/server static file-server (port from packages/server/.env)
```

---

## 🎨 Theming

```jsonc
{
  "theme": {
    "preset": "minimal-dark", // a CSS file from packages/core/themes
    "mode": "auto", // light | dark | auto
    "custom": { "primary_color": "#6750a4", "radius": "16px" } // token overrides
  }
}
```

Add a preset by dropping a `<name>.css` in `packages/core/themes` — it is copied into the
build automatically.

| `minimal-dark`                                                        | `light-simple`                                                        |
| --------------------------------------------------------------------- | --------------------------------------------------------------------- |
| ![minimal-dark theme](docs/assets/screenshots/theme-minimal-dark.png) | ![light-simple theme](docs/assets/screenshots/theme-light-simple.png) |

Presets are responsive (one column on phones, a two-column card grid on desktops) and
ship with contrast guards: a custom `primary_color` automatically derives a readable
button ink and a AA-legible link tint per background. See [docs/theming.md](docs/theming.md).

---

## 🔌 Plugins

The plugin engine and its built-in plugins live in core. Plugins fetch external data and
append sections to your page; the network is always injected (never a global), so they run
in the browser for the static site and can run at build time in a future hosted tier.

The built-in `github-repos` plugin renders repository stars and the latest release:

```jsonc
{ "plugins": { "github_repos": ["vanaware/linklist"] } }
```

---

## 📁 Repository structure

```
├── packages/
│   ├── core/                   # @vanaware/linklist-core: schema, validator, markdown,
│   │   │                       #   state (signals), components, theme + seo, the plugin
│   │   │                       #   engine AND built-in plugins, browser entry
│   │   ├── src/
│   │   ├── schema/             #   config.schema.json (published for editors + the site)
│   │   ├── themes/             #   BeerCSS theme presets (minimal-dark, light-simple)
│   │   └── public/             #   index.html shell, config.json, manifest, favicon, robots
│   └── server/                 # static file-server (serveDir) used for local preview
├── scripts/                    # buildit configs + validate.ts (the only I/O edge)
├── .github/workflows/          # ci.yml (gate) + pages.yml (build & deploy)
└── deno.jsonc                  # workspace + tasks
```

---

## 🧪 Testing & verification

```bash
deno task tests      # check:all + lint + fmt:check + test (the full gate)
deno task test       # BDD tests (@std/testing/bdd + @std/assert) only
```

---

## 🌐 Deploy

- **GitHub Pages**: push a `v*.*` tag (or run the workflow manually). `pages.yml` runs the
  gate, builds the site into `packages/server/build/dist`, and publishes it. The site uses
  relative paths, so a project-page subfolder works out of the box.
- **Any static host**: run `deno task build` (or `build:deno`) and upload
  `packages/server/build/dist` — it is fully self-contained.
- **Custom domain**: point DNS at your host and add a `CNAME`; never hardcode base paths.

---

## 📚 Documentation

Full guides live in [`docs/`](docs):

- [Getting started](docs/guide.md)
- [Configuration reference](docs/configuration.md)
- [Theming](docs/theming.md)
- [Plugins](docs/plugins.md)
- [Deploy](docs/deploy.md)
- [API reference](docs/api-reference.md)
- [Site templates](docs/templates/README.md) — starter `config.json` files

Contributing? Read the architectural rules in [AGENTS.md](AGENTS.md). For current
status and the next milestone, see [CURRENT.md](CURRENT.md).

---

## 📄 License

MIT © [Vanaware](https://github.com/vanaware)
