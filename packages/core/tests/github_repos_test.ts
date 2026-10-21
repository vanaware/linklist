/**
 * @file github_repos_test.ts
 * @description Unit tests for the `github-repos` expander with a mocked
 * `fetchJson` (no network). Verifies star + latest-release rendering, the
 * release-404 fallback, the repo-fetch failure fallback, and the empty no-op.
 */
import { assertEquals, assertStringIncludes, } from "@std/assert";
import { describe, it, } from "@std/testing/bdd";
import { githubReposExpander, } from "../src/plugins/github_repos.ts";
import type { PluginContext, } from "../src/plugins/engine.ts";
import type { Block, SectionBlock, } from "../src/lib/types.ts";

function ctx(fetchJson: (url: string,) => Promise<unknown>,): PluginContext {
  return { fetchJson, warn: () => {}, };
}

/** The single "GitHub" section body an expansion produces (asserts shape). */
function onlySection(blocks: Block[],): string {
  assertEquals(blocks.length, 1,);
  const [section,] = blocks;
  assertEquals(section?.type, "section",);
  return (section as SectionBlock).body ?? "";
}

describe("githubReposExpander", () => {
  it("returns no blocks when there are no repos", async () => {
    const blocks = await githubReposExpander.expand(
      [],
      ctx(() => Promise.reject(new Error("should not fetch",),)),
    );
    assertEquals(blocks, [],);
  });

  it("emits a GitHub section with stars and the latest release", async () => {
    const fetchJson = (url: string,) =>
      Promise.resolve(
        url.endsWith("/releases/latest",)
          ? { tag_name: "v1.2.3", }
          : { stargazers_count: 42, html_url: "https://github.com/acme/kit", },
      );
    const body = onlySection(
      await githubReposExpander.expand(["acme/kit",], ctx(fetchJson,),),
    );
    assertStringIncludes(body, "- [acme/kit](https://github.com/acme/kit)",);
    assertStringIncludes(body, "★ 42",);
    assertStringIncludes(body, "v1.2.3",);
  });

  it("keeps just the stars when the latest release 404s", async () => {
    const fetchJson = (url: string,) =>
      url.endsWith("/releases/latest",)
        ? Promise.reject(new Error("404",),)
        : Promise.resolve({ stargazers_count: 7, },);
    const body = onlySection(
      await githubReposExpander.expand(["acme/solo",], ctx(fetchJson,),),
    );
    assertStringIncludes(body, "★ 7",);
    assertStringIncludes(body, "https://github.com/acme/solo",); // URL fallback
    assertEquals(body.includes("·",), false,); // no release separator
  });

  it("falls back to a plain link when the repo fetch fails", async () => {
    const body = onlySection(
      await githubReposExpander.expand(
        ["acme/offline",],
        ctx(() => Promise.reject(new Error("rate limited",),)),
      ),
    );
    assertStringIncludes(
      body,
      "- [acme/offline](https://github.com/acme/offline)",
    );
    assertEquals(body.includes("★",), false,);
  });
});
