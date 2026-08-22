const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

// Simple slugify helper
function slugify(text) {
  const s = text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
  return s.slice(0, 80).replace(/-+$/, '');
}

// MDX requires all void elements like <img>, <br>, <hr> to be self-closed
function makeMdxSafe(html) {
  if (!html) return '';
  return html
    .replace(/<img([^>]*)\/>/g, '<img$1>')
    .replace(/<img([^>]*)>/g, '<img$1 />')
    
    .replace(/<br([^>]*)\/>/g, '<br$1>')
    .replace(/<br([^>]*)>/g, '<br$1 />')
    
    .replace(/<hr([^>]*)\/>/g, '<hr$1>')
    .replace(/<hr([^>]*)>/g, '<hr$1 />')
    
    .replace(/<!--[\s\S]*?-->/g, '');
}

// Simple Markdown to plain text cleaner for description
function cleanDescriptionMarkdown(md) {
  if (!md) return '';
  const text = md
    .replace(/[#*_\-[\]()!]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return text.slice(0, 150) + (text.length > 150 ? '...' : '');
}

// Robust helper to parse Quora date string into YYYY-MM-DD
function parseQuoraDate(dateStr, baseDate = new Date()) {
  if (!dateStr) return baseDate.toISOString().split('T')[0];
  
  let clean = dateStr.replace(/Updated|Posted|Diperbarui|Ditulis/gi, '').trim().toLowerCase();
  if (!clean) return baseDate.toISOString().split('T')[0];
  
  const d = new Date(baseDate);

  // Match relative formats like "9bln", "1thn", "3minggu", "4hari", "5jam", "10mnt", "9mo", "1y", "3w", "4d", "5h", "10m"
  const relativeMatch = clean.match(/^(\d+)\s*(thn|y|year|years|bln|mo|month|months|minggu|wk|w|week|weeks|hari|d|day|days|jam|h|hour|hours|mnt|m|min|minute|minutes|detik|s|sec|second|seconds)?(?:\s*lalu|\s*ago)?$/i);
  if (relativeMatch) {
    const value = parseInt(relativeMatch[1], 10);
    const unit = relativeMatch[2] ? relativeMatch[2].toLowerCase() : '';
    
    if (unit.startsWith('thn') || unit === 'y' || unit.startsWith('year')) {
      d.setFullYear(d.getFullYear() - value);
    } else if (unit.startsWith('bln') || unit === 'mo' || unit.startsWith('month')) {
      d.setMonth(d.getMonth() - value);
    } else if (unit.startsWith('minggu') || unit === 'w' || unit === 'wk' || unit.startsWith('week')) {
      d.setDate(d.getDate() - (value * 7));
    } else if (unit.startsWith('hari') || unit === 'd' || unit.startsWith('day')) {
      d.setDate(d.getDate() - value);
    } else if (unit.startsWith('jam') || unit === 'h' || unit.startsWith('hour')) {
      d.setHours(d.getHours() - value);
    } else if (unit.startsWith('mnt') || unit === 'm' || unit.startsWith('min') || unit.startsWith('minute')) {
      d.setMinutes(d.getMinutes() - value);
    } else if (unit.startsWith('detik') || unit === 's' || unit.startsWith('sec') || unit.startsWith('second')) {
      d.setSeconds(d.getSeconds() - value);
    }
    return d.toISOString().split('T')[0];
  }

  // Handle day names
  const daysMap = {
    min: 0, minggu: 0, sun: 0, sunday: 0,
    sen: 1, senin: 1, mon: 1, monday: 1,
    sel: 2, selasa: 2, tue: 2, tuesday: 2,
    rab: 3, rabu: 3, wed: 3, wednesday: 3,
    kam: 4, kamis: 4, thu: 4, thursday: 4,
    jum: 5, jumat: 5, fri: 5, friday: 5,
    sab: 6, sabtu: 6, sat: 6, saturday: 6
  };
  if (daysMap[clean] !== undefined) {
    const targetDay = daysMap[clean];
    const currentDay = d.getDay();
    let diff = currentDay - targetDay;
    if (diff <= 0) {
      diff += 7;
    }
    d.setDate(d.getDate() - diff);
    return d.toISOString().split('T')[0];
  }

  const monthMap = {
    jan: 0, janari: 0, january: 0,
    feb: 1, peb: 1, februari: 1, february: 1,
    mar: 2, maret: 2, march: 2,
    apr: 3, april: 3,
    mei: 4, may: 4,
    jun: 5, juni: 5, june: 5,
    jul: 6, juli: 6, july: 6,
    agt: 7, aug: 7, agustus: 7, august: 7,
    sep: 8, september: 8,
    okt: 9, oct: 9, oktober: 9, october: 9,
    nov: 10, november: 10,
    des: 11, dec: 11, desember: 11, december: 11
  };

  const tokens = clean.replace(/,/g, ' ').split(/\s+/).filter(Boolean);
  if (tokens.length >= 2) {
    let day = null;
    let month = null;
    let year = baseDate.getFullYear();

    for (const token of tokens) {
      const num = parseInt(token, 10);
      if (!isNaN(num)) {
        if (num > 31) {
          year = num;
        } else if (day === null) {
          day = num;
        } else {
          year = num;
        }
      } else {
        const t3 = token.slice(0, 3).toLowerCase();
        if (monthMap[t3] !== undefined) {
          month = monthMap[t3];
        }
      }
    }

    if (day !== null && month !== null) {
      const res = new Date(year, month, day);
      if (res > baseDate && year === baseDate.getFullYear()) {
        res.setFullYear(year - 1);
      }
      return res.toISOString().split('T')[0];
    }
  }

  return baseDate.toISOString().split('T')[0];
}

async function run() {
  console.log('Memulai Sinkronisasi Artikel Quora (Enhanced Robust Scraper)...');
  
  const browser = await puppeteer.launch({
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 900 });
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    const cookiePath = path.join(__dirname, 'quora-cookies.json');
    if (fs.existsSync(cookiePath)) {
      console.log('Memuat cookies Quora yang tersimpan...');
      const cookiesString = fs.readFileSync(cookiePath, 'utf8');
      const cookies = JSON.parse(cookiesString);
      await page.setCookie(...cookies);
    }

    const spaces = [
      { url: 'https://sekalaniskalauniverse.quora.com/', base: 'sekalaniskalauniverse.quora.com' }
    ];

    const allUniqueUrls = [];
    const urlToDateMap = {};

    for (const space of spaces) {
      console.log(`\nMenavigasi ke Quora Space: ${space.url}`);
      await page.goto(space.url, { waitUntil: 'networkidle2', timeout: 60000 }).catch(e => console.log(`Warning navigasi: ${e.message}`));
      
      console.log('Memulai auto-scroll untuk menemukan seluruh URL artikel...');
      let previousUrlCount = 0;
      let noNewUrlsCount = 0;
      let uniqueUrls = [];
      
      for (let i = 0; i < 160; i++) {
        await page.evaluate(() => {
          window.scrollBy(0, window.innerHeight * 2);
        });
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Singkirkan popup modal Quora login yang sesekali muncul
        await page.evaluate(() => {
          const overlays = document.querySelectorAll('.qu-bg--black_alpha_60, .qu-zIndex--modal, [class*="Modal"], [class*="Overlay"]');
          overlays.forEach(el => el.remove());
          document.body.style.overflow = 'auto';
        });

        const feedEntries = await page.evaluate((baseDomain) => {
          const anchors = Array.from(document.querySelectorAll('a'));
          const results = [];
          
          anchors.forEach(a => {
            const href = a.href || '';
            if (!href) return;
            const cleanUrl = href.split('?')[0];
            
            if (cleanUrl.includes(baseDomain) && 
                !cleanUrl.includes('/about') && 
                !cleanUrl.includes('/followers') &&
                !cleanUrl.includes('/submissions') &&
                !cleanUrl.includes('/log') &&
                !cleanUrl.includes('/comment/') &&
                cleanUrl !== 'https://' + baseDomain &&
                cleanUrl !== 'http://' + baseDomain &&
                cleanUrl !== 'https://' + baseDomain + '/' &&
                cleanUrl !== 'http://' + baseDomain + '/') {
              
              let dateStr = '';
              let parent = a.parentElement;
              for (let dDepth = 0; dDepth < 8; dDepth++) {
                if (!parent) break;
                const tsEl = parent.querySelector('.post_timestamp');
                if (tsEl) {
                  dateStr = tsEl.textContent.trim();
                  break;
                }
                parent = parent.parentElement;
              }
              
              if (!dateStr && a.parentElement) {
                const grayTexts = Array.from(a.parentElement.querySelectorAll('.qu-color--gray, .qu-color--gray_light, span, a'));
                for (const el of grayTexts) {
                  const text = el.textContent.trim();
                  if (text.includes('Diperbarui') || text.includes('Ditulis') || text.includes('Updated') || text.includes('Posted') || /^\d+(bln|thn|jam|mnt|mo|y|w|d|h)/.test(text)) {
                    dateStr = text;
                    break;
                  }
                }
              }
              
              results.push({ url: cleanUrl, dateStr });
            }
          });
          
          return results;
        }, space.base);
        
        feedEntries.forEach(item => {
          if (item.dateStr) {
            urlToDateMap[item.url] = item.dateStr;
          }
        });
        
        const currentUrls = feedEntries.map(item => item.url);
        uniqueUrls = [...new Set(currentUrls)];
        
        if (i % 20 === 0 || i === 159) {
          console.log(`Guliran #${i + 1}: Terdeteksi ${uniqueUrls.length} artikel unik di DOM.`);
        }
        
        if (uniqueUrls.length === previousUrlCount && uniqueUrls.length > 50) {
          noNewUrlsCount++;
          if (noNewUrlsCount >= 15) {
            console.log('Jumlah postingan stabil. Selesai scrolling untuk Space ini.');
            break;
          }
        } else {
          noNewUrlsCount = 0;
        }
        previousUrlCount = uniqueUrls.length;
      }
      
      allUniqueUrls.push(...uniqueUrls);
    }
    
    const uniqueUrls = [...new Set(allUniqueUrls)];
    console.log(`\nTotal seluruh artikel unik di feed: ${uniqueUrls.length}`);

    const articlesDir = path.join(__dirname, '../src/content/artikel');
    const publicImagesDir = path.join(__dirname, '../public/images/artikel');

    if (!fs.existsSync(articlesDir)) fs.mkdirSync(articlesDir, { recursive: true });
    if (!fs.existsSync(publicImagesDir)) fs.mkdirSync(publicImagesDir, { recursive: true });

    // FASE 2: SCRAPING INDIVIDUAL DENGAN AUTO-EXPAND & REPOST RESOLUTION
    const newArticles = uniqueUrls;
    console.log(`\n--- Memproses artikel untuk ekstraksi konten mendalam ---`);

    for (let index = 0; index < newArticles.length; index++) {
      const postUrl = newArticles[index];
      console.log(`\n[${index + 1}/${newArticles.length}] Memproses: ${postUrl}`);

      const newPage = await browser.newPage();
      try {
        await newPage.setViewport({ width: 1280, height: 900 });
        await newPage.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
        
        if (fs.existsSync(cookiePath)) {
          const cookiesString = fs.readFileSync(cookiePath, 'utf8');
          const cookies = JSON.parse(cookiesString);
          await newPage.setCookie(...cookies);
        }
        
        await newPage.goto(postUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
        await newPage.waitForSelector('.qu-userSelect--text, article, .q-text', { timeout: 15000 }).catch(() => {});

        // 1. AUTO-EXPAND SEMUA TOMBOL "(more)" / "(Lanjutkan membaca)"
        await newPage.evaluate(() => {
          const clickables = Array.from(document.querySelectorAll('button, span, div, a, .qu-cursor--pointer'));
          clickables.forEach(el => {
            const txt = (el.textContent || '').trim().toLowerCase();
            if (txt === '(more)' || txt === 'more' || txt === '(lanjutkan membaca)' || txt === 'lanjutkan membaca' || txt === 'continue reading' || txt === '(baca selengkapnya)') {
              try { el.click(); } catch(e){}
            }
          });
        });
        await new Promise(resolve => setTimeout(resolve, 800));

        let rawTitle = await newPage.title();
        let title = rawTitle
          .replace(/ - Sekala Niskala Universe \(SNU\) - Quora$/i, '')
          .replace(/ - Sekala Niskala Universe - Quora$/i, '')
          .replace(/ - Sekala Niskala Universe \(SNU\)$/i, '')
          .replace(/ - Sekala Niskala Universe$/i, '')
          .replace(/ - Quora$/i, '')
          .trim();

        const postData = await newPage.evaluate(() => {
          // Cari author
          let author = 'Komunitas SNU';
          const authorAnchor = document.querySelector('a[href*="/profile/"]');
          if (authorAnchor) {
            const authorText = authorAnchor.textContent.trim();
            if (authorText && !authorText.includes('Profile') && !authorText.includes('Sekala Niskala')) {
              author = authorText;
            }
          }

          // Cari tanggal
          const dateEl = document.querySelector('.post_timestamp');
          let dateStr = '';
          if (dateEl) {
            dateStr = dateEl.textContent.trim();
          } else {
            const grayLight = document.querySelector('.q-text.qu-color--gray_light');
            if (grayLight) dateStr = grayLight.textContent.trim();
          }

          function wrapMarkdown(text, wrapper) {
            const trimmed = text.trim();
            if (!trimmed) return text;
            const leading = text.match(/^\s*/)[0];
            const trailing = text.match(/\s*$/)[0];
            if (trimmed.startsWith(wrapper) && trimmed.endsWith(wrapper)) {
              return text;
            }
            return `${leading}${wrapper}${trimmed}${wrapper}${trailing}`;
          }

          function toMarkdown(node) {
            if (node.nodeType === 3) return node.textContent;
            if (node.nodeType !== 1) return '';

            const tagName = node.tagName.toLowerCase();
            if (tagName === 'style' || tagName === 'script' || tagName === 'button') return '';

            let childrenMarkdown = '';
            for (const child of node.childNodes) {
              childrenMarkdown += toMarkdown(child);
            }

            switch (tagName) {
              case 'p':
                if (!childrenMarkdown.trim()) return '';
                return '\n\n' + childrenMarkdown.trim() + '\n\n';
              case 'span':
                const weight = node.style.fontWeight || '';
                const style = node.style.fontStyle || '';
                let text = childrenMarkdown;
                if (weight === 'bold' || weight === '700') text = wrapMarkdown(text, '**');
                if (style === 'italic') text = wrapMarkdown(text, '*');
                return text;
              case 'b':
              case 'strong':
                return wrapMarkdown(childrenMarkdown, '**');
              case 'i':
              case 'em':
                return wrapMarkdown(childrenMarkdown, '*');
              case 'h1':
                return '\n\n# ' + childrenMarkdown.trim() + '\n\n';
              case 'h2':
                return '\n\n## ' + childrenMarkdown.trim() + '\n\n';
              case 'h3':
                return '\n\n### ' + childrenMarkdown.trim() + '\n\n';
              case 'blockquote':
                return '\n\n> ' + childrenMarkdown.trim().split('\n').map(line => line.trim()).join('\n> ') + '\n\n';
              case 'ul':
                return '\n\n' + childrenMarkdown.trim() + '\n\n';
              case 'ol':
                return '\n\n' + childrenMarkdown.trim() + '\n\n';
              case 'li':
                return '\n- ' + childrenMarkdown.trim();
              case 'a':
                const href = node.getAttribute('href') || '';
                if (href && !href.startsWith('javascript:')) return ` [${childrenMarkdown.trim() || href}](${href}) `;
                return childrenMarkdown;
              case 'img':
                const src = node.getAttribute('src') || '';
                const alt = node.getAttribute('alt') || '';
                if (src && !src.includes('data:image')) return `\n\n![${alt || 'image'}](${src})\n\n`;
                return '';
              case 'br':
                return '\n';
              default:
                return childrenMarkdown;
            }
          }

          // Kumpulkan semua blok konten teks di dalam artikel (termasuk quoted stories)
          const textBlocks = Array.from(document.querySelectorAll('.qu-userSelect--text, .q-text.qu-userSelect--text'));
          let combinedMarkdown = '';

          if (textBlocks.length > 0) {
            textBlocks.forEach(block => {
              const md = toMarkdown(block).trim();
              if (md && !combinedMarkdown.includes(md)) {
                combinedMarkdown += md + '\n\n';
              }
            });
          } else {
            const articleEl = document.querySelector('article') || document.querySelector('.q-box');
            if (articleEl) combinedMarkdown = toMarkdown(articleEl);
          }

          combinedMarkdown = combinedMarkdown.replace(/\r\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();

          return { markdown: combinedMarkdown, dateStr, author };
        });

        if (postData && !postData.dateStr && urlToDateMap[postUrl]) {
          postData.dateStr = urlToDateMap[postUrl];
        }

        if (!postData || !postData.markdown || postData.markdown.length < 20) {
          console.log(`[Lewati] Konten terlalu pendek atau kosong untuk ${postUrl}`);
          continue;
        }

        if (!title) {
          const text = postData.markdown.replace(/[#*_\-[\]()!]/g, ' ').replace(/\s+/g, ' ').trim();
          title = text.slice(0, 50) + (text.length > 50 ? '...' : '');
        }

        const slug = slugify(title);
        const filePath = path.join(articlesDir, `${slug}.mdx`);
        const formattedDate = parseQuoraDate(postData.dateStr);

        let coverPath = '';
        if (fs.existsSync(filePath)) {
          const existingMdx = fs.readFileSync(filePath, 'utf8');
          const covMatch = existingMdx.match(/cover:\s*"([^"]+)"/);
          if (covMatch) {
            coverPath = covMatch[1];
          }
        }

        const descriptionText = cleanDescriptionMarkdown(postData.markdown);
        let finalMarkdown = postData.markdown;

        const authorSlug = slugify(postData.author || 'Komunitas SNU');

        const mdxContent = `---
title: ${JSON.stringify(title)}
description: ${JSON.stringify(descriptionText)}
${coverPath ? `cover: "${coverPath}"\n` : ''}publishDate: "${formattedDate}"
author: "${authorSlug}"
tags: ["quora-sync"]
sourceUrl: "${postUrl}"
---

${finalMarkdown}
`;

        fs.writeFileSync(filePath, mdxContent, 'utf8');
        console.log(`✓ Berhasil menyimpan artikel: ${slug}.mdx (${postData.markdown.split(/\s+/).length} kata)`);

      } catch (err) {
        console.error(`Error memproses ${postUrl}: ${err.message}`);
      } finally {
        await newPage.close();
      }
    }

    console.log('\n===============================================');
    console.log('Sinkronisasi Quora Selesai!');
    console.log('===============================================\n');

  } catch (error) {
    console.error('Fatal Error:', error);
  } finally {
    await browser.close();
  }
}

if (require.main === module) {
  run();
}

module.exports = { run };
