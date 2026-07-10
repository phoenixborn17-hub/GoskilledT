"use client";
import * as React from "react";
import { detectDeviceTier, type DeviceTier } from "../../lib/device-tier";

/**
 * Stamps `data-device-tier` on <html> so the CSS fallbacks in globals.css
 * (`:root[data-device-tier="low"] …`) engage. Re-evaluates when the reduced-motion preference
 * changes. Render once near the app root. Renders nothing.
 */
export function DeviceTierProvider(): null {
  React.useEffect(() => {
    const apply = () => {
      document.documentElement.dataset.deviceTier = detectDeviceTier();
    };
    apply();
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    mq.addEventListener?.("change", apply);
    return () => mq.removeEventListener?.("change", apply);
  }, []);
  return null;
}

/**
 * Read the device tier in component logic (e.g. to skip count-up / heavy charts on low tier).
 * Starts "full" for a stable SSR/first paint, then corrects on mount.
 */
export function useDeviceTier(): DeviceTier {
  const [tier, setTier] = React.useState<DeviceTier>("full");
  React.useEffect(() => {
    setTier(detectDeviceTier());
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setTier(detectDeviceTier());
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, []);
  return tier;
}
