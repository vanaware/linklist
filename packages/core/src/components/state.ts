/**
 * @file state.ts
 * @description Central reactive state for the linklist app, built on
 * `@preact/signals` (per the project convention: no `useState`/`useEffect` for
 * global state). Only the validated config lives here. `App` reads this signal
 * but also accepts a `config` prop, so tests and any future server render stay
 * pure and deterministic without touching the store. This module is internal
 * (never exported from `mod.ts`).
 */
import { signal, type Signal, } from "@preact/signals";
import type { LinklistConfig, } from "../lib/types.ts";

/** The current, validated configuration (null until `setConfig` runs). */
export const configSignal: Signal<LinklistConfig | null> = signal<
  LinklistConfig | null
>(null,);

/** Install a validated configuration into the reactive store. */
export function setConfig(config: LinklistConfig | null,): void {
  configSignal.value = config;
}
