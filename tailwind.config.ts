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
        cream: "#F5F0EA",
        cream2: "#EAE5DE",
        cream3: "#DED8D0",
        card: "#FFFFFF",
        ink: "#1C1917",
        ink2: "#6B6460",
        ink3: "#AAA49E",
        accent: "#C06B32",
        "accent-light": "#FBF0E6",
        "accent-mid": "#F0D5BD",
        red: "#C04843",
        "red-light": "#FDECEA",
        green: "#4D9163",
        "green-light": "#E6F5EE",
        amber: "#C48832",
        "amber-light": "#FDF2E3",
        border: "rgba(28,25,23,0.08)",
        border2: "rgba(28,25,23,0.05)",
      },
      fontFamily: {
        caveat: ["Caveat", "cursive"],
        display: ["var(--font-display)", "serif"],
      },
      fontSize: {
        heading: ["26px", { lineHeight: "1.2", letterSpacing: "-0.5px", fontWeight: "300" }],
        body: ["15px", { lineHeight: "1.55", fontWeight: "400" }],
        "body-sm": ["13px", { lineHeight: "1.5", fontWeight: "400" }],
        label: ["11px", { lineHeight: "1", letterSpacing: "0.06em", fontWeight: "500" }],
      },
      borderRadius: {
        card: "18px",
        element: "10px",
        pill: "999px",
      },
      borderWidth: {
        half: "0.5px",
      },
      boxShadow: {
        card: "0 2px 16px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)",
        modal: "0 -4px 32px rgba(0,0,0,0.10)",
        fab: "0 6px 24px rgba(28,25,23,0.22)",
        lift: "0 4px 12px rgba(0,0,0,0.08)",
        nav: "0 -1px 0 rgba(28,25,23,0.06), 0 -8px 24px rgba(0,0,0,0.04)",
      },
    },
  },
  plugins: [],
};
export default config;
