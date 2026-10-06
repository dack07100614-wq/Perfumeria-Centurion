// Descarga y auto-hospeda las tipografías (latin + latin-ext). Se ejecuta una sola vez.
const fs = require('fs'), path = require('path'), https = require('https');
const css = fs.readFileSync(process.argv[2], 'utf8');
const blocks = [...css.matchAll(/\/\* (latin|latin-ext) \*\/\s*(@font-face \{[^}]+\})/g)];
const get = (u) => new Promise((res, rej) => https.get(u, (r) => { const c = []; r.on('data', d => c.push(d)); r.on('end', () => res(Buffer.concat(c))); }).on('error', rej));
(async () => {
  let out = '';
  for (const [, subset, face] of blocks) {
    const url = face.match(/url\((https:[^)]+)\)/)[1];
    const fam = face.match(/font-family: '([^']+)'/)[1].replace(/\s+/g, '');
    const style = face.match(/font-style: (\w+)/)[1];
    const weight = face.match(/font-weight: (\d+)/)[1];
    const file = `${fam}-${weight}${style === 'italic' ? 'i' : ''}-${subset}.woff2`;
    fs.writeFileSync(path.join('src/fonts', file), await get(url));
    out += face.replace(url, `/fonts/${file}`).replace('font-display: swap;', 'font-display: swap;') + '\n';
  }
  fs.writeFileSync('src/css/fonts.css', out);
  console.log(blocks.length, 'fuentes');
})();
