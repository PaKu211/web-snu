import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const articlesDir = path.join(__dirname, '../src/content/artikel');
const publicImagesDir = path.join(__dirname, '../public/images/artikel');

// Ensure directories exist
if (!fs.existsSync(articlesDir)) fs.mkdirSync(articlesDir, { recursive: true });
if (!fs.existsSync(publicImagesDir)) fs.mkdirSync(publicImagesDir, { recursive: true });

const apiKey = process.env.ZYTE_SHUB_API_KEY;
const projectId = process.env.ZYTE_PROJECT_ID;

// Helper to download an image using Node fetch
async function downloadImage(url, destPath) {
  try {
    const res = await fetch(url);
    if (res.ok) {
      const arrayBuffer = await res.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      fs.writeFileSync(destPath, buffer);
      return true;
    }
    console.error(`Gagal mengunduh gambar dari ${url}, HTTP status: ${res.status}`);
    return false;
  } catch (err) {
    console.error(`Gagal mengunduh gambar ${url}: ${err.message}`);
    return false;
  }
}

// Slugify helper
function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

// Convert HTML content to clean Markdown/MDX
function htmlToMarkdown(html) {
  if (!html) return '';
  let text = html;

  // Replace images
  text = text.replace(/<img[^>]+src=["']([^"']+)["'][^>]*>/gi, (match, src) => {
    return `\n\n![](${src})\n\n`;
  });

  // Replace links
  text = text.replace(/<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi, (match, href, content) => {
    return ` [${content.trim() || href}](${href}) `;
  });

  // Replace headings
  text = text.replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, '\n\n# $1\n\n');
  text = text.replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, '\n\n## $1\n\n');
  text = text.replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, '\n\n### $1\n\n');
  text = text.replace(/<h4[^>]*>([\s\S]*?)<\/h4>/gi, '\n\n#### $1\n\n');

  // Replace blockquotes
  text = text.replace(/<blockquote[^>]*>([\s\S]*?)<\/blockquote>/gi, (match, content) => {
    const cleanContent = content.replace(/<div[^>]*>([\s\S]*?)<\/div>/gi, '$1').replace(/<[^>]*>/g, '').trim();
    return '\n\n> ' + cleanContent.split('\n').map(l => l.trim()).join('\n> ') + '\n\n';
  });

  // Replace lists
  text = text.replace(/<ul[^>]*>([\s\S]*?)<\/ul>/gi, '\n\n$1\n\n');
  text = text.replace(/<ol[^>]*>([\s\S]*?)<\/ol>/gi, '\n\n$1\n\n');
  text = text.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, '\n- $1');

  // Process bold/italic spans and tags recursively
  let changed = true;
  let loops = 0;
  while (changed && loops < 10) {
    const oldText = text;
    
    // Bold styles
    text = text.replace(/<span[^>]+style=["'][^"']*(font-weight:\s*bold|700)[^"']*["'][^>]*>([\s\S]*?)<\/span>/gi, '**$2**');
    // Italic styles
    text = text.replace(/<span[^>]+style=["'][^"']*(font-style:\s*italic)[^"']*["'][^>]*>([\s\S]*?)<\/span>/gi, '*$2*');
    
    // Bold tags
    text = text.replace(/<(b|strong)[^>]*>([\s\S]*?)<\/\1>/gi, '**$2**');
    // Italic tags
    text = text.replace(/<(i|em)[^>]*>([\s\S]*?)<\/\2>/gi, '*$2*');
    
    // Strip other spans
    text = text.replace(/<span[^>]*>([\s\S]*?)<\/span>/gi, '$1');
    // Strip divs
    text = text.replace(/<div[^>]*>([\s\S]*?)<\/div>/gi, '$1');
    // Strip paragraphs
    text = text.replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, '\n\n$1\n\n');

    if (oldText === text) {
      changed = false;
    }
    loops++;
  }

  // Replace br tags
  text = text.replace(/<br\s*\/?>/gi, '\n');

  // Strip any remaining HTML tags
  text = text.replace(/<[^>]+>/g, '');

  // Clean HTML entities
  text = text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#8217;/g, "'")
    .replace(/&#8220;/g, '"')
    .replace(/&#8221;/g, '"')
    .replace(/&#8230;/g, '...');

  // Resolve multiple newlines
  text = text.replace(/\r\n/g, '\n');
  text = text.replace(/\n{3,}/g, '\n\n');
  
  return text.trim();
}

// Clean description excerpt from markdown text
function cleanDescriptionMarkdown(md) {
  if (!md) return '';
  const text = md
    .replace(/[#*_\-[\]()!]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return text.slice(0, 150) + (text.length > 150 ? '...' : '');
}

async function run() {
  if (!apiKey || !projectId) {
    console.error('ERROR: Harap atur variabel lingkungan ZYTE_SHUB_API_KEY dan ZYTE_PROJECT_ID!');
    process.exit(1);
  }

  console.log(`Mengambil daftar pekerjaan terbaru dari proyek Scrapy Cloud: ${projectId}...`);
  try {
    const jobsRes = await fetch(`https://storage.scrapinghub.com/jobs/${projectId}?apikey=${apiKey}&state=finished&count=1&format=json`);
    if (!jobsRes.ok) throw new Error(`HTTP ${jobsRes.status} saat mengambil daftar pekerjaan`);
    
    const jobs = await jobsRes.json();
    if (jobs.length === 0) {
      console.log('Tidak ada pekerjaan selesai (finished jobs) yang ditemukan.');
      return;
    }

    const jobId = jobs[0].id;
    console.log(`Menemukan pekerjaan selesai terbaru: ${jobId}. Mengambil item hasil scraping...`);

    const itemsRes = await fetch(`https://storage.scrapinghub.com/items/${jobId}?apikey=${apiKey}&format=json`);
    if (!itemsRes.ok) throw new Error(`HTTP ${itemsRes.status} saat mengambil item`);
    
    const items = await itemsRes.json();
    console.log(`Mengunduh dan menyinkronkan ${items.length} artikel dari Zyte Hubstorage...`);

    let syncCount = 0;
    for (const item of items) {
      const { title, content_markdown, publish_date, source_url, cover_image_url } = item;
      
      if (!title || !content_markdown) continue;

      const slug = slugify(title);
      const filePath = path.join(articlesDir, `${slug}.mdx`);
      
      // Parse publish date
      let formattedDate = new Date().toISOString().split('T')[0];
      if (publish_date) {
        try {
          const cleanDateStr = publish_date.replace(/Updated|Posted/i, '').trim();
          const d = new Date(cleanDateStr);
          if (!isNaN(d.getTime())) {
            formattedDate = d.toISOString().split('T')[0];
          }
        } catch (e) {}
      }

      // Convert content HTML to Markdown
      const markdown = htmlToMarkdown(content_markdown);
      const descriptionText = cleanDescriptionMarkdown(markdown);

      // Download Cover Image if present
      let coverPath = '';
      if (cover_image_url && cover_image_url.startsWith('http')) {
        let imgExt = 'jpg';
        const urlWithoutQuery = cover_image_url.split('?')[0].split('#')[0];
        const lastPart = urlWithoutQuery.substring(urlWithoutQuery.lastIndexOf('/') + 1);
        if (lastPart.includes('.')) {
          imgExt = lastPart.split('.').pop();
        }

        const imgName = `cover-${slug}.${imgExt}`;
        const destImgPath = path.join(publicImagesDir, imgName);

        console.log(`Mengunduh gambar sampul artikel "${title}"...`);
        const success = await downloadImage(cover_image_url, destImgPath);
        if (success) {
          coverPath = `../../../public/images/artikel/${imgName}`;
        }
      }

      // Download Inline Content Images from Markdown
      const imgRegex = /!\[(.*?)\]\((https?:\/\/[^)]+)\)/g;
      let match;
      let finalMarkdown = markdown;
      let inlineImgIndex = 1;

      while ((match = imgRegex.exec(markdown)) !== null) {
        const alt = match[1];
        const fullUrl = match[2];
        const cleanUrl = fullUrl.split('?')[0].split('#')[0];
        
        let imgExt = 'jpg';
        const lastPart = cleanUrl.substring(cleanUrl.lastIndexOf('/') + 1);
        if (lastPart.includes('.')) {
          imgExt = lastPart.split('.').pop().split(/[?#]/)[0];
          if (imgExt.toLowerCase() === 'jpeg') imgExt = 'jpg';
        }

        const imgName = `content-${slug}-${inlineImgIndex}.${imgExt}`;
        const destImgPath = path.join(publicImagesDir, imgName);
        const relativePath = `/images/artikel/${imgName}`;

        console.log(`Mengunduh gambar konten: ${cleanUrl}...`);
        const success = await downloadImage(cleanUrl, destImgPath);
        if (success) {
          finalMarkdown = finalMarkdown.replace(match[0], `![${alt}](${relativePath})`);
          inlineImgIndex++;
        }
      }

      // Format MDX
      const mdxContent = `---
title: "${title.replace(/"/g, '\\"')}"
description: "${descriptionText.replace(/"/g, '\\"')}"
publishDate: "${formattedDate}"
author: "lovelie-light"
tags: ["quora-sync"]
sourceUrl: "${source_url}"
${coverPath ? `cover: "${coverPath}"` : ''}
---

${finalMarkdown}
`;

      fs.writeFileSync(filePath, mdxContent, 'utf8');
      console.log(`[Berhasil] Sinkronisasi artikel: "${title}"`);
      syncCount++;
    }

    console.log(`Sinkronisasi Zyte selesai! Berhasil memperbarui/membuat ${syncCount} berkas MDX.`);
  } catch (err) {
    console.error(`Gagal menyinkronkan dari Zyte Scrapy Cloud:`, err.message);
  }
}

run();
