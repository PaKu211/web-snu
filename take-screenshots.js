import puppeteer from 'puppeteer';
import fs from 'fs';

const pagesToScreenshot = [
  { name: 'dashboard', url: '/' },
  { name: 'artikel', url: '/artikel' },
  { name: 'artikel-single', url: '/artikel/2025-antara-desain-intuisi-dan-realita' },
  { name: 'galeri', url: '/galeri' },
  { name: 'kontributor', url: '/kontributor' },
  { name: 'tentang', url: '/tentang' },
  { name: 'seri', url: '/seri' },
  { name: 'events', url: '/events' },
  { name: 'cari', url: '/cari' }
];

async function autoScroll(page) {
    await page.evaluate(async () => {
        await new Promise((resolve) => {
            var totalHeight = 0;
            var distance = 100;
            var timer = setInterval(() => {
                var scrollHeight = document.body.scrollHeight;
                window.scrollBy(0, distance);
                totalHeight += distance;

                if(totalHeight >= scrollHeight - window.innerHeight){
                    clearInterval(timer);
                    resolve();
                }
            }, 100);
        });
    });
}

async function run() {
  console.log('Starting screenshots...');
  if (!fs.existsSync('screenshots')) {
    fs.mkdirSync('screenshots');
  }

  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  for (const p of pagesToScreenshot) {
    const fullUrl = `http://localhost:4321${p.url}`;
    console.log(`Navigating to ${fullUrl}...`);
    try {
      await page.goto(fullUrl, { waitUntil: 'networkidle0', timeout: 60000 });
      // wait a bit for initial content
      await new Promise(r => setTimeout(r, 2000));
      // scroll to bottom to load lazy elements
      await autoScroll(page);
      // scroll back to top
      await page.evaluate(() => window.scrollTo(0, 0));
      // wait a bit for everything to settle
      await new Promise(r => setTimeout(r, 2000));

      const path = `screenshots/${p.name}.png`;
      await page.screenshot({ path, fullPage: true });
      console.log(`Saved screenshot to ${path}`);
    } catch (e) {
      console.error(`Failed to screenshot ${p.name}:`, e.message);
    }
  }

  await browser.close();
  console.log('Done!');
}

run();
