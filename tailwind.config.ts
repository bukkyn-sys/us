import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: "#F5F0E8",
        cream2: "#EDE8DF",
        cream3: "#E3DDD3",
        ink: "#2C2820",
        ink2: "#6B6458",
        ink3: "#9E9488",
        accent: "#C4A882",
        "accent-light": "#EDE0CC",
        red: "#D4645A",
        "red-light": "#FAE8E7",
        green: "#6A9E7A",
        "green-light": "#E4F0E7",
        amber: "#C9953A",
        "amber-light": "#FAF0DC",
        card: "#FDFAF5",
        border: "rgba(44,40,32,0.12)",
        border2: "rgba(44,40,32,0.07)",
      },
      fontFamily: {
        caveat: ["Caveat", "cursive"],
        display: ["var(--font-display)", "serif"],
      },
      fontSize: {
        heading: ["22px", { lineHeight: "1.2", letterSpacing: "-0.5px", fontWeight: "500" }],
        body: ["14px", { lineHeight: "1.5", fontWeight: "400" }],
        "body-sm": ["13px", { lineHeight: "1.5", fontWeight: "400" }],
        label: ["10px", { lineHeight: "1", letterSpacing: "0.08em", fontWeight: "500" }],
      },
      borderRadius: {
        card: "14px",
        element: "8px",
        pill: "20px",
      },
      borderWidth: {
        half: "0.5px",
      },
    },
  },
  plugins: [],
};
export default config;
