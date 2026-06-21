module.exports = {
  content: ["./src/**/*.{astro,js,jsx,ts,tsx,md,mdx,astro}"],
  theme: {
    extend: {
      colors: {
        "background": "#0B1612",
        "surface": "#132019",
        "surface-2": "#1A2A1E",
        "foreground": "#EDE0C4",
        "muted": "#7A8C80",
        "border": "#2D3E32",
        "primary": "#3CBFB0",
        "primary-foreground": "#0B1612",
        "accent": "#68D8D6",
        "accent-foreground": "#0B1612",
        "ring": "#3CBFB0",
      },
      fontFamily: {
        sans: ["Space Grotesk", "system-ui", "sans-serif"],
        serif: ["Cormorant Upright", "Georgia", "serif"],
      },
      borderRadius: {
        lg: "0.75rem",
        md: "calc(0.75rem - 0.25rem)",
        sm: "calc(0.75rem - 0.5rem)",
      },
    },
  },
  plugins: [],
};