/**
 * @file schema.ts
 * @description Config schema validator for `@vanaware/linklist`, built on
 * ArkType (type-first) plus a small set of semantic cross-field checks that
 * ArkType cannot express structurally (URL validity, conditional required
 * fields, non-empty lists).
 *
 * Validation is pure: it takes an in-memory object (or raw JSON text) and
 * returns structured results with friendly, path-pointed error messages. No
 * filesystem or network access happens here — reading `config.json` lives in
 * the browser entry (`entry.ts`) and the `scripts/validate.ts` tooling edge.
 */

import { type, } from "arktype";
import type { LinklistConfig, } from "./types.ts";

/** Result of a successful validation. */
export interface ValidationSuccess {
  ok: true;
  /** The validated, fully-typed configuration. */
  data: LinklistConfig;
}

/** Result of a failed validation. */
export interface ValidationFailure {
  ok: false;
  /** Friendly, human-readable error messages, each pointing at a config path. */
  errors: string[];
}

/** Discriminated union returned by {@linkcode validateConfig}. */
export type ValidationResult = ValidationSuccess | ValidationFailure;

const httpUrl = type("string",);

const profileType = type({
  name: "string>0",
  "tagline?": "string",
  "bio?": "string",
  "avatar?": "string",
  "avatar_alt?": "string",
  "location?": "string",
},);

const linkItemType = type({
  title: "string>0",
  url: httpUrl,
  "icon?": "string",
  "subtitle?": "string",
  "button?": "boolean",
  "new_tab?": "boolean",
  "featured?": "boolean",
  "nofollow?": "boolean",
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

const seoType = type({
  "title?": "string",
  "description?": "string",
  "image?": "string",
  "url?": "string",
  "twitter?": "string",
  "lang?": "string",
  "favicon?": "string",
},);

const analyticsType = type({
  "provider?": "'none' | 'plausible' | 'umami' | 'google'",
  "plausible_domain?": "string",
  "umami_website_id?": "string",
  "google_analytics_id?": "string",
  "click_counter_endpoint?": "string",
},);

const pluginsType = type({
  "github_repos?": "string[]",
  "youtube_channel?": "string",
  "rss_feed?": "string",
  "rss_limit?": "number",
  "show_last_updated?": "boolean",
  "footer_label?": "string",
},);

const sectionType = type({
  "title?": "string",
  "body?": "string",
  "placement?": "'before' | 'after'",
},);

/**
 * Structural ArkType definition for the whole config. Object types are left
 * "inexact" so extra keys (such as `$schema` used for editor autocompletion) do
 * not fail validation.
 */
export const configType = type({
  "version?": "string",
  profile: profileType,
  links: linkItemType.array(),
  theme: themeType,
  "seo?": seoType,
  "analytics?": analyticsType,
  "plugins?": pluginsType,
  "sections?": sectionType.array(),
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

/**
 * Cross-field rules that structural typing cannot express. Receives an object
 * that already passed structural validation and returns additional friendly
 * error strings (empty when the config is semantically valid).
 */
function semanticErrors(data: LinklistConfig,): string[] {
  const errors: string[] = [];

  if (data.links.length < 1) {
    errors.push("links: at least one link is required",);
  }

  data.links.forEach((link, i,) => {
    if (!isHttpUrl(link.url,)) {
      errors.push(
        `links[${i}].url: not a valid http(s) URL (got "${link.url}")`,
      );
    }
  },);

  if (data.profile.avatar && !data.profile.avatar_alt) {
    errors.push("profile.avatar_alt: required when profile.avatar is set",);
  }

  if (data.seo?.url && !isHttpUrl(data.seo.url,)) {
    errors.push(`seo.url: not a valid http(s) URL (got "${data.seo.url}")`,);
  }

  const a = data.analytics;
  if (a?.provider === "plausible" && !a.plausible_domain) {
    errors.push(
      'analytics.plausible_domain: required when provider is "plausible"',
    );
  }
  if (a?.provider === "umami" && !a.umami_website_id) {
    errors.push(
      'analytics.umami_website_id: required when provider is "umami"',
    );
  }
  if (a?.provider === "google" && !a.google_analytics_id) {
    errors.push(
      'analytics.google_analytics_id: required when provider is "google"',
    );
  }
  if (a?.click_counter_endpoint && !isHttpUrl(a.click_counter_endpoint,)) {
    errors.push(
      `analytics.click_counter_endpoint: not a valid http(s) URL (got "${a.click_counter_endpoint}")`,
    );
  }

  data.plugins?.github_repos?.forEach((repo, i,) => {
    if (!/^[^/\s]+\/[^/\s]+$/.test(repo,)) {
      errors.push(
        `plugins.github_repos[${i}]: expected "owner/repo" (got "${repo}")`,
      );
    }
  },);
  if (data.plugins?.rss_feed && !isHttpUrl(data.plugins.rss_feed,)) {
    errors.push(
      `plugins.rss_feed: not a valid http(s) URL (got "${data.plugins.rss_feed}")`,
    );
  }

  return errors;
}

/**
 * Validate an already-parsed config object.
 *
 * @param raw - The unknown value to validate (typically `JSON.parse` output).
 * @returns A {@linkcode ValidationResult}: on success the typed `data`, on
 * failure a list of friendly `errors`.
 * @example
 * ```ts
 * import { validateConfig } from "@vanaware/linklist-core";
 * const result = validateConfig({
 *   profile: { name: "Jane" },
 *   links: [{ title: "Site", url: "https://jane.dev" }],
 *   theme: { preset: "minimal-dark" },
 * });
 * if (result.ok) console.log(result.data.profile.name);
 * else console.error(result.errors);
 * ```
 */
export function validateConfig(raw: unknown,): ValidationResult {
  const structural = configType(raw,);

  if (structural instanceof type.errors) {
    return { ok: false, errors: structural.map((e,) => e.message), };
  }

  const data = structural as LinklistConfig;
  const errors = semanticErrors(data,);
  if (errors.length > 0) {
    return { ok: false, errors, };
  }

  return { ok: true, data, };
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
        `config.json: invalid JSON (${
          err instanceof Error ? err.message : err
        })`,
      ],
    };
  }
  return validateConfig(parsed,);
}
