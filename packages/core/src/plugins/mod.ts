/**
 * @file mod.ts
 * @description Built-in plugin expanders for `@vanaware/linklist`.
 *
 * Expanders fetch remote data (GitHub stars, latest release) through the
 * injected `fetchJson` and return render-ready blocks that `resolveBlocks`
 * splices in place — only when the user adds a matching `plugin` block to
 * `config.blocks`. They live in core so the engine and its default expanders
 * ship together; there is no separate plugins package.
 */
import type { BlockExpander, } from "./engine.ts";
import { githubReposExpander, } from "./github_repos.ts";

export { githubReposExpander, } from "./github_repos.ts";

/** Expanders core runs for `plugin` blocks. Extend this list to add more. */
export const builtinExpanders: BlockExpander[] = [githubReposExpander,];
