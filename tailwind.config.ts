import type { Config } from "tailwindcss";

// Green-forward brand (DR-012). Gold is fills/accents only — never text on light (Golden Rule 14).
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // `brand` stays FIXED green (backward-compat: existing surfaces expect green here).
        brand: {
          DEFAULT: "#137E49", // gs-green
          fg: "#FEFEFE",
          deep: "var(--gs-green-deep)", // #0C5A34 — accessible green TEXT on light/tinted bg (AA)
        },
        // `theme` = WORKSPACE-ADAPTIVE brand (green in Learn, gold in Earn, charcoal in Admin) via
        // the [data-theme] token. NEW design-system components use `bg-theme`/`text-theme-strong`/
        // `border-theme` so they re-skin per workspace with no code change. Existing components keep
        // `brand` (fixed green) untouched → zero regression.
        theme: {
          DEFAULT: "var(--brand)",
          strong: "var(--brand-strong)", // AA-safe brand text on light/tint (amber in gold context)
          fg: "var(--gs-brand-fg)",
        },
        gold: "#EDC825",
        charcoal: "#2A302A",
        offwhite: "#FEFEFE",
        muted: "var(--gs-muted)", // accessible muted text (~6:1 on offwhite) — use `text-muted`
        // Dark-ready SEMANTIC surface tokens (flip [data-mode="dark"] → whole system re-skins).
        surface: {
          DEFAULT: "var(--gs-surface)",
          raised: "var(--gs-surface-raised)",
          sunken: "var(--gs-surface-sunken)",
        },
        ink: {
          DEFAULT: "var(--gs-text)", // `text-ink` — primary text (dark-aware; not named `text`
          muted: "var(--gs-text-muted)", //  to avoid clashing with Tailwind's `text-*` utilities)
        },
        line: "var(--gs-border)", // `border-line` — hairlines/dividers (dark-aware)
        // Full green ramp (Learn).
        green: {
          50: "var(--gs-green-50)",
          100: "var(--gs-green-100)",
          200: "var(--gs-green-200)",
          300: "var(--gs-green-300)",
          400: "var(--gs-green-400)",
          500: "var(--gs-green-500)",
          600: "var(--gs-green-600)",
          700: "var(--gs-green-700)",
          800: "var(--gs-green-800)",
          900: "var(--gs-green-900)",
        },
        // Full gold ramp (Earn) — fills/accents only (Golden Rule 14).
        goldr: {
          50: "var(--gs-gold-50)",
          100: "var(--gs-gold-100)",
          200: "var(--gs-gold-200)",
          300: "var(--gs-gold-300)",
          400: "var(--gs-gold-400)",
          500: "var(--gs-gold-500)",
          600: "var(--gs-gold-600)",
          700: "var(--gs-gold-700)",
          800: "var(--gs-gold-800)",
          900: "var(--gs-gold-900)",
        },
        // Neutral ramp (off charcoal) — single source of truth for borders/dividers/surfaces.
        // Use `bg-n-050`, `border-n-150`, `text-n-700` instead of ad-hoc charcoal opacities.
        n: {
          "050": "var(--gs-n-050)",
          100: "var(--gs-n-100)",
          "150": "var(--gs-n-150)",
          200: "var(--gs-n-200)",
          "300": "var(--gs-n-300)",
          400: "var(--gs-n-400)",
          "500": "var(--gs-n-500)",
          600: "var(--gs-n-600)",
          "700": "var(--gs-n-700)",
          800: "var(--gs-n-800)",
          "900": "var(--gs-n-900)",
        },
        // Semantic tokens for Alert/state surfaces. `warning` is accessible amber (NOT gold) so it
        // stays legible as text (Golden Rule 14: gold is fills only).
        success: "var(--gs-success)",
        warning: "var(--gs-warning)",
        "warning-strong": "var(--gs-warning-strong)", // AA amber on warning-tint surfaces
        danger: "var(--gs-danger)",
        info: "var(--gs-info)",
      },
      // Type scale (Experience System §3) — semantic sizes with Hinglish-tested line-heights.
      // Named tokens so downstream uses `text-h2`/`text-body` — no ad-hoc sizes (DESIGN §9).
      fontSize: {
        display: ["2.5rem", { lineHeight: "1.1", fontWeight: "800" }],
        h1: ["2rem", { lineHeight: "1.15", fontWeight: "700" }],
        h2: ["1.75rem", { lineHeight: "1.2", fontWeight: "700" }],
        h3: ["1.25rem", { lineHeight: "1.3", fontWeight: "600" }],
        h4: ["1.125rem", { lineHeight: "1.35", fontWeight: "600" }],
        body: ["1rem", { lineHeight: "1.5" }],
        small: ["0.875rem", { lineHeight: "1.5" }],
        caption: ["0.75rem", { lineHeight: "1.4" }],
      },
      // Motion tokens (Experience System §8) → `duration-base`, `ease-standard`.
      transitionDuration: {
        fast: "150ms",
        base: "200ms",
        slow: "300ms",
        celebrate: "500ms",
      },
      transitionTimingFunction: {
        standard: "cubic-bezier(0.2, 0, 0, 1)",
        emphasized: "cubic-bezier(0.16, 1, 0.3, 1)",
      },
      // Elevation & shape ramps wired to the CSS tokens (one source of truth for depth/rhythm).
      // Namespaced (`shadow-gs*`, `rounded-gs*`) so Tailwind's built-in `shadow-sm`/`rounded-lg`
      // stay untouched — no regression on existing surfaces.
      boxShadow: {
        "gs-sm": "var(--gs-shadow-sm)",
        gs: "var(--gs-shadow)",
        "gs-lg": "var(--gs-shadow-lg)",
      },
      borderRadius: {
        "gs-sm": "var(--gs-radius-sm)",
        gs: "var(--gs-radius)",
        "gs-lg": "var(--gs-radius-lg)",
      },
      fontFamily: {
        heading: ["Sora", "system-ui", "sans-serif"],
        body: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
