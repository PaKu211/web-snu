const fs = require('fs');
const path = require('path');

async function fixArticles() {
  const articlesDir = path.join(__dirname, '../src/content/artikel');
  const imagesDir = path.join(__dirname, '../public/images/artikel');
  if (!fs.existsSync(imagesDir)) fs.mkdirSync(imagesDir, { recursive: true });

  const files = fs.readdirSync(articlesDir).filter(f => f.endsWith('.mdx') || f.endsWith('.md'));

  for (const file of files) {
    const filePath = path.join(articlesDir, file);
    let content = fs.readFileSync(filePath, 'utf8');

    // 1. Fix Cover from inline Quora images
    const coverMatch = content.match(/cover:\s*"([^"]+)"/);
    if (!coverMatch) {
      const inlineMatch = content.match(/!\[.*?\]\((https?:\/\/[^)]+)\)/);
      if (inlineMatch) {
        const imgUrl = inlineMatch[1];
        const slug = file.replace(/\.mdx?$/, '').slice(0, 45);
        const imgName = `cover-${slug}.jpg`;
        const destPath = path.join(imagesDir, imgName);

        try {
          console.log(`Mengunduh cover untuk ${file}...`);
          const res = await fetch(imgUrl);
          if (res.ok) {
            const buf = Buffer.from(await res.arrayBuffer());
            fs.writeFileSync(destPath, buf);
            const coverProp = `cover: "../../../public/images/artikel/${imgName}"`;
            
            content = content.replace(/(description:[^\n]+\n)/, `$1${coverProp}\n`);
            console.log(`✓ Berhasil menambahkan cover ke ${file}`);
          }
        } catch (e) {
          console.error(`Gagal download cover ${imgUrl}: ${e.message}`);
        }
      }
    }

    // 2. Fix specific Burning Archetype Part 2
    if (file.includes('burning-archetype')) {
      if (!content.includes('cover:')) {
        content = content.replace(/(description:[^\n]+\n)/, `$1cover: "../../../public/images/artikel/cover-stultus-vivit.jpg"\n`);
      }
      if (!content.match(/publishDate:\s*"202\d-\d\d-\d\d"/)) {
        content = content.replace(/(title:[^\n]+\n)/, `$1publishDate: "2025-10-15"\n`);
      }
    }

    // 3. Fix Haahh Kelas Bahasa Inggris date
    if (file.includes('haahh-kelas-bahasa-inggris')) {
      content = content.replace(/publishDate:\s*"2026-06-20"/, 'publishDate: "2025-06-20"');
    }

    fs.writeFileSync(filePath, content, 'utf8');
  }

  console.log('Perbaikan cover dan tanggal selesai 100%!');
}

fixArticles();
