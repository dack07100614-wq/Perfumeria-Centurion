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

const { normalizeProducts, setSkipGallery } = require('./lib/model');
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

// Un fondo propio de la marca para todas las fotos de producto (config.catalog.brandedBackground).
// Se aplica con "multiply" sobre fotos de estudio de fondo claro, así se conservan las sombras y los reflejos.
async function isStudioPhoto(file) {
  if (!sharp) return false;
  const { width, height } = await sharp(file).metadata();
  const t = Math.max(8, Math.round(Math.min(width, height) * 0.02));
  const strips = [[0, 0, width, t], [0, height - t, width, t], [0, 0, t, height], [width - t, 0, t, height]];
  for (const [left, top, w, h] of strips) {
    const strip = await sharp(file).extract({ left, top, width: w, height: h }).removeAlpha().png().toBuffer();
    const st = await sharp(strip).stats();
    if (st.channels.some((c) => c.mean < 214 || c.stdev > 16)) return false;
  }
  return true;
}

async function processImages(branded) {
  const dirIn = path.join(SRC, 'img/products');
  const dirOut = path.join(OUT, 'img/products');
  fs.mkdirSync(dirOut, { recursive: true });
  const nonStudio = new Set();
  const files = fs.existsSync(dirIn) ? fs.readdirSync(dirIn).filter((f) => /\.(webp|jpe?g|png)$/i.test(f)) : [];
  const backdropFile = path.join(SRC, 'img/backdrop.svg');
  const backdropTime = fs.existsSync(backdropFile) ? fs.statSync(backdropFile).mtimeMs : 0;
  const buildTime = fs.statSync(__filename).mtimeMs;
  const cacheDir = path.join(ROOT, 'node_modules', '.cache-centurion');
  fs.mkdirSync(cacheDir, { recursive: true });
  for (const f of files) {
    const base = f.replace(/\.[^.]+$/, '');
    const inFile = path.join(dirIn, f);
    const big = path.join(dirOut, `${base}.webp`);
    const small = path.join(dirOut, `${base}-sm.webp`);
    const studio = branded && sharp ? await isStudioPhoto(inFile) : false;
    if (!studio) nonStudio.add(base);
    const cached = path.join(cacheDir, `${base}.${branded ? 'b' : 'p'}.webp`);
    const newest = Math.max(fs.statSync(inFile).mtimeMs, branded ? backdropTime : 0, buildTime);
    if (sharp) {
      if (!fs.existsSync(cached) || fs.statSync(cached).mtimeMs < newest) {
        let img = sharp(inFile).rotate().resize({ width: 1800, height: 1800, fit: 'inside', withoutEnlargement: true });
        if (studio) {
          // Las fotos de estudio se llevan a formato cuadrado (fondo blanco) antes de aplicar el fondo de la marca.
          const meta = await sharp(inFile).rotate().metadata();
          const side = Math.min(1800, Math.max(meta.width, meta.height));
          img = sharp(inFile).rotate().resize({ width: side, height: side, fit: 'contain', background: '#ffffff' });
          const { data, info } = await img.toBuffer({ resolveWithObject: true });
          const bg = await sharp(backdropFile).resize(info.width, info.height, { fit: 'cover' }).png().toBuffer();
          await sharp(bg).composite([{ input: data, blend: 'multiply' }]).webp({ quality: 90, effort: 5 }).toFile(cached);
        } else {
          await img.webp({ quality: 90, effort: 5 }).toFile(cached);
        }
      }
      fs.copyFileSync(cached, big);
      await sharp(cached).resize({ width: 560, height: 560, fit: 'inside', withoutEnlargement: true }).webp({ quality: 80, effort: 5 }).toFile(small);
    } else {
      fs.copyFileSync(inFile, big);
      fs.copyFileSync(inFile, small);
    }
  }
  // Imágenes sueltas (hero, logo, íconos…)
  const dirRoot = path.join(SRC, 'img');
  for (const f of fs.readdirSync(dirRoot)) {
    const p = path.join(dirRoot, f);
    if (fs.statSync(p).isFile() && f !== 'backdrop.svg') fs.copyFileSync(p, (fs.mkdirSync(path.join(OUT, 'img'), { recursive: true }), path.join(OUT, 'img', f)));
  }
  return nonStudio;
}

function hashOf(files) {
  const h = crypto.createHash('md5');
  files.forEach((f) => h.update(fs.readFileSync(path.join(SRC, f))));
  return h.digest('hex').slice(0, 8);
}

(async () => {
  fs.rmSync(OUT, { recursive: true, force: true });
  fs.mkdirSync(OUT, { recursive: true });

  const branded = !(config.catalog && config.catalog.brandedBackground === false);
  const nonStudio = await processImages(branded);
  setSkipGallery(branded ? nonStudio : new Set());
  const products = normalizeProducts(raw.products, config);
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
