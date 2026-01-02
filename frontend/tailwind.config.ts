import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        terminal: {
          green: "#00FF41", 
          black: "#050505",
        }
      },
      fontFamily: {
        // 1. Keep your existing monospace
        mono: ['var(--font-courier)', 'monospace'],
        
        // 2. Add standard fonts used in your layout (Variables still work for these)
        montserrat: ["var(--font-montserrat)"],
        inter: ["var(--font-inter)"],

      },
    },
  },
  plugins: [],
};
export default config;