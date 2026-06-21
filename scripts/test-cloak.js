import { launch } from 'cloakbrowser/puppeteer';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function test() {
  console.log('Memulai CloakBrowser...');
  try {
    const browser = await launch({
      headless: false,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    console.log('Browser berhasil diluncurkan. Membuka tab baru...');
    const page = await browser.newPage();
    
    const spaceUrl = 'https://sekalaniskalauniverse.quora.com/';
    console.log(`Membuka: ${spaceUrl}...`);
    
    try {
      await page.goto(spaceUrl, { waitUntil: 'domcontentloaded', timeout: 35000 });
    } catch (e) {
      console.log('Selesai menunggu navigasi awal...');
    }
    
    // Loop to wait for Cloudflare Turnstile to solve and redirect
    console.log('Menunggu Cloudflare Turnstile menyelesaikan tantangan (maksimal 25 detik)...');
    let solved = false;
    for (let i = 0; i < 25; i++) {
      const pageTitle = await page.title();
      const bodyText = await page.evaluate(() => document.body.innerText);
      
      console.log(`Detik ${i+1}: Judul = "${pageTitle}", Panjang teks = ${bodyText.length}`);
      
      if (pageTitle && !pageTitle.includes('Just a moment') && !pageTitle.includes('Attention Required') && bodyText.includes('Sekala Niskala')) {
        console.log('Sukses! Cloudflare Turnstile berhasil dilewati!');
        solved = true;
        break;
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    if (!solved) {
      console.log('Turnstile gagal diselesaikan dalam 25 detik.');
    }
    
    const finalTitle = await page.title();
    console.log(`Judul Akhir Halaman: "${finalTitle}"`);
    
    const bodyText = await page.evaluate(() => document.body.innerText);
    console.log(`Panjang teks akhir: ${bodyText.length}`);
    if (bodyText.length > 500) {
      console.log('Isi teks (potongan pertama):');
      console.log(bodyText.slice(0, 500));
    }
    
    await browser.close();
  } catch (err) {
    console.error('Terjadi kesalahan:', err);
  }
}

test();
