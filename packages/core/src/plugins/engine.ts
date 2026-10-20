/**
 * @file engine.ts
 * @description Plugin contract and orchestration. Plugins run where the host
 * puts them: at build time for the SaaS tier, or in the browser for the static
 * site. Either way they fetch remote data through an **injected** `fetchJson`
 * (never a global) and return plain data that core merges into the config before
 * rendering. Nothing is fetched unless the user opts a plugin in via config, and
 * there is no analytics/tracking — honoring the privacy and performance rules.
 * Because the network and filesystem stay on the caller's side, this module is
 * reusable by the SaaS tier.
 */
import type {
  ContentSection,
  LinkItem,
  LinklistConfig,
} from "../lib/types.ts";

/** What a plugin contributes to the page. Both are appended, never replacing. */
export interface PluginOutput {
  /** Extra links added to the link list. */
  links?: LinkItem[];
  /** Extra content sections added after the links. */
  sections?: ContentSection[];
}

/** Everything a plugin is allowed to touch. Fully injectable for tests. */
export interface PluginContext {
  /** The validated config (read-only source of truth). */
  config: LinklistConfig;
  /** Fetch and parse a JSON resource. Provided by the host; mocked in tests. */
  fetchJson(url: string,): Promise<unknown>;
  /** Report a non-fatal, human-readable warning. */
  warn(message: string,): void;
}

/** A build-time plugin. */
export interface LinklistPlugin {
  /** Unique plugin id, used in logs. */
  name: string;
  /** Run the plugin, returning data contributions. */
  run(ctx: PluginContext,): Promise<PluginOutput>;
}

/**
 * Run plugins in order, isolating failures: a plugin that throws (for example a
 * rate-limited or offline fetch) only logs a warning and is skipped, so the
 * static build still succeeds.
 *
 * @param plugins - The plugins to run.
 * @param ctx - The injectable plugin context.
 * @returns The collected outputs (empty entries omitted by the caller's merge).
 */
export async function runPlugins(
  plugins: LinklistPlugin[],
  ctx: PluginContext,
): Promise<PluginOutput[]> {
  const outputs: PluginOutput[] = [];
  for (const plugin of plugins) {
    try {
      outputs.push(await plugin.run(ctx,),);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error,);
      ctx.warn(`${plugin.name} skipped: ${message}`,);
    }
  }
  return outputs;
}

/**
 * Merge plugin outputs into a copy of the config (links and sections are
 * appended). The original config is never mutated.
 *
 * @param config - The validated base config.
 * @param outputs - Outputs returned by {@link runPlugins}.
 * @returns A new config with plugin contributions appended.
 */
export function mergePluginOutputs(
  config: LinklistConfig,
  outputs: PluginOutput[],
): LinklistConfig {
  const links = [...config.links,];
  const sections = [...(config.sections ?? []),];
  for (const output of outputs) {
    if (output.links) links.push(...output.links,);
    if (output.sections) sections.push(...output.sections,);
  }
  return { ...config, links, sections, };
}
