/**
 * @file github_repos.ts
 * @description The built-in `github-repos` block expander. For each `repos`
 * entry on a `plugin` block it fetches the repo (star count) and its latest
 * release through the injected `ctx.fetchJson` and emits a "GitHub" Markdown
 * section, placed where the block sits. It runs wherever the host places it —
 * at build time (SaaS) or in the browser — and only fires when the user adds a
 * `repos` block (no default network calls). A failing repo degrades to a plain
 * link rather than breaking the page.
 */
import type { Block, } from "../lib/types.ts";
import type { BlockExpander, PluginContext, } from "./engine.ts";

interface GhRepo {
  stargazers_count?: number;
  html_url?: string;
}

interface GhRelease {
  tag_name?: string;
}

/** Build one Markdown list item for a repo, tolerating a missing/failing fetch. */
async function repoLine(ctx: PluginContext, repo: string,): Promise<string> {
  try {
    const info = (await ctx.fetchJson(
      `https://api.github.com/repos/${repo}`,
    )) as GhRepo;
    let meta = `★ ${info.stargazers_count ?? 0}`;
    try {
      const release = (await ctx.fetchJson(
        `https://api.github.com/repos/${repo}/releases/latest`,
      )) as GhRelease;
      if (release?.tag_name) meta += ` · ${release.tag_name}`;
    } catch {
      // Repos without releases return 404; that is expected, keep just the stars.
    }
    const url = info.html_url ?? `https://github.com/${repo}`;
    return `- [${repo}](${url}) — ${meta}`;
  } catch {
    // Repo fetch failed (rate limit / offline): keep a plain link so the
    // rest of the section still renders.
    return `- [${repo}](https://github.com/${repo})`;
  }
}

/**
 * Built-in `github-repos` expander: fetches each configured `owner/repo` and
 * renders one Markdown section listing stars (and the latest release tag when
 * present). See `plugins.md`.
 */
export const githubReposExpander: BlockExpander = {
  name: "github-repos",
  async expand(repos: string[], ctx: PluginContext,): Promise<Block[]> {
    if (repos.length === 0) return [];
    const lines: string[] = [];
    for (const repo of repos) {
      lines.push(await repoLine(ctx, repo,),);
    }
    return [{
      type: "section",
      title: "GitHub",
      body: lines.join("\n",),
    },];
  },
};
