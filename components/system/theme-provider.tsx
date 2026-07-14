"use client";
// Applies the stored theme preference on mount (mirrors DeviceTierProvider's pattern). Renders
// nothing. A brief flash of Light on first paint for returning dark-mode users is accepted —
// consistent with how DeviceTierProvider already handles its own SSR/first-paint gap, and avoids
// adding a blocking inline <script> just for this.
import * as React from "react";
import {
  getStoredTheme,
  setStoredTheme,
  applyTheme,
  type ThemeMode,
} from "../../lib/theme/storage";

export function ThemeProvider(): null {
  React.useEffect(() => {
    applyTheme(getStoredTheme());
  }, []);
  return null;
}

/** Read + change the theme preference from a settings control. Starts "light" for a stable
 * SSR/first-paint value, then corrects on mount (same convention as useDeviceTier). */
export function useTheme(): [ThemeMode, (mode: ThemeMode) => void] {
  const [mode, setMode] = React.useState<ThemeMode>("light");

  React.useEffect(() => {
    setMode(getStoredTheme());
  }, []);

  const set = React.useCallback((next: ThemeMode) => {
    setMode(next);
    applyTheme(next);
    setStoredTheme(next);
  }, []);

  return [mode, set];
}
