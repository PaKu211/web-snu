const fs = require('fs');
const path = require('path');

const artifactDir = '/home/smiley/.gemini/antigravity-cli/brain/9aefc72b-4ea5-461c-8511-c6a2b6a6b6eb';
const destDir = path.join(__dirname, '../public/images/artikel');
const articlesDir = path.join(__dirname, '../src/content/artikel');

// Pemetaan berkas MDX ke nama file gambar artifact yang dihasilkan
const coverMapping = [
  {
    mdx: '202535-saat-dosa-turunan-adalah-pintu-menuju-kesadaran-diri.mdx',
    artifactPattern: 'cover_dosa_turunan',
    destName: 'cover-dosa-turunan.jpg'
  },
  {
    mdx: '202538-stultus-vivit-kode-rahasia-menjadi-bahagia.mdx',
    artifactPattern: 'cover_stultus_vivit',
    destName: 'cover-stultus-vivit.jpg'
  },
  {
    mdx: 'ajakan-untuk-transfer-rasa.mdx',
    artifactPattern: 'cover_transfer_rasa',
    destName: 'cover-transfer-rasa.jpg'
  },
  {
    mdx: 'buat-ibu-ibu-yang-kangen-sama-sinar-matahari.mdx',
    artifactPattern: 'cover_rindu_matahari',
    destName: 'cover-rindu-matahari.jpg'
  },
  {
    mdx: 'ini-gara-gara-pagi-pagi-ibund-nulis-hal-berat-jadi-aku-mau-nanya-dan-harus-langs.mdx',
    artifactPattern: 'cover_kopi_pagi',
    destName: 'cover-kopi-pagi.jpg'
  },
  {
    mdx: 'kawans-kami-pamit-dulu-ya.mdx',
    artifactPattern: 'cover_pamit',
    destName: 'cover-pamit.jpg'
  },
  {
    mdx: 'pertanyaan-khusus-untuk.mdx',
    artifactPattern: 'cover_pertanyaan_khusus',
    destName: 'cover-pertanyaan-khusus.jpg'
  },
  {
    mdx: 'plagiat-dalam-tulisan.mdx',
    artifactPattern: 'cover_plagiat',
    destName: 'cover-plagiat.jpg'
  },
  {
    mdx: 'seri-waroeng-podjok-mangkoes-buku-2-misi-dengan-tanda-tanya-chapter-7-pagar-yang.mdx',
    artifactPattern: 'cover_pagar_bambu',
    destName: 'cover-pagar-bambu.jpg'
  },
  {
    mdx: 'snu-file-20-wewangian-klaim-seorang-pengguna-by-cinduul-aseeekkkkkk-diajak-buat.mdx',
    artifactPattern: 'cover_wewangian',
    destName: 'cover-wewangian.jpg'
  },
  {
    mdx: 'tentang-kesadaran-manusia.mdx',
    artifactPattern: 'cover_kesadaran_manusia',
    destName: 'cover-kesadaran-manusia.jpg'
  },
  {
    mdx: 'tentang-sebuah-kebaikan-refleksi-seorang-pendeta-dari-lereng-gunung-ciremai-di-a.mdx',
    artifactPattern: 'cover_kebaikan_pendeta',
    destName: 'cover-kebaikan-pendeta.jpg'
  }
];

function run() {
  console.log('Memulai penyalinan gambar sampul kustom...');

  // Temukan file-file di direktori artifact
  if (!fs.existsSync(artifactDir)) {
    console.error(`Folder artifact tidak ditemukan: ${artifactDir}`);
    process.exit(1);
  }
  const artifactFiles = fs.readdirSync(artifactDir);

  coverMapping.forEach(item => {
    const mdxPath = path.join(articlesDir, item.mdx);
    if (!fs.existsSync(mdxPath)) {
      console.warn(`Berkas MDX tidak ditemukan: ${item.mdx}, dilewati.`);
      return;
    }

    // Cari file di artifact yang mengandung pattern
    const matchedFile = artifactFiles.find(f => f.startsWith(item.artifactPattern) && f.endsWith('.jpg'));
    if (!matchedFile) {
      console.error(`Gagal menemukan gambar artifact untuk pattern: ${item.artifactPattern}`);
      return;
    }

    const srcPath = path.join(artifactDir, matchedFile);
    const destPath = path.join(destDir, item.destName);

    // Salin gambar
    fs.copyFileSync(srcPath, destPath);
    console.log(`[Copy] Salin ${matchedFile} -> public/images/artikel/${item.destName}`);

    // Update frontmatter cover di file MDX
    let content = fs.readFileSync(mdxPath, 'utf8');
    
    // Path cover di frontmatter menggunakan jalur relatif Keystatic
    const coverPathLine = `cover: "../../../public/images/artikel/${item.destName}"`;
    
    if (content.includes('cover:')) {
      // Ganti cover yang ada
      content = content.replace(/cover:\s*"[^"]*"/, coverPathLine);
    } else {
      // Sisipkan di bawah title/description
      content = content.replace(/(---[\s\S]*?description:\s*"[^"]*"\n)/, `$1${coverPathLine}\n`);
    }

    fs.writeFileSync(mdxPath, content, 'utf8');
    console.log(`[Update MDX] Berhasil mengeset cover kustom untuk: ${item.mdx}`);
  });

  // KASUS 13: Promosikan gambar inline pertama menjadi cover
  const inlineMdx = 'seri-waroeng-podjok-mangkoes-buku-2-misi-dengan-tanda-tanya-chapter-7-pagar-1.mdx';
  const inlineMdxPath = path.join(articlesDir, inlineMdx);

  if (fs.existsSync(inlineMdxPath)) {
    let content = fs.readFileSync(inlineMdxPath, 'utf8');
    const inlineImgMatch = content.match(/!\[.*?\]\((.*?)\)/);
    
    if (inlineImgMatch) {
      const imgPath = inlineImgMatch[1]; // misal: "/images/artikel/content-..."
      // Ubah path dari /images/... ke ../../../public/images/... untuk frontmatter Astro
      const relativeCoverPath = `../../../public${imgPath}`;
      const coverPathLine = `cover: "${relativeCoverPath}"`;

      if (content.includes('cover:')) {
        content = content.replace(/cover:\s*"[^"]*"/, coverPathLine);
      } else {
        content = content.replace(/(---[\s\S]*?description:\s*"[^"]*"\n)/, `$1${coverPathLine}\n`);
      }

      fs.writeFileSync(inlineMdxPath, content, 'utf8');
      console.log(`[Update MDX Fallback] Mempromosikan gambar inline ${imgPath} menjadi cover untuk: ${inlineMdx}`);
    }
  }

  console.log('\nPenerapan sampul kustom selesai!');
}

run();
