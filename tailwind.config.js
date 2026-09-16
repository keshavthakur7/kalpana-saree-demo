/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        royal: {
          burgundy: "#4A0E17",
          gold: "#D4AF37",
          cream: "#FBF9F5",
          charcoal: "#1C1C1C",
          wine: "#2C080E",
          champagne: "#E9DDC7"
        }
      },
      fontFamily: {
        display: ["var(--font-playfair)", "Georgia", "serif"],
        sans: ["var(--font-inter)", "ui-sans-serif", "system-ui", "sans-serif"]
      },
      boxShadow: {
        luxury: "0 18px 50px rgba(74,14,23,.10)",
        gold: "0 8px 24px rgba(212,175,55,.18)"
      }
    }
  },
  plugins: []
};
