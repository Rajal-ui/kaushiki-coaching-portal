/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#E8600A",
          light: "#FF8C42",
          subtle: "#FFF3EC",
        },
        dark: "#1A1208",
        body: "#3D3020",
        muted: "#8C7B6B",
        surface: "#FFFFFF",
        bg: "#FAFAF8",
        border: "#EDE8E0",
        success: "#2E7D32",
        error: "#C62828",
        warning: "#E65100",
        info: "#1565C0",
        dash: {
          bg: "#F5F4F2",
          sidebar: "#1A1208",
          sidebarText: "#C8BFB0",
          sidebarActive: "#E8600A",
          card: "#FFFFFF",
          cardHover: "#FFF8F4",
        }
      },
      fontFamily: {
        display: ["var(--font-plus-jakarta)", "Plus Jakarta Sans", "sans-serif"],
        sans: ["var(--font-dm-sans)", "DM Sans", "sans-serif"],
        mono: ["var(--font-jetbrains-mono)", "JetBrains Mono", "monospace"],
      },
      borderRadius: {
        sm: "4px",
        md: "8px",
        lg: "12px",
        xl: "16px",
        "2xl": "24px",
      },
      boxShadow: {
        xs: "0 1px 2px rgba(26, 18, 8, 0.06)",
        sm: "0 2px 8px rgba(26, 18, 8, 0.08)",
        md: "0 4px 16px rgba(26, 18, 8, 0.10)",
        lg: "0 8px 32px rgba(26, 18, 8, 0.12)",
        xl: "0 16px 48px rgba(232, 96, 10, 0.15)",
        focus: "0 0 0 3px rgba(232, 96, 10, 0.25)",
      }
    },
  },
  plugins: [],
}
