/**
 * @file plugins_test.ts
 * @description Sanity checks for core's built-in expander registry: the
 * `github-repos` expander ships with the engine and is the sole default entry.
 */
import { assert, assertEquals, } from "@std/assert";
import { describe, it, } from "@std/testing/bdd";
import { builtinExpanders, githubReposExpander, } from "../src/plugins/mod.ts";

describe("builtinExpanders", () => {
  it("includes the github-repos expander", () => {
    assert(builtinExpanders.includes(githubReposExpander,),);
  });

  it("exposes only the github-repos expander by default", () => {
    assertEquals(builtinExpanders.map((e,) => e.name), ["github-repos",],);
  });
});
