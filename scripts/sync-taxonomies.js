import fs from 'fs';
import path from 'path';

const artikelDir = './src/content/artikel';
const tagsDir = './src/content/tags';
const seriDir = './src/content/seri';

// Ensure directories exist
if (!fs.existsSync(tagsDir)) fs.mkdirSync(tagsDir, { recursive: true });
if (!fs.existsSync(seriDir)) fs.mkdirSync(seriDir, { recursive: true });

// Predefined taxonomies metadata matching src/config.ts
const PREDEFINED_TAGS = {
  "wpm-saga": {
    label: "WPM [SAGA]",
    description: "Kisah-kisah fiksi fantasi gaib dan mistis.",
    colorClass: "niskala"
  },
  "spiritual": {
    label: "Spiritual",
    description: "Renungan, pemikiran, dan laku kesadaran batin.",
    colorClass: "neutral"
  },
  "misteri": {
    label: "Misteri",
    description: "Penelusuran kisah supernatural dan dunia tak kasat mata.",
    colorClass: "neutral"
  },
  "snu": {
    label: "SNU",
    description: "Catatan dan rumor dari semesta Sekala Niskala Universe.",
    colorClass: "neutral"
  },
  "quora-sync": {
    label: "Quora Sync",
    description: "Artikel yang disinkronkan otomatis dari Quora Space.",
    colorClass: "neutral"
  }
};

const PREDEFINED_SERI = {
  "wpm-saga": {
    label: "WPM [SAGA]",
    description: "Kisah fiksi fantasi mistis tentang Sakti, Bayu, dan perjalanan dimensi transisi."
  }
};

// Map tag names to friendly display labels
function capitalize(str) {
  return str.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

const uniqueTags = new Set();
const uniqueSeri = new Set();

// Read all articles
if (fs.existsSync(artikelDir)) {
  const files = fs.readdirSync(artikelDir);
  for (const file of files) {
    if (!file.endsWith('.md') && !file.endsWith('.mdx')) continue;
    const filePath = path.join(artikelDir, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    
    // Extract frontmatter
    const match = content.match(/^---\r?\n([\s\S]+?)\r?\n---/);
    if (!match) continue;
    
    const frontmatterText = match[1];
    const tagLines = frontmatterText.split('\n');
    let inTagsBlock = false;
    
    for (const line of tagLines) {
      const trimmed = line.trim();
      
      // Parse tags block
      if (trimmed.startsWith('tags:')) {
        const inlineMatch = trimmed.match(/tags:\s*\[([\s\S]*?)\]/);
        if (inlineMatch) {
          inlineMatch[1].split(',').forEach(t => {
            const clean = t.replace(/['"\[\]]/g, '').trim();
            if (clean) uniqueTags.add(clean);
          });
        } else {
          inTagsBlock = true;
        }
        continue;
      }
      
      if (inTagsBlock) {
        if (trimmed.startsWith('-')) {
          const clean = trimmed.substring(1).replace(/['"]/g, '').trim();
          if (clean) uniqueTags.add(clean);
        } else if (trimmed.includes(':') || trimmed === '') {
          inTagsBlock = false;
        }
      }
      
      // Parse seri field
      if (trimmed.startsWith('seri:')) {
        const clean = trimmed.split(':')[1].replace(/['"]/g, '').trim();
        if (clean) uniqueSeri.add(clean);
      }
    }
  }
}

console.log('Found tags:', Array.from(uniqueTags));
console.log('Found series:', Array.from(uniqueSeri));

// Write tag JSON files
for (const tag of uniqueTags) {
  const fileName = `${tag}.json`;
  const filePath = path.join(tagsDir, fileName);
  
  if (fs.existsSync(filePath)) {
    console.log(`Tag file already exists: ${fileName}`);
    continue;
  }
  
  const meta = PREDEFINED_TAGS[tag] || {
    label: capitalize(tag),
    description: `Artikel bertema ${capitalize(tag)}`,
    colorClass: "neutral"
  };
  
  const tagData = {
    name: tag,
    label: meta.label,
    description: meta.description,
    colorClass: meta.colorClass || "neutral"
  };
  
  fs.writeFileSync(filePath, JSON.stringify(tagData, null, 2), 'utf-8');
  console.log(`Created tag file: ${fileName}`);
}

// Write seri JSON files
for (const seri of uniqueSeri) {
  const fileName = `${seri}.json`;
  const filePath = path.join(seriDir, fileName);
  
  if (fs.existsSync(filePath)) {
    console.log(`Seri file already exists: ${fileName}`);
    continue;
  }
  
  const meta = PREDEFINED_SERI[seri] || {
    label: capitalize(seri),
    description: `Seri tulisan ${capitalize(seri)}`
  };
  
  const seriData = {
    name: seri,
    label: meta.label,
    description: meta.description
  };
  
  fs.writeFileSync(filePath, JSON.stringify(seriData, null, 2), 'utf-8');
  console.log(`Created seri file: ${fileName}`);
}

console.log('Taxonomy synchronization completed successfully!');
