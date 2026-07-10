// SINGLE device-tier heuristic (Frozen_Spec_Amendments §C · Experience System §8).
// Defined ONCE here; every unit consumes it (no per-doc redefinitions — audit A13). Governs BOTH
// motion AND glass/blur. Pure + SSR-safe so it is node-testable and importable from server code;
// the React hook/provider that applies it live in components/system/device-tier-provider.tsx.

export type DeviceTier = "full" | "low";

// Non-standard but widely shipped Navigator capabilities we feature-detect (typed, no `any`).
interface NavigatorWithCaps extends Navigator {
  connection?: { saveData?: boolean };
  deviceMemory?: number;
}

/**
 * Low tier when ANY of: `prefers-reduced-motion` · Save-Data · `deviceMemory ≤ 3` · no
 * `backdrop-filter` support. Low tier ⇒ glass/blur off · transforms off · Lottie→static ·
 * count-up off (enforced in CSS via `[data-device-tier="low"]` + in JS via `useDeviceTier`).
 * SSR-safe: returns "full" with no `window` (the client provider corrects on mount).
 */
export function detectDeviceTier(): DeviceTier {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return "full";
  }
  try {
    const nav = navigator as NavigatorWithCaps;
    const reducedMotion =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const saveData = nav.connection?.saveData === true;
    const lowMemory =
      typeof nav.deviceMemory === "number" && nav.deviceMemory <= 3;
    const supportsBlur =
      typeof CSS !== "undefined" &&
      typeof CSS.supports === "function" &&
      (CSS.supports("backdrop-filter", "blur(1px)") ||
        CSS.supports("-webkit-backdrop-filter", "blur(1px)"));

    if (reducedMotion || saveData || lowMemory || !supportsBlur) {
      return "low";
    }
  } catch {
    // Any feature-detection failure → assume capable; effects still degrade gracefully in CSS.
    return "full";
  }
  return "full";
}
