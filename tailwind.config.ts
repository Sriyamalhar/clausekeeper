import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        surface: "var(--color-surface)",
        "surface-raised": "var(--color-surface-raised)",
        border: "var(--color-border)",
        ink: "var(--color-ink)",
        "ink-muted": "var(--color-ink-muted)",
        "ink-faint": "var(--color-ink-faint)",
        accent: "var(--color-accent)",
        "accent-hover": "var(--color-accent-hover)",
        "accent-surface": "var(--color-accent-surface)",
        "risk-low": "var(--color-risk-low)",
        "risk-low-surface": "var(--color-risk-low-surface)",
        "risk-medium": "var(--color-risk-medium)",
        "risk-medium-surface": "var(--color-risk-medium-surface)",
        "risk-high": "var(--color-risk-high)",
        "risk-high-surface": "var(--color-risk-high-surface)",
      },
      fontFamily: {
        display: ["var(--font-display)"],
        body: ["var(--font-body)"],
        mono: ["var(--font-mono)"],
      },
      fontSize: {
        xs: ["12px", { lineHeight: "1.5" }],
        sm: ["14px", { lineHeight: "1.5" }],
        base: ["16px", { lineHeight: "1.5" }],
        lg: ["20px", { lineHeight: "1.2" }],
        xl: ["24px", { lineHeight: "1.2" }],
        "2xl": ["32px", { lineHeight: "1.2" }],
        "3xl": ["48px", { lineHeight: "1.2" }],
      },
      borderRadius: {
        input: "var(--radius-input)",
        card: "var(--radius-card)",
      },
      maxWidth: {
        prose: "680px",
        shell: "1280px",
      },
      transitionDuration: {
        micro: "150ms",
        std: "220ms",
      },
      transitionTimingFunction: {
        standard: "cubic-bezier(0.4, 0, 0.2, 1)",
      },
    },
  },
  plugins: [],
};

export default config;
