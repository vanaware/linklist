# Site templates

Starting points for your `config.json`. Copy one, edit it, validate it, build.

| File | What it is |
| --- | --- |
| `minimal.config.json` | A bare-bones, valid page: a name, one link, one theme preset, basic SEO. |
| [`../../packages/core/public/config.json`](../../packages/core/public/config.json) | The fully-annotated reference: profile, avatar, sections, plugins, tokens, analytics. |

```bash
cp docs/templates/minimal.config.json site/config.json
# edit site/config.json …
deno task validate-config site/config.json
deno task dev
```

Every field is documented in [Configuration reference](../configuration.md). Point your
editor at the schema by keeping the top-level `"$schema"` key (it references the published
`https://vanaware.github.io/linklist/config.schema.json`) for autocomplete and inline
validation.
