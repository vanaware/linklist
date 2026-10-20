/**
 * @file schema_test.ts
 * @description Unit tests for the config validator: structural (ArkType) rules
 * plus the semantic cross-field checks. Pure — no filesystem or network.
 */
import { describe, it, } from "@std/testing/bdd";
import { assert, assertEquals, assertStringIncludes, } from "@std/assert";
import { parseAndValidate, validateConfig, } from "../src/lib/schema.ts";

/** A minimal, valid config used as the base for mutations. */
function baseConfig() {
  return {
    profile: { name: "Jane Doe", },
    links: [{ title: "Site", url: "https://jane.dev", },],
    theme: { preset: "minimal-dark", },
  };
}

describe("validateConfig — structural rules", () => {
  it("accepts a minimal valid config", () => {
    const result = validateConfig(baseConfig(),);
    assert(result.ok, JSON.stringify(result,),);
    if (result.ok) assertEquals(result.data.profile.name, "Jane Doe",);
  });

  it("rejects a missing profile name", () => {
    const cfg = baseConfig();
    (cfg.profile as { name?: string }).name = undefined;
    const result = validateConfig(cfg,);
    assert(!result.ok,);
    if (!result.ok) {
      assert(result.errors.some((e,) => e.includes("profile.name",)),);
    }
  });

  it("rejects a link without a url", () => {
    const cfg = baseConfig();
    cfg.links = [
      { title: "Broken", } as unknown as { title: string; url: string },
    ];
    const result = validateConfig(cfg,);
    assert(!result.ok,);
    if (!result.ok) {
      assert(result.errors.some((e,) => e.includes("links[0].url",)),);
    }
  });

  it("rejects an invalid theme.mode enum", () => {
    const cfg = { ...baseConfig(), theme: { preset: "x", mode: "neon", }, };
    const result = validateConfig(cfg,);
    assert(!result.ok,);
  });
});

describe("validateConfig — semantic cross-field rules", () => {
  it("requires at least one link", () => {
    const cfg = baseConfig();
    cfg.links = [];
    const result = validateConfig(cfg,);
    assert(!result.ok,);
    if (!result.ok) {
      assertStringIncludes(result.errors.join("\n",), "at least one link",);
    }
  });

  it("rejects a non-http(s) link url", () => {
    const cfg = baseConfig();
    cfg.links = [{ title: "Bad", url: "javascript:alert(1)", },];
    const result = validateConfig(cfg,);
    assert(!result.ok,);
    if (!result.ok) {
      assertStringIncludes(
        result.errors.join("\n",),
        "not a valid http(s) URL",
      );
    }
  });

  it("requires avatar_alt when avatar is set", () => {
    const cfg = baseConfig();
    (cfg.profile as Record<string, unknown>).avatar = "./a.png";
    const result = validateConfig(cfg,);
    assert(!result.ok,);
    if (!result.ok) {
      assertStringIncludes(result.errors.join("\n",), "avatar_alt",);
    }
  });

  it("requires plausible_domain when provider is plausible", () => {
    const cfg = { ...baseConfig(), analytics: { provider: "plausible", }, };
    const result = validateConfig(cfg,);
    assert(!result.ok,);
    if (!result.ok) {
      assertStringIncludes(result.errors.join("\n",), "plausible_domain",);
    }
  });

  it("validates github_repos as owner/repo", () => {
    const cfg = {
      ...baseConfig(),
      plugins: { github_repos: ["not-a-repo",], },
    };
    const result = validateConfig(cfg,);
    assert(!result.ok,);
    if (!result.ok) {
      assertStringIncludes(result.errors.join("\n",), "owner/repo",);
    }
  });

  it("accepts extra keys such as $schema", () => {
    const cfg = { $schema: "./config.schema.json", ...baseConfig(), };
    const result = validateConfig(cfg,);
    assert(result.ok, JSON.stringify(result,),);
  });
});

describe("parseAndValidate", () => {
  it("reports malformed JSON with a friendly message", () => {
    const result = parseAndValidate("{ this is not json ",);
    assert(!result.ok,);
    if (!result.ok) {
      assertStringIncludes(result.errors.join("\n",), "invalid JSON",);
    }
  });

  it("parses and validates well-formed JSON", () => {
    const result = parseAndValidate(JSON.stringify(baseConfig(),),);
    assert(result.ok, JSON.stringify(result,),);
  });
});
