import typography from "@tailwindcss/typography";
import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

export default {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    screens: {
      "2xl": {
        max: "1535px",
      },
      xl: {
        max: "1279px",
      },
      lg: {
        max: "1023px",
      },
      md: {
        max: "767px",
      },
      sm: {
        max: "639px",
      },
    },
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": {
          max: "1535px",
        },
        xl: {
          max: "1279px",
        },
        lg: {
          max: "1023px",
        },
        md: {
          max: "767px",
        },
        sm: {
          max: "639px",
        },
      },
    },
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)"],
        mono: ["var(--font-roboto-mono)"],
        sora: ["var(--font-sora)"],
        manrope: ["var(--font-manrope)"],
      },
      colors: {
        "san-felix": {
          "50": "#e9ffe0",
          "100": "#ccffbb",
          "200": "#9dff80",
          "300": "#5eff37",
          "400": "#27ff00",
          "500": "#06ff00",
          "600": "#00d305",
          "700": "#009f04",
          "800": "#007b00",
          "900": "#006400",
          "950": "#003b06",
        },
        camarone: {
          "50": "#e9ffe0",
          "100": "#ccffbb",
          "200": "#9dff80",
          "300": "#5eff37",
          "400": "#27ff00",
          "500": "#06ff00",
          "600": "#00d305",
          "700": "#009f04",
          "800": "#007b00",
          "900": "#005400",
          "950": "#003b06",
        },
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          "50": "#fff6ec",
          "100": "#ffebd4",
          "200": "#ffd3a7",
          "300": "#ffb370",
          "400": "#ff8736",
          "500": "#ff660f",
          "550": "#DE5126",
          "600": "#f14a05",
          "700": "#db3a07",
          "800": "#9e2b0e",
          "900": "#7f250f",
          "950": "#451005",
          DEFAULT: "#ff660f",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
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
      gridTemplateColumns: {
        repeat4: "repeat(4, minmax(100px, 500px))",
        repeat3: "repeat(3, minmax(100px, 500px))",
        responsive300: "repeat(auto-fit, minmax(300px, 1fr))",
        responsive250: "repeat(auto-fit, minmax(250px, 1fr))",
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [tailwindcssAnimate, typography],
} satisfies Config;
