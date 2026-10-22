# Publishing a library to JSR

> **Status: ready to publish.** `packages/core` is publish-enabled via a
> `"publish": { "include", "exclude" }` block (src + README + dist + public +
> schema + themes ship; tests are excluded). `.github/workflows/jsr-publish.yml`
> is the release **gate**: tests → `deno task lint:doc` → version sanitizing →
> README check → publish dry-run → publish, triggered by a `v*.*` tag. All steps
> pass locally as of the M6b/M6c audits. Do not weaken the workflow (e.g.
> `--allow-dirty`) to make it pass — fix the underlying gaps instead.

## Which packages are libraries

- `@vanaware/linklist` (`packages/core`) — the engine: schema, validator, render
  runtime, theme/markdown/SEO helpers and the CSS theme
  presets (all folded into core). This is the **only** JSR publication candidate.
- `@vanaware/linklist-server` (`packages/server`) — a local static file-server used for
  development preview and tests. It is **never** published: it is a dev aid, not a
  library, and must stay `"publish": false` permanently.

Publishing ships exactly what the `"publish".include` list names — keep it in
sync when the package layout changes. `deno publish` runs INSIDE
`packages/core` (the workflow sets `working-directory`): from the workspace root
it fails outright because the root `deno.jsonc` carries no `name` field.

## Hard requirements (enforced by the jsr-publish workflow)

1. **Complete JSDoc** on every exported symbol: a `@file`/`@description` header, plus
   `@param`/`@returns` and at least one `@example` for non-trivial functions.
2. **Doc lint passes**:

   ```bash
   deno task lint:doc     # runs `deno doc --lint packages/core/src/mod.ts`
   ```

   The workflow runs this as a publish gate; keep it out of the `tests` composite
   until the surface is fully documented.
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
- [ ] `deno task lint:doc` clean for every package marked `publish`.
- [ ] Each published package README has an example that actually runs against the published
      types.
- [ ] Version sanitized to strict semver (`deno task sanitize-version`) and tagged `v*.*`.
