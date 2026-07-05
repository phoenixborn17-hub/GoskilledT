import type { Config } from "tailwindcss";

// Green-forward brand (DR-012). Gold is fills/accents only — never text on light (Golden Rule 14).
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#137E49", // gs-green
          fg: "#FEFEFE",
          deep: "var(--gs-green-deep)", // #0C5A34 — accessible green TEXT on light/tinted bg (AA)
        },
        gold: "#EDC825",
        charcoal: "#2A302A",
        offwhite: "#FEFEFE",
        muted: "var(--gs-muted)", // accessible muted text (~6:1 on offwhite) — use `text-muted`
        // Neutral ramp (off charcoal) — single source of truth for borders/dividers/surfaces.
        // Use `bg-n-050`, `border-n-150`, `text-n-700` instead of ad-hoc charcoal opacities.
        n: {
          "050": "var(--gs-n-050)",
          "150": "var(--gs-n-150)",
          "300": "var(--gs-n-300)",
          "500": "var(--gs-n-500)",
          "700": "var(--gs-n-700)",
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
