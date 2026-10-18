/**
 * @file plugins_test.ts
 * @description Sanity checks for core's built-in plugin registry: the
 * `github-repos` plugin ships with the engine and is the sole default entry.
 */
import { assert, assertEquals, } from "@std/assert";
import { describe, it, } from "@std/testing/bdd";
import { builtinPlugins, githubReposPlugin, } from "../src/plugins/mod.ts";

describe("builtinPlugins", () => {
  it("includes the github-repos plugin", () => {
    assert(builtinPlugins.includes(githubReposPlugin,),);
  });

  it("exposes only the github-repos plugin by default", () => {
    assertEquals(builtinPlugins.map((p,) => p.name), ["github-repos",],);
  });
});
