#!/usr/bin/env node
/**
 * Perfumería Centurión — generador del sitio estático.
 *
 *   node build.js        →  genera la carpeta /public lista para publicar
 *
 * Fuente de datos:  data/products.json  y  data/config.json
 * Plantillas:       lib/*.js
 * Estilos / JS:     src/css, src/js, src/img, src/fonts
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = __dirname;
const SRC = path.join(ROOT, 'src');
const OUT = path.join(ROOT, 'public');

const config = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/config.json'), 'utf8'));
const raw = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/products.json'), 'utf8'));

const { normalizeProducts } = require('./lib/model');
const { pages } = require('./lib/pages');

let sharp = null;
try { sharp = require('sharp'); } catch (_) { console.warn('⚠ sharp no está instalado: las imágenes se copian sin optimizar.'); }

const write = (rel, content) => {
  const file = path.join(OUT, rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content);
};
const copyDir = (from, to) => {
  if (!fs.existsSync(from)) return;
  fs.mkdirSync(to, { recursive: true });
  for (const e of fs.readdirSync(from, { withFileTypes: true })) {
    const a = path.join(from, e.name), b = path.join(to, e.name);
    e.isDirectory() ? copyDir(a, b) : fs.copyFileSync(a, b);
  }
};

async function processImages() {
  const dirIn = path.join(SRC, 'img/products');
  const dirOut = path.join(OUT, 'img/products');
  fs.mkdirSync(dirOut, { recursive: true });
  const files = fs.existsSync(dirIn) ? fs.readdirSync(dirIn).filter((f) => /\.(webp|jpe?g|png)$/i.test(f)) : [];
  for (const f of files) {
    const base = f.replace(/\.[^.]+$/, '');
    const inFile = path.join(dirIn, f);
    const big = path.join(dirOut, `${base}.webp`);
    const small = path.join(dirOut, `${base}-sm.webp`);
    const stale = (out) => !fs.existsSync(out) || fs.statSync(out).mtimeMs < fs.statSync(inFile).mtimeMs;
    if (sharp) {
      if (stale(big)) await sharp(inFile).rotate().resize({ width: 1200, height: 1200, fit: 'inside', withoutEnlargement: true }).webp({ quality: 84, effort: 5 }).toFile(big);
      if (stale(small)) await sharp(inFile).rotate().resize({ width: 560, height: 560, fit: 'inside', withoutEnlargement: true }).webp({ quality: 78, effort: 5 }).toFile(small);
    } else {
      fs.copyFileSync(inFile, big);
      fs.copyFileSync(inFile, small);
    }
  }
  // Imágenes sueltas (hero, logo, íconos…)
  const dirRoot = path.join(SRC, 'img');
  for (const f of fs.readdirSync(dirRoot)) {
    const p = path.join(dirRoot, f);
    if (fs.statSync(p).isFile()) fs.copyFileSync(p, (fs.mkdirSync(path.join(OUT, 'img'), { recursive: true }), path.join(OUT, 'img', f)));
  }
}

function hashOf(files) {
  const h = crypto.createHash('md5');
  files.forEach((f) => h.update(fs.readFileSync(path.join(SRC, f))));
  return h.digest('hex').slice(0, 8);
}

(async () => {
  fs.rmSync(OUT, { recursive: true, force: true });
  fs.mkdirSync(OUT, { recursive: true });

  const products = normalizeProducts(raw.products, config);
  await processImages();
  copyDir(path.join(SRC, 'fonts'), path.join(OUT, 'fonts'));
  copyDir(path.join(ROOT, 'static'), OUT); // admin, _headers, robots, etc.

  // CSS / JS con hash para cache largo
  const css = ['css/fonts.css', 'css/styles.css'].map((f) => fs.readFileSync(path.join(SRC, f), 'utf8')).join('\n');
  write('css/styles.css', css);
  copyDir(path.join(SRC, 'js'), path.join(OUT, 'js'));
  const ver = hashOf(['css/fonts.css', 'css/styles.css', 'js/app.js', 'js/checkout.js', 'js/boot.js']);

  const ctx = { config, products, ver, publicConfig: null };
  const out = pages(ctx);
  for (const [rel, html] of Object.entries(out)) write(rel, html);

  const n = products.length;
  const pending = products.filter((p) => p.photoPending).length;
  console.log(`✔ Sitio generado en /public — ${n} perfumes (${pending} sin foto), ${Object.keys(out).length} archivos HTML/XML.`);
})().catch((e) => { console.error(e); process.exit(1); });
