/**
 * @file state.ts
 * @description Central reactive state for the linklist app, built on
 * `@preact/signals` (per the project convention: no `useState`/`useEffect` for
 * global state). The validated config lives in a signal; the pieces the UI
 * needs are derived with `computed`.
 */
import {
  computed as signalsComputed,
  signal as signalsSignal,
} from "@preact/signals";
import type { ReadonlySignal, Signal, } from "@preact/signals";
import type { LinkItem, LinklistConfig, } from "../lib/types.ts";

// Re-export the reactive primitives so apps import them from core. The thin
// wrappers pin the public signatures to `Signal` / `ReadonlySignal` (both
// re-exported below) — so the package surface never leaks signals-core's
// private `SignalOptions` type (JSR doc-lint).
export type { ReadonlySignal, Signal, } from "@preact/signals";

/** Create a mutable reactive signal initialized to `value`. */
export function signal<T,>(value: T,): Signal<T> {
  return signalsSignal(value,);
}

/** Derive a read-only signal that recomputes `compute` lazily. */
export function computed<T,>(compute: () => T,): ReadonlySignal<T> {
  return signalsComputed(compute,);
}

/** The current, validated configuration (null until `setConfig` runs). */
export const configSignal: Signal<LinklistConfig | null> = signal<
  LinklistConfig | null
>(null,);

/** Install a validated configuration into the reactive store. */
export function setConfig(config: LinklistConfig | null,): void {
  configSignal.value = config;
}

/** The links to render (empty before a config is set). */
export const linksSignal: ReadonlySignal<LinkItem[]> = computed<LinkItem[]>(
  () => configSignal.value?.links ?? [],
);

/** The active theme preset name. */
export const themeSignal: ReadonlySignal<string> = computed<string>(
  () => configSignal.value?.theme?.preset ?? "minimal-dark",
);
