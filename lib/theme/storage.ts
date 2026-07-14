// Dark mode (overnight-7d). Client-only preference — no schema/DB field, no system-preference
// auto-detection: the product currently frames itself as "Light · On" by default (Settings copy),
// so a first-time visitor always sees Light; dark is an explicit opt-in that persists locally.
// The CSS itself already fully supports this (app/globals.css `:root[data-mode="dark"]` block,
// written and dormant since before this change) — this file only wires the toggle to it.
export type ThemeMode = "light" | "dark";

const STORAGE_KEY = "gs-theme-mode";

export function getStoredTheme(): ThemeMode {
  if (typeof window === "undefined") return "light";
  try {
    const v = window.localStorage.getItem(STORAGE_KEY);
    return v === "dark" ? "dark" : "light";
  } catch {
    return "light"; // storage blocked (private mode / disabled) — fall back to the default
  }
}

export function setStoredTheme(mode: ThemeMode): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, mode);
  } catch {
    // storage blocked — the DOM attribute below still applies for this tab/session
  }
}

export function applyTheme(mode: ThemeMode): void {
  if (typeof document === "undefined") return;
  if (mode === "dark") document.documentElement.dataset.mode = "dark";
  else delete document.documentElement.dataset.mode;
}
