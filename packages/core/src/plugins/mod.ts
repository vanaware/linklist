/**
 * @file mod.ts
 * @description Built-in plugins for `@vanaware/linklist`.
 *
 * Plugins fetch remote data (GitHub stars, latest release) through the injected
 * `fetchJson` and return plain data that core merges into the config before
 * rendering — only when the user opts a plugin in via config. They live in core
 * so the engine and its default plugins ship together; there is no separate
 * plugins package.
 */
import type { LinklistPlugin, } from "./engine.ts";
import { githubReposPlugin, } from "./github_repos.ts";

export { githubReposPlugin, } from "./github_repos.ts";

/** Plugins core runs automatically. Extend this list to add more. */
export const builtinPlugins: LinklistPlugin[] = [githubReposPlugin,];
