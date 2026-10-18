/**
 * @file plugin_test.ts
 * @description Unit tests for the build-time plugin orchestration in core:
 * `runPlugins` isolates failures, and `mergePluginOutputs` appends contributions
 * without mutating the base config.
 */
import { assertEquals, assertStringIncludes, } from "@std/assert";
import { describe, it, } from "@std/testing/bdd";
import { mergePluginOutputs, runPlugins, } from "../src/plugin.ts";
import type {
  LinklistConfig,
  LinklistPlugin,
  PluginContext,
} from "../src/mod.ts";

const config: LinklistConfig = {
  profile: { name: "Jane", bio: "hi", },
  links: [{ title: "Blog", url: "https://example.com", },],
  theme: { preset: "minimal-dark", },
};

function ctx(overrides: Partial<PluginContext> = {},): PluginContext {
  return {
    config,
    fetchJson: () => Promise.resolve({},),
    warn: () => {},
    ...overrides,
  };
}

describe("runPlugins", () => {
  it("collects an output from every plugin", async () => {
    const a: LinklistPlugin = {
      name: "a",
      run: () =>
        Promise.resolve({ links: [{ title: "A", url: "https://a.test", },], },),
    };
    const b: LinklistPlugin = {
      name: "b",
      run: () => Promise.resolve({ sections: [{ title: "S", body: "s", },], },),
    };
    const outputs = await runPlugins([a, b,], ctx(),);
    assertEquals(outputs.length, 2,);
  });

  it("isolates failures: a throwing plugin is skipped with a warning", async () => {
    const warnings: string[] = [];
    const boom: LinklistPlugin = {
      name: "boom",
      run: () => Promise.reject(new Error("offline",),),
    };
    const ok: LinklistPlugin = {
      name: "ok",
      run: () =>
        Promise.resolve({ links: [{ title: "K", url: "https://k.test", },], },),
    };
    const outputs = await runPlugins(
      [boom, ok,],
      ctx({ warn: (m,) => warnings.push(m,), },),
    );
    assertEquals(outputs.length, 1,);
    assertEquals(warnings.length, 1,);
    assertStringIncludes(warnings[0]!, "boom skipped",);
  });
});

describe("mergePluginOutputs", () => {
  it("appends links and sections without mutating the original", () => {
    const merged = mergePluginOutputs(config, [
      { links: [{ title: "X", url: "https://x.test", },], },
    ],);
    assertEquals(merged.links.length, 2,);
    assertEquals(config.links.length, 1,); // original untouched
    assertEquals(merged.sections, [],);
  });
});
