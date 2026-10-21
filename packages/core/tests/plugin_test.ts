/**
 * @file plugin_test.ts
 * @description Unit tests for block expansion in core. `resolveBlocks` runs each
 * `plugin` block's expander with its own `repos` and splices the produced blocks
 * back in place — preserving order, dropping empty/unknown anchors, and never
 * mutating the base config.
 */
import { assertEquals, } from "@std/assert";
import { describe, it, } from "@std/testing/bdd";
import { resolveBlocks, } from "../src/plugins/engine.ts";
import type { BlockExpander, PluginContext, } from "../src/plugins/engine.ts";
import type { Block, LinklistConfig, } from "../src/lib/types.ts";

const ctx: PluginContext = {
  fetchJson: () => Promise.resolve({},),
  warn: () => {},
};

function linkBlock(title: string,): Block {
  return {
    type: "link",
    format: "row",
    link: { title, url: `https://${title}.test`, },
  };
}

function configWith(blocks: Block[],): LinklistConfig {
  return {
    profile: { name: "Jane", },
    blocks,
    theme: { preset: "minimal-dark", },
  };
}

describe("resolveBlocks", () => {
  it("expands a plugin block in place via its expander", async () => {
    const expander: BlockExpander = {
      name: "a",
      expand: (repos,) =>
        Promise.resolve(repos.length ? [linkBlock("X",),] : [],),
    };
    const config = configWith([
      linkBlock("Blog",),
      { type: "plugin", name: "a", repos: ["o/r",], },
    ],);
    const resolved = await resolveBlocks(config, ctx, [expander,],);
    assertEquals(resolved.map((b,) => b.type), ["link", "link",],);
    // original config untouched
    assertEquals(config.blocks.length, 2,);
  });

  it("splices links then section blocks the expander returns, in order", async () => {
    const expander: BlockExpander = {
      name: "a",
      expand: () =>
        Promise.resolve([
          linkBlock("X",),
          { type: "section", title: "S", body: "s", },
        ],),
    };
    const config = configWith([
      linkBlock("First",),
      { type: "plugin", name: "a", repos: ["o/r",], },
    ],);
    const resolved = await resolveBlocks(config, ctx, [expander,],);
    assertEquals(resolved.map((b,) => b.type), ["link", "link", "section",],);
  });

  it("drops a plugin block with empty repos (expander never runs)", async () => {
    let ran = false;
    const expander: BlockExpander = {
      name: "a",
      expand: () => {
        ran = true;
        return Promise.resolve([linkBlock("X",),],);
      },
    };
    const config = configWith([
      linkBlock("Blog",),
      { type: "plugin", name: "a", repos: [], },
    ],);
    const resolved = await resolveBlocks(config, ctx, [expander,],);
    assertEquals(ran, false,);
    assertEquals(resolved.length, 1,);
    assertEquals(resolved[0]!.type, "link",);
  });

  it("drops a plugin block whose name has no expander", async () => {
    const config = configWith([
      { type: "plugin", name: "unknown", repos: ["o/r",], },
    ],);
    const resolved = await resolveBlocks(config, ctx, [],);
    assertEquals(resolved.length, 0,);
  });

  it("preserves the relative order and expands multiple blocks", async () => {
    const p: BlockExpander = {
      name: "p",
      expand: () =>
        Promise.resolve([{
          type: "section",
          title: "From plugin",
          body: "b",
        },],),
    };
    const config = configWith([
      { type: "section", title: "Intro", },
      { type: "plugin", name: "p", repos: ["o/r",], },
      linkBlock("L",),
      { type: "plugin", name: "gone", repos: [], },
    ],);
    const resolved = await resolveBlocks(config, ctx, [p,],);
    const shapes = resolved.map((b,) => {
      if (b.type === "link") return `link:${b.link.title}`;
      if (b.type === "section") return `section:${b.title}`;
      if (b.type === "plugin") return `plugin:${b.name}`;
      return b.type;
    },);
    assertEquals(shapes, ["section:Intro", "section:From plugin", "link:L",],);
  });

  it("passes non-plugin blocks through untouched", async () => {
    const blocks: Block[] = [
      linkBlock("Blog",),
      { type: "section", title: "S", body: "b", },
      { type: "image", image: "./a.svg", image_alt: "A", },
    ];
    const resolved = await resolveBlocks(configWith(blocks,), ctx, [],);
    assertEquals(resolved, blocks,);
  });
});
