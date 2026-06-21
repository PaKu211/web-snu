import siteSettings from "./content/settings/site.json"

export const SITE = {
  name: siteSettings.name,
  shortName: siteSettings.shortName,
  title: siteSettings.title,
  description: siteSettings.description,
  url: siteSettings.url,
  locale: "id-ID",
  defaultAuthor: "Komunitas SNU",
} as const

export const NAV_LINKS = [
  { label: "Beranda", href: "/" },
  { label: "Artikel", href: "/artikel" },
  { label: "Events", href: "/events" },
  { label: "Tentang", href: "/tentang" },
  { label: "Kontributor", href: "/kontributor" },
] as const

// Taksonomi yang dikurasi untuk label & deskripsi yang manusiawi.
export const TAG_META: Record<string, { label: string; description: string }> = {
  "wpm-saga": {
    label: "WPM [SAGA]",
    description: "Kisah-kisah fiksi fantasi gaib dan mistis.",
  },
  spiritual: {
    label: "Spiritual",
    description: "Renungan, pemikiran, dan laku kesadaran batin.",
  },
  misteri: {
    label: "Misteri",
    description: "Penelusuran kisah supernatural dan dunia tak kasat mata.",
  },
  snu: {
    label: "SNU",
    description: "Catatan dan rumor dari semesta Sekala Niskala Universe.",
  },
}

export const SERI_META: Record<string, { label: string; description: string }> = {
  "wpm-saga": {
    label: "WPM [SAGA]",
    description: "Kisah fiksi fantasi mistis tentang Sakti, Bayu, dan perjalanan dimensi transisi.",
  },
}

export const QUORA_URL = siteSettings.quoraUrl
export const QUORA_RSS_FEED_URL = siteSettings.rssUrl
export const ANNOUNCEMENT = {
  active: siteSettings.announcementActive,
  text: siteSettings.announcementText,
  link: siteSettings.announcementLink,
}

