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
        },
        gold: "#EDC825",
        charcoal: "#2A302A",
        offwhite: "#FEFEFE",
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
