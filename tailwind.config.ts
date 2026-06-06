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
        // ═══════════════════════════════════════════════════════════
        // ENHANCED COLOR PALETTE - More Vibrant & Modern
        // ═══════════════════════════════════════════════════════════
        background: "#0A0E1A",      // Deeper, richer dark blue
        foreground: "#F8FAFC",      // Brighter white for better contrast

        card: {
          DEFAULT: "#111827",       // Warmer dark with subtle blue tint
          foreground: "#F8FAFC",
        },
        popover: {
          DEFAULT: "#1E293B",
          foreground: "#F8FAFC",
        },

        primary: {
          DEFAULT: "#3B82F6",       // Brighter, more vibrant blue
          foreground: "#FFFFFF",
        },
        secondary: {
          DEFAULT: "#1E293B",
          foreground: "#F8FAFC",
        },
        muted: {
          DEFAULT: "#1E293B",
          foreground: "#94A3B8",    // Softer gray-blue
        },
        destructive: {
          DEFAULT: "#EF4444",       // More vibrant red
          foreground: "#FFFFFF",
        },

        border: "#334155",          // Lighter, more visible borders
        input: "#1E293B",
        ring: "#3B82F6",

        canvas: "#0A0E1A",
        surface: "#111827",
        elevated: "#1E293B",
        
        // Financial colors - More vibrant
        income: "#10B981",          // Brighter emerald green
        expense: "#EF4444",         // Vibrant red
        warning: "#F59E0B",         // Warm amber
        accent: "#3B82F6",          // Vibrant blue
        
        // Additional accent colors for variety
        purple: "#8B5CF6",
        pink: "#EC4899",
        teal: "#14B8A6",

        sidebar: {
          DEFAULT: "#0F172A",
          foreground: "#F8FAFC",
          primary: "#3B82F6",
          "primary-foreground": "#FFFFFF",
          accent: "#1E293B",
          "accent-foreground": "#F8FAFC",
          border: "#334155",
          ring: "#3B82F6",
        },
      },
      borderRadius: {
        lg: "0.75rem",              // Slightly more rounded
        md: "0.5rem",
        sm: "0.375rem",
      },
      fontFamily: {
        sans: [
          "Geist",
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "sans-serif",
        ],
        mono: [
          "Geist Mono",
          "JetBrains Mono",
          "Fira Code",
          "monospace",
        ],
      },
      // ═══════════════════════════════════════════════════════════
      // ENHANCED TYPOGRAPHY SCALE
      // ═══════════════════════════════════════════════════════════
      fontSize: {
        // Display sizes - for hero sections
        "display-2xl": ["4.5rem", { lineHeight: "1", fontWeight: "800", letterSpacing: "-0.02em" }],
        "display-xl": ["3.75rem", { lineHeight: "1", fontWeight: "800", letterSpacing: "-0.02em" }],
        "display-lg": ["3rem", { lineHeight: "1.1", fontWeight: "700", letterSpacing: "-0.02em" }],
        "display-md": ["2.25rem", { lineHeight: "1.2", fontWeight: "700", letterSpacing: "-0.01em" }],
        "display-sm": ["1.875rem", { lineHeight: "1.3", fontWeight: "600", letterSpacing: "-0.01em" }],
        
        // Heading sizes
        "heading-xl": ["1.5rem", { lineHeight: "1.4", fontWeight: "600" }],
        "heading-lg": ["1.25rem", { lineHeight: "1.5", fontWeight: "600" }],
        "heading-md": ["1.125rem", { lineHeight: "1.5", fontWeight: "600" }],
        "heading-sm": ["1rem", { lineHeight: "1.5", fontWeight: "600" }],
        
        // Body sizes
        "body-lg": ["1.125rem", { lineHeight: "1.75", fontWeight: "400" }],
        "body-md": ["1rem", { lineHeight: "1.625", fontWeight: "400" }],
        "body-sm": ["0.875rem", { lineHeight: "1.5", fontWeight: "400" }],
        "body-xs": ["0.75rem", { lineHeight: "1.5", fontWeight: "400" }],
        
        // Numeric - tabular nums by default
        "numeric-2xl": ["2.5rem", { lineHeight: "1.2", fontWeight: "700" }],
        "numeric-xl": ["2rem", { lineHeight: "1.2", fontWeight: "700" }],
        "numeric-lg": ["1.5rem", { lineHeight: "1.3", fontWeight: "600" }],
        "numeric-md": ["1.125rem", { lineHeight: "1.4", fontWeight: "600" }],
        "numeric-sm": ["0.875rem", { lineHeight: "1.5", fontWeight: "500" }],
      },
      letterSpacing: {
        tighter: "-0.02em",
        tight: "-0.01em",
        wide: "0.02em",
        wider: "0.05em",
      },
      borderColor: {
        DEFAULT: "#334155",
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "fade-in-up": {
          from: { opacity: "0", transform: "translateY(10px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in-right": {
          from: { opacity: "0", transform: "translateX(20px)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "shimmer": {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      animation: {
        "fade-in": "fade-in 300ms ease-out",
        "fade-in-up": "fade-in-up 400ms ease-out",
        "slide-in-right": "slide-in-right 300ms ease-out",
        "accordion-down": "accordion-down 200ms ease-out",
        "accordion-up": "accordion-up 200ms ease-out",
        "shimmer": "shimmer 2s linear infinite",
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic": "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
    },
  },
  plugins: [animate],
};

export default config;
