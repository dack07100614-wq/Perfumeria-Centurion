// Fotos para Mercado Libre: fondo blanco, cuadradas 1200x1200, sin marca de agua. -> mercadolibre/
const sharp = require('sharp'), fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..');
const DIR = ROOT + '/src/img/products', OUT = ROOT + '/mercadolibre';
const data = JSON.parse(fs.readFileSync(ROOT + '/data/products.json', 'utf8')).products;
async function isStudio(file) {
  const flat = await sharp(file).rotate().flatten({ background: '#fff' }).png().toBuffer();
  const { width, height } = await sharp(flat).metadata();
  const t = Math.max(8, Math.round(Math.min(width, height) * 0.02));
  for (const [left, top, w, h] of [[0, 0, width, t], [0, height - t, width, t], [0, 0, t, height], [width - t, 0, t, height]]) {
    const s = await sharp(await sharp(flat).extract({ left, top, width: w, height: h }).png().toBuffer()).stats();
    if (s.channels.slice(0, 3).some((c) => c.mean < 214 || c.stdev > 16)) return false;
  }
  return true;
}
(async () => {
  fs.mkdirSync(OUT + '/perfumes', { recursive: true }); fs.mkdirSync(OUT + '/logo', { recursive: true });
  const ok = [], skipped = [];
  for (const p of data) {
    const f = ['webp', 'jpg', 'png'].map((e) => `${DIR}/${p.id}.${e}`).find(fs.existsSync);
    if (!f || p.published === false) continue;
    if (!(await isStudio(f))) { skipped.push(p.id); continue; }
    const flat = await sharp(f).rotate().flatten({ background: '#fff' }).linear(1.1, 0).toBuffer();
    const trimmed = await sharp(flat).trim({ threshold: 12 }).toBuffer();
    const inner = await sharp(trimmed).resize({ width: 1060, height: 1060, fit: 'inside' }).toBuffer();
    await sharp({ create: { width: 1200, height: 1200, channels: 3, background: '#fff' } }).composite([{ input: inner, gravity: 'centre' }]).jpeg({ quality: 92 }).toFile(`${OUT}/perfumes/${p.id}.jpg`);
    ok.push(p.id);
  }
  const L = ROOT + '/src/img/logo-emblem.png';
  await sharp(L).resize(1000, 1000, { fit: 'contain', background: '#fff' }).flatten({ background: '#fff' }).jpeg({ quality: 95 }).toFile(OUT + '/logo/logo-1000-fondo-blanco.jpg');
  await sharp(L).resize(1000, 1000, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toFile(OUT + '/logo/logo-1000-transparente.png');
  await sharp(L).resize(500, 500, { fit: 'contain', background: '#fff' }).flatten({ background: '#fff' }).jpeg({ quality: 95 }).toFile(OUT + '/logo/logo-500-perfil.jpg');
  fs.writeFileSync(OUT + '/LEEME.txt', `Fotos para Mercado Libre\n- perfumes/: ${ok.length} fotos 1200x1200, fondo blanco, sin marca de agua. El nombre del archivo es el id del perfume.\n- logo/: logo para el perfil de la tienda.\n- Sin foto limpia (tienen escenario de fondo): ${skipped.join(', ') || 'ninguno'}.\n`);
  console.log(ok.length, 'fotos;', skipped.length, 'omitidas:', skipped.join(', '));
})();
