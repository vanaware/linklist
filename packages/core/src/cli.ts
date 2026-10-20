/**
 * @file cli.ts
 * @description Linklist command-line tools (Cliffy). Two subcommands:
 *
 *   - `build`    generates `index.html`, `manifest.json` and `robots.txt` from a
 *                `config.json` into the output folder (default: `packages/core/public`),
 *                so buildit copies the finalized files into `dist` unchanged.
 *   - `validate` validates a `config.json` and prints friendly, path-pointed
 *                errors (absorbs the former `scripts/validate.ts`).
 *
 * The command objects are exported (via `mod.ts`) WITHOUT running them; parsing
 * only happens when this module is executed directly (`deno run .../cli.ts`).
 * Filesystem access lives exclusively here and in {@linkcode buildSiteFiles} —
 * the pure builders in `lib/generate.ts` stay side-effect-free for reuse by a
 * future server `main.ts`.
 */
import { Command, } from "@cliffy/command";
import { dirname, join, resolve, } from "@std/path";
import { generateSite, } from "./lib/generate.ts";
import { parseAndValidate, } from "./lib/schema.ts";
import type { LinklistConfig, } from "./lib/types.ts";

/** Factory defaults, expressed relative to the repo root (where the task runs). */
const DEFAULT_CONFIG = "./packages/core/public/config.json";
const DEFAULT_OUT = "./packages/core/public";

/** Read + validate a config file, throwing human-readable errors on failure. */
async function loadConfig(path: string,): Promise<LinklistConfig> {
  const text = await Deno.readTextFile(path,).catch(() => null);
  if (text === null) {
    throw new Error(`cannot read config at ${resolve(path,)}`,);
  }
  const result = parseAndValidate(text,);
  if (!result.ok) {
    throw new Error(
      `${path} is invalid:\n  - ${result.errors.join("\n  - ",)}`,
    );
  }
  return result.data;
}

/**
 * Generate the static site files from `config` and write them into `outDir`.
 * This is the thin filesystem edge around the pure {@linkcode generateSite}
 * routine; it returns the absolute paths written. Reusable by any host.
 */
export async function buildSiteFiles(
  config: LinklistConfig,
  outDir: string,
  opts: { baseUrl?: string } = {},
): Promise<string[]> {
  const base = resolve(outDir,);
  const written: string[] = [];
  for (const file of generateSite(config, opts,)) {
    const target = join(base, file.name,);
    await Deno.mkdir(dirname(target,), { recursive: true, },);
    await Deno.writeTextFile(target, file.content,);
    written.push(target,);
  }
  return written;
}

/** The root `linklist` program; the subcommands below attach to it. */
export const linklistCommand: Command = new Command()
  .name("linklist",)
  .description("Linklist build & validation tools.",)
  .default("help",);

/** `linklist build` — render config.json into the public static files. */
export const buildCommand = linklistCommand
  .command("build",)
  .description(
    "Generate index.html, manifest.json and robots.txt from config.json.",
  )
  .option(
    "-c, --config <path:string>",
    "Path to the source config.json.",
    { default: DEFAULT_CONFIG, },
  )
  .option(
    "-o, --out <dir:string>",
    "Output directory (buildit copies it into dist).",
    { default: DEFAULT_OUT, },
  )
  .option(
    "--base-url <url:string>",
    "Absolute base URL for canonical/OG links (defaults to seo.url).",
  )
  .action(async ({ config, out, baseUrl, },) => {
    const data = await loadConfig(config,);
    const written = await buildSiteFiles(data, out, { baseUrl, },);
    for (const path of written) {
      console.log(`  wrote ${path}`,);
    }
    console.log(
      `✔ linklist build: ${written.length} file(s) → ${resolve(out,)}`,
    );
  },);

/** `linklist validate [path]` — validate a config.json (exit 1 on failure). */
export const validateCommand = linklistCommand
  .command("validate [path:string]",)
  .description("Validate a config.json and print path-pointed errors.",)
  .option("--json", "Emit a machine-readable JSON report.",)
  .action(async ({ json, }, path,) => {
    const configPath = path ?? DEFAULT_CONFIG;
    const text = await Deno.readTextFile(configPath,).catch(() => null);
    const errors: string[] = [];
    if (text === null) {
      errors.push(`cannot read ${configPath}`,);
    } else {
      const result = parseAndValidate(text,);
      if (!result.ok) errors.push(...result.errors,);
    }
    const ok = errors.length === 0;
    if (json) {
      console.log(
        JSON.stringify(ok ? { ok: true, } : { ok: false, errors, },),
      );
    } else if (ok) {
      console.log(`✔ ${configPath} is a valid linklist config.`,);
    } else {
      console.error(`✖ ${configPath} has ${errors.length} problem(s):`,);
      for (const message of errors) console.error(`  - ${message}`,);
    }
    if (!ok) Deno.exit(1,);
  },);

if (import.meta.main) {
  await linklistCommand.parse(Deno.args,);
}
