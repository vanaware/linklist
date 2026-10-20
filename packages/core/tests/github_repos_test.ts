/**
 * @file github_repos_test.ts
 * @description Unit tests for the `github-repos` plugin with a mocked
 * `fetchJson` (no network). Verifies star + latest-release rendering, the
 * release-404 fallback, and the empty no-op.
 */
import { assertEquals, assertStringIncludes, } from "@std/assert";
import { describe, it, } from "@std/testing/bdd";
import { githubReposPlugin, } from "../src/plugins/github_repos.ts";
import type { PluginContext, } from "../src/plugins/engine.ts";
import type { LinklistConfig, } from "../src/lib/types.ts";

function cfg(repos: string[],): LinklistConfig {
  return {
    profile: { name: "Jane", bio: "hi", },
    links: [],
    theme: { preset: "minimal-dark", },
    plugins: { github_repos: repos, },
  };
}

function ctxFor(
  repos: string[],
  fetchJson: (url: string,) => Promise<unknown>,
): PluginContext {
  return { config: cfg(repos,), fetchJson, warn: () => {}, };
}

describe("githubReposPlugin", () => {
  it("returns nothing when no repos are configured", async () => {
    const out = await githubReposPlugin.run(
      ctxFor([], () => Promise.reject(new Error("should not fetch",),),),
    );
    assertEquals(out, {},);
  });

  it("emits a GitHub section with stars and the latest release", async () => {
    const fetchJson = (url: string,) =>
      Promise.resolve(
        url.endsWith("/releases/latest",)
          ? { tag_name: "v1.2.3", }
          : { stargazers_count: 42, html_url: "https://github.com/acme/kit", },
      );
    const out = await githubReposPlugin.run(ctxFor(["acme/kit",], fetchJson,),);
    assertEquals(out.sections?.length, 1,);
    const body = out.sections![0]!.body!;
    assertStringIncludes(body, "- [acme/kit](https://github.com/acme/kit)",);
    assertStringIncludes(body, "★ 42",);
    assertStringIncludes(body, "v1.2.3",);
  });

  it("keeps just the stars when the latest release 404s", async () => {
    const fetchJson = (url: string,) =>
      url.endsWith("/releases/latest",)
        ? Promise.reject(new Error("404",),)
        : Promise.resolve({ stargazers_count: 7, },);
    const out = await githubReposPlugin.run(
      ctxFor(["acme/solo",], fetchJson,),
    );
    const body = out.sections![0]!.body!;
    assertStringIncludes(body, "★ 7",);
    assertStringIncludes(body, "https://github.com/acme/solo",); // URL fallback
    assertEquals(body.includes("·",), false,); // no release separator
  });
});
