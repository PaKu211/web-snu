import type { CollectionEntry } from "astro:content"
import { SERI_META, TAG_META } from "@/config"

type Artikel = CollectionEntry<"artikel">

/** Format a date in Indonesian long form, e.g. "4 Mei 2026". */
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date)
}

/** Short date, e.g. "4 Mei". */
export function formatDateShort(date: Date): string {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
  }).format(date)
}

/** Estimate reading time: words / 200, minimum 1 minute. */
export function readingTime(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.round(words / 200))
}

/** Filter out drafts (in production) and sort newest-first. */
export function sortArtikel(entries: Artikel[]): Artikel[] {
  return entries
    .filter((entry) => import.meta.env.DEV || !entry.data.draft)
    .sort((a, b) => b.data.publishDate.valueOf() - a.data.publishDate.valueOf())
}

/** Related articles by shared tags, excluding the current one. */
export function relatedArtikel(current: Artikel, all: Artikel[], limit = 3): Artikel[] {
  const currentTags = new Set(current.data.tags)
  return sortArtikel(all)
    .filter((entry) => entry.id !== current.id)
    .map((entry) => ({
      entry,
      score: entry.data.tags.filter((tag) => currentTags.has(tag)).length,
    }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((item) => item.entry)
}

/** Collect unique tags with counts across all articles. */
export function collectTags(entries: Artikel[]): { tag: string; count: number }[] {
  const counts = new Map<string, number>()
  for (const entry of entries) {
    for (const tag of entry.data.tags) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1)
    }
  }
  return [...counts.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count)
}

/** Collect unique seri with counts. */
export function collectSeri(entries: Artikel[]): { seri: string; count: number }[] {
  const counts = new Map<string, number>()
  for (const entry of entries) {
    if (entry.data.seri) {
      counts.set(entry.data.seri, (counts.get(entry.data.seri) ?? 0) + 1)
    }
  }
  return [...counts.entries()]
    .map(([seri, count]) => ({ seri, count }))
    .sort((a, b) => b.count - a.count)
}

export function tagLabel(tag: string): string {
  return TAG_META[tag]?.label ?? tag.charAt(0).toUpperCase() + tag.slice(1)
}

export function tagDescription(tag: string): string | undefined {
  return TAG_META[tag]?.description
}

export function seriLabel(seri: string): string {
  return SERI_META[seri]?.label ?? seri.charAt(0).toUpperCase() + seri.slice(1)
}

export function seriDescription(seri: string): string | undefined {
  return SERI_META[seri]?.description
}

/** Build a Table of Contents from MDX rendered headings. */
export type TocItem = { depth: number; slug: string; text: string }

export function buildToc(headings: { depth: number; slug: string; text: string }[]): TocItem[] {
  return headings.filter((h) => h.depth === 2 || h.depth === 3)
}
