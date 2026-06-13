import type { Config } from "tailwindcss";

/**
 * Conddo Studio — cinematic dark theme.
 *
 * Aligned with the conddo-app cinematic design system: the surface
 * palette uses the same cinema-base / cinema-elev / cinema-elev2 stops
 * conddo-app uses on its marketing + authed routes, so the cross-app
 * UX feels like one product instead of two.
 *
 * Studio's existing class strings (bg-neutral-bg, text-content-secondary,
 * etc.) keep working unchanged — we just retuned the underlying token
 * values from the previous cooler slate-tinted palette to the warmer
 * cinema neutrals.
 */
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Cinema palette — pure dark, slightly warm, matches conddo-app
        // cinematic surfaces. Exposed both as `cinema.*` (for new code
        // that wants explicit naming) and as `neutral.*` (for backward
        // compatibility with all existing Studio components).
        cinema: {
          base: "#0A0A0C",
          elev: "#13131A",
          elev2: "#1A1A23",
          line: "#252531",
        },
        neutral: {
          bg: "#0A0A0C",          // was #0F1117 (slate-blue) → cinema-base
          surface: "#13131A",     // was #1A1D27 → cinema-elev
          surface2: "#1A1A23",    // was #252836 → cinema-elev2
          border: "#252531",      // was #2E3347 → cinema-line
          strong: "#33333F",      // was #3A3F55 → slightly elevated cinema-line
        },

        // Foreground tokens — closer to the white/65/45 cascade used on
        // conddo-app cinematic surfaces.
        ink: "#FFFFFF",
        content: {
          secondary: "#A6A6B5",   // ~white/65 — was #94A3B8 slate
          muted: "#6E6E80",       // ~white/45 — was #64748B slate
        },

        primary: {
          DEFAULT: "#7C5CBF",
          hover: "#6A4DAD",
          light: "#A07FD4",
          bg: "#1F1730",          // was #1E1630 — warmer to match cinema base
          border: "#3D3061",      // was #3A2E55 — warmer + brighter
        },

        // Semantic colors retuned to match the auth shell / dashboard
        // cinematic tints we use on conddo-app: lighter foregrounds on
        // darker subtle backgrounds.
        success: { DEFAULT: "#34D399", bg: "#082A1C" },
        warning: { DEFAULT: "#FBBF24", bg: "#231804" },
        danger:  { DEFAULT: "#FB7185", bg: "#1F0A0E" },
        info:    { DEFAULT: "#60A5FA", bg: "#0B1A2D" },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "ui-monospace", "monospace"],
      },
      letterSpacing: {
        tightest: "-0.03em",
        tighter:  "-0.02em",
        eyebrow:  "0.1em",
        caps:     "0.12em",
        loose:    "0.2em",
      },
      backgroundImage: {
        "cinema-glow":
          "radial-gradient(80% 60% at 50% 0%, rgba(124, 92, 191, 0.22), transparent 70%), radial-gradient(60% 80% at 100% 100%, rgba(124, 92, 191, 0.12), transparent 70%)",
      },
      boxShadow: {
        cinema: "0 24px 60px -30px rgba(124, 92, 191, 0.35)",
        "cinema-float": "0 8px 40px -12px rgba(0, 0, 0, 0.35)",
      },
    },
  },
  plugins: [],
};

export default config;
