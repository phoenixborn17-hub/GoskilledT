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
