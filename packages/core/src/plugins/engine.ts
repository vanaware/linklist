/**
 * @file engine.ts
 * @description Plugin contract and block expansion. A plugin is expressed as a
 * `plugin` block that carries its own data (e.g. `repos`); the engine runs the
 * matching **expander** and splices the produced blocks back in place, so the
 * declared `blocks` order stays the final display order. Plugins run wherever
 * the host puts them — in the browser for the static site, or at build time for
 * the future SaaS tier — and fetch remote data through an **injected**
 * `fetchJson` (never a global). Nothing is fetched unless the user places a
 * plugin block in their config, and there is no analytics/tracking — honoring
 * the privacy and performance rules. Because the network and filesystem stay on
 * the caller's side, this module is reusable by the SaaS tier.
 */
import type { Block, LinklistConfig, } from "../lib/types.ts";

/** Everything an expander is allowed to touch. Fully injectable for tests. */
export interface PluginContext {
  /** Fetch and parse a JSON resource. Provided by the host; mocked in tests. */
  fetchJson(url: string,): Promise<unknown>;
  /** Report a non-fatal, human-readable warning. */
  warn(message: string,): void;
}

/**
 * Turns a `plugin` block's data into render-ready blocks. `expand` returns the
 * blocks that replace the anchor **in place** (typically a `links` block and/or
 * `section` blocks); returning an empty array drops the block. Failures should
 * be isolated per item so one bad fetch cannot break the whole page.
 */
export interface BlockExpander {
  /** Plugin id this expander serves (matches {@linkcode PluginBlock.name}). */
  name: string;
  /** Expand a plugin block's `repos` data into blocks for its position. */
  expand(repos: string[], ctx: PluginContext,): Promise<Block[]>;
}

/**
 * Resolve a config's `blocks` for rendering: every `plugin` block is replaced
 * in-place by its expander's output; plugin blocks with empty data (or an
 * unknown name) vanish. Other blocks pass through untouched, so the declared
 * order is the final display order and the config is never mutated. Expansion
 * is async because fetchers run here; failures inside an expander are its own
 * responsibility (see `github_repos.ts`).
 *
 * @param config - The validated base config (source of `blocks`).
 * @param ctx - The injectable plugin context (fetch + warn).
 * @param expanders - Registered {@linkcode BlockExpander}s (see `mod.ts`).
 * @returns A flat, render-ready block list.
 */
export async function resolveBlocks(
  config: LinklistConfig,
  ctx: PluginContext,
  expanders: BlockExpander[],
): Promise<Block[]> {
  const byName = new Map(expanders.map((e,) => [e.name, e,]),);
  const resolved: Block[] = [];
  for (const block of config.blocks) {
    if (block.type !== "plugin") {
      resolved.push(block,);
      continue;
    }
    const expander = byName.get(block.name,);
    if (!expander || block.repos.length === 0) continue;
    resolved.push(...await expander.expand(block.repos, ctx,),);
  }
  return resolved;
}
