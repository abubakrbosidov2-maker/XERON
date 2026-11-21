import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        void: "#05060f",
        navy: { 900: "#0a0e24", 800: "#0f1535", 700: "#172049" },
        volt: { DEFAULT: "#2f8cff", glow: "#6db3ff" },
        arcane: { DEFAULT: "#8b5cf6", glow: "#b69cff" },
        rarity: {
          common: "#9aa3b2",
          uncommon: "#4ade80",
          rare: "#38bdf8",
          epic: "#a855f7",
          legendary: "#f59e0b",
          mythic: "#f43f5e",
        },
      },
      fontFamily: { display: ["Orbitron", "ui-sans-serif", "system-ui"], sans: ["Inter", "ui-sans-serif", "system-ui"] },
      boxShadow: {
        neon: "0 0 20px rgba(47,140,255,.45), 0 0 60px rgba(139,92,246,.25)",
      },
      keyframes: {
        float: { "0%,100%": { transform: "translateY(0)" }, "50%": { transform: "translateY(-8px)" } },
        pulseGlow: { "0%,100%": { opacity: ".6" }, "50%": { opacity: "1" } },
      },
      animation: { float: "float 4s ease-in-out infinite", pulseGlow: "pulseGlow 2.4s ease-in-out infinite" },
    },
  },
  plugins: [],
};
export default config;
