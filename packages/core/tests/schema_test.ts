/**
 * @file schema_test.ts
 * @description Unit tests for the config validator: structural (ArkType) rules,
 * the **format-driven block classifier** (each authored block names a `format`
 * that decides its render shape and required fields) and the semantic cross-field
 * checks. Pure — no filesystem or network.
 */
import { describe, it, } from "@std/testing/bdd";
import { assert, assertEquals, assertStringIncludes, } from "@std/assert";
import { parseAndValidate, validateConfig, } from "../src/lib/schema.ts";

/** A minimal, valid config (pure `format` blocks) used as the mutation base. */
function baseConfig() {
  return {
    profile: { name: "Jane Doe", },
    blocks: [
      { format: "row", title: "Site", url: "https://jane.dev", },
    ],
    theme: { preset: "minimal-dark", },
  };
}

/** Mutate helper: returns base with `blocks` replaced. */
function withBlocks(blocks: unknown[],) {
  return { ...baseConfig(), blocks, };
}

/** Validate and return the joined error text (asserting it failed). */
function errorsOf(config: unknown,): string {
  const result = validateConfig(config,);
  assert(!result.ok, JSON.stringify(result,),);
  return result.ok ? "" : result.errors.join("\n",);
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

  it("rejects a missing blocks array", () => {
    const cfg = baseConfig();
    delete (cfg as { blocks?: unknown }).blocks;
    const result = validateConfig(cfg,);
    assert(!result.ok,);
    if (!result.ok) {
      assert(result.errors.some((e,) => e.includes("blocks",)),);
    }
  });

  it("rejects an empty blocks array", () => {
    const result = validateConfig(withBlocks([],),);
    assert(!result.ok,);
  });

  it("rejects a block without a format", () => {
    const joined = errorsOf(withBlocks([{ title: "Site", },],),);
    assertStringIncludes(joined, "format",);
  });

  it("rejects an unknown format", () => {
    const joined = errorsOf(
      withBlocks([{
        format: "gallery",
        title: "Site",
        url: "https://a.test",
      },],),
    );
    assertStringIncludes(joined, "format",);
  });

  it("rejects an invalid theme.mode enum", () => {
    const cfg = { ...baseConfig(), theme: { preset: "x", mode: "neon", }, };
    const result = validateConfig(cfg,);
    assert(!result.ok,);
  });
});

describe("validateConfig — block classification by format", () => {
  it("classifies row/button/card as link blocks carrying the format", () => {
    const result = validateConfig(
      withBlocks([
        { format: "row", title: "A", url: "https://a.test", },
        { format: "button", title: "B", url: "https://b.test", },
        { format: "card", title: "C", url: "https://c.test", },
      ],),
    );
    assert(result.ok, JSON.stringify(result,),);
    if (result.ok) {
      const [first, second, third,] = result.data.blocks;
      assertEquals(first?.type, "link",);
      assertEquals(second?.type, "link",);
      assertEquals(third?.type, "link",);
      if (first?.type === "link") {
        assertEquals(first.format, "row",);
        assertEquals(first.link.title, "A",);
        assertEquals(first.link.url, "https://a.test",);
      }
      if (second?.type === "link") assertEquals(second.format, "button",);
      if (third?.type === "link") assertEquals(third.format, "card",);
    }
  });

  it("keeps a link block's optional fields on the link item", () => {
    const result = validateConfig(
      withBlocks([
        {
          format: "card",
          title: "Blog",
          url: "https://jane.dev/blog",
          image: "./cover.svg",
          image_alt: "Blog cover",
          icon: "website",
          subtitle: "Writing",
          new_tab: true,
          nofollow: true,
        },
      ],),
    );
    assert(result.ok, JSON.stringify(result,),);
    if (result.ok) {
      const block = result.data.blocks[0];
      if (block?.type === "link") {
        assertEquals(block.link.image, "./cover.svg",);
        assertEquals(block.link.image_alt, "Blog cover",);
        assertEquals(block.link.icon, "website",);
        assertEquals(block.link.new_tab, true,);
        assertEquals(block.link.nofollow, true,);
      }
    }
  });

  it("classifies a `text` block as a section (body or markdown)", () => {
    const result = validateConfig(
      withBlocks([
        { format: "row", title: "A", url: "https://a.test", },
        { format: "text", title: "About", body: "hi", },
        { format: "text", markdown: "raw", },
      ],),
    );
    assert(result.ok, JSON.stringify(result,),);
    if (result.ok) {
      const [section, bare,] = [result.data.blocks[1], result.data.blocks[2],];
      assertEquals(section?.type, "section",);
      if (section?.type === "section") {
        assertEquals(section.title, "About",);
        assertEquals(section.body, "hi",);
      }
      if (bare?.type === "section") assertEquals(bare.body, "raw",);
    }
  });

  it("rejects a `text` block with no body/markdown", () => {
    const joined = errorsOf(
      withBlocks([
        { format: "row", title: "A", url: "https://a.test", },
        { format: "text", title: "Empty", },
      ],),
    );
    assertStringIncludes(joined, "text",);
    assertStringIncludes(joined, "body",);
  });

  it("classifies a `figure` block as an image", () => {
    const result = validateConfig(
      withBlocks([
        { format: "row", title: "A", url: "https://a.test", },
        {
          format: "figure",
          image: "./cover.svg",
          image_alt: "Cover",
          caption: "c",
        },
      ],),
    );
    assert(result.ok, JSON.stringify(result,),);
    if (result.ok) {
      const block = result.data.blocks[1];
      assertEquals(block?.type, "image",);
      if (block?.type === "image") {
        assertEquals(block.image, "./cover.svg",);
        assertEquals(block.caption, "c",);
      }
    }
  });

  it("requires image and image_alt on a `figure` block", () => {
    const noImage = errorsOf(
      withBlocks([{ format: "figure", image_alt: "x", },],),
    );
    assertStringIncludes(noImage, "figure",);
    const noAlt = errorsOf(
      withBlocks([{ format: "figure", image: "./cover.svg", },],),
    );
    assertStringIncludes(noAlt, "image_alt",);
  });
});

describe("validateConfig — semantic cross-field rules", () => {
  it("requires at least one link block", () => {
    const joined = errorsOf(
      withBlocks([{ format: "text", title: "Only prose", body: "hi", },],),
    );
    assertStringIncludes(joined, "at least one",);
  });

  it("rejects a link block without a title", () => {
    const joined = errorsOf(
      withBlocks([{ format: "row", url: "https://a.test", },],),
    );
    assertStringIncludes(joined, "title",);
  });

  it("rejects a non-http(s) link url", () => {
    const joined = errorsOf(
      withBlocks([{
        format: "row",
        title: "Bad",
        url: "javascript:alert(1)",
      },],),
    );
    assertStringIncludes(joined, "not a valid http(s) URL",);
  });

  it("rejects a non-http profile.url override", () => {
    const joined = errorsOf({
      ...baseConfig(),
      profile: { name: "Jane", url: "not-a-url", },
    },);
    assertStringIncludes(joined, "profile.url",);
  });

  it("requires image_alt when a link block sets image", () => {
    const bad = errorsOf(
      withBlocks([
        {
          format: "card",
          title: "Blog",
          url: "https://jane.dev/blog",
          image: "./cover.svg",
        },
      ],),
    );
    assertStringIncludes(bad, "image_alt",);
    const good = validateConfig(
      withBlocks([
        {
          format: "card",
          title: "Blog",
          url: "https://jane.dev/blog",
          image: "./cover.svg",
          image_alt: "Blog cover art",
        },
      ],),
    );
    assert(good.ok, JSON.stringify(good,),);
  });

  it("accepts known profile.hide fields and rejects unknown ones", () => {
    const good = validateConfig({
      ...baseConfig(),
      profile: { name: "Jane", hide: ["bio", "location",], },
    },);
    assert(good.ok, JSON.stringify(good,),);
    const bad = validateConfig({
      ...baseConfig(),
      profile: { name: "Jane", hide: ["name",], },
    },);
    assert(!bad.ok,);
  });

  it("requires theme.custom colors to be plain hex", () => {
    const bad = errorsOf({
      ...baseConfig(),
      theme: { preset: "x", custom: { primary_color: "red", }, },
    },);
    assertStringIncludes(bad, "theme.custom.primary_color",);
    const good = validateConfig({
      ...baseConfig(),
      theme: { preset: "x", custom: { primary_color: "#a78bfa", }, },
    },);
    assert(good.ok, JSON.stringify(good,),);
  });

  it("rejects markup-bearing font_family / radius values", () => {
    const joined = errorsOf({
      ...baseConfig(),
      theme: {
        preset: "x",
        custom: { font_family: "ui</style><script>", radius: "1px; }", },
      },
    },);
    assertStringIncludes(joined, "theme.custom.font_family",);
    assertStringIncludes(joined, "theme.custom.radius",);
  });

  it("requires avatar_alt when avatar is set", () => {
    const cfg = baseConfig();
    (cfg.profile as Record<string, unknown>).avatar = "./a.png";
    const joined = errorsOf(cfg,);
    assertStringIncludes(joined, "avatar_alt",);
  });

  it("accepts the editor-only $schema key (inexact objects)", () => {
    const result = validateConfig({
      $schema: "./config.schema.json",
      ...baseConfig(),
    },);
    assert(result.ok, JSON.stringify(result,),);
  });

  it("accepts a footer block", () => {
    const result = validateConfig({
      ...baseConfig(),
      footer: { show_last_updated: true, },
    },);
    assert(result.ok, JSON.stringify(result,),);
    if (result.ok) assertEquals(result.data.footer?.show_last_updated, true,);
  });

  it("accepts a valid footer.updated content date", () => {
    const result = validateConfig({
      ...baseConfig(),
      footer: { show_last_updated: true, updated: "2026-10-18", },
    },);
    assert(result.ok, JSON.stringify(result,),);
    if (result.ok) assertEquals(result.data.footer?.updated, "2026-10-18",);
  });

  it("rejects a malformed footer.updated", () => {
    const joined = errorsOf({
      ...baseConfig(),
      footer: { updated: "18/10/2026", },
    },);
    assertStringIncludes(joined, "footer.updated",);
  });

  it("rejects a non-existent footer.updated calendar date", () => {
    const joined = errorsOf({
      ...baseConfig(),
      footer: { updated: "2026-02-30", },
    },);
    assertStringIncludes(joined, "footer.updated",);
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
