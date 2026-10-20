/**
 * @file state.ts
 * @description Central reactive state for the linklist app, built on
 * `@preact/signals` (per the project convention: no `useState`/`useEffect` for
 * global state). The validated config lives in a signal; the pieces the UI
 * needs are derived with `computed`.
 */
import { computed, signal, } from "@preact/signals";
import type { LinkItem, LinklistConfig, } from "../lib/types.ts";

// Re-export the reactive primitives so apps import them from core.
export { computed, signal, } from "@preact/signals";

/** The current, validated configuration (null until `setConfig` runs). */
export const configSignal = signal<LinklistConfig | null>(null,);

/** Install a validated configuration into the reactive store. */
export function setConfig(config: LinklistConfig | null,): void {
  configSignal.value = config;
}

/** The links to render (empty before a config is set). */
export const linksSignal = computed<LinkItem[]>(
  () => configSignal.value?.links ?? [],
);

/** The active theme preset name. */
export const themeSignal = computed<string>(
  () => configSignal.value?.theme?.preset ?? "minimal-dark",
);
