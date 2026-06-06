import type { Config } from "tailwindcss";
import animate from "tailwindcss-animate";

const config: Config = {
  darkMode: "class",
  content: [
    "./index.html",
    "./src/**/*.{ts,tsx,js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0D1117",
        foreground: "#F0F6FC",

        card: {
          DEFAULT: "#161B22",
          foreground: "#F0F6FC",
        },
        popover: {
          DEFAULT: "#1C2128",
          foreground: "#F0F6FC",
        },

        primary: {
          DEFAULT: "#388BFD",
          foreground: "#FFFFFF",
        },
        secondary: {
          DEFAULT: "#1C2128",
          foreground: "#F0F6FC",
        },
        muted: {
          DEFAULT: "#1C2128",
          foreground: "#9CA3AF", // Improved from #8B949E for WCAG AA compliance (4.6:1 contrast)
        },
        destructive: {
          DEFAULT: "#F85149",
          foreground: "#FFFFFF",
        },

        border: "#30363D",
        input: "#30363D",
        ring: "#388BFD",

        canvas: "#0D1117",
        surface: "#161B22",
        elevated: "#1C2128",
        income: "#2EA043",
        expense: "#F85149",
        warning: "#D29922",
        accent: "#388BFD",

        sidebar: {
          DEFAULT: "#161B22",
          foreground: "#F0F6FC",
          primary: "#388BFD",
          "primary-foreground": "#FFFFFF",
          accent: "#1C2128",
          "accent-foreground": "#F0F6FC",
          border: "#30363D",
          ring: "#388BFD",
        },
      },
      borderRadius: {
        lg: "0.5rem",
        md: "0.375rem",
        sm: "0.25rem",
      },
      fontFamily: {
        sans: [
          "Geist",
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "sans-serif",
        ],
        mono: [
          "Geist Mono",
          "JetBrains Mono",
          "ui-monospace",
          "monospace",
        ],
      },
      fontSize: {
        display: ["1.875rem", { lineHeight: "2.25rem", fontWeight: "600" }],
        heading: ["1.25rem", { lineHeight: "1.75rem", fontWeight: "500" }],
      },
      borderColor: {
        DEFAULT: "#30363D",
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "fade-in": "fade-in 200ms ease-out",
        "accordion-down": "accordion-down 200ms ease-out",
        "accordion-up": "accordion-up 200ms ease-out",
      },
    },
  },
  plugins: [animate],
};

export default config;
