/**
 * @file schema.ts
 * @description Config schema validator for `@vanaware/linklist`, built on
 * ArkType (type-first) plus the **block classifier** and a set of semantic
 * cross-field checks that ArkType cannot express structurally (URL validity,
 * conditional required fields, non-empty lists).
 *
 * The authored `config.json` uses **pure blocks**: every `config.blocks` entry
 * is a single self-contained item that names a predefined `format` (`row` /
 * `button` / `card` / `text` / `figure` / `repos`). This module validates each
 * block's fields against its `format` and returns a fully discriminated
 * {@linkcode LinklistConfig} whose `blocks` carry a `type` tag. Everything
 * downstream (`App`, `generate.ts`, `plugins/engine.ts`) therefore switches on
 * `block.type`. Validation is pure: it takes an in-memory object (or raw JSON
 * text) and returns structured, path-pointed results — no filesystem or network
 * access (that lives in `entry.ts` / `cli.ts`).
 */

import { type, } from "arktype";
import type {
  Block,
  BlockFormat,
  FooterConfig,
  LinkItem,
  LinklistConfig,
  Profile,
  ThemeConfig,
} from "./types.ts";

/** Result of a successful validation. */
export interface ValidationSuccess {
  /** Success discriminant — `data` is present when `true`. */
  ok: true;
  /** The validated, fully-typed configuration (blocks carry their `type`). */
  data: LinklistConfig;
}

/** Result of a failed validation. */
export interface ValidationFailure {
  /** Failure discriminant — `errors` is non-empty when `false`. */
  ok: false;
  /** Friendly, human-readable error messages, each pointing at a config path. */
  errors: string[];
}

/** Discriminated union returned by {@linkcode validateConfig}. */
export type ValidationResult = ValidationSuccess | ValidationFailure;

const profileFieldType = type("'tagline' | 'bio' | 'avatar' | 'location'",);

// `profile` now carries BOTH screen fields and head-only overrides (the old
// top-level `seo` section folded in here).
const profileType = type({
  name: "string>0",
  "tagline?": "string",
  "bio?": "string",
  "avatar?": "string",
  "avatar_alt?": "string",
  "location?": "string",
  "hide?": profileFieldType.array(),
  "title?": "string",
  "description?": "string",
  "image?": "string",
  "url?": "string",
  "twitter?": "string",
  "lang?": "string",
  "favicon?": "string",
},);

const themeTokensType = type({
  "primary_color?": "string",
  "background_color?": "string",
  "text_color?": "string",
  "font_family?": "string",
  "radius?": "string",
  "shadow?": "'none' | 'small' | 'medium' | 'large'",
},);

const themeType = type({
  preset: "string>0",
  "mode?": "'light' | 'dark' | 'auto'",
  "custom?": themeTokensType,
},);

const footerType = type({
  "show_last_updated?": "boolean",
  "updated?": "string",
  "label?": "string",
},);

// The authored block: `format` (a required enum) picks the presentation, the
// remaining fields are loosely optional so the classifier — not ArkType — can
// report precise, per-format cross-field errors. Kept "inexact" so an
// editor-only stray key does not fail parsing.
const rawBlockType = type({
  format: "'row' | 'button' | 'card' | 'text' | 'figure' | 'repos'",
  "title?": "string",
  "url?": "string",
  "icon?": "string",
  "image?": "string",
  "image_alt?": "string",
  "subtitle?": "string",
  "caption?": "string",
  "body?": "string",
  "markdown?": "string",
  "new_tab?": "boolean",
  "nofollow?": "boolean",
  "repos?": "string[]",
},);

/** An authored block, before classification into a {@linkcode Block}. */
interface RawBlock {
  format: BlockFormat;
  title?: string;
  url?: string;
  icon?: string;
  image?: string;
  image_alt?: string;
  subtitle?: string;
  caption?: string;
  body?: string;
  markdown?: string;
  new_tab?: boolean;
  nofollow?: boolean;
  repos?: string[];
}

/** Structural shape of the authored config; `blocks` are still {@linkcode RawBlock}s. */
interface ConfigInput {
  version?: string;
  profile: Profile;
  blocks: RawBlock[];
  theme: ThemeConfig;
  footer?: FooterConfig;
}

/**
 * Structural ArkType definition for the whole config. Object types are left
 * "inexact" so editor-only keys (such as `$schema`) do not fail parsing.
 */
export const configType = type({
  "version?": "string",
  profile: profileType,
  blocks: rawBlockType.array(),
  theme: themeType,
  "footer?": footerType,
},);

/** Returns true when `value` parses as an absolute http(s) URL. */
function isHttpUrl(value: string,): boolean {
  try {
    const u = new URL(value,);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

/** Plain hex colors only (#rgb…#rrggbbaa) — what favicon/CSS consumers accept. */
const HEX_COLOR = /^#([0-9a-fA-F]{3,8})$/;

/** CSS-ish token values must never carry structural markup/terminator chars. */
const CSS_UNSAFE = /[<>{};"]/;

/** `owner/repo` (GitHub) shape. */
const OWNER_REPO = /^[^/\s]+\/[^/\s]+$/;

/** A calendar `YYYY-MM-DD` date (the footer's content last-updated stamp). */
function isIsoDate(value: string,): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value,)) return false;
  const time = Date.parse(value,);
  if (Number.isNaN(time,)) return false;
  // Reject day-overflow roll-over (e.g. "2026-02-30" parses to 2026-03-02).
  return new Date(time,).toISOString().slice(0, 10,) === value;
}

/**
 * Build (and validate) a {@linkcode LinkItem} from a link block's fields,
 * appending friendly per-field errors. Returns `null` when a required field is
 * missing or invalid so {@linkcode classifyBlock} can skip the block.
 */
function buildLink(
  block: RawBlock,
  at: string,
  errors: string[],
): LinkItem | null {
  const missingTitle = !block.title;
  const badUrl = !block.url || !isHttpUrl(block.url,);
  const missingAlt = !!block.image && !block.image_alt;
  if (missingTitle) errors.push(`${at}.title: required for a link block`,);
  if (badUrl) {
    errors.push(
      `${at}.url: not a valid http(s) URL (got "${block.url ?? ""}")`,
    );
  }
  if (missingAlt) {
    errors.push(`${at}.image_alt: required when image is set`,);
  }
  if (missingTitle || badUrl || missingAlt) return null;
  return {
    title: block.title!,
    url: block.url!,
    icon: block.icon,
    image: block.image,
    image_alt: block.image_alt,
    subtitle: block.subtitle,
    new_tab: block.new_tab,
    nofollow: block.nofollow,
  };
}

/**
 * Classify one authored block: validate its fields against its `format` and
 * return the matching discriminated render shape, or `null` (after pushing
 * errors) when the block is unusable, so {@linkcode validateConfig} can collect
 * every problem in one pass.
 */
function classifyBlock(
  block: RawBlock,
  i: number,
  errors: string[],
): Block | null {
  const at = `blocks[${i}]`;

  switch (block.format) {
    case "row":
    case "button":
    case "card": {
      const link = buildLink(block, at, errors,);
      return link ? { type: "link", format: block.format, link, } : null;
    }
    case "text": {
      const body = block.body ?? block.markdown;
      if (body === undefined) {
        errors.push(`${at}: a "text" block needs a "body" (or "markdown")`,);
        return null;
      }
      return { type: "section", title: block.title, body, };
    }
    case "figure": {
      if (!block.image) {
        errors.push(`${at}: a "figure" block needs an "image"`,);
        return null;
      }
      if (!block.image_alt) {
        errors.push(`${at}.image_alt: required when image is set`,);
        return null;
      }
      return {
        type: "image",
        image: block.image,
        image_alt: block.image_alt,
        caption: block.caption,
      };
    }
    case "repos": {
      const repos = block.repos ?? [];
      if (repos.length === 0) {
        errors.push(`${at}: a "repos" block needs at least one "owner/repo"`,);
        return null;
      }
      repos.forEach((repo, j,) => {
        if (!OWNER_REPO.test(repo,)) {
          errors.push(
            `${at}.repos[${j}]: expected "owner/repo" (got "${repo}")`,
          );
        }
      },);
      return { type: "plugin", name: "github-repos", repos, };
    }
    default:
      return null;
  }
}

/**
 * Cross-field rules on the already-classified config that ArkType cannot
 * express. Receives the parsed config and the inferred blocks; returns
 * additional friendly error strings.
 */
function semanticErrors(
  data: ConfigInput,
  blocks: Block[],
): string[] {
  const errors: string[] = [];

  // The page must show at least one link (a row/button/card block) or a repos block.
  const visible = blocks.filter((b,) =>
    b.type === "link" || b.type === "plugin"
  );
  if (visible.length === 0) {
    errors.push(
      'blocks: at least one link block ("row", "button" or "card") or a "repos" block is required',
    );
  }

  const { profile, theme, footer, } = data;
  if (profile.avatar && !profile.avatar_alt) {
    errors.push("profile.avatar_alt: required when profile.avatar is set",);
  }
  if (profile.url && !isHttpUrl(profile.url,)) {
    errors.push(`profile.url: not a valid http(s) URL (got "${profile.url}")`,);
  }
  if (footer?.updated && !isIsoDate(footer.updated,)) {
    errors.push(
      `footer.updated: expected a "YYYY-MM-DD" date (got "${footer.updated}")`,
    );
  }

  const tokens = theme.custom;
  for (
    const key of ["primary_color", "background_color", "text_color",] as const
  ) {
    const value = tokens?.[key];
    if (value && !HEX_COLOR.test(value,)) {
      errors.push(
        `theme.custom.${key}: expected a hex color like #rgb or #rrggbb (got "${value}")`,
      );
    }
  }
  for (const key of ["font_family", "radius",] as const) {
    const value = tokens?.[key];
    if (value && CSS_UNSAFE.test(value,)) {
      errors.push(
        `theme.custom.${key}: contains an unsafe character (one of < > { } ; ")`,
      );
    }
  }

  return errors;
}

/**
 * Validate an already-parsed config object. Parses the structure, classifies
 * every authored block (by its `format`) into its discriminated render shape,
 * then runs the cross-field checks. On success returns a {@linkcode LinklistConfig}
 * whose `blocks` already carry their inferred `type`.
 *
 * @param raw - The unknown value to validate (typically `JSON.parse` output).
 * @returns A {@linkcode ValidationResult}: on success the typed `data`, on
 * failure a list of friendly, path-pointed `errors`.
 * @example
 * ```ts
 * import { validateConfig } from "@vanaware/linklist";
 * const result = validateConfig({
 *   profile: { name: "Jane" },
 *   blocks: [
 *     { format: "row", title: "Site", url: "https://jane.dev" },
 *     { format: "repos", repos: ["vanaware/linklist"] },
 *   ],
 *   theme: { preset: "minimal-dark" },
 * });
 * if (result.ok) console.log(result.data.blocks[0]?.type); // "link"
 * else console.error(result.errors);
 * ```
 */
export function validateConfig(raw: unknown,): ValidationResult {
  const structural = configType(raw,);

  if (structural instanceof type.errors) {
    return { ok: false, errors: structural.map((e,) => e.message), };
  }

  const data = structural as ConfigInput;
  const errors: string[] = [];

  const blocks: Block[] = [];
  data.blocks.forEach((block, i,) => {
    const classified = classifyBlock(block, i, errors,);
    if (classified) blocks.push(classified,);
  },);

  errors.push(...semanticErrors(data, blocks,),);

  if (errors.length > 0) return { ok: false, errors, };

  const config: LinklistConfig = {
    ...(data.version !== undefined ? { version: data.version, } : {}),
    profile: data.profile,
    blocks,
    theme: data.theme,
    ...(data.footer !== undefined ? { footer: data.footer, } : {}),
  };
  return { ok: true, data: config, };
}

/**
 * Convenience wrapper: parse a JSON string, then validate it. Produces a single
 * friendly error when the JSON itself is malformed.
 *
 * @param jsonText - Raw `config.json` contents.
 * @returns A {@linkcode ValidationResult}.
 */
export function parseAndValidate(jsonText: string,): ValidationResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText,);
  } catch (err) {
    return {
      ok: false,
      errors: [
        `config.json: invalid JSON (${err instanceof Error ? err.message : err
        })`,
      ],
    };
  }
  return validateConfig(parsed,);
}
