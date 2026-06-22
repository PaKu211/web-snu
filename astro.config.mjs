import { defineConfig } from "astro/config"
import react from "@astrojs/react"
import mdx from "@astrojs/mdx"
import sitemap from "@astrojs/sitemap"
import tailwindcss from "@tailwindcss/vite"
import keystatic from "@keystatic/astro"
import cloudflare from "@astrojs/cloudflare"

const isProd = process.env.NODE_ENV === "production"

export default defineConfig({
  site: 'https://web-snu.pages.dev', // Sesuaikan URL Cloudflare kamu
  
  output: 'server', // 2. Ini kunci utamanya agar Keystatic menyala!
  adapter: cloudflare(), // 3. Mesin server-nya menggunakan Cloudflare
  prefetch: {
    prefetchAll: true,
    defaultStrategy: "hover",
  },
  integrations: [
    react(),
    mdx(),
    sitemap(),
    !isProd && keystatic()
  ].filter(Boolean),
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
