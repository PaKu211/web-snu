const fs = require('fs');
const path = require('path');

const articlesDir = path.join(__dirname, '../src/content/artikel');

function run() {
  console.log('Memulai pembersihan artikel gagal dari Quora...');
  const files = fs.readdirSync(articlesDir).filter(f => f.endsWith('.mdx') || f.endsWith('.md'));
  let deletedCount = 0;

  for (const file of files) {
    const filePath = path.join(articlesDir, file);
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Check if the content contains the common Quora error/safety check phrases
    if (content.includes('Terjadi kesalahan. Tunggu sebentar dan coba lagi') || 
        content.includes('Coba lagi Lewati ke konten Lewati ke pencarian')) {
      console.log(`[Delete] Menghapus file error: ${file}`);
      fs.unlinkSync(filePath);
      deletedCount++;
    }
  }

  console.log(`Pembersihan selesai! Berhasil menghapus ${deletedCount} file artikel error.`);
}

run();
