import { defineCollection, z } from "astro:content"
import { glob } from "astro/loaders"

const artikel = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/artikel" }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      description: z.string(),
      author: z.string(),
      publishDate: z.coerce.date(),
      updatedDate: z.coerce.date().optional(),
      tags: z.array(z.string()).default([]),
      seri: z.string().optional(),
      cover: image().optional(),
      featured: z.boolean().default(false),
      draft: z.boolean().default(false),
      sourceUrl: z.string().url().optional(),
    }),
})

const events = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/events" }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      description: z.string(),
      startDate: z.coerce.date(),
      endDate: z.coerce.date().optional(),
      location: z.string().default("Online"),
      cover: image().optional(),
      draft: z.boolean().default(false),
    }),
})

const kontributor = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/kontributor" }),
  schema: ({ image }) =>
    z.object({
      name: z.string(),
      role: z.string().optional(),
      bio: z.string(),
      avatar: image().optional(),
      order: z.number().default(99),
      socials: z
        .array(
          z.object({
            label: z.string(),
            url: z.string().url(),
          }),
        )
        .default([]),
    }),
})

export const collections = { artikel, events, kontributor }
