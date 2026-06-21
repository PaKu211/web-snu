import { defineConfig } from "astro/config"
import react from "@astrojs/react"
import mdx from "@astrojs/mdx"
import sitemap from "@astrojs/sitemap"
import tailwindcss from "@tailwindcss/vite"
import keystatic from "@keystatic/astro"

export default defineConfig({
  site: "https://snu.pages.dev",
  integrations: [
    react(),
    mdx(),
    sitemap(),
    keystatic()
  ],
  vite: {
    plugins: [tailwindcss()],
  },
  markdown: {
    shikiConfig: {
      theme: "css-variables",
      wrap: true,
    },
  },
  server: {
    host: true,
  },
})