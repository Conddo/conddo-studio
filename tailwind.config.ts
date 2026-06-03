import type { Config } from "tailwindcss";

// Conddo Studio — dark operations theme (Studio architecture §3).
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        neutral: {
          bg: "#0F1117",
          surface: "#1A1D27",
          surface2: "#252836",
          border: "#2E3347",
          strong: "#3A3F55", // border-light
        },
        ink: "#F1F5F9", // text primary
        content: {
          secondary: "#94A3B8",
          muted: "#64748B",
        },
        primary: {
          DEFAULT: "#7C5CBF",
          hover: "#6A4DAD",
          light: "#A07FD4",
          bg: "#1E1630",
          border: "#3A2E55",
        },
        success: { DEFAULT: "#22C55E", bg: "#052E16" },
        warning: { DEFAULT: "#F59E0B", bg: "#1C1007" },
        danger: { DEFAULT: "#EF4444", bg: "#1C0505" },
        info: { DEFAULT: "#3B82F6", bg: "#0A1628" },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "ui-monospace", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
