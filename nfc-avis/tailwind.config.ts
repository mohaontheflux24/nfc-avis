import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#141A1F",       // fond sombre principal
        porcelain: "#F4F2EE", // fond clair
        signal: "#FF7A45",    // accent "signal NFC" (orange)
        teal: "#0E4B4A",      // accent secondaire profond
        mist: "#8A9199",      // gris texte secondaire
      },
      fontFamily: {
        display: ["'Space Grotesk'", "sans-serif"],
        body: ["'Inter'", "sans-serif"],
      },
      borderRadius: {
        xl2: "1.25rem",
      },
    },
  },
  plugins: [],
};
export default config;
