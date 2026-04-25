/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          ink: "#0f172a",
          midnight: "#102542",
          teal: "#0f766e",
          cyan: "#0ea5e9",
          mist: "#f6fbff",
          sand: "#f5efe6",
          danger: "#dc2626",
          success: "#15803d",
          warning: "#d97706"
        }
      },
      boxShadow: {
        panel: "0 18px 50px rgba(15, 23, 42, 0.08)",
        glow: "0 20px 60px rgba(14, 165, 233, 0.16)"
      },
      fontFamily: {
        sans: ["Manrope", "ui-sans-serif", "system-ui", "sans-serif"]
      },
      backgroundImage: {
        "grid-soft":
          "linear-gradient(rgba(148, 163, 184, 0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(148, 163, 184, 0.08) 1px, transparent 1px)"
      }
    }
  },
  plugins: []
};
