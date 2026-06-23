#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const targetFiles = [
  'node_modules/@keystatic/core/dist/keystatic-core-api-generic.worker.js',
  'node_modules/@keystatic/core/dist/keystatic-core-api-generic.js'
];

console.log('Patching Keystatic OAuth handler...');

for (const relPath of targetFiles) {
  const filePath = path.resolve(__dirname, '..', relPath);
  
  if (!fs.existsSync(filePath)) {
    console.warn(`File not found: ${relPath}, skipping.`);
    continue;
  }
  
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    if (content.includes('/* PATCH: Add redirect_uri */')) {
      console.log(`${relPath} already patched, skipping.`);
      continue;
    }
    
    // Find the oauth access_token URL and inject redirect_uri
    const targetString = `const url = new URL('https://github.com/login/oauth/access_token');\n  url.searchParams.set('client_id', config.clientId);\n  url.searchParams.set('client_secret', config.clientSecret);\n  url.searchParams.set('code', code);`;
    const replacementString = `const url = new URL('https://github.com/login/oauth/access_token');\n  /* PATCH: Add redirect_uri */\n  url.searchParams.set('redirect_uri', new URL(req.url).origin + '/api/keystatic/github/oauth/callback');\n  url.searchParams.set('client_id', config.clientId);\n  url.searchParams.set('client_secret', config.clientSecret);\n  url.searchParams.set('code', code);`;
    
    if (content.includes(targetString)) {
      content = content.replace(targetString, replacementString);
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Successfully patched: ${relPath}`);
    } else {
      // Try with windows newlines \r\n just in case
      const targetStringWin = targetString.replace(/\n/g, '\r\n');
      const replacementStringWin = replacementString.replace(/\n/g, '\r\n');
      if (content.includes(targetStringWin)) {
        content = content.replace(targetStringWin, replacementStringWin);
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Successfully patched: ${relPath} (Windows style newlines)`);
      } else {
        console.error(`Could not find the target code block in ${relPath}. Spacing or content might have changed.`);
      }
    }
  } catch (err) {
    console.error(`Error patching ${relPath}:`, err);
  }
}
