/// <reference lib="deno.ns" />

/**
 * @file validate.ts
 * @description Validate a `config.json` with the pure core validator and print
 * friendly, path-pointed errors. This is the small I/O edge that replaced the
 * removed `cli` package: reading the file and setting a process exit code.
 *
 *   deno run -A scripts/validate.ts packages/core/public/config.json
 */
import { parseAndValidate, } from "@vanaware/linklist-core";

const configPath = Deno.args[0] ?? "config.json";
const asJson = Deno.args.includes("--json",);

function report(ok: boolean, errors: string[],): void {
  if (asJson) {
    console.log(JSON.stringify(ok ? { ok: true, } : { ok: false, errors, },),);
  } else if (ok) {
    console.log(`✔ ${configPath} is a valid linklist config.`,);
  } else {
    console.error(`✖ ${configPath} has ${errors.length} problem(s):`,);
    for (const message of errors) console.error(`  - ${message}`,);
  }
}

const text = await Deno.readTextFile(configPath,).catch(() => null);
if (text === null) {
  report(false, [`cannot read ${configPath}`,],);
  Deno.exit(1,);
}

const result = parseAndValidate(text,);
report(result.ok, result.ok ? [] : result.errors,);
if (!result.ok) Deno.exit(1,);
