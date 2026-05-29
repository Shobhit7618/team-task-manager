/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Custom branding tokens tailored for a sleek project manager dashboard
        brand: {
          dark: "#0F172A",     // Slate 900
          card: "#1E293B",     // Slate 800
          accent: "#6366F1",   // Indigo 500
          border: "#334155",   // Slate 700
        }
      }
    },
  },
  plugins: [],
}