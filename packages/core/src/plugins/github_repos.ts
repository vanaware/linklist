/**
 * @file github_repos.ts
 * @description `github-repos` plugin. For each `config.plugins.github_repos`
 * entry it fetches the repo (star count) and its latest release through the
 * injected `ctx.fetchJson` and emits a "GitHub" Markdown section. It runs where
 * the host places it — at build time (SaaS) or in the browser — and only fires
 * when the user opts in via config (no default network calls).
 */
import type {
  LinklistPlugin,
  PluginContext,
  PluginOutput,
} from "../plugin.ts";

interface GhRepo {
  stargazers_count?: number;
  html_url?: string;
}

interface GhRelease {
  tag_name?: string;
}

/** Build one Markdown list item for a repo, tolerating a missing latest release. */
async function repoLine(ctx: PluginContext, repo: string,): Promise<string> {
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
}

export const githubReposPlugin: LinklistPlugin = {
  name: "github-repos",
  async run(ctx: PluginContext,): Promise<PluginOutput> {
    const repos = ctx.config.plugins?.github_repos ?? [];
    if (repos.length === 0) return {};
    const lines: string[] = [];
    for (const repo of repos) {
      lines.push(await repoLine(ctx, repo,),);
    }
    return {
      sections: [{
        title: "GitHub",
        body: lines.join("\n",),
        placement: "after",
      },],
    };
  },
};
