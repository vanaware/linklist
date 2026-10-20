# Publishing a library to JSR (deferred)

> **Status: publishing is currently deferred.** Both workspace packages are set to
> `"publish": false`, and the automated `.github/workflows/jsr-publish.yml` has been
> **removed**. `@vanaware/linklist` is consumed from source in the monorepo. This
> document describes the rules to follow **when** library publication is re-enabled. Do not
> add a publish workflow until these are satisfied.

## Which packages are libraries

- `@vanaware/linklist` (`packages/core`) — the engine: schema, validator, render
  runtime, theme/markdown/SEO/plugin helpers, the built-in plugins and the CSS theme
  presets (all folded into core). This is the **only** JSR publication candidate.
- `@vanaware/linklist-server` (`packages/server`) — a local static file-server used for
  development preview and tests. It is **never** published: it is a dev aid, not a
  library, and must stay `"publish": false` permanently.

Before publishing, set `"publish": true` (and a `name`/`exports` map) in
`packages/core/deno.jsonc` — and only there; the server package is excluded from
publishing by design — and re-add a publish workflow gated on the package being
`publish`-ready.

## Hard requirements (checked in CI when publishing is on)

1. **Complete JSDoc** on every exported symbol: a `@file`/`@description` header, plus
   `@param`/`@returns` and at least one `@example` for non-trivial functions.
2. **Doc lint passes**:

   ```bash
   deno task lint:doc     # runs `deno doc --lint` over the publishable packages
   ```

   (Add this task back alongside the publish workflow; the whole `tests` composite stays
   green without it today.)
3. **Runnable README** at the package root with an executable import example, e.g.:

   ```ts
   import { parseAndValidate } from "@vanaware/linklist";
   const r = parseAndValidate(Deno.readTextFileSync("packages/core/public/config.json"));
   ```

   `deno doc` renders this, and JSR type-checks the export map it points at.
4. **Explicit `exports` map** in `deno.jsonc` — no wildcard `src/**` leakage of internal
   modules. Only the documented public surface (see
   [API reference](api-reference.md)) is exported.
5. **Semver discipline**: bump the package `version` on change; the build tooling
   (`versionPaths` in `scripts/*.jsonc`) keeps `version.ts` stamps in sync. Do not hand-edit
   `src/version.ts` / its `APP_VERSION` — they are stamped at build.

## Release checklist (when enabled)

- [ ] `deno task tests` is green (check + lint + fmt + tests).
- [ ] `deno doc --lint` clean for every package marked `publish`.
- [ ] Each published package README has an example that actually runs against the published
      types.
- [ ] Version bumped and tagged `v*.*`.
