# Sinkronisasi Artikel Quora menggunakan Zyte Scrapy Cloud (Gratis)

Panduan ini menjelaskan bagaimana cara men-deploy spider Python Scrapy ke platform **Zyte Scrapy Cloud** (menggunakan unit 1 Scrapy Cloud gratis dari GitHub Student Pack Anda) untuk mengambil konten Quora Space secara otomatis tanpa terblokir Cloudflare, lalu mengimpornya kembali ke proyek Astro Anda.

---

## Langkah 1: Persiapan dan Deployment Spider ke Zyte Scrapy Cloud

1. **Pasang `shub` CLI** (Zyte command-line tool) di terminal lokal Anda (disarankan di luar Codespace, atau di terminal lokal Anda):
   ```bash
   pip install shub
   ```

2. **Login ke Zyte menggunakan token API Anda**:
   * Ambil API Key Anda di dashboard [Zyte API Keys](https://app.zyte.com/o/default/shared-api-keys).
   * Jalankan perintah:
     ```bash
     shub login
     ```
     Masukkan API Key saat diminta.

3. **Deploy proyek scraper**:
   * Pindah ke folder proyek:
     ```bash
     cd /home/smiley/projek/agy/portal-sekala-niskala
     ```
   * Deploy spider menggunakan `shub`:
     ```bash
     shub deploy <PROJECT_ID>
     ```
     *(Ganti `<PROJECT_ID>` dengan ID Proyek angka yang Anda dapatkan di Zyte Dashboard untuk proyek Scrapy Cloud Anda).*

4. **Jalankan Scraper di Dashboard Zyte**:
   * Buka Dashboard Zyte Scrapy Cloud Anda.
   * Pilih spider dengan nama `quora` dan jalankan (**Run**). 
   * Anda juga dapat mengatur penjadwalan (**Periodic Jobs**) agar scraper berjalan secara otomatis (misalnya sekali sehari atau seminggu sekali).

---

## Langkah 2: Mengambil Hasil Scraping ke Proyek Astro

Setelah pekerjaan scraping di Zyte selesai, Anda dapat menarik data hasil scraping langsung ke Codespace atau mesin lokal Anda menggunakan script Node.js.

1. **Atur variabel lingkungan (Environment Variables)**:
   * **`ZYTE_SHUB_API_KEY`**: API Key dari Akun Zyte Anda.
   * **`ZYTE_PROJECT_ID`**: ID Proyek Scrapy Cloud Anda di Zyte.

   Di terminal, jalankan perintah ekspor berikut sebelum menjalankan script (atau simpan di berkas `.env`):
   ```bash
   export ZYTE_SHUB_API_KEY="api_key_zyte_anda_di_sini"
   export ZYTE_PROJECT_ID="id_project_zyte_anda_di_sini"
   ```

2. **Jalankan script sinkronisasi**:
   ```bash
   node scripts/fetch-zyte-articles.js
   ```

Script ini akan otomatis:
* Menghubungi API Zyte Scrapy Cloud.
* Mendapatkan daftar artikel terbaru yang berhasil di-scrape.
* Mengonversi konten HTML Quora ke format Markdown/MDX yang bersih.
* Mengunduh gambar sampul (*cover*) dan gambar di dalam teks artikel secara lokal ke folder `/public/images/artikel/` (sehingga gambar tidak di-hotlink langsung dari Quora, yang dapat rusak kapan saja).
* Menyimpan artikel sebagai berkas MDX baru di `src/content/artikel/` tanpa merusak validasi Keystatic.

---

## Fitur Tambahan & Pembersihan Konten
Jika Anda melihat konten MDX Anda rusak atau memiliki tag HTML mentah akibat migrasi lama, Anda dapat membersihkannya kembali kapan saja menggunakan:
```bash
node scripts/clean-mdx.js
```
Script ini akan secara otomatis membersihkan semua berkas MDX di proyek Anda dari tag HTML mentah (`<p>`, `<span>`, dll.) menjadi Markdown murni.
