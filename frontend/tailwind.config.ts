import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        // Cyberpunk theme colors
        cyber: {
          black: "#0a0a0f",
          dark: "#12121a",
          panel: "#1a1a25",
          border: "#2a2a3a",
        },
        neon: {
          cyan: "#00f5ff",
          purple: "#b829dd",
          pink: "#ff2d95",
          green: "#39ff14",
          yellow: "#ffff00",
        },
        // shadcn/ui theme mappings
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // Chart colors
        chart: {
          "1": "hsl(var(--chart-1))",
          "2": "hsl(var(--chart-2))",
          "3": "hsl(var(--chart-3))",
          "4": "hsl(var(--chart-4))",
          "5": "hsl(var(--chart-5))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        mono: ["var(--font-mono)", "monospace"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "neon-pulse": {
          "0%, 100%": {
            boxShadow: "0 0 5px #00f5ff, 0 0 10px #00f5ff, 0 0 20px #00f5ff",
          },
          "50%": {
            boxShadow: "0 0 10px #00f5ff, 0 0 20px #00f5ff, 0 0 40px #00f5ff",
          },
        },
        "neon-glow": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.8" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
        "slide-up": {
          "0%": { transform: "translateY(100%)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        "slide-down": {
          "0%": { transform: "translateY(-100%)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        pulse: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.5" },
        },
        spin: {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "neon-pulse": "neon-pulse 2s ease-in-out infinite",
        "neon-glow": "neon-glow 2s ease-in-out infinite",
        shimmer: "shimmer 2s linear infinite",
        float: "float 3s ease-in-out infinite",
        "slide-up": "slide-up 0.3s ease-out",
        "slide-down": "slide-down 0.3s ease-out",
        "fade-in": "fade-in 0.2s ease-out",
        pulse: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        spin: "spin 1s linear infinite",
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "cyber-gradient": "linear-gradient(135deg, #00f5ff 0%, #b829dd 50%, #ff2d95 100%)",
        "cyber-grid":
          "linear-gradient(rgba(0, 245, 255, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 245, 255, 0.03) 1px, transparent 1px)",
      },
      boxShadow: {
        neon: "0 0 5px #00f5ff, 0 0 10px #00f5ff",
        "neon-purple": "0 0 5px #b829dd, 0 0 10px #b829dd",
        "neon-pink": "0 0 5px #ff2d95, 0 0 10px #ff2d95",
        "neon-green": "0 0 5px #39ff14, 0 0 10px #39ff14",
        glow: "0 0 20px rgba(0, 245, 255, 0.3)",
        card: "0 4px 20px rgba(0, 0, 0, 0.4)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
