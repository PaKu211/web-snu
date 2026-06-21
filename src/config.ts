export const SITE = {
  name: "Sekala Niskala",
  shortName: "SNU",
  title: "Portal Sekala Niskala",
  description:
    "Ruang tulisan komunitas Sekala Niskala — refleksi tentang yang tampak (sekala) dan yang tak tampak (niskala), perjalanan, dan ruang-ruang di antaranya.",
  url: "https://snu.pages.dev",
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
  niskala: {
    label: "Niskala",
    description: "Yang tak kasat mata — batin, makna, dan ruang spiritual.",
  },
  sekala: {
    label: "Sekala",
    description: "Yang kasat mata — dunia nyata, alam, dan pengalaman badani.",
  },
  outbound: {
    label: "Outbound",
    description: "Catatan perjalanan dan petualangan di alam terbuka.",
  },
  "english-hours": {
    label: "English Hours",
    description: "Tulisan dan latihan dalam Bahasa Inggris.",
  },
}

export const SERI_META: Record<string, { label: string; description: string }> = {
  malming: {
    label: "Malam Mingguan",
    description: "Renungan ringan yang terbit tiap Sabtu malam.",
  },
  outbound: {
    label: "Seri Outbound",
    description: "Rangkaian kisah dari perjalanan ke alam bebas.",
  },
}
