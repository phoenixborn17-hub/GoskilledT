"use client";
// Theme toggle (overnight-7d) — replaces the "coming soon" Settings placeholder with a real
// Light/Dark switch. The CSS dark tokens already exist app-wide; this only flips data-mode.
import { Moon, Sun } from "lucide-react";
import { useTheme } from "../system/theme-provider";
import { Switch } from "../ui/switch";

export function ThemeToggle() {
  const [mode, setMode] = useTheme();
  const dark = mode === "dark";

  return (
    <div className="flex items-center gap-3 rounded-gs border border-line bg-surface-sunken px-4 py-3">
      {dark ? (
        <Moon className="h-5 w-5 shrink-0 text-ink-muted" aria-hidden />
      ) : (
        <Sun className="h-5 w-5 shrink-0 text-ink-muted" aria-hidden />
      )}
      <div className="min-w-0 flex-1">
        <p className="text-small font-medium text-ink">
          {dark ? "Dark" : "Light"}
        </p>
        <p className="text-caption text-ink-muted">
          Switches this device only — your preference is saved on this
          browser.
        </p>
      </div>
      <Switch
        checked={dark}
        onChange={(e) => setMode(e.target.checked ? "dark" : "light")}
        aria-label="Dark mode"
      />
    </div>
  );
}
